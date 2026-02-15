"""Client enrichment + pipeline — CRM service for managing clients.

Uses SQLAlchemy async queries against the ``Client`` model.  When
``settings.DEMO_MODE`` is ``True`` the service returns realistic mock
data so the CRM pages work without a live database.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy import func, or_, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import Client
from app.models.schemas import ClientCreate, ClientUpdate

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pipeline stage definitions
# ---------------------------------------------------------------------------

PIPELINE_STAGES: list[str] = [
    "lead",
    "contacted",
    "proposal",
    "negotiation",
    "won",
    "lost",
]


# ---------------------------------------------------------------------------
# Demo / mock data
# ---------------------------------------------------------------------------

_DEMO_USER_ID = "demo-user-001"


def _demo_clients() -> list[dict[str, Any]]:
    """Return fresh demo clients with timestamps relative to today."""
    now = datetime.now(timezone.utc)
    return [
        {
            "id": "demo-client-001",
            "user_id": _DEMO_USER_ID,
            "company_name": "TechCorp",
            "contact_name": "Sarah Chen",
            "email": "sarah.chen@techcorp.io",
            "phone": "+49 170 1234567",
            "website": "https://techcorp.io",
            "industry": "Technology",
            "location": "Berlin, Germany",
            "pipeline_stage": "won",
            "deal_value": 12000.00,
            "notes": "Long-term client. Website redesign project (Phase 1 complete, Phase 2 in progress).",
            "enrichment_data": {
                "employees": "50-200",
                "founded": 2018,
                "linkedin": "https://linkedin.com/company/techcorp",
            },
            "last_contacted": (now - timedelta(days=2)).isoformat(),
            "created_at": (now - timedelta(days=120)).isoformat(),
            "updated_at": (now - timedelta(days=2)).isoformat(),
        },
        {
            "id": "demo-client-002",
            "user_id": _DEMO_USER_ID,
            "company_name": "Greenfield Solutions",
            "contact_name": "Mark Johnson",
            "email": "mark.johnson@greenfield.com",
            "phone": "+49 170 2345678",
            "website": "https://greenfield.com",
            "industry": "Consulting",
            "location": "Munich, Germany",
            "pipeline_stage": "won",
            "deal_value": 2400.00,
            "notes": "Monthly retainer client. Very responsive.",
            "enrichment_data": {
                "employees": "10-50",
                "founded": 2015,
                "linkedin": "https://linkedin.com/company/greenfield",
            },
            "last_contacted": (now - timedelta(days=1)).isoformat(),
            "created_at": (now - timedelta(days=90)).isoformat(),
            "updated_at": (now - timedelta(days=1)).isoformat(),
        },
        {
            "id": "demo-client-003",
            "user_id": _DEMO_USER_ID,
            "company_name": "DesignHaus",
            "contact_name": "Anna Schmidt",
            "email": "anna.schmidt@designhaus.de",
            "phone": "+49 170 3456789",
            "website": "https://designhaus.de",
            "industry": "Design",
            "location": "Hamburg, Germany",
            "pipeline_stage": "proposal",
            "deal_value": 15000.00,
            "notes": "Website redesign proposal requested. Budget ~EUR 15k, launch by end of March.",
            "enrichment_data": {
                "employees": "10-50",
                "founded": 2020,
                "linkedin": "https://linkedin.com/company/designhaus",
            },
            "last_contacted": (now - timedelta(hours=12)).isoformat(),
            "created_at": (now - timedelta(days=14)).isoformat(),
            "updated_at": (now - timedelta(hours=12)).isoformat(),
        },
        {
            "id": "demo-client-004",
            "user_id": _DEMO_USER_ID,
            "company_name": "NovaTech",
            "contact_name": "Felix Braun",
            "email": "felix.braun@novatech.io",
            "phone": "+49 170 4567890",
            "website": "https://novatech.io",
            "industry": "SaaS",
            "location": "Frankfurt, Germany",
            "pipeline_stage": "contacted",
            "deal_value": 8000.00,
            "notes": "Interested in consulting package. Follow up next week.",
            "enrichment_data": None,
            "last_contacted": (now - timedelta(days=5)).isoformat(),
            "created_at": (now - timedelta(days=10)).isoformat(),
            "updated_at": (now - timedelta(days=5)).isoformat(),
        },
        {
            "id": "demo-client-005",
            "user_id": _DEMO_USER_ID,
            "company_name": "Alpine Media",
            "contact_name": "Lena Huber",
            "email": "lena.huber@alpinemedia.at",
            "phone": "+43 660 1234567",
            "website": "https://alpinemedia.at",
            "industry": "Media",
            "location": "Vienna, Austria",
            "pipeline_stage": "lead",
            "deal_value": 5000.00,
            "notes": "Inbound lead from website contact form.",
            "enrichment_data": None,
            "last_contacted": None,
            "created_at": (now - timedelta(days=3)).isoformat(),
            "updated_at": (now - timedelta(days=3)).isoformat(),
        },
        {
            "id": "demo-client-006",
            "user_id": _DEMO_USER_ID,
            "company_name": "BrightPath Education",
            "contact_name": "Thomas Keller",
            "email": "thomas@brightpath.edu",
            "phone": "+49 170 5678901",
            "website": "https://brightpath.edu",
            "industry": "Education",
            "location": "Zurich, Switzerland",
            "pipeline_stage": "lead",
            "deal_value": 10000.00,
            "notes": "Referred by Mark Johnson. Needs LMS platform.",
            "enrichment_data": None,
            "last_contacted": None,
            "created_at": (now - timedelta(days=8)).isoformat(),
            "updated_at": (now - timedelta(days=8)).isoformat(),
        },
        {
            "id": "demo-client-007",
            "user_id": _DEMO_USER_ID,
            "company_name": "QuickShip Logistics",
            "contact_name": "Maria Weber",
            "email": "maria@quickship.de",
            "phone": "+49 170 6789012",
            "website": "https://quickship.de",
            "industry": "Logistics",
            "location": "Cologne, Germany",
            "pipeline_stage": "negotiation",
            "deal_value": 20000.00,
            "notes": "Custom dashboard project. Negotiating scope and timeline.",
            "enrichment_data": {
                "employees": "200-500",
                "founded": 2012,
                "linkedin": "https://linkedin.com/company/quickship",
            },
            "last_contacted": (now - timedelta(days=1)).isoformat(),
            "created_at": (now - timedelta(days=30)).isoformat(),
            "updated_at": (now - timedelta(days=1)).isoformat(),
        },
    ]


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class CRMService:
    """Manages client CRUD, pipeline views, and stale-lead detection.

    Args:
        db: An async SQLAlchemy session.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_client(self, user_id: str, data: ClientCreate) -> Client:
        """Create a new client record.

        Args:
            user_id: The owner user's ID.
            data: Validated client creation payload.

        Returns:
            The persisted ``Client`` ORM instance.
        """
        if settings.DEMO_MODE:
            logger.info("DEMO: create_client for user %s", user_id)
            now = datetime.now(timezone.utc)
            demo: dict[str, Any] = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "company_name": data.company_name,
                "contact_name": data.contact_name,
                "email": data.email,
                "phone": data.phone,
                "website": data.website,
                "industry": data.industry,
                "location": data.location,
                "pipeline_stage": data.pipeline_stage,
                "deal_value": data.deal_value,
                "notes": data.notes,
                "enrichment_data": None,
                "last_contacted": None,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
            }
            return demo  # type: ignore[return-value]

        client = Client(
            user_id=user_id,
            company_name=data.company_name,
            contact_name=data.contact_name,
            email=data.email,
            phone=data.phone,
            website=data.website,
            industry=data.industry,
            location=data.location,
            pipeline_stage=data.pipeline_stage,
            deal_value=data.deal_value,
            notes=data.notes,
        )
        self.db.add(client)
        await self.db.flush()
        await self.db.refresh(client)
        return client

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_clients(
        self,
        user_id: str,
        stage: Optional[str] = None,
        search: Optional[str] = None,
    ) -> list[Client]:
        """List clients for a user with optional filters.

        Args:
            user_id: Owner user ID (multi-tenant filter).
            stage: Optional pipeline stage filter.
            search: Optional free-text search across company name,
                contact name, and email.

        Returns:
            A list of ``Client`` rows ordered by most-recently updated.
        """
        if settings.DEMO_MODE:
            clients = _demo_clients()
            if stage:
                clients = [c for c in clients if c["pipeline_stage"] == stage]
            if search:
                q = search.lower()
                clients = [
                    c
                    for c in clients
                    if q in c["company_name"].lower()
                    or q in (c.get("contact_name") or "").lower()
                    or q in (c.get("email") or "").lower()
                ]
            return clients  # type: ignore[return-value]

        stmt = select(Client).where(Client.user_id == user_id)

        if stage:
            stmt = stmt.where(Client.pipeline_stage == stage)

        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Client.company_name.ilike(pattern),
                    Client.contact_name.ilike(pattern),
                    Client.email.ilike(pattern),
                )
            )

        stmt = stmt.order_by(Client.updated_at.desc())

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_client(self, client_id: str, user_id: str) -> Optional[Client]:
        """Fetch a single client by ID, scoped to a user.

        Args:
            client_id: The client primary key.
            user_id: Owner user ID (multi-tenant check).

        Returns:
            The ``Client`` or ``None`` if not found.
        """
        if settings.DEMO_MODE:
            for c in _demo_clients():
                if c["id"] == client_id:
                    return c  # type: ignore[return-value]
            return None

        stmt = select(Client).where(Client.id == client_id, Client.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update_client(
        self,
        client_id: str,
        user_id: str,
        updates: ClientUpdate,
    ) -> Optional[Client]:
        """Update fields on an existing client.

        Args:
            client_id: The client primary key.
            user_id: Owner user ID (multi-tenant check).
            updates: Validated update payload — only non-``None`` fields
                are applied.

        Returns:
            The updated ``Client`` or ``None`` if not found.
        """
        if settings.DEMO_MODE:
            logger.info("DEMO: update_client(%s)", client_id)
            for c in _demo_clients():
                if c["id"] == client_id:
                    patch = updates.model_dump(exclude_none=True)
                    c.update(patch)
                    c["updated_at"] = datetime.now(timezone.utc).isoformat()
                    return c  # type: ignore[return-value]
            return None

        client = await self.get_client(client_id, user_id)
        if client is None:
            return None

        patch = updates.model_dump(exclude_none=True)
        if not patch:
            return client

        stmt = (
            update(Client)
            .where(Client.id == client_id, Client.user_id == user_id)
            .values(**patch)
        )
        await self.db.execute(stmt)
        await self.db.flush()
        await self.db.refresh(client)
        return client

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_client(self, client_id: str, user_id: str) -> bool:
        """Delete a client by ID.

        Args:
            client_id: The client primary key.
            user_id: Owner user ID (multi-tenant check).

        Returns:
            ``True`` if the row was deleted, ``False`` if not found.
        """
        if settings.DEMO_MODE:
            logger.info("DEMO: delete_client(%s)", client_id)
            return any(c["id"] == client_id for c in _demo_clients())

        stmt = delete(Client).where(Client.id == client_id, Client.user_id == user_id)
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount > 0  # type: ignore[union-attr]

    # ------------------------------------------------------------------
    # Pipeline
    # ------------------------------------------------------------------

    async def get_pipeline(self, user_id: str) -> list[dict[str, Any]]:
        """Return clients grouped by pipeline stage.

        Each entry in the returned list has the shape:

        .. code-block:: python

            {
                "stage": "lead",
                "clients": [...],
                "count": 2,
                "total_value": 15000.0,
            }

        All six pipeline stages are always returned, even if empty.
        """
        if settings.DEMO_MODE:
            clients = _demo_clients()
            pipeline: list[dict[str, Any]] = []
            for stage in PIPELINE_STAGES:
                stage_clients = [c for c in clients if c["pipeline_stage"] == stage]
                total_value = sum(c.get("deal_value") or 0.0 for c in stage_clients)
                pipeline.append({
                    "stage": stage,
                    "clients": stage_clients,
                    "count": len(stage_clients),
                    "total_value": total_value,
                })
            return pipeline

        all_clients = await self.get_clients(user_id)
        grouped: dict[str, list[Client]] = {stage: [] for stage in PIPELINE_STAGES}

        for client in all_clients:
            stage = client.pipeline_stage  # type: ignore[union-attr]
            if stage in grouped:
                grouped[stage].append(client)
            else:
                grouped.setdefault(stage, []).append(client)

        pipeline: list[dict[str, Any]] = []
        for stage in PIPELINE_STAGES:
            stage_clients = grouped.get(stage, [])
            total_value = sum(
                (c.deal_value or 0.0) for c in stage_clients  # type: ignore[union-attr]
            )
            pipeline.append({
                "stage": stage,
                "clients": stage_clients,
                "count": len(stage_clients),
                "total_value": total_value,
            })
        return pipeline

    async def update_pipeline_stage(
        self,
        client_id: str,
        user_id: str,
        new_stage: str,
    ) -> Optional[Client]:
        """Move a client to a new pipeline stage.

        Args:
            client_id: The client primary key.
            user_id: Owner user ID.
            new_stage: The target pipeline stage.

        Returns:
            The updated ``Client`` or ``None`` if not found.

        Raises:
            ValueError: If ``new_stage`` is not a recognised stage.
        """
        if new_stage not in PIPELINE_STAGES:
            raise ValueError(
                f"Invalid pipeline stage '{new_stage}'. "
                f"Must be one of: {', '.join(PIPELINE_STAGES)}"
            )

        if settings.DEMO_MODE:
            logger.info("DEMO: update_pipeline_stage(%s -> %s)", client_id, new_stage)
            for c in _demo_clients():
                if c["id"] == client_id:
                    c["pipeline_stage"] = new_stage
                    c["updated_at"] = datetime.now(timezone.utc).isoformat()
                    return c  # type: ignore[return-value]
            return None

        client = await self.get_client(client_id, user_id)
        if client is None:
            return None

        stmt = (
            update(Client)
            .where(Client.id == client_id, Client.user_id == user_id)
            .values(pipeline_stage=new_stage)
        )
        await self.db.execute(stmt)
        await self.db.flush()
        await self.db.refresh(client)
        return client

    # ------------------------------------------------------------------
    # Stale leads
    # ------------------------------------------------------------------

    async def get_stale_leads(self, user_id: str, days: int = 7) -> list[Client]:
        """Find leads and contacts that haven't been touched recently.

        A client is considered "stale" when:
        - Their pipeline stage is ``lead`` or ``contacted``, AND
        - Their ``last_contacted`` date is older than ``days`` ago, or is NULL.

        Args:
            user_id: Owner user ID.
            days: Number of days of inactivity before a lead is stale.

        Returns:
            A list of stale ``Client`` rows.
        """
        if settings.DEMO_MODE:
            cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
            return [
                c
                for c in _demo_clients()
                if c["pipeline_stage"] in ("lead", "contacted")
                and (c.get("last_contacted") is None or c["last_contacted"] < cutoff)
            ]  # type: ignore[misc]

        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = (
            select(Client)
            .where(
                Client.user_id == user_id,
                Client.pipeline_stage.in_(["lead", "contacted"]),
                or_(
                    Client.last_contacted.is_(None),
                    Client.last_contacted < cutoff,
                ),
            )
            .order_by(Client.last_contacted.asc().nullsfirst())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

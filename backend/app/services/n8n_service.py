"""n8n workflow engine wrapper — manage and trigger automation workflows.

Communicates with a self-hosted n8n instance via its REST API in production.
Returns realistic demo data when DEMO_MODE is enabled or the n8n API key is
not configured.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def _is_available() -> bool:
    """Check whether the n8n integration is usable."""
    return (
        not settings.DEMO_MODE
        and settings.ENABLE_N8N_AUTOMATIONS
        and bool(settings.N8N_API_KEY)
    )


def _headers() -> dict:
    """Return auth headers for the n8n API."""
    return {"X-N8N-API-KEY": settings.N8N_API_KEY or ""}


# ---------------------------------------------------------------------------
# Demo workflow templates
# ---------------------------------------------------------------------------

DEMO_WORKFLOWS = [
    {
        "id": "wf_new_lead",
        "name": "New Lead Onboarding",
        "description": (
            "Automatically creates a Google Drive folder, sends a welcome email, "
            "and adds the lead to the CRM pipeline when a new lead is detected."
        ),
        "trigger_type": "event",
        "is_active": True,
        "last_run": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(),
        "run_count": 27,
        "tags": ["crm", "onboarding"],
    },
    {
        "id": "wf_invoice_reminder",
        "name": "Invoice Payment Reminder",
        "description": (
            "Sends escalating payment reminders at 3, 7, and 14 days overdue. "
            "Escalates to Slack alert after 14 days."
        ),
        "trigger_type": "scheduled",
        "is_active": True,
        "last_run": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
        "run_count": 84,
        "tags": ["invoices", "reminders"],
    },
    {
        "id": "wf_meeting_prep",
        "name": "Meeting Prep Generator",
        "description": (
            "30 minutes before each meeting, generates an AI prep brief "
            "with client history, recent emails, and talking points."
        ),
        "trigger_type": "scheduled",
        "is_active": True,
        "last_run": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
        "run_count": 156,
        "tags": ["calendar", "ai"],
    },
    {
        "id": "wf_weekly_report",
        "name": "Weekly Business Report",
        "description": (
            "Every Friday at 5 PM, generates a comprehensive weekly report "
            "covering revenue, pipeline, email stats, and AI recommendations."
        ),
        "trigger_type": "scheduled",
        "is_active": False,
        "last_run": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
        "run_count": 12,
        "tags": ["reports", "analytics"],
    },
    {
        "id": "wf_client_onboarding",
        "name": "Client Onboarding Flow",
        "description": (
            "When a deal moves to 'won', creates Drive folders, sends a "
            "welcome pack, schedules a kick-off meeting, and notifies the team."
        ),
        "trigger_type": "event",
        "is_active": True,
        "last_run": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
        "run_count": 9,
        "tags": ["crm", "onboarding"],
    },
    {
        "id": "wf_slack_notifications",
        "name": "Slack Alert Dispatcher",
        "description": (
            "Routes LytheraHub alerts to the appropriate Slack channels "
            "based on severity and type."
        ),
        "trigger_type": "event",
        "is_active": True,
        "last_run": (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat(),
        "run_count": 342,
        "tags": ["slack", "alerts"],
    },
]


DEMO_EXECUTION_HISTORY: list[dict] = [
    {
        "id": "exec_001",
        "workflow_id": "wf_invoice_reminder",
        "status": "success",
        "started_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
        "finished_at": (datetime.now(timezone.utc) - timedelta(hours=12) + timedelta(seconds=4)).isoformat(),
        "data": {"reminders_sent": 3, "escalations": 1},
    },
    {
        "id": "exec_002",
        "workflow_id": "wf_meeting_prep",
        "status": "success",
        "started_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
        "finished_at": (datetime.now(timezone.utc) - timedelta(hours=1) + timedelta(seconds=8)).isoformat(),
        "data": {"briefs_generated": 2},
    },
    {
        "id": "exec_003",
        "workflow_id": "wf_new_lead",
        "status": "success",
        "started_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(),
        "finished_at": (datetime.now(timezone.utc) - timedelta(hours=3) + timedelta(seconds=6)).isoformat(),
        "data": {"leads_processed": 1, "folders_created": 1},
    },
    {
        "id": "exec_004",
        "workflow_id": "wf_slack_notifications",
        "status": "error",
        "started_at": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat(),
        "finished_at": (datetime.now(timezone.utc) - timedelta(hours=6) + timedelta(seconds=2)).isoformat(),
        "data": {"error": "Slack channel not found: #archived-channel"},
    },
]


# ---------------------------------------------------------------------------
# Workflow CRUD
# ---------------------------------------------------------------------------


async def list_workflows() -> list[dict]:
    """Return all workflows available in the n8n instance."""
    if _is_available():
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.N8N_BASE_URL}/api/v1/workflows",
                    headers=_headers(),
                    timeout=10,
                )
                resp.raise_for_status()
                data = resp.json()
                return [
                    {
                        "id": wf["id"],
                        "name": wf.get("name", "Untitled"),
                        "description": wf.get("tags", [{}])[0].get("name", "") if wf.get("tags") else "",
                        "is_active": wf.get("active", False),
                        "created_at": wf.get("createdAt"),
                        "updated_at": wf.get("updatedAt"),
                    }
                    for wf in data.get("data", [])
                ]
        except Exception as e:
            logger.error(f"n8n list_workflows error: {e}")

    # Demo fallback
    return DEMO_WORKFLOWS


async def get_workflow(workflow_id: str) -> Optional[dict]:
    """Retrieve a single workflow by ID."""
    if _is_available():
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.N8N_BASE_URL}/api/v1/workflows/{workflow_id}",
                    headers=_headers(),
                    timeout=10,
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"n8n get_workflow error: {e}")

    # Demo fallback
    for wf in DEMO_WORKFLOWS:
        if wf["id"] == workflow_id:
            return wf
    return None


async def activate_workflow(workflow_id: str) -> dict:
    """Activate (turn on) an n8n workflow."""
    if _is_available():
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.patch(
                    f"{settings.N8N_BASE_URL}/api/v1/workflows/{workflow_id}",
                    headers=_headers(),
                    json={"active": True},
                    timeout=10,
                )
                resp.raise_for_status()
                return {"id": workflow_id, "is_active": True, "message": "Workflow activated."}
        except Exception as e:
            logger.error(f"n8n activate_workflow error: {e}")

    # Demo fallback
    return {"id": workflow_id, "is_active": True, "message": "Workflow activated (demo)."}


async def deactivate_workflow(workflow_id: str) -> dict:
    """Deactivate (turn off) an n8n workflow."""
    if _is_available():
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.patch(
                    f"{settings.N8N_BASE_URL}/api/v1/workflows/{workflow_id}",
                    headers=_headers(),
                    json={"active": False},
                    timeout=10,
                )
                resp.raise_for_status()
                return {"id": workflow_id, "is_active": False, "message": "Workflow deactivated."}
        except Exception as e:
            logger.error(f"n8n deactivate_workflow error: {e}")

    # Demo fallback
    return {"id": workflow_id, "is_active": False, "message": "Workflow deactivated (demo)."}


# ---------------------------------------------------------------------------
# Execution
# ---------------------------------------------------------------------------


async def run_workflow(workflow_id: str, input_data: Optional[dict] = None) -> dict:
    """Manually trigger a workflow execution.

    Args:
        workflow_id: The workflow to execute.
        input_data: Optional JSON payload passed to the workflow.

    Returns:
        dict with execution status and metadata.
    """
    if _is_available():
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{settings.N8N_BASE_URL}/api/v1/workflows/{workflow_id}/run",
                    headers=_headers(),
                    json=input_data or {},
                    timeout=30,
                )
                resp.raise_for_status()
                result = resp.json()
                return {
                    "execution_id": result.get("data", {}).get("executionId"),
                    "status": "running",
                    "workflow_id": workflow_id,
                    "message": "Workflow execution started.",
                }
        except Exception as e:
            logger.error(f"n8n run_workflow error: {e}")

    # Demo fallback
    return {
        "execution_id": f"exec_demo_{workflow_id}",
        "status": "success",
        "workflow_id": workflow_id,
        "message": "Workflow executed successfully (demo).",
        "data": {"items_processed": 1},
    }


async def get_execution_history(
    workflow_id: str, limit: int = 20
) -> list[dict]:
    """Fetch execution history for a workflow."""
    if _is_available():
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.N8N_BASE_URL}/api/v1/executions",
                    headers=_headers(),
                    params={"workflowId": workflow_id, "limit": limit},
                    timeout=10,
                )
                resp.raise_for_status()
                data = resp.json()
                return [
                    {
                        "id": ex.get("id"),
                        "workflow_id": workflow_id,
                        "status": "success" if ex.get("finished") else "error",
                        "started_at": ex.get("startedAt"),
                        "finished_at": ex.get("stoppedAt"),
                    }
                    for ex in data.get("data", [])
                ]
        except Exception as e:
            logger.error(f"n8n get_execution_history error: {e}")

    # Demo fallback
    return [
        ex for ex in DEMO_EXECUTION_HISTORY if ex["workflow_id"] == workflow_id
    ]


# ---------------------------------------------------------------------------
# Workflow import from JSON templates
# ---------------------------------------------------------------------------


async def import_workflow(workflow_json: dict) -> dict:
    """Import a workflow JSON template into the n8n instance."""
    if _is_available():
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{settings.N8N_BASE_URL}/api/v1/workflows",
                    headers=_headers(),
                    json=workflow_json,
                    timeout=15,
                )
                resp.raise_for_status()
                result = resp.json()
                return {
                    "id": result.get("id"),
                    "name": result.get("name"),
                    "message": "Workflow imported successfully.",
                }
        except Exception as e:
            logger.error(f"n8n import_workflow error: {e}")

    # Demo fallback
    return {
        "id": f"wf_imported_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "name": workflow_json.get("name", "Imported Workflow"),
        "message": "Workflow imported (demo).",
    }

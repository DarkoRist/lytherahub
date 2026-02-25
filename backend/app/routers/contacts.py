"""Contacts router — people within companies."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_workspace
from app.models.database import Activity, Company, Contact, User, Workspace, get_db
from app.models.schemas import ContactCreate, ContactResponse, ContactUpdate

router = APIRouter(prefix="/contacts", tags=["contacts"])


async def _enrich(contact: Contact, db: AsyncSession) -> dict:
    company_name = None
    if contact.company_id:
        row = await db.execute(select(Company.company_name).where(Company.id == contact.company_id))
        company_name = row.scalar_one_or_none()
    data = ContactResponse.model_validate(contact).model_dump()
    data["company_name"] = company_name
    return data


@router.get("", response_model=list[ContactResponse])
async def list_contacts(
    company_id: str | None = Query(None),
    search: str | None = Query(None),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    q = select(Contact).where(Contact.workspace_id == workspace.id)
    if company_id:
        q = q.where(Contact.company_id == company_id)
    if search:
        term = f"%{search}%"
        from sqlalchemy import or_
        q = q.where(
            or_(Contact.first_name.ilike(term), Contact.last_name.ilike(term), Contact.email.ilike(term))
        )
    q = q.order_by(Contact.created_at.desc())
    result = await db.execute(q)
    contacts = result.scalars().all()
    enriched = []
    for c in contacts:
        enriched.append(await _enrich(c, db))
    return enriched


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Contact).where(Contact.id == contact_id, Contact.workspace_id == workspace.id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return await _enrich(contact, db)


@router.post("", response_model=ContactResponse, status_code=201)
async def create_contact(
    body: ContactCreate,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    contact = Contact(workspace_id=workspace.id, **body.model_dump())
    db.add(contact)
    await db.flush()
    activity = Activity(
        workspace_id=workspace.id,
        user_id=user.id,
        entity_type="contact",
        entity_id=contact.id,
        activity_type="note",
        title=f"Contact created: {contact.first_name} {contact.last_name or ''}".strip(),
    )
    db.add(activity)
    return await _enrich(contact, db)


@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    body: ContactUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Contact).where(Contact.id == contact_id, Contact.workspace_id == workspace.id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    return await _enrich(contact, db)


@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Contact).where(Contact.id == contact_id, Contact.workspace_id == workspace.id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await db.delete(contact)

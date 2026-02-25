"""Attachments router — file upload/download per entity."""

import logging
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_workspace
from app.models.database import Attachment, User, Workspace, get_db
from app.models.schemas import AttachmentResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/attachments", tags=["attachments"])

UPLOAD_DIR = Path("/tmp/lythera_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

VALID_ENTITY_TYPES = {"company", "sales_order", "purchase_order", "product"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post("", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    file: UploadFile = File(...),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if entity_type not in VALID_ENTITY_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid entity_type. Must be one of: {', '.join(VALID_ENTITY_TYPES)}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")

    ext = Path(file.filename or "file").suffix
    stored_name = f"{uuid.uuid4()}{ext}"
    dest = UPLOAD_DIR / stored_name
    dest.write_bytes(content)

    attachment = Attachment(
        workspace_id=workspace.id,
        entity_type=entity_type,
        entity_id=entity_id,
        filename=file.filename or stored_name,
        file_url=f"/api/attachments/files/{stored_name}",
        file_size=len(content),
        mime_type=file.content_type,
        uploaded_by=user.id,
    )
    db.add(attachment)
    await db.flush()
    return attachment


@router.get("", response_model=list[AttachmentResponse])
async def list_attachments(
    entity_type: str,
    entity_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Attachment).where(
            Attachment.workspace_id == workspace.id,
            Attachment.entity_type == entity_type,
            Attachment.entity_id == entity_id,
        ).order_by(Attachment.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    attachment_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Attachment).where(
            Attachment.id == attachment_id,
            Attachment.workspace_id == workspace.id,
        )
    )
    attachment = result.scalar_one_or_none()
    if attachment is None:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Remove file
    stored_name = attachment.file_url.split("/")[-1]
    file_path = UPLOAD_DIR / stored_name
    if file_path.exists():
        file_path.unlink()

    await db.delete(attachment)

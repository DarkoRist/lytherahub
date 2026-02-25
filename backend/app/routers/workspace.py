"""Workspace management — settings, members, invitations."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_workspace
from app.models.database import Membership, User, Workspace, get_db
from app.models.schemas import (
    InviteMemberRequest,
    MemberRoleUpdate,
    MembershipResponse,
    WorkspaceResponse,
    WorkspaceUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/workspace", tags=["workspace"])

VALID_ROLES = {"owner", "admin", "sales", "ops", "viewer"}


@router.get("", response_model=WorkspaceResponse)
async def get_workspace(
    workspace: Workspace = Depends(get_current_workspace),
):
    """Return current workspace info."""
    return workspace


@router.put("", response_model=WorkspaceResponse)
async def update_workspace(
    payload: WorkspaceUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update workspace settings (owner/admin only)."""
    # Check permission
    result = await db.execute(
        select(Membership).where(
            Membership.workspace_id == workspace.id,
            Membership.user_id == user.id,
            Membership.role.in_(["owner", "admin"]),
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(workspace, field, value)

    return workspace


@router.get("/members", response_model=list[MembershipResponse])
async def list_members(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """List all workspace members."""
    result = await db.execute(
        select(Membership).where(Membership.workspace_id == workspace.id)
    )
    return result.scalars().all()


@router.post("/invite", response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
async def invite_member(
    payload: InviteMemberRequest,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invite a user to the workspace by email."""
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")

    # Check inviting user has permission
    result = await db.execute(
        select(Membership).where(
            Membership.workspace_id == workspace.id,
            Membership.user_id == user.id,
            Membership.role.in_(["owner", "admin"]),
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    # Find invited user
    result = await db.execute(select(User).where(User.email == payload.email))
    invited_user = result.scalar_one_or_none()
    if invited_user is None:
        raise HTTPException(status_code=404, detail="No user found with that email address")

    # Check not already a member
    result = await db.execute(
        select(Membership).where(
            Membership.workspace_id == workspace.id,
            Membership.user_id == invited_user.id,
        )
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="User is already a member of this workspace")

    membership = Membership(
        workspace_id=workspace.id,
        user_id=invited_user.id,
        role=payload.role,
        invited_by=user.id,
    )
    db.add(membership)
    await db.flush()
    return membership


@router.put("/members/{member_id}", response_model=MembershipResponse)
async def update_member_role(
    member_id: str,
    payload: MemberRoleUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change a member's role (owner only)."""
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")

    result = await db.execute(
        select(Membership).where(
            Membership.id == member_id,
            Membership.workspace_id == workspace.id,
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status_code=404, detail="Member not found")

    if membership.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot change the owner's role")

    membership.role = payload.role
    return membership


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    member_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from the workspace (owner/admin only)."""
    result = await db.execute(
        select(Membership).where(
            Membership.id == member_id,
            Membership.workspace_id == workspace.id,
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if membership.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the workspace owner")
    if membership.user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    await db.delete(membership)

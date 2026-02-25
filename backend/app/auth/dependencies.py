"""Auth dependencies for FastAPI route protection."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt_handler import verify_token
from app.models.database import Membership, User, Workspace, get_db

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate user from JWT bearer token."""
    payload = verify_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


async def get_current_workspace(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Workspace:
    """Return (or auto-create) the workspace for the current user."""
    result = await db.execute(
        select(Workspace).where(Workspace.owner_id == user.id)
    )
    workspace = result.scalar_one_or_none()

    if workspace is None:
        # Auto-provision workspace on first access
        workspace = Workspace(
            owner_id=user.id,
            name=f"{user.name}'s Workspace",
            slug=user.id[:8],
            default_currency="EUR",
            tax_rate=0.0,
        )
        db.add(workspace)
        # Also create owner membership
        await db.flush()
        membership = Membership(
            workspace_id=workspace.id,
            user_id=user.id,
            role="owner",
        )
        db.add(membership)
        await db.flush()

    return workspace

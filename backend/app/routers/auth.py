"""Auth router — Google OAuth, JWT tokens, demo login."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.google_oauth import (
    exchange_code_for_tokens,
    get_google_auth_url,
    get_google_user_info,
)
from app.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.config import settings
from app.main import limiter
from app.models.database import User, get_db
from app.models.schemas import UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Demo user constants
DEMO_USER_ID = "demo-user-001"
DEMO_USER_EMAIL = "demo@lytherahub.ai"
DEMO_USER_NAME = "Darko (Demo)"


@router.get("/google")
@limiter.limit("20/minute")
async def google_login(request: Request):
    """Redirect to Google OAuth consent screen."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured. Use /api/auth/demo for demo mode.",
        )
    url = get_google_auth_url()
    return RedirectResponse(url=url)


@router.get("/google/callback")
async def google_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback — create/update user, return JWT."""
    tokens = await exchange_code_for_tokens(code)
    user_info = await get_google_user_info(tokens["access_token"])

    email = user_info["email"]
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    google_token_json = json.dumps({
        "access_token": tokens["access_token"],
        "refresh_token": tokens.get("refresh_token"),
        "expires_in": tokens.get("expires_in"),
    })

    if user is None:
        user = User(
            email=email,
            name=user_info.get("name", email),
            picture=user_info.get("picture"),
            google_token=google_token_json,
        )
        db.add(user)
        await db.flush()
    else:
        user.name = user_info.get("name", user.name)
        user.picture = user_info.get("picture", user.picture)
        user.google_token = google_token_json
        await db.flush()

    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(user.id)

    # Redirect to frontend — onboarding for new users, dashboard for returning
    frontend_url = settings.cors_origins[0]
    destination = "/dashboard" if user.onboarding_completed else "/onboarding"
    return RedirectResponse(
        url=f"{frontend_url}{destination}?token={access_token}&refresh={refresh_token}"
    )


@router.post("/refresh")
@limiter.limit("30/minute")
async def refresh_access_token(
    request: Request,
    refresh_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Refresh an expired access token using a valid refresh token."""
    payload = verify_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access = create_access_token(user.id, user.email)
    return {"access_token": new_access, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return user


@router.post("/logout")
async def logout():
    """Logout — client should discard tokens."""
    return {"message": "Logged out successfully"}


@router.get("/demo")
@limiter.limit("20/minute")
async def demo_login(request: Request, db: AsyncSession = Depends(get_db)):
    """Instant demo login — no Google OAuth needed. Seeds demo data on first call."""
    from app.demo_seeder import seed_demo_data

    result = await db.execute(select(User).where(User.id == DEMO_USER_ID))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            id=DEMO_USER_ID,
            email=DEMO_USER_EMAIL,
            name=DEMO_USER_NAME,
            picture=None,
            plan="pro",
            onboarding_completed=True,
        )
        db.add(user)
        await db.flush()

    # Seed demo data (idempotent — skips if already seeded)
    await seed_demo_data(db)

    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }

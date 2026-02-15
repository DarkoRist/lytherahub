"""Shared test fixtures — async test client, test DB, demo data, mock user."""

import asyncio
import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Force test settings BEFORE any app imports
os.environ["DEMO_MODE"] = "false"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key"
os.environ["SECRET_KEY"] = "test-secret-key"

from app.auth.jwt_handler import create_access_token
from app.models.database import Base, User, get_db
from app.main import app

# Test database engine
TEST_DB_URL = "sqlite+aiosqlite:///./test.db"
test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

# Test user constants
TEST_USER_ID = "test-user-001"
TEST_USER_EMAIL = "test@lytherahub.ai"
TEST_USER_NAME = "Test User"


@pytest.fixture(scope="session")
def event_loop():
    """Use a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Create all tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a clean database session for each test."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create and return a test user in the database."""
    user = User(
        id=TEST_USER_ID,
        email=TEST_USER_EMAIL,
        name=TEST_USER_NAME,
        plan="pro",
        onboarding_completed=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
def auth_token(test_user: User) -> str:
    """Generate a valid JWT token for the test user."""
    return create_access_token(test_user.id, test_user.email)


@pytest_asyncio.fixture
def auth_headers(auth_token: str) -> dict:
    """Return authorization headers for authenticated requests."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest_asyncio.fixture
async def client(db_session: AsyncSession, test_user: User) -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP test client with overridden DB dependency."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def authenticated_client(
    client: AsyncClient, auth_headers: dict
) -> AsyncClient:
    """Wrap the test client so all requests include auth headers."""
    client.headers.update(auth_headers)
    return client

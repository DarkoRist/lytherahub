"""LytheraHub AI — FastAPI application entry point."""

import json
from contextlib import asynccontextmanager
from typing import Dict, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings


class ConnectionManager:
    """Manage WebSocket connections per user."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            dead = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active_connections[user_id].discard(ws)


ws_manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Demo mode: {settings.DEMO_MODE}")

    # Create database tables
    from app.models.database import create_tables
    await create_tables()

    # Seed demo data if in demo mode
    if settings.DEMO_MODE:
        from app.demo_seeder import seed_demo_data
        from app.models.database import async_session

        async with async_session() as db:
            await seed_demo_data(db)

    yield

    # Shutdown
    print("Shutting down LytheraHub AI...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered business operations command center",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.emails import router as emails_router
from app.routers.calendar import router as calendar_router
from app.routers.invoices import router as invoices_router
from app.routers.clients import router as clients_router
from app.routers.reports import router as reports_router
from app.routers.alerts import router as alerts_router
from app.routers.automations import router as automations_router
from app.routers.billing import router as billing_router
from app.routers.settings import router as settings_router
from app.routers.slack import router as slack_router
from app.routers.chat import router as chat_router
from app.routers.tasks import router as tasks_router
from app.routers.analytics import router as analytics_router
from app.routers.onboarding import router as onboarding_router

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(emails_router)
app.include_router(calendar_router)
app.include_router(invoices_router)
app.include_router(clients_router)
app.include_router(reports_router)
app.include_router(alerts_router)
app.include_router(automations_router)
app.include_router(billing_router)
app.include_router(settings_router)
app.include_router(slack_router)
app.include_router(chat_router)
app.include_router(tasks_router)
app.include_router(analytics_router)
app.include_router(onboarding_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "demo_mode": settings.DEMO_MODE,
    }


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time updates."""
    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now; handlers will be added later
            await websocket.send_json({"type": "pong", "data": json.loads(data)})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)

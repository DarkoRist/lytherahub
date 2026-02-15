"""Task router — CRUD, kanban, overdue, and auto-generated tasks."""

import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.models.database import Client, Task, User, get_db
from app.models.schemas import (
    PaginatedResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

VALID_STATUSES = ["todo", "in_progress", "done"]
VALID_PRIORITIES = ["low", "medium", "high", "urgent"]


async def _get_task_or_404(task_id: str, user_id: str, db: AsyncSession) -> Task:
    """Fetch a task, raising 404 if not found or not owned."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


# ---------------------------------------------------------------------------
# GET /api/tasks/today — tasks due today sorted by priority
# ---------------------------------------------------------------------------


@router.get("/today", response_model=list[TaskResponse])
async def get_today_tasks(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get tasks due today, sorted by priority."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    priority_order = func.case(
        (Task.priority == "urgent", 0),
        (Task.priority == "high", 1),
        (Task.priority == "medium", 2),
        (Task.priority == "low", 3),
        else_=4,
    )

    result = await db.execute(
        select(Task)
        .where(
            Task.user_id == user.id,
            Task.status != "done",
            Task.due_date >= today_start,
            Task.due_date <= today_end,
        )
        .order_by(priority_order, Task.due_date)
    )
    return [TaskResponse.model_validate(t) for t in result.scalars().all()]


# ---------------------------------------------------------------------------
# GET /api/tasks/overdue — overdue tasks
# ---------------------------------------------------------------------------


@router.get("/overdue", response_model=list[TaskResponse])
async def get_overdue_tasks(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get overdue tasks (past due date, not done)."""
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(Task)
        .where(
            Task.user_id == user.id,
            Task.status != "done",
            Task.due_date < now,
        )
        .order_by(Task.due_date)
    )
    return [TaskResponse.model_validate(t) for t in result.scalars().all()]


# ---------------------------------------------------------------------------
# GET /api/tasks — list tasks (paginated, filterable)
# ---------------------------------------------------------------------------


@router.get("", response_model=PaginatedResponse)
async def list_tasks(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    priority: str | None = None,
    source: str | None = None,
    client_id: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """List tasks with optional filters."""
    query = select(Task).where(Task.user_id == user.id)

    if status_filter and status_filter in VALID_STATUSES:
        query = query.where(Task.status == status_filter)
    if priority and priority in VALID_PRIORITIES:
        query = query.where(Task.priority == priority)
    if source:
        query = query.where(Task.source == source)
    if client_id:
        query = query.where(Task.client_id == client_id)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Sort: priority first, then due date
    priority_order = func.case(
        (Task.priority == "urgent", 0),
        (Task.priority == "high", 1),
        (Task.priority == "medium", 2),
        (Task.priority == "low", 3),
        else_=4,
    )

    result = await db.execute(
        query
        .order_by(priority_order, Task.due_date.asc().nullslast())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    tasks = [TaskResponse.model_validate(t) for t in result.scalars().all()]

    return PaginatedResponse(
        items=tasks,
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


# ---------------------------------------------------------------------------
# POST /api/tasks — create task
# ---------------------------------------------------------------------------


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new task."""
    task = Task(
        user_id=user.id,
        client_id=body.client_id,
        title=body.title,
        description=body.description,
        priority=body.priority,
        status=body.status,
        due_date=body.due_date,
        source=body.source,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return TaskResponse.model_validate(task)


# ---------------------------------------------------------------------------
# GET /api/tasks/{id} — single task
# ---------------------------------------------------------------------------


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single task by ID."""
    task = await _get_task_or_404(task_id, user.id, db)
    return TaskResponse.model_validate(task)


# ---------------------------------------------------------------------------
# PUT /api/tasks/{id} — update task
# ---------------------------------------------------------------------------


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    body: TaskUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a task."""
    task = await _get_task_or_404(task_id, user.id, db)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    return TaskResponse.model_validate(task)


# ---------------------------------------------------------------------------
# DELETE /api/tasks/{id} — delete task
# ---------------------------------------------------------------------------


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a task."""
    task = await _get_task_or_404(task_id, user.id, db)
    await db.delete(task)
    await db.commit()

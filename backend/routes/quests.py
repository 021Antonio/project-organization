from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, ensure_player_state
from models import Quest, QuestStatus
from scheduler import tick_scheduled_quests
from xp import calc_xp_gain, get_player_rank

router = APIRouter(prefix="/api/v1/quests", tags=["quests"])


# --- Schemas ---

class QuestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    rank: str = "B"
    tags: Optional[list[str]] = []
    deadline: Optional[datetime] = None
    activate_at: Optional[datetime] = None
    status: Optional[str] = None


class QuestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    rank: Optional[str] = None
    tags: Optional[list[str]] = None
    deadline: Optional[datetime] = None
    activate_at: Optional[datetime] = None
    status: Optional[str] = None


class QuestResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: str
    rank: str
    tags: Optional[list[str]]
    deadline: Optional[datetime]
    activate_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    cleared_at: Optional[datetime]
    xp_earned: Optional[int]

    class Config:
        from_attributes = True


# --- Endpoints ---

@router.get("", response_model=list[QuestResponse])
def list_quests(
    status: Optional[list[str]] = Query(None),
    rank: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    overdue: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Quest)

    if status:
        query = query.filter(Quest.status.in_(status))

    if rank:
        query = query.filter(Quest.rank == rank)

    if tag:
        query = query.filter(Quest.tags.contains([tag]))

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Quest.title.ilike(pattern)) | (Quest.description.ilike(pattern))
        )

    if overdue:
        now = datetime.now(timezone.utc)
        query = query.filter(
            Quest.status == QuestStatus.active,
            Quest.deadline < now,
        )

    return query.all()


@router.post("", response_model=QuestResponse, status_code=201)
def create_quest(body: QuestCreate, db: Session = Depends(get_db)):
    # Validate: activate_at must be at least 24h before deadline
    if body.activate_at and body.deadline:
        diff = (body.deadline - body.activate_at).total_seconds()
        if diff < 86400:
            raise HTTPException(
                status_code=400,
                detail="activate_at must be at least 24 hours before deadline",
            )

    # Determine initial status
    if body.status:
        initial_status = body.status
    elif body.activate_at:
        initial_status = QuestStatus.scheduled.value
    else:
        initial_status = QuestStatus.active.value

    quest = Quest(
        title=body.title,
        description=body.description,
        rank=body.rank,
        tags=body.tags or [],
        deadline=body.deadline,
        activate_at=body.activate_at,
        status=initial_status,
    )
    db.add(quest)
    db.commit()
    db.refresh(quest)
    return quest


@router.get("/{quest_id}", response_model=QuestResponse)
def get_quest(quest_id: UUID, db: Session = Depends(get_db)):
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    return quest


@router.patch("/{quest_id}", response_model=QuestResponse)
def update_quest(quest_id: UUID, body: QuestUpdate, db: Session = Depends(get_db)):
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    update_data = body.model_dump(exclude_unset=True)

    # Validate: activate_at must be at least 24h before deadline
    new_activate = update_data.get("activate_at", quest.activate_at)
    new_deadline = update_data.get("deadline", quest.deadline)
    if new_activate and new_deadline:
        diff = (new_deadline - new_activate).total_seconds()
        if diff < 86400:
            raise HTTPException(
                status_code=400,
                detail="activate_at must be at least 24 hours before deadline",
            )

    for field, value in update_data.items():
        setattr(quest, field, value)

    db.commit()
    db.refresh(quest)
    return quest


@router.delete("/{quest_id}", status_code=204)
def delete_quest(quest_id: UUID, db: Session = Depends(get_db)):
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    db.delete(quest)
    db.commit()


@router.post("/{quest_id}/complete", response_model=QuestResponse)
def complete_quest(quest_id: UUID, db: Session = Depends(get_db)):
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.status == QuestStatus.cleared:
        raise HTTPException(status_code=400, detail="Quest already cleared")

    # Calculate XP
    xp = calc_xp_gain(quest.rank, quest.deadline, quest.created_at)
    quest.xp_earned = xp
    quest.status = QuestStatus.cleared
    quest.cleared_at = datetime.now(timezone.utc)

    # Update player state
    player = ensure_player_state(db)
    player.total_xp = max(0, player.total_xp + xp)
    player.rank = get_player_rank(player.total_xp)

    db.commit()
    db.refresh(quest)
    return quest


@router.post("/{quest_id}/archive", response_model=QuestResponse)
def archive_quest(quest_id: UUID, db: Session = Depends(get_db)):
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    quest.status = QuestStatus.archived
    db.commit()
    db.refresh(quest)
    return quest


@router.post("/tick")
def tick(db: Session = Depends(get_db)):
    activated = tick_scheduled_quests(db)
    return {"activated": activated, "count": len(activated)}

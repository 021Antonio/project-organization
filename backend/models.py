import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column, String, Integer, DateTime, Enum as SAEnum, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class QuestStatus(str, Enum):
    pending = "pending"
    active = "active"
    scheduled = "scheduled"
    cleared = "cleared"
    archived = "archived"


class RankEnum(str, Enum):
    E = "E"
    D = "D"
    C = "C"
    B = "B"
    A = "A"
    S = "S"
    S_PLUS = "S+"


class Quest(Base):
    __tablename__ = "quests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[QuestStatus] = mapped_column(
        SAEnum(QuestStatus, values_callable=lambda x: [e.value for e in x]),
        default=QuestStatus.pending,
    )
    rank: Mapped[str] = mapped_column(String, nullable=False, default="B")
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    activate_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    cleared_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    xp_earned: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class PlayerState(Base):
    __tablename__ = "player_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    rank: Mapped[str] = mapped_column(String, default="E")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

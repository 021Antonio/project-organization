import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from models import Base, PlayerState

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/planner")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_player_state(db: Session) -> PlayerState:
    """Ensure there is exactly one PlayerState row."""
    player = db.query(PlayerState).filter(PlayerState.id == 1).first()
    if not player:
        player = PlayerState(id=1, total_xp=0, rank="E")
        db.add(player)
        db.commit()
        db.refresh(player)
    return player

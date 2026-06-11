from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db, ensure_player_state
from xp import get_xp_to_next

router = APIRouter(prefix="/api/v1/player", tags=["player"])


@router.get("")
def get_player(db: Session = Depends(get_db)):
    player = ensure_player_state(db)
    info = get_xp_to_next(player.total_xp)
    return info

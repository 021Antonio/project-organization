from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import Quest, QuestStatus


def tick_scheduled_quests(db: Session) -> list[str]:
    """
    Activate quests with status='scheduled' and activate_at <= now.
    Returns list of activated quest IDs.
    """
    now = datetime.now(timezone.utc)
    quests = (
        db.query(Quest)
        .filter(Quest.status == QuestStatus.scheduled)
        .filter(Quest.activate_at <= now)
        .all()
    )

    activated_ids = []
    for quest in quests:
        quest.status = QuestStatus.active
        activated_ids.append(str(quest.id))

    if activated_ids:
        db.commit()

    return activated_ids

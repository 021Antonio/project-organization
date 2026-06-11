from datetime import datetime, timezone

RANK_XP_BASE = {
    "E": 10,
    "D": 20,
    "C": 40,
    "B": 80,
    "A": 160,
    "S": 320,
    "S+": 500,
}

RANK_THRESHOLDS = [
    ("E", 0),
    ("D", 50),
    ("C", 150),
    ("B", 350),
    ("A", 750),
    ("S", 1500),
    ("S+", 3000),
]


def calc_xp_gain(rank: str, deadline: datetime | None, created_at: datetime) -> int:
    """
    Calculate XP gained when completing a quest.
    Follows the spec formula exactly.
    """
    base = RANK_XP_BASE.get(rank, 10)

    if deadline is None:
        return base

    now = datetime.now(timezone.utc)
    total_duration = (deadline - created_at).total_seconds()

    if total_duration <= 0:
        return base

    remaining = (deadline - now).total_seconds()
    ratio = remaining / total_duration

    if ratio < 0:
        return -round(base * 0.5)
    elif ratio >= 0 and ratio <= 0.1:
        return round(base * 0.2)
    elif ratio > 0.1 and ratio <= 0.5:
        return round(base * (0.2 + ratio * 1.6))
    else:
        return base


def get_player_rank(total_xp: int) -> str:
    """Determine player rank from total XP."""
    rank = "E"
    for r, threshold in RANK_THRESHOLDS:
        if total_xp >= threshold:
            rank = r
    return rank


def get_xp_to_next(total_xp: int) -> dict:
    """Get XP progress info for the player."""
    current_rank = get_player_rank(total_xp)
    current_idx = next(
        i for i, (r, _) in enumerate(RANK_THRESHOLDS) if r == current_rank
    )

    if current_idx >= len(RANK_THRESHOLDS) - 1:
        # Already at max rank
        return {
            "rank": current_rank,
            "total_xp": total_xp,
            "xp_to_next": 0,
            "pct": 100,
        }

    current_threshold = RANK_THRESHOLDS[current_idx][1]
    next_threshold = RANK_THRESHOLDS[current_idx + 1][1]
    xp_in_rank = total_xp - current_threshold
    xp_needed = next_threshold - current_threshold
    pct = round((xp_in_rank / xp_needed) * 100) if xp_needed > 0 else 100

    return {
        "rank": current_rank,
        "total_xp": total_xp,
        "xp_to_next": next_threshold - total_xp,
        "pct": pct,
    }

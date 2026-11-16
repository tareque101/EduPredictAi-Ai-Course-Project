"""Pure, database-free calculations (easy to unit test)."""
import math
from datetime import timedelta


def clamp(value, low=0.0, high=100.0):
    return max(low, min(high, value))


def mean(values):
    values = [v for v in values if v is not None]
    return sum(values) / len(values) if values else None


def pearson(xs, ys):
    """Pearson r for paired values; None if fewer than 3 pairs or no variance."""
    pairs = [(x, y) for x, y in zip(xs, ys) if x is not None and y is not None]
    if len(pairs) < 3:
        return None
    mx = sum(p[0] for p in pairs) / len(pairs)
    my = sum(p[1] for p in pairs) / len(pairs)
    dx = sum((p[0] - mx) ** 2 for p in pairs)
    dy = sum((p[1] - my) ** 2 for p in pairs)
    if dx == 0 or dy == 0:
        return None
    return sum((p[0] - mx) * (p[1] - my) for p in pairs) / math.sqrt(dx * dy)


def describe_correlation(r):
    if r is None:
        return "none"
    size = abs(r)
    if size >= 0.6:
        return "strong"
    if size >= 0.35:
        return "moderate"
    if size >= 0.15:
        return "weak"
    return "none"


def consecutive_streak(dates, today):
    """Current streak (ending today or yesterday) and the longest streak ever."""
    dates = {d for d in dates if d <= today}
    if not dates:
        return {"current": 0, "longest": 0}
    longest = run = 0
    previous = None
    for d in sorted(dates):
        run = run + 1 if previous and (d - previous).days == 1 else 1
        longest = max(longest, run)
        previous = d
    cursor = today if today in dates else today - timedelta(days=1)
    current = 0
    while cursor in dates:
        current += 1
        cursor -= timedelta(days=1)
    return {"current": current, "longest": longest}


# ---- Wellbeing ---------------------------------------------------------------

def sleep_score(hours):
    if hours is None:
        return None
    if 7 <= hours <= 9:
        return 100.0
    if hours < 7:
        return clamp(100 - (7 - hours) * 25)
    return clamp(100 - (hours - 9) * 20)


WELLBEING_WEIGHTS = {"sleep": 0.25, "mood": 0.20, "stress": 0.20, "energy": 0.15, "exercise": 0.10, "water": 0.10}


def wellbeing_score(sleep=None, mood=None, stress=None, energy=None, exercise=None, water=None):
    """0-100 composite from whichever metrics are available (weights renormalised)."""
    parts = {
        "sleep": sleep_score(sleep),
        "mood": None if mood is None else (mood - 1) / 4 * 100,
        "stress": None if stress is None else (5 - stress) / 4 * 100,
        "energy": None if energy is None else (energy - 1) / 4 * 100,
        "exercise": None if exercise is None else clamp(exercise / 30 * 100),
        "water": None if water is None else clamp(water / 2000 * 100),
    }
    available = {k: v for k, v in parts.items() if v is not None}
    if not available:
        return None
    total_weight = sum(WELLBEING_WEIGHTS[k] for k in available)
    return round(sum(WELLBEING_WEIGHTS[k] * v for k, v in available.items()) / total_weight)


def level_from_xp(xp):
    """Level n needs 50*(n-1)^2 XP in total (gentle curve)."""
    level = int(math.sqrt(max(xp, 0) / 50)) + 1
    floor_xp = 50 * (level - 1) ** 2
    next_xp = 50 * level ** 2
    return {
        "level": level,
        "xp": xp,
        "into_level": xp - floor_xp,
        "needed": next_xp - floor_xp,
        "pct": round(100 * (xp - floor_xp) / (next_xp - floor_xp)),
    }


def insight(id_, severity, title, detail, to=None, label=None):
    return {"id": id_, "severity": severity, "title": title, "detail": detail,
            "action": {"to": to, "label": label} if to else None}

"""XP, levels and achievements. Everything is derived from tracked data (nothing extra is stored)."""
from datetime import timedelta

from flask import Blueprint, g, jsonify
from sqlalchemy import func

from auth import token_required
from extensions import db
from models import Activity, ActivitySession, FocusSession, Habit, HabitLog, HealthLog, Skill, SkillLog, Task
from stats import level_from_xp
from tracker import tracking_dates
from stats import consecutive_streak
from utils import client_today

bp = Blueprint("gamification", __name__, url_prefix="/api/gamification")

XP_RULES = {"habit_log": 5, "skill_hour": 10, "eca_hour": 8, "health_log": 10, "task_done": 15, "focus_hour": 6}


def _count(model, **filters):
    return db.session.query(func.count(model.id)).filter_by(**filters).scalar() or 0


def _sum(column, model, user_id):
    return float(db.session.query(func.coalesce(func.sum(column), 0)).filter(model.user_id == user_id).scalar() or 0)


def compute(user):
    uid, today = user.id, client_today()
    totals = {
        "habit_logs": _count(HabitLog, user_id=uid),
        "health_logs": _count(HealthLog, user_id=uid),
        "tasks_done": db.session.query(func.count(Task.id)).filter(Task.user_id == uid, Task.status == "done").scalar() or 0,
        "skill_hours": _sum(SkillLog.hours, SkillLog, uid),
        "eca_hours": _sum(ActivitySession.hours, ActivitySession, uid),
        "focus_hours": _sum(FocusSession.minutes, FocusSession, uid) / 60,
    }
    xp = round(
        totals["habit_logs"] * XP_RULES["habit_log"]
        + totals["health_logs"] * XP_RULES["health_log"]
        + totals["tasks_done"] * XP_RULES["task_done"]
        + totals["skill_hours"] * XP_RULES["skill_hour"]
        + totals["eca_hours"] * XP_RULES["eca_hour"]
        + totals["focus_hours"] * XP_RULES["focus_hour"]
    )
    streak = consecutive_streak(tracking_dates(uid, today - timedelta(days=400)), today)

    week_ago = today - timedelta(days=6)
    recent = HealthLog.query.filter(HealthLog.user_id == uid, HealthLog.log_date >= week_ago).all()
    avg_sleep = sum(l.sleep_hours or 0 for l in recent) / len(recent) if recent else 0
    hydrated_days = sum(1 for l in recent if (l.water_ml or 0) >= 2000)
    best_habit_streak = max([h.effective_streak(today) for h in Habit.query.filter_by(user_id=uid)], default=0)
    leader = any(
        any(w in (a.role or "").lower() for w in ("lead", "coordinator", "president", "captain", "head"))
        for a in Activity.query.filter_by(user_id=uid)
    )
    expert = Skill.query.filter_by(user_id=uid, level=4).count()

    def ach(key, title, desc, icon, progress, target):
        return {"key": key, "title": title, "desc": desc, "icon": icon,
                "progress": min(round(progress, 1), target), "target": target, "unlocked": progress >= target}

    achievements = [
        ach("first-checkin", "First Check-in", "Log your first health check-in", "heart", totals["health_logs"], 1),
        ach("streak-7", "Week Warrior", "Track something 7 days in a row", "flame", streak["longest"], 7),
        ach("streak-30", "Unstoppable", "Reach a 30-day tracking streak", "zap", streak["longest"], 30),
        ach("habit-7", "Habit Builder", "Hold a 7-day habit streak", "repeat", best_habit_streak, 7),
        ach("skill-10", "Skill Builder", "Practise skills for 10 hours", "book", totals["skill_hours"], 10),
        ach("skill-expert", "Master", "Reach Expert level in a skill", "trophy", expert, 1),
        ach("eca-20", "Team Player", "Log 20 hours of activities", "users", totals["eca_hours"], 20),
        ach("leader", "Leader", "Hold a leadership role in an activity", "crown", 1 if leader else 0, 1),
        ach("tasks-10", "Task Master", "Complete 10 tasks", "check", totals["tasks_done"], 10),
        ach("focus-5", "Deep Focus", "Complete 5 hours of focus sessions", "timer", totals["focus_hours"], 5),
        ach("rested", "Well Rested", "Average 7+ hours of sleep this week (3+ logs)", "moon", avg_sleep if len(recent) >= 3 else 0, 7),
        ach("hydrated", "Hydrated", "Drink 2 L of water on 5 days in a week", "droplet", hydrated_days, 5),
    ]
    return {
        **level_from_xp(xp),
        "totals": {k: round(v, 1) for k, v in totals.items()},
        "streak": streak,
        "achievements": achievements,
        "unlocked": sum(1 for a in achievements if a["unlocked"]),
        "xp_rules": XP_RULES,
    }


@bp.get("")
@token_required
def get_gamification():
    return jsonify(compute(g.user))

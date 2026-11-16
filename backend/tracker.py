"""One-stop tracking endpoints: today's snapshot, combined check-in, activity feed."""
from datetime import timedelta

from flask import Blueprint, g, jsonify, request
from sqlalchemy import func

from activities import apply_session, owned_activity
from auth import token_required
from extensions import db
from habits import apply_log, owned_habit
from health_logs import upsert_log
from models import (
    Activity, ActivitySession, FocusSession, Habit, HabitLog, HealthLog, Skill, SkillLog, Task,
)
from skills import apply_practice, owned_skill
from stats import consecutive_streak
from utils import ValidationError, client_today, number, parse_date, text

bp = Blueprint("tracker", __name__, url_prefix="/api/tracker")


def tracking_dates(user_id, since=None):
    """Every date on which the user tracked *anything*."""
    dates = set()
    sources = (
        (HealthLog.log_date, HealthLog.user_id),
        (HabitLog.log_date, HabitLog.user_id),
        (SkillLog.log_date, SkillLog.user_id),
        (ActivitySession.log_date, ActivitySession.user_id),
        (FocusSession.log_date, FocusSession.user_id),
        (Task.done_date, Task.user_id),
    )
    for column, owner in sources:
        query = db.session.query(column).filter(owner == user_id, column.isnot(None))
        if since:
            query = query.filter(column >= since)
        dates.update(d for (d,) in query.distinct().all())
    return dates


def snapshot(user, day):
    """Everything the user did / still has to do on one day."""
    health = HealthLog.query.filter_by(user_id=user.id, log_date=day).first()

    habits = Habit.query.filter_by(user_id=user.id).order_by(Habit.id).all()
    habit_rows = []
    for h in habits:
        current = h.current if h.last_logged == day else 0.0
        if h.goal == "at-most":
            done = current > 0 and current <= h.target
        else:
            done = current >= h.target
        habit_rows.append({
            "id": h.id, "name": h.name, "unit": h.unit, "goal": h.goal, "step": h.step,
            "current": current, "target": h.target, "done": done, "color": h.color,
        })

    skill_rows = (
        db.session.query(Skill.id, Skill.name, func.sum(SkillLog.hours))
        .join(SkillLog, SkillLog.skill_id == Skill.id)
        .filter(SkillLog.user_id == user.id, SkillLog.log_date == day)
        .group_by(Skill.id, Skill.name)
        .all()
    )
    eca_rows = (
        db.session.query(Activity.id, Activity.title, func.sum(ActivitySession.hours))
        .join(ActivitySession, ActivitySession.activity_id == Activity.id)
        .filter(ActivitySession.user_id == user.id, ActivitySession.log_date == day)
        .group_by(Activity.id, Activity.title)
        .all()
    )
    due = Task.query.filter(Task.user_id == user.id, Task.status != "done", Task.due_date <= day).all()
    done_today = Task.query.filter_by(user_id=user.id, done_date=day).count()
    focus_min = db.session.query(func.coalesce(func.sum(FocusSession.minutes), 0)).filter_by(user_id=user.id, log_date=day).scalar()

    checklist = [{"key": "health", "label": "Health check-in", "done": health is not None}]
    if habit_rows:
        n_done = sum(1 for r in habit_rows if r["done"])
        checklist.append({"key": "habits", "label": f"Habits ({n_done}/{len(habit_rows)})", "done": n_done == len(habit_rows)})
    if Skill.query.filter_by(user_id=user.id).count():
        checklist.append({"key": "skills", "label": "Practice a skill", "done": bool(skill_rows)})
    if Activity.query.filter_by(user_id=user.id).count():
        checklist.append({"key": "eca", "label": "Log an activity", "done": bool(eca_rows)})
    if due or done_today:
        checklist.append({"key": "tasks", "label": "Clear today's tasks", "done": not due})

    done_count = sum(1 for c in checklist if c["done"])
    streak = consecutive_streak(tracking_dates(user.id, day - timedelta(days=400)), day)
    return {
        "date": day.isoformat(),
        "health": health.to_dict() if health else None,
        "habits": habit_rows,
        "skills": [{"id": i, "name": n, "hours": float(h)} for i, n, h in skill_rows],
        "eca": [{"id": i, "title": t, "hours": float(h)} for i, t, h in eca_rows],
        "tasks_due": [t.to_dict(day) for t in due],
        "tasks_done": done_today,
        "focus_minutes": int(focus_min or 0),
        "progress": {
            "done": done_count,
            "total": len(checklist),
            "pct": round(100 * done_count / len(checklist)) if checklist else 0,
            "items": checklist,
        },
        "streak": streak["current"],
        "best_streak": streak["longest"],
    }


@bp.get("/today")
@token_required
def today():
    day = parse_date(request.args.get("date"), default=client_today())
    return jsonify(snapshot(g.user, day))


@bp.post("/checkin")
@token_required
def checkin():
    """Log health + habits + skills + ECA in a single request.

    Body: {date?, health?, habits?: [{id, amount?}], skills?: [{id, hours, note?}], eca?: [{id, hours, note?}]}
    Everything is validated first and committed together or not at all.
    """
    data = request.get_json(silent=True) or {}
    today_ = client_today()
    day = parse_date(data.get("date"), default=today_)
    applied = {"health": False, "habits": 0, "skills": 0, "eca": 0}

    if isinstance(data.get("health"), dict) and data["health"]:
        upsert_log(g.user.id, day, data["health"], partial=True)
        applied["health"] = True

    for item in data.get("habits") or []:
        if day != today_:
            raise ValidationError("Habits can only be logged for today.")
        habit = owned_habit(item.get("id"))
        if habit is None:
            raise ValidationError("Habit not found.")
        apply_log(habit, number(item, "amount", 0.0001, 100000, default=habit.step), today_)
        applied["habits"] += 1

    for item in data.get("skills") or []:
        skill = owned_skill(item.get("id"))
        if skill is None:
            raise ValidationError("Skill not found.")
        apply_practice(skill, number(item, "hours", 0.01, 24), day, text(item, "note", 255))
        applied["skills"] += 1

    for item in data.get("eca") or []:
        activity = owned_activity(item.get("id"))
        if activity is None:
            raise ValidationError("Activity not found.")
        apply_session(activity, number(item, "hours", 0.01, 24), day, text(item, "note", 255))
        applied["eca"] += 1

    if not any(applied.values()):
        raise ValidationError("Nothing to log. Send health, habits, skills or eca.")

    db.session.commit()
    return jsonify(ok=True, applied=applied, today=snapshot(g.user, day))


@bp.get("/feed")
@token_required
def feed():
    """Recent activity across every tracker, newest first."""
    limit = int(number(request.args, "limit", 1, 50, default=15, integer=True))
    uid = g.user.id
    events = []

    for log, habit in db.session.query(HabitLog, Habit).join(Habit, Habit.id == HabitLog.habit_id).filter(HabitLog.user_id == uid).order_by(HabitLog.id.desc()).limit(limit):
        events.append({"type": "habit", "date": log.log_date.isoformat(), "order": log.id, "title": f"Logged {log.amount:g} {habit.unit} of {habit.name}"})
    for log, skill in db.session.query(SkillLog, Skill).join(Skill, Skill.id == SkillLog.skill_id).filter(SkillLog.user_id == uid).order_by(SkillLog.id.desc()).limit(limit):
        events.append({"type": "skill", "date": log.log_date.isoformat(), "order": log.id, "title": f"Practised {skill.name} for {log.hours:g} h"})
    for log, act in db.session.query(ActivitySession, Activity).join(Activity, Activity.id == ActivitySession.activity_id).filter(ActivitySession.user_id == uid).order_by(ActivitySession.id.desc()).limit(limit):
        events.append({"type": "eca", "date": log.log_date.isoformat(), "order": log.id, "title": f"{log.hours:g} h on {act.title}"})
    for log in HealthLog.query.filter_by(user_id=uid).order_by(HealthLog.log_date.desc()).limit(limit):
        events.append({"type": "health", "date": log.log_date.isoformat(), "order": log.id, "title": f"Health check-in: {log.sleep_hours:g} h sleep, mood {log.mood}/5"})
    for task in Task.query.filter(Task.user_id == uid, Task.status == "done", Task.done_date.isnot(None)).order_by(Task.done_date.desc(), Task.id.desc()).limit(limit):
        events.append({"type": "task", "date": task.done_date.isoformat(), "order": task.id, "title": f"Completed task: {task.title}"})

    events.sort(key=lambda e: (e["date"], e["order"]), reverse=True)
    return jsonify(events=events[:limit])

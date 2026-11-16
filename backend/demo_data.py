"""Sample data so a new account can explore analytics immediately."""
import random
from datetime import timedelta

from flask import Blueprint, g, jsonify

from auth import token_required
from extensions import db
from models import (
    Activity, ActivitySession, FocusSession, Habit, HabitLog, HealthLog, Skill, SkillLog, Task,
)
from utils import client_today, error

bp = Blueprint("demo", __name__, url_prefix="/api/demo")

TRACKING_MODELS = (FocusSession, HabitLog, SkillLog, ActivitySession, HealthLog, Task, Habit, Skill, Activity)


def seed(user, today, days=45, seed_value=None):
    rng = random.Random(seed_value if seed_value is not None else user.id)
    uid = user.id

    habits = [
        Habit(user_id=uid, name="Study", category="Study", unit="hrs", target=3, step=0.5, color="#6366f1"),
        Habit(user_id=uid, name="Drink water", category="Health", unit="glasses", target=8, step=1, color="#06b6d4"),
        Habit(user_id=uid, name="Read", category="Study", unit="pages", target=20, step=5, color="#8b5cf6"),
        Habit(user_id=uid, name="Phone before bed", category="Recovery", goal="at-most", unit="min", target=30, step=10, color="#f59e0b"),
    ]
    skills = [
        Skill(user_id=uid, name="Python", category="Programming", level=3, goal_level=4),
        Skill(user_id=uid, name="React", category="Programming", level=2, goal_level=3),
        Skill(user_id=uid, name="Public speaking", category="Communication", level=2, goal_level=3),
        Skill(user_id=uid, name="IELTS English", category="Language", level=2, goal_level=3),
    ]
    activities = [
        Activity(user_id=uid, title="CSE Club", organisation="University CSE Society", category="Tech", role="Event Coordinator", start_date=today - timedelta(days=200), hours=0),
        Activity(user_id=uid, title="Blood donation drive", organisation="Red Crescent", category="Social Service", role="Volunteer", start_date=today - timedelta(days=90), hours=0),
        Activity(user_id=uid, title="Football team", organisation="Dept. Team", category="Sports", role="Member", start_date=today - timedelta(days=120), hours=0),
    ]
    db.session.add_all(habits + skills + activities)
    db.session.flush()

    for offset in range(days, -1, -1):
        day = today - timedelta(days=offset)
        weekend = day.weekday() >= 5
        # health: roughly 85% of days logged, sleep drives mood/energy a little
        if rng.random() < 0.85:
            sleep = round(min(10, max(4, rng.gauss(6.8 if not weekend else 7.8, 0.9))) * 2) / 2
            mood = int(min(5, max(1, round(2.2 + (sleep - 5) * 0.45 + rng.gauss(0, 0.6)))))
            stress = int(min(5, max(1, round(4 - (sleep - 5) * 0.3 + rng.gauss(0, 0.7)))))
            db.session.add(HealthLog(
                user_id=uid, log_date=day, sleep_hours=sleep, sleep_quality=min(5, max(1, round(sleep - 3))),
                mood=mood, stress=stress, water_ml=rng.choice([1000, 1500, 2000, 2500]),
                exercise_min=rng.choice([0, 0, 20, 30, 45]), screen_time_hrs=round(rng.uniform(3, 9), 1),
                caffeine_cups=rng.choice([0, 1, 2, 3]), energy_level=min(5, max(1, round(sleep - 3.5 + rng.gauss(0, 0.6)))),
            ))
        for h in habits:
            if rng.random() < (0.55 if h.name != "Phone before bed" else 0.4):
                amount = h.target if rng.random() < 0.7 else h.step
                db.session.add(HabitLog(user_id=uid, habit_id=h.id, log_date=day, amount=amount))
                h.last_logged, h.streak = day, (h.streak or 0) + 1
                h.current = amount
        for s in skills:
            if rng.random() < 0.3:
                hrs = rng.choice([0.5, 1, 1.5, 2])
                db.session.add(SkillLog(user_id=uid, skill_id=s.id, log_date=day, hours=hrs))
                s.practice_hours = round((s.practice_hours or 0) + hrs, 2)
                s.last_practiced = day
        for a in activities:
            if rng.random() < 0.08:
                hrs = rng.choice([1, 2, 3])
                db.session.add(ActivitySession(user_id=uid, activity_id=a.id, log_date=day, hours=hrs))
                a.hours = round((a.hours or 0) + hrs, 2)
        if rng.random() < 0.5:
            db.session.add(FocusSession(user_id=uid, log_date=day, minutes=rng.choice([25, 25, 50, 75])))

    # Streaks from seeded logs are not meaningful; keep only a current-day-safe value.
    for h in habits:
        if h.last_logged != today:
            h.streak = 0

    tasks = [
        ("Finish algorithms assignment", "Study", 3, 1, 120), ("Revise for midterm", "Study", 3, 3, 180),
        ("Push portfolio site", "Skill", 2, 5, 90), ("Plan club event", "ECA", 2, 2, 60),
        ("Book dentist", "Health", 1, -1, 15), ("Submit scholarship form", "Personal", 3, 4, 45),
    ]
    for title, cat, prio, due, est in tasks:
        db.session.add(Task(user_id=uid, title=title, category=cat, priority=prio, due_date=today + timedelta(days=due), estimate_min=est))
    for i, title in enumerate(["Read DB chapter", "Email supervisor", "Lab report", "Gym session"]):
        done = today - timedelta(days=i * 3 + 1)
        db.session.add(Task(user_id=uid, title=title, category="Study", priority=2, status="done", done_date=done, due_date=done))
    db.session.commit()


@bp.post("/seed")
@token_required
def seed_demo():
    if HealthLog.query.filter_by(user_id=g.user.id).count() or Habit.query.filter_by(user_id=g.user.id).count():
        return error("You already have data. Clear it first if you want sample data.", 409)
    seed(g.user, client_today())
    return jsonify(ok=True), 201


@bp.delete("/clear")
@token_required
def clear_data():
    """Delete all of this user's tracking data (the account stays)."""
    for model in TRACKING_MODELS:
        model.query.filter_by(user_id=g.user.id).delete()
    db.session.commit()
    return jsonify(ok=True)

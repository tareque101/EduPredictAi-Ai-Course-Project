from datetime import date, timedelta

from flask import Blueprint, g, jsonify, request

from auth import token_required
from extensions import db
from models import Habit

bp = Blueprint("habits", __name__, url_prefix="/api/habits")
PALETTE = ["#6366f1", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]


def owned_habit(habit_id):
    """Return the habit only if it belongs to the logged-in user."""
    return Habit.query.filter_by(id=habit_id, user_id=g.user.id).first()


@bp.get("")
@token_required
def list_habits():
    habits = Habit.query.filter_by(user_id=g.user.id).order_by(Habit.id).all()
    return jsonify(habits=[h.to_dict() for h in habits])


@bp.post("")
@token_required
def create_habit():
    data = request.get_json(silent=True) or {}
    try:
        name = str(data["name"]).strip()
        target = float(data["target"])
        step = float(data.get("step", 1))
    except (KeyError, TypeError, ValueError):
        return jsonify(error="name, target and step are required."), 400

    if not name or target <= 0 or step <= 0:
        return jsonify(error="Name is required and target and step must be positive."), 400

    goal = data.get("goal", "at-least")
    if goal not in ("at-least", "at-most"):
        goal = "at-least"

    count = Habit.query.filter_by(user_id=g.user.id).count()
    habit = Habit(
        user_id=g.user.id,
        name=name[:100],
        category=str(data.get("category", "Other"))[:40],
        goal=goal,
        unit=(str(data.get("unit", "")).strip() or "units")[:20],
        target=target,
        step=step,
        color=PALETTE[count % len(PALETTE)],
    )
    db.session.add(habit)
    db.session.commit()
    return jsonify(habit=habit.to_dict()), 201


@bp.post("/<int:habit_id>/log")
@token_required
def log_habit(habit_id):
    habit = owned_habit(habit_id)
    if habit is None:
        return jsonify(error="Habit not found."), 404

    today = date.today()
    if habit.last_logged != today:
        yesterday = today - timedelta(days=1)
        habit.streak = (habit.streak or 0) + 1 if habit.last_logged == yesterday else 1
        habit.current = 0.0
        habit.last_logged = today

    habit.current = round((habit.current or 0.0) + habit.step, 2)
    db.session.commit()
    return jsonify(habit=habit.to_dict())


@bp.delete("/<int:habit_id>")
@token_required
def delete_habit(habit_id):
    habit = owned_habit(habit_id)
    if habit is None:
        return jsonify(error="Habit not found."), 404
    db.session.delete(habit)
    db.session.commit()
    return jsonify(ok=True)
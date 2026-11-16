from datetime import timedelta

from flask import Blueprint, g, jsonify, request

from auth import token_required
from extensions import db
from models import FocusSession, Skill, Task
from skills import apply_practice
from utils import ValidationError, client_today, error, number, parse_date, text

bp = Blueprint("tasks", __name__, url_prefix="/api")
CATEGORIES = ("Study", "Skill", "ECA", "Health", "Personal")
STATUSES = ("todo", "doing", "done")


def owned_task(task_id):
    return Task.query.filter_by(id=task_id, user_id=g.user.id).first()


def priority_score(task, today):
    """Higher = do sooner. Combines priority, due date pressure and size."""
    score = {1: 10, 2: 20, 3: 30}.get(task.priority, 20)
    if task.due_date:
        days = (task.due_date - today).days
        if days < 0:
            score += 50 + min(-days, 10)  # overdue floats to the top
        elif days == 0:
            score += 40
        elif days <= 2:
            score += 25
        elif days <= 7:
            score += 10
    if task.status == "doing":
        score += 5
    if task.estimate_min and task.estimate_min <= 30:
        score += 3  # quick wins
    return score


def set_status(task, status, today):
    task.status = status
    task.done_date = today if status == "done" else None


def read_fields(data, existing=None):
    fields = {}
    if existing is None or "title" in data:
        title = text(data, "title", 160)
        if not title:
            raise ValidationError("Task title is required.")
        fields["title"] = title
    if existing is None or "description" in data:
        fields["description"] = text(data, "description", 2000)
    if existing is None or "category" in data:
        category = data.get("category", "Study")
        fields["category"] = category if category in CATEGORIES else "Study"
    if existing is None or "priority" in data:
        fields["priority"] = number(data, "priority", 1, 3, default=2, integer=True)
    if existing is None or "due_date" in data:
        fields["due_date"] = parse_date(data.get("due_date"), field="due_date", max_future_days=None)
    if existing is None or "estimate_min" in data:
        raw = data.get("estimate_min")
        fields["estimate_min"] = None if raw in (None, "") else number(data, "estimate_min", 1, 1440, integer=True)
    if "skill_id" in data:
        skill_id = data.get("skill_id")
        if skill_id in (None, ""):
            fields["skill_id"] = None
        else:
            skill = Skill.query.filter_by(id=skill_id, user_id=g.user.id).first()
            if skill is None:
                raise ValidationError("Linked skill not found.")
            fields["skill_id"] = skill.id
    return fields


@bp.get("/tasks")
@token_required
def list_tasks():
    today = client_today()
    query = Task.query.filter_by(user_id=g.user.id)
    status = request.args.get("status")
    if status in STATUSES:
        query = query.filter_by(status=status)
    tasks = query.all()
    # Finished tasks older than 14 days drop out of the default list to keep it fast.
    cutoff = today - timedelta(days=14)
    tasks = [t for t in tasks if not (t.status == "done" and t.done_date and t.done_date < cutoff)]
    tasks.sort(key=lambda t: (-priority_score(t, today), t.id))
    return jsonify(tasks=[dict(t.to_dict(today), score=priority_score(t, today)) for t in tasks])


@bp.post("/tasks")
@token_required
def create_task():
    data = request.get_json(silent=True) or {}
    task = Task(user_id=g.user.id, **read_fields(data))
    status = data.get("status")
    if status in STATUSES:
        set_status(task, status, client_today())
    db.session.add(task)
    db.session.commit()
    return jsonify(task=task.to_dict(client_today())), 201


@bp.patch("/tasks/<int:task_id>")
@token_required
def update_task(task_id):
    task = owned_task(task_id)
    if task is None:
        return error("Task not found.", 404)
    data = request.get_json(silent=True) or {}
    for key, value in read_fields(data, existing=task).items():
        setattr(task, key, value)
    if "status" in data:
        if data["status"] not in STATUSES:
            raise ValidationError("Status must be todo, doing or done.")
        if data["status"] != task.status:
            set_status(task, data["status"], client_today())
    db.session.commit()
    return jsonify(task=task.to_dict(client_today()))


@bp.delete("/tasks/<int:task_id>")
@token_required
def delete_task(task_id):
    task = owned_task(task_id)
    if task is None:
        return error("Task not found.", 404)
    FocusSession.query.filter_by(task_id=task.id).update({"task_id": None})
    db.session.delete(task)
    db.session.commit()
    return jsonify(ok=True)


@bp.post("/focus")
@token_required
def log_focus():
    """Record a finished focus (Pomodoro) session, optionally against a task/skill."""
    data = request.get_json(silent=True) or {}
    minutes = number(data, "minutes", 1, 600, integer=True)
    day = parse_date(data.get("date"), default=client_today())

    task = None
    if data.get("task_id") not in (None, ""):
        task = owned_task(data.get("task_id"))
        if task is None:
            return error("Task not found.", 404)

    skill = None
    skill_id = data.get("skill_id") or (task.skill_id if task else None)
    if skill_id:
        skill = Skill.query.filter_by(id=skill_id, user_id=g.user.id).first()

    db.session.add(FocusSession(user_id=g.user.id, task_id=task.id if task else None, log_date=day, minutes=minutes))
    if task:
        task.spent_min = (task.spent_min or 0) + minutes
        if task.status == "todo":
            task.status = "doing"
    if skill:
        apply_practice(skill, round(minutes / 60, 2), day, note="Focus session")
    db.session.commit()
    return jsonify(ok=True, task=task.to_dict(client_today()) if task else None)

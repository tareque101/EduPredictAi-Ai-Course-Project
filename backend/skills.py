from datetime import date

from flask import Blueprint, g, jsonify, request

from auth import token_required
from extensions import db
from models import Skill

bp = Blueprint("skills", __name__, url_prefix="/api/skills")
LEVELS = {1, 2, 3, 4}


def owned_skill(skill_id):
    return Skill.query.filter_by(id=skill_id, user_id=g.user.id).first()


@bp.get("")
@token_required
def list_skills():
    items = Skill.query.filter_by(user_id=g.user.id).order_by(Skill.id).all()
    return jsonify(skills=[s.to_dict() for s in items])


@bp.post("")
@token_required
def create_skill():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    if not name:
        return jsonify(error="Skill name is required."), 400
    try:
        level = int(data.get("level", 1))
        goal = int(data.get("goal_level", 2))
    except (TypeError, ValueError):
        return jsonify(error="Level must be a number."), 400
    if level not in LEVELS or goal not in LEVELS:
        return jsonify(error="Level must be between 1 and 4."), 400

    skill = Skill(
        user_id=g.user.id,
        name=name[:100],
        category=str(data.get("category") or "Other")[:40],
        level=level,
        goal_level=goal,
        practice_hours=0.0,
    )
    db.session.add(skill)
    db.session.commit()
    return jsonify(skill=skill.to_dict()), 201


@bp.post("/<int:skill_id>/practice")
@token_required
def log_practice(skill_id):
    skill = owned_skill(skill_id)
    if skill is None:
        return jsonify(error="Skill not found."), 404
    data = request.get_json(silent=True) or {}
    try:
        hours = float(data.get("hours", 1))
    except (TypeError, ValueError):
        return jsonify(error="Hours must be a number."), 400
    if hours <= 0 or hours > 24:
        return jsonify(error="Hours must be between 0 and 24."), 400

    skill.practice_hours = round((skill.practice_hours or 0) + hours, 2)
    skill.last_practiced = date.today()
    db.session.commit()
    return jsonify(skill=skill.to_dict())


@bp.delete("/<int:skill_id>")
@token_required
def delete_skill(skill_id):
    skill = owned_skill(skill_id)
    if skill is None:
        return jsonify(error="Skill not found."), 404
    db.session.delete(skill)
    db.session.commit()
    return jsonify(ok=True)
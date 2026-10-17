from datetime import date

from flask import Blueprint, g, jsonify, request

from auth import token_required
from extensions import db
from models import Activity

bp = Blueprint("activities", __name__, url_prefix="/api/activities")
CATEGORIES = {"Academic", "Sports", "Cultural", "Social Service", "Tech", "Other"}


def owned_activity(activity_id):
    return Activity.query.filter_by(id=activity_id, user_id=g.user.id).first()


@bp.get("")
@token_required
def list_activities():
    items = (
        Activity.query.filter_by(user_id=g.user.id)
        .order_by(Activity.start_date.desc(), Activity.id.desc())
        .all()
    )
    return jsonify(activities=[a.to_dict() for a in items])


@bp.post("")
@token_required
def create_activity():
    data = request.get_json(silent=True) or {}

    title = str(data.get("title", "")).strip()
    if not title:
        return jsonify(error="Title is required."), 400

    try:
        start = date.fromisoformat(str(data.get("start_date", "")))
        end = date.fromisoformat(str(data["end_date"])) if data.get("end_date") else None
        hours = float(data.get("hours") or 0)
    except (ValueError, TypeError):
        return jsonify(error="Dates must be in YYYY-MM-DD format and hours must be a number."), 400

    if end and end < start:
        return jsonify(error="End date cannot be before start date."), 400
    if hours < 0 or hours > 2000:
        return jsonify(error="Hours must be between 0 and 2000."), 400

    category = data.get("category")
    if category not in CATEGORIES:
        category = "Other"

    activity = Activity(
        user_id=g.user.id,
        title=title[:120],
        organisation=str(data.get("organisation") or "").strip()[:120] or None,
        category=category,
        role=str(data.get("role") or "").strip()[:60] or None,
        start_date=start,
        end_date=end,
        hours=hours,
        certificate_url=str(data.get("certificate_url") or "").strip()[:255] or None,
        notes=str(data.get("notes") or "").strip()[:1000] or None,
    )
    db.session.add(activity)
    db.session.commit()
    return jsonify(activity=activity.to_dict()), 201


@bp.delete("/<int:activity_id>")
@token_required
def delete_activity(activity_id):
    activity = owned_activity(activity_id)
    if activity is None:
        return jsonify(error="Activity not found."), 404
    db.session.delete(activity)
    db.session.commit()
    return jsonify(ok=True)
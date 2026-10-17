from datetime import date

from flask import Blueprint, g, jsonify, request

from auth import token_required
from extensions import db
from models import HealthLog

bp = Blueprint("health_logs", __name__, url_prefix="/api/health-logs")


def _number(data, key, low, high, default):
    try:
        value = float(data.get(key, default))
    except (TypeError, ValueError):
        raise ValueError(f"'{key}' must be a number.")
    if not (low <= value <= high):
        raise ValueError(f"'{key}' must be between {low} and {high}.")
    return value


@bp.get("")
@token_required
def list_logs():
    logs = (
        HealthLog.query.filter_by(user_id=g.user.id)
        .order_by(HealthLog.log_date.desc())
        .limit(60)
        .all()
    )
    return jsonify(logs=[l.to_dict() for l in logs])


@bp.post("")
@token_required
def save_log():
    """Ek din-er jonno ekta log. Same din abar save korle update hoy."""
    data = request.get_json(silent=True) or {}
    try:
        log_date = date.fromisoformat(str(data.get("log_date") or date.today().isoformat()))
        values = {
            "sleep_hours": _number(data, "sleep_hours", 0, 24, 0),
            "sleep_quality": int(_number(data, "sleep_quality", 1, 5, 3)),
            "mood": int(_number(data, "mood", 1, 5, 3)),
            "stress": int(_number(data, "stress", 1, 5, 3)),
            "water_ml": int(_number(data, "water_ml", 0, 10000, 0)),
            "exercise_min": int(_number(data, "exercise_min", 0, 1440, 0)),
        }
    except ValueError as exc:
        return jsonify(error=str(exc)), 400

    log = HealthLog.query.filter_by(user_id=g.user.id, log_date=log_date).first()
    created = log is None
    if created:
        log = HealthLog(user_id=g.user.id, log_date=log_date)

    for key, value in values.items():
        setattr(log, key, value)
    log.notes = str(data.get("notes") or "").strip()[:1000] or None

    db.session.add(log)
    db.session.commit()
    return jsonify(log=log.to_dict()), (201 if created else 200)


@bp.delete("/<int:log_id>")
@token_required
def delete_log(log_id):
    log = HealthLog.query.filter_by(id=log_id, user_id=g.user.id).first()
    if log is None:
        return jsonify(error="Log not found."), 404
    db.session.delete(log)
    db.session.commit()
    return jsonify(ok=True)
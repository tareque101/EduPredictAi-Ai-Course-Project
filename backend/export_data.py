"""Download your own data as JSON or CSV."""
import csv
import io
import json
from datetime import datetime, timezone

from flask import Blueprint, Response, g, request

from auth import token_required
from models import Activity, ActivitySession, Habit, HabitLog, HealthLog, Skill, SkillLog, Task
from utils import error

bp = Blueprint("export", __name__, url_prefix="/api/export")


def _rows(user):
    uid = user.id
    return {
        "health": [r.to_dict() for r in HealthLog.query.filter_by(user_id=uid).order_by(HealthLog.log_date)],
        "habits": [r.to_dict() for r in Habit.query.filter_by(user_id=uid)],
        "habit_logs": [{"habit_id": r.habit_id, "date": r.log_date.isoformat(), "amount": r.amount} for r in HabitLog.query.filter_by(user_id=uid)],
        "skills": [r.to_dict() for r in Skill.query.filter_by(user_id=uid)],
        "skill_logs": [{"skill_id": r.skill_id, "date": r.log_date.isoformat(), "hours": r.hours, "note": r.note} for r in SkillLog.query.filter_by(user_id=uid)],
        "activities": [r.to_dict() for r in Activity.query.filter_by(user_id=uid)],
        "activity_sessions": [{"activity_id": r.activity_id, "date": r.log_date.isoformat(), "hours": r.hours, "note": r.note} for r in ActivitySession.query.filter_by(user_id=uid)],
        "tasks": [r.to_dict() for r in Task.query.filter_by(user_id=uid)],
    }


@bp.get("")
@token_required
def export():
    data = _rows(g.user)
    fmt = request.args.get("format", "json")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")

    if fmt == "json":
        payload = {"exported_at": datetime.now(timezone.utc).isoformat(), "user": g.user.to_dict(), **data}
        return Response(json.dumps(payload, indent=2), mimetype="application/json",
                        headers={"Content-Disposition": f"attachment; filename=edupredict-{stamp}.json"})

    kind = request.args.get("type", "health")
    if fmt != "csv" or kind not in data:
        return error(f"Use format=json, or format=csv with type in: {', '.join(data)}.")
    rows = data[kind]
    out = io.StringIO()
    if rows:
        writer = csv.DictWriter(out, fieldnames=list(rows[0].keys()), extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: ("" if v is None else v) for k, v in row.items() if not isinstance(v, (list, dict))})
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": f"attachment; filename=edupredict-{kind}-{stamp}.csv"})

from flask import Blueprint, jsonify, request
from extensions import db
from models import Habit, Activity, Skill, HealthLog

bp = Blueprint('analytics', __name__, url_prefix='/api')

@bp.route('/analytics', methods=['GET'])
def get_analytics():
    # Note: Apni user authentication ba user_id session/token theke nite paren. 
    # Ekhane prottek model theke data query korar structure dewa holo:
    try:
        # 1. Habits Summary
        habits = Habit.query.all()
        total_habits = len(habits)
        avg_streak = sum(h.streak for h in habits) / total_habits if total_habits > 0 else 0

        # 2. Activities / ECA Summary
        activities = Activity.query.all()
        total_activities = len(activities)
        total_eca_hours = sum(a.hours for a in activities)

        # 3. Skills Summary
        skills = Skill.query.all()
        total_skills = len(skills)
        avg_skill_level = sum(s.level for s in skills) / total_skills if total_skills > 0 else 0

        # 4. Health Logs Summary (e.g., average sleep hours)
        health_logs = HealthLog.query.all()
        total_logs = len(health_logs)
        avg_sleep = sum(h.sleep_hours for h in health_logs) / total_logs if total_logs > 0 else 7.0

        data = {
            "latest_cgpa": 3.75, # Dynamic ba fixed rakhte paren
            "avg_sleep": round(avg_sleep, 1),
            "habit_summary": {
                "total_habits": total_habits,
                "avg_streak": round(avg_streak, 1)
            },
            "eca_summary": {
                "active_activities": total_activities,
                "hours_logged": total_eca_hours
            },
            "skills_summary": {
                "total_skills": total_skills,
                "avg_level": round(avg_skill_level, 1)
            },
            "health_summary": {
                "total_logs": total_logs
            }
        }
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
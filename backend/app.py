"""
EduPredict AI - Machine Learning API
------------------------------------
Flask service exposing:
  POST /api/predict  -> predicts CGPA and risk level from study habits
  POST /api/chat     -> mock study-assistant chatbot

If cgpa_model.pkl is missing or unreadable, a deterministic algorithmic
fallback is used so the application never crashes.
"""

import logging
import math
import os
import time
from datetime import datetime, timezone

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "cgpa_model.pkl")
FEATURE_COLUMNS = ["studyHours", "sleepHours", "socialHours", "attendancePct"]
FIELD_RULES = {
    "studyHours": (0.0, 24.0),
    "sleepHours": (0.0, 24.0),
    "socialHours": (0.0, 24.0),
    "attendancePct": (0.0, 100.0),
}

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("edupredict")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# ---------------------------------------------------------------------------
# Model loading with graceful fallback
# ---------------------------------------------------------------------------
def load_model():
    """Load the pre-trained scikit-learn model. Returns None if unavailable."""
    try:
        model = joblib.load(MODEL_PATH)
        logger.info("Loaded trained model from %s", MODEL_PATH)
        return model
    except FileNotFoundError:
        logger.warning("cgpa_model.pkl not found. Using algorithmic fallback.")
    except Exception as exc:  # corrupted file, version mismatch, etc.
        logger.error("Failed to load model (%s). Using algorithmic fallback.", exc)
    return None


MODEL = load_model()


def fallback_cgpa(study_hours, sleep_hours, social_hours, attendance_pct):
    """
    Deterministic heuristic CGPA estimator (0.0 - 4.0 scale).
      - Study time has a positive, capped effect.
      - Sleep is optimal around 7.5 hours; deviation is penalised.
      - Excess social time is penalised beyond 3 hours/day.
      - Attendance contributes linearly.
    """
    score = 1.2
    score += 0.12 * min(study_hours, 8.0)
    score -= 0.10 * min(abs(sleep_hours - 7.5), 4.0)
    score -= 0.05 * max(social_hours - 3.0, 0.0)
    score += 0.012 * attendance_pct
    return score


def predict_cgpa(study_hours, sleep_hours, social_hours, attendance_pct):
    """Return (predicted_cgpa, source) using the trained model when available."""
    if MODEL is not None:
        features = pd.DataFrame(
            [[study_hours, sleep_hours, social_hours, attendance_pct]],
            columns=FEATURE_COLUMNS,
        )
        raw = float(MODEL.predict(features)[0])
        source = "model"
    else:
        raw = fallback_cgpa(study_hours, sleep_hours, social_hours, attendance_pct)
        source = "fallback"

    clamped = min(max(raw, 0.0), 4.0)
    return round(clamped, 2), source


def classify_risk(cgpa):
    """Map a predicted CGPA to a human-readable risk level."""
    if cgpa >= 3.0:
        return "Low"
    if cgpa >= 2.5:
        return "Moderate"
    return "High"


def parse_inputs(payload):
    """Validate and coerce the incoming JSON payload. Raises ValueError on failure."""
    values = {}
    for field, (low, high) in FIELD_RULES.items():
        if field not in payload:
            raise ValueError(f"Missing required field '{field}'.")
        try:
            value = float(payload[field])
        except (TypeError, ValueError):
            raise ValueError(f"'{field}' must be a number.")
        if not math.isfinite(value) or not (low <= value <= high):
            raise ValueError(f"'{field}' must be between {low} and {high}.")
        values[field] = value
    return values


# ---------------------------------------------------------------------------
# Chatbot (mock study assistant)
# ---------------------------------------------------------------------------
CHAT_RESPONSES = {
    "sleep": (
        "Sleep is one of the strongest predictors of academic performance. "
        "Aim for 7 to 8 hours and keep a consistent bedtime. Even one hour "
        "more per night can noticeably improve memory consolidation."
    ),
    "study": (
        "Try a focused plan: 50 minutes of deep work followed by a 10-minute "
        "break (Pomodoro style). Start with your hardest subject while your "
        "energy is highest, and schedule two short review sessions per week."
    ),
    "exam": (
        "For exam preparation: list the topics, rate your confidence in each, "
        "then spend most of your time on the weakest ones. Practise past "
        "questions under timed conditions in the final week."
    ),
    "cgpa": (
        "To raise your CGPA, prioritise the courses with the highest credit "
        "weight, attend classes consistently (attendance strongly correlates "
        "with quiz scores), and keep your sleep stable during exam weeks."
    ),
    "attendance": (
        "Attendance is one of the easiest levers to improve. Set a calendar "
        "reminder 15 minutes before each class and sit near the front to stay "
        "engaged."
    ),
    "plan": (
        "Here is a simple weekly revision plan: Monday and Wednesday for "
        "theory, Tuesday and Thursday for problem solving, Friday for a "
        "mini-test, and the weekend for review and rest."
    ),
}
DEFAULT_REPLY = (
    "I can help with study planning, sleep habits, exam preparation, "
    "attendance, or improving your CGPA. What would you like to focus on?"
)


def mock_chat_reply(message):
    """Return a keyword-matched canned reply for the study assistant."""
    lowered = message.lower()
    for keyword, reply in CHAT_RESPONSES.items():
        if keyword in lowered:
            return reply
    return DEFAULT_REPLY


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify(
        status="ok",
        modelLoaded=MODEL is not None,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.route("/api/predict", methods=["POST"])
def predict():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="Request body must be a JSON object."), 400

    try:
        values = parse_inputs(payload)
    except ValueError as exc:
        return jsonify(error=str(exc)), 400

    predicted, source = predict_cgpa(
        values["studyHours"],
        values["sleepHours"],
        values["socialHours"],
        values["attendancePct"],
    )
    return jsonify(
        predictedCgpa=predicted,
        riskLevel=classify_risk(predicted),
        source=source,
        inputs=values,
    )


@app.route("/api/chat", methods=["POST"])
def chat():
    payload = request.get_json(silent=True) or {}
    message = str(payload.get("message", "")).strip()
    if not message:
        return jsonify(error="'message' is required."), 400

    time.sleep(0.5)  # simulate model latency for a realistic UI feel
    return jsonify(
        reply=mock_chat_reply(message),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.errorhandler(404)
def not_found(_):
    return jsonify(error="Endpoint not found."), 404


@app.errorhandler(500)
def server_error(_):
    return jsonify(error="Internal server error."), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
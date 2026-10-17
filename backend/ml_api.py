import json
import logging
import math
import os
import time
from datetime import datetime, timezone

import joblib
import pandas as pd
from flask import Blueprint, jsonify, request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "cgpa_model.pkl")
METRICS_PATH = os.path.join(BASE_DIR, "metrics.json")
FEATURE_COLUMNS = ["studyHours", "sleepHours", "socialHours", "attendancePct"]
FIELD_RULES = {
    "studyHours": (0.0, 24.0),
    "sleepHours": (0.0, 24.0),
    "socialHours": (0.0, 24.0),
    "attendancePct": (0.0, 100.0),
}

logger = logging.getLogger("edupredict")
bp = Blueprint("ml", __name__, url_prefix="/api")


def load_model():
    try:
        model = joblib.load(MODEL_PATH)
        logger.info("Loaded trained model from %s", MODEL_PATH)
        return model
    except FileNotFoundError:
        logger.warning("cgpa_model.pkl not found. Using algorithmic fallback.")
    except Exception as exc:
        logger.error("Failed to load model (%s). Using algorithmic fallback.", exc)
    return None


MODEL = load_model()


def fallback_cgpa(study_hours, sleep_hours, social_hours, attendance_pct):
    score = 1.2
    score += 0.12 * min(study_hours, 8.0)
    score -= 0.10 * min(abs(sleep_hours - 7.5), 4.0)
    score -= 0.05 * max(social_hours - 3.0, 0.0)
    score += 0.012 * attendance_pct
    return score


def predict_cgpa(study_hours, sleep_hours, social_hours, attendance_pct):
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
    return round(min(max(raw, 0.0), 4.0), 2), source


def classify_risk(cgpa):
    if cgpa >= 3.0:
        return "Low"
    if cgpa >= 2.5:
        return "Moderate"
    return "High"


def parse_inputs(payload):
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


CHAT_RESPONSES = {
    "sleep": (
        "Sleep is one of the strongest predictors of academic performance. "
        "Aim for 7 to 8 hours and keep a consistent bedtime."
    ),
    "study": (
        "Try a focused plan: 50 minutes of deep work followed by a 10-minute break. "
        "Start with your hardest subject while your energy is highest."
    ),
    "exam": (
        "For exam preparation, list the topics, rate your confidence in each, "
        "then spend most of your time on the weakest ones."
    ),
    "cgpa": (
        "To raise your CGPA, prioritise high-credit courses, attend classes consistently, "
        "and keep your sleep stable during exam weeks."
    ),
    "attendance": "Set a reminder 15 minutes before each class and sit near the front to stay engaged.",
    "plan": (
        "A simple weekly plan: theory on Monday and Wednesday, problem solving on Tuesday "
        "and Thursday, a mini-test on Friday, and review plus rest at the weekend."
    ),
}
DEFAULT_REPLY = (
    "I can help with study planning, sleep habits, exam preparation, attendance, "
    "or improving your CGPA. What would you like to focus on?"
)


def mock_chat_reply(message):
    lowered = message.lower()
    for keyword, reply in CHAT_RESPONSES.items():
        if keyword in lowered:
            return reply
    return DEFAULT_REPLY


@bp.get("/health")
def health():
    return jsonify(status="ok", modelLoaded=MODEL is not None)


@bp.post("/predict")
def predict():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="Request body must be a JSON object."), 400
    try:
        values = parse_inputs(payload)
    except ValueError as exc:
        return jsonify(error=str(exc)), 400

    predicted, source = predict_cgpa(
        values["studyHours"], values["sleepHours"], values["socialHours"], values["attendancePct"]
    )
    return jsonify(
        predictedCgpa=predicted,
        riskLevel=classify_risk(predicted),
        source=source,
        inputs=values,
    )


@bp.post("/chat")
def chat():
    payload = request.get_json(silent=True) or {}
    message = str(payload.get("message", "")).strip()
    if not message:
        return jsonify(error="'message' is required."), 400
    time.sleep(0.5)
    return jsonify(reply=mock_chat_reply(message), timestamp=datetime.now(timezone.utc).isoformat())


@bp.get("/model-info")
def model_info():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, encoding="utf-8") as f:
            return jsonify(json.load(f))
    return jsonify(available=False, message="Run train_model.py to generate model metrics.")
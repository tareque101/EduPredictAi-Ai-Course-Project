import json
import logging
import math
import os

import joblib
import numpy as np
import pandas as pd
from flask import Blueprint, jsonify, request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACT_DIR = os.path.join(BASE_DIR, "ml_artifacts")
MODEL_PATH = os.path.join(ARTIFACT_DIR, "model.joblib")
PREPROCESSOR_PATH = os.path.join(ARTIFACT_DIR, "preprocessor.joblib")
IQR_PATH = os.path.join(ARTIFACT_DIR, "iqr_bounds.json")
METRICS_PATH = os.path.join(BASE_DIR, "metrics.json")

logger = logging.getLogger("edupredict")
bp = Blueprint("ml", __name__, url_prefix="/api")

GENDERS = ["Male", "Female"]
MAJORS = ["Engineering", "Business", "Mathematics", "Economics", "Psychology", "Computer Science"]

# API field: (dataset column, min, max)
NUMERIC_RULES = {
    "age": ("Age", 15, 40),
    "attendancePct": ("Attendance_Pct", 0, 100),
    "studyHours": ("Study_Hours_Per_Day", 0, 24),
    "previousCgpa": ("Previous_CGPA", 0, 4),
    "sleepHours": ("Sleep_Hours", 0, 24),
    "socialHours": ("Social_Hours_Week", 0, 168),  # weekly hours
}
# API field: (dataset column, allowed values)
CATEGORY_RULES = {
    "gender": ("Gender", GENDERS),
    "major": ("Major", MAJORS),
}


def load_artifacts():
    try:
        model = joblib.load(MODEL_PATH)
        preprocessor = joblib.load(PREPROCESSOR_PATH)
        with open(IQR_PATH, encoding="utf-8") as f:
            bounds = json.load(f)
        logger.info("Loaded CGPA model artifacts from %s", ARTIFACT_DIR)
        return model, preprocessor, bounds
    except FileNotFoundError as exc:
        logger.error("ML artifact missing: %s", exc)
    except Exception as exc:
        logger.error("Failed to load ML artifacts (%s)", exc)
    return None, None, None


MODEL, PREPROCESSOR, IQR_BOUNDS = load_artifacts()


def add_features(d):
    d = d.copy()
    d["Daily_Social_Hours"] = d["Social_Hours_Week"] / 7.0
    d["Study_to_Social_Ratio"] = d["Study_Hours_Per_Day"] / (d["Daily_Social_Hours"] + 0.1)
    d["Rest_Balance_Index"] = d["Sleep_Hours"] / (d["Study_Hours_Per_Day"] + 0.1)
    d["Productive_Hours"] = d["Study_Hours_Per_Day"] + d["Daily_Social_Hours"]
    d["Academic_Engagement_Score"] = (d["Attendance_Pct"] / 100.0) * d["Study_Hours_Per_Day"]
    d["CGPA_Attendance_Interaction"] = d["Previous_CGPA"] * (d["Attendance_Pct"] / 100.0)
    d["Previous_CGPA_Squared"] = d["Previous_CGPA"] ** 2

    d["Attendance_Level"] = pd.cut(
        d["Attendance_Pct"],
        bins=[0, 70, 85, 100],
        labels=["At_Risk_Attendance", "Moderate_Attendance", "Optimal_Attendance"],
        include_lowest=True,
    ).astype(str)

    d["Study_Pace"] = pd.cut(
        d["Study_Hours_Per_Day"],
        bins=[0, 2.5, 5.0, 24],
        labels=["Low_Study", "Standard_Study", "High_Study"],
        include_lowest=True,
    ).astype(str)

    conditions = [
        (d["Sleep_Hours"] < 6.0) & (d["Study_Hours_Per_Day"] > 6.0),
        (d["Daily_Social_Hours"] > 2.5) & (d["Study_Hours_Per_Day"] < 2.5),
    ]
    d["Lifestyle_Profile"] = np.select(
        conditions, ["Burnout_Risk", "Social_Dominant"], default="Balanced"
    )
    return d


def parse_inputs(payload):
    values = {}
    for field, (_, low, high) in NUMERIC_RULES.items():
        if field not in payload or payload[field] in ("", None):
            raise ValueError(f"Missing required field '{field}'.")
        try:
            value = float(payload[field])
        except (TypeError, ValueError):
            raise ValueError(f"'{field}' must be a number.")
        if not math.isfinite(value) or not (low <= value <= high):
            raise ValueError(f"'{field}' must be between {low} and {high}.")
        values[field] = value

    for field, (_, allowed) in CATEGORY_RULES.items():
        value = str(payload.get(field, "")).strip()
        if value not in allowed:
            raise ValueError(f"'{field}' must be one of: {', '.join(allowed)}.")
        values[field] = value

    return values


def build_features(values):
    row = {}
    for field, (column, _, _) in NUMERIC_RULES.items():
        row[column] = values[field]
    for field, (column, _) in CATEGORY_RULES.items():
        row[column] = values[field]

    df = add_features(pd.DataFrame([row]))
    for col, (lo, hi) in IQR_BOUNDS.items():
        df[col] = df[col].clip(lo, hi)
    return df


def predict_cgpa(values):
    df = build_features(values)
    X = PREPROCESSOR.transform(df)
    raw = float(MODEL.predict(X)[0])
    return round(min(max(raw, 0.0), 4.0), 2)


def classify_risk(cgpa):
    if cgpa >= 3.0:
        return "Low"
    if cgpa >= 2.5:
        return "Moderate"
    return "High"


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

    if MODEL is None:
        return jsonify(error="Prediction model is not loaded on the server."), 503

    try:
        predicted = predict_cgpa(values)
    except Exception:
        logger.exception("Prediction failed")
        return jsonify(error="Prediction failed."), 500

    return jsonify(
        predictedCgpa=predicted,
        riskLevel=classify_risk(predicted),
        source="model",
        inputs=values,
    )


@bp.get("/model-info")
def model_info():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, encoding="utf-8") as f:
            return jsonify(json.load(f))
    return jsonify(available=False, message="Run train_model.py to generate model metrics.")
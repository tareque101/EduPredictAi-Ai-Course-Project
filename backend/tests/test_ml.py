"""Prediction endpoints, tested with a small model trained on the project dataset."""
import pandas as pd
import pytest
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler

import ml_api
from train_model import CAT, NUM, iqr_bounds, CLIP_COLUMNS

PAYLOAD = {"age": 21, "gender": "Male", "major": "Computer Science", "attendancePct": 85,
           "studyHours": 4, "previousCgpa": 3.1, "sleepHours": 7, "socialHours": 10}


@pytest.fixture()
def tiny_model(monkeypatch):
    df = ml_api.add_features(pd.read_csv("data/students.csv").head(800))
    bounds = iqr_bounds(df)
    pre = ColumnTransformer([("num", StandardScaler(), NUM), ("cat", OneHotEncoder(handle_unknown="ignore"), CAT)])
    model = GradientBoostingRegressor(n_estimators=20, random_state=1).fit(pre.fit_transform(df[NUM + CAT]), df["Final_CGPA"])
    monkeypatch.setattr(ml_api, "MODEL", model)
    monkeypatch.setattr(ml_api, "PREPROCESSOR", pre)
    monkeypatch.setattr(ml_api, "IQR_BOUNDS", bounds)
    assert set(bounds) == set(CLIP_COLUMNS)


def test_predict_and_insights(client, tiny_model):
    r = client.post("/api/predict", json=PAYLOAD).get_json()
    assert 0 <= r["predictedCgpa"] <= 4 and r["riskLevel"] in ("Low", "Moderate", "High")
    ins = client.post("/api/predict/insights", json=PAYLOAD).get_json()
    assert ins["predictedCgpa"] == r["predictedCgpa"]
    assert [s["key"] for s in ins["scenarios"]] == ["sleep", "study", "attendance", "social"]
    assert all("delta" in s for s in ins["scenarios"])


def test_predict_rejects_bad_input(client, tiny_model):
    assert client.post("/api/predict/insights", json={**PAYLOAD, "sleepHours": 40}).status_code == 400
    assert client.post("/api/predict/insights", json={**PAYLOAD, "major": "Art"}).status_code == 400
    bad = {k: v for k, v in PAYLOAD.items() if k != "age"}
    assert client.post("/api/predict", json=bad).status_code == 400

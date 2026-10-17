"""
Generates a synthetic training dataset and trains a RandomForestRegressor.
Output: cgpa_model.pkl (loaded automatically by app.py).
"""

import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

RNG = np.random.default_rng(42)
N_SAMPLES = 5000
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cgpa_model.pkl")


def true_cgpa(study, sleep, social, attendance):
    """Ground-truth relationship used to synthesise labels (mirrors app.py fallback)."""
    score = 1.2
    score += 0.12 * np.minimum(study, 8.0)
    score -= 0.10 * np.minimum(np.abs(sleep - 7.5), 4.0)
    score -= 0.05 * np.maximum(social - 3.0, 0.0)
    score += 0.012 * attendance
    return np.clip(score, 0.0, 4.0)


def generate_dataset(n):
    study = RNG.uniform(0, 10, n)
    sleep = RNG.uniform(3, 10, n)
    social = RNG.uniform(0, 8, n)
    attendance = RNG.uniform(40, 100, n)
    cgpa = true_cgpa(study, sleep, social, attendance) + RNG.normal(0, 0.1, n)
    df = pd.DataFrame({
        "studyHours": study,
        "sleepHours": sleep,
        "socialHours": social,
        "attendancePct": attendance,
        "cgpa": np.clip(cgpa, 0.0, 4.0),
    })
    return df


def main():
    df = generate_dataset(N_SAMPLES)
    features = ["studyHours", "sleepHours", "socialHours", "attendancePct"]
    X_train, X_test, y_train, y_test = train_test_split(
        df[features], df["cgpa"], test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=42)
    model.fit(X_train, y_train)

    score = model.score(X_test, y_test)
    print(f"Test R^2: {score:.4f}")

    joblib.dump(model, OUTPUT_PATH)
    print(f"Model saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ml_api import add_features

df = pd.read_csv("data/students.csv")
df = add_features(df)

NUM = [
    "Age", "Attendance_Pct", "Study_Hours_Per_Day", "Previous_CGPA",
    "Sleep_Hours", "Social_Hours_Week", "Daily_Social_Hours",
    "Study_to_Social_Ratio", "Rest_Balance_Index", "Productive_Hours",
    "Academic_Engagement_Score", "CGPA_Attendance_Interaction",
    "Previous_CGPA_Squared",
]
CAT = ["Gender", "Major", "Attendance_Level", "Study_Pace", "Lifestyle_Profile"]

X, y = df[NUM + CAT], df["Final_CGPA"]
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

pre = ColumnTransformer([
    ("num", StandardScaler(), NUM),
    ("cat", OneHotEncoder(handle_unknown="ignore"), CAT),
])
model = make_pipeline(
    pre,
    GradientBoostingRegressor(n_estimators=300, learning_rate=0.05, max_depth=3, random_state=42),
)
model.fit(X_tr, y_tr)
pred = np.clip(model.predict(X_te), 0, 4)

print("Train rows:", len(X_tr), "| Test rows:", len(X_te))
print("Test MAE   :", round(mean_absolute_error(y_te, pred), 3))
print("Test R2    :", round(r2_score(y_te, pred), 3))
print("Within 0.25:", round((np.abs(pred - y_te) <= 0.25).mean() * 100, 1), "%")
from datetime import date, timedelta

from stats import consecutive_streak, level_from_xp, pearson, wellbeing_score


def iso(offset=0):
    return (date.today() + timedelta(days=offset)).isoformat()


def seed_basic(user):
    hid = user.post("/api/habits", {"name": "Study", "target": 2, "step": 1, "unit": "hrs", "category": "Study"}).get_json()["habit"]["id"]
    sid = user.post("/api/skills", {"name": "Python"}).get_json()["skill"]["id"]
    aid = user.post("/api/activities", {"title": "Club", "start_date": iso(-30), "role": "President"}).get_json()["activity"]["id"]
    return hid, sid, aid


def test_checkin_logs_everything_at_once(user):
    hid, sid, aid = seed_basic(user)
    res = user.post("/api/tracker/checkin", {
        "health": {"sleep_hours": 7.5, "mood": 4},
        "habits": [{"id": hid, "amount": 2}],
        "skills": [{"id": sid, "hours": 1}],
        "eca": [{"id": aid, "hours": 2}],
    })
    assert res.status_code == 200
    body = res.get_json()
    assert body["applied"] == {"health": True, "habits": 1, "skills": 1, "eca": 1}
    t = body["today"]
    assert t["health"]["sleep_hours"] == 7.5
    assert t["habits"][0]["done"] is True
    assert t["progress"]["pct"] == 100 and t["streak"] == 1


def test_checkin_is_atomic_and_validated(user, other):
    hid, sid, _ = seed_basic(user)
    res = user.post("/api/tracker/checkin", {"health": {"mood": 5}, "skills": [{"id": 9999, "hours": 1}]})
    assert res.status_code == 400
    assert user.get("/api/health-logs").get_json()["logs"] == []  # nothing saved
    assert user.post("/api/tracker/checkin", {}).status_code == 400
    assert other.post("/api/tracker/checkin", {"skills": [{"id": sid, "hours": 1}]}).status_code == 400
    assert user.post("/api/tracker/checkin", {"habits": [{"id": hid}], "date": iso(-1)}).status_code == 400


def test_feed_orders_newest_first(user):
    hid, sid, _ = seed_basic(user)
    user.post("/api/skills/%d/practice" % sid, {"hours": 1, "date": iso(-3)})
    user.post("/api/habits/%d/log" % hid)
    events = user.get("/api/tracker/feed").get_json()["events"]
    assert events[0]["type"] == "habit" and events[-1]["type"] == "skill"


def test_analytics_empty_state(user):
    data = user.get("/api/analytics?days=14").get_json()
    assert data["has_data"] is False and len(data["daily"]) == 14
    assert data["overview"]["wellbeing_score"] is None


def test_analytics_reflects_tracked_data(user):
    hid, sid, aid = seed_basic(user)
    for i in range(8):
        user.post("/api/health-logs", {"log_date": iso(-i), "sleep_hours": 5 + i * 0.5, "mood": min(5, 2 + i // 2), "stress": 3, "energy_level": min(5, 1 + i // 2), "exercise_min": 10 * i})
    user.post("/api/tracker/checkin", {"habits": [{"id": hid, "amount": 2}], "skills": [{"id": sid, "hours": 2}], "eca": [{"id": aid, "hours": 3}]})
    user.post("/api/tasks", {"title": "Old", "due_date": iso(-2)})
    d = user.get("/api/analytics?days=14").get_json()
    assert d["has_data"] and d["health"]["logged_days"] == 8
    assert d["skills"]["hours_in_period"] == 2 and d["eca"]["hours_in_period"] == 3
    assert d["eca"]["leadership_roles"] == 1 and d["tasks"]["overdue"] == 1
    assert d["daily"][-1]["habit_completion"] == 100
    assert any(c["x"] == "sleep_hours" and c["y"] == "mood" and c["r"] > 0.5 for c in d["correlations"])
    assert {b["axis"] for b in d["balance"]} == {"Health", "Habits", "Skills", "ECA", "Tasks", "Consistency"}
    assert any(i["id"] == "overdue" for i in d["insights"])


def test_analytics_is_per_user(user, other):
    seed_basic(user)
    user.post("/api/health-logs", {"sleep_hours": 8, "mood": 5})
    d = other.get("/api/analytics").get_json()
    assert d["has_data"] is False and d["health"]["logged_days"] == 0 and d["habits"]["total"] == 0


def test_predict_inputs_from_tracking(user):
    user.patch("/api/auth/profile", {"current_cgpa": 3.2, "attendance_pct": 88, "major": "Engineering", "gender": "Male", "age": 21})
    user.post("/api/health-logs", {"sleep_hours": 7})
    sid = user.post("/api/skills", {"name": "Math"}).get_json()["skill"]["id"]
    user.post(f"/api/skills/{sid}/practice", {"hours": 14})
    d = user.get("/api/analytics/predict-inputs").get_json()
    assert d["inputs"]["sleepHours"] == 7 and d["inputs"]["studyHours"] == 1.0
    assert d["missing"] == ["socialHours"] and "previousCgpa" in d["sources"]


def test_gamification_and_achievements(user):
    hid, sid, _ = seed_basic(user)
    user.post("/api/health-logs", {"sleep_hours": 8})
    user.post(f"/api/skills/{sid}/practice", {"hours": 2})
    g = user.get("/api/gamification").get_json()
    assert g["xp"] == 10 + 20 and g["level"] == 1
    first = next(a for a in g["achievements"] if a["key"] == "first-checkin")
    assert first["unlocked"] and g["unlocked"] >= 2  # leader role also unlocked


def test_export_and_demo_and_clear(user):
    assert user.post("/api/demo/seed").status_code == 201
    assert user.post("/api/demo/seed").status_code == 409
    j = user.get("/api/export?format=json")
    assert j.status_code == 200 and j.get_json()["health"] and "attachment" in j.headers["Content-Disposition"]
    csv = user.get("/api/export?format=csv&type=health")
    assert csv.status_code == 200 and csv.data.decode().startswith("id,log_date")
    assert user.get("/api/export?format=csv&type=nope").status_code == 400
    d = user.get("/api/analytics?days=30").get_json()
    assert d["has_data"] and d["habits"]["total"] == 4 and len(d["insights"]) > 0
    assert user.delete("/api/demo/clear").status_code == 200
    assert user.get("/api/analytics").get_json()["has_data"] is False


def test_chat_local_coach_and_safety(user, client):
    r = client.post("/api/chat", json={"message": "tips for better sleep"}).get_json()
    assert r["source"] == "local" and "7-9" in r["reply"] and r["suggestions"]
    user.post("/api/health-logs", {"sleep_hours": 5})
    r = client.post("/api/chat", json={"message": "help me sleep"}, headers=user.headers).get_json()
    assert "5.0 h" in r["reply"]  # personalised from the student's own data
    r = client.post("/api/chat", json={"message": "I want to die"}).get_json()
    assert "trust" in r["reply"] and "helpline" in r["reply"]
    assert client.post("/api/chat", json={"message": " "}).status_code == 400
    assert client.get("/api/chat/starters").get_json()["starters"]


def test_chat_falls_back_when_ai_fails(client, monkeypatch):
    import chat
    monkeypatch.setenv("OPENROUTER_API_KEY", "x")
    monkeypatch.setattr(chat, "ask_openrouter", lambda *a: (_ for _ in ()).throw(chat.requests.RequestException("down")))
    r = client.post("/api/chat", json={"message": "plan my week"})
    assert r.status_code == 200 and r.get_json()["source"] == "local"


def test_predict_validation_without_model(client):
    r = client.post("/api/predict/insights", json={"age": 21})
    assert r.status_code == 400


def test_migration_adds_missing_columns(tmp_path):
    import sqlite3
    from config import Config
    from app import create_app
    path = tmp_path / "old.db"
    con = sqlite3.connect(path)
    con.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(160) NOT NULL, password_hash VARCHAR(255) NOT NULL, created_at DATETIME)")
    con.execute("CREATE TABLE health_logs (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, log_date DATE NOT NULL, sleep_hours FLOAT, sleep_quality INTEGER, mood INTEGER, stress INTEGER, water_ml INTEGER, exercise_min INTEGER, notes TEXT)")
    con.execute("INSERT INTO users VALUES (1,'Old','old@gmail.com','x',NULL)")
    con.commit(); con.close()

    class Old(Config):
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{path}"
    app = create_app(Old)
    con = sqlite3.connect(path)
    cols = {r[1] for r in con.execute("PRAGMA table_info(health_logs)")}
    assert {"screen_time_hrs", "caffeine_cups", "energy_level"} <= cols
    assert con.execute("SELECT name FROM users").fetchone()[0] == "Old"
    with app.app_context():
        from extensions import db
        db.engine.dispose()


# ---------- pure stats ----------
def test_stats_functions():
    assert round(pearson([1, 2, 3, 4], [2, 4, 6, 8]), 2) == 1.0
    assert pearson([1, 1, 1], [1, 2, 3]) is None and pearson([1, 2], [1, 2]) is None
    t = date(2026, 11, 10)
    days = {t - timedelta(days=i) for i in (0, 1, 2, 5, 6)}
    assert consecutive_streak(days, t) == {"current": 3, "longest": 3}
    assert consecutive_streak({t - timedelta(days=1)}, t)["current"] == 1  # yesterday still counts
    assert consecutive_streak({t - timedelta(days=3)}, t)["current"] == 0
    assert wellbeing_score(sleep=8, mood=5, stress=1, energy=5, exercise=30, water=2000) == 100
    assert wellbeing_score() is None
    assert wellbeing_score(sleep=8) == 100  # weights renormalise when data is partial
    assert level_from_xp(0)["level"] == 1 and level_from_xp(50)["level"] == 2 and level_from_xp(200)["level"] == 3

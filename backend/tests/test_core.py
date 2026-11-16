from datetime import date, timedelta


def iso(offset=0):
    return (date.today() + timedelta(days=offset)).isoformat()


# ---------- auth ----------
def test_register_rules_and_login(client):
    bad = client.post("/api/auth/register", json={"name": "X", "email": "x@evil.com", "password": "secret12"})
    assert bad.status_code == 403
    ok = client.post("/api/auth/register", json={"name": "X", "email": "x@gmail.com", "password": "secret12"})
    assert ok.status_code == 201
    assert client.post("/api/auth/register", json={"name": "X", "email": "x@gmail.com", "password": "secret12"}).status_code == 409
    assert client.post("/api/auth/login", json={"email": "x@gmail.com", "password": "nope"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "x@gmail.com", "password": "secret12"}).status_code == 200


def test_protected_routes_need_token(client):
    for url in ("/api/habits", "/api/analytics", "/api/tasks", "/api/tracker/today", "/api/gamification"):
        assert client.get(url).status_code == 401, url
    assert client.get("/api/habits", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_profile_update_and_password(user, client):
    res = user.patch("/api/auth/profile", {"name": "Alice B", "current_cgpa": 3.4, "target_cgpa": 3.8, "attendance_pct": 90, "major": "Computer Science", "age": 21})
    assert res.status_code == 200 and res.get_json()["user"]["current_cgpa"] == 3.4
    assert user.patch("/api/auth/profile", {"current_cgpa": 7}).status_code == 400
    assert user.patch("/api/auth/profile", {"major": "Basket Weaving"}).status_code == 400
    assert user.post("/api/auth/change-password", {"current_password": "wrong", "new_password": "newpass1"}).status_code == 403
    assert user.post("/api/auth/change-password", {"current_password": "secret12", "new_password": "newpass1"}).status_code == 200
    assert client.post("/api/auth/login", json={"email": "alice@gmail.com", "password": "newpass1"}).status_code == 200


# ---------- habits ----------
def test_habit_log_undo_and_streak(user):
    h = user.post("/api/habits", {"name": "Study", "target": 3, "step": 1, "unit": "hrs", "category": "Study"}).get_json()["habit"]
    hid = h["id"]
    r = user.post(f"/api/habits/{hid}/log").get_json()["habit"]
    assert r["current"] == 1 and r["streak"] == 1
    r = user.post(f"/api/habits/{hid}/log", {"amount": 2}).get_json()["habit"]
    assert r["current"] == 3 and r["streak"] == 1
    assert r["week"][-1]["amount"] == 3
    r = user.delete(f"/api/habits/{hid}/log").get_json()["habit"]
    assert r["current"] == 1 and r["streak"] == 1
    r = user.delete(f"/api/habits/{hid}/log").get_json()["habit"]
    assert r["current"] == 0 and r["streak"] == 0
    assert user.delete(f"/api/habits/{hid}/log").status_code == 400


def test_habit_validation_edit_and_isolation(user, other):
    assert user.post("/api/habits", {"name": "", "target": 1}).status_code == 400
    assert user.post("/api/habits", {"name": "A", "target": -1}).status_code == 400
    hid = user.post("/api/habits", {"name": "Read", "target": 10, "step": 2}).get_json()["habit"]["id"]
    assert user.patch(f"/api/habits/{hid}", {"target": 20}).get_json()["habit"]["target"] == 20
    assert other.post(f"/api/habits/{hid}/log").status_code == 404
    assert other.delete(f"/api/habits/{hid}").status_code == 404
    assert other.get("/api/habits").get_json()["habits"] == []


def test_stale_streak_reads_as_zero(app, user):
    from extensions import db
    from models import Habit
    hid = user.post("/api/habits", {"name": "Old", "target": 1}).get_json()["habit"]["id"]
    with app.app_context():
        h = db.session.get(Habit, hid)
        h.streak, h.last_logged = 9, date.today() - timedelta(days=5)
        db.session.commit()
    assert user.get("/api/habits").get_json()["habits"][0]["streak"] == 0


# ---------- skills ----------
def test_skill_practice_history_and_update(user):
    s = user.post("/api/skills", {"name": "Python", "level": 2, "goal_level": 4}).get_json()["skill"]
    sid = s["id"]
    assert user.post("/api/skills", {"name": "Bad", "level": 9}).status_code == 400
    user.post(f"/api/skills/{sid}/practice", {"hours": 1.5, "note": "loops"})
    r = user.post(f"/api/skills/{sid}/practice", {"hours": 0.5, "date": iso(-2)}).get_json()["skill"]
    assert r["practice_hours"] == 2.0 and r["last_practiced"] == iso()
    assert user.post(f"/api/skills/{sid}/practice", {"hours": 0}).status_code == 400
    assert user.post(f"/api/skills/{sid}/practice", {"hours": 1, "date": iso(5)}).status_code == 400
    assert len(user.get(f"/api/skills/{sid}/history").get_json()["history"]) == 2
    assert user.patch(f"/api/skills/{sid}", {"level": 3}).get_json()["skill"]["level"] == 3


# ---------- ECA ----------
def test_activity_crud_and_sessions(user):
    body = {"title": "Tech Fest", "category": "Tech", "role": "Coordinator", "start_date": iso(-10), "hours": 2}
    a = user.post("/api/activities", body).get_json()["activity"]
    assert a["status"] == "ongoing"
    assert user.post("/api/activities", {**body, "end_date": iso(-20)}).status_code == 400
    assert user.post("/api/activities", {"title": "x"}).status_code == 400
    r = user.post(f"/api/activities/{a['id']}/log", {"hours": 3}).get_json()["activity"]
    assert r["hours"] == 5
    r = user.patch(f"/api/activities/{a['id']}", {"end_date": iso(-1)}).get_json()["activity"]
    assert r["status"] == "completed"
    assert user.delete(f"/api/activities/{a['id']}").status_code == 200


# ---------- health ----------
def test_health_upsert_water_and_validation(user):
    r = user.post("/api/health-logs", {"sleep_hours": 7, "mood": 4, "screen_time_hrs": 5, "caffeine_cups": 2, "energy_level": 4})
    assert r.status_code == 201
    log = r.get_json()["log"]
    assert log["energy_level"] == 4 and log["screen_time_hrs"] == 5  # new fields persist
    assert user.post("/api/health-logs", {"sleep_hours": 8}).status_code == 200  # same day updates
    assert len(user.get("/api/health-logs").get_json()["logs"]) == 1
    assert user.post("/api/health-logs", {"sleep_hours": 30}).status_code == 400
    assert user.post("/api/health-logs", {"mood": 9}).status_code == 400
    w = user.post("/api/health-logs/water", {"ml": 250}).get_json()["log"]
    assert w["water_ml"] == 250 and w["sleep_hours"] == 8  # untouched by partial update
    assert user.post("/api/health-logs/water", {"ml": -1000}).get_json()["log"]["water_ml"] == 0


# ---------- tasks ----------
def test_task_lifecycle_priority_and_focus(user):
    skill = user.post("/api/skills", {"name": "React"}).get_json()["skill"]
    low = user.post("/api/tasks", {"title": "Low", "priority": 1}).get_json()["task"]
    urgent = user.post("/api/tasks", {"title": "Urgent", "priority": 3, "due_date": iso(-1), "skill_id": skill["id"], "estimate_min": 60}).get_json()["task"]
    assert urgent["overdue"] is True
    tasks = user.get("/api/tasks").get_json()["tasks"]
    assert tasks[0]["title"] == "Urgent"  # smart ordering
    assert user.post("/api/tasks", {"title": ""}).status_code == 400
    assert user.post("/api/tasks", {"title": "X", "skill_id": 999}).status_code == 400

    f = user.post("/api/focus", {"minutes": 30, "task_id": urgent["id"]}).get_json()
    assert f["task"]["spent_min"] == 30 and f["task"]["status"] == "doing"
    sk = user.get("/api/skills").get_json()["skills"][0]
    assert sk["practice_hours"] == 0.5  # focus on a linked task counts as skill practice

    done = user.patch(f"/api/tasks/{urgent['id']}", {"status": "done"}).get_json()["task"]
    assert done["done_date"] == iso() and done["overdue"] is False
    assert user.patch(f"/api/tasks/{low['id']}", {"status": "bogus"}).status_code == 400
    assert user.delete(f"/api/tasks/{low['id']}").status_code == 200


def test_tasks_are_private(user, other):
    tid = user.post("/api/tasks", {"title": "Secret"}).get_json()["task"]["id"]
    assert other.get("/api/tasks").get_json()["tasks"] == []
    assert other.patch(f"/api/tasks/{tid}", {"title": "hack"}).status_code == 404
    assert other.post("/api/focus", {"minutes": 10, "task_id": tid}).status_code == 404

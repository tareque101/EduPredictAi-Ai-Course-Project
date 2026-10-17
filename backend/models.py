from datetime import date, datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)

    habits = db.relationship("Habit", backref="user", cascade="all, delete-orphan", lazy=True)
    activities = db.relationship("Activity", backref="user", cascade="all, delete-orphan", lazy=True)
    skills = db.relationship("Skill", backref="user", cascade="all, delete-orphan", lazy=True)
    health_logs = db.relationship("HealthLog", backref="user", cascade="all, delete-orphan", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email}


class Habit(db.Model):
    __tablename__ = "habits"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(40), default="Other")
    goal = db.Column(db.String(10), default="at-least")
    unit = db.Column(db.String(20), default="units")
    target = db.Column(db.Float, nullable=False)
    step = db.Column(db.Float, nullable=False, default=1.0)
    current = db.Column(db.Float, default=0.0)
    streak = db.Column(db.Integer, default=0)
    last_logged = db.Column(db.Date, nullable=True)
    color = db.Column(db.String(20), default="#6366f1")

    def to_dict(self):
        today_progress = self.current if self.last_logged == date.today() else 0.0
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "goal": self.goal,
            "unit": self.unit,
            "target": self.target,
            "step": self.step,
            "current": today_progress,
            "streak": self.streak,
            "color": self.color,
            "lastLogged": self.last_logged.isoformat() if self.last_logged else None,
        }


class Activity(db.Model):
    __tablename__ = "activities"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    organisation = db.Column(db.String(120), nullable=True)
    category = db.Column(db.String(40), default="Other")
    role = db.Column(db.String(60), nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    hours = db.Column(db.Float, default=0.0)
    certificate_url = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "organisation": self.organisation,
            "category": self.category,
            "role": self.role,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "hours": self.hours,
            "certificate_url": self.certificate_url,
            "notes": self.notes,
        }


class Skill(db.Model):
    __tablename__ = "skills"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(40), default="Other")
    level = db.Column(db.Integer, nullable=False, default=1)       # 1=Beginner .. 4=Expert
    goal_level = db.Column(db.Integer, nullable=False, default=2)
    practice_hours = db.Column(db.Float, default=0.0)
    last_practiced = db.Column(db.Date, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "level": self.level,
            "goal_level": self.goal_level,
            "practice_hours": self.practice_hours,
            "last_practiced": self.last_practiced.isoformat() if self.last_practiced else None,
        }


class HealthLog(db.Model):
    __tablename__ = "health_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    log_date = db.Column(db.Date, nullable=False, index=True)
    sleep_hours = db.Column(db.Float, default=0.0)
    sleep_quality = db.Column(db.Integer, default=3)   # 1-5
    mood = db.Column(db.Integer, default=3)            # 1-5
    stress = db.Column(db.Integer, default=3)          # 1-5
    water_ml = db.Column(db.Integer, default=0)
    exercise_min = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text, nullable=True)

    __table_args__ = (db.UniqueConstraint("user_id", "log_date", name="uq_user_day"),)

    def to_dict(self):
        return {
            "id": self.id,
            "log_date": self.log_date.isoformat(),
            "sleep_hours": self.sleep_hours,
            "sleep_quality": self.sleep_quality,
            "mood": self.mood,
            "stress": self.stress,
            "water_ml": self.water_ml,
            "exercise_min": self.exercise_min,
            "notes": self.notes,
        }
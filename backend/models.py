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
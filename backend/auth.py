import datetime as dt
from functools import wraps

import jwt
from flask import Blueprint, current_app, g, jsonify, request

from extensions import db
from models import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

ALLOWED_PROVIDERS = {"gmail.com", "yahoo.com"}


def is_allowed_email_domain(email):
    domain = email.rsplit("@", 1)[-1].strip().lower()
    if domain in ALLOWED_PROVIDERS:
        return True
    # .edu, .edu.bd, .ac.uk etc. universities
    return domain.endswith(".edu") or ".edu." in domain or domain.endswith(".ac.bd") or domain.endswith(".ac.uk")


def make_token(user):
    payload = {
        "sub": str(user.id),
        "exp": dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=current_app.config["JWT_EXPIRES_HOURS"]),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def token_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify(error="Missing token. Please log in."), 401
        try:
            data = jwt.decode(header[7:], current_app.config["SECRET_KEY"], algorithms=["HS256"])
        except jwt.PyJWTError:
            return jsonify(error="Session expired. Please log in again."), 401
        user = db.session.get(User, int(data["sub"]))
        if user is None:
            return jsonify(error="User not found."), 401
        g.user = user
        return view(*args, **kwargs)

    return wrapper


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not name or "@" not in email or len(password) < 6:
        return jsonify(error="Name, valid email and a password of 6+ characters are required."), 400

    if not is_allowed_email_domain(email):
        return jsonify(
            error="Sign up is limited to Gmail, Yahoo and university (.edu) email addresses."
        ), 403

    if User.query.filter_by(email=email).first():
        return jsonify(error="This email is already registered."), 409

    user = User(name=name[:100], email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify(token=make_token(user), user=user.to_dict()), 201


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(str(data.get("password", ""))):
        return jsonify(error="Invalid email or password."), 401
    return jsonify(token=make_token(user), user=user.to_dict())


@bp.get("/me")
@token_required
def me():
    return jsonify(user=g.user.to_dict())
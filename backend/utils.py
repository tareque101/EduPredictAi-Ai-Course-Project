"""Small helpers shared by every blueprint (validation, dates, JSON errors)."""
from datetime import date, datetime, timezone

from flask import g, jsonify, request


class ValidationError(ValueError):
    """Raised for bad user input; app.py turns it into a 400 JSON response."""


def error(message, status=400):
    return jsonify(error=message), status


def client_today():
    """The user's local 'today'.

    The browser sends its local date in the X-Client-Date header, which avoids
    off-by-one-day bugs when the server runs in another timezone. The header is
    only trusted when it is within one day of UTC now.
    """
    raw = request.headers.get("X-Client-Date", "")
    try:
        claimed = date.fromisoformat(raw)
    except ValueError:
        return date.today()
    utc_today = datetime.now(timezone.utc).date()
    return claimed if abs((claimed - utc_today).days) <= 1 else date.today()


def parse_date(value, default=None, field="date", max_future_days=0):
    """Parse YYYY-MM-DD. Empty -> default. Future dates beyond the limit are rejected."""
    if value in (None, ""):
        return default
    try:
        parsed = date.fromisoformat(str(value))
    except ValueError:
        raise ValidationError(f"'{field}' must be in YYYY-MM-DD format.")
    if max_future_days is not None and (parsed - client_today()).days > max_future_days:
        raise ValidationError(f"'{field}' cannot be in the future.")
    return parsed


def number(data, key, low, high, default=None, integer=False):
    """Read a bounded number from a JSON body."""
    raw = data.get(key)
    if raw is None or str(raw).strip() == "":
        if default is None:
            raise ValidationError(f"'{key}' is required.")
        return default
    try:
        value = float(raw)
    except (TypeError, ValueError):
        raise ValidationError(f"'{key}' must be a number.")
    if value != value or not (low <= value <= high):
        raise ValidationError(f"'{key}' must be between {low} and {high}.")
    return int(round(value)) if integer else value


def text(data, key, limit, default=None):
    value = str(data.get(key) or "").strip()[:limit]
    return value or default


def current_user_id():
    return g.user.id

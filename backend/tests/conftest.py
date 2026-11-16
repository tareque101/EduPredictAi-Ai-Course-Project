import os
import sys
from datetime import date

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402
from config import Config  # noqa: E402
from extensions import db  # noqa: E402


@pytest.fixture()
def app(tmp_path):
    class TestConfig(Config):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_path / 'test.db'}"

    app = create_app(TestConfig)
    yield app
    with app.app_context():
        db.session.remove()
        db.engine.dispose()


@pytest.fixture()
def client(app):
    return app.test_client()


class Session:
    """A logged-in test user with convenience verbs."""

    def __init__(self, client, email, name="Test User"):
        self.client = client
        res = client.post("/api/auth/register", json={"name": name, "email": email, "password": "secret12"})
        assert res.status_code == 201, res.get_json()
        self.token = res.get_json()["token"]
        self.user = res.get_json()["user"]

    @property
    def headers(self):
        return {"Authorization": f"Bearer {self.token}", "X-Client-Date": date.today().isoformat()}

    def get(self, url, **kw):
        return self.client.get(url, headers=self.headers, **kw)

    def post(self, url, json=None):
        return self.client.post(url, json=json or {}, headers=self.headers)

    def patch(self, url, json=None):
        return self.client.patch(url, json=json or {}, headers=self.headers)

    def delete(self, url):
        return self.client.delete(url, headers=self.headers)


@pytest.fixture()
def user(client):
    return Session(client, "alice@gmail.com", "Alice")


@pytest.fixture()
def other(client):
    return Session(client, "bob@gmail.com", "Bob")

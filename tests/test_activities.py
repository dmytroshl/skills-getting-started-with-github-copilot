import copy
import pytest
from fastapi.testclient import TestClient

from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def restore_activities():
    """Deep-copy activities before each test and restore after to avoid side-effects."""
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(copy.deepcopy(original))


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Expect some known activity from the seed data
    assert "Basketball" in data


def test_signup_and_unregister_flow():
    activity = "Basketball"
    email = "tester@mergington.edu"

    # Ensure clean start
    assert email not in activities[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]
    assert "Signed up" in resp.json().get("message", "")

    # Duplicate sign up should return 400
    resp_dup = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp_dup.status_code == 400

    # Unregister
    resp_un = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp_un.status_code == 200
    assert email not in activities[activity]["participants"]
    assert "Unregistered" in resp_un.json().get("message", "")

    # Unregistering again should return 404
    resp_un_again = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp_un_again.status_code == 404


def test_unsubscribe_unknown_activity():
    resp = client.post("/activities/NoSuchActivity/unregister?email=foo@bar.com")
    assert resp.status_code == 404

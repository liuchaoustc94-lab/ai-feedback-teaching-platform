from fastapi.testclient import TestClient

from backend.app.main import create_app
from backend.app.permissions import MODULE_KEYS


ADMIN_PASSWORD = "Admin@12345"
CHANGED_ADMIN_PASSWORD = "Admin@54321"


def client_for(tmp_path):
    app = create_app(
        database_url=f"sqlite:///{tmp_path / 'aift-test.sqlite3'}",
        bootstrap_password=ADMIN_PASSWORD,
        cookie_secure=False,
    )
    return TestClient(app)


def app_for(tmp_path):
    return create_app(
        database_url=f"sqlite:///{tmp_path / 'aift-test.sqlite3'}",
        bootstrap_password=ADMIN_PASSWORD,
        cookie_secure=False,
    )


def login(client: TestClient, username: str, password: str):
    response = client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    return payload, {"X-CSRF-Token": payload["csrfToken"]}


def login_ready(client: TestClient, username: str, password: str, new_password: str):
    payload, headers = login(client, username, password)
    if payload["mustChangePassword"]:
        changed = client.post(
            "/api/auth/change-password",
            headers=headers,
            json={"currentPassword": password, "newPassword": new_password},
        )
        assert changed.status_code == 200, changed.text
        return login(client, username, new_password)
    return payload, headers


def test_bootstrap_admin_has_full_access_and_self_protection(tmp_path):
    client = client_for(tmp_path)
    payload, headers = login_ready(client, "admin", ADMIN_PASSWORD, CHANGED_ADMIN_PASSWORD)

    assert payload["user"]["role"] == "admin"
    assert set(payload["modules"]) == set(MODULE_KEYS)
    assert payload["canDownload"] is True
    assert client.get("/api/auth/me").status_code == 200
    assert client.post("/api/register", json={}).status_code == 404

    disabled = client.patch(
        "/api/admin/users/1",
        headers=headers,
        json={"status": "disabled"},
    )
    assert disabled.status_code == 403

    demoted = client.patch(
        "/api/admin/users/1",
        headers=headers,
        json={"role": "student"},
    )
    assert demoted.status_code == 403


def test_student_starts_without_access_and_can_be_granted_per_user(tmp_path):
    app = app_for(tmp_path)
    admin_client = TestClient(app)
    student_client = TestClient(app)
    _, admin_headers = login_ready(admin_client, "admin", ADMIN_PASSWORD, CHANGED_ADMIN_PASSWORD)

    created = admin_client.post(
        "/api/admin/users",
        headers=admin_headers,
        json={
            "username": "student01",
            "displayName": "学生一号",
            "role": "student",
            "className": "体教 2401",
            "studentNo": "01",
        },
    )
    assert created.status_code == 201, created.text
    temporary_password = created.json()["temporaryPassword"]
    assert created.json()["user"]["modules"] == []
    assert created.json()["user"]["canDownload"] is False

    student, student_headers = login(student_client, "student01", temporary_password)
    assert student["mustChangePassword"] is True
    assert student_client.get("/api/data-center").status_code == 403
    changed = student_client.post(
        "/api/auth/change-password",
        headers=student_headers,
        json={"currentPassword": temporary_password, "newPassword": "Student@12345"},
    )
    assert changed.status_code == 200, changed.text

    grant = admin_client.put(
        "/api/admin/users/2/permissions",
        headers=admin_headers,
        json={
            "modules": ["information-processing", "training-archive"],
            "canDownload": True,
        },
    )
    assert grant.status_code == 200, grant.text

    refreshed, student_headers = login(student_client, "student01", "Student@12345")
    assert set(refreshed["modules"]) == {
        "information-processing",
        "training-archive",
    }
    assert refreshed["canDownload"] is True
    assert student_client.get("/api/data-center").status_code == 403
    assert student_client.get("/api/training-records").status_code == 200

    record = student_client.post(
        "/api/training-records",
        headers=student_headers,
        json={
            "clientId": "student01-f11-1",
            "moduleKey": "information-processing",
            "functionCode": "F1.1",
            "moduleTitle": "简单反应时",
            "stage": "正式",
            "condition": "简单",
            "result": "285 ms",
            "duration": 12,
            "metrics": {"reactionTime": 285},
            "report": {"summary": "ok"},
        },
    )
    assert record.status_code == 201, record.text
    assert student_client.get(
        "/api/training-records/export", headers=student_headers
    ).status_code == 200


def test_download_requires_download_permission_even_when_module_is_allowed(tmp_path):
    app = app_for(tmp_path)
    admin_client = TestClient(app)
    student_client = TestClient(app)
    _, admin_headers = login_ready(admin_client, "admin", ADMIN_PASSWORD, CHANGED_ADMIN_PASSWORD)
    created = admin_client.post(
        "/api/admin/users",
        headers=admin_headers,
        json={"username": "viewer", "displayName": "查看者", "role": "student"},
    ).json()
    password = created["temporaryPassword"]
    _, student_headers = login(student_client, "viewer", password)

    admin_client.put(
        "/api/admin/users/2/permissions",
        headers=admin_headers,
        json={"modules": ["training-archive"], "canDownload": False},
    )
    _, student_headers = login_ready(student_client, "viewer", password, "Viewer@12345")
    assert student_client.get("/api/training-records").status_code == 200
    assert student_client.get(
        "/api/training-records/export", headers=student_headers
    ).status_code == 403


def test_disabling_user_and_revoking_sessions_invalidate_existing_cookie(tmp_path):
    app = app_for(tmp_path)
    admin_client = TestClient(app)
    student_client = TestClient(app)
    _, admin_headers = login_ready(admin_client, "admin", ADMIN_PASSWORD, CHANGED_ADMIN_PASSWORD)
    created = admin_client.post(
        "/api/admin/users",
        headers=admin_headers,
        json={"username": "session-user", "displayName": "会话用户", "role": "student"},
    ).json()
    password = created["temporaryPassword"]
    login(student_client, "session-user", password)

    revoked = admin_client.post(
        "/api/admin/users/2/revoke-sessions",
        headers=admin_headers,
    )
    assert revoked.status_code == 200
    assert student_client.get("/api/auth/me").status_code == 401

    _, student_headers = login(student_client, "session-user", password)
    disabled = admin_client.patch(
        "/api/admin/users/2",
        headers=admin_headers,
        json={"status": "disabled"},
    )
    assert disabled.status_code == 200
    assert student_client.get("/api/auth/me").status_code == 401
    assert student_client.post(
        "/api/auth/login",
        json={"username": "session-user", "password": password},
    ).status_code == 403


def test_last_active_admin_cannot_be_demoted_or_disabled(tmp_path):
    client = client_for(tmp_path)
    _, admin_headers = login_ready(client, "admin", ADMIN_PASSWORD, CHANGED_ADMIN_PASSWORD)
    created = client.post(
        "/api/admin/users",
        headers=admin_headers,
        json={
            "username": "admin2",
            "displayName": "管理员二号",
            "role": "admin",
            "password": "Admin2@12345",
        },
    )
    assert created.status_code == 201, created.text

    assert client.patch(
        "/api/admin/users/2",
        headers=admin_headers,
        json={"status": "disabled"},
    ).status_code == 200
    blocked = client.patch(
        "/api/admin/users/1",
        headers=admin_headers,
        json={"role": "student"},
    )
    assert blocked.status_code == 403

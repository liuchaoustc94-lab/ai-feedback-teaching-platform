from fastapi.testclient import TestClient

from backend.app.main import create_app


BOOTSTRAP = "Admin@12345"
ADMIN_PASSWORD = "Admin@54321"


def setup_clients(tmp_path):
    app = create_app(
        database_url=f"sqlite:///{tmp_path / 'contract.sqlite3'}",
        bootstrap_password=BOOTSTRAP,
        cookie_secure=False,
    )
    return TestClient(app), TestClient(app), TestClient(app)


def login(client: TestClient, username: str, password: str):
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200, response.text
    body = response.json()
    return body, {"X-CSRF-Token": body["csrfToken"]}


def ready_admin(client: TestClient):
    body, headers = login(client, "admin", BOOTSTRAP)
    changed = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"currentPassword": BOOTSTRAP, "newPassword": ADMIN_PASSWORD},
    )
    assert changed.status_code == 200, changed.text
    return login(client, "admin", ADMIN_PASSWORD)


def create_student(admin: TestClient, headers, username: str):
    response = admin.post(
        "/api/admin/users",
        headers=headers,
        json={"username": username, "displayName": username, "role": "student"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    return body["user"]["id"], body["temporaryPassword"]


def test_mutating_admin_api_requires_csrf_header(tmp_path):
    admin, _, _ = setup_clients(tmp_path)
    _, headers = ready_admin(admin)

    missing = admin.post(
        "/api/admin/users",
        json={"username": "no-csrf", "displayName": "无 CSRF", "role": "student"},
    )
    assert missing.status_code == 403

    created = admin.post(
        "/api/admin/users",
        headers=headers,
        json={"username": "with-csrf", "displayName": "有 CSRF", "role": "student"},
    )
    assert created.status_code == 201


def test_password_reset_invalidates_old_cookie_and_forces_change(tmp_path):
    admin, student, _ = setup_clients(tmp_path)
    _, admin_headers = ready_admin(admin)
    user_id, temporary = create_student(admin, admin_headers, "reset-user")
    login(student, "reset-user", temporary)

    reset = admin.post(
        f"/api/admin/users/{user_id}/reset-password",
        headers=admin_headers,
    )
    assert reset.status_code == 200
    assert student.get("/api/auth/me").status_code == 401

    new_temporary = reset.json()["temporaryPassword"]
    payload, student_headers = login(student, "reset-user", new_temporary)
    assert payload["mustChangePassword"] is True
    blocked = student.get("/api/training-records")
    assert blocked.status_code == 403
    assert student.post(
        "/api/auth/change-password",
        headers=student_headers,
        json={"currentPassword": new_temporary, "newPassword": "Reset@12345"},
    ).status_code == 200


def test_student_data_center_isolated_from_other_students_and_admin_sees_all(tmp_path):
    admin, first, second = setup_clients(tmp_path)
    _, admin_headers = ready_admin(admin)
    first_id, first_temp = create_student(admin, admin_headers, "student-a")
    second_id, second_temp = create_student(admin, admin_headers, "student-b")

    modules = ["information-processing", "data-center", "training-archive"]
    for user_id in (first_id, second_id):
        granted = admin.put(
            f"/api/admin/users/{user_id}/permissions",
            headers=admin_headers,
            json={"modules": modules, "canDownload": False},
        )
        assert granted.status_code == 200, granted.text

    first_payload, first_headers = login(first, "student-a", first_temp)
    first_change = first.post(
        "/api/auth/change-password",
        headers=first_headers,
        json={"currentPassword": first_temp, "newPassword": "StudentA@12345"},
    )
    assert first_change.status_code == 200
    _, first_headers = login(first, "student-a", "StudentA@12345")

    second_payload, second_headers = login(second, "student-b", second_temp)
    second_change = second.post(
        "/api/auth/change-password",
        headers=second_headers,
        json={"currentPassword": second_temp, "newPassword": "StudentB@12345"},
    )
    assert second_change.status_code == 200
    _, second_headers = login(second, "student-b", "StudentB@12345")

    first_record = first.post(
        "/api/training-records",
        headers=first_headers,
        json={
            "clientId": "student-a-record",
            "moduleKey": "information-processing",
            "functionCode": "F1.1",
            "moduleTitle": "简单反应时",
            "result": "285 ms",
        },
    )
    second_record = second.post(
        "/api/training-records",
        headers=second_headers,
        json={
            "clientId": "student-b-record",
            "moduleKey": "information-processing",
            "functionCode": "F1.1",
            "moduleTitle": "简单反应时",
            "result": "310 ms",
        },
    )
    assert first_record.status_code == 201, first_record.text
    assert second_record.status_code == 201, second_record.text

    first_data = first.get("/api/data-center")
    second_data = second.get("/api/data-center")
    all_data = admin.get("/api/data-center")
    assert first_data.status_code == 200
    assert second_data.status_code == 200
    assert all_data.status_code == 200
    assert {item["username"] for item in first_data.json()["records"]} == {"student-a"}
    assert {item["username"] for item in second_data.json()["records"]} == {"student-b"}
    assert {item["username"] for item in all_data.json()["records"]} == {"student-a", "student-b"}

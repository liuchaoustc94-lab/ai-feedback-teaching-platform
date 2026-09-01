from backend.app.permissions import MODULE_KEYS, effective_permissions


def test_admin_always_has_every_module_and_download_access():
    permissions = effective_permissions(role="admin", allowed_modules=[], can_download=False)

    assert permissions.modules == set(MODULE_KEYS)
    assert permissions.can_download is True


def test_student_permissions_are_explicit_and_download_is_independent():
    permissions = effective_permissions(
        role="student",
        allowed_modules=["information-processing", "training-archive"],
        can_download=True,
    )

    assert permissions.modules == {"information-processing", "training-archive"}
    assert permissions.can_download is True


def test_unknown_student_module_is_not_granted():
    permissions = effective_permissions(
        role="student",
        allowed_modules=["not-a-real-module", "data-center"],
        can_download=False,
    )

    assert permissions.modules == {"data-center"}

from __future__ import annotations

from typing import Any, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


Role = Literal["admin", "student"]
Status = Literal["active", "disabled"]


def required_text(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("不能为空")
    return value


class LoginRequest(BaseModel):
    username: str
    password: str

    _username = field_validator("username")(required_text)


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str


class UserCreateRequest(BaseModel):
    username: str = Field(min_length=2, max_length=64)
    displayName: str = Field(min_length=1, max_length=120)
    role: Role = "student"
    className: Optional[str] = Field(default=None, max_length=120)
    studentNo: Optional[str] = Field(default=None, max_length=64)
    password: Optional[str] = Field(default=None, min_length=8, max_length=256)
    modules: List[str] = Field(default_factory=list)
    canDownload: bool = False

    @field_validator("username", "displayName", mode="before")
    @classmethod
    def strip_required(cls, value: str) -> str:
        return required_text(value)


class UserUpdateRequest(BaseModel):
    displayName: Optional[str] = Field(default=None, min_length=1, max_length=120)
    role: Optional[Role] = None
    status: Optional[Status] = None
    className: Optional[str] = Field(default=None, max_length=120)
    studentNo: Optional[str] = Field(default=None, max_length=64)

    @field_validator("displayName", mode="before")
    @classmethod
    def strip_display_name(cls, value: Optional[str]) -> Optional[str]:
        return None if value is None else required_text(value)


class PermissionUpdateRequest(BaseModel):
    modules: List[str] = Field(default_factory=list)
    canDownload: bool = False


class TrainingRecordRequest(BaseModel):
    clientId: str = Field(min_length=1, max_length=120)
    moduleKey: str
    functionCode: str = Field(min_length=1, max_length=16)
    moduleTitle: str = Field(min_length=1, max_length=160)
    occurredAt: Optional[int] = None
    stage: str = Field(default="正式", max_length=32)
    condition: str = Field(default="", max_length=160)
    result: str = Field(default="", max_length=240)
    duration: float = Field(default=0, ge=0, le=86400)
    metrics: dict[str, Any] = Field(default_factory=dict)
    report: dict[str, Any] = Field(default_factory=dict)


class UserView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    displayName: str
    role: Role
    status: Status
    className: Optional[str]
    studentNo: Optional[str]
    mustChangePassword: bool
    modules: list[str]
    canDownload: bool
    createdAt: str
    lastLoginAt: Optional[str]
    activeSessionCount: int


class AuthPayload(BaseModel):
    user: UserView
    modules: list[str]
    canDownload: bool
    isAdmin: bool
    mustChangePassword: bool
    csrfToken: str

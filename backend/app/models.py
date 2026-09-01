from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.utcnow()


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    display_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(16), default="student", index=True)
    status: Mapped[str] = mapped_column(String(16), default="active", index=True)
    class_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    student_no: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False)
    can_download: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    permissions: Mapped[List["UserModulePermission"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    sessions: Mapped[List["AuthSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    records: Mapped[List["TrainingRecord"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class UserModulePermission(Base):
    __tablename__ = "user_module_permissions"
    __table_args__ = (UniqueConstraint("user_id", "module_key"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    module_key: Mapped[str] = mapped_column(String(64), index=True)
    user: Mapped[User] = relationship(back_populates="permissions")


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_digest: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    csrf_digest: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    user: Mapped[User] = relationship(back_populates="sessions")


class TrainingRecord(Base):
    __tablename__ = "training_records"
    __table_args__ = (UniqueConstraint("user_id", "client_id"),)

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    client_id: Mapped[str] = mapped_column(String(120), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    module_key: Mapped[str] = mapped_column(String(64), index=True)
    function_code: Mapped[str] = mapped_column(String(16), index=True)
    module_title: Mapped[str] = mapped_column(String(160))
    class_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, index=True)
    student_no: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    stage: Mapped[str] = mapped_column(String(32), default="正式")
    condition: Mapped[str] = mapped_column(String(160), default="")
    result: Mapped[str] = mapped_column(String(240), default="")
    duration: Mapped[float] = mapped_column(Float, default=0)
    metrics_json: Mapped[str] = mapped_column(Text, default="{}")
    report_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    user: Mapped[User] = relationship(back_populates="records")

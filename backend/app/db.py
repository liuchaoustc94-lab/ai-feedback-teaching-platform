from __future__ import annotations

from pathlib import Path
from typing import Optional

from sqlalchemy import create_engine, func, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from .models import Base, User
from .security import hash_password, validate_password


def make_engine(database_url: str) -> Engine:
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    return create_engine(database_url, connect_args=connect_args, pool_pre_ping=True)


def ensure_database_parent(database_url: str) -> None:
    if not database_url.startswith("sqlite:///"):
        return
    path = Path(database_url.removeprefix("sqlite:///"))
    if str(path) != ":memory:":
        path.parent.mkdir(parents=True, exist_ok=True)


def initialize_database(engine: Engine, bootstrap_password: Optional[str]) -> None:
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory() as db:
        user_count = db.scalar(select(func.count(User.id))) or 0
        active_admin_count = db.scalar(
            select(func.count(User.id)).where(User.role == "admin", User.status == "active")
        ) or 0
        if user_count == 0:
            if not bootstrap_password:
                raise RuntimeError("首次启动必须设置 AIFT_BOOTSTRAP_ADMIN_PASSWORD")
            validate_password(bootstrap_password)
            db.add(
                User(
                    username="admin",
                    password_hash=hash_password(bootstrap_password),
                    display_name="系统管理员",
                    role="admin",
                    status="active",
                    must_change_password=True,
                )
            )
            db.commit()
        elif active_admin_count == 0:
            raise RuntimeError("数据库中没有有效管理员，服务拒绝启动")


def session_factory(engine: Engine) -> sessionmaker:
    return sessionmaker(bind=engine, expire_on_commit=False)

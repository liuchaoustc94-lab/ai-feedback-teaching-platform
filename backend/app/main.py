from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timedelta
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from openpyxl import Workbook
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from .db import ensure_database_parent, initialize_database, make_engine, session_factory
from .models import AuthSession, TrainingRecord, User, UserModulePermission, utcnow
from .permissions import (
    FUNCTION_MODULES,
    MODULE_KEYS,
    MODULE_LABELS,
    effective_permissions,
    module_for_function,
)
from .schemas import (
    ChangePasswordRequest,
    LoginRequest,
    PermissionUpdateRequest,
    TrainingRecordRequest,
    UserCreateRequest,
    UserUpdateRequest,
)
from .security import (
    hash_password,
    new_token,
    temporary_password,
    token_digest,
    token_matches,
    validate_password,
    verify_password,
)


SESSION_COOKIE = "aift_session"
CSRF_COOKIE = "aift_csrf"
DEFAULT_SESSION_DAYS = 7


@dataclass
class AuthContext:
    user: User
    session: AuthSession


def _default_database_url() -> str:
    configured_path = os.getenv("AIFT_DB_PATH")
    if configured_path:
        return "sqlite:///" + configured_path
    path = Path(__file__).resolve().parents[1] / "data" / "aift.sqlite3"
    return "sqlite:///" + str(path)


def _as_bool(value: Optional[str], default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() not in {"0", "false", "no", "off"}


def _iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.replace(microsecond=0).isoformat() + "Z"


def _json_object(value: str) -> Dict[str, Any]:
    try:
        decoded = json.loads(value or "{}")
    except (TypeError, ValueError):
        return {}
    return decoded if isinstance(decoded, dict) else {}


def _ordered_modules(user: User) -> List[str]:
    allowed = {item.module_key for item in user.permissions}
    permissions = effective_permissions(user.role, allowed, user.can_download)
    return [key for key in MODULE_KEYS if key in permissions.modules]


def _user_view(db: Session, user: User) -> Dict[str, Any]:
    active_sessions = db.scalar(
        select(func.count(AuthSession.id)).where(
            AuthSession.user_id == user.id,
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > utcnow(),
        )
    ) or 0
    modules = _ordered_modules(user)
    return {
        "id": user.id,
        "username": user.username,
        "displayName": user.display_name,
        "role": user.role,
        "status": user.status,
        "className": user.class_name,
        "studentNo": user.student_no,
        "mustChangePassword": bool(user.must_change_password),
        "modules": modules,
        "canDownload": bool(user.role == "admin" or user.can_download),
        "createdAt": _iso(user.created_at),
        "lastLoginAt": _iso(user.last_login_at),
        "activeSessionCount": int(active_sessions),
    }


def _auth_payload(db: Session, context: AuthContext, csrf_token: str) -> Dict[str, Any]:
    user_view = _user_view(db, context.user)
    return {
        "user": user_view,
        "modules": user_view["modules"],
        "canDownload": user_view["canDownload"],
        "isAdmin": context.user.role == "admin",
        "mustChangePassword": bool(context.user.must_change_password),
        "csrfToken": csrf_token,
    }


def _error(status_code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=detail)


def _set_session_cookies(
    response: Response,
    session_token: str,
    csrf_token: str,
    secure: bool,
    max_age: int,
) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        session_token,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        CSRF_COOKIE,
        csrf_token,
        max_age=max_age,
        httponly=False,
        secure=secure,
        samesite="lax",
        path="/",
    )


def _delete_session_cookies(response: Response, secure: bool) -> None:
    response.delete_cookie(SESSION_COOKIE, secure=secure, httponly=True, samesite="lax", path="/")
    response.delete_cookie(CSRF_COOKIE, secure=secure, httponly=False, samesite="lax", path="/")


def _record_view(record: TrainingRecord) -> Dict[str, Any]:
    return {
        "id": record.id,
        "clientId": record.client_id,
        "userId": record.user_id,
        "username": record.user.username if record.user else None,
        "displayName": record.user.display_name if record.user else None,
        "moduleKey": record.module_key,
        "moduleLabel": MODULE_LABELS.get(record.module_key, record.module_key),
        "functionCode": record.function_code,
        "moduleTitle": record.module_title,
        "className": record.class_name,
        "studentNo": record.student_no,
        "occurredAt": _iso(record.occurred_at),
        "stage": record.stage,
        "condition": record.condition,
        "result": record.result,
        "duration": record.duration,
        "metrics": _json_object(record.metrics_json),
        "report": _json_object(record.report_json),
    }


def _records_workbook(records: Sequence[TrainingRecord], title: str) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = title[:31]
    sheet.append(
        [
            "记录时间",
            "用户名",
            "显示名",
            "班级",
            "学号",
            "模块",
            "功能",
            "训练项目",
            "阶段",
            "条件",
            "结果",
            "时长（秒）",
            "指标 JSON",
            "报告 JSON",
        ]
    )
    for record in records:
        sheet.append(
            [
                _iso(record.occurred_at),
                record.user.username if record.user else "",
                record.user.display_name if record.user else "",
                record.class_name or "",
                record.student_no or "",
                MODULE_LABELS.get(record.module_key, record.module_key),
                record.function_code,
                record.module_title,
                record.stage,
                record.condition,
                record.result,
                record.duration,
                record.metrics_json,
                record.report_json,
            ]
        )
    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = sheet.dimensions
    for column in sheet.columns:
        values = [len(str(cell.value or "")) for cell in column]
        sheet.column_dimensions[column[0].column_letter].width = min(max(max(values) + 2, 12), 42)
    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def _download_response(content: bytes, filename: str) -> StreamingResponse:
    return StreamingResponse(
        iter([content]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=" + filename},
    )


def create_app(
    database_url: Optional[str] = None,
    bootstrap_password: Optional[str] = None,
    cookie_secure: Optional[bool] = None,
) -> FastAPI:
    resolved_database_url = database_url or os.getenv("AIFT_DATABASE_URL") or _default_database_url()
    resolved_bootstrap_password = (
        bootstrap_password
        if bootstrap_password is not None
        else os.getenv("AIFT_BOOTSTRAP_ADMIN_PASSWORD")
    )
    secure_cookies = (
        cookie_secure
        if cookie_secure is not None
        else _as_bool(os.getenv("AIFT_COOKIE_SECURE"), True)
    )
    try:
        session_days = max(1, int(os.getenv("AIFT_SESSION_DAYS", str(DEFAULT_SESSION_DAYS))))
    except ValueError:
        session_days = DEFAULT_SESSION_DAYS
    session_max_age = session_days * 24 * 60 * 60

    ensure_database_parent(resolved_database_url)
    engine = make_engine(resolved_database_url)
    initialize_database(engine, resolved_bootstrap_password)
    factory = session_factory(engine)

    app = FastAPI(title="AI Feedback Teaching Platform API", version="1.0.0")
    app.state.engine = engine
    app.state.session_factory = factory
    app.state.cookie_secure = secure_cookies
    app.state.session_max_age = session_max_age

    def get_db():
        db = factory()
        try:
            yield db
        finally:
            db.close()

    def require_context(request: Request, db: Session) -> AuthContext:
        raw_session = request.cookies.get(SESSION_COOKIE)
        if not raw_session:
            raise _error(401, "未登录或登录已过期")
        auth_session = db.scalar(
            select(AuthSession)
            .options(joinedload(AuthSession.user))
            .where(AuthSession.token_digest == token_digest(raw_session))
        )
        now = utcnow()
        if (
            auth_session is None
            or auth_session.revoked_at is not None
            or auth_session.expires_at <= now
            or auth_session.user is None
            or auth_session.user.status != "active"
        ):
            raise _error(401, "未登录或登录已过期")
        auth_session.last_seen_at = now
        db.commit()
        return AuthContext(user=auth_session.user, session=auth_session)

    def require_csrf(request: Request, db: Session) -> AuthContext:
        context = require_context(request, db)
        csrf_header = request.headers.get("X-CSRF-Token")
        if not csrf_header or not token_matches(csrf_header, context.session.csrf_digest):
            raise _error(403, "缺少或无效的 CSRF 校验令牌")
        return context

    def require_ready(context: AuthContext) -> None:
        if context.user.must_change_password:
            raise _error(403, "首次登录必须先修改密码")

    def permissions_for(user: User):
        return effective_permissions(
            user.role,
            (item.module_key for item in user.permissions),
            user.can_download,
        )

    def require_admin(request: Request, db: Session) -> AuthContext:
        context = require_csrf(request, db)
        require_ready(context)
        if context.user.role != "admin":
            raise _error(403, "仅管理员可以执行此操作")
        return context

    def require_module(
        request: Request,
        db: Session,
        module_key: str,
        download: bool = False,
    ) -> AuthContext:
        context = require_csrf(request, db) if request.method != "GET" or download else require_context(request, db)
        require_ready(context)
        permissions = permissions_for(context.user)
        if module_key not in MODULE_KEYS or module_key not in permissions.modules:
            raise _error(403, "当前账号没有该模块权限")
        if download and not permissions.can_download:
            raise _error(403, "当前账号没有下载权限")
        return context

    def visible_records(
        db: Session,
        context: AuthContext,
        class_name: Optional[str] = None,
        function_code: Optional[str] = None,
        stage: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[TrainingRecord]:
        statement = select(TrainingRecord).options(joinedload(TrainingRecord.user))
        if context.user.role != "admin":
            statement = statement.where(TrainingRecord.user_id == context.user.id)
        if class_name:
            statement = statement.where(TrainingRecord.class_name == class_name)
        if function_code:
            statement = statement.where(TrainingRecord.function_code == function_code)
        if stage:
            statement = statement.where(TrainingRecord.stage == stage)
        if from_date:
            try:
                start = datetime.strptime(from_date, "%Y-%m-%d")
            except ValueError:
                raise _error(422, "fromDate 必须是 YYYY-MM-DD")
            statement = statement.where(TrainingRecord.occurred_at >= start)
        if to_date:
            try:
                end = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
            except ValueError:
                raise _error(422, "toDate 必须是 YYYY-MM-DD")
            statement = statement.where(TrainingRecord.occurred_at < end)
        statement = statement.order_by(TrainingRecord.occurred_at.desc(), TrainingRecord.id.desc())
        return list(db.scalars(statement).unique().all())

    def guard_admin_invariant(
        db: Session,
        actor: User,
        target: User,
        new_role: str,
        new_status: str,
    ) -> None:
        if target.id == actor.id and (new_role != "admin" or new_status != "active"):
            raise _error(403, "管理员不能停用或降级自己")
        becoming_inactive_admin = (
            target.role == "admin"
            and target.status == "active"
            and (new_role != "admin" or new_status != "active")
        )
        if becoming_inactive_admin:
            count = db.scalar(
                select(func.count(User.id)).where(User.role == "admin", User.status == "active")
            ) or 0
            if count <= 1:
                raise _error(409, "系统至少需要一个有效管理员")

    @app.get("/api/health")
    def health() -> Dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/auth/login")
    def login(payload: LoginRequest, db: Session = Depends(get_db)) -> JSONResponse:
        user = db.scalar(select(User).where(User.username == payload.username.strip()))
        if user is None or not verify_password(payload.password, user.password_hash):
            raise _error(401, "用户名或密码错误")
        if user.status != "active":
            raise _error(403, "该账号已停用")
        session_token = new_token()
        csrf_token = new_token()
        now = utcnow()
        auth_session = AuthSession(
            user_id=user.id,
            token_digest=token_digest(session_token),
            csrf_digest=token_digest(csrf_token),
            created_at=now,
            last_seen_at=now,
            expires_at=now + timedelta(seconds=session_max_age),
        )
        user.last_login_at = now
        db.add(auth_session)
        db.commit()
        response = JSONResponse(_auth_payload(db, AuthContext(user=user, session=auth_session), csrf_token))
        _set_session_cookies(response, session_token, csrf_token, secure_cookies, session_max_age)
        return response

    @app.post("/api/auth/logout")
    def logout(request: Request, db: Session = Depends(get_db)) -> JSONResponse:
        raw_session = request.cookies.get(SESSION_COOKIE)
        if raw_session:
            auth_session = db.scalar(
                select(AuthSession).where(AuthSession.token_digest == token_digest(raw_session))
            )
            if auth_session is not None:
                csrf_header = request.headers.get("X-CSRF-Token")
                if not csrf_header or not token_matches(csrf_header, auth_session.csrf_digest):
                    raise _error(403, "缺少或无效的 CSRF 校验令牌")
                auth_session.revoked_at = utcnow()
                db.commit()
        response = JSONResponse({"ok": True})
        _delete_session_cookies(response, secure_cookies)
        return response

    @app.get("/api/auth/me")
    def me(request: Request, db: Session = Depends(get_db)) -> JSONResponse:
        context = require_context(request, db)
        csrf_token = request.cookies.get(CSRF_COOKIE)
        if not csrf_token or not token_matches(csrf_token, context.session.csrf_digest):
            csrf_token = new_token()
            context.session.csrf_digest = token_digest(csrf_token)
            db.commit()
        response = JSONResponse(_auth_payload(db, context, csrf_token))
        response.set_cookie(
            CSRF_COOKIE,
            csrf_token,
            max_age=session_max_age,
            httponly=False,
            secure=secure_cookies,
            samesite="lax",
            path="/",
        )
        return response

    @app.post("/api/auth/change-password")
    def change_password(
        payload: ChangePasswordRequest,
        request: Request,
        db: Session = Depends(get_db),
    ) -> JSONResponse:
        context = require_csrf(request, db)
        if not verify_password(payload.currentPassword, context.user.password_hash):
            raise _error(400, "当前密码错误")
        try:
            validate_password(payload.newPassword)
        except ValueError as exc:
            raise _error(422, str(exc))
        if payload.currentPassword == payload.newPassword:
            raise _error(422, "新密码不能与当前密码相同")
        context.user.password_hash = hash_password(payload.newPassword)
        context.user.must_change_password = False
        now = utcnow()
        for session in context.user.sessions:
            if session.id != context.session.id and session.revoked_at is None:
                session.revoked_at = now
        db.commit()
        # The request header has already been verified by require_csrf. Reuse
        # it when a client has not sent the readable CSRF cookie; returning a
        # fresh, unpersisted token here would make the next write fail.
        csrf_token = request.headers.get("X-CSRF-Token") or request.cookies.get(CSRF_COOKIE)
        if not csrf_token:
            csrf_token = new_token()
            context.session.csrf_digest = token_digest(csrf_token)
            db.commit()
        response = JSONResponse(_auth_payload(db, context, csrf_token))
        response.set_cookie(
            CSRF_COOKIE,
            csrf_token,
            max_age=session_max_age,
            httponly=False,
            secure=secure_cookies,
            samesite="lax",
            path="/",
        )
        return response

    @app.get("/api/admin/users")
    def list_users(
        request: Request,
        role: Optional[str] = Query(default=None),
        status: Optional[str] = Query(default=None),
        q: Optional[str] = Query(default=None),
        db: Session = Depends(get_db),
    ) -> Dict[str, Any]:
        context = require_context(request, db)
        require_ready(context)
        if context.user.role != "admin":
            raise _error(403, "仅管理员可以访问用户管理")
        statement = select(User).options(joinedload(User.permissions)).order_by(User.id.asc())
        if role in {"admin", "student"}:
            statement = statement.where(User.role == role)
        if status in {"active", "disabled"}:
            statement = statement.where(User.status == status)
        if q:
            pattern = "%" + q.strip() + "%"
            statement = statement.where(
                User.username.ilike(pattern)
                | User.display_name.ilike(pattern)
                | User.student_no.ilike(pattern)
            )
        users = list(db.scalars(statement).unique().all())
        active_admin_count = db.scalar(
            select(func.count(User.id)).where(User.role == "admin", User.status == "active")
        ) or 0
        return {
            "users": [_user_view(db, user) for user in users],
            "activeAdminCount": int(active_admin_count),
        }

    @app.post("/api/admin/users", status_code=201)
    def create_user(
        payload: UserCreateRequest,
        request: Request,
        db: Session = Depends(get_db),
    ) -> Dict[str, Any]:
        require_admin(request, db)
        username = payload.username.strip()
        if db.scalar(select(User).where(User.username == username)) is not None:
            raise _error(409, "用户名已存在，创建后不可修改")
        generated_password = temporary_password() if payload.password is None else None
        password = payload.password or generated_password
        try:
            validate_password(password or "")
        except ValueError as exc:
            raise _error(422, str(exc))
        modules = list(dict.fromkeys(payload.modules))
        unknown = [module for module in modules if module not in MODULE_KEYS]
        if unknown:
            raise _error(422, "包含未知模块权限")
        user = User(
            username=username,
            password_hash=hash_password(password or ""),
            display_name=payload.displayName.strip(),
            role=payload.role,
            status="active",
            class_name=payload.className.strip() if payload.className else None,
            student_no=payload.studentNo.strip() if payload.studentNo else None,
            must_change_password=True,
            can_download=bool(payload.canDownload and payload.role == "student"),
        )
        db.add(user)
        try:
            db.flush()
            if payload.role == "student":
                for module in modules:
                    db.add(UserModulePermission(user_id=user.id, module_key=module))
            db.commit()
        except IntegrityError:
            db.rollback()
            raise _error(409, "用户名已存在，创建后不可修改")
        db.refresh(user)
        return {"user": _user_view(db, user), "temporaryPassword": generated_password}

    @app.patch("/api/admin/users/{user_id}")
    def update_user(
        user_id: int,
        payload: UserUpdateRequest,
        request: Request,
        db: Session = Depends(get_db),
    ) -> Dict[str, Any]:
        context = require_admin(request, db)
        user = db.scalar(select(User).options(joinedload(User.permissions)).where(User.id == user_id))
        if user is None:
            raise _error(404, "用户不存在")
        fields = payload.model_fields_set
        new_role = payload.role if "role" in fields and payload.role is not None else user.role
        new_status = payload.status if "status" in fields and payload.status is not None else user.status
        guard_admin_invariant(db, context.user, user, new_role, new_status)
        if "displayName" in fields:
            user.display_name = payload.displayName or user.display_name
        if "className" in fields:
            user.class_name = payload.className.strip() if payload.className else None
        if "studentNo" in fields:
            user.student_no = payload.studentNo.strip() if payload.studentNo else None
        role_changed = user.role != new_role
        status_changed = user.status != new_status
        user.role = new_role
        user.status = new_status
        if role_changed and new_role == "student":
            user.can_download = False
            for permission in list(user.permissions):
                db.delete(permission)
        if role_changed or status_changed:
            for session in user.sessions:
                if session.revoked_at is None:
                    session.revoked_at = utcnow()
        db.commit()
        db.refresh(user)
        return {"user": _user_view(db, user)}

    @app.put("/api/admin/users/{user_id}/permissions")
    def update_permissions(
        user_id: int,
        payload: PermissionUpdateRequest,
        request: Request,
        db: Session = Depends(get_db),
    ) -> Dict[str, Any]:
        require_admin(request, db)
        user = db.scalar(select(User).options(joinedload(User.permissions)).where(User.id == user_id))
        if user is None:
            raise _error(404, "用户不存在")
        modules = list(dict.fromkeys(payload.modules))
        unknown = [module for module in modules if module not in MODULE_KEYS]
        if unknown:
            raise _error(422, "包含未知模块权限")
        if user.role == "student":
            for permission in list(user.permissions):
                db.delete(permission)
            db.flush()
            for module in modules:
                db.add(UserModulePermission(user_id=user.id, module_key=module))
            user.can_download = bool(payload.canDownload)
        db.commit()
        db.refresh(user)
        return {"user": _user_view(db, user)}

    @app.post("/api/admin/users/{user_id}/reset-password")
    def reset_password(
        user_id: int,
        request: Request,
        db: Session = Depends(get_db),
    ) -> Dict[str, Any]:
        require_admin(request, db)
        user = db.scalar(select(User).where(User.id == user_id))
        if user is None:
            raise _error(404, "用户不存在")
        generated = temporary_password()
        user.password_hash = hash_password(generated)
        user.must_change_password = True
        now = utcnow()
        revoked = 0
        for session in user.sessions:
            if session.revoked_at is None:
                session.revoked_at = now
                revoked += 1
        db.commit()
        return {
            "temporaryPassword": generated,
            "revokedSessionCount": revoked,
            "user": _user_view(db, user),
        }

    @app.post("/api/admin/users/{user_id}/revoke-sessions")
    def revoke_sessions(
        user_id: int,
        request: Request,
        db: Session = Depends(get_db),
    ) -> Dict[str, Any]:
        require_admin(request, db)
        user = db.scalar(select(User).where(User.id == user_id))
        if user is None:
            raise _error(404, "用户不存在")
        now = utcnow()
        revoked = 0
        for session in user.sessions:
            if session.revoked_at is None:
                session.revoked_at = now
                revoked += 1
        db.commit()
        return {"revokedSessionCount": revoked}

    @app.post("/api/training-records", status_code=201)
    def create_training_record(
        payload: TrainingRecordRequest,
        request: Request,
        db: Session = Depends(get_db),
    ) -> Dict[str, Any]:
        context = require_csrf(request, db)
        require_ready(context)
        expected_module = module_for_function(payload.functionCode)
        if expected_module is None or expected_module != payload.moduleKey:
            raise _error(422, "训练功能与模块不匹配")
        permissions = permissions_for(context.user)
        if payload.moduleKey not in permissions.modules:
            raise _error(403, "当前账号没有该训练模块权限")
        occurred_at = (
            datetime.utcfromtimestamp(payload.occurredAt / 1000)
            if payload.occurredAt is not None
            else utcnow()
        )
        record_id = "u{}-{}".format(context.user.id, token_digest(payload.clientId)[:32])
        record = db.scalar(
            select(TrainingRecord)
            .options(joinedload(TrainingRecord.user))
            .where(
                TrainingRecord.user_id == context.user.id,
                TrainingRecord.client_id == payload.clientId,
            )
        )
        is_new = record is None
        if record is None:
            record = TrainingRecord(
                id=record_id,
                client_id=payload.clientId,
                user_id=context.user.id,
            )
            db.add(record)
        record.module_key = payload.moduleKey
        record.function_code = payload.functionCode
        record.module_title = payload.moduleTitle
        record.class_name = context.user.class_name
        record.student_no = context.user.student_no
        record.occurred_at = occurred_at
        record.stage = payload.stage
        record.condition = payload.condition
        record.result = payload.result
        record.duration = payload.duration
        record.metrics_json = json.dumps(payload.metrics, ensure_ascii=False, separators=(",", ":"))
        record.report_json = json.dumps(payload.report, ensure_ascii=False, separators=(",", ":"))
        db.commit()
        db.refresh(record)
        record.user = context.user
        return {"record": _record_view(record), "created": is_new}

    @app.get("/api/training-records")
    def list_training_records(
        request: Request,
        fromDate: Optional[str] = Query(default=None),
        toDate: Optional[str] = Query(default=None),
        functionCode: Optional[str] = Query(default=None),
        stage: Optional[str] = Query(default=None),
        db: Session = Depends(get_db),
    ) -> Dict[str, Any]:
        context = require_module(request, db, "training-archive")
        records = visible_records(
            db,
            context,
            function_code=functionCode,
            stage=stage,
            from_date=fromDate,
            to_date=toDate,
        )
        return {"records": [_record_view(record) for record in records], "total": len(records)}

    @app.get("/api/training-records/export")
    def export_training_records(
        request: Request,
        fromDate: Optional[str] = Query(default=None),
        toDate: Optional[str] = Query(default=None),
        functionCode: Optional[str] = Query(default=None),
        stage: Optional[str] = Query(default=None),
        db: Session = Depends(get_db),
    ) -> StreamingResponse:
        context = require_module(request, db, "training-archive", download=True)
        records = visible_records(
            db,
            context,
            function_code=functionCode,
            stage=stage,
            from_date=fromDate,
            to_date=toDate,
        )
        return _download_response(_records_workbook(records, "训练档案"), "training-archive.xlsx")

    @app.get("/api/training-records/{record_id}/download")
    def download_training_report(
        record_id: str,
        request: Request,
        db: Session = Depends(get_db),
    ) -> Response:
        context = require_csrf(request, db)
        require_ready(context)
        record = db.scalar(
            select(TrainingRecord).options(joinedload(TrainingRecord.user)).where(TrainingRecord.id == record_id)
        )
        if record is None:
            raise _error(404, "训练记录不存在")
        if context.user.role != "admin" and record.user_id != context.user.id:
            raise _error(403, "无权访问该训练记录")
        permissions = permissions_for(context.user)
        if record.module_key not in permissions.modules:
            raise _error(403, "当前账号没有该模块权限")
        if not permissions.can_download:
            raise _error(403, "当前账号没有下载权限")
        report = _json_object(record.report_json)
        text = "\n".join(
            [
                "AI 反馈教学平台训练报告",
                "训练项目：" + record.module_title,
                "功能：" + record.function_code,
                "结果：" + record.result,
                "报告：" + json.dumps(report, ensure_ascii=False, indent=2),
            ]
        )
        return Response(
            content=text,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=training-report.txt"},
        )

    @app.get("/api/data-center")
    def data_center(
        request: Request,
        fromDate: Optional[str] = Query(default=None),
        toDate: Optional[str] = Query(default=None),
        className: Optional[str] = Query(default=None),
        functionCode: Optional[str] = Query(default=None),
        stage: Optional[str] = Query(default=None),
        db: Session = Depends(get_db),
    ) -> Dict[str, Any]:
        context = require_module(request, db, "data-center")
        records = visible_records(
            db,
            context,
            class_name=className,
            function_code=functionCode,
            stage=stage,
            from_date=fromDate,
            to_date=toDate,
        )
        all_visible = visible_records(db, context)
        return {
            "records": [_record_view(record) for record in records],
            "total": len(records),
            "filters": {
                "classes": sorted({record.class_name for record in all_visible if record.class_name}),
                "stages": sorted({record.stage for record in all_visible if record.stage}),
                "functions": sorted({record.function_code for record in all_visible if record.function_code}),
            },
        }

    @app.get("/api/data-center/export")
    def export_data_center(
        request: Request,
        fromDate: Optional[str] = Query(default=None),
        toDate: Optional[str] = Query(default=None),
        className: Optional[str] = Query(default=None),
        functionCode: Optional[str] = Query(default=None),
        stage: Optional[str] = Query(default=None),
        db: Session = Depends(get_db),
    ) -> StreamingResponse:
        context = require_module(request, db, "data-center", download=True)
        records = visible_records(
            db,
            context,
            class_name=className,
            function_code=functionCode,
            stage=stage,
            from_date=fromDate,
            to_date=toDate,
        )
        return _download_response(_records_workbook(records, "数据中心"), "data-center.xlsx")

    return app

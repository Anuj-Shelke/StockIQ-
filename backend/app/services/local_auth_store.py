"""Small local credential store used only when the primary DB is unavailable."""

import os
import sqlite3
import uuid
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

from app.core.config import settings


def _connect():
    path = Path(os.getenv("AUTH_FALLBACK_DB", Path(__file__).resolve().parents[2] / ".stockiq_auth.db"))
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=5)
    connection.row_factory = sqlite3.Row
    connection.execute("""CREATE TABLE IF NOT EXISTS local_users (
        id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL, full_name TEXT, role TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1, is_superuser INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL)""")
    connection.commit()
    return connection


def save_user(user) -> None:
    created_at = getattr(user, "created_at", None) or datetime.now(timezone.utc)
    with closing(_connect()) as db:
        db.execute("""INSERT INTO local_users
            (id,email,password_hash,full_name,role,is_active,is_superuser,created_at)
            VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET
            id=excluded.id,password_hash=excluded.password_hash,full_name=excluded.full_name,
            role=excluded.role,is_active=excluded.is_active,is_superuser=excluded.is_superuser""",
            (str(user.id), user.email.lower(), user.password_hash, user.full_name, user.role,
             int(user.is_active), int(getattr(user, "is_superuser", False)), created_at.isoformat()))
        db.commit()


def get_user_by_email(email: str):
    with closing(_connect()) as db:
        row = db.execute("SELECT * FROM local_users WHERE email=? COLLATE NOCASE", (email,)).fetchone()
    return _user(row) if row else None


def get_user_by_id(user_id: str):
    with closing(_connect()) as db:
        row = db.execute("SELECT * FROM local_users WHERE id=?", (user_id,)).fetchone()
    return _user(row) if row else None


def delete_user(identifier: str) -> None:
    """Delete user by ID or email from local auth fallback table."""
    try:
        with closing(_connect()) as db:
            db.execute("DELETE FROM local_users WHERE id=? OR email=? COLLATE NOCASE", (identifier, identifier))
            db.commit()
    except Exception:
        pass


def _user(row):
    values = dict(row)
    values["is_active"] = bool(values["is_active"])
    values["is_superuser"] = bool(values["is_superuser"])
    values["created_at"] = datetime.fromisoformat(values["created_at"])
    return SimpleNamespace(**values, hashed_password=values["password_hash"])


def ensure_configured_admin() -> None:
    if settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD:
        from app.core.security import get_password_hash
        save_user(SimpleNamespace(
            id=str(uuid.uuid5(uuid.NAMESPACE_URL, "stockiq-admin:" + settings.ADMIN_EMAIL.strip().lower())),
            email=settings.ADMIN_EMAIL.strip().lower(), password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            full_name=settings.ADMIN_NAME or "Administrator", role="admin", is_active=True,
            is_superuser=True, created_at=datetime.now(timezone.utc),
        ))

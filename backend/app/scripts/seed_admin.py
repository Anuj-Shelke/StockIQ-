"""Explicitly provision the configured administrator account."""

import argparse
import sys
import uuid

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User


def main() -> int:
    parser = argparse.ArgumentParser(description="Provision StockIQ administrator access.")
    parser.add_argument("--force", action="store_true", help="Promote an existing account and reset its password.")
    args = parser.parse_args()

    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        print("Set ADMIN_EMAIL and ADMIN_PASSWORD in the backend environment first.", file=sys.stderr)
        return 2

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL.strip().lower()).first()
        if existing and not args.force:
            print("Administrator account already exists; unchanged. Use --force to reset it.")
            return 0

        hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
        if existing:
            existing.role = "admin"
            existing.is_superuser = True
            existing.password_hash = hashed_password
            if settings.ADMIN_NAME:
                existing.full_name = settings.ADMIN_NAME
            message = "Administrator account updated."
        else:
            db.add(User(
                id=uuid.uuid4(),
                email=settings.ADMIN_EMAIL.strip().lower(),
                password_hash=hashed_password,
                full_name=settings.ADMIN_NAME,
                role="admin",
                is_active=True,
                is_superuser=True,
            ))
            message = "Administrator account created."
        db.commit()
        print(message)
        return 0
    except Exception:
        db.rollback()
        print("Could not provision administrator account; check database availability and schema.", file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())

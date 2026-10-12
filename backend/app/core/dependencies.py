from typing import Generator, Optional
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to extract and validate the authenticated user from JWT Bearer token."""
    if not credentials:
        raise AuthenticationError("Authentication token is required")

    token = credentials.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise AuthenticationError("Invalid token type: access token required")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token claims: subject missing")

    # Fetch user from database
    try:
        user = db.query(User).filter(User.id == user_id).first()
    except Exception:
        user = None

    if not user:
        # If database does not contain user or offline fallback, reconstruct user instance from token claims
        email = payload.get("email", f"{user_id}@example.com")
        role = payload.get("role", "investor")
        full_name = payload.get("full_name")
        user = User(
            id=user_id,
            email=email,
            hashed_password="",
            full_name=full_name,
            role=role,
            is_active=True,
            is_superuser=(role == "admin"),
        )
        try:
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to verify that authenticated user is active."""
    if not current_user.is_active:
        raise PermissionDeniedError("User account is inactive")
    return current_user


def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Dependency to verify that user has administrative privileges."""
    if not current_user.is_superuser and current_user.role != "admin":
        raise PermissionDeniedError("Administrative privileges required")
    return current_user

from typing import Generator, Optional
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.services.local_auth_store import ensure_configured_admin, get_user_by_id

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
        db.rollback()
        ensure_configured_admin()
        user = get_user_by_id(user_id)

    if user is None:
        ensure_configured_admin()
        user = get_user_by_id(user_id)

    if not user:
        raise AuthenticationError("Please log in to continue.")

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
    if current_user.role != "admin":
        raise PermissionDeniedError("You do not have permission to access this area.")
    return current_user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Dependency that returns authenticated user if token present and valid, or None otherwise."""
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user is not None:
                return user
        except Exception:
            pass
        ensure_configured_admin()
        return get_user_by_id(user_id)
    except Exception:
        return None

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdateRequest

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_user_me(
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve details of the currently authenticated user."""
    created_at = getattr(current_user, "created_at", None) or datetime.now(timezone.utc)
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=created_at,
    )


@router.patch("/me", response_model=UserResponse)
def update_user_me(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update profile details of current user."""
    if request.full_name is not None:
        current_user.full_name = request.full_name
        try:
            db.commit()
            db.refresh(current_user)
        except Exception:
            pass

    created_at = getattr(current_user, "created_at", None) or datetime.now(timezone.utc)
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=created_at,
    )

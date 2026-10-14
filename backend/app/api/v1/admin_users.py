"""Read-only, paginated administrator view of registered user accounts."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin_user
from app.core.exceptions import DatabaseUnavailableError
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_review import AdminUserItem, AdminUsersResponse

router = APIRouter()


@router.get("/users", response_model=AdminUsersResponse)
def list_admin_users(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> AdminUsersResponse:
    try:
        query = db.query(User)
        total = query.count()
        rows = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
        items = [
            AdminUserItem(
                id=str(user.id),
                full_name=user.full_name,
                email=user.email,
                role=user.role,
                created_at=user.created_at,
                is_active=user.is_active,
            )
            for user in rows
        ]
        return AdminUsersResponse(items=items, total=total, limit=limit, offset=offset)
    except Exception as exc:
        db.rollback()
        raise DatabaseUnavailableError() from exc

"""Administrator view and management of registered user accounts."""

import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin_user
from app.core.exceptions import DatabaseUnavailableError, NotFoundError, StockIQException
from app.db.session import get_db
from app.models.review import ReviewRequest
from app.models.user import User
from app.schemas.admin_review import AdminUserItem, AdminUsersResponse
from app.services.local_auth_store import delete_user as delete_local_user

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


@router.delete("/users/{user_id}")
def delete_admin_user(
    user_id: str,
    _admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Admin-only deletion of a registered user and associated data."""
    if str(_admin.id) == str(user_id) or getattr(_admin, "email", "").lower() == str(user_id).lower():
        raise StockIQException("Cannot delete your own administrator account.", status_code=400, error_code="BAD_REQUEST")

    try:
        user_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        user_uuid = None

    user = None
    if user_uuid:
        user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        user = db.query(User).filter((User.id == str(user_id)) | (User.email.ilike(str(user_id)))).first()

    if not user:
        delete_local_user(str(user_id))
        raise NotFoundError("User not found.")

    if str(_admin.id) == str(user.id) or getattr(_admin, "email", "").lower() == user.email.lower():
        raise StockIQException("Cannot delete your own administrator account.", status_code=400, error_code="BAD_REQUEST")

    try:
        # Delete user review requests
        db.query(ReviewRequest).filter(
            (ReviewRequest.user_id == user.id) | (ReviewRequest.user_id == str(user.id))
        ).delete(synchronize_session=False)

        # Nullify any reviews where this user was the assigned reviewer
        db.query(ReviewRequest).filter(
            (ReviewRequest.reviewer_id == user.id) | (ReviewRequest.reviewer_id == str(user.id))
        ).update({"reviewer_id": None, "assigned_reviewer": None}, synchronize_session=False)

        deleted_email = user.email
        deleted_id = str(user.id)

        # Deleting user cascades all child relationships: profile, portfolios,
        # recommendations, chat_sessions, tax_transactions, tax_calculations,
        # planner_profiles, investment_plans.
        db.delete(user)
        db.commit()

        # Clean from fallback store
        delete_local_user(deleted_id)
        delete_local_user(deleted_email)

        return {"status": "success", "message": f"User {deleted_email} deleted successfully.", "id": deleted_id}
    except Exception as exc:
        db.rollback()
        raise DatabaseUnavailableError() from exc

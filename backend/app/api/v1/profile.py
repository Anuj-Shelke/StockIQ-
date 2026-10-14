from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.core.exceptions import DatabaseUnavailableError
from app.db.session import get_db
from app.models.profile import InvestorProfile
from app.models.user import User
from app.schemas.profile import InvestorProfileResponse, InvestorProfileUpdate

router = APIRouter()

@router.get("", response_model=InvestorProfileResponse)
@router.get("/", response_model=InvestorProfileResponse)
def get_investor_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve the investor risk profile for the current user."""
    try:
        profile = db.query(InvestorProfile).filter(InvestorProfile.user_id == current_user.id).first()
    except Exception as exc:
        db.rollback()
        raise DatabaseUnavailableError() from exc

    if not profile:
        # Default profile
        profile = InvestorProfile(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            risk_tolerance="moderate",
            investment_horizon_years=5,
            monthly_investment=10000.0,
            goals="Long-term wealth creation with balanced capital preservation",
        )
        try:
            db.add(profile)
            db.commit()
            db.refresh(profile)
        except Exception as exc:
            db.rollback()
            raise DatabaseUnavailableError() from exc

    created_at = getattr(profile, "created_at", None) or datetime.now(timezone.utc)
    updated_at = getattr(profile, "updated_at", None) or datetime.now(timezone.utc)

    return InvestorProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        risk_tolerance=profile.risk_tolerance,
        investment_horizon_years=profile.investment_horizon_years,
        monthly_investment=profile.monthly_investment,
        goals=profile.goals,
        created_at=created_at,
        updated_at=updated_at,
    )


@router.put("", response_model=InvestorProfileResponse)
@router.put("/", response_model=InvestorProfileResponse)
def update_investor_profile(
    request: InvestorProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update or create the investor risk profile for the current user."""
    try:
        profile = db.query(InvestorProfile).filter(InvestorProfile.user_id == current_user.id).first()
    except Exception as exc:
        db.rollback()
        raise DatabaseUnavailableError() from exc

    now = datetime.now(timezone.utc)
    if not profile:
        profile = InvestorProfile(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            risk_tolerance=request.risk_tolerance or "moderate",
            investment_horizon_years=request.investment_horizon_years or 5,
            monthly_investment=request.monthly_investment if request.monthly_investment is not None else 10000.0,
            goals=request.goals,
        )
        try:
            db.add(profile)
            db.commit()
            db.refresh(profile)
        except Exception as exc:
            db.rollback()
            raise DatabaseUnavailableError() from exc
    else:
        if request.risk_tolerance is not None:
            profile.risk_tolerance = request.risk_tolerance
        if request.investment_horizon_years is not None:
            profile.investment_horizon_years = request.investment_horizon_years
        if request.monthly_investment is not None:
            profile.monthly_investment = request.monthly_investment
        if request.goals is not None:
            profile.goals = request.goals

        try:
            db.commit()
            db.refresh(profile)
        except Exception as exc:
            db.rollback()
            raise DatabaseUnavailableError() from exc

    created_at = getattr(profile, "created_at", None) or now
    updated_at = getattr(profile, "updated_at", None) or now

    return InvestorProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        risk_tolerance=profile.risk_tolerance,
        investment_horizon_years=profile.investment_horizon_years,
        monthly_investment=profile.monthly_investment,
        goals=profile.goals,
        created_at=created_at,
        updated_at=updated_at,
    )

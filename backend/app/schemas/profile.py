from datetime import datetime
from typing import Optional
from pydantic import Field
from app.schemas.common import APIBaseModel


class InvestorProfileBase(APIBaseModel):
    """Base attributes for investor profile."""
    risk_tolerance: str = Field(default="moderate", pattern="^(conservative|moderate|aggressive)$")
    investment_horizon_years: int = Field(default=5, ge=1, le=50)
    monthly_investment: float = Field(default=10000.0, ge=0.0)
    goals: Optional[str] = Field(default=None, max_length=500)


class InvestorProfileCreate(InvestorProfileBase):
    """Payload to create an investor profile."""
    pass


class InvestorProfileUpdate(APIBaseModel):
    """Payload to update an investor profile."""
    risk_tolerance: Optional[str] = Field(default=None, pattern="^(conservative|moderate|aggressive)$")
    investment_horizon_years: Optional[int] = Field(default=None, ge=1, le=50)
    monthly_investment: Optional[float] = Field(default=None, ge=0.0)
    goals: Optional[str] = Field(default=None, max_length=500)


class InvestorProfileResponse(InvestorProfileBase):
    """Investor profile response."""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

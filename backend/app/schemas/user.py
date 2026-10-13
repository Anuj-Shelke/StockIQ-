from datetime import datetime
from typing import Optional
from pydantic import EmailStr
from app.schemas.common import APIBaseModel


class UserResponse(APIBaseModel):
    """Public user response schema."""
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime


class UserUpdateRequest(APIBaseModel):
    """Payload to update user profile."""
    full_name: Optional[str] = None

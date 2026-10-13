from typing import Optional
from pydantic import EmailStr, Field
from app.schemas.common import APIBaseModel


class UserRegisterRequest(APIBaseModel):
    """Payload for registering a new user."""
    email: EmailStr
    password: str = Field(min_length=8, description="Password must be at least 8 characters long")
    full_name: Optional[str] = Field(default=None, max_length=100)


class UserLoginRequest(APIBaseModel):
    """Payload for user authentication."""
    email: EmailStr
    password: str


class RefreshTokenRequest(APIBaseModel):
    """Payload for requesting a refreshed JWT access token."""
    refresh_token: str


class GoogleAuthRequest(APIBaseModel):
    """Payload for authenticating via Google OAuth/credential."""
    id_token: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None


class TokenResponse(APIBaseModel):
    """JWT token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthSuccessResponse(APIBaseModel):
    """Authentication response including tokens and user info."""
    user_id: str
    email: str
    full_name: Optional[str] = None
    role: str
    tokens: TokenResponse

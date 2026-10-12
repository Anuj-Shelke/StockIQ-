from datetime import timedelta
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthSuccessResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)

router = APIRouter()

# In-memory store fallback for development/testing when PostgreSQL is offline
_in_memory_users = {}


@router.post("/register", response_model=AuthSuccessResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new investor user account."""
    existing_user = None
    try:
        existing_user = db.query(User).filter(User.email == request.email).first()
    except Exception:
        # Fallback to in-memory check
        existing_user = _in_memory_users.get(request.email)

    if existing_user:
        raise ConflictError(f"A user with email '{request.email}' already exists")

    user_id = str(uuid.uuid4())
    hashed_pwd = get_password_hash(request.password)

    new_user = User(
        id=user_id,
        email=request.email,
        hashed_password=hashed_pwd,
        full_name=request.full_name,
        role="investor",
        is_active=True,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception:
        # Store in-memory fallback
        _in_memory_users[request.email] = new_user

    claims = {"email": new_user.email, "role": new_user.role, "full_name": new_user.full_name}
    access_token = create_access_token(subject=str(new_user.id), claims=claims)
    refresh_token = create_refresh_token(subject=str(new_user.id))

    return AuthSuccessResponse(
        user_id=str(new_user.id),
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )


@router.post("/login", response_model=AuthSuccessResponse)
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate existing user and return JWT access and refresh tokens."""
    user = None
    try:
        user = db.query(User).filter(User.email == request.email).first()
    except Exception:
        pass

    if not user:
        user = _in_memory_users.get(request.email)

    if not user or not verify_password(request.password, user.hashed_password):
        raise AuthenticationError("Invalid email or password")

    if not user.is_active:
        raise AuthenticationError("User account is disabled")

    claims = {"email": user.email, "role": user.role, "full_name": user.full_name}
    access_token = create_access_token(subject=str(user.id), claims=claims)
    refresh_token = create_refresh_token(subject=str(user.id))

    return AuthSuccessResponse(
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh expired access token using a valid refresh token."""
    payload = decode_token(request.refresh_token)
    if payload.get("type") != "refresh":
        raise AuthenticationError("Invalid token type: refresh token expected")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Token missing subject identifier")

    user = None
    try:
        user = db.query(User).filter(User.id == user_id).first()
    except Exception:
        pass

    email = user.email if user else f"{user_id}@example.com"
    role = user.role if user else "investor"

    claims = {"email": email, "role": role}
    new_access_token = create_access_token(subject=user_id, claims=claims)
    new_refresh_token = create_refresh_token(subject=user_id)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

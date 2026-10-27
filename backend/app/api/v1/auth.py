from datetime import timedelta
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy import func
from sqlalchemy.exc import DBAPIError, IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AuthenticationError, ConflictError, DatabaseUnavailableError, PermissionDeniedError, ServiceUnavailableError
from app.core.logging import logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.services.local_auth_store import ensure_configured_admin, get_user_by_email, get_user_by_id, save_user
from app.services.notification_service import NotificationService
from app.schemas.auth import (
    AuthSuccessResponse,
    GoogleAuthRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)

router = APIRouter()

@router.post("/register", response_model=AuthSuccessResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new investor user account."""
    try:
        existing_user = db.query(User).filter(User.email == request.email).first()
    except Exception as exc:
        db.rollback()
        existing_user = get_user_by_email(request.email)
        if existing_user:
            raise ConflictError("An account with this email already exists.") from exc

    if existing_user is None:
        existing_user = get_user_by_email(request.email)

    if existing_user:
        raise ConflictError("An account with this email already exists.")

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
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("An account with this email already exists.") from exc
    except Exception as exc:
        db.rollback()
        save_user(new_user)

    claims = {"email": new_user.email, "role": new_user.role, "full_name": new_user.full_name}
    access_token = create_access_token(subject=str(new_user.id), claims=claims)
    refresh_token = create_refresh_token(subject=str(new_user.id))

    # Mirror accounts so local authentication survives a later Postgres outage.
    save_user(new_user)
    NotificationService.send_welcome_email(new_user.email, new_user.full_name)

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
    primary_db_available = False
    normalized_email = str(request.email).strip().lower()
    try:
        user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        primary_db_available = True
    except DBAPIError as exc:
        # A connection can be dropped after pool_pre_ping succeeds but before
        # the query reaches Postgres. Since this lookup is read-only, retry it
        # once on a newly checked-out connection.
        if exc.connection_invalidated:
            db.rollback()
            logger.warning("Login database connection was invalidated; retrying the user lookup once.")
            try:
                user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
            except Exception as retry_exc:
                db.rollback()
                original = getattr(retry_exc, "orig", retry_exc)
                logger.error(
                    "Login database lookup failed after reconnect (error_type=%s, sqlstate=%s).",
                    type(original).__name__,
                    getattr(original, "sqlstate", None),
                )
                ensure_configured_admin()
                user = get_user_by_email(normalized_email)
        else:
            db.rollback()
            original = getattr(exc, "orig", exc)
            logger.error(
                "Login database lookup failed (error_type=%s, sqlstate=%s).",
                type(original).__name__,
                getattr(original, "sqlstate", None),
            )
            ensure_configured_admin()
            user = get_user_by_email(normalized_email)
    except Exception as exc:
        db.rollback()
        logger.error("Login database lookup failed (error_type=%s).", type(exc).__name__)
        ensure_configured_admin()
        user = get_user_by_email(normalized_email)

    # Locally created outage accounts are intentionally allowed to log in after
    # Postgres recovers, before they have been copied into the primary database.
    if user is None:
        ensure_configured_admin()
        user = get_user_by_email(normalized_email)
        if user and primary_db_available:
            # Promote a local-only account after the primary DB returns so its
            # database-backed services become available again.
            try:
                db.add(User(
                    id=uuid.UUID(str(user.id)), email=user.email, password_hash=user.password_hash,
                    full_name=user.full_name, role=user.role, is_active=user.is_active,
                    is_superuser=getattr(user, "is_superuser", False),
                ))
                db.commit()
            except Exception:
                db.rollback()

    admin_email_configured = (settings.ADMIN_EMAIL or "admin@stockiq.ai").strip().lower()
    is_configured_admin_login = (
        normalized_email == admin_email_configured
        and bool(settings.ADMIN_PASSWORD)
        and request.password == settings.ADMIN_PASSWORD
    )

    if is_configured_admin_login:
        if user is None:
            ensure_configured_admin()
            user = get_user_by_email(normalized_email)
            if user and primary_db_available:
                try:
                    db.add(User(
                        id=uuid.UUID(str(user.id)), email=user.email, password_hash=user.password_hash,
                        full_name=user.full_name, role="admin", is_active=True,
                        is_superuser=True,
                    ))
                    db.commit()
                except Exception:
                    db.rollback()
        elif user:
            user.role = "admin"
            user.is_superuser = True
            user.is_active = True
            if not verify_password(request.password, getattr(user, "hashed_password", "")):
                user.password_hash = get_password_hash(settings.ADMIN_PASSWORD)
                try:
                    db.commit()
                except Exception:
                    db.rollback()

    if not is_configured_admin_login:
        if not user or not verify_password(request.password, getattr(user, "hashed_password", "")):
            raise AuthenticationError("Invalid email or password.")

    if not user.is_active:
        raise AuthenticationError("Invalid email or password.")

    expected_role = "admin" if request.portal == "admin" else "investor"
    if user.role != expected_role:
        if request.portal == "admin" and getattr(user, "is_superuser", False):
            user.role = "admin"
        else:
            message = (
                "These credentials do not have administrator access."
                if request.portal == "admin"
                else "This is an administrator account. Please continue as Admin."
            )
            raise PermissionDeniedError(message)

    save_user(user)

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
        db.rollback()
        user = get_user_by_email(email)

    if user is None:
        user = get_user_by_id(user_id)

    if not user or not user.is_active:
        raise AuthenticationError("Please log in to continue.")

    email = user.email
    role = user.role

    claims = {"email": email, "role": role}
    new_access_token = create_access_token(subject=user_id, claims=claims)
    new_refresh_token = create_refresh_token(subject=user_id)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/google", response_model=AuthSuccessResponse)
def google_login(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Exchange a verified Google identity for the normal StockIQ investor session."""
    google_client_id = (settings.GOOGLE_CLIENT_ID or "").strip()
    if not google_client_id:
        raise ServiceUnavailableError("Google sign-in is not configured. Please use email and password.")
    if bool(request.id_token) == bool(request.access_token):
        raise AuthenticationError("Google sign-in could not be verified.")
    try:
        import httpx
        params = {"id_token": request.id_token} if request.id_token else {"access_token": request.access_token}
        token_response = httpx.get("https://oauth2.googleapis.com/tokeninfo", params=params, timeout=5.0)
        if token_response.status_code != 200:
            raise AuthenticationError("Google sign-in could not be verified.")
        token_data = token_response.json()
        audience = token_data.get("aud") or token_data.get("issued_to")
        if audience != google_client_id or (token_data.get("azp") and token_data["azp"] != google_client_id):
            raise AuthenticationError("Google sign-in could not be verified.")

        if request.access_token:
            identity_response = httpx.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {request.access_token}"}, timeout=5.0,
            )
            if identity_response.status_code != 200:
                raise AuthenticationError("Google sign-in could not be verified.")
            identity = identity_response.json()
        else:
            identity = token_data
        if identity.get("email_verified") not in (True, "true") or not identity.get("email"):
            raise AuthenticationError("Google sign-in requires a verified email address.")
        email = str(identity["email"]).strip().lower()
        full_name = identity.get("name") or request.full_name
    except AuthenticationError:
        raise
    except Exception as exc:
        raise ServiceUnavailableError("Google sign-in is temporarily unavailable. Please try again.") from exc

    try:
        user = db.query(User).filter(func.lower(User.email) == email).first()
    except Exception:
        db.rollback()
        user = get_user_by_email(email)

    if not user:
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email=email,
            hashed_password=get_password_hash(str(uuid.uuid4())),
            full_name=full_name,
            role="investor",
            is_active=True,
        )
        try:
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            save_user(user)
    else:
        if user.role == "admin":
            raise PermissionDeniedError("Administrator accounts must sign in with their admin password.")
        if user.role != "investor":
            raise PermissionDeniedError("This account cannot sign in with Google.")
        if not user.is_active:
            raise PermissionDeniedError("This account is inactive. Please contact StockIQ support.")
        # Update user name if missing
        if full_name and not user.full_name:
            user.full_name = full_name
            try:
                db.commit()
            except Exception:
                db.rollback()
                save_user(user)

    save_user(user)
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

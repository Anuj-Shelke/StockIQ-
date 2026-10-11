from fastapi import APIRouter
from app.core.config import settings
from app.db.session import check_db_connection
from app.schemas.common import HealthResponse, ReadinessResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint to verify backend service status."""
    return HealthResponse(
        status="ok",
        app=settings.PROJECT_NAME,
        version=settings.VERSION,
    )


@router.get("/ready", response_model=ReadinessResponse)
def readiness_check():
    """Readiness probe checking database connectivity and system status."""
    db_status = check_db_connection()
    status_str = "ready" if db_status.get("status") == "connected" else "degraded"
    return ReadinessResponse(
        status=status_str,
        database=db_status.get("status", "disconnected"),
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
    )

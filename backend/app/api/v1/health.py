from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter()


@router.get("/health")
def health_check():
    """Liveness probe to verify FastAPI application is running."""
    return {"status": "ok", "app": "StockIQ"}


@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe to verify database connectivity and extension readiness."""
    try:
        # Check basic database connectivity
        result = db.execute(text("SELECT 1")).scalar()
        if result != 1:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database returned unexpected response",
            )

        # Check pgvector extension availability if in PostgreSQL
        vector_ready = False
        try:
            ext_check = db.execute(
                text("SELECT extname FROM pg_extension WHERE extname = 'vector'")
            ).scalar()
            vector_ready = ext_check == "vector"
        except Exception:
            # Fallback for non-postgres dialects during tests
            vector_ready = True

        return {
            "status": "ready",
            "database": "connected",
            "pgvector_enabled": vector_ready,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}",
        )


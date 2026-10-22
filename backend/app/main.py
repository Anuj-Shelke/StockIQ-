from contextlib import asynccontextmanager
import time
import uuid
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import logger, set_request_id
from app.db.session import check_db_connection, maybe_seed_default_data
from app.schemas.common import HealthResponse, ReadinessResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown tasks."""
    maybe_seed_default_data()
    yield


class RequestLoggingAndIDMiddleware(BaseHTTPMiddleware):
    """Middleware to inject unique X-Request-ID and log request/response cycles."""

    async def dispatch(self, request: Request, call_next):
        # Extract existing request id or generate new UUID
        request_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
        set_request_id(request_id)

        start_time = time.perf_counter()
        logger.info("Request started: %s %s", request.method, request.url.path)

        try:
            response: Response = await call_next(request)
        except Exception:
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.exception("Request failed with unhandled exception after %sms", process_time_ms)
            raise

        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time_ms}ms"

        logger.info(
            "Request completed: %s %s -> %s (took %sms)",
            request.method,
            request.url.path,
            response.status_code,
            process_time_ms,
        )
        return response


# Application instance with full OpenAPI metadata
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    description=(
        "### StockIQ: AI-Based Investment Research & Risk Analysis Platform\n\n"
        "StockIQ provides modular REST APIs for:\n"
        "- **Authentication & User Management**: Secure JWT token auth and investor risk profiling.\n"
        "- **Financial Analytics**: Portfolio tracking, stock history, and asset comparisons (Stocks vs Gold vs FD).\n"
        "- **Explainable AI (XAI)**: Price forecasts accompanied by feature-level SHAP explanations.\n"
        "- **Stress Testing**: Historical scenario simulations (COVID-19 shock, 2008 GFC, 2022 Rate Hikes).\n"
        "- **Educational RAG**: Interactive investor education assistant with regulatory/market source citations."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Register centralized exception handlers
register_exception_handlers(app)

# Request ID and structured request logging middleware
app.add_middleware(RequestLoggingAndIDMiddleware)

# CORS configuration with explicit allow-list
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)

# API v1 routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Public Root Endpoints
@app.get("/", tags=["General"])
def root():
    """Welcome endpoint providing service metadata and OpenAPI links."""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_v1_url": settings.API_V1_PREFIX,
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Public health check endpoint."""
    return HealthResponse(
        status="ok",
        app=settings.PROJECT_NAME,
        version=settings.VERSION,
    )


@app.get("/ready", response_model=ReadinessResponse, tags=["Health"])
def readiness_check():
    """Readiness probe verifying operational state and database connectivity."""
    db_status = check_db_connection()
    status_str = "ready" if db_status.get("status") == "connected" else "degraded"
    return ReadinessResponse(
        status=status_str,
        database=db_status.get("status", "disconnected"),
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
    )

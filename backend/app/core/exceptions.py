from typing import Any, List, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import get_request_id, logger


class StockIQException(Exception):
    """Base exception for all domain-specific application errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: str = "BAD_REQUEST",
        details: Optional[List[Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or []


class NotFoundError(StockIQException):
    """Resource not found error."""

    def __init__(self, message: str = "Resource not found", details: Optional[List[Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            details=details,
        )


class AuthenticationError(StockIQException):
    """Authentication failed error."""

    def __init__(self, message: str = "Authentication required or invalid credentials", details: Optional[List[Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
            details=details,
        )


class PermissionDeniedError(StockIQException):
    """Access forbidden error."""

    def __init__(self, message: str = "Permission denied", details: Optional[List[Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN",
            details=details,
        )


class ValidationError(StockIQException):
    """Business logic or request validation error."""

    def __init__(self, message: str = "Validation failed", details: Optional[List[Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class ConflictError(StockIQException):
    """State conflict error (e.g. duplicate user or record)."""

    def __init__(self, message: str = "Resource conflict", details: Optional[List[Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code="CONFLICT",
            details=details,
        )


class ServiceUnavailableError(StockIQException):
    """External dependency or database unavailable."""

    def __init__(self, message: str = "Service temporarily unavailable", details: Optional[List[Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="SERVICE_UNAVAILABLE",
            details=details,
        )


class DatabaseUnavailableError(ServiceUnavailableError):
    """Persistent storage is unavailable; the request cannot be completed safely."""

    def __init__(self, message: str = "The service is temporarily unavailable. Please try again shortly."):
        super().__init__(message)


def _format_error_payload(code: str, message: str, details: Optional[List[Any]] = None) -> dict:
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details or [],
        },
        "request_id": get_request_id() or "unknown",
    }


async def stockiq_exception_handler(request: Request, exc: StockIQException) -> JSONResponse:
    """Handle custom application exceptions."""
    logger.warning("Application exception [%s]: %s", exc.error_code, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content=_format_error_payload(exc.error_code, exc.message, exc.details),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic request validation exceptions with normalized structure."""
    errors = []
    for err in exc.errors():
        field_loc = " -> ".join([str(loc) for loc in err.get("loc", []) if loc != "body"])
        errors.append({
            "field": field_loc or "body",
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "value_error"),
        })

    logger.warning("Request validation failed on %s: %s", request.url.path, errors)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_format_error_payload("VALIDATION_ERROR", "Request validation failed", errors),
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle standard Starlette / FastAPI HTTPExceptions."""
    code = "HTTP_ERROR"
    if exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 400:
        code = "BAD_REQUEST"

    msg = exc.detail if isinstance(exc.detail, str) else "An HTTP error occurred"
    details = exc.detail if isinstance(exc.detail, list) else []

    return JSONResponse(
        status_code=exc.status_code,
        content=_format_error_payload(code, msg, details),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unhandled 500 exceptions and log them."""
    logger.exception("Unhandled server error processing request: %s", str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_format_error_payload("INTERNAL_SERVER_ERROR", "An unexpected internal server error occurred", []),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all centralized exception handlers to the FastAPI app instance."""
    app.add_exception_handler(StockIQException, stockiq_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

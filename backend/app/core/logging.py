import logging
import sys
from contextvars import ContextVar
from typing import Optional

# Context variable for storing request ID per async execution context
request_id_ctx_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


def get_request_id() -> Optional[str]:
    """Retrieve the current request ID from context."""
    return request_id_ctx_var.get()


def set_request_id(req_id: str) -> None:
    """Set the request ID in context."""
    request_id_ctx_var.set(req_id)


class RequestIDFilter(logging.Filter):
    """Logging filter to inject request_id into record attributes."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "-"
        return True


def setup_logging() -> None:
    """Configure structured logging for the application."""
    log_format = "%(asctime)s [%(levelname)s] [%(name)s] [req_id=%(request_id)s]: %(message)s"
    formatter = logging.Formatter(log_format)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    handler.addFilter(RequestIDFilter())

    root_logger = logging.getLogger()
    # Avoid adding duplicate handlers if reloaded
    if not any(isinstance(h, logging.StreamHandler) and any(isinstance(f, RequestIDFilter) for f in h.filters) for h in root_logger.handlers):
        root_logger.setLevel(logging.INFO)
        root_logger.addHandler(handler)

    # Configure specific application logger
    app_logger = logging.getLogger("stockiq")
    app_logger.setLevel(logging.INFO)


setup_logging()
logger = logging.getLogger("stockiq")

from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class APIBaseModel(BaseModel):
    """Base Pydantic model configuration."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class StandardResponse(APIBaseModel, Generic[T]):
    """Standard success API response wrapper."""
    success: bool = True
    data: T
    message: Optional[str] = None


class ErrorDetail(APIBaseModel):
    """Normalized error detail element."""
    field: Optional[str] = None
    message: str
    type: Optional[str] = None


class ErrorBody(APIBaseModel):
    """Normalized error payload."""
    code: str
    message: str
    details: List[Any] = Field(default_factory=list)


class ErrorResponse(APIBaseModel):
    """Standard error API response envelope."""
    success: bool = False
    error: ErrorBody
    request_id: str


class HealthResponse(APIBaseModel):
    """Health check response schema."""
    status: str = "ok"
    app: str = "StockIQ"
    version: str = "0.1.0"


class ReadinessResponse(APIBaseModel):
    """Readiness probe response schema."""
    status: str
    database: str
    version: str
    environment: str


class PaginationParams(APIBaseModel):
    """Standard pagination query parameters."""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

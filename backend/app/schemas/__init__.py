"""Pydantic v2 schemas for StockIQ."""

from app.schemas.common import (
    APIBaseModel,
    StandardResponse,
    ErrorDetail,
    ErrorBody,
    ErrorResponse,
    HealthResponse,
    ReadinessResponse,
    PaginationParams,
)
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    AuthSuccessResponse,
)
from app.schemas.user import UserResponse, UserUpdateRequest
from app.schemas.profile import (
    InvestorProfileCreate,
    InvestorProfileUpdate,
    InvestorProfileResponse,
)
from app.schemas.stock import (
    StockItem,
    StockListResponse,
    StockDetailResponse,
    PriceHistoryPoint,
)
from app.schemas.portfolio import (
    HoldingCreate,
    HoldingResponse,
    PortfolioCreate,
    PortfolioResponse,
)
from app.schemas.prediction import (
    ShapFactor,
    PredictionRequest,
    PredictionResponse,
    SimulationRequest,
    SimulationResponse,
)
from app.schemas.chatbot import (
    ChatQueryRequest,
    ChatSourceItem,
    ChatMessageResponse,
    ChatQueryResponse,
    ChatSessionResponse,
)
from app.schemas.dashboard import (
    MetricCard,
    PortfolioPerformanceItem,
    DashboardResponse,
)
from app.schemas.market import (
    IndexQuote,
    IndicesOverviewResponse,
    IntradayChartPoint,
    IntradayChartResponse,
    MarketStatusInfo,
)

__all__ = [
    "APIBaseModel",
    "StandardResponse",
    "ErrorDetail",
    "ErrorBody",
    "ErrorResponse",
    "HealthResponse",
    "ReadinessResponse",
    "PaginationParams",
    "UserRegisterRequest",
    "UserLoginRequest",
    "RefreshTokenRequest",
    "TokenResponse",
    "AuthSuccessResponse",
    "UserResponse",
    "UserUpdateRequest",
    "InvestorProfileCreate",
    "InvestorProfileUpdate",
    "InvestorProfileResponse",
    "StockItem",
    "StockListResponse",
    "StockDetailResponse",
    "PriceHistoryPoint",
    "HoldingCreate",
    "HoldingResponse",
    "PortfolioCreate",
    "PortfolioResponse",
    "ShapFactor",
    "PredictionRequest",
    "PredictionResponse",
    "SimulationRequest",
    "SimulationResponse",
    "ChatQueryRequest",
    "ChatSourceItem",
    "ChatMessageResponse",
    "ChatQueryResponse",
    "ChatSessionResponse",
    "MetricCard",
    "PortfolioPerformanceItem",
    "DashboardResponse",
    "IndexQuote",
    "IndicesOverviewResponse",
    "IntradayChartPoint",
    "IntradayChartResponse",
    "MarketStatusInfo",
]

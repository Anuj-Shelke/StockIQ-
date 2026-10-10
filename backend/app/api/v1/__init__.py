from fastapi import APIRouter

from app.api.v1 import (
    health,
    portfolios,
    analyses,
    asset_comparison,
    snapshots,
    education,
    review_requests,
    admin_dashboard,
    admin_reviews,
    data_quality,
    notifications,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(portfolios.router, prefix="/portfolios", tags=["Portfolios"])
api_router.include_router(analyses.router, prefix="/analyses", tags=["Analyses"])
api_router.include_router(asset_comparison.router, prefix="/asset-comparison", tags=["Asset Comparison"])
api_router.include_router(snapshots.router, prefix="/snapshots", tags=["Snapshots"])
api_router.include_router(education.router, prefix="/education", tags=["Education"])
api_router.include_router(review_requests.router, prefix="/review-requests", tags=["Review Requests"])
api_router.include_router(admin_dashboard.router, prefix="/admin/dashboard", tags=["Admin Dashboard"])
api_router.include_router(admin_reviews.router, prefix="/admin/reviews", tags=["Admin Reviews"])
api_router.include_router(data_quality.router, prefix="/data-quality", tags=["Data Quality"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

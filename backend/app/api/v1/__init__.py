from fastapi import APIRouter

from app.api.v1 import (
    health,
    auth,
    users,
    profile,
    stocks,
    market,
    dashboard,
    predictions,
    portfolios,
    chatbot,
    administration,
    admin_dashboard,
    admin_reviews,
    analyses,
    asset_comparison,
    snapshots,
    education,
    review_requests,
    data_quality,
    notifications,
    recommendations,
    opening_predictions,
    sebi_rag,
)

api_router = APIRouter()

# Core system and health
api_router.include_router(health.router, tags=["Health"])

# Authentication, Users, and Profiles
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profile"])

# Financial Assets & Research
api_router.include_router(market.router, prefix="/market", tags=["Market Data & Indices"])
api_router.include_router(stocks.router, prefix="/stocks", tags=["Stocks"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions & Explanations"])
api_router.include_router(portfolios.router, prefix="/portfolios", tags=["Portfolios"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["Financial Education Chatbot"])

# Administration
api_router.include_router(administration.router, prefix="/administration", tags=["Administration"])
api_router.include_router(admin_dashboard.router, prefix="/admin/dashboard", tags=["Admin Dashboard"])
api_router.include_router(admin_reviews.router, prefix="/admin/reviews", tags=["Admin Reviews"])

# Analytics, Comparisons, and Support
api_router.include_router(analyses.router, prefix="/analyses", tags=["Analyses"])
api_router.include_router(asset_comparison.router, prefix="/asset-comparison", tags=["Asset Comparison"])
api_router.include_router(snapshots.router, prefix="/snapshots", tags=["Snapshots"])
api_router.include_router(education.router, prefix="/education", tags=["Education"])
api_router.include_router(review_requests.router, prefix="/review-requests", tags=["Review Requests"])
api_router.include_router(data_quality.router, prefix="/data-quality", tags=["Data Quality"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Personalized ML Recommendations"])
api_router.include_router(sebi_rag.router, prefix="/sebi", tags=["SEBI Regulations RAG"])
api_router.include_router(sebi_rag.router, prefix="/sebi_rag", tags=["SEBI Regulations RAG"])
api_router.include_router(sebi_rag.router, prefix="/sebi-rag", tags=["SEBI Regulations RAG"])

"""Personalized Machine Learning Stock Recommendations API Endpoint."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter()


@router.post("", response_model=RecommendationResponse, summary="Generate personalized ML stock recommendations")
@router.post("/", response_model=RecommendationResponse, summary="Generate personalized ML stock recommendations")
def generate_personalized_recommendations(
    request: RecommendationRequest,
    db: Session = Depends(get_db),
) -> RecommendationResponse:
    """
    Generate personalized stock and portfolio asset allocation recommendations
    using machine learning price targets, SHAP attributions, and demographic
    risk capacity modeling based on Age, Income, Investment Capital, and Horizon.
    """
    return RecommendationService.generate_recommendations(request)


@router.get("", response_model=RecommendationResponse, summary="Get default or query-based personalized recommendations")
@router.get("/", response_model=RecommendationResponse, summary="Get default or query-based personalized recommendations")
def get_recommendations_by_query(
    age: int = Query(30, ge=18, le=95, description="Investor age in years"),
    annual_income: float = Query(1200000.0, ge=0.0, description="Annual income in INR"),
    investment_amount: float = Query(100000.0, gt=0.0, description="Investment amount in INR"),
    investment_horizon_years: int = Query(5, ge=1, le=40, description="Investment horizon in years"),
    risk_tolerance: Optional[str] = Query(None, pattern="^(conservative|moderate|aggressive|dynamic)$"),
    primary_goal: Optional[str] = Query("wealth_creation"),
    db: Session = Depends(get_db),
) -> RecommendationResponse:
    """Query-based endpoint for instantaneous personalized stock recommendations."""
    request = RecommendationRequest(
        age=age,
        annual_income=annual_income,
        investment_amount=investment_amount,
        investment_horizon_years=investment_horizon_years,
        risk_tolerance=risk_tolerance,
        primary_goal=primary_goal,
    )
    return RecommendationService.generate_recommendations(request)

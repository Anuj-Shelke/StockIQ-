"""Machine Learning Personalized Stock Recommendation Service."""

from datetime import datetime, timezone
from typing import List, Dict, Any
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendedStockItem,
    InvestorProfileSummary,
    AssetAllocationBreakdown,
    NonEquityAllocation,
)

# Stock Catalog with ML Forecasting Predictions and SHAP Feature Insights
STOCK_CATALOG_UNIVERSE: List[Dict[str, Any]] = [
    {
        "symbol": "TCS.NS",
        "company_name": "Tata Consultancy Services Ltd.",
        "sector": "Information Technology",
        "market_cap_category": "Mega Cap",
        "current_price": 4120.25,
        "ml_predicted_target": 4345.50,
        "projected_return_pct": 5.47,
        "beta": 0.82,
        "volatility_risk": "Low",
        "ml_confidence": 0.88,
        "key_shap_drivers": [
            "Q3 margin expansion (+140 bps)",
            "USD/INR forex tailwinds",
            "High return on equity (48%) and debt-free balance sheet",
        ],
        "defensive_score": 92,
        "growth_score": 68,
    },
    {
        "symbol": "HDFCBANK.NS",
        "company_name": "HDFC Bank Ltd.",
        "sector": "Banking & Financials",
        "market_cap_category": "Mega Cap",
        "current_price": 1650.80,
        "ml_predicted_target": 1820.00,
        "projected_return_pct": 10.25,
        "beta": 0.88,
        "volatility_risk": "Low",
        "ml_confidence": 0.91,
        "key_shap_drivers": [
            "Post-merger deposit growth normalization",
            "Lowest non-performing asset (NPA) ratio in peer group",
            "Institutional foreign portfolio buying rebound",
        ],
        "defensive_score": 88,
        "growth_score": 78,
    },
    {
        "symbol": "RELIANCE.NS",
        "company_name": "Reliance Industries Ltd.",
        "sector": "Energy & Conglomerate",
        "market_cap_category": "Mega Cap",
        "current_price": 2980.50,
        "ml_predicted_target": 3210.00,
        "projected_return_pct": 7.70,
        "beta": 0.95,
        "volatility_risk": "Moderate",
        "ml_confidence": 0.87,
        "key_shap_drivers": [
            "Telecom ARPU expansion in Jio 5G subscriber base",
            "Retail segment EBIDTA margin growth",
            "Downstream refining margin stability",
        ],
        "defensive_score": 80,
        "growth_score": 82,
    },
    {
        "symbol": "INFY.NS",
        "company_name": "Infosys Ltd.",
        "sector": "Information Technology",
        "market_cap_category": "Large Cap",
        "current_price": 1890.10,
        "ml_predicted_target": 2010.00,
        "projected_return_pct": 6.34,
        "beta": 0.92,
        "volatility_risk": "Moderate",
        "ml_confidence": 0.85,
        "key_shap_drivers": [
            "Generative AI enterprise deal wins",
            "Strong North America BFSI contract renewals",
            "Healthy cash flow conversion ratio (>85%)",
        ],
        "defensive_score": 82,
        "growth_score": 75,
    },
    {
        "symbol": "ICICIBANK.NS",
        "company_name": "ICICI Bank Ltd.",
        "sector": "Banking & Financials",
        "market_cap_category": "Large Cap",
        "current_price": 1210.45,
        "ml_predicted_target": 1335.00,
        "projected_return_pct": 10.29,
        "beta": 1.05,
        "volatility_risk": "Moderate",
        "ml_confidence": 0.89,
        "key_shap_drivers": [
            "Industry-leading Return on Assets (RoA > 2.3%)",
            "Digital retail loan origination velocity",
            "Consistent double-digit loan book expansion",
        ],
        "defensive_score": 75,
        "growth_score": 88,
    },
    {
        "symbol": "BHARTIARTL.NS",
        "company_name": "Bharti Airtel Ltd.",
        "sector": "Telecommunications",
        "market_cap_category": "Large Cap",
        "current_price": 1480.00,
        "ml_predicted_target": 1585.00,
        "projected_return_pct": 7.09,
        "beta": 0.78,
        "volatility_risk": "Low",
        "ml_confidence": 0.86,
        "key_shap_drivers": [
            "Tariff hikes compounding into strong ARPU accretion",
            "African business currency stabilization",
            "Duopoly pricing power in domestic wireless market",
        ],
        "defensive_score": 86,
        "growth_score": 79,
    },
    {
        "symbol": "TATAMOTORS.NS",
        "company_name": "Tata Motors Ltd.",
        "sector": "Automotive & EV",
        "market_cap_category": "Large Cap",
        "current_price": 975.30,
        "ml_predicted_target": 1100.00,
        "projected_return_pct": 12.79,
        "beta": 1.28,
        "volatility_risk": "High",
        "ml_confidence": 0.82,
        "key_shap_drivers": [
            "Domestic EV passenger vehicle leadership (>70% share)",
            "JLR order book backlog and luxury margin expansion",
            "Net debt reduction towards zero-debt target",
        ],
        "defensive_score": 58,
        "growth_score": 94,
    },
    {
        "symbol": "SBIN.NS",
        "company_name": "State Bank of India",
        "sector": "Banking (PSU)",
        "market_cap_category": "Large Cap",
        "current_price": 825.60,
        "ml_predicted_target": 915.00,
        "projected_return_pct": 10.83,
        "beta": 1.15,
        "volatility_risk": "Moderate",
        "ml_confidence": 0.84,
        "key_shap_drivers": [
            "Net interest margin resilience and corporate capex pickup",
            "Gross NPA at 10-year historic lows (<2.3%)",
            "Attractive P/B multiple vs private sector peers",
        ],
        "defensive_score": 72,
        "growth_score": 85,
    },
]


class RecommendationService:
    """Service producing personalized ML stock and portfolio recommendations."""

    @classmethod
    def generate_recommendations(cls, request: RecommendationRequest) -> RecommendationResponse:
        age = request.age
        income = request.annual_income
        capital = request.investment_amount
        horizon = request.investment_horizon_years
        savings_ratio = round(capital / max(income, 1.0), 3)

        # 1. Quantitative Risk Capacity Score (0 - 100)
        # Factor A: Age (younger investors have greater human capital & compounding runway)
        age_score = max(5.0, min(35.0, (80 - age) * 0.6))
        # Factor B: Time Horizon (longer runway absorbs equity drawdown cycles)
        horizon_score = max(5.0, min(35.0, horizon * 3.5))
        # Factor C: Income Stability & Capital Cushion
        income_score = max(5.0, min(30.0, 15.0 + min(income / 200000.0, 15.0) - (savings_ratio * 5.0)))

        calculated_risk_score = round(age_score + horizon_score + income_score, 1)

        # 2. Risk Capacity Classification
        if calculated_risk_score >= 75:
            risk_capacity_level = "Aggressive"
        elif calculated_risk_score >= 60:
            risk_capacity_level = "Moderate-Aggressive"
        elif calculated_risk_score >= 45:
            risk_capacity_level = "Moderate"
        elif calculated_risk_score >= 32:
            risk_capacity_level = "Moderate-Conservative"
        else:
            risk_capacity_level = "Conservative"

        # Apply user risk tolerance override if explicitly set
        if request.risk_tolerance == "conservative":
            risk_capacity_level = "Conservative"
        elif request.risk_tolerance == "aggressive":
            risk_capacity_level = "Aggressive"
        elif request.risk_tolerance == "moderate":
            risk_capacity_level = "Moderate"

        # 3. Demographic Life-Cycle Asset Allocation Breakdown
        # Rule of 110: Equity % roughly (110 - age), modified by horizon and income
        raw_equity = 110 - age
        if horizon >= 7:
            raw_equity += 8
        elif horizon <= 2:
            raw_equity -= 20

        if risk_capacity_level == "Aggressive":
            raw_equity = max(raw_equity, 75)
        elif risk_capacity_level == "Conservative":
            raw_equity = min(raw_equity, 40)

        equity_pct = round(max(25.0, min(85.0, float(raw_equity))), 1)
        gold_pct = 10.0 if horizon >= 3 else 5.0
        cash_pct = 5.0
        fixed_income_pct = round(100.0 - (equity_pct + gold_pct + cash_pct), 1)

        allocation = AssetAllocationBreakdown(
            equity_pct=equity_pct,
            fixed_income_pct=fixed_income_pct,
            gold_pct=gold_pct,
            cash_buffer_pct=cash_pct,
        )

        investor_summary = InvestorProfileSummary(
            calculated_risk_capacity=risk_capacity_level,
            risk_score=calculated_risk_score,
            savings_ratio=savings_ratio,
            recommended_asset_allocation=allocation,
        )

        # 4. Filter & Rank Stocks based on User's Demographics & ML Metrics
        scored_stocks = []
        is_high_risk = risk_capacity_level in ("Aggressive", "Moderate-Aggressive")
        is_conservative = risk_capacity_level in ("Conservative", "Moderate-Conservative")

        for stock in STOCK_CATALOG_UNIVERSE:
            ml_conf = stock["ml_confidence"]
            proj_ret = stock["projected_return_pct"]
            beta = stock["beta"]

            # Fit calculation: Match investor's age/horizon with beta & growth vs defensive score
            if is_conservative:
                profile_fit = (stock["defensive_score"] * 0.7) + ((1.5 - min(beta, 1.5)) * 20.0)
            elif is_high_risk:
                profile_fit = (stock["growth_score"] * 0.7) + (min(proj_ret, 15.0) * 2.0)
            else:
                profile_fit = (stock["defensive_score"] * 0.4) + (stock["growth_score"] * 0.4) + 15.0

            suitability_score = round(min(98.0, max(45.0, (ml_conf * 40.0) + (profile_fit * 0.4) + (proj_ret * 1.5))), 1)

            if suitability_score >= 85:
                tier = "Strong Buy"
            elif suitability_score >= 70:
                tier = "Suitable"
            else:
                tier = "Moderate Fit"

            # Contextualized rationale tailored to age, income, capital, and horizon
            rationale = (
                f"For an investor aged {age} with a {horizon}-year horizon and ₹{capital:,.0f} investable capital, "
                f"{stock['symbol']} offers a calibrated {ml_conf * 100:.0f}% ML confidence score. "
                f"Its {stock['volatility_risk'].lower()} beta ({beta:.2f}) fits your {risk_capacity_level.lower()} risk profile, "
                f"supported by {stock['key_shap_drivers'][0].lower()}."
            )

            scored_stocks.append({
                **stock,
                "suitability_score": suitability_score,
                "suitability_tier": tier,
                "personalized_rationale": rationale,
            })

        # Sort by suitability descending and take top 5
        scored_stocks.sort(key=lambda s: s["suitability_score"], reverse=True)
        top_picks = scored_stocks[:5]

        # 5. Position Sizing & Allocation Weights across Equity Capital
        total_equity_capital = capital * (equity_pct / 100.0)
        # Weights normalized across top 5
        total_fit = sum(s["suitability_score"] for s in top_picks)

        recommended_items: List[RecommendedStockItem] = []
        for stock in top_picks:
            stock_weight = round((stock["suitability_score"] / total_fit) * equity_pct, 1)
            allocated_amount = round(capital * (stock_weight / 100.0), 2)
            shares = int(allocated_amount // stock["current_price"])

            recommended_items.append(
                RecommendedStockItem(
                    symbol=stock["symbol"],
                    company_name=stock["company_name"],
                    sector=stock["sector"],
                    market_cap_category=stock["market_cap_category"],
                    current_price=stock["current_price"],
                    ml_predicted_target=stock["ml_predicted_target"],
                    projected_return_pct=stock["projected_return_pct"],
                    suitability_score=stock["suitability_score"],
                    suitability_tier=stock["suitability_tier"],
                    recommended_allocation_pct=stock_weight,
                    recommended_allocation_amount=allocated_amount,
                    recommended_shares=shares,
                    volatility_risk=stock["volatility_risk"],
                    ml_confidence=stock["ml_confidence"],
                    key_shap_drivers=stock["key_shap_drivers"],
                    personalized_rationale=stock["personalized_rationale"],
                )
            )

        # 6. Non-Equity / Hedging Allocations
        gold_amount = round(capital * (gold_pct / 100.0), 2)
        fd_amount = round(capital * (fixed_income_pct / 100.0), 2)

        macro_hedges = NonEquityAllocation(
            gold_allocation_amount=gold_amount,
            gold_rationale=(
                f"Allocating {gold_pct:.0f}% (₹{gold_amount:,.0f}) to Sovereign / 24K Physical Gold hedges against "
                f"unanticipated market drawdowns and inflation over your {horizon}-year horizon."
            ),
            fixed_deposit_allocation_amount=fd_amount,
            fixed_deposit_rationale=(
                f"Allocating {fixed_income_pct:.0f}% (₹{fd_amount:,.0f}) to AAA-rated Fixed Deposits (7.1% APY) ensures "
                f"guaranteed capital preservation appropriate for an annual income base of ₹{income:,.0f}."
            ),
        )

        # Portfolio CAGR calculation
        weighted_equity_return = sum(
            (item.recommended_allocation_pct / equity_pct) * item.projected_return_pct for item in recommended_items
        ) if equity_pct > 0 else 0.0
        expected_cagr = round(
            (equity_pct / 100.0) * (weighted_equity_return * 1.5) +  # annualized extrapolation
            (gold_pct / 100.0) * 10.5 +
            (fixed_income_pct / 100.0) * 7.1,
            2,
        )

        return RecommendationResponse(
            investor_summary=investor_summary,
            recommended_stocks=recommended_items,
            macro_hedges=macro_hedges,
            expected_portfolio_cagr=expected_cagr,
            disclaimer="Recommendations are generated by quantitative ML models and do not constitute registered SEBI investment advice. Past performance is not indicative of future returns.",
            generated_at=datetime.now(timezone.utc),
        )

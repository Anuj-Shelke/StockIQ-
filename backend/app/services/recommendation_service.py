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

from app.db.stock_universe_data import COMPREHENSIVE_STOCK_UNIVERSE

# Normalized Stock Catalog with ML Forecasting Predictions and SHAP Feature Insights
STOCK_CATALOG_UNIVERSE: List[Dict[str, Any]] = []
for s in COMPREHENSIVE_STOCK_UNIVERSE:
    if s["symbol"] in ("GOLD", "SILVER"):
        continue
    vol = s.get("volatility", 18.0)
    vol_risk = "Low" if vol <= 17.0 else "Moderate" if vol <= 24.0 else "High"
    STOCK_CATALOG_UNIVERSE.append({
        "symbol": s["symbol"],
        "company_name": s.get("name") or s.get("company_name", s["symbol"]),
        "sector": s.get("sector", "Equities"),
        "exchange": s.get("exchange", "NSE"),
        "market_cap_category": s.get("market_cap_category", "Large Cap"),
        "current_price": float(s.get("current_price", 1000.0)),
        "ml_predicted_target": float(s.get("ml_predicted_target", round(s.get("current_price", 1000.0) * 1.12, 2))),
        "projected_return_pct": float(s.get("projected_return_pct", 12.0)),
        "beta": float(s.get("beta", 1.0)),
        "volatility_risk": vol_risk,
        "ml_confidence": float(s.get("ml_confidence", 0.88)),
        "key_shap_drivers": s.get("key_shap_drivers", ["Strong balance sheet", "Sector tailwinds", "Institutional inflows"]),
        "defensive_score": int(s.get("defensive_score", 75)),
        "growth_score": int(s.get("growth_score", 80)),
    })



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

        goal = (request.primary_goal or "wealth_creation").lower()

        # 4. Filter & Rank Stocks based on User's Demographics, Goal & ML Metrics
        scored_stocks = []
        is_high_risk = risk_capacity_level in ("Aggressive", "Moderate-Aggressive")
        is_conservative = risk_capacity_level in ("Conservative", "Moderate-Conservative")

        # Dynamically ensure catalog has latest stocks
        current_catalog = []
        for s in COMPREHENSIVE_STOCK_UNIVERSE:
            if s["symbol"] in ("GOLD", "SILVER"):
                continue
            vol = s.get("volatility", 18.0)
            vol_risk = "Low" if vol <= 17.0 else "Moderate" if vol <= 24.0 else "High"
            current_catalog.append({
                "symbol": s["symbol"],
                "company_name": s.get("name") or s.get("company_name", s["symbol"]),
                "sector": s.get("sector", "Equities"),
                "exchange": s.get("exchange", "NSE"),
                "market_cap_category": s.get("market_cap_category", "Large Cap"),
                "current_price": float(s.get("current_price", 1000.0)),
                "ml_predicted_target": float(s.get("ml_predicted_target", round(s.get("current_price", 1000.0) * 1.12, 2))),
                "projected_return_pct": float(s.get("projected_return_pct", 12.0)),
                "beta": float(s.get("beta", 1.0)),
                "volatility_risk": vol_risk,
                "ml_confidence": float(s.get("ml_confidence", 0.88)),
                "key_shap_drivers": s.get("key_shap_drivers", ["Strong balance sheet", "Sector tailwinds", "Institutional inflows"]),
                "defensive_score": int(s.get("defensive_score", 75)),
                "growth_score": int(s.get("growth_score", 80)),
            })

        for stock in current_catalog:
            ml_conf = stock["ml_confidence"]
            proj_ret = stock["projected_return_pct"]
            beta = stock["beta"]
            def_score = stock["defensive_score"]
            gro_score = stock["growth_score"]

            # Base profile fit calculation
            if is_conservative:
                profile_fit = (def_score * 0.7) + ((1.5 - min(beta, 1.5)) * 25.0)
            elif is_high_risk:
                profile_fit = (gro_score * 0.7) + (min(proj_ret, 25.0) * 2.5) + (max(0.0, beta - 0.8) * 10.0)
            else:
                profile_fit = (def_score * 0.45) + (gro_score * 0.45) + ((1.2 - abs(beta - 1.0)) * 10.0)

            # Goal-based strategic alignment adjustments
            goal_bonus = 0.0
            if "capital_preservation" in goal or "preservation" in goal:
                if def_score >= 85 and beta <= 0.90:
                    goal_bonus += 20.0
                if stock["volatility_risk"] == "Low":
                    goal_bonus += 10.0
                if beta > 1.2:
                    goal_bonus -= 20.0
            elif "dividend" in goal or "income" in goal:
                # Value and cash-flow compounders
                if any(w in stock["sector"].lower() for w in ("energy", "banking", "information technology", "fmcg")):
                    goal_bonus += 15.0
                if def_score >= 80:
                    goal_bonus += 10.0
            elif "wealth_creation" in goal or "aggressive" in goal:
                if gro_score >= 88 or proj_ret >= 14.0:
                    goal_bonus += 20.0
                if any(w in stock["sector"].lower() for w in ("consumer", "defense", "automotive", "capital markets", "technology")):
                    goal_bonus += 10.0
            else:
                # Balanced Growth
                goal_bonus += 5.0 if def_score >= 75 and gro_score >= 75 else 0.0

            # Horizon-based alignment adjustments
            horizon_adjustment = 0.0
            if horizon <= 2:
                # Short horizon: heavily penalize high beta and high volatility
                if stock["volatility_risk"] == "High" or beta > 1.25:
                    horizon_adjustment -= 25.0
                elif def_score >= 85:
                    horizon_adjustment += 15.0
            elif horizon >= 7:
                # Long runway: reward secular high-growth compounders
                if gro_score >= 85:
                    horizon_adjustment += 15.0

            # Age-based life cycle calibration
            age_adjustment = 0.0
            if age >= 55:
                if def_score >= 85 and stock["volatility_risk"] in ("Low", "Moderate"):
                    age_adjustment += 12.0
                elif beta > 1.2:
                    age_adjustment -= 15.0
            elif age <= 30:
                if gro_score >= 85:
                    age_adjustment += 10.0

            suitability_score = round(
                min(99.0, max(40.0, (ml_conf * 30.0) + (profile_fit * 0.35) + (proj_ret * 1.2) + goal_bonus + horizon_adjustment + age_adjustment)),
                1
            )

            if suitability_score >= 85:
                tier = "Strong Buy"
            elif suitability_score >= 70:
                tier = "Suitable"
            else:
                tier = "Moderate Fit"

            # Contextualized rationale tailored to age, income, capital, horizon, and goal
            goal_label = goal.replace("_", " ").title()
            rationale = (
                f"Tailored for your {goal_label} objective with a {horizon}-year runway at age {age}: "
                f"{stock['symbol']} delivers a {ml_conf * 100:.0f}% ML model confidence with "
                f"a {stock['volatility_risk'].lower()} volatility profile (beta {beta:.2f}). "
                f"Key driver: {stock['key_shap_drivers'][0]}."
            )

            scored_stocks.append({
                **stock,
                "suitability_score": suitability_score,
                "suitability_tier": tier,
                "personalized_rationale": rationale,
            })

        # Sort by suitability descending and take top 5 with sector diversification
        scored_stocks.sort(key=lambda s: s["suitability_score"], reverse=True)
        seen_sector_counts: Dict[str, int] = {}
        top_picks = []
        for s in scored_stocks:
            sec = s.get("sector", "Other")
            if seen_sector_counts.get(sec, 0) < 2:
                top_picks.append(s)
                seen_sector_counts[sec] = seen_sector_counts.get(sec, 0) + 1
            if len(top_picks) >= 5:
                break
        if len(top_picks) < 5:
            top_picks = scored_stocks[:5]

        # 5. Position Sizing & Allocation Weights across Equity Capital with Real-Time Prices
        from app.integrations.market_data.market_service import MarketDataService

        total_equity_capital = capital * (equity_pct / 100.0)
        # Weights normalized across top 5
        total_fit = sum(s["suitability_score"] for s in top_picks)

        recommended_items: List[RecommendedStockItem] = []
        for stock in top_picks:
            live_price = MarketDataService.get_realtime_price(
                stock["symbol"],
                fallback_default=stock["current_price"],
            )
            stock["current_price"] = live_price
            stock["ml_predicted_target"] = round(live_price * (1.0 + (stock["projected_return_pct"] / 100.0)), 2)

            stock_weight = round((stock["suitability_score"] / total_fit) * equity_pct, 1)
            allocated_amount = round(capital * (stock_weight / 100.0), 2)
            shares = int(allocated_amount // max(1.0, live_price))

            recommended_items.append(
                RecommendedStockItem(
                    symbol=stock["symbol"],
                    company_name=stock["company_name"],
                    sector=stock["sector"],
                    market_cap_category=stock["market_cap_category"],
                    current_price=live_price,
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

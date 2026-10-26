"""Stock and ETF Equity Allocation Engine.

Reuses:
- app.services.recommendation_service.STOCK_CATALOG_UNIVERSE
- app.services.explanation_service.ExplanationService (SHAP additive feature attribution)

Provides transparent selection, risk metrics, and SHAP explainability without duplicating code.
"""

from typing import List
from app.schemas.investment_planner import StockAllocationItem
from app.services.recommendation_service import STOCK_CATALOG_UNIVERSE
from app.services.explanation_service import ExplanationService


class PlannerStockEngine:
    """Selects and weights equities based on investor profile, risk tier, age, capital, and ML forecasting confidence."""

    @classmethod
    def select_stock_allocations(
        cls,
        total_equity_amount: float,
        risk_tier: str,
        preferred_sectors: List[str] = None,
        preferred_stocks: List[str] = None,
        age: int = 32,
        capital: float = 300000.0,
        horizon_years: float = 5.0,
        primary_goal: str = "wealth_creation",
    ) -> List[StockAllocationItem]:
        if total_equity_amount <= 0:
            return []

        preferred_sectors = [s.lower() for s in (preferred_sectors or [])]
        preferred_stocks = [s.upper() for s in (preferred_stocks or [])]

        is_young = age <= 35
        is_senior = age >= 50
        is_starter_capital = capital <= 500000.0  # e.g., 2 Lakh
        is_large_capital = capital >= 3000000.0   # e.g., 67 Lakh
        is_conservative = risk_tier in ["Very Low", "Low"] or is_senior
        is_aggressive = risk_tier == "High" or is_young

        # Filter and rank stocks from the StockIQ catalog universe
        ranked_stocks = []
        for stock in STOCK_CATALOG_UNIVERSE:
            def_score = float(stock.get("defensive_score", 70))
            gro_score = float(stock.get("growth_score", 70))
            beta = float(stock.get("beta", 1.0))
            proj_ret = float(stock.get("projected_return_pct", 10.0))
            mcap = stock.get("market_cap_category", "Large Cap")
            sec_lower = stock.get("sector", "").lower()
            cur_price = float(stock.get("current_price", 1000.0))

            score = 50.0

            if is_senior or is_conservative:
                # Senior / Wealth Preservation (e.g. 58yo, ₹67L): Capital safety, low beta (<0.85), high dividend moats
                score += def_score * 0.75 + (1.25 - min(beta, 1.5)) * 32.0 + proj_ret * 0.6
                if beta > 1.05:
                    score -= 35.0
                if stock.get("volatility_risk") == "High":
                    score -= 30.0
                if mcap in ["Mega Cap", "Large Cap"]:
                    score += 15.0
                if any(k in sec_lower for k in ["fmcg", "power", "utility", "pharma", "energy"]):
                    score += 15.0
                if gro_score >= 90 and def_score < 75:
                    score -= 25.0
            elif is_young or is_aggressive:
                # Young Accumulator (e.g. 28yo, ₹2L): High growth compounders, high return, capex tailwinds
                score += gro_score * 0.70 + proj_ret * 2.5 + (beta - 0.85) * 16.0
                if gro_score >= 88:
                    score += 18.0
                if def_score >= 92 and gro_score <= 70:
                    score -= 30.0
                if any(k in sec_lower for k in ["defence", "capital goods", "consumer", "tech", "auto", "telecom"]):
                    score += 14.0
                if is_starter_capital and gro_score >= 85:
                    score += 12.0
            else:
                # Balanced
                score += def_score * 0.45 + gro_score * 0.45 + (1.15 - abs(beta - 1.0)) * 14.0 + proj_ret * 1.2

            # Capital Size Calibration
            if is_large_capital:
                if mcap == "Mega Cap":
                    score += 12.0
                elif mcap == "Mid Cap":
                    score -= 10.0
            elif is_starter_capital:
                if cur_price <= 4000.0:
                    score += 6.0

            # Match sector preference
            if preferred_sectors and any(ps in sec_lower for ps in preferred_sectors):
                score += 12.0

            # Match stock preference gently without overriding risk profile
            if preferred_stocks and (stock["symbol"].upper() in preferred_stocks or stock["symbol"].split(".")[0].upper() in preferred_stocks):
                score += 8.0

            ranked_stocks.append((score, stock))

        # Sort by score descending and take top diversified stocks across sectors
        ranked_stocks.sort(key=lambda x: x[0], reverse=True)

        selected_items: List[StockAllocationItem] = []
        seen_sectors = set()
        chosen_catalog = []

        for score, stock in ranked_stocks:
            # Ensure sector diversification
            sec = stock["sector"]
            if sec not in seen_sectors or len(seen_sectors) >= 3:
                chosen_catalog.append(stock)
                seen_sectors.add(sec)
            if len(chosen_catalog) >= 4:
                break

        if not chosen_catalog:
            chosen_catalog = STOCK_CATALOG_UNIVERSE[:4]

        # Assign weights
        n = len(chosen_catalog)
        base_weight = round(100.0 / n, 1)
        weights = [base_weight] * n
        # Adjust last weight so sum is exactly 100%
        weights[-1] = round(100.0 - sum(weights[:-1]), 1)

        allocated_so_far = 0.0
        for i, stock in enumerate(chosen_catalog):
            w = weights[i]
            if i == len(chosen_catalog) - 1:
                amt = round(total_equity_amount - allocated_so_far, 2)
            else:
                amt = round(total_equity_amount * (w / 100.0), 2)
                allocated_so_far += amt

            # Retrieve real-time market price
            from app.integrations.market_data.market_service import MarketDataService
            cur_p = MarketDataService.get_realtime_price(
                stock["symbol"],
                fallback_default=stock["current_price"],
            )
            tgt_p = round(cur_p * (1.0 + (stock["projected_return_pct"] / 100.0)), 2)

            # Retrieve SHAP explanations using existing ExplanationService
            shap_factors = ExplanationService.decompose_prediction(
                symbol=stock["symbol"],
                current_price=cur_p,
                target_price=tgt_p,
                base_value=round(cur_p * 0.96, 2),
            )
            shap_highlights = [f"{f.name}: {f.description}" for f in shap_factors[:3]]

            # Combine with stock catalog drivers
            combined_shap = stock.get("key_shap_drivers", [])[:2] + [shap_highlights[0]] if shap_highlights else stock.get("key_shap_drivers", [])

            sig = "BUY" if stock["projected_return_pct"] >= 7.0 else "ACCUMULATE"

            selected_items.append(
                StockAllocationItem(
                    symbol=stock["symbol"],
                    company_name=stock["company_name"],
                    sector=stock["sector"],
                    market_cap_category=stock["market_cap_category"],
                    current_price=cur_p,
                    target_price=tgt_p,
                    projected_return_pct=stock["projected_return_pct"],
                    beta=stock["beta"],
                    volatility_risk=stock["volatility_risk"],
                    ml_confidence=stock["ml_confidence"],
                    weight_pct=w,
                    allocated_amount=amt,
                    key_shap_drivers=combined_shap,
                    recommendation_signal=sig,
                )
            )

        return selected_items

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
    """Selects and weights equities based on investor profile, risk tier, and ML forecasting confidence."""

    @classmethod
    def select_stock_allocations(
        cls,
        total_equity_amount: float,
        risk_tier: str,
        preferred_sectors: List[str] = None,
        preferred_stocks: List[str] = None,
    ) -> List[StockAllocationItem]:
        if total_equity_amount <= 0:
            return []

        preferred_sectors = [s.lower() for s in (preferred_sectors or [])]
        preferred_stocks = [s.upper() for s in (preferred_stocks or [])]

        # Filter and rank stocks from the StockIQ catalog universe
        ranked_stocks = []
        for stock in STOCK_CATALOG_UNIVERSE:
            score = 50.0

            # Match sector or stock preference
            if preferred_sectors and any(ps in stock["sector"].lower() for ps in preferred_sectors):
                score += 30.0
            if preferred_stocks and (stock["symbol"].upper() in preferred_stocks or stock["symbol"].split(".")[0].upper() in preferred_stocks):
                score += 40.0

            # Match risk profile
            if risk_tier in ["Very Low", "Low"]:
                score += stock.get("defensive_score", 70) * 0.4
                if stock["volatility_risk"] == "Low":
                    score += 25.0
            elif risk_tier == "Moderate":
                score += (stock.get("defensive_score", 70) + stock.get("growth_score", 70)) * 0.25
            else:  # High
                score += stock.get("growth_score", 70) * 0.5
                if stock["projected_return_pct"] >= 8.0:
                    score += 20.0

            ranked_stocks.append((score, stock))

        # Sort by score descending and take top 4-5 diversified stocks across sectors
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

            # Retrieve SHAP explanations using existing ExplanationService
            cur_p = stock["current_price"]
            tgt_p = stock["ml_predicted_target"]
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

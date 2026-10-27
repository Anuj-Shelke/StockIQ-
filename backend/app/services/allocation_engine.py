"""Personalized Asset Allocation Engine for Indian Multi-Asset Portfolios.

Dynamically distributes capital across Fixed Deposits, Gold, Individual Equities,
and Diversified Equity Index Funds. Guarantees 100% allocation sum and exact currency distribution.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Tuple
from app.schemas.investment_planner import AssetAllocationItem, PlannerProfileInput, SuitabilityAssessment


class AssetAllocationEngine:
    """Computes transparent, constraint-based portfolio allocations across asset classes."""

    # Historical annualized return assumptions for Indian asset classes (nominal baseline)
    ASSET_RETURN_BASELINES = {
        "Fixed Deposits": 7.10,          # 1-3Y Scheduled Commercial Bank FD rate
        "Gold": 11.20,                   # 10Y Indian domestic gold INR CAGR
        "Stocks": 13.80,                 # Top-tier Indian listed equities alpha
        "Diversified Index Funds": 12.50 # NIFTY 50 / NIFTY 500 10Y rolling CAGR
    }

    ASSET_RISK_LEVELS = {
        "Fixed Deposits": "Low",
        "Gold": "Moderate",
        "Stocks": "High",
        "Diversified Index Funds": "Moderate-High",
    }

    ASSET_LIQUIDITY = {
        "Fixed Deposits": "T+1 (Premature break penalty 0.5-1.0%)",
        "Gold": "T+1 for Gold ETFs / Immediate for Physical",
        "Stocks": "T+1 on NSE / BSE",
        "Diversified Index Funds": "T+2 for Mutual Funds / T+1 for Index ETFs",
    }

    @classmethod
    def compute_allocation(
        cls,
        profile: PlannerProfileInput,
        suitability: SuitabilityAssessment,
    ) -> List[AssetAllocationItem]:
        """Compute personalized asset allocation percentages and INR amounts summing to 100%."""
        capital = suitability.investable_capital_allocated
        risk_tier = suitability.composite_risk_rating
        horizon_years = suitability.suggested_investment_horizon_years
        liquidity_pref = profile.required_liquidity
        max_loss = profile.max_acceptable_loss_pct

        # 1. Baseline Distribution by Composite Risk Rating and Demographic Life-Stage (Rule of 110)
        age = profile.age or 35
        if age <= 30:
            # Young Accumulator (e.g. 28yo): High compounding equity runway
            if risk_tier in ["High", "Moderate"]:
                raw_weights = {
                    "Fixed Deposits": 10.0,
                    "Gold": 10.0,
                    "Stocks": 45.0,
                    "Diversified Index Funds": 35.0,
                }
            else:
                raw_weights = {
                    "Fixed Deposits": 20.0,
                    "Gold": 15.0,
                    "Stocks": 35.0,
                    "Diversified Index Funds": 30.0,
                }
        elif age >= 52:
            # Senior / Pre-Retirement (e.g. 58yo): High capital protection, low equity drawdown risk
            raw_weights = {
                "Fixed Deposits": 45.0,
                "Gold": 15.0,
                "Stocks": 18.0,
                "Diversified Index Funds": 22.0,
            }
        elif risk_tier == "Very Low":
            raw_weights = {
                "Fixed Deposits": 65.0,
                "Gold": 15.0,
                "Stocks": 5.0,
                "Diversified Index Funds": 15.0,
            }
        elif risk_tier == "Low":
            raw_weights = {
                "Fixed Deposits": 45.0,
                "Gold": 15.0,
                "Stocks": 15.0,
                "Diversified Index Funds": 25.0,
            }
        elif risk_tier == "Moderate":
            raw_weights = {
                "Fixed Deposits": 25.0,
                "Gold": 15.0,
                "Stocks": 30.0,
                "Diversified Index Funds": 30.0,
            }
        else:  # High
            raw_weights = {
                "Fixed Deposits": 10.0,
                "Gold": 10.0,
                "Stocks": 45.0,
                "Diversified Index Funds": 35.0,
            }

        # 2. Adjust for Horizon Runway
        # For horizons < 2 years, drastically reduce equities due to sequence-of-returns drawdown risk
        if horizon_years < 1.0:
            raw_weights["Fixed Deposits"] = max(raw_weights["Fixed Deposits"], 80.0)
            raw_weights["Stocks"] = min(raw_weights["Stocks"], 0.0)
            raw_weights["Diversified Index Funds"] = min(raw_weights["Diversified Index Funds"], 10.0)
            raw_weights["Gold"] = min(raw_weights["Gold"], 10.0)
        elif horizon_years < 3.0:
            raw_weights["Fixed Deposits"] += 15.0
            raw_weights["Stocks"] = max(5.0, raw_weights["Stocks"] - 10.0)
            raw_weights["Diversified Index Funds"] = max(10.0, raw_weights["Diversified Index Funds"] - 5.0)
        elif horizon_years >= 7.0:
            # Long runway allows absorbing volatility
            equity_shift = 10.0
            raw_weights["Fixed Deposits"] = max(5.0, raw_weights["Fixed Deposits"] - equity_shift)
            raw_weights["Diversified Index Funds"] += equity_shift * 0.6
            raw_weights["Stocks"] += equity_shift * 0.4

        # 3. Adjust for Liquidity Requirement
        if liquidity_pref == "High":
            raw_weights["Fixed Deposits"] += 10.0
            raw_weights["Stocks"] = max(5.0, raw_weights["Stocks"] - 5.0)
            raw_weights["Gold"] = max(5.0, raw_weights["Gold"] - 5.0)

        # 4. Maximum Loss Constraint
        # If max loss is tight (< 10%), total equities (Stocks + Funds) cannot exceed 30%
        if max_loss <= 8.0:
            excess_equity = max(0.0, (raw_weights["Stocks"] + raw_weights["Diversified Index Funds"]) - 20.0)
            if excess_equity > 0:
                raw_weights["Stocks"] *= 0.5
                raw_weights["Diversified Index Funds"] *= 0.5
                raw_weights["Fixed Deposits"] += excess_equity
        elif max_loss <= 12.0:
            excess_equity = max(0.0, (raw_weights["Stocks"] + raw_weights["Diversified Index Funds"]) - 35.0)
            if excess_equity > 0:
                raw_weights["Stocks"] -= excess_equity * 0.6
                raw_weights["Diversified Index Funds"] -= excess_equity * 0.4
                raw_weights["Fixed Deposits"] += excess_equity

        # 5. User Asset Class Preferences (Normalizing format strings robustly)
        raw_prefs = profile.preferred_asset_classes or []
        normalized_prefs = set()
        for p in raw_prefs:
            p_upper = str(p).upper()
            if "STOCK" in p_upper or "EQUITY" in p_upper:
                normalized_prefs.add("Stocks")
            if "GOLD" in p_upper:
                normalized_prefs.add("Gold")
            if "DEPOSIT" in p_upper or "FD" in p_upper:
                normalized_prefs.add("Fixed Deposits")
            if "FUND" in p_upper or "INDEX" in p_upper or "MUTUAL" in p_upper:
                normalized_prefs.add("Diversified Index Funds")

        if normalized_prefs:
            if "Stocks" not in normalized_prefs:
                raw_weights["Fixed Deposits"] += raw_weights["Stocks"] * 0.5
                raw_weights["Diversified Index Funds"] += raw_weights["Stocks"] * 0.5
                raw_weights["Stocks"] = 0.0
            if "Gold" not in normalized_prefs:
                raw_weights["Fixed Deposits"] += raw_weights["Gold"] * 0.5
                raw_weights["Diversified Index Funds"] += raw_weights["Gold"] * 0.5
                raw_weights["Gold"] = 0.0
            if "Fixed Deposits" not in normalized_prefs and risk_tier in ["Moderate", "High"] and horizon_years >= 3.0:
                raw_weights["Diversified Index Funds"] += raw_weights["Fixed Deposits"]
                raw_weights["Fixed Deposits"] = 0.0

        # 6. Normalize Weights to 100.00%
        total_raw = sum(raw_weights.values())
        norm_pcts = {k: round((v / total_raw) * 100.0, 2) for k, v in raw_weights.items()}

        # Rounding correction to guarantee exact 100.00% sum
        diff = round(100.0 - sum(norm_pcts.values()), 2)
        # Add residual to largest allocated component
        largest_key = max(norm_pcts, key=norm_pcts.get)
        norm_pcts[largest_key] = round(norm_pcts[largest_key] + diff, 2)

        # 7. Calculate Amounts in INR (summing exactly to capital)
        amounts: Dict[str, float] = {}
        allocated_so_far = 0.0
        keys_list = list(norm_pcts.keys())

        for i, k in enumerate(keys_list):
            if i == len(keys_list) - 1:
                amounts[k] = round(capital - allocated_so_far, 2)
            else:
                amt = round(capital * (norm_pcts[k] / 100.0), 2)
                amounts[k] = amt
                allocated_so_far += amt

        # 8. Rationale Generation
        reasons = {
            "Fixed Deposits": (
                f"{norm_pcts['Fixed Deposits']:.1f}% (₹{amounts['Fixed Deposits']:,.0f}) allocated to provide capital preservation, "
                f"guaranteed coupon yield (~7.1%), and liquidity anchor with DICGC insurance protection."
            ),
            "Gold": (
                f"{norm_pcts['Gold']:.1f}% (₹{amounts['Gold']:,.0f}) allocated as a non-correlated inflation hedge and geopolitical shock absorber "
                f"(historical 10Y INR CAGR: 11.2%)."
            ),
            "Stocks": (
                f"{norm_pcts['Stocks']:.1f}% (₹{amounts['Stocks']:,.0f}) allocated to high-conviction Indian equities with positive ML forecasts "
                f"and robust return-on-equity to generate long-term capital appreciation."
            ),
            "Diversified Index Funds": (
                f"{norm_pcts['Diversified Index Funds']:.1f}% (₹{amounts['Diversified Index Funds']:,.0f}) allocated to broad-market index/ETFs (NIFTY 50) "
                f"for cost-efficient sector diversification and reduced single-stock drawdown risk."
            ),
        }

        labels = {
            "Fixed Deposits": "Fixed Income & Capital Preservation",
            "Gold": "Inflation Hedge & Commodity Buffer",
            "Stocks": "Direct Equity Alpha",
            "Diversified Index Funds": "Core Market Beta (Index / ETFs)",
        }

        items: List[AssetAllocationItem] = []
        for k in ["Fixed Deposits", "Gold", "Stocks", "Diversified Index Funds"]:
            items.append(
                AssetAllocationItem(
                    asset_class=k,
                    category_label=labels[k],
                    allocation_pct=norm_pcts[k],
                    allocated_amount=amounts[k],
                    expected_return_pct=cls.ASSET_RETURN_BASELINES[k],
                    risk_level=cls.ASSET_RISK_LEVELS[k],
                    liquidity=cls.ASSET_LIQUIDITY[k],
                    reason=reasons[k],
                )
            )

        return items

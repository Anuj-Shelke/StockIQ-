"""Unified Cross-Asset Comparison Engine (Equities vs Physical Gold vs Fixed Deposit)."""

import math
from typing import Dict, List, Tuple
from app.schemas.asset_comparison import (
    AssetComparisonParams,
    AssetComparisonResponse,
    AssetSummaryMetric,
    ComparisonDataPoint,
)
from app.services.fd_service import FDService
from app.services.gold_service import GoldService


class AssetComparisonService:
    """Orchestrates comparative returns, drawdown metrics, and wealth trajectories."""

    EQUITY_CAGR = 0.145     # 14.5% historical NIFTY 50 10-year CAGR
    EQUITY_MDD = 28.5      # 28.5% historical equity drawdown

    @classmethod
    def _calculate_equity_trajectory(
        cls,
        initial_investment: float,
        monthly_sip: float,
        years: int,
        inflation_rate: float = 0.055,
        inflation_adjusted: bool = False,
    ) -> Tuple[List[float], Dict]:
        """Compute compounding trajectory of diversified equities (NIFTY 50)."""
        months = years * 12
        monthly_rate = math.pow(1.0 + cls.EQUITY_CAGR, 1.0 / 12.0) - 1.0
        monthly_inflation = math.pow(1.0 + inflation_rate, 1.0 / 12.0) - 1.0 if inflation_adjusted else 0.0

        current_val = initial_investment
        total_invested = initial_investment
        yearly_values = [initial_investment]

        for m in range(1, months + 1):
            current_val = current_val * (1.0 + monthly_rate)
            if monthly_sip > 0:
                current_val += monthly_sip
                total_invested += monthly_sip

            if m % 12 == 0:
                val_to_record = current_val
                if inflation_adjusted:
                    discount_factor = math.pow(1.0 + monthly_inflation, m)
                    val_to_record = current_val / discount_factor
                yearly_values.append(round(val_to_record, 2))

        final_value = yearly_values[-1]
        total_return_pct = round(((final_value - total_invested) / total_invested) * 100.0, 2) if total_invested > 0 else 0.0
        cagr = round((math.pow(final_value / total_invested, 1.0 / years) - 1.0) * 100.0, 2) if total_invested > 0 and years > 0 else cls.EQUITY_CAGR * 100

        metrics = {
            "total_final_value": final_value,
            "total_invested": round(total_invested, 2),
            "total_return_percent": total_return_pct,
            "cagr": cagr,
            "max_drawdown": cls.EQUITY_MDD,
            "liquidity": "T+1 Settlement (High)",
            "tax_implication": "LTCG 12.5% (>₹1.25L exemption)",
            "risk_level": "High",
        }

        return yearly_values, metrics

    @classmethod
    def compare_assets(cls, params: AssetComparisonParams) -> AssetComparisonResponse:
        """Run synchronized simulation across Equities, Gold, and Bank Fixed Deposit."""
        horizon_map = {"1Y": 1, "3Y": 3, "5Y": 5, "10Y": 10}
        years = horizon_map.get(params.time_horizon, 5)

        # 1. Equity Trajectory
        eq_vals, eq_metrics = cls._calculate_equity_trajectory(
            params.initial_investment,
            params.monthly_sip,
            years,
            inflation_rate=0.055,
            inflation_adjusted=params.inflation_adjusted,
        )

        # 2. Gold Trajectory
        gold_vals, gold_metrics = GoldService.calculate_trajectory(
            params.initial_investment,
            params.monthly_sip,
            years,
            inflation_rate=0.055,
            inflation_adjusted=params.inflation_adjusted,
        )

        # 3. Fixed Deposit Trajectory
        fd_vals, fd_metrics = FDService.calculate_trajectory(
            params.initial_investment,
            params.monthly_sip,
            years,
            annual_rate_percent=params.fd_rate_override,
            inflation_rate=0.055,
            inflation_adjusted=params.inflation_adjusted,
        )

        # Assemble Synchronized Data Points
        trajectory: List[ComparisonDataPoint] = []
        for i in range(len(eq_vals)):
            period_label = "Start" if i == 0 else f"Year {i}"
            trajectory.append(
                ComparisonDataPoint(
                    period=period_label,
                    equity=eq_vals[i],
                    gold=gold_vals[i],
                    fixed_deposit=fd_vals[i],
                )
            )

        summary_metrics: List[AssetSummaryMetric] = [
            AssetSummaryMetric(
                asset_class="Equities (NIFTY 50)",
                color="#3b82f6",
                total_final_value=eq_metrics["total_final_value"],
                total_invested=eq_metrics["total_invested"],
                total_return_percent=eq_metrics["total_return_percent"],
                cagr=eq_metrics["cagr"],
                max_drawdown=eq_metrics["max_drawdown"],
                liquidity=eq_metrics["liquidity"],
                tax_implication=eq_metrics["tax_implication"],
                risk_level=eq_metrics["risk_level"],
            ),
            AssetSummaryMetric(
                asset_class="Physical Gold (24K)",
                color="#f59e0b",
                total_final_value=gold_metrics["total_final_value"],
                total_invested=gold_metrics["total_invested"],
                total_return_percent=gold_metrics["total_return_percent"],
                cagr=gold_metrics["cagr"],
                max_drawdown=gold_metrics["max_drawdown"],
                liquidity=gold_metrics["liquidity"],
                tax_implication=gold_metrics["tax_implication"],
                risk_level=gold_metrics["risk_level"],
            ),
            AssetSummaryMetric(
                asset_class="Bank Fixed Deposit",
                color="#10b981",
                total_final_value=fd_metrics["total_final_value"],
                total_invested=fd_metrics["total_invested"],
                total_return_percent=fd_metrics["total_return_percent"],
                cagr=fd_metrics["cagr"],
                max_drawdown=fd_metrics["max_drawdown"],
                liquidity=fd_metrics["liquidity"],
                tax_implication=fd_metrics["tax_implication"],
                risk_level=fd_metrics["risk_level"],
            ),
        ]

        # Determine winner
        best = max(summary_metrics, key=lambda m: m.total_final_value)
        winner_name = best.asset_class

        diff_fd = best.total_final_value - fd_metrics["total_final_value"]
        diff_str = f"₹{diff_fd:,.0f}" if diff_fd > 0 else "₹0"

        if winner_name == "Equities (NIFTY 50)":
            takeaway = (
                f"Equities generated the highest wealth creation over {params.time_horizon}, "
                f"outperforming Bank FD by {diff_str} in net capital, but endured a {eq_metrics['max_drawdown']}% historical drawdown."
            )
        else:
            takeaway = (
                f"{winner_name} provided superior risk-adjusted preservation over {params.time_horizon} "
                f"under the selected interest and compounding scenario."
            )

        return AssetComparisonResponse(
            params=params,
            trajectory=trajectory,
            metrics=summary_metrics,
            inflation_rate=5.5,
            winner_asset=winner_name,
            key_takeaway=takeaway,
        )

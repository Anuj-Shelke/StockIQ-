"""Multi-Scenario Wealth Projection Engine.

Computes multi-year compounding trajectories across Conservative, Base, and Optimistic
market scenarios with lump-sum compounding, monthly SIP contributions, and inflation adjustments.
"""

import math
from typing import Dict, List
from app.schemas.investment_planner import (
    AssetAllocationItem,
    WealthProjectionSummary,
    WealthProjectionYear,
)


class WealthProjectionEngine:
    """Calculates year-by-year wealth trajectories with scenario simulations and inflation discounting."""

    # Scenario return rates by asset class [Conservative, Base, Optimistic]
    SCENARIO_RATES = {
        "Fixed Deposits": (0.055, 0.071, 0.078),
        "Gold": (0.065, 0.112, 0.145),
        "Stocks": (0.075, 0.138, 0.175),
        "Diversified Index Funds": (0.070, 0.125, 0.160),
    }

    @classmethod
    def calculate_projections(
        cls,
        allocations: List[AssetAllocationItem],
        horizon_years: int,
        monthly_sip: float = 0.0,
        inflation_rate: float = 0.055,  # 5.5% standard RBI target band for India
    ) -> WealthProjectionSummary:
        horizon = max(1, horizon_years)
        total_initial = sum(item.allocated_amount for item in allocations)

        # Calculate weighted portfolio returns for each scenario
        conservative_r = sum(
            (item.allocation_pct / 100.0) * cls.SCENARIO_RATES.get(item.asset_class, (0.06, 0.09, 0.12))[0]
            for item in allocations
        )
        base_r = sum(
            (item.allocation_pct / 100.0) * cls.SCENARIO_RATES.get(item.asset_class, (0.06, 0.09, 0.12))[1]
            for item in allocations
        )
        optimistic_r = sum(
            (item.allocation_pct / 100.0) * cls.SCENARIO_RATES.get(item.asset_class, (0.06, 0.09, 0.12))[2]
            for item in allocations
        )

        trajectory: List[WealthProjectionYear] = []
        cumulative_invested = total_initial

        for y in range(1, horizon + 1):
            cumulative_invested = total_initial + (monthly_sip * 12.0 * y)
            months = y * 12

            # 1. Conservative
            c_lump = total_initial * math.pow(1.0 + conservative_r, y)
            c_sip = cls._calc_sip_fv(monthly_sip, conservative_r, months)
            c_val = round(c_lump + c_sip, 2)

            # 2. Base
            b_lump = total_initial * math.pow(1.0 + base_r, y)
            b_sip = cls._calc_sip_fv(monthly_sip, base_r, months)
            b_val = round(b_lump + b_sip, 2)

            # 3. Optimistic
            o_lump = total_initial * math.pow(1.0 + optimistic_r, y)
            o_sip = cls._calc_sip_fv(monthly_sip, optimistic_r, months)
            o_val = round(o_lump + o_sip, 2)

            # 4. Inflation Adjusted Base (Real purchasing power)
            discount = math.pow(1.0 + inflation_rate, y)
            real_val = round(b_val / discount, 2)

            trajectory.append(
                WealthProjectionYear(
                    year=y,
                    total_invested=round(cumulative_invested, 2),
                    conservative_value=c_val,
                    base_value=b_val,
                    optimistic_value=o_val,
                    inflation_adjusted_base_value=real_val,
                    inflation_discount_factor=round(discount, 4),
                )
            )

        final_pt = trajectory[-1]
        cagr_base = round((math.pow(final_pt.base_value / max(1.0, final_pt.total_invested), 1.0 / horizon) - 1.0) * 100.0, 2) if horizon > 0 else 0.0

        return WealthProjectionSummary(
            investment_horizon_years=horizon,
            initial_lump_sum=round(total_initial, 2),
            monthly_sip=round(monthly_sip, 2),
            total_principal_invested=final_pt.total_invested,
            conservative_final_value=final_pt.conservative_value,
            base_final_value=final_pt.base_value,
            optimistic_final_value=final_pt.optimistic_value,
            base_inflation_adjusted_value=final_pt.inflation_adjusted_base_value,
            projected_annual_cagr_base=cagr_base,
            yearly_trajectory=trajectory,
            inflation_assumption_pct=round(inflation_rate * 100.0, 2),
            disclaimer=(
                "Projections are mathematical compounding simulations based on historical asset class performance. "
                "Market returns are volatile and cannot be guaranteed. Actual future performance may vary."
            ),
        )

    @staticmethod
    def _calc_sip_fv(monthly_pmt: float, annual_rate: float, total_months: int) -> float:
        """Future value of an ordinary monthly annuity due."""
        if monthly_pmt <= 0 or total_months <= 0:
            return 0.0
        m_rate = math.pow(1.0 + annual_rate, 1.0 / 12.0) - 1.0
        if m_rate <= 0:
            return monthly_pmt * total_months
        fv = monthly_pmt * ((math.pow(1.0 + m_rate, total_months) - 1.0) / m_rate) * (1.0 + m_rate)
        return fv

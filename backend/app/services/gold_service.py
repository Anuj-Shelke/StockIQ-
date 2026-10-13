"""Domestic Physical Gold (24K) Historical Price & Returns Simulation Engine."""

import math
from typing import Dict, List, Tuple


class GoldService:
    """Simulates physical gold investment growth, returns, and historical volatility."""

    HISTORICAL_CAGR = 0.112  # 11.2% historical 10-year CAGR for Indian 24K gold in INR
    HISTORICAL_MDD = 14.2    # 14.2% historical peak-to-trough decline
    ANNUAL_VOLATILITY = 12.8 # 12.8% annualized standard deviation

    @classmethod
    def calculate_trajectory(
        cls,
        initial_investment: float,
        monthly_sip: float,
        years: int,
        inflation_rate: float = 0.055,
        inflation_adjusted: bool = False,
    ) -> Tuple[List[float], Dict]:
        """Calculate month-by-month physical gold wealth progression.

        Returns:
            Tuple of:
            - List of portfolio values at end of each year/period
            - Summary metrics dictionary
        """
        months = years * 12
        monthly_rate = math.pow(1.0 + cls.HISTORICAL_CAGR, 1.0 / 12.0) - 1.0
        monthly_inflation = math.pow(1.0 + inflation_rate, 1.0 / 12.0) - 1.0 if inflation_adjusted else 0.0

        current_val = initial_investment
        total_invested = initial_investment
        yearly_values = [initial_investment]

        for m in range(1, months + 1):
            # Compound existing corpus
            current_val = current_val * (1.0 + monthly_rate)
            # Add SIP contribution
            if monthly_sip > 0:
                current_val += monthly_sip
                total_invested += monthly_sip

            if m % 12 == 0:
                val_to_record = current_val
                if inflation_adjusted:
                    # Discount by accumulated inflation
                    discount_factor = math.pow(1.0 + monthly_inflation, m)
                    val_to_record = current_val / discount_factor
                yearly_values.append(round(val_to_record, 2))

        final_value = yearly_values[-1]
        total_return_pct = round(((final_value - total_invested) / total_invested) * 100.0, 2) if total_invested > 0 else 0.0
        cagr = round((math.pow(final_value / total_invested, 1.0 / years) - 1.0) * 100.0, 2) if total_invested > 0 and years > 0 else cls.HISTORICAL_CAGR * 100

        metrics = {
            "total_final_value": final_value,
            "total_invested": round(total_invested, 2),
            "total_return_percent": total_return_pct,
            "cagr": cagr,
            "max_drawdown": cls.HISTORICAL_MDD,
            "liquidity": "T+2 / Immediate Jeweller buyback",
            "tax_implication": "LTCG 12.5% without indexation (>24M)",
            "risk_level": "Medium",
        }

        return yearly_values, metrics

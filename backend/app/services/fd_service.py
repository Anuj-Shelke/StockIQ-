"""Bank Fixed Deposit (FD) Compounding Simulation Engine."""

import math
from typing import Dict, List, Tuple


class FDService:
    """Simulates Bank Fixed Deposit compounding with quarterly reinvestment and inflation adjustments."""

    @classmethod
    def calculate_trajectory(
        cls,
        initial_investment: float,
        monthly_sip: float,
        years: int,
        annual_rate_percent: float = 7.1,
        inflation_rate: float = 0.055,
        inflation_adjusted: bool = False,
        compounding_per_year: int = 4,  # Quarterly compounding standard in Indian banks
    ) -> Tuple[List[float], Dict]:
        """Compute compounding trajectory of Bank Fixed Deposits.

        Returns:
            Tuple of:
            - List of portfolio values at end of each year/period
            - Summary metrics dictionary
        """
        r = annual_rate_percent / 100.0
        months = years * 12
        monthly_rate = math.pow(1.0 + r / compounding_per_year, compounding_per_year / 12.0) - 1.0
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
        cagr = round((math.pow(final_value / total_invested, 1.0 / years) - 1.0) * 100.0, 2) if total_invested > 0 and years > 0 else annual_rate_percent

        metrics = {
            "total_final_value": final_value,
            "total_invested": round(total_invested, 2),
            "total_return_percent": total_return_pct,
            "cagr": cagr,
            "max_drawdown": 0.0,
            "liquidity": "T+1 (Premature break penalty 0.5-1%)",
            "tax_implication": "Taxed at investor slab rate (TDS applicable)",
            "risk_level": "Low",
        }

        return yearly_values, metrics

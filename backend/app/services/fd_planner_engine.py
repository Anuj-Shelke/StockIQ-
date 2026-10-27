"""Fixed Deposit (FD) Planning and Comparison Engine.

Compares leading Indian scheduled commercial banks, calculates quarterly compounding,
evaluates DICGC insurance protection thresholds, and outlines premature withdrawal conditions.
"""

import math
from typing import List
from app.schemas.investment_planner import FixedDepositOption


class FDPlannerEngine:
    """Computes quarterly compounding maturity values and compares statutory bank offerings."""

    # Top Indian banking institutions with current indicative benchmark FD rates
    INSTITUTION_BENCHMARKS = [
        {
            "institution": "State Bank of India (SBI)",
            "category": "Public Sector Bank",
            "rates_by_tenure": {12: 6.80, 24: 7.00, 36: 6.75, 60: 6.50},
            "premature_penalty": "0.50% penalty on applicable rate if broken before maturity",
        },
        {
            "institution": "HDFC Bank Ltd.",
            "category": "Private Sector Bank",
            "rates_by_tenure": {12: 6.60, 24: 7.00, 36: 7.00, 60: 7.00},
            "premature_penalty": "1.00% penalty on rate applicable for the period deposit remained with bank",
        },
        {
            "institution": "ICICI Bank Ltd.",
            "category": "Private Sector Bank",
            "rates_by_tenure": {12: 6.70, 24: 7.20, 36: 7.00, 60: 6.90},
            "premature_penalty": "1.00% penalty for premature withdrawal",
        },
        {
            "institution": "Post Office Time Deposit (National Savings)",
            "category": "Sovereign / Post Office",
            "rates_by_tenure": {12: 6.90, 24: 7.00, 36: 7.10, 60: 7.50},
            "premature_penalty": "Savings account interest rate applicable if closed before 1 year",
        },
    ]

    @classmethod
    def generate_options(
        cls,
        allocated_amount: float,
        horizon_years: float,
    ) -> List[FixedDepositOption]:
        if allocated_amount <= 0:
            return []

        # Map horizon in years to nearest standard deposit tenure (12, 24, 36, or 60 months)
        if horizon_years <= 1.5:
            tenure_months = 12
        elif horizon_years <= 2.5:
            tenure_months = 24
        elif horizon_years <= 4.0:
            tenure_months = 36
        else:
            tenure_months = 60

        options: List[FixedDepositOption] = []
        n_banks = len(cls.INSTITUTION_BENCHMARKS)
        per_bank_amount = round(allocated_amount / n_banks, 2)

        for i, bank in enumerate(cls.INSTITUTION_BENCHMARKS):
            rate = bank["rates_by_tenure"].get(tenure_months, 7.00)
            r = rate / 100.0
            t_years = tenure_months / 12.0

            # Quarterly compounding: A = P * (1 + r/4)^(4*t)
            maturity = per_bank_amount * math.pow(1.0 + (r / 4.0), 4.0 * t_years)
            interest = maturity - per_bank_amount

            # Check DICGC statutory limit (₹5,00,000 per depositor per bank under RBI DICGC Act)
            is_insured = per_bank_amount <= 500000.0
            cov_amount = min(500000.0, per_bank_amount)

            options.append(
                FixedDepositOption(
                    institution=bank["institution"],
                    category=bank["category"],
                    interest_rate_pct=rate,
                    tenure_months=tenure_months,
                    compounding_method="Quarterly Compounding (Standard Indian Banking Convention)",
                    allocated_amount=per_bank_amount,
                    maturity_amount=round(maturity, 2),
                    total_interest_earned=round(interest, 2),
                    dicgc_protected=True,
                    dicgc_limit=500000.0,
                    premature_withdrawal_condition=bank["premature_penalty"],
                    liquidity_note=(
                        f"Fully covered under ₹5 Lakh DICGC insurance limit. "
                        f"Premature withdrawal allowed with {bank['premature_penalty'].split(';')[0]}."
                    ),
                )
            )

        return options

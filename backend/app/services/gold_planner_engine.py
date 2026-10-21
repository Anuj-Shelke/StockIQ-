"""Gold Investment Vehicles Planning and Comparative Analysis Engine.

Compares Gold ETFs, Sovereign Gold Bonds (SGB), and Physical 24K Bullion across
liquidity, tracking accuracy, storage charges, transaction friction, and tax treatment.
"""

from typing import List
from app.schemas.investment_planner import GoldProductOption


class GoldPlannerEngine:
    """Analyzes and compares Indian gold investment instruments."""

    CURRENT_24K_RATE_PER_GRAM = 7540.00  # Indicative Indian 24K Gold market rate per gram

    @classmethod
    def generate_options(cls, allocated_amount: float) -> List[GoldProductOption]:
        if allocated_amount <= 0:
            return []

        options = [
            GoldProductOption(
                product_type="Gold ETF (Exchange Traded Fund)",
                product_name="Nippon India ETF Gold BeES / HDFC Gold ETF",
                unit_market_rate=round(cls.CURRENT_24K_RATE_PER_GRAM / 100.0, 2),  # ~1 unit = ~0.01g or NAV benchmark
                allocated_amount=round(allocated_amount * 0.60, 2),
                historical_10yr_cagr=11.20,
                transaction_costs="Standard broker equity delivery brokerage (0 - 0.1%) + 0.40% Annual Expense Ratio (TER)",
                storage_costs="Zero physical storage or locker costs; held securely in Demat form",
                liquidity="T+1 settlement on NSE / BSE with real-time intraday trading liquidity",
                tracking_difference="Low tracking error (<0.3%) relative to domestic spot gold prices",
                tax_treatment="LTCG taxed at 12.5% without indexation for holdings > 24 months (Finance Act 2024)",
                risk_summary="Low tracking error (<0.3%), backed 100% by physical 99.5% pure gold bars stored in approved vaults.",
            ),
            GoldProductOption(
                product_type="Sovereign Gold Bond (SGB - RBI Secondary Market)",
                product_name="Reserve Bank of India Sovereign Gold Bond Tranches",
                unit_market_rate=cls.CURRENT_24K_RATE_PER_GRAM,  # 1 unit = 1 gram of gold
                allocated_amount=round(allocated_amount * 0.40, 2),
                historical_10yr_cagr=13.70,  # 11.2% gold CAGR + 2.50% annual coupon interest
                transaction_costs="Zero expense ratio; traded on NSE/BSE secondary market",
                storage_costs="Zero storage fees; sovereign credit guarantee backed by Government of India",
                liquidity="Traded on exchanges; secondary trading volumes may feature bid-ask spread discount",
                tracking_difference="Zero tracking error to 999 purity gold benchmark fixed by IBJA",
                tax_treatment="100% TAX-FREE Capital Gains if held until final 8-year maturity u/s 47(viic); 2.5% p.a. coupon is taxable at slab",
                risk_summary="Highest post-tax return profile for patient investors willing to hold through maturity cycle.",
            ),
            GoldProductOption(
                product_type="Physical Gold (24K Hallmarked Bullion / Coins)",
                product_name="MMTC-PAMP / Indian Mint 24K 999.9 Purity Coins",
                unit_market_rate=cls.CURRENT_24K_RATE_PER_GRAM,
                allocated_amount=0.0,  # Informational comparison
                historical_10yr_cagr=11.20,
                transaction_costs="3% GST on purchase + 3% to 8% minting/making charges",
                storage_costs="Bank safe deposit locker fees (₹1,500 - ₹8,000 annually) or home safe theft insurance",
                liquidity="Immediate offline jeweller buyback subject to melt/purity verification and deduction",
                tracking_difference="Premium over international spot due to import duties, GST, and minting margins",
                tax_treatment="LTCG taxed at 12.5% without indexation if held > 24 months (Budget 2024)",
                risk_summary="High transaction friction (GST + making charges) and security risks compared to digital demat instruments.",
            ),
        ]

        return options

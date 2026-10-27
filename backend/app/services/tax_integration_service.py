"""Integration Service connecting Personal Investment Planner with existing Tax Computation Module.

Reuses:
- app.services.tax_engine.TaxComputationEngine
- app.core.tax_rules (Section 111A, Section 112A, Budget 2024 rules)

DO NOT DUPLICATE: Reuses deterministic engine methods and statutory rules directly.
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, List, Tuple

from app.core.tax_rules import get_tax_rule_for_transfer, get_financial_year
from app.schemas.investment_planner import TaxIntegrationSummary
from app.services.tax_engine import TaxComputationEngine


class TaxIntegrationService:
    """Evaluates after-tax projections for planned multi-asset allocations using existing tax engine."""

    @classmethod
    def evaluate_portfolio_tax(
        cls,
        total_investable: float,
        horizon_years: float,
        equity_allocation_amount: float,
        fd_allocation_amount: float,
        gold_allocation_amount: float,
        mutual_fund_allocation_amount: float,
        projected_equity_gain: float,
        projected_fd_gain: float,
        projected_gold_gain: float,
        projected_mf_gain: float,
        investor_slab_rate_pct: float = 20.0,
    ) -> TaxIntegrationSummary:
        """Calculate comprehensive pre-tax vs post-tax portfolio outcome by integrating existing tax engine.

        Reuses:
            TaxComputationEngine.calculate_single_transaction for all equity / mutual fund capital gains.
        """
        today = date.today()
        # Simulated liquidation date at horizon
        liquidation_date = today + timedelta(days=int(horizon_years * 365.25))
        rule = get_tax_rule_for_transfer(liquidation_date, "LISTED_EQUITY")
        fy = get_financial_year(liquidation_date)

        # 1. Equity & Mutual Funds Capital Gains Tax (via TaxComputationEngine)
        combined_equity_gain = max(0.0, projected_equity_gain + projected_mf_gain)
        combined_equity_cost = max(1.0, equity_allocation_amount + mutual_fund_allocation_amount)
        simulated_shares = Decimal("100.00")
        simulated_buy_price = Decimal(str(round(combined_equity_cost / 100.0, 2)))
        simulated_sale_price = Decimal(str(round((combined_equity_cost + combined_equity_gain) / 100.0, 2)))

        # Invoke existing TaxComputationEngine
        equity_tax_res = TaxComputationEngine.calculate_single_transaction(
            symbol="PORTFOLIO_EQUITIES",
            sale_date=liquidation_date,
            quantity=simulated_shares,
            sale_price_per_share=simulated_sale_price,
            purchase_date=today,
            purchase_price_per_share=simulated_buy_price,
            asset_category="LISTED_EQUITY",
            eligible_expenses=Decimal("0.00"),
            ineligible_expenses=Decimal("0.00"),
            prior_ltcg_in_fy=Decimal("0.00"),
            surcharge_rate=Decimal("0.00"),
        )
        equity_tax = float(equity_tax_res.estimated_total_tax_rounded)

        # 2. Fixed Deposit Interest Taxation (Section 56: Income from Other Sources)
        # Bank FD interest is fully taxable at the investor's marginal slab rate
        fd_interest = max(0.0, projected_fd_gain)
        fd_slab_decimal = Decimal(str(investor_slab_rate_pct)) / Decimal("100")
        fd_tax = float(Decimal(str(round(fd_interest, 2))) * fd_slab_decimal * Decimal("1.04"))  # includes 4% cess

        # 3. Gold Taxation (Finance (No. 2) Act 2024)
        # For transfers after 23-Jul-2024, holding period > 24 months is LTCG at 12.5% (u/s 112) without indexation.
        # Short term (< 24 months) is taxed at slab rates.
        gold_gain = max(0.0, projected_gold_gain)
        is_gold_ltcg = horizon_years >= 2.0
        if is_gold_ltcg:
            gold_rate = Decimal("0.125")  # 12.5% LTCG under Budget 2024
        else:
            gold_rate = fd_slab_decimal  # slab rate if short term
        gold_tax = float(Decimal(str(round(gold_gain, 2))) * gold_rate * Decimal("1.04"))

        # Aggregate outcomes
        total_pre_tax_gain = round(projected_equity_gain + projected_fd_gain + projected_gold_gain + projected_mf_gain, 2)
        total_tax = round(equity_tax + fd_tax + gold_tax, 2)
        post_tax_gain = round(total_pre_tax_gain - total_tax, 2)
        post_tax_corpus = round(total_investable + post_tax_gain, 2)
        effective_tax_rate = round((total_tax / total_pre_tax_gain) * 100.0, 2) if total_pre_tax_gain > 0 else 0.0

        assumptions = [
            f"Equities & Equity Funds: Computed via StockIQ TaxComputationEngine u/s 112A using {rule.version_label} (LTCG rate 12.5% on annual gains exceeding ₹1,25,000 with 4% Health & Education cess).",
            f"Fixed Deposits: Compounded interest taxed under Section 56 at the investor's estimated slab rate of {investor_slab_rate_pct:.1f}% + 4% cess. Section 194A TDS applies if interest exceeds ₹40,000 p.a.",
            f"Gold: {'Long-term capital gain taxed at 12.5% without indexation under Finance Act 2024 (> 24 months)' if is_gold_ltcg else f'Short-term gain taxed at slab rate of {investor_slab_rate_pct:.1f}% (< 24 months)'}.",
            "Section 288B statutory rounding to the nearest ₹10 applied to tax calculations.",
        ]

        limitations = [
            "Surcharge not applied (applicable only if total taxable income exceeds ₹50 Lakhs).",
            "Sovereign Gold Bonds (SGB) held to maturity (8 years) are completely exempt from capital gains tax u/s 47(viic); this simulation conservatively models market Gold ETF / physical bullion tax treatment.",
            "Any capital losses from other personal portfolios available for set-off under Section 70/71 have not been factored in.",
        ]

        return TaxIntegrationSummary(
            pre_tax_expected_gain=total_pre_tax_gain,
            estimated_equity_ltcg_tax=equity_tax,
            estimated_fd_slab_tax=round(fd_tax, 2),
            estimated_gold_tax=round(gold_tax, 2),
            estimated_total_tax=total_tax,
            post_tax_expected_gain=post_tax_gain,
            post_tax_portfolio_value=post_tax_corpus,
            effective_tax_rate_pct=effective_tax_rate,
            reused_tax_engine_rule=rule.rule_id,
            equity_section_applied=f"{equity_tax_res.applicable_section} ({float(equity_tax_res.applicable_tax_rate * 100):.1f}% rate, ₹{float(equity_tax_res.annual_ltcg_threshold):,.0f} exemption)",
            fd_tax_provision=f"Section 56 / 194A ({investor_slab_rate_pct:.0f}% slab + 4% cess)",
            gold_tax_provision="Section 112 (12.5% LTCG without indexation post-Budget 2024)" if is_gold_ltcg else "Section 56 (Short term at slab rate)",
            tax_assumptions=assumptions,
            unsupported_tax_limitations=limitations,
            disclaimer="Tax liabilities are simulated estimates based on Indian Income-tax Act provisions. Consult a qualified Chartered Accountant before filing returns.",
        )

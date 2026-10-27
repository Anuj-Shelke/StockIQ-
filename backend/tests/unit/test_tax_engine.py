"""Comprehensive unit and scenario tests for the Capital Gains Tax Calculation Engine and XAI."""

from datetime import date
from decimal import Decimal
import pytest

from app.core.tax_rules import get_tax_rule_for_transfer, get_financial_year
from app.services.tax_engine import (
    AcquisitionLot,
    TaxComputationEngine,
    round_currency,
    round_tax_section_288b,
)
from app.services.tax_xai import TaxExplainabilityEngine


def test_mandatory_prompt_example_stcg():
    """MANDATORY TEST FROM SPEC:
    Purchase price per share: ₹1,000
    Number of shares: 10
    Selling price per share: ₹1,500
    Eligible deductible expenses: ₹0

    Expected calculation:
    Purchase Value = ₹1,000 × 10 = ₹10,000
    Sale Value = ₹1,500 × 10 = ₹15,000
    Gross Capital Gain = ₹15,000 - ₹10,000 = ₹5,000
    Net Capital Gain Before Tax = ₹5,000
    STCG 20% rate -> Basic tax before cess/surcharge = ₹1,000
    With 4% cess -> Total tax = ₹1,040
    After-tax profit = ₹3,960
    """
    res = TaxComputationEngine.calculate_single_transaction(
        symbol="TATAMOTORS.NS",
        sale_date=date(2024, 8, 15),  # Post 23 July 2024
        quantity=Decimal("10"),
        sale_price_per_share=Decimal("1500"),
        purchase_date=date(2024, 4, 1),  # Held ~4.5 months -> STCG
        purchase_price_per_share=Decimal("1000"),
        eligible_expenses=Decimal("0"),
    )

    assert res.purchase_value == Decimal("10000.00")
    assert res.sale_value == Decimal("15000.00")
    assert res.gross_capital_gain == Decimal("5000.00")
    assert res.net_capital_gain_before_tax == Decimal("5000.00")
    assert not res.is_long_term
    assert res.capital_gain_category == "STCG"
    assert res.applicable_section == "Section 111A"
    assert res.applicable_tax_rate == Decimal("0.20")
    # Basic tax before cess
    assert res.basic_tax == Decimal("1000.00")
    # 4% Health & Education Cess
    assert res.cess == Decimal("40.00")
    assert res.estimated_total_tax_rounded == Decimal("1040.00")
    assert res.estimated_after_tax_profit == Decimal("3960.00")
    assert res.status == "COMPLETE"


def test_qualifying_ltcg_below_annual_threshold():
    """LTCG held > 12 months, gain within ₹1,25,000 exemption limit -> Zero tax."""
    res = TaxComputationEngine.calculate_single_transaction(
        symbol="INFY.NS",
        sale_date=date(2024, 9, 1),
        quantity=Decimal("50"),
        sale_price_per_share=Decimal("1800"),  # Sale: 90,000
        purchase_date=date(2023, 1, 15),       # Held > 12 months
        purchase_price_per_share=Decimal("1000"),  # Buy: 50,000
        eligible_expenses=Decimal("500"),
    )

    assert res.is_long_term
    assert res.capital_gain_category == "LTCG"
    assert res.applicable_section == "Section 112A"
    assert res.gross_capital_gain == Decimal("40000.00")
    assert res.net_capital_gain_before_tax == Decimal("39500.00")
    # Below ₹1,25,000 exemption limit
    assert res.taxable_capital_gain == Decimal("0.00")
    assert res.basic_tax == Decimal("0.00")
    assert res.estimated_total_tax_rounded == Decimal("0.00")
    assert res.estimated_after_tax_profit == Decimal("39500.00")


def test_qualifying_ltcg_above_annual_threshold():
    """LTCG held > 12 months, gain ₹2,00,000 exceeds ₹1,25,000 exemption by ₹75,000."""
    res = TaxComputationEngine.calculate_single_transaction(
        symbol="RELIANCE.NS",
        sale_date=date(2024, 10, 10),
        quantity=Decimal("100"),
        sale_price_per_share=Decimal("4000"),   # Sale: 4,00,000
        purchase_date=date(2023, 5, 1),         # Held > 12 months
        purchase_price_per_share=Decimal("2000"),  # Buy: 2,00,000
    )

    assert res.is_long_term
    assert res.net_capital_gain_before_tax == Decimal("200000.00")
    # Exemption: ₹1,25,000. Taxable LTCG = 2,00,000 - 1,25,000 = ₹75,000
    assert res.taxable_capital_gain == Decimal("75000.00")
    assert res.applicable_tax_rate == Decimal("0.125")
    # Basic tax: 12.5% of 75,000 = ₹9,375.00
    assert res.basic_tax == Decimal("9375.00")
    # Cess: 4% of 9,375 = ₹375.00
    assert res.cess == Decimal("375.00")
    # Total tax: 9,375 + 375 = 9,750.00
    assert res.estimated_total_tax_rounded == Decimal("9750.00")
    assert res.estimated_after_tax_profit == Decimal("190250.00")


def test_pre_budget_2024_rates():
    """Transfers before 23-Jul-2024 use STCG 15% and LTCG 10% (exemption ₹1,00,000)."""
    # STCG Pre-Budget
    stcg_res = TaxComputationEngine.calculate_single_transaction(
        symbol="TCS.NS",
        sale_date=date(2024, 5, 10),  # Before 23 July 2024
        quantity=Decimal("10"),
        sale_price_per_share=Decimal("2000"),
        purchase_date=date(2024, 1, 10),
        purchase_price_per_share=Decimal("1000"),
    )
    assert stcg_res.rule_version == "RULE_2024_PRE_BUDGET"
    assert stcg_res.applicable_tax_rate == Decimal("0.15")
    # Gain 10,000 * 15% = 1500 + 4% cess (60) = 1560
    assert stcg_res.basic_tax == Decimal("1500.00")
    assert stcg_res.estimated_total_tax_rounded == Decimal("1560.00")

    # LTCG Pre-Budget
    ltcg_res = TaxComputationEngine.calculate_single_transaction(
        symbol="TCS.NS",
        sale_date=date(2024, 6, 1),
        quantity=Decimal("100"),
        sale_price_per_share=Decimal("3000"),
        purchase_date=date(2022, 1, 1),
        purchase_price_per_share=Decimal("1000"),
    )
    assert ltcg_res.rule_version == "RULE_2024_PRE_BUDGET"
    assert ltcg_res.applicable_tax_rate == Decimal("0.10")
    assert ltcg_res.annual_ltcg_threshold == Decimal("100000.00")
    # Gain 2,00,000 - 1,00,000 = 1,00,000 taxable * 10% = 10,000 + 4% cess (400) = 10,400
    assert ltcg_res.basic_tax == Decimal("10000.00")
    assert ltcg_res.estimated_total_tax_rounded == Decimal("10400.00")


def test_fifo_multiple_acquisition_lots():
    """Verify FIFO allocation when shares are bought across multiple lots at different prices and dates."""
    lots = [
        AcquisitionLot(lot_id="L1", purchase_date=date(2023, 1, 1), quantity=Decimal("10"), purchase_price=Decimal("1000")),
        AcquisitionLot(lot_id="L2", purchase_date=date(2024, 6, 1), quantity=Decimal("20"), purchase_price=Decimal("1200")),
    ]

    # Sell 15 shares on 2024-09-01
    # FIFO:
    # - 10 shares from L1 (purchased 2023-01-01 -> held > 12m -> LTCG)
    # - 5 shares from L2 (purchased 2024-06-01 -> held 3m -> STCG)
    res = TaxComputationEngine.calculate_with_fifo_lots(
        symbol="HDFCBANK.NS",
        sale_date=date(2024, 9, 1),
        quantity_to_sell=Decimal("15"),
        sale_price_per_share=Decimal("1600"),
        lots=lots,
    )

    assert len(res.lot_allocations) == 2
    assert res.lot_allocations[0]["lot_id"] == "L1"
    assert res.lot_allocations[0]["quantity_matched"] == 10.0
    assert res.lot_allocations[0]["category"] == "LTCG"

    assert res.lot_allocations[1]["lot_id"] == "L2"
    assert res.lot_allocations[1]["quantity_matched"] == 5.0
    assert res.lot_allocations[1]["category"] == "STCG"

    assert "MIXED" in res.capital_gain_category
    assert res.quantity == Decimal("15")


def test_deductible_vs_ineligible_expenses():
    """STT cannot be deducted from capital gains, but brokerage can."""
    res = TaxComputationEngine.calculate_single_transaction(
        symbol="INFY.NS",
        sale_date=date(2024, 8, 1),
        quantity=Decimal("10"),
        sale_price_per_share=Decimal("1500"),
        purchase_date=date(2024, 2, 1),
        purchase_price_per_share=Decimal("1000"),
        eligible_expenses=Decimal("100"),     # Allowable brokerage
        ineligible_expenses=Decimal("50"),    # Ineligible STT
    )

    # Gross gain = 5,000. Net gain = 5,000 - 100 = 4,900
    assert res.gross_capital_gain == Decimal("5000.00")
    assert res.net_capital_gain_before_tax == Decimal("4900.00")
    assert any("STT" in w for w in res.warnings)


def test_loss_scenario():
    """Realized capital loss results in zero tax and flags carry-forward potential."""
    res = TaxComputationEngine.calculate_single_transaction(
        symbol="ZOMATO.NS",
        sale_date=date(2024, 8, 1),
        quantity=Decimal("100"),
        sale_price_per_share=Decimal("80"),
        purchase_date=date(2024, 1, 1),
        purchase_price_per_share=Decimal("120"),
    )

    assert res.gross_capital_gain == Decimal("-4000.00")
    assert res.net_capital_gain_before_tax == Decimal("-4000.00")
    assert res.taxable_capital_gain == Decimal("0.00")
    assert res.estimated_total_tax_rounded == Decimal("0.00")
    assert res.estimated_after_tax_profit == Decimal("-4000.00")
    assert any("Capital loss" in a for a in res.assumptions)


def test_missing_purchase_date_triggers_provisional():
    """Missing purchase date marks status as PROVISIONAL with warning."""
    res = TaxComputationEngine.calculate_single_transaction(
        symbol="WIPRO.NS",
        sale_date=date(2024, 8, 1),
        quantity=Decimal("10"),
        sale_price_per_share=Decimal("500"),
        purchase_date=None,
        purchase_price_per_share=Decimal("400"),
    )

    assert res.status == "PROVISIONAL"
    assert res.holding_period_days is None
    assert any("Purchase date was not provided" in w for w in res.warnings)


def test_invalid_dates_and_zero_quantity():
    """Sale date earlier than purchase date, or zero quantity raises ValueError."""
    with pytest.raises(ValueError, match="cannot be earlier than purchase date"):
        TaxComputationEngine.calculate_single_transaction(
            symbol="INFY.NS",
            sale_date=date(2023, 1, 1),
            quantity=Decimal("10"),
            sale_price_per_share=Decimal("1500"),
            purchase_date=date(2024, 1, 1),
            purchase_price_per_share=Decimal("1000"),
        )

    with pytest.raises(ValueError, match="quantity must be strictly greater than 0"):
        TaxComputationEngine.calculate_single_transaction(
            symbol="INFY.NS",
            sale_date=date(2024, 5, 1),
            quantity=Decimal("0"),
            sale_price_per_share=Decimal("1500"),
            purchase_date=date(2024, 1, 1),
            purchase_price_per_share=Decimal("1000"),
        )


def test_surcharge_calculation():
    """Surcharge of 15% applied to basic tax, then 4% cess on sum."""
    res = TaxComputationEngine.calculate_single_transaction(
        symbol="RELIANCE.NS",
        sale_date=date(2024, 8, 1),
        quantity=Decimal("1000"),
        sale_price_per_share=Decimal("3000"),
        purchase_date=date(2024, 1, 1),
        purchase_price_per_share=Decimal("2000"),
        surcharge_rate=Decimal("0.15"),
    )

    # Gain: 10,00,000. STCG 20%: Basic Tax = 2,00,000
    # Surcharge @ 15%: 30,000
    # Subtotal: 2,30,000
    # Cess @ 4%: 9,200
    # Total: 2,39,200
    assert res.basic_tax == Decimal("200000.00")
    assert res.surcharge == Decimal("30000.00")
    assert res.cess == Decimal("9200.00")
    assert res.estimated_total_tax_rounded == Decimal("239200.00")


def test_xai_explanation_structure_and_consistency():
    """Verify XAI explanation produces all 7 required sections (A-G) and agrees with calculations."""
    res = TaxComputationEngine.calculate_single_transaction(
        symbol="TATAMOTORS.NS",
        sale_date=date(2024, 8, 15),
        quantity=Decimal("10"),
        sale_price_per_share=Decimal("1500"),
        purchase_date=date(2024, 4, 1),
        purchase_price_per_share=Decimal("1000"),
    )

    xai = TaxExplainabilityEngine.explain(res)

    assert "why_is_gain_taxable" in xai["explanation_sections"]
    assert "why_category_selected" in xai["explanation_sections"]
    assert "why_rate_applicable" in xai["explanation_sections"]
    assert "how_tax_calculated" in xai["explanation_sections"]
    assert "what_could_change_result" in xai["explanation_sections"]
    assert "what_will_be_net_profit" in xai["explanation_sections"]
    assert "what_should_i_do_next" in xai["explanation_sections"]

    # Verify structured metrics agree 100% with deterministic calculation
    metrics = xai["structured_metrics"]
    assert metrics["purchase_value"] == 10000.0
    assert metrics["sale_value"] == 15000.0
    assert metrics["gross_capital_gain"] == 5000.0
    assert metrics["basic_tax"] == 1000.0
    assert metrics["estimated_total_tax"] == 1040.0
    assert metrics["estimated_after_tax_profit"] == 3960.0
    assert "Section 111A" in metrics["applicable_section"]

"""Deterministic Indian Capital Gains Tax Calculation Engine.

Performs authoritative financial and tax computations using Python's Decimal type
to prevent floating-point inaccuracies. Implements Section 111A and Section 112A
rules, FIFO lot allocation, deductible expense validation, and Section 288B rounding.
"""

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple

from app.core.tax_rules import (
    TaxRuleVersion,
    get_tax_rule_for_transfer,
    get_financial_year,
)


def round_currency(value: Decimal) -> Decimal:
    """Round currency to 2 decimal places using standard half-up rounding."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def round_tax_section_288b(tax: Decimal) -> Decimal:
    """Round total tax liability to the nearest multiple of ten rupees under Section 288B."""
    # Example: 1044 -> 1040, 1045 -> 1050
    return (tax / Decimal("10")).quantize(Decimal("1"), rounding=ROUND_HALF_UP) * Decimal("10")


@dataclass
class AcquisitionLot:
    """An individual purchase lot of shares/units."""
    lot_id: str
    purchase_date: Optional[date]
    quantity: Decimal
    purchase_price: Decimal
    expenses: Decimal = Decimal("0.00")
    remaining_quantity: Decimal = field(init=False)

    def __post_init__(self):
        self.remaining_quantity = self.quantity


@dataclass
class TransactionCalculationResult:
    """Detailed calculation outcome for an individual sale or simulated sale."""
    symbol: str
    asset_category: str
    financial_year: str
    rule_version: str
    rule_label: str
    purchase_date: Optional[date]
    sale_date: date
    quantity: Decimal
    purchase_price_per_share: Decimal
    sale_price_per_share: Decimal
    purchase_value: Decimal
    sale_value: Decimal
    gross_capital_gain: Decimal
    eligible_deductible_expenses: Decimal
    ineligible_expenses_claimed: Decimal
    net_capital_gain_before_tax: Decimal
    holding_period_days: Optional[int]
    is_long_term: bool
    capital_gain_category: str  # "STCG" or "LTCG"
    applicable_section: str    # "Section 111A" or "Section 112A"
    applicable_tax_rate: Decimal
    annual_ltcg_threshold: Decimal
    prior_ltcg_utilized: Decimal
    taxable_capital_gain: Decimal
    basic_tax: Decimal
    surcharge_rate: Decimal
    surcharge: Decimal
    cess_rate: Decimal
    cess: Decimal
    estimated_total_tax: Decimal
    estimated_total_tax_rounded: Decimal
    estimated_after_tax_profit: Decimal
    status: str  # "COMPLETE", "PROVISIONAL", "REQUIRES_REVIEW"
    assumptions: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    lot_allocations: List[dict] = field(default_factory=list)


class TaxComputationEngine:
    """Authoritative capital gains tax computation engine for Indian investments."""

    @staticmethod
    def calculate_single_transaction(
        symbol: str,
        sale_date: date,
        quantity: Decimal,
        sale_price_per_share: Decimal,
        purchase_date: Optional[date],
        purchase_price_per_share: Decimal,
        asset_category: str = "LISTED_EQUITY",
        eligible_expenses: Decimal = Decimal("0.00"),
        ineligible_expenses: Decimal = Decimal("0.00"),
        prior_ltcg_in_fy: Decimal = Decimal("0.00"),
        surcharge_rate: Decimal = Decimal("0.00"),
    ) -> TransactionCalculationResult:
        """Compute capital gains and tax liability for a single transaction or uniform lot."""
        if quantity <= 0:
            raise ValueError(f"Transaction quantity must be strictly greater than 0, got {quantity}")
        if sale_price_per_share < 0:
            raise ValueError(f"Sale price per share cannot be negative, got {sale_price_per_share}")
        if purchase_price_per_share < 0:
            raise ValueError(f"Purchase price per share cannot be negative, got {purchase_price_per_share}")
        if eligible_expenses < 0:
            raise ValueError(f"Eligible expenses cannot be negative, got {eligible_expenses}")

        warnings: List[str] = []
        assumptions: List[str] = []
        status = "COMPLETE"

        # Check asset category support
        if asset_category.upper() not in ["LISTED_EQUITY", "EQUITY_MUTUAL_FUND"]:
            warnings.append(
                f"Asset category '{asset_category}' is not covered by Section 111A/112A equity special rates. "
                "Consult a certified tax advisor for other asset classes."
            )
            status = "REQUIRES_REVIEW"

        # Check date validity
        holding_period_days: Optional[int] = None
        is_long_term = False
        capital_gain_category = "STCG"
        applicable_section = "Section 111A"

        if purchase_date is None:
            warnings.append(
                "Purchase date was not provided. Holding period cannot be verified; "
                "provisional STCG rate applied as a conservative estimate."
            )
            status = "PROVISIONAL"
            assumptions.append("Assumed short-term holding (< 12 months) in the absence of an acquisition date.")
        else:
            if sale_date < purchase_date:
                raise ValueError(
                    f"Sale date ({sale_date.isoformat()}) cannot be earlier than purchase date ({purchase_date.isoformat()})."
                )
            holding_period_days = (sale_date - purchase_date).days
            # Section 2(42A): Listed equity held for > 12 months (365 days) is long-term
            if holding_period_days > 365:
                is_long_term = True
                capital_gain_category = "LTCG"
                applicable_section = "Section 112A"
            else:
                is_long_term = False
                capital_gain_category = "STCG"
                applicable_section = "Section 111A"

        rule: TaxRuleVersion = get_tax_rule_for_transfer(sale_date, "LISTED_EQUITY")
        fy = get_financial_year(sale_date)

        purchase_value = round_currency(purchase_price_per_share * quantity)
        sale_value = round_currency(sale_price_per_share * quantity)
        gross_capital_gain = round_currency(sale_value - purchase_value)

        # Ineligible expenses (e.g. STT) cannot be deducted
        if ineligible_expenses > 0:
            warnings.append(
                f"₹{ineligible_expenses:,.2f} in ineligible charges (such as STT) were excluded from allowable deductions under Section 48."
            )

        # Net gain before tax: Gross gain minus allowable transfer expenses
        net_capital_gain_before_tax = round_currency(gross_capital_gain - eligible_expenses)

        # If transaction resulted in a loss, no tax is payable
        if net_capital_gain_before_tax <= Decimal("0.00"):
            basic_tax = Decimal("0.00")
            surcharge = Decimal("0.00")
            cess = Decimal("0.00")
            total_tax = Decimal("0.00")
            taxable_capital_gain = Decimal("0.00")
            rate = rule.ltcg_rate if is_long_term else rule.stcg_rate
            after_tax_profit = net_capital_gain_before_tax

            assumptions.append(
                f"Capital loss of ₹{abs(net_capital_gain_before_tax):,.2f} incurred. "
                "No capital gains tax is payable. This loss may be eligible for carry-forward or set-off under Indian Income-tax rules."
            )

            return TransactionCalculationResult(
                symbol=symbol,
                asset_category=asset_category,
                financial_year=fy,
                rule_version=rule.rule_id,
                rule_label=rule.version_label,
                purchase_date=purchase_date,
                sale_date=sale_date,
                quantity=quantity,
                purchase_price_per_share=purchase_price_per_share,
                sale_price_per_share=sale_price_per_share,
                purchase_value=purchase_value,
                sale_value=sale_value,
                gross_capital_gain=gross_capital_gain,
                eligible_deductible_expenses=eligible_expenses,
                ineligible_expenses_claimed=ineligible_expenses,
                net_capital_gain_before_tax=net_capital_gain_before_tax,
                holding_period_days=holding_period_days,
                is_long_term=is_long_term,
                capital_gain_category=capital_gain_category,
                applicable_section=applicable_section,
                applicable_tax_rate=rate,
                annual_ltcg_threshold=rule.ltcg_exemption_threshold if is_long_term else Decimal("0.00"),
                prior_ltcg_utilized=prior_ltcg_in_fy,
                taxable_capital_gain=taxable_capital_gain,
                basic_tax=basic_tax,
                surcharge_rate=surcharge_rate,
                surcharge=surcharge,
                cess_rate=rule.cess_rate,
                cess=cess,
                estimated_total_tax=total_tax,
                estimated_total_tax_rounded=total_tax,
                estimated_after_tax_profit=after_tax_profit,
                status=status,
                assumptions=assumptions,
                warnings=warnings,
            )

        # Tax calculation for positive gains
        if is_long_term:
            rate = rule.ltcg_rate
            threshold = rule.ltcg_exemption_threshold
            remaining_exemption = max(Decimal("0.00"), threshold - prior_ltcg_in_fy)

            # Gain exceeding available exemption
            if net_capital_gain_before_tax > remaining_exemption:
                taxable_capital_gain = round_currency(net_capital_gain_before_tax - remaining_exemption)
                assumptions.append(
                    f"Annual Section 112A exemption of ₹{threshold:,.2f} applied "
                    f"(Prior utilized: ₹{prior_ltcg_in_fy:,.2f}, applied to this gain: ₹{remaining_exemption:,.2f})."
                )
            else:
                taxable_capital_gain = Decimal("0.00")
                assumptions.append(
                    f"Entire LTCG of ₹{net_capital_gain_before_tax:,.2f} is exempt within remaining annual threshold of ₹{remaining_exemption:,.2f}."
                )
        else:
            rate = rule.stcg_rate
            threshold = Decimal("0.00")
            taxable_capital_gain = net_capital_gain_before_tax
            assumptions.append(
                f"Section 111A special rate of {float(rate * 100):.1f}% applied to entire short-term capital gain of ₹{taxable_capital_gain:,.2f}."
            )

        basic_tax = round_currency(taxable_capital_gain * rate)
        surcharge = round_currency(basic_tax * surcharge_rate)
        cess = round_currency((basic_tax + surcharge) * rule.cess_rate)
        estimated_total_tax = round_currency(basic_tax + surcharge + cess)
        estimated_total_tax_rounded = round_tax_section_288b(estimated_total_tax)
        estimated_after_tax_profit = round_currency(net_capital_gain_before_tax - estimated_total_tax_rounded)

        return TransactionCalculationResult(
            symbol=symbol,
            asset_category=asset_category,
            financial_year=fy,
            rule_version=rule.rule_id,
            rule_label=rule.version_label,
            purchase_date=purchase_date,
            sale_date=sale_date,
            quantity=quantity,
            purchase_price_per_share=purchase_price_per_share,
            sale_price_per_share=sale_price_per_share,
            purchase_value=purchase_value,
            sale_value=sale_value,
            gross_capital_gain=gross_capital_gain,
            eligible_deductible_expenses=eligible_expenses,
            ineligible_expenses_claimed=ineligible_expenses,
            net_capital_gain_before_tax=net_capital_gain_before_tax,
            holding_period_days=holding_period_days,
            is_long_term=is_long_term,
            capital_gain_category=capital_gain_category,
            applicable_section=applicable_section,
            applicable_tax_rate=rate,
            annual_ltcg_threshold=threshold,
            prior_ltcg_utilized=prior_ltcg_in_fy,
            taxable_capital_gain=taxable_capital_gain,
            basic_tax=basic_tax,
            surcharge_rate=surcharge_rate,
            surcharge=surcharge,
            cess_rate=rule.cess_rate,
            cess=cess,
            estimated_total_tax=estimated_total_tax,
            estimated_total_tax_rounded=estimated_total_tax_rounded,
            estimated_after_tax_profit=estimated_after_tax_profit,
            status=status,
            assumptions=assumptions,
            warnings=warnings,
        )

    @classmethod
    def calculate_with_fifo_lots(
        cls,
        symbol: str,
        sale_date: date,
        quantity_to_sell: Decimal,
        sale_price_per_share: Decimal,
        lots: List[AcquisitionLot],
        asset_category: str = "LISTED_EQUITY",
        eligible_expenses: Decimal = Decimal("0.00"),
        ineligible_expenses: Decimal = Decimal("0.00"),
        prior_ltcg_in_fy: Decimal = Decimal("0.00"),
        surcharge_rate: Decimal = Decimal("0.00"),
    ) -> TransactionCalculationResult:
        """Process sale across multiple purchase lots using statutory FIFO (First-In, First-Out) matching."""
        if quantity_to_sell <= Decimal("0"):
            raise ValueError(f"Quantity to sell must be greater than 0, got {quantity_to_sell}")

        # Sort lots by purchase date ascending (FIFO). Lots without date go last.
        sorted_lots = sorted(lots, key=lambda l: (l.purchase_date is None, l.purchase_date or date.max))

        total_available = sum(l.quantity for l in sorted_lots)
        if quantity_to_sell > total_available:
            raise ValueError(
                f"Insufficient shares to sell: requested {quantity_to_sell}, but portfolio lots only have {total_available} shares."
            )

        allocated_qty = Decimal("0.00")
        sub_results: List[TransactionCalculationResult] = []
        lot_allocations: List[dict] = []

        remaining_to_sell = quantity_to_sell
        current_prior_ltcg = prior_ltcg_in_fy

        for lot in sorted_lots:
            if remaining_to_sell <= Decimal("0"):
                break
            lot_take = min(lot.quantity, remaining_to_sell)
            remaining_to_sell -= lot_take
            allocated_qty += lot_take

            # Pro-rate eligible expenses across lots by quantity
            lot_expenses = round_currency(eligible_expenses * (lot_take / quantity_to_sell))
            lot_ineligible = round_currency(ineligible_expenses * (lot_take / quantity_to_sell))

            sub_res = cls.calculate_single_transaction(
                symbol=symbol,
                sale_date=sale_date,
                quantity=lot_take,
                sale_price_per_share=sale_price_per_share,
                purchase_date=lot.purchase_date,
                purchase_price_per_share=lot.purchase_price,
                asset_category=asset_category,
                eligible_expenses=lot_expenses,
                ineligible_expenses=lot_ineligible,
                prior_ltcg_in_fy=current_prior_ltcg,
                surcharge_rate=surcharge_rate,
            )
            sub_results.append(sub_res)

            lot_allocations.append({
                "lot_id": lot.lot_id,
                "quantity_matched": float(lot_take),
                "purchase_date": lot.purchase_date.isoformat() if lot.purchase_date else None,
                "purchase_price": float(lot.purchase_price),
                "holding_period_days": sub_res.holding_period_days,
                "category": sub_res.capital_gain_category,
                "gross_gain": float(sub_res.gross_capital_gain),
                "tax": float(sub_res.estimated_total_tax_rounded),
            })

            if sub_res.is_long_term and sub_res.net_capital_gain_before_tax > Decimal("0"):
                current_prior_ltcg += sub_res.net_capital_gain_before_tax

        # Aggregate across sub results
        total_purchase_val = sum(r.purchase_value for r in sub_results)
        total_sale_val = sum(r.sale_value for r in sub_results)
        total_gross_gain = sum(r.gross_capital_gain for r in sub_results)
        total_net_gain = sum(r.net_capital_gain_before_tax for r in sub_results)
        total_taxable_gain = sum(r.taxable_capital_gain for r in sub_results)
        total_basic_tax = sum(r.basic_tax for r in sub_results)
        total_surcharge = sum(r.surcharge for r in sub_results)
        total_cess = sum(r.cess for r in sub_results)
        total_tax = sum(r.estimated_total_tax for r in sub_results)
        total_tax_rounded = round_tax_section_288b(total_tax)
        total_after_tax = round_currency(total_net_gain - total_tax_rounded)

        # Primary rule version and status
        rule = get_tax_rule_for_transfer(sale_date, "LISTED_EQUITY")
        fy = get_financial_year(sale_date)

        # Determine dominant or composite category
        any_ltcg = any(r.is_long_term for r in sub_results)
        any_stcg = any(not r.is_long_term for r in sub_results)
        if any_ltcg and any_stcg:
            cat = "MIXED (STCG + LTCG)"
            section = "Section 111A & 112A"
        elif any_ltcg:
            cat = "LTCG"
            section = "Section 112A"
        else:
            cat = "STCG"
            section = "Section 111A"

        effective_rate = (total_basic_tax / total_taxable_gain) if total_taxable_gain > 0 else Decimal("0.00")
        avg_buy_price = round_currency(total_purchase_val / quantity_to_sell)

        all_warnings: List[str] = []
        for r in sub_results:
            all_warnings.extend(r.warnings)
        all_warnings = list(dict.fromkeys(all_warnings))  # Unique

        all_assumptions = [
            f"FIFO lot matching applied across {len(sub_results)} acquisition lot(s).",
            f"Total {quantity_to_sell} shares matched out of {total_available} available in portfolio.",
        ]
        if any_ltcg and any_stcg:
            all_assumptions.append("Transaction matched lots with differing holding periods, generating both STCG and LTCG.")

        overall_status = "COMPLETE"
        if any(r.status == "REQUIRES_REVIEW" for r in sub_results):
            overall_status = "REQUIRES_REVIEW"
        elif any(r.status == "PROVISIONAL" for r in sub_results):
            overall_status = "PROVISIONAL"

        return TransactionCalculationResult(
            symbol=symbol,
            asset_category=asset_category,
            financial_year=fy,
            rule_version=rule.rule_id,
            rule_label=rule.version_label,
            purchase_date=sub_results[0].purchase_date if len(sub_results) == 1 else None,
            sale_date=sale_date,
            quantity=quantity_to_sell,
            purchase_price_per_share=avg_buy_price,
            sale_price_per_share=sale_price_per_share,
            purchase_value=total_purchase_val,
            sale_value=total_sale_val,
            gross_capital_gain=total_gross_gain,
            eligible_deductible_expenses=eligible_expenses,
            ineligible_expenses_claimed=ineligible_expenses,
            net_capital_gain_before_tax=total_net_gain,
            holding_period_days=sub_results[0].holding_period_days if len(sub_results) == 1 else None,
            is_long_term=any_ltcg and not any_stcg,
            capital_gain_category=cat,
            applicable_section=section,
            applicable_tax_rate=round_currency(effective_rate),
            annual_ltcg_threshold=rule.ltcg_exemption_threshold if any_ltcg else Decimal("0.00"),
            prior_ltcg_utilized=prior_ltcg_in_fy,
            taxable_capital_gain=total_taxable_gain,
            basic_tax=total_basic_tax,
            surcharge_rate=surcharge_rate,
            surcharge=total_surcharge,
            cess_rate=rule.cess_rate,
            cess=total_cess,
            estimated_total_tax=total_tax,
            estimated_total_tax_rounded=total_tax_rounded,
            estimated_after_tax_profit=total_after_tax,
            status=overall_status,
            assumptions=all_assumptions,
            warnings=all_warnings,
            lot_allocations=lot_allocations,
        )

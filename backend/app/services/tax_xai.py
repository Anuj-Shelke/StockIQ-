"""Explainable AI (XAI) Generator for Capital Gains Tax.

Converts deterministic calculation outcomes into structured, step-by-step,
plain-English explanations answering:
A. Why is this gain taxable?
B. Why was this tax category selected?
C. Why is this tax rate applicable?
D. How was the tax amount calculated?
E. What information could change this result?
F. What will be my net profit?
G. What should I do next?
"""

from typing import Dict, List, Optional
from app.services.tax_engine import TransactionCalculationResult


def format_inr(val: float) -> str:
    """Format floating point number into Indian currency format (e.g. ₹1,25,000.00)."""
    s = f"{val:,.2f}"
    # Replace standard thousand grouping with Indian grouping if needed, or use formatted string with ₹
    return f"₹{s}"


class TaxExplainabilityEngine:
    """Produces verified, beginner-friendly explanations of tax calculations."""

    @classmethod
    def explain(cls, result: TransactionCalculationResult) -> Dict:
        """Generate structured XAI explanation agreeing 100% with deterministic calculation."""
        p_val = float(result.purchase_value)
        s_val = float(result.sale_value)
        gross_gain = float(result.gross_capital_gain)
        net_gain = float(result.net_capital_gain_before_tax)
        expenses = float(result.eligible_deductible_expenses)
        ineligible = float(result.ineligible_expenses_claimed)
        taxable_gain = float(result.taxable_capital_gain)
        basic_tax = float(result.basic_tax)
        surcharge = float(result.surcharge)
        cess = float(result.cess)
        total_tax = float(result.estimated_total_tax_rounded)
        net_profit = float(result.estimated_after_tax_profit)
        rate_pct = float(result.applicable_tax_rate * 100)

        # Section A: Why is this gain taxable?
        if net_gain > 0:
            section_a = (
                f"You purchased {result.quantity} shares of {result.symbol} for a total value of {format_inr(p_val)} "
                f"and sold them for {format_inr(s_val)}. This generated a gross gain of {format_inr(gross_gain)}. "
                + (
                    f"After deducting {format_inr(expenses)} in allowable transfer expenses (like brokerage and exchange fees), "
                    if expenses > 0
                    else "With no deductible transfer expenses claimed, "
                )
                + f"your net capital gain before tax is {format_inr(net_gain)}. Under the Indian Income-tax Act, "
                "profits arising from the transfer of a capital asset (such as equity shares) constitute taxable Capital Gains."
            )
        elif net_gain < 0:
            section_a = (
                f"You sold {result.quantity} shares of {result.symbol} for {format_inr(s_val)}, which is less than "
                f"your acquisition cost of {format_inr(p_val)}. This resulted in a capital loss of {format_inr(abs(net_gain))}. "
                "Because capital gains tax is only levied on positive profits, no tax is payable on this transaction."
            )
        else:
            section_a = (
                f"You sold {result.quantity} shares of {result.symbol} at break-even (total cost and sale value both {format_inr(s_val)}). "
                "With zero net profit, no capital gains tax is incurred."
            )

        # Section B: Why was this tax category selected?
        if result.holding_period_days is not None:
            hp_text = f"{result.holding_period_days} days ({result.holding_period_days / 30.41:.1f} months)"
            if result.is_long_term:
                section_b = (
                    f"Your shares were held for {hp_text} between {result.purchase_date} and {result.sale_date}. "
                    f"Under Section 2(42A) of the Income-tax Act, listed equity shares held for more than 12 months (365 days) "
                    f"qualify as Long-Term Capital Assets. Therefore, your profit is classified as Long-Term Capital Gains (LTCG) "
                    f"governed by Section 112A."
                )
            else:
                section_b = (
                    f"Your shares were held for {hp_text} between {result.purchase_date} and {result.sale_date}. "
                    f"Because the holding period is 12 months (365 days) or less, the investment is classified as a "
                    f"Short-Term Capital Asset. Therefore, your profit is classified as Short-Term Capital Gains (STCG) "
                    f"governed by Section 111A."
                )
        else:
            section_b = (
                "The acquisition date was not provided. In the absence of verifiable holding dates, the engine conservatively "
                "treated the position as Short-Term Capital Gains (STCG) under Section 111A. Please provide purchase dates "
                "to determine if this holding qualifies for lower LTCG rates."
            )

        # Section C: Why is this tax rate applicable?
        if result.is_long_term:
            section_c = (
                f"{result.rule_label} applies to your transfer date of {result.sale_date.isoformat()}. "
                f"Under Section 112A, qualifying long-term capital gains on listed equities are taxed at a special rate of {rate_pct:.1f}% "
                f"(previously 10% before 23-Jul-2024). Furthermore, Section 112A grants an annual aggregate exemption of "
                f"{format_inr(float(result.annual_ltcg_threshold))} across all qualifying long-term equity transactions in {result.financial_year}."
            )
        else:
            section_c = (
                f"{result.rule_label} applies to your transfer date of {result.sale_date.isoformat()}. "
                f"Under Section 111A, short-term capital gains on listed equity shares subject to Securities Transaction Tax (STT) "
                f"are taxed at a flat special rate of {rate_pct:.1f}% (increased from 15% to 20% effective 23-Jul-2024 by Finance Act 2024)."
            )

        # Section D: How was the tax amount calculated?
        steps = []
        if net_gain <= 0:
            steps.append(f"1. Net gain before tax: {format_inr(net_gain)} (Loss / Zero)")
            steps.append("2. Taxable capital gain: ₹0.00")
            steps.append("3. Final tax payable: ₹0.00")
            section_d = "Step-by-step breakdown:\n" + "\n".join(steps)
        else:
            steps.append(f"1. Gross Sale Value: {format_inr(s_val)} ({result.quantity} shares × {format_inr(float(result.sale_price_per_share))})")
            steps.append(f"2. Less Purchase Cost: -{format_inr(p_val)} ({result.quantity} shares × {format_inr(float(result.purchase_price_per_share))})")
            if expenses > 0:
                steps.append(f"3. Less Eligible Transfer Expenses: -{format_inr(expenses)}")
            steps.append(f"4. Net Capital Gain: {format_inr(net_gain)}")

            if result.is_long_term:
                steps.append(f"5. Less Annual LTCG Exemption (Sec 112A): -{format_inr(float(result.annual_ltcg_threshold) - float(result.prior_ltcg_utilized))}")
                steps.append(f"6. Taxable LTCG: {format_inr(taxable_gain)}")
                steps.append(f"7. Basic Tax @ {rate_pct:.1f}%: {format_inr(basic_tax)}")
            else:
                steps.append(f"5. Taxable STCG (Sec 111A): {format_inr(taxable_gain)}")
                steps.append(f"6. Basic Tax @ {rate_pct:.1f}%: {format_inr(basic_tax)}")

            if surcharge > 0:
                steps.append(f"7. Plus Surcharge ({float(result.surcharge_rate * 100):.1f}%): +{format_inr(surcharge)}")
            steps.append(f"8. Plus Health & Education Cess (4%): +{format_inr(cess)}")
            steps.append(f"9. Total Tax Payable (Rounded u/s 288B): {format_inr(total_tax)}")
            section_d = "Step-by-step breakdown:\n" + "\n".join(steps)

        # Section E: What information could change this result?
        change_factors = [
            f"Annual Exemption Cap: The ₹1,25,000 LTCG exemption is an annual aggregate for {result.financial_year}, not a per-transaction limit.",
            "Capital Losses: Any realized short-term or long-term capital losses from other investments can potentially offset these gains.",
            "Total Taxable Income: Surcharge may apply if your overall taxable annual income exceeds ₹50,00,000.",
            "STT Proof: Special Section 111A/112A rates require Securities Transaction Tax (STT) to have been paid on the transaction.",
        ]
        if ineligible > 0:
            change_factors.append(f"STT Non-Deductibility: The ₹{ineligible:,.2f} in STT cannot be deducted from capital gains as per statutory guidelines.")
        section_e = "Key factors that could alter your final tax liability:\n• " + "\n• ".join(change_factors)

        # Section F: What will be my net profit?
        if net_gain > 0:
            section_f = (
                f"Out of your total sales proceeds of {format_inr(s_val)}, your initial investment was {format_inr(p_val)}. "
                f"After paying {format_inr(total_tax)} in estimated capital gains tax"
                + (f" and {format_inr(expenses)} in transaction expenses" if expenses > 0 else "")
                + f", your estimated net profit retained in hand is {format_inr(net_profit)}."
            )
        else:
            section_f = (
                f"You recovered {format_inr(s_val)} from the sale. Your estimated net position is a loss of "
                f"{format_inr(abs(net_profit))}."
            )

        # Section G: What should I do next?
        next_actions = [
            "Download your broker contract note / trade confirmation to verify trade execution dates and prices.",
            "Cross-verify with your Annual Information Statement (AIS) and Taxpayer Information Summary (TIS) on the Income Tax Portal.",
            "Keep records of all eligible brokerage and statutory transfer fees paid.",
            "Consult a Chartered Accountant (CA) or certified tax professional before filing ITR-2 or ITR-3.",
        ]
        section_g = "Recommended compliance & record-keeping actions:\n1. " + "\n2. ".join(next_actions)

        return {
            "symbol": result.symbol,
            "financial_year": result.financial_year,
            "rule_version": result.rule_version,
            "rule_label": result.rule_label,
            "status": result.status,
            "structured_metrics": {
                "purchase_value": p_val,
                "sale_value": s_val,
                "gross_capital_gain": gross_gain,
                "eligible_expenses": expenses,
                "net_capital_gain_before_tax": net_gain,
                "holding_period_days": result.holding_period_days,
                "holding_period_label": f"{result.holding_period_days} days" if result.holding_period_days is not None else "Unknown",
                "capital_gain_category": result.capital_gain_category,
                "applicable_section": result.applicable_section,
                "applicable_tax_rate": float(result.applicable_tax_rate),
                "annual_ltcg_threshold": float(result.annual_ltcg_threshold),
                "aggregate_eligible_ltcg": float(result.prior_ltcg_utilized) + (net_gain if result.is_long_term else 0.0),
                "taxable_capital_gain": taxable_gain,
                "basic_tax": basic_tax,
                "surcharge": surcharge,
                "cess": cess,
                "estimated_total_tax": total_tax,
                "estimated_after_tax_profit": net_profit,
                "rule_version": result.rule_version,
            },
            "explanation_sections": {
                "why_is_gain_taxable": section_a,
                "why_category_selected": section_b,
                "why_rate_applicable": section_c,
                "how_tax_calculated": section_d,
                "what_could_change_result": section_e,
                "what_will_be_net_profit": section_f,
                "what_should_i_do_next": section_g,
            },
            "assumptions": result.assumptions,
            "missing_information": result.warnings,
            "disclaimer": (
                "StockIQ provides an estimate of capital gains and potential tax liability for informational purposes. "
                "The final tax treatment may depend on your complete financial circumstances, transaction records, "
                "applicable legislation, and other statutory conditions. Verify the result before filing your income-tax return."
            ),
        }

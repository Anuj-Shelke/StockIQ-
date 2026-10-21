"""Financial Suitability and Capacity Assessment Engine.

Evaluates an investor's true capacity to bear financial risk versus their self-reported
risk tolerance, performs emergency reserve checks, and validates goal feasibility.
"""

from typing import List, Tuple
from app.schemas.investment_planner import PlannerProfileInput, SuitabilityAssessment


class SuitabilityEngine:
    """Evaluates investor risk capacity, emergency reserve requirements, and capital availability."""

    @classmethod
    def evaluate(cls, profile: PlannerProfileInput) -> SuitabilityAssessment:
        income = max(1.0, profile.monthly_income)
        expenses = profile.monthly_expenses
        debt = profile.debt_obligations
        dependents = profile.financial_dependents
        emergency_savings = profile.emergency_fund
        capital = profile.current_investable_capital
        horizon_years = profile.target_years

        # 1. Cash Flow & Debt Metrics
        monthly_surplus = round(income - expenses - debt, 2)
        dti_ratio = round((debt / income) * 100.0, 1)

        # 2. Emergency Reserve Assessment
        # In India, financial planning best practice requires 3 to 6 months of mandatory living expenses in liquid cash
        recommended_emergency_months = 6.0 if dependents > 0 else 3.0
        target_emergency_fund = round(expenses * recommended_emergency_months, 2)
        current_emergency_months = round(emergency_savings / max(expenses, 1.0), 1)

        warnings: List[str] = []
        assumptions: List[str] = []

        if current_emergency_months < recommended_emergency_months:
            emergency_gap = max(0.0, target_emergency_fund - emergency_savings)
            # Carve out up to 50% of available capital or the gap, whichever is smaller, as suggested liquid buffer
            suggested_liquid_reserve = min(capital * 0.5, emergency_gap)
            emergency_fund_adequate = False
            warnings.append(
                f"Emergency Reserve Warning: Existing liquid emergency savings cover {current_emergency_months:.1f} months of expenses "
                f"(recommended: {recommended_emergency_months:.0f} months = ₹{target_emergency_fund:,.0f}). "
                f"We recommend retaining ₹{suggested_liquid_reserve:,.0f} in an ultra-safe liquid savings/overnight fund before investing the remainder."
            )
        else:
            suggested_liquid_reserve = 0.0
            emergency_fund_adequate = True
            assumptions.append(
                f"Emergency savings of ₹{emergency_savings:,.0f} cover {current_emergency_months:.1f} months of expenses, meeting recommended safety guidelines."
            )

        investable_capital_allocated = round(capital - suggested_liquid_reserve, 2)

        # 3. Quantitative Risk Capacity Calculation (0 - 100)
        # Factor A: Net Cash Flow Surplus (Up to 30 pts)
        surplus_ratio = max(0.0, min(1.0, monthly_surplus / income))
        score_surplus = surplus_ratio * 30.0

        # Factor B: Debt-to-Income Health (Up to 25 pts)
        if dti_ratio <= 15.0:
            score_debt = 25.0
        elif dti_ratio <= 35.0:
            score_debt = 25.0 - ((dti_ratio - 15.0) / 20.0) * 12.0
        elif dti_ratio <= 50.0:
            score_debt = 10.0 - ((dti_ratio - 35.0) / 15.0) * 8.0
        else:
            score_debt = 2.0
            warnings.append(f"High Debt Alert: Monthly debt obligations consume {dti_ratio:.1f}% of income. High debt significantly restricts risk capacity.")

        # Factor C: Investment Horizon Runway (Up to 25 pts)
        if horizon_years >= 10.0:
            score_horizon = 25.0
        elif horizon_years >= 5.0:
            score_horizon = 20.0
        elif horizon_years >= 3.0:
            score_horizon = 14.0
        elif horizon_years >= 1.0:
            score_horizon = 8.0
        else:
            score_horizon = 3.0
            warnings.append("Short Horizon Alert: Investment horizon is under 1 year. Equities and volatile assets are unsuitable for sub-year tenures.")

        # Factor D: Dependents & Capital Cushion (Up to 20 pts)
        dependent_penalty = min(10.0, dependents * 3.0)
        capital_cushion_ratio = min(10.0, (capital / max(expenses * 12.0, 1.0)) * 5.0)
        score_cushion = max(2.0, 15.0 - dependent_penalty + capital_cushion_ratio)

        raw_capacity_score = round(score_surplus + score_debt + score_horizon + score_cushion, 1)
        risk_capacity_score = max(5.0, min(95.0, raw_capacity_score))

        # Risk Capacity Classification
        if risk_capacity_score >= 70.0:
            risk_capacity_level = "High"
        elif risk_capacity_score >= 50.0:
            risk_capacity_level = "Moderate"
        elif risk_capacity_score >= 30.0:
            risk_capacity_level = "Low"
        else:
            risk_capacity_level = "Very Low"

        # Composite Risk Balancing (Reconciliation of Psychological Tolerance vs Financial Capacity)
        tolerance_map = {"Very Low": 1, "Low": 2, "Moderate": 3, "High": 4}
        capacity_map = {"Very Low": 1, "Low": 2, "Moderate": 3, "High": 4}
        inv_map = {1: "Very Low", 2: "Low", 3: "Moderate", 4: "High"}

        t_val = tolerance_map.get(profile.risk_tolerance, 3)
        c_val = capacity_map.get(risk_capacity_level, 3)

        # Conservative principle: Never exceed financial capacity, even if tolerance is high
        effective_val = min(t_val, c_val) if t_val > c_val else round((t_val + c_val) / 2)
        composite_risk_rating = inv_map.get(effective_val, "Moderate")

        if t_val > c_val:
            warnings.append(
                f"Risk Divergence: You indicated a '{profile.risk_tolerance}' risk tolerance, but your financial risk capacity is '{risk_capacity_level}' "
                f"(Score: {risk_capacity_score:.0f}/100) due to current debt, dependents, or reserves. "
                "The engine has conservatively capped your risk profile to protect your financial stability."
            )

        # 4. Financial Goal Feasibility
        target_amt = profile.target_amount or (capital * 1.5)
        # Expected base return rough benchmark: 10% for Moderate, 12% High, 7.5% Low
        est_rate = 0.075 if composite_risk_rating in ["Very Low", "Low"] else (0.10 if composite_risk_rating == "Moderate" else 0.12)
        fv_lump = investable_capital_allocated * ((1.0 + est_rate) ** horizon_years)
        fv_sip = 0.0
        if profile.monthly_sip_amount > 0:
            m_rate = est_rate / 12.0
            n_months = horizon_years * 12.0
            fv_sip = profile.monthly_sip_amount * (((1.0 + m_rate) ** n_months - 1.0) / m_rate) * (1.0 + m_rate)
        est_total_fv = fv_lump + fv_sip

        feasibility_ratio = est_total_fv / max(target_amt, 1.0)
        feasibility_score = round(min(100.0, max(10.0, feasibility_ratio * 90.0)), 1)

        if feasibility_score >= 85.0:
            feasibility_status = "Highly Achievable"
        elif feasibility_score >= 70.0:
            feasibility_status = "Feasible"
        elif feasibility_score >= 50.0:
            feasibility_status = "Challenging"
            warnings.append(
                f"Goal Feasibility Notice: Reaching your target of ₹{target_amt:,.0f} in {horizon_years:.1f} years may require higher monthly contributions or a longer horizon."
            )
        else:
            feasibility_status = "Requires Adjustment"
            warnings.append(
                f"Goal Gap Alert: Target of ₹{target_amt:,.0f} significantly exceeds estimated portfolio growth (₹{est_total_fv:,.0f}). Consider extending the horizon or increasing savings."
            )

        # Narrative Synthesis
        narrative = (
            f"Based on your monthly surplus of ₹{monthly_surplus:,.0f} (DTI: {dti_ratio:.1f}%) and investment horizon of {horizon_years:.1f} years, "
            f"your financial Risk Capacity is assessed at {risk_capacity_score:.0f}/100 ({risk_capacity_level}). "
            f"Combined with your '{profile.risk_tolerance}' tolerance, your composite allocation stance is '{composite_risk_rating}'. "
            + (
                f"A liquid safety reserve of ₹{suggested_liquid_reserve:,.0f} has been set aside, leaving ₹{investable_capital_allocated:,.0f} for optimized asset distribution."
                if suggested_liquid_reserve > 0
                else f"Full investable capital of ₹{investable_capital_allocated:,.0f} is deployed across target asset classes."
            )
        )

        assumptions.extend([
            f"Living expenses benchmarked at ₹{expenses:,.0f}/month with debt servicing of ₹{debt:,.0f}/month.",
            f"Risk capacity weighted across surplus ratio (30%), DTI (25%), horizon (25%), and dependent cushion (20%).",
            f"Goal target assessed at ₹{target_amt:,.0f} over a {horizon_years:.1f}-year horizon.",
        ])

        return SuitabilityAssessment(
            risk_tolerance=profile.risk_tolerance,
            risk_capacity_score=risk_capacity_score,
            risk_capacity_level=risk_capacity_level,
            composite_risk_rating=composite_risk_rating,
            monthly_surplus=monthly_surplus,
            debt_to_income_ratio=dti_ratio,
            emergency_fund_months=current_emergency_months,
            suggested_liquid_reserve=suggested_liquid_reserve,
            emergency_fund_adequate=emergency_fund_adequate,
            investable_capital_allocated=investable_capital_allocated,
            total_capital_provided=capital,
            suggested_investment_horizon_years=horizon_years,
            goal_feasibility_score=feasibility_score,
            goal_feasibility_status=feasibility_status,
            suitability_narrative=narrative,
            key_assumptions=assumptions,
            warnings=warnings,
        )

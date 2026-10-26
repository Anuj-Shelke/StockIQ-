"""Master AI Personal Investment Planner and Portfolio Optimization Service.

Orchestrates suitability checks, multi-asset allocation, wealth projections, risk metrics,
stock selection with SHAP drivers, FD & gold comparisons, tax integration, goal timelines,
and interactive What-If simulations.
"""

import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.investment_planner import InvestmentPlanRecord, PlannerProfile
from app.models.user import User
from app.schemas.investment_planner import (
    AlternativePortfolio,
    AssetAllocationItem,
    ExplainabilityInsight,
    GoalTimelineMilestone,
    GoalTimelinePlan,
    InvestmentPlanResponse,
    PlannerProfileInput,
    PlanSimulateRequest,
    PlanSimulateResponse,
    SuitabilityAssessment,
)
from app.services.allocation_engine import AssetAllocationEngine
from app.services.fd_planner_engine import FDPlannerEngine
from app.services.gold_planner_engine import GoldPlannerEngine
from app.services.planner_stock_engine import PlannerStockEngine
from app.services.portfolio_risk_engine import PortfolioRiskEngine
from app.services.projection_engine import WealthProjectionEngine
from app.services.suitability_engine import SuitabilityEngine
from app.services.tax_integration_service import TaxIntegrationService


class InvestmentPlannerService:
    """End-to-end service providing personalized investment planning and portfolio optimization."""

    @classmethod
    def generate_plan(
        cls,
        db: Session,
        user_id: str,
        profile_input: PlannerProfileInput,
        save_to_db: bool = True,
    ) -> InvestmentPlanResponse:
        """Generate and optionally persist a complete, optimized investment plan."""
        # 1. Financial Suitability Assessment
        suitability = SuitabilityEngine.evaluate(profile_input)

        # 2. Constraint-Based Multi-Asset Allocation (summing to 100%)
        allocations = AssetAllocationEngine.compute_allocation(profile_input, suitability)

        # Amounts allocated to specific asset classes (robust matching)
        equity_amount = sum(a.allocated_amount for a in allocations if "stock" in a.asset_class.lower() or "equity" in a.asset_class.lower())
        fund_amount = sum(a.allocated_amount for a in allocations if "fund" in a.asset_class.lower() or "index" in a.asset_class.lower())
        fd_amount = sum(a.allocated_amount for a in allocations if "deposit" in a.asset_class.lower() or "fd" in a.asset_class.lower())
        gold_amount = sum(a.allocated_amount for a in allocations if "gold" in a.asset_class.lower())

        # 3. Stock Selection with SHAP Explainability (demographic & capital calibrated)
        stocks = PlannerStockEngine.select_stock_allocations(
            total_equity_amount=equity_amount,
            risk_tier=suitability.composite_risk_rating,
            preferred_sectors=profile_input.preferred_sectors,
            preferred_stocks=profile_input.preferred_stocks,
            age=profile_input.age,
            capital=suitability.investable_capital_allocated,
            horizon_years=profile_input.target_years,
            primary_goal=profile_input.primary_goal,
        )

        # 4. Bank Fixed Deposit Options
        fds = FDPlannerEngine.generate_options(
            allocated_amount=fd_amount,
            horizon_years=profile_input.target_years,
        )

        # 5. Gold Vehicle Comparison
        gold = GoldPlannerEngine.generate_options(allocated_amount=gold_amount)

        # 6. Wealth Projections (Conservative, Base, Optimistic, Real)
        projections = WealthProjectionEngine.calculate_projections(
            allocations=allocations,
            horizon_years=int(profile_input.target_years),
            monthly_sip=profile_input.monthly_sip_amount,
        )

        # 7. Portfolio Risk Analytics
        stock_sectors = {}
        for s in stocks:
            stock_sectors[s.sector] = round(stock_sectors.get(s.sector, 0.0) + s.weight_pct, 1)
        risk_metrics = PortfolioRiskEngine.analyze_risk(allocations, stock_sectors)

        # 8. Tax Integration (REUSING existing StockIQ TaxComputationEngine)
        # Compute projected nominal gains for each asset class at horizon
        horizon = max(1.0, profile_input.target_years)
        # Projected gains under base scenario
        projected_equity_gain = max(0.0, equity_amount * (math.pow(1.0 + 0.138, horizon) - 1.0))
        projected_mf_gain = max(0.0, fund_amount * (math.pow(1.0 + 0.125, horizon) - 1.0))
        projected_fd_gain = max(0.0, fd_amount * (math.pow(1.0 + 0.071, horizon) - 1.0))
        projected_gold_gain = max(0.0, gold_amount * (math.pow(1.0 + 0.112, horizon) - 1.0))

        # Determine investor estimated slab rate from income
        annual_inc = profile_input.monthly_income * 12.0
        if annual_inc > 1500000.0:
            est_slab = 30.0
        elif annual_inc > 1000000.0:
            est_slab = 20.0
        elif annual_inc > 700000.0:
            est_slab = 10.0
        else:
            est_slab = 5.0

        tax_summary = TaxIntegrationService.evaluate_portfolio_tax(
            total_investable=suitability.investable_capital_allocated,
            horizon_years=horizon,
            equity_allocation_amount=equity_amount,
            fd_allocation_amount=fd_amount,
            gold_allocation_amount=gold_amount,
            mutual_fund_allocation_amount=fund_amount,
            projected_equity_gain=projected_equity_gain,
            projected_fd_gain=projected_fd_gain,
            projected_gold_gain=projected_gold_gain,
            projected_mf_gain=projected_mf_gain,
            investor_slab_rate_pct=est_slab,
        )

        # 9. Goal Timeline and Milestone Tracking
        target_amt = profile_input.target_amount or round(suitability.investable_capital_allocated * 1.5, 2)
        final_base_corpus = projections.base_final_value
        gap = round(target_amt - final_base_corpus, 2)
        is_achievable = gap <= 0.0

        # Required additional SIP to bridge gap
        if gap > 0:
            # Monthly rate from portfolio expected return
            r_annual = risk_metrics.expected_annual_return_pct / 100.0
            r_monthly = math.pow(1.0 + r_annual, 1.0 / 12.0) - 1.0
            total_m = int(horizon * 12)
            if r_monthly > 0 and total_m > 0:
                annuity_factor = ((math.pow(1.0 + r_monthly, total_m) - 1.0) / r_monthly) * (1.0 + r_monthly)
                req_additional_sip = round(gap / annuity_factor, 2)
            else:
                req_additional_sip = round(gap / max(1, total_m), 2)
        else:
            req_additional_sip = 0.0

        milestones: List[GoalTimelineMilestone] = []
        for pt in projections.yearly_trajectory:
            target_step = round((target_amt / horizon) * pt.year, 2)
            step_gap = round(target_step - pt.base_value, 2)
            pct_done = round(min(100.0, max(0.0, (pt.base_value / target_amt) * 100.0)), 1)
            milestones.append(
                GoalTimelineMilestone(
                    year=pt.year,
                    projected_corpus=pt.base_value,
                    target_milestone=target_step,
                    gap_amount=step_gap,
                    percent_achieved=pct_done,
                    review_recommendation=(
                        "On track with scheduled milestone." if step_gap <= 0
                        else f"Corpus is trailing milestone by ₹{step_gap:,.0f}. Review asset performance or increase SIP."
                    ),
                )
            )

        remedials = [
            f"Increase monthly SIP by ₹{req_additional_sip:,.0f} to bridge the projected shortfall." if gap > 0 else "Projected base growth meets or exceeds your goal target.",
            f"Consider extending investment horizon by 1 to 2 years to benefit from compounding without taking excess risk.",
            "Schedule annual portfolio rebalancing to lock in equity gains and reset asset weights.",
            "Avoid taking excessive single-stock speculative positions to reach a target faster.",
        ]

        goal_timeline = GoalTimelinePlan(
            goal_name=profile_input.primary_goal,
            target_amount=target_amt,
            target_years=horizon,
            projected_corpus_at_horizon=final_base_corpus,
            surplus_or_shortfall=-gap if gap > 0 else abs(gap),
            is_goal_achievable=is_achievable,
            required_additional_monthly_sip=req_additional_sip,
            milestones=milestones,
            remedial_actions=remedials,
        )

        # 10. Alternative Portfolios Generation
        alternatives = cls._build_alternative_portfolios(profile_input, suitability)

        # 11. Explainable Recommendations
        insights = cls._generate_explainability_insights(profile_input, suitability, allocations, stocks)

        plan_id = str(uuid.uuid4())
        plan_res = InvestmentPlanResponse(
            plan_id=plan_id,
            user_id=user_id,
            created_at=datetime.now(timezone.utc).isoformat(),
            plan_name=f"{profile_input.primary_goal} Strategy ({suitability.composite_risk_rating})",
            status="ACTIVE",
            profile_summary=profile_input,
            suitability=suitability,
            asset_allocation=allocations,
            stock_allocations=stocks,
            fixed_deposits=fds,
            gold_analysis=gold,
            wealth_projections=projections,
            risk_analysis=risk_metrics,
            tax_integration=tax_summary,
            goal_timeline=goal_timeline,
            alternative_portfolios=alternatives,
            explainability_insights=insights,
        )

        # Persist to database if requested
        if save_to_db:
            try:
                # Save profile
                db_profile = PlannerProfile(
                    user_id=user_id,
                    age=profile_input.age,
                    occupation=profile_input.occupation,
                    monthly_income=profile_input.monthly_income,
                    monthly_expenses=profile_input.monthly_expenses,
                    monthly_savings=profile_input.monthly_savings,
                    emergency_fund=profile_input.emergency_fund,
                    existing_investments=profile_input.existing_investments,
                    debt_obligations=profile_input.debt_obligations,
                    financial_dependents=profile_input.financial_dependents,
                    current_investable_capital=profile_input.current_investable_capital,
                    primary_goal=profile_input.primary_goal,
                    target_amount=profile_input.target_amount,
                    target_years=profile_input.target_years,
                    investment_horizon_category=profile_input.investment_horizon_category,
                    risk_tolerance=profile_input.risk_tolerance,
                    required_liquidity=profile_input.required_liquidity,
                    max_acceptable_loss_pct=profile_input.max_acceptable_loss_pct,
                    investment_style=profile_input.investment_style,
                    monthly_sip_amount=profile_input.monthly_sip_amount,
                    preferred_asset_classes=profile_input.preferred_asset_classes,
                    preferred_sectors=profile_input.preferred_sectors,
                    preferred_stocks=profile_input.preferred_stocks,
                )
                db.add(db_profile)
                db.flush()

                # Save plan record
                db_plan = InvestmentPlanRecord(
                    id=uuid.UUID(plan_id),
                    user_id=user_id,
                    profile_id=db_profile.id,
                    plan_name=plan_res.plan_name,
                    status=plan_res.status,
                    profile_snapshot=profile_input.model_dump(),
                    suitability_assessment=suitability.model_dump(),
                    asset_allocation=[a.model_dump() for a in allocations],
                    stock_allocations=[s.model_dump() for s in stocks],
                    fd_plan=[f.model_dump() for f in fds],
                    gold_plan=[g.model_dump() for g in gold],
                    wealth_projections=projections.model_dump(),
                    risk_metrics=risk_metrics.model_dump(),
                    tax_estimates=tax_summary.model_dump(),
                    timeline_milestones=goal_timeline.model_dump(),
                    alternative_portfolios=[alt.model_dump() for alt in alternatives],
                    explainability_insights=[ei.model_dump() for ei in insights],
                )
                db.add(db_plan)
                db.commit()
            except Exception as e:
                db.rollback()
                # Log error and continue returning generated plan
                print(f"Warning: Failed to persist investment plan to database: {e}")

        return plan_res

    @classmethod
    def simulate_what_if(
        cls,
        request: PlanSimulateRequest,
    ) -> PlanSimulateResponse:
        """Simulate changes to asset allocation, horizon, and monthly contributions."""
        capital = request.investable_capital
        sip = request.monthly_sip
        horizon = request.investment_horizon_years
        alloc_dict = request.allocations
        inflation = request.inflation_rate_pct / 100.0

        # Build simulated allocation items
        sim_items: List[AssetAllocationItem] = []
        amounts_inr: Dict[str, float] = {}

        return_map = {
            "Fixed Deposits": 7.10,
            "Gold": 11.20,
            "Stocks": 13.80,
            "Diversified Index Funds": 12.50,
        }

        for k, pct in alloc_dict.items():
            amt = round(capital * (pct / 100.0), 2)
            amounts_inr[k] = amt
            sim_items.append(
                AssetAllocationItem(
                    asset_class=k,
                    category_label=k,
                    allocation_pct=pct,
                    allocated_amount=amt,
                    expected_return_pct=return_map.get(k, 8.0),
                    risk_level="Moderate",
                    liquidity="Standard",
                    reason="Simulated allocation",
                )
            )

        # Recalculate risk
        risk = PortfolioRiskEngine.analyze_risk(sim_items)

        # Recalculate projection
        proj = WealthProjectionEngine.calculate_projections(
            allocations=sim_items,
            horizon_years=int(horizon),
            monthly_sip=sip,
            inflation_rate=inflation,
        )

        # Tax integration
        equity_amt = amounts_inr.get("Stocks", 0.0)
        mf_amt = amounts_inr.get("Diversified Index Funds", 0.0)
        fd_amt = amounts_inr.get("Fixed Deposits", 0.0)
        gold_amt = amounts_inr.get("Gold", 0.0)

        p_eq_gain = max(0.0, equity_amt * (math.pow(1.0 + 0.138, horizon) - 1.0))
        p_mf_gain = max(0.0, mf_amt * (math.pow(1.0 + 0.125, horizon) - 1.0))
        p_fd_gain = max(0.0, fd_amt * (math.pow(1.0 + 0.071, horizon) - 1.0))
        p_gold_gain = max(0.0, gold_amt * (math.pow(1.0 + 0.112, horizon) - 1.0))

        tax_res = TaxIntegrationService.evaluate_portfolio_tax(
            total_investable=capital,
            horizon_years=horizon,
            equity_allocation_amount=equity_amt,
            fd_allocation_amount=fd_amt,
            gold_allocation_amount=gold_amt,
            mutual_fund_allocation_amount=mf_amt,
            projected_equity_gain=p_eq_gain,
            projected_fd_gain=p_fd_gain,
            projected_gold_gain=p_gold_gain,
            projected_mf_gain=p_mf_gain,
            investor_slab_rate_pct=request.investor_tax_slab_pct,
        )

        fd_share = alloc_dict.get("Fixed Deposits", 0.0) / 100.0
        equity_share = (alloc_dict.get("Stocks", 0.0) + alloc_dict.get("Diversified Index Funds", 0.0)) / 100.0
        if fd_share >= 0.40:
            liq_text = "High liquidity: Strong liquid anchor with scheduled commercial bank deposits."
        elif equity_share >= 0.70:
            liq_text = "Market liquidity: Higher exposure to exchange settlement cycles and market drawdowns."
        else:
            liq_text = "Balanced liquidity: Well distributed across fixed deposits, gold ETFs, and listed shares."

        return PlanSimulateResponse(
            investable_capital=capital,
            monthly_sip=sip,
            investment_horizon_years=horizon,
            allocations=alloc_dict,
            allocation_amounts_inr=amounts_inr,
            expected_annual_return_pct=risk.expected_annual_return_pct,
            annualized_volatility_pct=risk.annualized_volatility_pct,
            sharpe_ratio=risk.sharpe_ratio,
            max_drawdown_pct=risk.maximum_drawdown_pct,
            nominal_final_value=proj.base_final_value,
            inflation_adjusted_final_value=proj.base_inflation_adjusted_value,
            estimated_pre_tax_gain=tax_res.pre_tax_expected_gain,
            estimated_total_tax=tax_res.estimated_total_tax,
            estimated_post_tax_gain=tax_res.post_tax_expected_gain,
            post_tax_portfolio_value=tax_res.post_tax_portfolio_value,
            liquidity_implications=liq_text,
            comparison_vs_baseline={
                "return_spread_pct": round(risk.expected_annual_return_pct - 10.0, 2),
                "tax_efficiency_rating": "Favorable" if tax_res.effective_tax_rate_pct < 15.0 else "Standard",
            },
        )

    @classmethod
    def get_plan_history(cls, db: Session, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieve previously saved investment plans for the authenticated user."""
        plans = (
            db.query(InvestmentPlanRecord)
            .filter(InvestmentPlanRecord.user_id == user_id)
            .order_by(InvestmentPlanRecord.created_at.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "plan_id": str(p.id),
                "plan_name": p.plan_name,
                "status": p.status,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "goal": p.profile_snapshot.get("primary_goal"),
                "capital": p.profile_snapshot.get("current_investable_capital"),
                "horizon_years": p.profile_snapshot.get("target_years"),
                "expected_return_pct": p.risk_metrics.get("expected_annual_return_pct"),
                "final_base_value": p.wealth_projections.get("base_final_value"),
            }
            for p in plans
        ]

    @classmethod
    def get_plan_by_id(cls, db: Session, user_id: str, plan_id: str) -> Optional[InvestmentPlanResponse]:
        """Retrieve full plan details, enforcing user isolation."""
        plan = (
            db.query(InvestmentPlanRecord)
            .filter(
                InvestmentPlanRecord.id == plan_id,
                InvestmentPlanRecord.user_id == user_id,
            )
            .first()
        )
        if not plan:
            return None

        return InvestmentPlanResponse(
            plan_id=str(plan.id),
            user_id=str(plan.user_id),
            created_at=plan.created_at.isoformat() if plan.created_at else "",
            plan_name=plan.plan_name,
            status=plan.status,
            profile_summary=PlannerProfileInput(**plan.profile_snapshot),
            suitability=plan.suitability_assessment,  # type: ignore
            asset_allocation=plan.asset_allocation,    # type: ignore
            stock_allocations=plan.stock_allocations,  # type: ignore
            fixed_deposits=plan.fd_plan,              # type: ignore
            gold_analysis=plan.gold_plan,             # type: ignore
            wealth_projections=plan.wealth_projections, # type: ignore
            risk_analysis=plan.risk_metrics,          # type: ignore
            tax_integration=plan.tax_estimates,       # type: ignore
            goal_timeline=plan.timeline_milestones,   # type: ignore
            alternative_portfolios=plan.alternative_portfolios, # type: ignore
            explainability_insights=plan.explainability_insights, # type: ignore
        )

    @classmethod
    def _build_alternative_portfolios(
        cls,
        profile: PlannerProfileInput,
        suitability: SuitabilityAssessment,
    ) -> List[AlternativePortfolio]:
        """Generate three standardized alternative portfolios: Capital Preservation, Balanced Growth, Long-Term Growth."""
        return [
            AlternativePortfolio(
                name="Capital Preservation",
                label="Conservative / Income Anchor",
                description="Maximizes capital security with dominant fixed deposits, sovereign gold buffer, and modest equity exposure.",
                allocations={
                    "Fixed Deposits": 60.0,
                    "Gold": 15.0,
                    "Stocks": 10.0,
                    "Diversified Index Funds": 15.0,
                },
                expected_return_pct=8.60,
                volatility_pct=4.80,
                sharpe_ratio=0.44,
                max_drawdown_pct=6.50,
                estimated_after_tax_return_pct=7.10,
                suitability="Ideal for risk-averse investors, near-term goals (<2 years), or retirees seeking regular income.",
                pros=["Guaranteed principal protection on FDs", "Very low portfolio volatility", "High immediate liquidity"],
                cons=["Lower long-term real purchasing power growth", "Higher tax friction on bank FD interest"],
            ),
            AlternativePortfolio(
                name="Balanced Growth",
                label="Core Balanced Wealth Builder",
                description="Equally distributes risk across market-linked equities, commodity inflation hedges, and stable fixed income.",
                allocations={
                    "Fixed Deposits": 25.0,
                    "Gold": 15.0,
                    "Stocks": 30.0,
                    "Diversified Index Funds": 30.0,
                },
                expected_return_pct=11.60,
                volatility_pct=10.20,
                sharpe_ratio=0.50,
                max_drawdown_pct=16.50,
                estimated_after_tax_return_pct=9.80,
                suitability="Recommended for 3-5 year investment horizons balancing wealth appreciation with shock resilience.",
                pros=["Excellent risk-adjusted returns (Sharpe 0.50)", "Non-correlated gold buffer dampens equity sell-offs", "Optimal tax efficiency u/s 112A"],
                cons=["Moderate drawdowns during bear markets", "Requires annual portfolio rebalancing"],
            ),
            AlternativePortfolio(
                name="Long-Term Growth",
                label="Aggressive Compounding",
                description="Heavy allocation to direct equities and broad market index funds to maximize long-term wealth compounding.",
                allocations={
                    "Fixed Deposits": 10.0,
                    "Gold": 10.0,
                    "Stocks": 45.0,
                    "Diversified Index Funds": 35.0,
                },
                expected_return_pct=13.50,
                volatility_pct=15.40,
                sharpe_ratio=0.45,
                max_drawdown_pct=26.00,
                estimated_after_tax_return_pct=11.70,
                suitability="Best for 7+ year investment runways where sequence-of-returns volatility can be safely absorbed.",
                pros=["Highest projected inflation-beating returns", "Maximum equity compounding benefits", "Favorable 12.5% LTCG tax treatment"],
                cons=["High short-term volatility", "Substantial drawdowns during cyclical market corrections"],
            ),
        ]

    @classmethod
    def _generate_explainability_insights(
        cls,
        profile: PlannerProfileInput,
        suitability: SuitabilityAssessment,
        allocations: List[AssetAllocationItem],
        stocks: List[Any],
    ) -> List[ExplainabilityInsight]:
        """Produce structured explanations attributing decisions to rules, optimization, ML, and preferences."""
        insights = [
            ExplainabilityInsight(
                category="Rule-Based Suitability",
                asset_class="Emergency Reserve & FDs",
                driver="Emergency Fund & Debt Ratio",
                explanation=(
                    f"Investor has {suitability.emergency_fund_months:.1f} months of expenses saved and a DTI ratio of {suitability.debt_to_income_ratio:.1f}%. "
                    + (
                        f"A separate safety reserve of ₹{suitability.suggested_liquid_reserve:,.0f} was segregated before allocating risk assets."
                        if suitability.suggested_liquid_reserve > 0
                        else "Adequate liquid savings enabled full capital deployment."
                    )
                ),
            ),
            ExplainabilityInsight(
                category="Mathematical Optimization",
                asset_class="Gold & Fixed Deposits",
                driver="Cross-Asset Correlation Matrix",
                explanation=(
                    "Gold's negative correlation (-0.06 to -0.08) with Indian equities reduces total portfolio volatility "
                    "without sacrificing long-term inflation protection, improving the portfolio's Sharpe ratio."
                ),
            ),
            ExplainabilityInsight(
                category="ML Forecast Integration",
                asset_class="Stocks",
                driver="Ensemble Prediction & SHAP Decomposition",
                explanation=(
                    f"Selected {len(stocks)} high-conviction equities from the StockIQ catalog based on positive ML target returns "
                    "and supportive SHAP drivers across Q3 margins, institutional inflows, and moving average momentum."
                ),
                shap_features_referenced=["Quarterly Revenue Growth", "SMA Momentum", "Institutional Net Inflows"],
            ),
            ExplainabilityInsight(
                category="User Preference",
                asset_class="All Asset Classes",
                driver="Investment Horizon & Style",
                explanation=(
                    f"A {profile.target_years:.1f}-year horizon and '{profile.investment_style}' contribution style "
                    f"informed the equity-debt mix to align with the primary goal of '{profile.primary_goal}'."
                ),
            ),
        ]
        return insights

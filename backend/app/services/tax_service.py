"""Application service orchestrating Capital Gains Tax computations, XAI, database history, and scenarios."""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.tax_rules import get_financial_year, get_tax_rule_for_transfer
from app.models.portfolio import Holding, Portfolio
from app.models.tax import TaxCalculationRecord, TaxTransaction
from app.schemas.tax import (
    AcquisitionLotSchema,
    PortfolioHoldingTaxStatus,
    ScenarioOutcome,
    TaxCalculateRequest,
    TaxCalculateResponse,
    TaxExplainRequest,
    TaxHistoryRecordResponse,
    TaxScenarioComparisonRequest,
    TaxScenarioComparisonResponse,
    TaxSummaryResponse,
    TaxTransactionCreate,
    TaxTransactionResponse,
)
from app.services.tax_engine import (
    AcquisitionLot,
    TaxComputationEngine,
    TransactionCalculationResult,
    round_currency,
)
from app.services.tax_xai import TaxExplainabilityEngine


class TaxService:
    """Service layer for Tax Intelligence and Explainable Capital Gains."""

    @classmethod
    def calculate_tax(
        cls,
        db: Session,
        user_id: str,
        request: TaxCalculateRequest,
    ) -> TaxCalculateResponse:
        """Perform deterministic calculation, generate XAI explanation, and optionally audit-save."""
        lots: Optional[List[AcquisitionLot]] = None
        if request.lots and len(request.lots) > 0:
            lots = [
                AcquisitionLot(
                    lot_id=l.lot_id or f"lot_{idx + 1}",
                    purchase_date=l.purchase_date,
                    quantity=l.quantity,
                    purchase_price=l.purchase_price,
                    expenses=l.expenses,
                )
                for idx, l in enumerate(request.lots)
            ]
            calc_result = TaxComputationEngine.calculate_with_fifo_lots(
                symbol=request.symbol.upper(),
                sale_date=request.sale_date,
                quantity_to_sell=request.quantity,
                sale_price_per_share=request.sale_price,
                lots=lots,
                asset_category=request.asset_category,
                eligible_expenses=request.eligible_expenses,
                ineligible_expenses=request.ineligible_expenses,
                prior_ltcg_in_fy=request.prior_ltcg_in_fy,
                surcharge_rate=request.surcharge_rate,
            )
        else:
            p_price = request.purchase_price if request.purchase_price is not None else Decimal("0.00")
            calc_result = TaxComputationEngine.calculate_single_transaction(
                symbol=request.symbol.upper(),
                sale_date=request.sale_date,
                quantity=request.quantity,
                sale_price_per_share=request.sale_price,
                purchase_date=request.purchase_date,
                purchase_price_per_share=p_price,
                asset_category=request.asset_category,
                eligible_expenses=request.eligible_expenses,
                ineligible_expenses=request.ineligible_expenses,
                prior_ltcg_in_fy=request.prior_ltcg_in_fy,
                surcharge_rate=request.surcharge_rate,
            )

        explanation = TaxExplainabilityEngine.explain(calc_result)

        calculation_record_id: Optional[str] = None
        if request.save_record:
            rec = TaxCalculationRecord(
                id=uuid.uuid4(),
                user_id=uuid.UUID(user_id) if isinstance(user_id, str) else user_id,
                financial_year=calc_result.financial_year,
                asset_symbol=calc_result.symbol,
                transaction_details={
                    "quantity": float(calc_result.quantity),
                    "sale_price": float(calc_result.sale_price_per_share),
                    "sale_date": calc_result.sale_date.isoformat(),
                    "purchase_date": calc_result.purchase_date.isoformat() if calc_result.purchase_date else None,
                    "purchase_price": float(calc_result.purchase_price_per_share),
                    "asset_category": calc_result.asset_category,
                    "lot_allocations": calc_result.lot_allocations,
                },
                calculation_inputs=request.model_dump(mode="json"),
                calculated_gains=explanation["structured_metrics"],
                tax_category=calc_result.capital_gain_category,
                tax_rule_version=calc_result.rule_version,
                estimated_tax=calc_result.estimated_total_tax_rounded,
                estimated_after_tax_profit=calc_result.estimated_after_tax_profit,
                relevant_assumptions=calc_result.assumptions,
                missing_information_warnings=calc_result.warnings,
                explanation_snapshot=explanation["explanation_sections"],
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
            calculation_record_id = str(rec.id)

        return TaxCalculateResponse(
            calculation_id=calculation_record_id,
            symbol=calc_result.symbol,
            financial_year=calc_result.financial_year,
            rule_version=calc_result.rule_version,
            rule_label=calc_result.rule_label,
            status=calc_result.status,
            structured_metrics=explanation["structured_metrics"],
            explanation_sections=explanation["explanation_sections"],
            assumptions=explanation["assumptions"],
            missing_information=explanation["missing_information"],
            disclaimer=explanation["disclaimer"],
            lot_allocations=calc_result.lot_allocations,
        )

    @classmethod
    def explain_tax(
        cls,
        db: Session,
        user_id: str,
        request: TaxExplainRequest,
    ) -> TaxCalculateResponse:
        """Retrieve existing calculation explanation or generate one on the fly."""
        if request.calculation_id:
            try:
                rec_uuid = uuid.UUID(request.calculation_id)
            except ValueError:
                rec_uuid = request.calculation_id

            rec = (
                db.query(TaxCalculationRecord)
                .filter(
                    TaxCalculationRecord.id == rec_uuid,
                    TaxCalculationRecord.user_id == uuid.UUID(user_id) if isinstance(user_id, str) else user_id,
                )
                .first()
            )
            if not rec:
                raise ValueError("Tax calculation record not found or access denied.")

            metrics = rec.calculated_gains
            explanations = rec.explanation_snapshot or {}
            rule = get_tax_rule_for_transfer(date.today())

            return TaxCalculateResponse(
                calculation_id=str(rec.id),
                symbol=rec.asset_symbol,
                financial_year=rec.financial_year,
                rule_version=rec.tax_rule_version,
                rule_label=rule.version_label if rule else "Indian Capital Gains Regime",
                status="COMPLETE" if not rec.missing_information_warnings else "PROVISIONAL",
                structured_metrics=metrics,
                explanation_sections=explanations,
                assumptions=rec.relevant_assumptions or [],
                missing_information=rec.missing_information_warnings or [],
                disclaimer=(
                    "StockIQ provides an estimate of capital gains and potential tax liability for informational purposes. "
                    "The final tax treatment may depend on your complete financial circumstances, transaction records, "
                    "applicable legislation, and other statutory conditions. Verify the result before filing your income-tax return."
                ),
            )

        if request.calculation_input:
            # Ephemeral calculation without forcing new DB record save
            input_copy = request.calculation_input.model_copy()
            input_copy.save_record = False
            return cls.calculate_tax(db=db, user_id=user_id, request=input_copy)

        raise ValueError("Either calculation_id or calculation_input must be supplied.")

    @classmethod
    def get_summary(
        cls,
        db: Session,
        user_id: str,
        financial_year: Optional[str] = None,
    ) -> TaxSummaryResponse:
        """Compute comprehensive tax overview, combining realized transactions and active portfolio holdings."""
        u_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        target_fy = financial_year or get_financial_year(date.today())

        # 1. Fetch user's realized tax transactions for the financial year
        txns = (
            db.query(TaxTransaction)
            .filter(
                TaxTransaction.user_id == u_uuid,
                TaxTransaction.financial_year == target_fy,
                TaxTransaction.is_realized.is_(True),
            )
            .all()
        )

        total_purchase_val = Decimal("0.00")
        total_sale_val = Decimal("0.00")
        realized_gains = Decimal("0.00")
        total_stcg = Decimal("0.00")
        total_ltcg = Decimal("0.00")
        total_taxable_gains = Decimal("0.00")
        estimated_tax = Decimal("0.00")

        current_prior_ltcg = Decimal("0.00")

        for t in txns:
            if t.sale_price is not None and t.sale_date is not None:
                p_date = t.purchase_date
                p_price = Decimal(str(t.purchase_price))
                s_price = Decimal(str(t.sale_price))
                qty = Decimal(str(t.quantity))
                exp = Decimal(str(t.eligible_expenses))
                ineligible = Decimal(str(t.ineligible_expenses))

                res = TaxComputationEngine.calculate_single_transaction(
                    symbol=t.symbol,
                    sale_date=t.sale_date,
                    quantity=qty,
                    sale_price_per_share=s_price,
                    purchase_date=p_date,
                    purchase_price_per_share=p_price,
                    asset_category=t.asset_category or "LISTED_EQUITY",
                    eligible_expenses=exp,
                    ineligible_expenses=ineligible,
                    prior_ltcg_in_fy=current_prior_ltcg,
                )

                total_purchase_val += res.purchase_value
                total_sale_val += res.sale_value
                realized_gains += res.net_capital_gain_before_tax
                total_taxable_gains += res.taxable_capital_gain
                estimated_tax += res.estimated_total_tax_rounded

                if res.is_long_term and res.net_capital_gain_before_tax > 0:
                    total_ltcg += res.net_capital_gain_before_tax
                    current_prior_ltcg += res.net_capital_gain_before_tax
                elif res.net_capital_gain_before_tax > 0:
                    total_stcg += res.net_capital_gain_before_tax

        # 2. Portfolio holdings status
        portfolios = db.query(Portfolio).filter(Portfolio.user_id == u_uuid).all()
        holdings_breakdown: List[PortfolioHoldingTaxStatus] = []
        unrealized_gains = Decimal("0.00")
        incomplete_count = 0
        today = date.today()

        for p in portfolios:
            h_list = db.query(Holding).filter(Holding.portfolio_id == p.id).all()
            for h in h_list:
                qty = Decimal(str(h.quantity))
                buy_price = Decimal(str(h.avg_buy_price or 0.0))
                cur_price = Decimal(str(h.current_price or h.avg_buy_price or 0.0))
                invested = round_currency(qty * buy_price)
                current_val = round_currency(qty * cur_price)
                unrealized = round_currency(current_val - invested)
                unrealized_gains += unrealized

                missing_fields: List[str] = []
                # Holding creation date serves as default purchase date if available
                p_date = h.created_at.date() if h.created_at else None
                if not p_date:
                    missing_fields.append("purchase_date")
                if buy_price <= 0:
                    missing_fields.append("avg_buy_price")

                is_complete = len(missing_fields) == 0
                if not is_complete:
                    incomplete_count += 1

                # Simulate tax if exited today
                try:
                    sim_exit = TaxComputationEngine.calculate_single_transaction(
                        symbol=h.symbol,
                        sale_date=today,
                        quantity=qty,
                        sale_price_per_share=cur_price,
                        purchase_date=p_date,
                        purchase_price_per_share=buy_price,
                        prior_ltcg_in_fy=current_prior_ltcg,
                    )
                    tax_category = sim_exit.capital_gain_category
                    section = sim_exit.applicable_section
                    exit_tax = float(sim_exit.estimated_total_tax_rounded)
                    hp_days = sim_exit.holding_period_days
                except Exception:
                    tax_category = "STCG"
                    section = "Section 111A"
                    exit_tax = 0.0
                    hp_days = None

                holdings_breakdown.append(
                    PortfolioHoldingTaxStatus(
                        holding_id=str(h.id),
                        symbol=h.symbol,
                        quantity=float(qty),
                        avg_buy_price=float(buy_price),
                        current_price=float(cur_price),
                        invested_value=float(invested),
                        current_value=float(current_val),
                        unrealized_gain=float(unrealized),
                        holding_period_days=hp_days,
                        tax_category=tax_category,
                        applicable_section=section,
                        estimated_exit_tax_today=exit_tax,
                        is_tax_info_complete=is_complete,
                        missing_fields=missing_fields,
                    )
                )

        net_profit_after_tax = realized_gains - estimated_tax
        active_rule = get_tax_rule_for_transfer(today)

        return TaxSummaryResponse(
            financial_year=target_fy,
            total_purchase_value=float(total_purchase_val),
            total_sale_value=float(total_sale_val),
            realized_capital_gains=float(realized_gains),
            unrealized_portfolio_gains=float(unrealized_gains),
            estimated_stcg=float(total_stcg),
            estimated_ltcg=float(total_ltcg),
            estimated_taxable_gains=float(total_taxable_gains),
            estimated_capital_gains_tax=float(estimated_tax),
            estimated_tax_paid_or_deducted=0.0,
            estimated_net_profit_after_tax=float(net_profit_after_tax),
            incomplete_tax_holdings_count=incomplete_count,
            rule_version=active_rule.rule_id,
            rule_label=active_rule.version_label,
            disclaimer=(
                "StockIQ provides an estimate of capital gains and potential tax liability for informational purposes. "
                "The final tax treatment may depend on your complete financial circumstances, transaction records, "
                "applicable legislation, and other statutory conditions. Verify the result before filing your income-tax return."
            ),
            holdings_breakdown=holdings_breakdown,
        )

    @classmethod
    def simulate_scenarios(
        cls,
        db: Session,
        user_id: str,
        request: TaxScenarioComparisonRequest,
    ) -> TaxScenarioComparisonResponse:
        """Simulate hypothetical sale decisions and quantify potential tax savings."""
        lots: Optional[List[AcquisitionLot]] = None
        if request.lots:
            lots = [
                AcquisitionLot(
                    lot_id=l.lot_id or f"lot_{idx + 1}",
                    purchase_date=l.purchase_date,
                    quantity=l.quantity,
                    purchase_price=l.purchase_price,
                    expenses=l.expenses,
                )
                for idx, l in enumerate(request.lots)
            ]

        # Check if user requested ML predicted price from StockIQ prediction service
        predicted_price: Optional[float] = None
        prediction_details = None
        if request.use_ml_predicted_price:
            try:
                from app.services.prediction_service import PredictionService
                from app.schemas.prediction import PredictionRequest

                pred = PredictionService.generate_prediction(
                    request=PredictionRequest(
                        stock_symbol=request.symbol,
                        target_horizon=request.target_horizon or "30d",
                    ),
                    db=db,
                    user_id=user_id,
                )
                predicted_price = float(pred.predicted_price)
                prediction_details = {
                    "direction": pred.direction,
                    "confidence": pred.confidence,
                    "target_horizon": pred.target_horizon,
                    "model_name": pred.model_name,
                    "shap_factors": [
                        {"feature": f.feature_name, "impact": f.attribution_value}
                        for f in (pred.shap_waterfall[:3] if pred.shap_waterfall else [])
                    ],
                }
            except Exception:
                # Graceful degradation if symbol or prediction is not ready
                predicted_price = None

        outcomes: List[ScenarioOutcome] = []
        base_tax: Optional[float] = None

        for sc in request.scenarios:
            sale_price = Decimal(str(predicted_price)) if (request.use_ml_predicted_price and predicted_price) else sc.sale_price
            if lots:
                calc = TaxComputationEngine.calculate_with_fifo_lots(
                    symbol=request.symbol,
                    sale_date=sc.sale_date,
                    quantity_to_sell=request.quantity,
                    sale_price_per_share=sale_price,
                    lots=lots,
                )
            else:
                p_price = request.purchase_price if request.purchase_price is not None else Decimal("0.00")
                calc = TaxComputationEngine.calculate_single_transaction(
                    symbol=request.symbol,
                    sale_date=sc.sale_date,
                    quantity=request.quantity,
                    sale_price_per_share=sale_price,
                    purchase_date=request.purchase_date,
                    purchase_price_per_share=p_price,
                )

            current_tax = float(calc.estimated_total_tax_rounded)
            if base_tax is None:
                base_tax = current_tax
            tax_saving = round(base_tax - current_tax, 2)

            notes = []
            if calc.is_long_term:
                notes.append("Qualifies for Section 112A LTCG special 12.5% rate with ₹1,25,000 annual exemption limit.")
            else:
                notes.append("Subject to Section 111A STCG 20% flat tax rate.")

            if tax_saving > 0:
                notes.append(f"Estimated tax savings of ₹{tax_saving:,.2f} compared to immediate sale.")

            outcomes.append(
                ScenarioOutcome(
                    scenario_id=sc.scenario_id,
                    title=sc.title,
                    sale_date=sc.sale_date.isoformat(),
                    sale_price=float(sale_price),
                    holding_period_days=calc.holding_period_days,
                    is_long_term=calc.is_long_term,
                    capital_gain_category=calc.capital_gain_category,
                    applicable_section=calc.applicable_section,
                    applicable_tax_rate_percent=float(calc.applicable_tax_rate * 100),
                    gross_capital_gain=float(calc.gross_capital_gain),
                    net_capital_gain=float(calc.net_capital_gain_before_tax),
                    taxable_gain=float(calc.taxable_capital_gain),
                    estimated_tax=current_tax,
                    after_tax_profit=float(calc.estimated_after_tax_profit),
                    tax_savings_vs_base=tax_saving,
                    notes=" ".join(notes),
                )
            )

        # Strategic insight summary
        ltcg_scenarios = [o for o in outcomes if o.is_long_term]
        stcg_scenarios = [o for o in outcomes if not o.is_long_term]
        if ltcg_scenarios and stcg_scenarios:
            diff = stcg_scenarios[0].estimated_tax - ltcg_scenarios[0].estimated_tax
            if diff > 0:
                insight = (
                    f"Holding {request.symbol} until it surpasses 365 days transitions gains from Section 111A (20% STCG) "
                    f"to Section 112A (12.5% LTCG + ₹1,25,000 exemption), potentially saving approximately ₹{diff:,.2f} in tax, "
                    "subject to market risk and price fluctuations."
                )
            else:
                insight = "Holding period transitions to LTCG, but overall gains are within the exempt bracket or minimal tax differential."
        else:
            insight = "All evaluated scenarios share similar holding tax classifications."

        return TaxScenarioComparisonResponse(
            symbol=request.symbol,
            quantity=float(request.quantity),
            predicted_price_used=predicted_price,
            prediction_details=prediction_details,
            outcomes=outcomes,
            strategic_insight=insight,
            disclaimer=(
                "Future scenarios are purely hypothetical simulations for investment planning. "
                "Market prices, tax laws, and holding realities fluctuate. "
                "Predicted prices are machine learning estimates, not guaranteed returns."
            ),
        )

    @classmethod
    def create_transaction(
        cls,
        db: Session,
        user_id: str,
        txn_in: TaxTransactionCreate,
    ) -> TaxTransactionResponse:
        """Create a new user tax transaction record."""
        u_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        fy_date = txn_in.sale_date or txn_in.purchase_date or date.today()
        fy = get_financial_year(fy_date)

        txn = TaxTransaction(
            id=uuid.uuid4(),
            user_id=u_uuid,
            symbol=txn_in.symbol.upper(),
            asset_category=txn_in.asset_category,
            exchange=txn_in.exchange.upper(),
            purchase_date=txn_in.purchase_date,
            purchase_price=txn_in.purchase_price,
            quantity=txn_in.quantity,
            sale_date=txn_in.sale_date,
            sale_price=txn_in.sale_price,
            eligible_expenses=txn_in.eligible_expenses,
            ineligible_expenses=txn_in.ineligible_expenses,
            financial_year=fy,
            is_realized=txn_in.is_realized,
            notes=txn_in.notes,
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)

        return TaxTransactionResponse(
            id=str(txn.id),
            user_id=str(txn.user_id),
            portfolio_id=str(txn.portfolio_id) if txn.portfolio_id else None,
            symbol=txn.symbol,
            asset_category=txn.asset_category,
            exchange=txn.exchange,
            purchase_date=txn.purchase_date,
            purchase_price=float(txn.purchase_price),
            quantity=float(txn.quantity),
            sale_date=txn.sale_date,
            sale_price=float(txn.sale_price) if txn.sale_price is not None else None,
            eligible_expenses=float(txn.eligible_expenses),
            ineligible_expenses=float(txn.ineligible_expenses),
            financial_year=txn.financial_year,
            is_realized=txn.is_realized,
            notes=txn.notes,
            created_at=txn.created_at,
        )

    @classmethod
    def list_transactions(
        cls,
        db: Session,
        user_id: str,
        financial_year: Optional[str] = None,
        symbol: Optional[str] = None,
    ) -> List[TaxTransactionResponse]:
        """List user's tax transactions with optional FY and symbol filters."""
        u_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        query = db.query(TaxTransaction).filter(TaxTransaction.user_id == u_uuid)
        if financial_year:
            query = query.filter(TaxTransaction.financial_year == financial_year)
        if symbol:
            query = query.filter(TaxTransaction.symbol == symbol.upper())

        txns = query.order_by(desc(TaxTransaction.created_at)).all()
        return [
            TaxTransactionResponse(
                id=str(t.id),
                user_id=str(t.user_id),
                portfolio_id=str(t.portfolio_id) if t.portfolio_id else None,
                symbol=t.symbol,
                asset_category=t.asset_category,
                exchange=t.exchange,
                purchase_date=t.purchase_date,
                purchase_price=float(t.purchase_price),
                quantity=float(t.quantity),
                sale_date=t.sale_date,
                sale_price=float(t.sale_price) if t.sale_price is not None else None,
                eligible_expenses=float(t.eligible_expenses),
                ineligible_expenses=float(t.ineligible_expenses),
                financial_year=t.financial_year,
                is_realized=t.is_realized,
                notes=t.notes,
                created_at=t.created_at,
            )
            for t in txns
        ]

    @classmethod
    def get_calculation_history(
        cls,
        db: Session,
        user_id: str,
        limit: int = 50,
    ) -> List[TaxHistoryRecordResponse]:
        """Fetch chronological audit history of saved tax calculations for authenticated user."""
        u_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        records = (
            db.query(TaxCalculationRecord)
            .filter(TaxCalculationRecord.user_id == u_uuid)
            .order_by(desc(TaxCalculationRecord.created_at))
            .limit(limit)
            .all()
        )
        return [
            TaxHistoryRecordResponse(
                id=str(r.id),
                user_id=str(r.user_id),
                financial_year=r.financial_year,
                asset_symbol=r.asset_symbol,
                tax_category=r.tax_category,
                tax_rule_version=r.tax_rule_version,
                estimated_tax=float(r.estimated_tax),
                estimated_after_tax_profit=float(r.estimated_after_tax_profit),
                transaction_details=r.transaction_details,
                calculation_inputs=r.calculation_inputs,
                calculated_gains=r.calculated_gains,
                relevant_assumptions=r.relevant_assumptions or [],
                missing_information_warnings=r.missing_information_warnings or [],
                created_at=r.created_at,
            )
            for r in records
        ]

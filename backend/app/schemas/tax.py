"""Pydantic request and response schemas for Capital Gains Tax intelligence."""

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AcquisitionLotSchema(BaseModel):
    lot_id: Optional[str] = None
    purchase_date: Optional[date] = None
    quantity: Decimal = Field(..., gt=0, description="Number of shares in lot")
    purchase_price: Decimal = Field(..., ge=0, description="Purchase price per share")
    expenses: Decimal = Field(default=Decimal("0.00"), ge=0, description="Eligible acquisition expenses")


class TaxCalculateRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=30, description="Ticker symbol or asset name")
    sale_date: date = Field(..., description="Date of sale / transfer")
    quantity: Decimal = Field(..., gt=0, description="Number of shares to sell")
    sale_price: Decimal = Field(..., ge=0, description="Selling price per share")
    purchase_date: Optional[date] = Field(default=None, description="Single lot acquisition date")
    purchase_price: Optional[Decimal] = Field(default=None, ge=0, description="Single lot purchase price per share")
    asset_category: str = Field(default="LISTED_EQUITY", description="Asset class (LISTED_EQUITY, EQUITY_MUTUAL_FUND, etc.)")
    eligible_expenses: Decimal = Field(default=Decimal("0.00"), ge=0, description="Allowable transfer expenses under Section 48")
    ineligible_expenses: Decimal = Field(default=Decimal("0.00"), ge=0, description="Ineligible charges such as STT")
    prior_ltcg_in_fy: Decimal = Field(default=Decimal("0.00"), ge=0, description="Prior realized LTCG in the same FY")
    surcharge_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=Decimal("0.37"), description="Applicable surcharge rate")
    lots: Optional[List[AcquisitionLotSchema]] = Field(default=None, description="Optional multiple purchase lots for FIFO matching")
    save_record: bool = Field(default=True, description="Save snapshot to audit calculation history")
    notes: Optional[str] = None


class StructuredMetricsSchema(BaseModel):
    purchase_value: float
    sale_value: float
    gross_capital_gain: float
    eligible_expenses: float
    net_capital_gain_before_tax: float
    holding_period_days: Optional[int] = None
    holding_period_label: str
    capital_gain_category: str
    applicable_section: str
    applicable_tax_rate: float
    annual_ltcg_threshold: float
    aggregate_eligible_ltcg: float
    taxable_capital_gain: float
    basic_tax: float
    surcharge: float
    cess: float
    estimated_total_tax: float
    estimated_after_tax_profit: float
    rule_version: str


class ExplanationSectionsSchema(BaseModel):
    why_is_gain_taxable: str
    why_category_selected: str
    why_rate_applicable: str
    how_tax_calculated: str
    what_could_change_result: str
    what_will_be_net_profit: str
    what_should_i_do_next: str


class TaxCalculateResponse(BaseModel):
    calculation_id: Optional[str] = None
    symbol: str
    financial_year: str
    rule_version: str
    rule_label: str
    status: str
    structured_metrics: StructuredMetricsSchema
    explanation_sections: ExplanationSectionsSchema
    assumptions: List[str]
    missing_information: List[str]
    disclaimer: str
    lot_allocations: Optional[List[Dict[str, Any]]] = None


class TaxExplainRequest(BaseModel):
    calculation_id: Optional[str] = None
    calculation_input: Optional[TaxCalculateRequest] = None


class ScenarioOption(BaseModel):
    scenario_id: str
    title: str
    sale_date: date
    sale_price: Decimal = Field(..., ge=0)
    description: Optional[str] = None


class TaxScenarioComparisonRequest(BaseModel):
    symbol: str
    quantity: Decimal = Field(..., gt=0)
    holding_id: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[Decimal] = None
    lots: Optional[List[AcquisitionLotSchema]] = None
    scenarios: List[ScenarioOption]
    use_ml_predicted_price: bool = False
    target_horizon: Optional[str] = "30d"


class ScenarioOutcome(BaseModel):
    scenario_id: str
    title: str
    sale_date: str
    sale_price: float
    holding_period_days: Optional[int]
    is_long_term: bool
    capital_gain_category: str
    applicable_section: str
    applicable_tax_rate_percent: float
    gross_capital_gain: float
    net_capital_gain: float
    taxable_gain: float
    estimated_tax: float
    after_tax_profit: float
    tax_savings_vs_base: float
    notes: str


class TaxScenarioComparisonResponse(BaseModel):
    symbol: str
    quantity: float
    predicted_price_used: Optional[float] = None
    prediction_details: Optional[Dict[str, Any]] = None
    outcomes: List[ScenarioOutcome]
    strategic_insight: str
    disclaimer: str


class TaxTransactionCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    asset_category: str = Field(default="LISTED_EQUITY")
    exchange: str = Field(default="NSE")
    purchase_date: Optional[date] = None
    purchase_price: Decimal = Field(..., ge=0)
    quantity: Decimal = Field(..., gt=0)
    sale_date: Optional[date] = None
    sale_price: Optional[Decimal] = Field(default=None, ge=0)
    eligible_expenses: Decimal = Field(default=Decimal("0.00"), ge=0)
    ineligible_expenses: Decimal = Field(default=Decimal("0.00"), ge=0)
    is_realized: bool = Field(default=True)
    notes: Optional[str] = None


class TaxTransactionResponse(BaseModel):
    id: str
    user_id: str
    portfolio_id: Optional[str] = None
    symbol: str
    asset_category: str
    exchange: str
    purchase_date: Optional[date] = None
    purchase_price: float
    quantity: float
    sale_date: Optional[date] = None
    sale_price: Optional[float] = None
    eligible_expenses: float
    ineligible_expenses: float
    financial_year: str
    is_realized: bool
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PortfolioHoldingTaxStatus(BaseModel):
    holding_id: str
    symbol: str
    quantity: float
    avg_buy_price: float
    current_price: Optional[float]
    invested_value: float
    current_value: float
    unrealized_gain: float
    holding_period_days: Optional[int]
    tax_category: str
    applicable_section: str
    estimated_exit_tax_today: float
    is_tax_info_complete: bool
    missing_fields: List[str]


class TaxSummaryResponse(BaseModel):
    financial_year: str
    total_purchase_value: float
    total_sale_value: float
    realized_capital_gains: float
    unrealized_portfolio_gains: float
    estimated_stcg: float
    estimated_ltcg: float
    estimated_taxable_gains: float
    estimated_capital_gains_tax: float
    estimated_tax_paid_or_deducted: float
    estimated_net_profit_after_tax: float
    incomplete_tax_holdings_count: int
    rule_version: str
    rule_label: str
    disclaimer: str
    holdings_breakdown: List[PortfolioHoldingTaxStatus]


class TaxHistoryRecordResponse(BaseModel):
    id: str
    user_id: str
    financial_year: str
    asset_symbol: str
    tax_category: str
    tax_rule_version: str
    estimated_tax: float
    estimated_after_tax_profit: float
    transaction_details: Dict[str, Any]
    calculation_inputs: Dict[str, Any]
    calculated_gains: Dict[str, Any]
    relevant_assumptions: Optional[List[str]] = None
    missing_information_warnings: Optional[List[str]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

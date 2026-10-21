/**
 * Types for Capital Gains Tax Intelligence & Explainable AI (XAI)
 */

export interface AcquisitionLotInput {
  lot_id?: string
  purchase_date?: string
  quantity: number
  purchase_price: number
  expenses?: number
}

export interface TaxCalculateRequest {
  symbol: string
  sale_date: string
  quantity: number
  sale_price: number
  purchase_date?: string
  purchase_price?: number
  asset_category?: string
  eligible_expenses?: number
  ineligible_expenses?: number
  prior_ltcg_in_fy?: number
  surcharge_rate?: number
  lots?: AcquisitionLotInput[]
  save_record?: boolean
  notes?: string
}

export interface StructuredTaxMetrics {
  purchase_value: number
  sale_value: number
  gross_capital_gain: number
  eligible_expenses: number
  net_capital_gain_before_tax: number
  holding_period_days?: number | null
  holding_period_label: string
  capital_gain_category: string
  applicable_section: string
  applicable_tax_rate: number
  annual_ltcg_threshold: number
  aggregate_eligible_ltcg: number
  taxable_capital_gain: number
  basic_tax: number
  surcharge: number
  cess: number
  estimated_total_tax: number
  estimated_after_tax_profit: number
  rule_version: string
}

export interface ExplanationSections {
  why_is_gain_taxable: string
  why_category_selected: string
  why_rate_applicable: string
  how_tax_calculated: string
  what_could_change_result: string
  what_will_be_net_profit: string
  what_should_i_do_next: string
}

export interface LotAllocation {
  lot_id: string
  quantity_matched: number
  purchase_date?: string | null
  purchase_price: number
  holding_period_days?: number | null
  category: string
  gross_gain: number
  tax: number
}

export interface TaxCalculateResponse {
  calculation_id?: string | null
  symbol: string
  financial_year: string
  rule_version: string
  rule_label: string
  status: 'COMPLETE' | 'PROVISIONAL' | 'REQUIRES_REVIEW' | string
  structured_metrics: StructuredTaxMetrics
  explanation_sections: ExplanationSections
  assumptions: string[]
  missing_information: string[]
  disclaimer: string
  lot_allocations?: LotAllocation[] | null
}

export interface PortfolioHoldingTaxStatus {
  holding_id: string
  symbol: string
  quantity: number
  avg_buy_price: number
  current_price?: number | null
  invested_value: number
  current_value: number
  unrealized_gain: number
  holding_period_days?: number | null
  tax_category: string
  applicable_section: string
  estimated_exit_tax_today: number
  is_tax_info_complete: boolean
  missing_fields: string[]
}

export interface TaxSummaryResponse {
  financial_year: string
  total_purchase_value: number
  total_sale_value: number
  realized_capital_gains: number
  unrealized_portfolio_gains: number
  estimated_stcg: number
  estimated_ltcg: number
  estimated_taxable_gains: number
  estimated_capital_gains_tax: number
  estimated_tax_paid_or_deducted: number
  estimated_net_profit_after_tax: number
  incomplete_tax_holdings_count: number
  rule_version: string
  rule_label: string
  disclaimer: string
  holdings_breakdown: PortfolioHoldingTaxStatus[]
}

export interface ScenarioOptionInput {
  scenario_id: string
  title: string
  sale_date: string
  sale_price: number
  description?: string
}

export interface TaxScenarioComparisonRequest {
  symbol: string
  quantity: number
  holding_id?: string
  purchase_date?: string
  purchase_price?: number
  lots?: AcquisitionLotInput[]
  scenarios: ScenarioOptionInput[]
  use_ml_predicted_price?: boolean
  target_horizon?: string
}

export interface ScenarioOutcome {
  scenario_id: string
  title: string
  sale_date: string
  sale_price: number
  holding_period_days?: number | null
  is_long_term: boolean
  capital_gain_category: string
  applicable_section: string
  applicable_tax_rate_percent: number
  gross_capital_gain: number
  net_capital_gain: number
  taxable_gain: number
  estimated_tax: number
  after_tax_profit: number
  tax_savings_vs_base: number
  notes: string
}

export interface TaxScenarioComparisonResponse {
  symbol: string
  quantity: number
  predicted_price_used?: number | null
  prediction_details?: any
  outcomes: ScenarioOutcome[]
  strategic_insight: string
  disclaimer: string
}

export interface TaxTransaction {
  id: string
  user_id: string
  portfolio_id?: string | null
  symbol: string
  asset_category: string
  exchange: string
  purchase_date?: string | null
  purchase_price: number
  quantity: number
  sale_date?: string | null
  sale_price?: number | null
  eligible_expenses: number
  ineligible_expenses: number
  financial_year: string
  is_realized: boolean
  notes?: string | null
  created_at: string
}

export interface TaxHistoryRecord {
  id: string
  user_id: string
  financial_year: string
  asset_symbol: string
  tax_category: string
  tax_rule_version: string
  estimated_tax: number
  estimated_after_tax_profit: number
  transaction_details: any
  calculation_inputs: any
  calculated_gains: StructuredTaxMetrics
  relevant_assumptions?: string[]
  missing_information_warnings?: string[]
  created_at: string
}

export interface TaxRuleDefinition {
  rule_id: string
  version_label: string
  effective_from: string
  effective_to?: string | null
  asset_category: string
  stcg_rate_percent: number
  ltcg_rate_percent: number
  ltcg_exemption_threshold: number
  holding_period_months: number
  cess_rate_percent: number
  stt_deductible: boolean
  description: string
}

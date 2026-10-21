/**
 * TypeScript type definitions for AI Personal Investment Planner & Portfolio Optimizer
 */

export interface PlannerProfileInput {
  age: number
  occupation?: string
  monthly_income: number
  monthly_expenses: number
  monthly_savings: number
  emergency_fund: number
  existing_investments: number
  debt_obligations: number
  financial_dependents: number
  current_investable_capital: number

  primary_goal: string
  target_amount?: number
  target_years: number
  investment_horizon_category: string
  risk_tolerance: 'Very Low' | 'Low' | 'Moderate' | 'High'
  required_liquidity: 'High' | 'Moderate' | 'Low'
  max_acceptable_loss_pct: number
  investment_style: 'LUMP_SUM' | 'SIP' | 'HYBRID' | 'STAGGERED'
  monthly_sip_amount: number

  preferred_asset_classes: string[]
  preferred_sectors: string[]
  preferred_stocks: string[]
}

export interface SuitabilityAssessment {
  risk_tolerance: string
  risk_capacity_score: number
  risk_capacity_level: 'Very Low' | 'Low' | 'Moderate' | 'High'
  composite_risk_rating: string
  monthly_surplus: number
  debt_to_income_ratio: number
  emergency_fund_months: number
  suggested_liquid_reserve: number
  emergency_fund_adequate: boolean
  investable_capital_allocated: number
  total_capital_provided: number
  suggested_investment_horizon_years: number
  goal_feasibility_score: number
  goal_feasibility_status: string
  suitability_narrative: string
  key_assumptions: string[]
  warnings: string[]
}

export interface AssetAllocationItem {
  asset_class: string
  category_label: string
  allocation_pct: number
  allocated_amount: number
  expected_return_pct: number
  risk_level: string
  liquidity: string
  reason: string
}

export interface StockAllocationItem {
  symbol: string
  company_name: string
  sector: string
  market_cap_category: string
  current_price: number
  target_price: number
  projected_return_pct: number
  beta: number
  volatility_risk: string
  ml_confidence: number
  weight_pct: number
  allocated_amount: number
  key_shap_drivers: string[]
  recommendation_signal: string
}

export interface FixedDepositOption {
  institution: string
  category: string
  interest_rate_pct: number
  tenure_months: number
  compounding_method: string
  allocated_amount: number
  maturity_amount: number
  total_interest_earned: number
  dicgc_protected: boolean
  dicgc_limit: number
  premature_withdrawal_condition: string
  liquidity_note: string
}

export interface GoldProductOption {
  product_type: string
  product_name: string
  unit_market_rate: number
  allocated_amount: number
  historical_10yr_cagr: number
  transaction_costs: string
  storage_costs: string
  liquidity: string
  tracking_difference: string
  tax_treatment: string
  risk_summary: string
}

export interface WealthProjectionYear {
  year: number
  total_invested: number
  conservative_value: number
  base_value: number
  optimistic_value: number
  inflation_adjusted_base_value: number
  inflation_discount_factor: number
}

export interface WealthProjectionSummary {
  investment_horizon_years: number
  initial_lump_sum: number
  monthly_sip: number
  total_principal_invested: number
  conservative_final_value: number
  base_final_value: number
  optimistic_final_value: number
  base_inflation_adjusted_value: number
  projected_annual_cagr_base: number
  yearly_trajectory: WealthProjectionYear[]
  inflation_assumption_pct: number
  disclaimer: string
}

export interface PortfolioRiskAnalysis {
  expected_annual_return_pct: number
  annualized_volatility_pct: number
  sharpe_ratio: number
  maximum_drawdown_pct: number
  value_at_risk_95_pct: number
  downside_risk_pct: number
  asset_concentration_hhi: number
  sector_concentration: Record<string, number>
  liquidity_exposure_score: string
  inflation_risk_rating: string
  risk_metrics_explanation: Record<string, string>
  historical_vs_predictive_note: string
}

export interface TaxIntegrationSummary {
  pre_tax_expected_gain: number
  estimated_equity_ltcg_tax: number
  estimated_fd_slab_tax: number
  estimated_gold_tax: number
  estimated_total_tax: number
  post_tax_expected_gain: number
  post_tax_portfolio_value: number
  effective_tax_rate_pct: number
  reused_tax_engine_rule: string
  equity_section_applied: string
  fd_tax_provision: string
  gold_tax_provision: string
  tax_assumptions: string[]
  unsupported_tax_limitations: string[]
  disclaimer: string
}

export interface GoalTimelineMilestone {
  year: number
  projected_corpus: number
  target_milestone: number
  gap_amount: number
  percent_achieved: number
  review_recommendation: string
}

export interface GoalTimelinePlan {
  goal_name: string
  target_amount: number
  target_years: number
  projected_corpus_at_horizon: number
  surplus_or_shortfall: number
  is_goal_achievable: boolean
  required_additional_monthly_sip: number
  milestones: GoalTimelineMilestone[]
  remedial_actions: string[]
}

export interface AlternativePortfolio {
  name: string
  label: string
  description: string
  allocations: Record<string, number>
  expected_return_pct: number
  volatility_pct: number
  sharpe_ratio: number
  max_drawdown_pct: number
  estimated_after_tax_return_pct: number
  suitability: string
  pros: string[]
  cons: string[]
}

export interface ExplainabilityInsight {
  category: string
  asset_class: string
  driver: string
  explanation: string
  shap_features_referenced?: string[]
}

export interface InvestmentPlanResponse {
  plan_id: string
  user_id: string
  created_at: string
  plan_name: string
  status: string
  profile_summary: PlannerProfileInput
  suitability: SuitabilityAssessment
  asset_allocation: AssetAllocationItem[]
  stock_allocations: StockAllocationItem[]
  fixed_deposits: FixedDepositOption[]
  gold_analysis: GoldProductOption[]
  wealth_projections: WealthProjectionSummary
  risk_analysis: PortfolioRiskAnalysis
  tax_integration: TaxIntegrationSummary
  goal_timeline: GoalTimelinePlan
  alternative_portfolios: AlternativePortfolio[]
  explainability_insights: ExplainabilityInsight[]
}

export interface PlanSimulateRequest {
  original_plan_id?: string
  investable_capital: number
  monthly_sip: number
  investment_horizon_years: number
  allocations: Record<string, number>
  inflation_rate_pct: number
  investor_tax_slab_pct: number
}

export interface PlanSimulateResponse {
  investable_capital: number
  monthly_sip: number
  investment_horizon_years: number
  allocations: Record<string, number>
  allocation_amounts_inr: Record<string, number>
  expected_annual_return_pct: number
  annualized_volatility_pct: number
  sharpe_ratio: number
  max_drawdown_pct: number
  nominal_final_value: number
  inflation_adjusted_final_value: number
  estimated_pre_tax_gain: number
  estimated_total_tax: number
  estimated_post_tax_gain: number
  post_tax_portfolio_value: number
  liquidity_implications: string
  comparison_vs_baseline: Record<string, any>
}

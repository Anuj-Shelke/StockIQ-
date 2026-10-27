/**
 * Capital Gains Tax Intelligence & Explainable AI Service Client
 */

import { apiFetch } from '@/services/api'
import type {
  TaxCalculateRequest,
  TaxCalculateResponse,
  TaxHistoryRecord,
  TaxRuleDefinition,
  TaxScenarioComparisonRequest,
  TaxScenarioComparisonResponse,
  TaxSummaryResponse,
  TaxTransaction,
} from '@/types/tax'

export const taxService = {
  /** Calculate capital gains, tax liability, and generate structured XAI explanation */
  async calculateTax(payload: TaxCalculateRequest): Promise<TaxCalculateResponse> {
    return apiFetch<TaxCalculateResponse>('/tax/calculate', {
      method: 'POST',
      body: payload,
    })
  },

  /** Explain previously computed result or inline inputs */
  async explainTax(payload: {
    calculation_id?: string
    calculation_input?: TaxCalculateRequest
  }): Promise<TaxCalculateResponse> {
    return apiFetch<TaxCalculateResponse>('/tax/explain', {
      method: 'POST',
      body: payload,
    })
  },

  /** Get aggregated summary for a specific financial year */
  async getSummary(financialYear?: string): Promise<TaxSummaryResponse> {
    const query = financialYear ? `?financial_year=${encodeURIComponent(financialYear)}` : ''
    return apiFetch<TaxSummaryResponse>(`/tax/summary${query}`)
  },

  /** Get user's recorded tax transactions */
  async getTransactions(financialYear?: string, symbol?: string): Promise<TaxTransaction[]> {
    const params = new URLSearchParams()
    if (financialYear) params.append('financial_year', financialYear)
    if (symbol) params.append('symbol', symbol)
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiFetch<TaxTransaction[]>(`/tax/transactions${query}`)
  },

  /** Create a new manual tax transaction */
  async createTransaction(payload: Partial<TaxTransaction>): Promise<TaxTransaction> {
    return apiFetch<TaxTransaction>('/tax/transactions', {
      method: 'POST',
      body: payload,
    })
  },

  /** Get user's calculation audit history */
  async getHistory(limit = 50): Promise<TaxHistoryRecord[]> {
    return apiFetch<TaxHistoryRecord[]>(`/tax/history?limit=${limit}`)
  },

  /** Compare hypothetical sale scenarios (what-if analysis) */
  async compareScenarios(
    payload: TaxScenarioComparisonRequest
  ): Promise<TaxScenarioComparisonResponse> {
    return apiFetch<TaxScenarioComparisonResponse>('/tax/scenario', {
      method: 'POST',
      body: payload,
    })
  },

  /** Get statutory tax rules and effective dates */
  async getTaxRules(): Promise<TaxRuleDefinition[]> {
    return apiFetch<TaxRuleDefinition[]>('/tax/rules', { auth: false })
  },
}

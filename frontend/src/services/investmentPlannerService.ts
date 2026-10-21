/**
 * Frontend API Service for AI Personal Investment Planner & Portfolio Optimizer
 */

import { apiFetch } from './api'
import type {
  InvestmentPlanResponse,
  PlannerProfileInput,
  PlanSimulateRequest,
  PlanSimulateResponse,
} from '@/types/investmentPlanner'

export const investmentPlannerService = {
  /**
   * Generate personalized investment plan
   */
  async generatePlan(profile: PlannerProfileInput): Promise<InvestmentPlanResponse> {
    return apiFetch<InvestmentPlanResponse>('/api/v1/investment-planner/generate', {
      method: 'POST',
      body: JSON.stringify(profile),
    })
  },

  /**
   * Run What-If simulation
   */
  async simulateScenario(request: PlanSimulateRequest): Promise<PlanSimulateResponse> {
    return apiFetch<PlanSimulateResponse>('/api/v1/investment-planner/simulate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  /**
   * Get plan history
   */
  async getHistory(): Promise<Array<{
    plan_id: string
    plan_name: string
    status: string
    created_at: string
    goal: string
    capital: number
    horizon_years: number
    expected_return_pct: number
    final_base_value: number
  }>> {
    return apiFetch('/api/v1/investment-planner/history')
  },

  /**
   * Get plan by ID
   */
  async getPlanById(planId: string): Promise<InvestmentPlanResponse> {
    return apiFetch<InvestmentPlanResponse>(`/api/v1/investment-planner/${planId}`)
  },
}

export const generateInvestmentPlan = investmentPlannerService.generatePlan
export const simulateInvestmentPlan = investmentPlannerService.simulateScenario
export const getInvestmentPlanHistory = investmentPlannerService.getHistory
export const getInvestmentPlanById = investmentPlannerService.getPlanById

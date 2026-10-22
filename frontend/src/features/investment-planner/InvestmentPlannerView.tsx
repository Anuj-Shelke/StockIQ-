import React, { useState, useEffect } from 'react'
import {
  Compass,
  PieChart as PieIcon,
  TrendingUp,
  Brain,
  Landmark,
  ShieldAlert,
  Sliders,
  History,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import type {
  InvestmentPlanResponse,
  PlannerProfileInput,
} from '../../types/investmentPlanner'
import {
  generateInvestmentPlan,
  getInvestmentPlanHistory,
  getInvestmentPlanById,
} from '../../services/investmentPlannerService'
import { InvestmentProfileForm } from './InvestmentProfileForm'
import { SuitabilitySummaryCard } from './SuitabilitySummaryCard'
import { AssetAllocationDashboard } from './AssetAllocationDashboard'
import { WealthProjectionSection } from './WealthProjectionSection'
import { PortfolioRiskSection } from './PortfolioRiskSection'
import { StockAllocationSection } from './StockAllocationSection'
import { FixedDepositSection } from './FixedDepositSection'
import { GoldAnalysisSection } from './GoldAnalysisSection'
import { TaxIntegrationCard } from './TaxIntegrationCard'
import { GoalTimelinePlanner } from './GoalTimelinePlanner'
import { WhatIfSimulator } from './WhatIfSimulator'
import { PortfolioComparisonSection } from './PortfolioComparisonSection'
import { ExplainabilityDrawer } from './ExplainabilityDrawer'
import { formatINR } from './plannerUtils'

type TabType =
  | 'overview'
  | 'stocks'
  | 'fd_gold'
  | 'projections'
  | 'risk_explain'
  | 'simulator'

export const InvestmentPlannerView: React.FC = () => {
  const [activePlan, setActivePlan] = useState<InvestmentPlanResponse | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyList, setHistoryList] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch plan history on mount to load the latest plan if available
  useEffect(() => {
    loadHistory(true)
  }, [])

  const loadHistory = async (autoLoadLatest = false) => {
    try {
      setHistoryLoading(true)
      const list = await getInvestmentPlanHistory()
      setHistoryList(list || [])
      if (autoLoadLatest && list && list.length > 0 && !activePlan) {
        try {
          const latest = await getInvestmentPlanById(list[0].plan_id)
          if (latest) {
            setActivePlan(latest)
          }
        } catch {
          // If latest plan was deleted or not found, fall back smoothly
        }
      }
    } catch {
      // Silently fall back if empty history or error
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleFormSubmit = async (profile: PlannerProfileInput) => {
    setIsGenerating(true)
    setError(null)
    try {
      const plan = await generateInvestmentPlan(profile)
      setActivePlan(plan)
      setIsFormOpen(false)
      setActiveTab('overview')
      loadHistory(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to generate investment plan. Please verify inputs.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectHistoryPlan = async (planId: string) => {
    try {
      setHistoryLoading(true)
      const plan = await getInvestmentPlanById(planId)
      if (plan) {
        setActivePlan(plan)
        setIsHistoryOpen(false)
        setIsFormOpen(false)
        setActiveTab('overview')
      } else {
        setError('Selected investment plan was not found.')
      }
    } catch {
      setError('Failed to load selected plan.')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Calculate totals for sub-components with robust asset class matching
  const totalEquityAllocated = activePlan?.asset_allocation
    ?.filter(a => {
      const cls = (a.asset_class || '').toLowerCase()
      return cls.includes('stock') || cls.includes('equity')
    })
    ?.reduce((sum, a) => sum + a.allocated_amount, 0) || 0

  const totalFdAllocated = activePlan?.asset_allocation
    ?.filter(a => {
      const cls = (a.asset_class || '').toLowerCase()
      return cls.includes('deposit') || cls.includes('fd')
    })
    ?.reduce((sum, a) => sum + a.allocated_amount, 0) || 0

  const totalGoldAllocated = activePlan?.asset_allocation
    ?.filter(a => (a.asset_class || '').toLowerCase().includes('gold'))
    ?.reduce((sum, a) => sum + a.allocated_amount, 0) || 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
              <Compass className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                  AI Personal Investment Planner
                </h1>
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-0.5 text-2xs font-bold text-indigo-300">
                  StockIQ Optimizer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-asset optimization across Stocks, Gold, FDs, and Index Funds with SHAP explainability and Indian tax calculation
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              loadHistory(false)
              setIsHistoryOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <History className="h-4 w-4 text-indigo-400" />
            Saved Plans {historyList.length > 0 && `(${historyList.length})`}
          </button>

          <button
            type="button"
            onClick={() => setIsFormOpen(prev => !prev)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-purple-500 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            {isFormOpen ? 'Close Form' : 'New Plan Profile'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Profile Form (if toggled open or no plan exists yet) */}
      {(isFormOpen || !activePlan) && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <InvestmentProfileForm
            onSubmit={handleFormSubmit}
            loading={isGenerating}
            initialValues={activePlan?.profile_summary}
          />
        </div>
      )}

      {/* Active Plan Dashboard */}
      {activePlan && !isFormOpen && (
        <div className="space-y-6">
          {/* Active Plan Meta Ribbon */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">{activePlan.plan_name}</h3>
                <span className="text-2xs text-slate-400">
                  Target: {formatINR(activePlan.goal_timeline.target_amount)} in {activePlan.goal_timeline.target_years} Years • Investable Capital: {formatINR(activePlan.suitability.investable_capital_allocated)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xs text-slate-500">
                Created: {new Date(activePlan.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="text-2xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                Modify Financial Parameters
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <PieIcon className="h-4 w-4" />
              Allocation & Suitability
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stocks')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'stocks'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Brain className="h-4 w-4" />
              AI Stock Picks & SHAP ({activePlan.stock_allocations.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fd_gold')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'fd_gold'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Landmark className="h-4 w-4" />
              Fixed Deposits & Gold
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('projections')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'projections'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Projections & Timeline
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('risk_explain')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'risk_explain'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              Risk & Architecture
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sliders className="h-4 w-4" />
              What-If Simulator
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="space-y-6 animate-fadeIn">
            {activeTab === 'overview' && (
              <>
                <SuitabilitySummaryCard suitability={activePlan.suitability} />
                <AssetAllocationDashboard
                  allocations={activePlan.asset_allocation}
                  investableCapital={activePlan.suitability.investable_capital_allocated}
                />
                <TaxIntegrationCard tax={activePlan.tax_integration} />
              </>
            )}

            {activeTab === 'stocks' && (
              <StockAllocationSection
                stocks={activePlan.stock_allocations}
                totalEquityAmount={totalEquityAllocated}
              />
            )}

            {activeTab === 'fd_gold' && (
              <>
                <FixedDepositSection
                  fixedDeposits={activePlan.fixed_deposits}
                  totalFdAmount={totalFdAllocated}
                />
                <GoldAnalysisSection
                  goldOptions={activePlan.gold_analysis}
                  totalGoldAmount={totalGoldAllocated}
                />
              </>
            )}

            {activeTab === 'projections' && (
              <>
                <WealthProjectionSection projections={activePlan.wealth_projections} />
                <GoalTimelinePlanner goalTimeline={activePlan.goal_timeline} />
              </>
            )}

            {activeTab === 'risk_explain' && (
              <>
                <PortfolioRiskSection
                  risk={activePlan.risk_analysis}
                  suitability={activePlan.suitability}
                />
                <PortfolioComparisonSection portfolios={activePlan.alternative_portfolios} />
                <ExplainabilityDrawer insights={activePlan.explainability_insights} />
              </>
            )}

            {activeTab === 'simulator' && (
              <WhatIfSimulator initialPlan={activePlan} />
            )}
          </div>
        </div>
      )}

      {/* Saved Plans History Modal / Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">Saved Investment Plans</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading plan history...</div>
            ) : historyList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No saved plans found. Generate your first plan above!</div>
            ) : (
              <div className="space-y-3">
                {historyList.map(item => (
                  <div
                    key={item.plan_id}
                    onClick={() => handleSelectHistoryPlan(item.plan_id)}
                    className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-indigo-500/50 hover:bg-slate-950 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{item.plan_name}</span>
                        <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-2xs font-semibold text-indigo-400">
                          {item.goal}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Capital: {formatINR(item.capital)} • Horizon: {item.horizon_years} Yrs • Exp. Return: {item.expected_return_pct?.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xs text-slate-500 block">
                        {new Date(item.created_at).toLocaleDateString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 mt-1">
                        View Plan <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default InvestmentPlannerView

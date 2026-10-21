import { AlertTriangle, Info, Lock } from 'lucide-react'
import type { SuitabilityAssessment } from '@/types/investmentPlanner'
import { formatINR, getRiskColorClass } from './plannerUtils'

interface Props {
  suitability: SuitabilityAssessment
}

export function SuitabilitySummaryCard({ suitability }: Props) {
  return (
    <div className="space-y-4">
      {/* Emergency Fund Warning Alert Banner if Inadequate */}
      {!suitability.emergency_fund_adequate && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-200 flex items-start gap-3 backdrop-blur-md">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <p className="font-semibold text-amber-300">
              Prudent Safety Notice: Inadequate Emergency Cash Reserve
            </p>
            <p className="text-amber-200/90">
              Your existing emergency fund covers only {suitability.emergency_fund_months.toFixed(1)} months of expenses.
              StockIQ has automatically partitioned a <span className="font-semibold text-amber-300">Liquid Safety Reserve of {formatINR(suitability.suggested_liquid_reserve)}</span> to remain in ultra-safe cash/overnight instruments. The remaining {formatINR(suitability.investable_capital_allocated)} is deployed into the investment portfolio.
            </p>
          </div>
        </div>
      )}

      {/* Main Suitability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Capital vs Investable */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Total Capital Provided</p>
          <p className="text-xl font-bold text-slate-100 mt-1">{formatINR(suitability.total_capital_provided)}</p>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Investable Portfolio:</span>
            <span className="font-semibold text-indigo-400">{formatINR(suitability.investable_capital_allocated)}</span>
          </div>
          {suitability.suggested_liquid_reserve > 0 && (
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-amber-400/90 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Liquid Reserve:
              </span>
              <span className="font-medium text-amber-300">{formatINR(suitability.suggested_liquid_reserve)}</span>
            </div>
          )}
        </div>

        {/* Risk Capacity Score */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Financial Risk Capacity</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRiskColorClass(suitability.risk_capacity_level)}`}>
              {suitability.risk_capacity_level}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-slate-100">{suitability.risk_capacity_score.toFixed(0)}</p>
            <span className="text-xs text-slate-500">/ 100 capacity index</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between">
            <span>Reported Tolerance:</span>
            <span className="text-slate-200 font-medium">{suitability.risk_tolerance}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400 flex justify-between">
            <span>Composite Stance:</span>
            <span className="text-indigo-300 font-semibold">{suitability.composite_risk_rating}</span>
          </div>
        </div>

        {/* Cash Flow Surplus & DTI */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Monthly Cash Flow Surplus</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatINR(suitability.monthly_surplus)}</p>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs flex justify-between">
            <span className="text-slate-400">Debt-to-Income (DTI):</span>
            <span className={`font-semibold ${suitability.debt_to_income_ratio > 35 ? 'text-rose-400' : 'text-slate-200'}`}>
              {suitability.debt_to_income_ratio.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 text-xs flex justify-between">
            <span className="text-slate-400">Emergency Coverage:</span>
            <span className={`font-semibold ${suitability.emergency_fund_months < 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {suitability.emergency_fund_months.toFixed(1)} months
            </span>
          </div>
        </div>

        {/* Goal Feasibility Status */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Goal Feasibility</p>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/60 border border-indigo-700/50 text-indigo-300">
              {suitability.goal_feasibility_status}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-slate-100">{suitability.goal_feasibility_score.toFixed(0)}</p>
            <span className="text-xs text-slate-500">/ 100 feasibility score</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <span>Horizon: </span>
            <span className="text-slate-200 font-medium">{suitability.suggested_investment_horizon_years.toFixed(1)} years</span>
          </div>
        </div>
      </div>

      {/* Suitability Narrative Box */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs leading-relaxed text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Suitability Assessment: </span>
          {suitability.suitability_narrative}
        </div>
      </div>
    </div>
  )
}

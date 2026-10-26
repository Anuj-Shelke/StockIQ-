import { useState } from 'react'
import {
  Coins,
  Target,
  Sparkles,
} from 'lucide-react'
import type { PlannerProfileInput } from '@/types/investmentPlanner'

const DEFAULT_PROFILE: PlannerProfileInput = {
  age: 32,
  occupation: 'Salaried Professional',
  monthly_income: 120000,
  monthly_expenses: 50000,
  monthly_savings: 40000,
  emergency_fund: 300000,
  existing_investments: 500000,
  debt_obligations: 15000,
  financial_dependents: 1,
  current_investable_capital: 300000,
  primary_goal: 'Wealth Creation',
  target_amount: 2500000,
  target_years: 5,
  investment_horizon_category: 'Medium-Term (3-7 Years)',
  risk_tolerance: 'Moderate',
  required_liquidity: 'Moderate',
  max_acceptable_loss_pct: 12.0,
  investment_style: 'HYBRID',
  monthly_sip_amount: 15000,
  preferred_asset_classes: ['Stocks', 'Fixed Deposits', 'Gold'],
  preferred_sectors: [],
  preferred_stocks: [],
}

interface Props {
  initialValues?: PlannerProfileInput
  onSubmit: (profile: PlannerProfileInput) => void
  loading?: boolean
}

export function InvestmentProfileForm({ initialValues, onSubmit, loading }: Props) {
  const [form, setForm] = useState<PlannerProfileInput>(initialValues || DEFAULT_PROFILE)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof PlannerProfileInput, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleAssetClassToggle = (asset: string) => {
    const current = form.preferred_asset_classes || []
    if (current.includes(asset)) {
      if (current.length > 1) {
        handleChange('preferred_asset_classes', current.filter(a => a !== asset))
      }
    } else {
      handleChange('preferred_asset_classes', [...current, asset])
    }
  }

  const applyPreset = (preset: 'balanced' | 'conservative' | 'aggressive') => {
    if (preset === 'balanced') {
      setForm({
        age: 32,
        occupation: 'Software Engineer',
        monthly_income: 120000,
        monthly_expenses: 45000,
        monthly_savings: 40000,
        emergency_fund: 250000,
        existing_investments: 600000,
        debt_obligations: 15000,
        financial_dependents: 1,
        current_investable_capital: 500000,
        primary_goal: 'Wealth Creation',
        target_amount: 1200000,
        target_years: 5,
        investment_horizon_category: '3-5 years',
        risk_tolerance: 'Moderate',
        required_liquidity: 'Moderate',
        max_acceptable_loss_pct: 15,
        investment_style: 'HYBRID',
        monthly_sip_amount: 10000,
        preferred_asset_classes: ['Stocks', 'Fixed Deposits', 'Gold'],
        preferred_sectors: [],
        preferred_stocks: [],
      })
    } else if (preset === 'conservative') {
      setForm({
        age: 55,
        occupation: 'Senior Executive',
        monthly_income: 180000,
        monthly_expenses: 75000,
        monthly_savings: 50000,
        emergency_fund: 500000,
        existing_investments: 2500000,
        debt_obligations: 0,
        financial_dependents: 1,
        current_investable_capital: 2500000,
        primary_goal: 'Capital Preservation',
        target_amount: 3500000,
        target_years: 5,
        investment_horizon_category: '3-5 years',
        risk_tolerance: 'Low',
        required_liquidity: 'High',
        max_acceptable_loss_pct: 8,
        investment_style: 'LUMP_SUM',
        monthly_sip_amount: 5000,
        preferred_asset_classes: ['Fixed Deposits', 'Gold', 'Stocks'],
        preferred_sectors: ['Utilities & Energy', 'FMCG', 'Pharmaceuticals'],
        preferred_stocks: ['POWERGRID.NS', 'NESTLEIND.NS', 'CIPLA.NS'],
      })
    } else {
      setForm({
        age: 26,
        occupation: 'Software Engineer',
        monthly_income: 90000,
        monthly_expenses: 32000,
        monthly_savings: 40000,
        emergency_fund: 200000,
        existing_investments: 200000,
        debt_obligations: 0,
        financial_dependents: 0,
        current_investable_capital: 300000,
        primary_goal: 'Long-term Financial Independence',
        target_amount: 2500000,
        target_years: 8,
        investment_horizon_category: '5-10 years',
        risk_tolerance: 'High',
        required_liquidity: 'Low',
        max_acceptable_loss_pct: 25,
        investment_style: 'SIP',
        monthly_sip_amount: 20000,
        preferred_asset_classes: ['Stocks', 'Gold'],
        preferred_sectors: ['Defense & Aerospace', 'Automotive & EV', 'Information Technology'],
        preferred_stocks: ['BEL.NS', 'TATAMOTORS.NS', 'ICICIBANK.NS'],
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (form.age < 18 || form.age > 100) newErrors.age = 'Age must be between 18 and 100.'
    if (form.current_investable_capital <= 0) newErrors.current_investable_capital = 'Investable capital must be greater than ₹0.'
    if (form.target_years <= 0) newErrors.target_years = 'Timeline must be at least 1 year.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(form)
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-8">
      {/* Preset Profiles Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Quick Financial Presets
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Load an illustrative investor profile or customize your exact numbers below.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('balanced')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              Balanced ₹5L (Age 32)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('conservative')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              Conservative ₹7.5L (Age 48)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('aggressive')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              Growth ₹4L (Age 26)
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Personal & Financial Profile */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">1. Financial Snapshot & Cash Flow</h2>
            <p className="text-xs text-slate-400">Used to compute your true risk capacity, debt burden, and required liquid safety buffer.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Age */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Age</label>
            <input
              type="number"
              value={form.age}
              onChange={e => handleChange('age', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              min={18}
              max={100}
            />
            {errors.age && <p className="text-xs text-rose-400 mt-1">{errors.age}</p>}
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Occupation / Employment</label>
            <input
              type="text"
              value={form.occupation}
              onChange={e => handleChange('occupation', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Monthly Income */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Monthly Income (Post-Tax)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">₹</span>
              <input
                type="number"
                value={form.monthly_income}
                onChange={e => handleChange('monthly_income', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                min={0}
                step="any"
              />
            </div>
          </div>

          {/* Monthly Expenses */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Monthly Living Expenses</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">₹</span>
              <input
                type="number"
                value={form.monthly_expenses}
                onChange={e => handleChange('monthly_expenses', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                min={0}
                step="any"
              />
            </div>
          </div>

          {/* Debt & EMI Obligations */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Monthly Debt / EMI Obligations</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">₹</span>
              <input
                type="number"
                value={form.debt_obligations}
                onChange={e => handleChange('debt_obligations', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                min={0}
                step="any"
              />
            </div>
          </div>

          {/* Existing Emergency Fund */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Existing Emergency Fund</span>
              <span className="text-[10px] text-slate-500">Liquid Savings</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">₹</span>
              <input
                type="number"
                value={form.emergency_fund}
                onChange={e => handleChange('emergency_fund', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                min={0}
                step="any"
              />
            </div>
          </div>

          {/* Financial Dependents */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Financial Dependents</label>
            <input
              type="number"
              value={form.financial_dependents}
              onChange={e => handleChange('financial_dependents', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              min={0}
              max={15}
            />
          </div>

          {/* Existing Investments */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Portfolio Value (Existing)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">₹</span>
              <input
                type="number"
                value={form.existing_investments}
                onChange={e => handleChange('existing_investments', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                min={0}
                step="any"
              />
            </div>
          </div>

          {/* Current Investable Capital (Lump Sum) */}
          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-3">
            <label className="block text-xs font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-indigo-400" />
              Available Capital to Invest
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-indigo-400 text-sm font-semibold">₹</span>
              <input
                type="number"
                value={form.current_investable_capital}
                onChange={e => handleChange('current_investable_capital', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-indigo-500/40 rounded-lg pl-8 pr-3.5 py-2 text-sm font-semibold text-indigo-200 focus:outline-none focus:border-indigo-400 transition"
                min={0}
                step="any"
              />
            </div>
            {errors.current_investable_capital && (
              <p className="text-xs text-rose-400 mt-1">{errors.current_investable_capital}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Goals, Horizon & Risk Preferences */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">2. Investment Goals & Risk Stance</h2>
            <p className="text-xs text-slate-400">Defines your return expectations, investment style, and loss boundaries.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Primary Goal */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Financial Goal</label>
            <select
              value={form.primary_goal}
              onChange={e => handleChange('primary_goal', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="Wealth Creation">Wealth Creation</option>
              <option value="Capital Preservation">Capital Preservation</option>
              <option value="Retirement Planning">Retirement Planning</option>
              <option value="Education Planning">Education Planning</option>
              <option value="House Purchase">House Purchase</option>
              <option value="Regular Income">Regular Income</option>
              <option value="Long-term Financial Independence">Long-term Financial Independence</option>
            </select>
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Corpus Amount (Optional)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">₹</span>
              <input
                type="number"
                value={form.target_amount || ''}
                placeholder="e.g. 15,00,000"
                onChange={e => handleChange('target_amount', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                min={0}
                step="any"
              />
            </div>
          </div>

          {/* Target Years */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Timeline (Years)</label>
            <input
              type="number"
              value={form.target_years}
              onChange={e => handleChange('target_years', parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              min={1}
              max={50}
              step="any"
            />
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Psychological Risk Tolerance</label>
            <select
              value={form.risk_tolerance}
              onChange={e => handleChange('risk_tolerance', e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="Very Low">Very Low (Preserve Capital at All Costs)</option>
              <option value="Low">Low (Modest Swings, Safety First)</option>
              <option value="Moderate">Moderate (Comfortable with Normal Market Volatility)</option>
              <option value="High">High (Seek Max Compounding, Can Absorb Drawdowns)</option>
            </select>
          </div>

          {/* Required Liquidity */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Liquidity Needs</label>
            <select
              value={form.required_liquidity}
              onChange={e => handleChange('required_liquidity', e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="High">High (May Need Withdrawals in &lt;1 Year)</option>
              <option value="Moderate">Moderate (Standard Liquidity, No Urgent Need)</option>
              <option value="Low">Low (Lock-In for Multi-Year Compounding)</option>
            </select>
          </div>

          {/* Max Acceptable Loss % */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Max Acceptable Drawdown (%)</span>
              <span className="text-amber-400 font-semibold">{form.max_acceptable_loss_pct}%</span>
            </label>
            <input
              type="range"
              min={5}
              max={35}
              step={1}
              value={form.max_acceptable_loss_pct}
              onChange={e => handleChange('max_acceptable_loss_pct', parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>5% (Conservative)</span>
              <span>15% (Balanced)</span>
              <span>35% (Aggressive)</span>
            </div>
          </div>

          {/* Investment Style */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Investment Style</label>
            <select
              value={form.investment_style}
              onChange={e => handleChange('investment_style', e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="LUMP_SUM">Lump Sum Only</option>
              <option value="SIP">Monthly SIP Only</option>
              <option value="HYBRID">Hybrid (Lump Sum + Monthly SIP)</option>
              <option value="STAGGERED">Staggered Deployment (STP)</option>
            </select>
          </div>

          {/* Monthly SIP Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Recurring Monthly SIP (Optional)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">₹</span>
              <input
                type="number"
                value={form.monthly_sip_amount}
                onChange={e => handleChange('monthly_sip_amount', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                min={0}
                step="any"
              />
            </div>
          </div>
        </div>

        {/* Asset Class Preference Checkboxes */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <label className="block text-xs font-medium text-slate-300 mb-2">Preferred Asset Classes to Include</label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'Stocks', label: 'Direct Stocks (Indian Equities)' },
              { id: 'Fixed Deposits', label: 'Bank Fixed Deposits (FDs)' },
              { id: 'Gold', label: 'Gold (Gold ETFs & Sovereign Bonds)' },
            ].map(asset => {
              const selected = (form.preferred_asset_classes || []).includes(asset.id)
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleAssetClassToggle(asset.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-2 ${
                    selected
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${selected ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                  {asset.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating AI Plan & Optimizing Portfolio...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              Generate Personalized Investment Plan
            </>
          )}
        </button>
      </div>
    </form>
  )
}

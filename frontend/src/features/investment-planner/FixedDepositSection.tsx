import React from 'react'
import {
  Landmark,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import type { FixedDepositOption } from '../../types/investmentPlanner'
import { formatINR } from './plannerUtils'

interface FixedDepositSectionProps {
  fixedDeposits: FixedDepositOption[]
  totalFdAmount: number
}

export const FixedDepositSection: React.FC<FixedDepositSectionProps> = ({
  fixedDeposits,
  totalFdAmount,
}) => {
  if (!fixedDeposits || fixedDeposits.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center backdrop-blur-md">
        <Landmark className="mx-auto h-10 w-10 text-slate-600 mb-3" />
        <h4 className="font-semibold text-slate-200">Zero Fixed Deposit Allocation</h4>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          Due to an aggressive or high-growth risk profile, capital is directed to higher-yielding market assets.
        </p>
      </div>
    )
  }

  const totalInterest = fixedDeposits.reduce((acc, fd) => acc + fd.total_interest_earned, 0)
  const totalMaturity = fixedDeposits.reduce((acc, fd) => acc + fd.maturity_amount, 0)

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">Guaranteed Return Fixed Deposit Ladder</h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-2xs font-semibold text-emerald-400">
                  <ShieldCheck className="h-3 w-3" /> DICGC Insured up to ₹5L
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Capital preservation allocation across scheduled commercial banks with quarterly compounding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-2xs text-slate-400 block">Total Principal</span>
              <span className="text-base font-bold text-slate-100">{formatINR(totalFdAmount)}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-2xs text-slate-400 block">Guaranteed Interest</span>
              <span className="text-base font-bold text-emerald-400">+{formatINR(totalInterest)}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-2xs text-slate-400 block">Maturity Corpus</span>
              <span className="text-base font-bold text-slate-100">{formatINR(totalMaturity)}</span>
            </div>
          </div>
        </div>

        {/* DICGC Protection Banner */}
        <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-200">
              <strong className="text-emerald-300">RBI Regulatory Safeguard:</strong> All listed institutions are insured by DICGC (Deposit Insurance and Credit Guarantee Corporation) for up to ₹5,00,000 per depositor per bank (principal + interest).
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-emerald-400 text-2xs whitespace-nowrap">
            <span>Interest Compounded Quarterly</span>
          </div>
        </div>

        {/* FD Cards / Table */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fixedDeposits.map((fd, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
            >
              <div>
                {/* Top: Institution name & type */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{fd.institution}</h4>
                    <span className="text-2xs text-slate-400">{fd.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-400">
                      {fd.interest_rate_pct.toFixed(2)}% p.a.
                    </span>
                  </div>
                </div>

                {/* Numbers */}
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Allocated Deposit:</span>
                    <span className="font-bold text-slate-200">{formatINR(fd.allocated_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Tenure:</span>
                    <span className="font-medium text-slate-300">{fd.tenure_months} Months ({Math.round(fd.tenure_months / 12)} Yrs)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Maturity Corpus:</span>
                    <span className="font-bold text-emerald-400">{formatINR(fd.maturity_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Guaranteed Interest:</span>
                    <span className="font-semibold text-emerald-300">+{formatINR(fd.total_interest_earned)}</span>
                  </div>
                </div>

                {/* Premature condition */}
                <div className="mt-4 rounded-lg bg-slate-900/60 p-2.5 border border-slate-800/60 text-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <AlertCircle className="h-3 w-3" />
                    <span>Premature Liquidity Terms:</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {fd.premature_withdrawal_condition}
                  </p>
                </div>
              </div>

              {/* Bottom footer badge */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-2xs text-slate-400">
                <span>{fd.compounding_method}</span>
                <span className="text-emerald-400 font-semibold">100% Capital Safe</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

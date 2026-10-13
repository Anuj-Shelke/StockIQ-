import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { RiskToleranceProfile } from '@/types/riskCheck'

interface RiskToleranceGaugeProps {
  profile: RiskToleranceProfile
}

export function RiskToleranceGauge({ profile }: RiskToleranceGaugeProps) {
  const gap = profile.historicalRealityScore - profile.statedScore
  const isDivergent = Math.abs(gap) >= 20

  return (
    <div className="rounded-xl border border-white/10 bg-ink-950/60 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            Stated Risk vs. Historical Reality
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compares declared risk appetite with empirical drawdown exposure.
          </p>
        </div>
        {isDivergent ? (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            Reality Gap Detected
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Aligned Exposure
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Stated Risk Appetite */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Stated Risk Tolerance</span>
            <span className="font-semibold text-white">{profile.statedLevel}</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
              style={{ width: `${profile.statedScore}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Score: {profile.statedScore}/100</span>
            <span>Questionnaire Output</span>
          </div>
        </div>

        {/* Historical Reality Under Stress */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Historical Reality Score</span>
            <span className="font-semibold text-gold-400">{profile.historicalRealityLevel}</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${
                profile.historicalRealityScore < 40
                  ? 'bg-rose-500'
                  : profile.historicalRealityScore < 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${profile.historicalRealityScore}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Score: {profile.historicalRealityScore}/100</span>
            <span>Historical Stress Tested</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.01] p-3 text-xs text-slate-300">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
        <p>{profile.gapDescription}</p>
      </div>
    </div>
  )
}

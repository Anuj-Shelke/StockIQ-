import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { RiskToleranceProfile } from '@/types/riskCheck'
import { Badge } from '@/components/ui/Badge'
import { GlossaryTooltip } from '@/components/ui/GlossaryTooltip'

interface RiskToleranceGaugeProps {
  profile: RiskToleranceProfile
}

export function RiskToleranceGauge({ profile }: RiskToleranceGaugeProps) {
  const gap = profile.historicalRealityScore - profile.statedScore
  const isDivergent = Math.abs(gap) >= 20

  return (
    <div className="card-surface p-6 sm:p-7 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Risk Lens: Stated Appetite vs. Historical Reality
            </h3>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5">
              Psychometric Alignment
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Compares declared risk preference against empirical simulated loss exposure.
          </p>
        </div>

        {isDivergent ? (
          <Badge variant="elevated">
            <AlertTriangle className="h-3.5 w-3.5" />
            Reality Gap Detected
          </Badge>
        ) : (
          <Badge variant="low">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Empirically Aligned
          </Badge>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Stated Risk Appetite */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)] text-[11px]">
              <GlossaryTooltip term="Stated Risk Appetite" glossaryKey="statedRiskAppetite">Stated Risk Appetite</GlossaryTooltip>
            </span>
            <span className="font-bold text-[var(--text-primary)]">{profile.statedLevel}</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--border-default)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-success)] via-[var(--blue-primary)] to-[var(--color-warning)]"
              style={{ width: `${profile.statedScore}%` }}
            />
          </div>
          <div className="mt-2.5 flex justify-between text-[11px] text-[var(--text-muted)] font-mono">
            <span>Score: {profile.statedScore}/100</span>
            <span>Self-Declared</span>
          </div>
        </div>

        {/* Historical Reality Under Stress */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)] text-[11px]">
              <GlossaryTooltip term="Simulated Stress Exposure" glossaryKey="simulatedStressExposure">Simulated Stress Exposure</GlossaryTooltip>
            </span>
            <span
              className={`font-bold ${
                profile.historicalRealityScore < 40
                  ? 'text-[var(--color-danger)]'
                  : profile.historicalRealityScore < 70
                  ? 'text-[var(--color-warning)]'
                  : 'text-[var(--color-success)]'
              }`}
            >
              {profile.historicalRealityLevel}
            </span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--border-default)]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                profile.historicalRealityScore < 40
                  ? 'bg-[var(--color-danger)]'
                  : profile.historicalRealityScore < 70
                  ? 'bg-[var(--color-warning)]'
                  : 'bg-[var(--color-success)]'
              }`}
              style={{ width: `${profile.historicalRealityScore}%` }}
            />
          </div>
          <div className="mt-2.5 flex justify-between text-[11px] text-[var(--text-muted)] font-mono">
            <span>Score: {profile.historicalRealityScore}/100</span>
            <span>Stress Tested</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--hairline-gold)] bg-[var(--gold-soft)] p-3.5 text-xs text-[var(--text-secondary)] leading-relaxed">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold-primary)]" />
        <p className="text-[var(--text-primary)]">
          <strong>Risk Officer Note:</strong> {profile.gapDescription}
        </p>
      </div>
    </div>
  )
}

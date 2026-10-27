import React from 'react'
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Lightbulb,
} from 'lucide-react'
import type { GoalTimelinePlan } from '../../types/investmentPlanner'
import { formatINR } from './plannerUtils'

interface GoalTimelinePlannerProps {
  goalTimeline: GoalTimelinePlan
}

export const GoalTimelinePlanner: React.FC<GoalTimelinePlannerProps> = ({ goalTimeline }) => {
  const isAchievable = goalTimeline.is_goal_achievable
  const hasShortfall = goalTimeline.surplus_or_shortfall < 0

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
              isAchievable
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <Target className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">{goalTimeline.goal_name} Timeline</h3>
                <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-semibold ${
                  isAchievable
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  {isAchievable ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {isAchievable ? 'Goal Feasible' : 'Corpus Shortfall'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Target: {formatINR(goalTimeline.target_amount)} across {goalTimeline.target_years} Years
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-2xs text-slate-400 block">Projected Corpus</span>
              <span className="text-base font-bold text-slate-100">
                {formatINR(goalTimeline.projected_corpus_at_horizon)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-2xs text-slate-400 block">
                {hasShortfall ? 'Deficit / Shortfall' : 'Projected Surplus'}
              </span>
              <span className={`text-base font-bold ${hasShortfall ? 'text-rose-400' : 'text-emerald-400'}`}>
                {hasShortfall ? '-' : '+'}{formatINR(Math.abs(goalTimeline.surplus_or_shortfall))}
              </span>
            </div>
          </div>
        </div>

        {/* Shortfall Remedial Callout */}
        {hasShortfall && goalTimeline.required_additional_monthly_sip > 0 && (
          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-secondary">
            <div className="flex items-center gap-3">
              <PlusCircle className="h-5 w-5 text-[var(--color-warning)] flex-shrink-0" />
              <span>
                <strong className="text-[var(--color-warning)]">Action to Bridge Deficit:</strong> Increase your monthly SIP contribution by{' '}
                <strong className="text-text-primary underline">{formatINR(goalTimeline.required_additional_monthly_sip)}/month</strong> to achieve 100% target goal corpus.
              </span>
            </div>
          </div>
        )}

        {/* Milestones Stepper / Timeline */}
        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Progress Milestones & Review Checkpoints
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {goalTimeline.milestones.map((m, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-slate-200">Year {m.year}</span>
                    <span className="text-2xs font-semibold text-indigo-400">
                      {m.percent_achieved.toFixed(0)}% of Target
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, m.percent_achieved)}%` }}
                    />
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-2xs">Projected:</span>
                      <span className="font-semibold text-slate-200">{formatINR(m.projected_corpus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-2xs">Target:</span>
                      <span className="font-medium text-slate-400">{formatINR(m.target_milestone)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 text-2xs text-slate-400">
                  <span className="text-slate-500 block">Checkpoint:</span>
                  <p className="mt-0.5 text-slate-300">{m.review_recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Remedial Actions Recommendations */}
        {goalTimeline.remedial_actions && goalTimeline.remedial_actions.length > 0 && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span>Recommended Strategic Adjustments:</span>
            </div>
            <ul className="space-y-1 text-slate-400 text-2xs">
              {goalTimeline.remedial_actions.map((act, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

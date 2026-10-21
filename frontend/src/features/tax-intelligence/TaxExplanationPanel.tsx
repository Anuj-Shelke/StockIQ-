import { useState } from 'react'
import {
  HelpCircle,
  TrendingUp,
  Percent,
  Calculator,
  AlertTriangle,
  Wallet,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react'
import type { ExplanationSections } from '@/types/tax'

interface TaxExplanationPanelProps {
  explanation: ExplanationSections
  assumptions?: string[]
  missingInformation?: string[]
  status?: string
}

export function TaxExplanationPanel({
  explanation,
  assumptions = [],
  missingInformation = [],
  status,
}: TaxExplanationPanelProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    why_taxable: true,
    how_calculated: true,
    what_next: true,
  })

  const toggle = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const sections = [
    {
      id: 'why_taxable',
      title: 'Why is this gain taxable under Indian law?',
      icon: HelpCircle,
      content: explanation.why_is_gain_taxable,
      color: 'text-blue-400',
    },
    {
      id: 'why_category',
      title: 'Why was this tax category selected?',
      icon: TrendingUp,
      content: explanation.why_category_selected,
      color: 'text-amber-400',
    },
    {
      id: 'why_rate',
      title: 'Why is this specific tax rate applicable?',
      icon: Percent,
      content: explanation.why_rate_applicable,
      color: 'text-emerald-400',
    },
    {
      id: 'how_calculated',
      title: 'How was the tax calculated step-by-step?',
      icon: Calculator,
      content: explanation.how_tax_calculated,
      color: 'text-purple-400',
    },
    {
      id: 'what_could_change',
      title: 'What factors could change this result?',
      icon: AlertTriangle,
      content: explanation.what_could_change_result,
      color: 'text-yellow-400',
    },
    {
      id: 'net_profit',
      title: 'What will be my net in-hand profit?',
      icon: Wallet,
      content: explanation.what_will_be_net_profit,
      color: 'text-cyan-400',
    },
    {
      id: 'what_next',
      title: 'What should I do next? (Actionable Steps)',
      icon: CalendarCheck,
      content: explanation.what_should_i_do_next,
      color: 'text-rose-400',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Status Alert if Provisional */}
      {status === 'PROVISIONAL' && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-300">Provisional Calculation Status</p>
            <p className="mt-1 text-amber-200/90">
              Some acquisition metadata (such as exact purchase date or cost basis) was not fully specified. STCG has been assumed conservatively. Update acquisition details for final statutory computation.
            </p>
          </div>
        </div>
      )}

      {/* Missing Information / Warnings */}
      {missingInformation.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs">
          <p className="font-semibold text-red-300">Missing Information Warnings:</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-red-200/80">
            {missingInformation.map((info, idx) => (
              <li key={idx}>{info}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable Explanation Accordion */}
      <div className="space-y-2.5">
        {sections.map(({ id, title, icon: Icon, content, color }) => {
          const isOpen = !!openItems[id]
          if (!content) return null

          return (
            <div
              key={id}
              className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-colors hover:border-[var(--border-default)]"
            >
              <button
                type="button"
                onClick={() => toggle(id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className={`p-1.5 rounded-lg bg-white/5 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-[var(--border-subtle)] bg-black/20 p-4 text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                  {content}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Assumptions List */}
      {assumptions.length > 0 && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-xs">
          <p className="font-semibold uppercase tracking-wider text-[var(--text-muted)] text-[10px]">
            Statutory & Computational Assumptions
          </p>
          <ul className="mt-2 space-y-1 text-[var(--text-secondary)]">
            {assumptions.map((asm, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[var(--gold-primary)] font-bold">•</span>
                <span>{asm}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

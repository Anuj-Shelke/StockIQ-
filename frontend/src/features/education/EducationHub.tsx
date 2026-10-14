import { ChatAssistant } from './ChatAssistant'
import { Calculators } from './Calculators'
import { GlossaryTooltip } from '@/components/ui/GlossaryTooltip'
import { BookOpen } from 'lucide-react'

export function EducationHub() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-display">
            Financial Education & Interactive Assistant
          </h1>
          <span className="badge-verified font-mono">
            RAG Grounded
          </span>
        </div>
        <p className="text-sm text-text-muted mt-0.5">
          Source-backed financial learning, quantitative calculators, and plain-language answers grounded in research.
        </p>
      </div>

      {/* Interactive Definition Banner */}
      <div className="card-surface p-4 flex items-center gap-3 text-xs text-text-secondary border-l-2 border-l-gold">
        <BookOpen className="h-5 w-5 text-gold shrink-0" />
        <p className="leading-relaxed">
          Hover over terms like{' '}
          <GlossaryTooltip
            term="CAGR (Compound Annual Growth Rate)"
            definition="The geometric annualized progression rate that provides a constant smoothed rate of return over multiple years."
          >
            CAGR
          </GlossaryTooltip>
          ,{' '}
          <GlossaryTooltip
            term="Max Drawdown"
            definition="The maximum peak-to-trough decline experienced by an asset or portfolio before a new high is formed."
          >
            Max Drawdown
          </GlossaryTooltip>
          , and{' '}
          <GlossaryTooltip
            term="LTCG Tax"
            definition="Long Term Capital Gains tax levied on listed equity shares held for greater than 12 months (taxed at 12.5% beyond the ₹1.25L exemption threshold)."
          >
            LTCG
          </GlossaryTooltip>{' '}
          to inspect their formal statutory and financial definitions.
        </p>
      </div>

      {/* Grid: Chatbot & Calculators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChatAssistant />
        <Calculators />
      </div>
    </div>
  )
}
export default EducationHub

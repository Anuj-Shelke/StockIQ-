import { useState } from 'react'
import { ChatAssistant } from './ChatAssistant'
import { Calculators } from './Calculators'
import { GlossaryTooltip } from '@/components/ui/GlossaryTooltip'
import { BookOpen, Bot, Calculator, Columns2 } from 'lucide-react'

export function EducationHub() {
  const [activeView, setActiveView] = useState<'both' | 'chat' | 'calc'>('both')

  return (
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            Source-backed financial learning, quantitative calculators, and plain-language answers grounded in SEBI research.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-xl border border-theme-subtle bg-surface-elevated p-1 text-xs self-start sm:self-auto font-mono">
          <button
            type="button"
            onClick={() => setActiveView('both')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeView === 'both' ? 'bg-gold text-canvas font-semibold shadow-xs' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span>Split View</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('chat')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeView === 'chat' ? 'bg-gold text-canvas font-semibold shadow-xs' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Expanded Chatbot</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('calc')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeView === 'calc' ? 'bg-gold text-canvas font-semibold shadow-xs' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Calculators</span>
          </button>
        </div>
      </div>

      {/* Interactive Definition Banner */}
      <div className="card-surface p-4 flex items-center gap-3 text-xs text-text-secondary border-l-2 border-l-gold">
        <BookOpen className="h-5 w-5 text-gold shrink-0" />
        <p className="leading-relaxed">
          Explore terms like{' '}
          <GlossaryTooltip
            term="CAGR (Compound Annual Growth Rate)"
            glossaryKey="cagr"
          >
            CAGR
          </GlossaryTooltip>
          ,{' '}
          <GlossaryTooltip
            term="Max Drawdown"
            glossaryKey="maxDrawdown"
          >
            Max Drawdown
          </GlossaryTooltip>
          , and{' '}
          <GlossaryTooltip
            term="LTCG Tax"
            glossaryKey="ltcgTax"
          >
            LTCG
          </GlossaryTooltip>{' '}
          to see verified regulatory and quantitative definitions.
        </p>
      </div>

      {/* View: Chatbot & Calculators */}
      {activeView === 'both' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChatAssistant />
          <Calculators />
        </div>
      )}

      {activeView === 'chat' && (
        <div className="w-full">
          <ChatAssistant />
        </div>
      )}

      {activeView === 'calc' && (
        <div className="w-full max-w-3xl mx-auto">
          <Calculators />
        </div>
      )}
    </div>
  )
}
export default EducationHub

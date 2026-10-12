import { useState } from 'react'
import { Send, Bot, User, Sparkles, HelpCircle } from 'lucide-react'
import { SourceBadge } from './SourceBadge'
import type { ChatMessage, SourceCitation } from '@/types/education'

const STARTER_PROMPTS = [
  'What is Max Drawdown and how does it protect investors?',
  'How does inflation affect Bank Fixed Deposits?',
  'Explain Beta vs Volatility in Indian Equities',
  'What is the difference between LTCG and STCG tax?',
]

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    content:
      'Hello! I am your **StockIQ Financial Education Assistant**. Ask me any question about portfolio construction, financial metrics, risk reality checks, or Indian market tax regulations.',
    timestamp: 'Just now',
    sources: [
      {
        id: 'src-sebi',
        title: 'SEBI Investor Education Guidelines',
        publisher: 'SEBI India',
        url: 'https://investor.sebi.gov.in',
      },
    ],
  },
]

export function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = (textToSend?: string) => {
    const question = textToSend || input
    if (!question.trim()) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: question.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setIsTyping(true)

    // Simulate RAG response with citations
    setTimeout(() => {
      let reply = ''
      let citations: SourceCitation[] = []

      if (question.toLowerCase().includes('drawdown')) {
        reply =
          '**Maximum Drawdown (MDD)** measures the largest observed loss from a historical peak to a subsequent trough before a new peak is attained.\n\n- It reveals the psychological *pain threshold* an investor must endure.\n- While CAGR shows what you made, Max Drawdown shows what you had to survive to get there.'
        citations = [
          {
            id: 'c1',
            title: 'Modern Portfolio Theory & Downside Risk Measures',
            publisher: 'CFA Institute Research',
          },
          {
            id: 'c2',
            title: 'NIFTY 50 Historical Crash Analysis (2000-2024)',
            publisher: 'NSE India Research',
            url: 'https://www.nseindia.com',
          },
        ]
      } else if (question.toLowerCase().includes('inflation') || question.toLowerCase().includes('fd')) {
        reply =
          '**Fixed Deposits** guarantee nominal capital safety, but they carry **Purchasing Power Risk**.\n\nIf your FD earns **7.1% p.a.** and CPI inflation is **6.0%**, your pre-tax real return is only ~1.1%. After 30% slab rate tax deduction, your real return can actually turn *negative*.'
        citations = [
          {
            id: 'c3',
            title: 'RBI Bulletin: Real Interest Rates & Household Savings',
            publisher: 'Reserve Bank of India',
            url: 'https://www.rbi.org.in',
          },
        ]
      } else {
        reply =
          `Here is an evidence-backed analysis regarding "${question}":\n\nIn Indian capital markets, maintaining disciplined asset allocation across equities, debt, and liquid instruments is key to mitigating systemic downturns. All metrics in StockIQ are evaluated under standardized mathematical definitions without emotional bias.`
        citations = [
          {
            id: 'c4',
            title: 'StockIQ Quantitative Knowledge Base',
            publisher: 'StockIQ Research',
          },
        ]
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: citations,
      }

      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)
    }, 700)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm flex flex-col h-[520px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-gold-400" />
          <h3 className="font-semibold text-white">AI Financial Education Assistant</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-gold-400" />
          <span>RAG-Backed Knowledge</span>
        </div>
      </div>

      {/* Suggested Starter Prompts */}
      <div className="py-2.5 flex flex-wrap gap-2 border-b border-white/5">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:border-gold-500/40 hover:text-white transition"
          >
            <HelpCircle className="h-3 w-3 text-gold-400/80" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
        {messages.map((msg) => {
          const isBot = msg.sender === 'assistant'
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
            >
              <div
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-semibold ${
                  isBot
                    ? 'border border-gold-500/30 bg-gold-500/10 text-gold-400'
                    : 'bg-white/10 text-slate-200'
                }`}
              >
                {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-xl rounded-xl p-3.5 text-xs leading-relaxed ${
                  isBot
                    ? 'border border-white/10 bg-ink-900/90 text-slate-200'
                    : 'bg-gold-500 text-ink-950 font-medium'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>

                {/* Citations Badges */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/10">
                    <p className="text-[10px] uppercase font-mono text-slate-400 mb-1.5">
                      Verified Sources:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s) => (
                        <SourceBadge key={s.id} source={s} />
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`mt-1.5 text-[10px] font-mono text-right ${
                    isBot ? 'text-slate-500' : 'text-ink-900/70'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Bot className="h-4 w-4 text-gold-400 animate-spin" />
            <span>Consulting financial knowledge base...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="pt-3 border-t border-white/10 flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask a question about financial concepts, CAGR, drawdowns..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-gold-500 focus:outline-none"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-ink-950 transition hover:bg-gold-400"
        >
          <Send className="h-3.5 w-3.5" />
          Ask
        </button>
      </form>
    </div>
  )
}

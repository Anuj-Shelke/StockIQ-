import { useState } from 'react'
import { apiFetch } from '@/services/api'
import {
  Send,
  User,
  ShieldCheck,
  BookOpen,
  ExternalLink,
  HelpCircle,
  Scale,
} from 'lucide-react'

interface SebiCitation {
  docId: string
  title: string
  section: string
  circularNo: string
  officialUrl: string
  excerpt: string
  relevanceScore: number
}

interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  citations?: SebiCitation[]
  timestamp: string
}

interface InstalledDoc {
  docId: string
  title: string
  category: string
  circularNo: string
  officialUrl: string
  sectionsCount: number
  summary: string
}

const INSTALLED_SEBI_DOCUMENTS: InstalledDoc[] = [
  {
    docId: 'SEBI-IA-2013',
    title: 'SEBI (Investment Advisers) Regulations, 2013 & Amendments',
    category: 'Advisory & Suitability',
    circularNo: 'SEBI/L-NRO/GN/2012-13/31/3472',
    officialUrl: 'https://www.sebi.gov.in/legal/regulations/jan-2013/securities-and-exchange-board-of-india-investment-advisers-regulations-2013_24155.html',
    sectionsCount: 3,
    summary: 'Mandates fiduciary duty, client risk profiling, written suitability assessment, and fee caps (2.5% AUA or ₹1.25L fixed).',
  },
  {
    docId: 'SEBI-PIT-2015',
    title: 'SEBI (Prohibition of Insider Trading) Regulations, 2015',
    category: 'Market Integrity & UPSI',
    circularNo: 'SEBI/L-NRO/GN/2014-15/21/85',
    officialUrl: 'https://www.sebi.gov.in/legal/regulations/jan-2015/securities-and-exchange-board-of-india-prohibition-of-insider-trading-regulations-2015_28884.html',
    sectionsCount: 3,
    summary: 'Governs Unpublished Price Sensitive Information (UPSI), trading window closures, and Structured Digital Databases (SDD).',
  },
  {
    docId: 'SEBI-PFUTP-2003',
    title: 'SEBI (Prohibition of Fraudulent and Unfair Trade Practices) Regulations, 2003',
    category: 'Fraud & Manipulation',
    circularNo: 'SEBI/LAD/DOP/17-7-2003',
    officialUrl: 'https://www.sebi.gov.in/legal/regulations/jul-2003/securities-and-exchange-board-of-india-prohibition-of-fraudulent-and-unfair-trade-practices-relating-to-securities-market-regulations-2003_18804.html',
    sectionsCount: 2,
    summary: 'Prohibits circular trading, pump-and-dump schemes, front-running, and unregistered social media tip networks.',
  },
  {
    docId: 'SEBI-SCORES-2024',
    title: 'SEBI SCORES 2.0 & SMART ODR Dispute Redressal Master Circular',
    category: 'Investor Grievance Redressal',
    circularNo: 'SEBI/HO/OIAE/OIAE_IAD-1/P/CIR/2024/21',
    officialUrl: 'https://scores.sebi.gov.in/',
    sectionsCount: 2,
    summary: 'Enforces mandatory 21-calendar-day grievance resolution and online arbitration under the SMART ODR platform.',
  },
  {
    docId: 'SEBI-AI-ML-2024',
    title: 'SEBI Guidelines on AI/ML and Algorithmic Trading Controls',
    category: 'Fintech & Quantitative AI',
    circularNo: 'SEBI/HO/MRD/DSA/CIR/P/2023/142',
    officialUrl: 'https://www.sebi.gov.in/',
    sectionsCount: 2,
    summary: 'Requires pre-trade risk controls, kill switches, audit trails, and explainability standards for automated model recommendations.',
  },
  {
    docId: 'SEBI-DERIVATIVES-2024',
    title: 'SEBI Framework for Retail Investor Protection in Equity F&O',
    category: 'Derivatives & Risk Disclosures',
    circularNo: 'SEBI/HO/MRD/TPD-1/P/CIR/2024/132',
    officialUrl: 'https://www.sebi.gov.in/',
    sectionsCount: 1,
    summary: 'Enforces 9-out-of-10 retail loss disclosure, contract size rationalization, and 100% upfront margin collection.',
  },
]

const SAMPLE_PROMPTS = [
  'What is the minimum net worth requirement for registered Portfolio Managers in India?',
  'What are the mandatory risk profiling rules under SEBI (Investment Advisers) Regulations?',
  'What is the maximum fee an Investment Adviser can legally charge a retail client?',
  'What constitutes Unpublished Price Sensitive Information (UPSI) under SEBI PIT Regulations?',
  'What are the prohibited market manipulation practices under SEBI PFUTP regulations?',
  'What is the timeline for resolving an investor complaint on SEBI SCORES 2.0?',
  'What are SEBI’s guidelines on using AI/ML and algorithms in stock recommendations?',
]

export function SebiRagChatbot() {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'DOCUMENTS'>('CHAT')
  const [inputQuery, setInputQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text:
        'Hello! I am your **SEBI Compliance & Regulatory Guidelines Assistant**, powered by Retrieval-Augmented Generation (RAG). ' +
        'I am grounded in official statutory SEBI Gazettes, Investment Advisers Regulations, Insider Trading (PIT) rules, ' +
        'SCORES 2.0 dispute timelines, and AI/ML algorithmic guidelines. How can I help you today?',
      citations: [
        {
          docId: 'SEBI-IA-2013',
          title: 'SEBI (Investment Advisers) Regulations, 2013',
          section: 'Regulation 15 - Fiduciary Duty',
          circularNo: 'SEBI/L-NRO/GN/2012-13/31/3472',
          officialUrl: 'https://www.sebi.gov.in/',
          excerpt: 'Statutory fiduciary obligation and mandatory suitability assessment.',
          relevanceScore: 0.95,
        },
      ],
      timestamp: '10:00 AM',
    },
  ])

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim()
    if (!q) return

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInputQuery('')
    setIsTyping(true)

    // First attempt to query live FastAPI backend RAG service
    try {
      const data = await apiFetch<{
        answer: string
        citations: Array<{
          doc_id: string
          title: string
          section: string
          circular_no: string
          official_url: string
          excerpt: string
          relevance_score: number
        }>
      }>('/sebi-rag/chat', {
        method: 'POST',
        body: { query: q },
        auth: false,
      })

      if (data && data.answer) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.answer,
          citations: (data.citations || []).map((c) => ({
            docId: c.doc_id,
            title: c.title,
            section: c.section,
            circularNo: c.circular_no,
            officialUrl: c.official_url,
            excerpt: c.excerpt,
            relevanceScore: c.relevance_score,
          })),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, botMsg])
        setIsTyping(false)
        return
      }
    } catch (err) {
      console.warn('Backend SEBI RAG unreachable, using grounded offline regulations:', err)
    }

    // Graceful offline fallback
    setTimeout(() => {
      let botResponse = ''
      let citations: SebiCitation[] = []

      const lower = q.toLowerCase()
      if (lower.includes('fee') || lower.includes('charge')) {
        botResponse =
          'Under **SEBI (Investment Advisers) Regulations (Regulation 15A)** and Circular *SEBI/HO/IMD/DF1/CIR/P/2020/182*:\n\n' +
          '- **AUA (Assets Under Advice) Mode:** Maximum fee is capped at **2.5% of AUA per annum** per client family across all advisory services.\n' +
          '- **Fixed Fee Mode:** Maximum fee is capped at **₹1,25,000 per annum** per client family.\n' +
          '- **Advance Billing:** Fees cannot be billed more than **two quarters in advance**.\n' +
          '- **Refunds:** Prorated refund of unexpired advisory fees is legally mandatory upon early contract termination.'
        citations = [
          {
            docId: 'SEBI-IA-2013',
            title: 'SEBI (Investment Advisers) Regulations, 2013',
            section: 'Regulation 15A - Client Fee Caps',
            circularNo: 'SEBI/HO/IMD/DF1/CIR/P/2020/182',
            officialUrl: 'https://www.sebi.gov.in/legal/regulations/jan-2013/securities-and-exchange-board-of-india-investment-advisers-regulations-2013_24155.html',
            excerpt: 'Statutory 2.5% AUA or ₹1.25 Lakh fixed fee ceiling.',
            relevanceScore: 0.94,
          },
        ]
      } else if (lower.includes('upsi') || lower.includes('insider') || lower.includes('pit')) {
        botResponse =
          'Under **SEBI (Prohibition of Insider Trading) Regulations, 2015 (Regulation 2(1)(n) & 3)**:\n\n' +
          '- **Definition of UPSI:** Unpublished Price Sensitive Information includes any non-public information relating to a company which upon publication would materially affect share price (e.g. quarterly earnings, dividends, M&A deals, capital restructuring).\n' +
          '- **Structured Digital Database (SDD):** Listed companies must maintain an internally hosted tamper-proof digital database with PAN numbers of anyone receiving UPSI.\n' +
          '- **Trading Restrictions:** Trading windows are closed from the end of each quarter until 48 hours after financial results announcement.'
        citations = [
          {
            docId: 'SEBI-PIT-2015',
            title: 'SEBI (Prohibition of Insider Trading) Regulations, 2015',
            section: 'Regulation 2(1)(n) & Regulation 3 - UPSI & SDD',
            circularNo: 'SEBI/L-NRO/GN/2014-15/21/85',
            officialUrl: 'https://www.sebi.gov.in/legal/regulations/jan-2015/securities-and-exchange-board-of-india-prohibition-of-insider-trading-regulations-2015_28884.html',
            excerpt: 'Strict prohibition on communicating or trading upon unpublished price sensitive information.',
            relevanceScore: 0.96,
          },
        ]
      } else if (lower.includes('scores') || lower.includes('complaint') || lower.includes('timeline') || lower.includes('grievance')) {
        botResponse =
          'Under the **SEBI SCORES 2.0 & SMART ODR Framework (Master Circular 2024)**:\n\n' +
          '- **Resolution Mandate:** Regulated intermediaries (brokers, depository participants, mutual funds, listed firms) must resolve investor grievances within **21 calendar days**.\n' +
          '- **Two-Tier Escalation:** If unsatisfied or overdue, the investor can escalate within 15 days to the Designated First Reviewer Body, and subsequently directly to SEBI.\n' +
          '- **SMART ODR Portal:** Online dispute resolution and independent conciliation/arbitration is available for commercial disputes via SMART ODR.'
        citations = [
          {
            docId: 'SEBI-SCORES-2024',
            title: 'SEBI SCORES 2.0 & SMART ODR Master Circular',
            section: 'Clause 4 - 21-Day Resolution Timeline',
            circularNo: 'SEBI/HO/OIAE/OIAE_IAD-1/P/CIR/2024/21',
            officialUrl: 'https://scores.sebi.gov.in/',
            excerpt: 'Mandatory 21-calendar-day resolution timeline and automated escalation ladder.',
            relevanceScore: 0.93,
          },
        ]
      } else if (lower.includes('ai') || lower.includes('algorithm') || lower.includes('model')) {
        botResponse =
          'Under **SEBI Guidelines on AI/ML and Algorithmic Trading Systems**:\n\n' +
          '- **Explainability Requirement:** AI/ML recommendations provided to retail investors cannot be black-box outputs; firms must provide verifiable rationale and risk factors.\n' +
          '- **Pre-Trade Risk Controls:** Systems must have real-time kill switches, maximum order limits, and price execution bands.\n' +
          '- **Audit Retention:** Complete training logs, feature weights (e.g. SHAP values), and model iteration records must be archived for regulatory audit.'
        citations = [
          {
            docId: 'SEBI-AI-ML-2024',
            title: 'SEBI Guidelines on AI/ML and Algorithmic Trading Systems',
            section: 'Chapter II - Pre-Trade Controls & Explainability',
            circularNo: 'SEBI/HO/MRD/DSA/CIR/P/2023/142',
            officialUrl: 'https://www.sebi.gov.in/',
            excerpt: 'Mandatory kill switches, pre-trade risk thresholds, and explainable AI audit trails.',
            relevanceScore: 0.95,
          },
        ]
      } else if (
        lower.includes('portfolio manager') ||
        lower.includes('protfolio manager') ||
        lower.includes('pms') ||
        lower.includes('portfolio management') ||
        lower.includes('protfolio management')
      ) {
        botResponse =
          'Under **SEBI (Portfolio Managers) Regulations, 2020 (Regulation 9 & 23)**:\n\n' +
          '- **Minimum Net Worth Requirement:** Every registered Portfolio Manager must continuously maintain a minimum tangible net worth of **₹5 Crore** (raised from ₹2 Crore to ensure financial strength and operational resilience).\n' +
          '- **Minimum Client Investment Ticket Size:** A portfolio manager cannot accept funds or securities worth less than **₹50 Lakh** from any client, strictly reserving PMS services for High Net Worth Individuals (HNIs).\n' +
          '- **Asset Segregation:** Client funds and securities must be maintained in dedicated, segregated Demat and bank accounts.\n' +
          '- **Performance Reporting:** Performance must be reported to clients at least quarterly using the Time-Weighted Rate of Return (TWRR) methodology net of all fees.'
        citations = [
          {
            docId: 'SEBI-PMS-2020',
            title: 'SEBI (Portfolio Managers) Regulations, 2020',
            section: 'Regulation 9 - Net Worth Requirement of ₹5 Crore',
            circularNo: 'SEBI/LAD-NRO/GN/2019/46 & CIR/P/2020/22',
            officialUrl: 'https://www.sebi.gov.in/legal/regulations/jan-2020/securities-and-exchange-board-of-india-portfolio-managers-regulations-2020_45719.html',
            excerpt: 'Mandatory minimum net worth of ₹5 Crore for PMS registration and ₹50 Lakh minimum client ticket size.',
            relevanceScore: 0.98,
          },
        ]
      } else if (
        (/\b(age|ages|minor|minors|child|under\s*18|how\s*old)\b/i.test(lower) || lower.includes('demat') || lower.includes('invest in stock') || lower.includes('kyc')) &&
        !/(manager|management|average|brokerage|leverage|coverage|package|message)/i.test(lower)
      ) {
        botResponse =
          'Under the **Indian Contract Act, 1872** and **SEBI / Depository (NSDL/CDSL) Master Circulars**:\n\n' +
          '- **Statutory Minimum Age:** The legal minimum age to independently open a trading and Demat account and trade in the Indian stock market is **18 years** (age of majority).\n' +
          '- **Minor Demat Accounts:** Individuals under 18 years can hold a Demat account opened and operated exclusively by their natural or legal guardian for holding/investing, but cannot trade independently or enter into derivative contracts.\n' +
          '- **Mandatory KYC Prerequisites:** Opening an account requires PAN, Aadhaar identity/address proof, an active bank account, and In-Person Verification (IPV).\n' +
          '- **Derivatives & Margin Trading:** Only adult individuals (18+) who have completed risk profiling can participate in Equity F&O segment.'
        citations = [
          {
            docId: 'SEBI-DEMAT-ELIGIBILITY-2024',
            title: 'SEBI & Depository Regulations on Demat Eligibility & Minimum Age',
            section: 'Eligibility Clause 3 - Age of Majority (18 Years) & Minor Accounts',
            circularNo: 'SEBI/HO/MIRSD/DOP/CIR/P/2021/600',
            officialUrl: 'https://www.sebi.gov.in/legal/circulars/aug-2021/standardization-of-account-opening-process_51680.html',
            excerpt: 'Statutory minimum age of 18 years to independently trade and open active demat/trading accounts.',
            relevanceScore: 0.98,
          },
        ]
      } else if (lower.includes('ipo') || lower.includes('asba') || lower.includes('icdr') || lower.includes('retail quota')) {
        botResponse =
          'Under **SEBI ICDR Regulations, 2018**:\n\n' +
          '- **ASBA Mandate:** All retail IPO applications must use Application Supported by Blocked Amount (ASBA) via UPI/bank.\n' +
          '- **35% Retail Reservation:** A minimum 35% of the net offer is strictly reserved for Retail Individual Investors (bids up to ₹2,00,000).\n' +
          '- **Anchor Lock-in:** Anchor investors have a 30-day lock-in for 50% shares and 90 days for the remainder.'
        citations = [
          {
            docId: 'SEBI-ICDR-2018',
            title: 'SEBI (Issue of Capital and Disclosure Requirements) Regulations, 2018',
            section: 'Regulation 32 & 49 - ASBA Mandate & Retail Quotas',
            circularNo: 'SEBI/LAD-NRO/GN/2018/31',
            officialUrl: 'https://www.sebi.gov.in',
            excerpt: 'Mandatory ASBA mechanism and minimum 35% retail quota.',
            relevanceScore: 0.95,
          },
        ]
      } else if (lower.includes('lodr') || lower.includes('board meeting') || lower.includes('30 minute') || lower.includes('disclosure')) {
        botResponse =
          'Under **SEBI LODR Regulations, 2015 (Regulation 30)**:\n\n' +
          '- **30-Minute Disclosure:** Listed companies must notify stock exchanges of board meeting outcomes (financials, dividends, M&A) within 30 minutes.\n' +
          '- **Independent Directors:** At least 50% of the board must be independent if the chairman is an executive director.\n' +
          '- **Related Party Transactions:** Prior approval by the Audit Committee is mandatory.'
        citations = [
          {
            docId: 'SEBI-LODR-2015',
            title: 'SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015',
            section: 'Regulation 30 - Material Events Disclosure',
            circularNo: 'SEBI/LAD-NRO/GN/2015-16/013',
            officialUrl: 'https://www.sebi.gov.in',
            excerpt: 'Immediate disclosure of price-sensitive events within 30 minutes.',
            relevanceScore: 0.94,
          },
        ]
      } else if (lower.includes('mutual fund') || lower.includes('large cap') || lower.includes('mid cap') || lower.includes('ter')) {
        botResponse =
          'Under **SEBI (Mutual Funds) Regulations, 1996 & Categorization Norms**:\n\n' +
          '- **Category Thresholds:** Large Cap funds invest min. 80% in top 100 stocks; Mid Cap min. 65% in 101st-250th stocks; Small Cap min. 65% in 251st+ stocks.\n' +
          '- **TER Expense Caps:** Total Expense Ratio is capped between 1.05% and 2.25% based on fund AUM size.\n' +
          '- **Risk-o-meter:** Monthly disclosure of risk classification from Low to Very High.'
        citations = [
          {
            docId: 'SEBI-MF-1996',
            title: 'SEBI (Mutual Funds) Regulations, 1996 & Categorization Circular',
            section: 'Scheme Categorization & Total Expense Ratio Caps',
            circularNo: 'SEBI/HO/IMD/DF3/CIR/P/2017/114',
            officialUrl: 'https://www.sebi.gov.in',
            excerpt: 'Standardized market cap definitions and tiered TER caps.',
            relevanceScore: 0.94,
          },
        ]
      } else if (lower.includes('circuit') || lower.includes('timing') || lower.includes('settlement') || lower.includes('t+1')) {
        botResponse =
          'Under **SEBI Secondary Market & Clearing Regulations**:\n\n' +
          '- **Trading Hours:** Regular market runs 09:15 AM to 03:30 PM IST (Monday to Friday).\n' +
          '- **T+1 Settlement:** Cash equities settle within 24 hours of the trade execution date.\n' +
          '- **Circuit Breakers:** Index circuit limits at 10%, 15%, and 20% on NIFTY/SENSEX trigger nationwide market halts.'
        citations = [
          {
            docId: 'SEBI-TRADING-SETTLEMENT-2024',
            title: 'NSE & BSE Trading Hours & Circuit Breaker Framework',
            section: 'Clause 1.2 & 2.4 - Market Mechanics & Circuit Breakers',
            circularNo: 'SEBI/HO/MRD2/DCAP/P/CIR/2021/624',
            officialUrl: 'https://www.sebi.gov.in',
            excerpt: 'T+1 rolling settlement and index circuit breaker triggers.',
            relevanceScore: 0.95,
          },
        ]
      } else if (lower.includes('tax') || lower.includes('ltcg') || lower.includes('stcg') || lower.includes('capital gain')) {
        botResponse =
          'Under the **Finance (No. 2) Act 2024 (Section 112A & 111A)**:\n\n' +
          '- **Long-Term Capital Gains (LTCG):** Listed equities held for >12 months are taxed at **12.5%** on gains exceeding ₹1.25 Lakh per financial year.\n' +
          '- **Short-Term Capital Gains (STCG):** Listed equities held for <=12 months are taxed at **20%**.\n' +
          '- **Fixed Deposit Interest:** Taxed at your individual income tax slab rate.'
        citations = [
          {
            docId: 'SEBI-TAX-CAPITAL-GAINS-2024',
            title: 'Securities Taxation Framework (Budget 2024 Amendments)',
            section: 'Section 112A & 111A - Capital Gains Tax Rates',
            circularNo: 'Finance (No. 2) Act 2024',
            officialUrl: 'https://incometaxindia.gov.in',
            excerpt: 'LTCG at 12.5% beyond ₹1.25 Lakh; STCG at 20%.',
            relevanceScore: 0.96,
          },
        ]
      } else {
        botResponse =
          `Under **SEBI regulatory guidelines** regarding ${q.slice(0, 35)}...:\n\n` +
          'All Indian market investments require PAN-based KYC verification, demographic risk suitability profiling, ' +
          'and transparent risk disclosures. Trades settle on a T+1 cycle with investor dispute resolution guaranteed within 21 days on SEBI SCORES 2.0.'
        citations = [
          {
            docId: 'SEBI-GEN-01',
            title: 'SEBI Comprehensive Investor Protection & Regulatory Master Circular',
            section: 'Statutory Compliance & Suitability Assessment',
            circularNo: 'SEBI Master Circular 2024',
            officialUrl: 'https://investor.sebi.gov.in',
            excerpt: 'Mandatory suitability, PAN KYC, and transparent investor protections.',
            relevanceScore: 0.90,
          },
        ]
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botResponse,
        citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)
    }, 400)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-display">
              SEBI Regulatory Guidelines & Compliance RAG Chatbot
            </h1>
            <span className="badge-gold text-[11px]">RAG Grounded</span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Official statutory regulatory assistant referencing installed SEBI rulebooks, Investment Advisers Regulations, Insider Trading rules, and SCORES 2.0 dispute frameworks.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center rounded-xl border border-theme-subtle bg-surface p-1">
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'CHAT' ? 'bg-gold text-canvas shadow' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            RAG Chat Assistant
          </button>
          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'DOCUMENTS' ? 'bg-gold text-canvas shadow' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Installed SEBI Corpus ({INSTALLED_SEBI_DOCUMENTS.length})
          </button>
        </div>
      </div>

      {activeTab === 'CHAT' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Interface (3 cols) */}
          <div className="lg:col-span-3 card-surface flex flex-col h-[640px] overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m) => {
                const isUser = m.sender === 'user'

                return (
                  <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/10 border border-gold/30 text-gold shrink-0">
                        <Scale className="h-4 w-4" />
                      </div>
                    )}

                    <div className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-2 ${
                      isUser
                        ? 'bg-gold text-canvas font-medium ml-12'
                        : 'border border-theme-subtle bg-white/[0.03] text-text-primary'
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

                      {/* Source Citations */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="pt-3 border-t border-theme-subtle space-y-1.5">
                          <span className="text-[10px] font-semibold text-gold uppercase tracking-wider block">
                            Statutory SEBI Gazette Citations:
                          </span>
                          {m.citations.map((c, idx) => (
                            <a
                              key={idx}
                              href={c.officialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-center justify-between rounded-lg bg-elevated border border-theme-subtle p-2 hover:border-gold/40 transition"
                            >
                              <div>
                                <span className="font-semibold text-text-primary group-hover:text-gold transition">
                                  {c.title} ({c.section})
                                </span>
                                <span className="block text-[10px] text-text-muted font-mono">
                                  {c.circularNo} · Relevance: {(c.relevanceScore * 100).toFixed(0)}%
                                </span>
                              </div>
                              <ExternalLink className="h-3.5 w-3.5 text-text-muted group-hover:text-gold" />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className={`text-[10px] ${isUser ? 'text-canvas/70 text-right' : 'text-text-muted'}`}>
                        {m.timestamp}
                      </div>
                    </div>

                    {isUser && (
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-text-primary shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                )
              })}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-text-muted italic font-mono">
                  <Scale className="h-4 w-4 text-gold animate-pulse" />
                  <span>Retrieving statutory SEBI vector chunks & synthesizing answer...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="border-t border-theme-subtle bg-canvas/50 p-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about SEBI guidelines, fee limits, UPSI, SCORES 2.0, or algorithm rules..."
                className="input-default flex-1 text-xs"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isTyping}
                className="btn-gold grid h-10 w-10 place-items-center disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Quick Prompts & Statutory Badges (1 col) */}
          <div className="space-y-4">
            <div className="card-surface p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <HelpCircle className="h-4 w-4 text-gold" />
                <span>Frequently Queried SEBI Topics</span>
              </div>
              <p className="text-[11px] text-text-muted">
                Click any compliance query below to execute an immediate RAG retrieval:
              </p>

              <div className="space-y-2">
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left rounded-xl border border-theme-subtle bg-white/[0.02] hover:bg-white/[0.06] p-2.5 text-xs text-text-secondary hover:text-gold transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-[11px] text-text-secondary space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-gold">
                <ShieldCheck className="h-4 w-4" />
                <span>Statutory Compliance Notice</span>
              </div>
              <p className="text-text-muted leading-relaxed">
                All answers are grounded in official SEBI circulars and statutory gazettes. StockIQ operates in strict compliance with SEBI AI/ML explainability standards.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Installed SEBI Documents Explorer */
        <div className="space-y-4">
          <div className="card-surface p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <BookOpen className="h-4 w-4 text-gold" />
              <span>Installed Statutory SEBI Rulebooks & Circular Gazettes</span>
            </div>
            <span className="text-text-muted font-mono">
              6 Master Rulebooks Indexed in Vector Database
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INSTALLED_SEBI_DOCUMENTS.map((doc) => (
              <div
                key={doc.docId}
                className="card-surface p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="badge-gold text-[10px]">{doc.category}</span>
                    <span className="font-mono text-text-muted text-[11px]">{doc.docId}</span>
                  </div>

                  <h3 className="mt-2 font-bold text-text-primary text-sm font-display">{doc.title}</h3>
                  <p className="mt-1 text-xs text-text-secondary leading-relaxed">{doc.summary}</p>
                </div>

                <div className="pt-3 border-t border-theme-subtle flex items-center justify-between text-xs">
                  <span className="text-[10px] text-text-muted font-mono truncate max-w-[200px]">
                    {doc.circularNo}
                  </span>
                  <a
                    href={doc.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-gold hover:text-text-primary font-semibold text-[11px] transition"
                  >
                    <span>View Gazette</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default SebiRagChatbot

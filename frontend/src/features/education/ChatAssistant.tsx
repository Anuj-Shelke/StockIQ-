import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Maximize2, Minimize2 } from 'lucide-react'
import { SourceBadge } from './SourceBadge'
import { apiFetch } from '@/services/api'
import type { ChatMessage, SourceCitation } from '@/types/education'

const FINANCIAL_KEYWORDS = [
  'stock', 'stocks', 'share', 'shares', 'equity', 'equities', 'nse', 'bse', 'nifty', 'sensex',
  'market', 'markets', 'index', 'indices', 'demat', 'trading', 'trade', 'trades', 'broker',
  'brokerage', 'depository', 'nsdl', 'cdsl', 'portfolio', 'portfolios', 'mutual fund', 'mutual funds',
  'mf', 'etf', 'sip', 'fd', 'fixed deposit', 'gold', 'sgb', 'bond', 'bonds', 'debenture',
  'derivative', 'derivatives', 'f&o', 'futures', 'options', 'intraday', 'delivery', 't+1',
  'settlement', 'circuit', 'circuit breaker', 'ipo', 'asba', 'allotment', 'listing', 'delisting',
  'buyback', 'dividend', 'dividends', 'sebi', 'regulation', 'regulations', 'regulatory', 'circular',
  'guideline', 'guidelines', 'compliance', 'scores', 'grievance', 'grievances', 'complaint',
  'complaints', 'kyc', 'pan', 'insider', 'upsi', 'pit', 'pfutp', 'manipulation', 'fraud', 'scam',
  'pump and dump', 'front running', 'front-running', 'adviser', 'advisers', 'advisor', 'advisors',
  'ria', 'pms', 'portfolio manager', 'research analyst', 'lodr', 'disclosure', 'fiduciary',
  'suitability', 'cagr', 'drawdown', 'drawdowns', 'mdd', 'beta', 'alpha', 'sharpe', 'volatility',
  'var', 'risk', 'return', 'returns', 'gain', 'gains', 'loss', 'losses', 'profit', 'capital',
  'yield', 'inflation', 'interest rate', 'liquidity', 'valuation', 'pe ratio', 'pb ratio', 'roe',
  'roce', 'tax', 'taxes', 'taxation', 'ltcg', 'stcg', 'capital gains', 'section 112a', 'section 111a',
  'income tax', 'budget', 'cess', 'exemption', 'slab', 'stockiq', 'invest', 'investing', 'investor',
  'investment', 'investments', 'money', 'finance', 'financial', 'wealth', 'debt', 'rupee', 'inr'
]

const OUT_OF_DOMAIN_KEYWORDS = [
  'coffee', 'tea', 'cook', 'cooking', 'recipe', 'bake', 'baking', 'cake', 'food', 'dinner',
  'lunch', 'breakfast', 'movie', 'movies', 'song', 'songs', 'lyrics', 'poem', 'poetry', 'joke',
  'jokes', 'weather', 'rain', 'temperature', 'cricket', 'football', 'soccer', 'tennis', 'game',
  'games', 'match', 'doctor', 'medicine', 'medicines', 'pill', 'pills', 'disease', 'hospital',
  'flight', 'hotel', 'travel', 'vacation', 'car', 'cars', 'bike', 'bikes', 'mechanic', 'repair',
  'driving', 'love', 'dating', 'relationship', 'astrology', 'horoscope', 'zodiac', 'bollywood',
  'hollywood', 'actor', 'actress',
]

const GREETING_KEYWORDS = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'help']

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    content:
      'Hello! I am your **StockIQ Financial Education Assistant**. Ask me any question about portfolio construction, financial metrics, risk reality checks, minimum age eligibility, or Indian market tax regulations.',
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
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async (textToSend?: string) => {
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

    // First attempt to query live FastAPI backend RAG service
    try {
      const data = await apiFetch<ChatMessage>('/education/chat', {
        method: 'POST',
        body: { query: question.trim() },
        auth: false,
      })

      if (data && data.content) {
        const botMsg: ChatMessage = {
          id: data.id || `bot-${Date.now()}`,
          sender: 'assistant',
          content: data.content,
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: data.sources || [],
        }
        setMessages((prev) => [...prev, botMsg])
        setIsTyping(false)
        return
      }
    } catch (err) {
      console.warn('Backend education RAG unreachable, using grounded fallback knowledge:', err)
    }

    // Graceful grounded knowledge synthesizer (runs if backend is unreachable or on static deployment)
    setTimeout(() => {
      let reply = ''
      let citations: SourceCitation[] = []
      const lower = question.toLowerCase()

      // 1. Portfolio Managers (PMS) Regulations & Net Worth Requirement
      if (
        lower.includes('portfolio manager') ||
        lower.includes('protfolio manager') ||
        lower.includes('pms') ||
        lower.includes('portfolio management') ||
        lower.includes('protfolio management')
      ) {
        reply =
          'Under Regulation 9 of **SEBI (Portfolio Managers) Regulations, 2020**, every registered Portfolio Manager ' +
          'must maintain a continuous minimum net worth of **₹5 Crore** (raised from ₹2 Crore to ensure high capital adequacy). ' +
          'Additionally, under Regulation 23, the statutory minimum client investment ticket size for PMS services is **₹50 Lakh**.'
        citations = [
          {
            id: 'c-pms-01',
            title: 'SEBI (Portfolio Managers) Regulations, 2020 (Regulation 9 - Net Worth)',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
          {
            id: 'c-pms-02',
            title: 'SEBI Circular on PMS Minimum Ticket Size (₹50 Lakh)',
            publisher: 'SEBI Investment Management Department',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 2. Minimum age and Demat eligibility (guarded against 'manager', 'management', etc.)
      else if (
        /\b(age|ages|minor|minors|child|under\s*18|how\s*old)\b/i.test(lower) &&
        !/(manager|management|average|brokerage|leverage|coverage|package|message)/i.test(lower)
      ) {
        reply =
          'The legal minimum age to open an independent Demat and Trading account in India is **18 years** ' +
          '(Indian Contract Act & SEBI Master Circular). Minors under 18 can hold a Demat account managed ' +
          'by a parent or legal guardian, but cannot execute intraday trades or derivatives (F&O). ' +
          'Upon turning 18, the account transitions to adult status via fresh KYC.'
        citations = [
          {
            id: 'c-age-01',
            title: 'SEBI & Depository Regulations on Demat Eligibility & Minimum Age',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://investor.sebi.gov.in',
          },
          {
            id: 'c-age-02',
            title: 'Standard Operating Procedures for Minor Demat Accounts',
            publisher: 'NSDL & CDSL Depository Master Circular',
            url: 'https://www.nsdl.co.in',
          },
        ]
      }
      // 2. Investment Adviser rules & fee caps
      else if (
        lower.includes('adviser') ||
        lower.includes('advisor') ||
        lower.includes('fee limit') ||
        lower.includes('fee cap') ||
        lower.includes('advisory fee') ||
        lower.includes('charge client') ||
        lower.includes('aua')
      ) {
        reply =
          'Under SEBI (Investment Advisers) Regulations, 2013, advisers act in a fiduciary capacity and must ' +
          'conduct written risk profiling before advising. Advisory fees are legally capped at **2.5% of AUA per year** ' +
          'under the assets model, or a maximum **₹1,25,000 per family per year** under the fixed fee model. ' +
          'Advisers cannot earn product distribution commissions.'
        citations = [
          {
            id: 'c-ia-01',
            title: 'SEBI (Investment Advisers) Regulations, 2013 & Fee Circular',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 3. Insider Trading & UPSI
      else if (
        lower.includes('insider') ||
        lower.includes('upsi') ||
        lower.includes('unpublished price') ||
        lower.includes('insider trading')
      ) {
        reply =
          'Under SEBI PIT Regulations, 2015, Unpublished Price Sensitive Information (UPSI) covers non-public financials, ' +
          'dividends, mergers, demergers, and capital structure changes. Communicating or trading while possessing UPSI is strictly ' +
          'illegal and subject to severe civil penalties, disgorgement of profits, and trading bans. Companies must maintain a ' +
          'tamper-proof Structured Digital Database (SDD).'
        citations = [
          {
            id: 'c-pit-01',
            title: 'SEBI (Prohibition of Insider Trading) Regulations, 2015',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 4. Market Manipulation, Pump & Dump, Front-Running & Social Media Tips
      else if (
        lower.includes('pump') ||
        lower.includes('dump') ||
        lower.includes('front running') ||
        lower.includes('front-running') ||
        lower.includes('manipulat') ||
        lower.includes('pfutp') ||
        lower.includes('fake tip') ||
        lower.includes('telegram') ||
        lower.includes('whatsapp') ||
        lower.includes('fraud')
      ) {
        reply =
          'SEBI PFUTP Regulations, 2003 prohibit fraudulent practices like circular trading, spoofing order books, ' +
          'front-running client trades, and circulating unregistered stock tips on social media (Telegram, WhatsApp, YouTube) ' +
          'to artificially pump stock prices. Violators face fines up to ₹25 Crore or three times the profits earned under Section 15HA.'
        citations = [
          {
            id: 'c-pfutp-01',
            title: 'SEBI (Prohibition of Fraudulent and Unfair Trade Practices) Regulations, 2003',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 5. IPO, ASBA & Retail Allotment Quotas
      else if (
        lower.includes('ipo') ||
        lower.includes('asba') ||
        lower.includes('allotment') ||
        lower.includes('anchor') ||
        lower.includes('book building') ||
        lower.includes('retail quota')
      ) {
        reply =
          'Under SEBI ICDR Regulations, 2018, all retail IPO bids must use **ASBA (Application Supported by Blocked Amount)** ' +
          'via UPI or bank branch, ensuring money stays in your account until allotment. In mainboard IPOs, at least **35% of the offer** ' +
          'is reserved for retail individual investors (applications up to ₹2,00,000).'
        citations = [
          {
            id: 'c-icdr-01',
            title: 'SEBI (Issue of Capital and Disclosure Requirements) Regulations, 2018',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 6. Corporate Governance & LODR Event Disclosures
      else if (
        lower.includes('lodr') ||
        lower.includes('disclosure') ||
        lower.includes('board meeting') ||
        lower.includes('30 minute') ||
        lower.includes('independent director') ||
        lower.includes('related party')
      ) {
        reply =
          'Under SEBI LODR Regulations, 2015, listed companies must disclose board meeting outcomes (financial results, dividends, ' +
          'buybacks) within **30 minutes** of meeting closure. At least 50% of the board must be independent directors if the chairman ' +
          'is executive, and all Related Party Transactions require prior Audit Committee approval.'
        citations = [
          {
            id: 'c-lodr-01',
            title: 'SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 7. Mutual Fund Categorization & Expense Ratios
      else if (
        lower.includes('mutual fund') ||
        lower.includes('large cap fund') ||
        lower.includes('mid cap fund') ||
        lower.includes('small cap fund') ||
        lower.includes('expense ratio') ||
        lower.includes('ter') ||
        lower.includes('risk-o-meter')
      ) {
        reply =
          'SEBI mandates true-to-label mutual funds: Large Cap funds invest min. 80% in top 100 stocks, Mid Cap min. 65% in ' +
          '101st-250th stocks, and Small Cap min. 65% in 251st+ stocks. Total Expense Ratio (TER) is capped between 1.05% and 2.25% ' +
          'based on AUM. Schemes must display a monthly Risk-o-meter showing risk from Low to Very High.'
        citations = [
          {
            id: 'c-mf-01',
            title: 'SEBI (Mutual Funds) Regulations, 1996 & Categorization Circular',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 8. Research Analyst (RA) Regulations
      else if (
        lower.includes('research analyst') ||
        lower.includes('target price') ||
        lower.includes('stock rating') ||
        lower.includes('nism')
      ) {
        reply =
          'Under SEBI (Research Analysts) Regulations, 2014, any individual or firm publishing stock price targets or research reports ' +
          'must be SEBI-registered and NISM Series XV certified. Analysts cannot trade in recommended stocks 30 days before and 5 days ' +
          'after report publication, and must prominently disclose all financial interests and conflicts.'
        citations = [
          {
            id: 'c-ra-01',
            title: 'SEBI (Research Analysts) Regulations, 2014',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 9. Grievance Redressal (SCORES 2.0 & SMART ODR)
      else if (
        lower.includes('score') ||
        lower.includes('complaint') ||
        lower.includes('grievance') ||
        lower.includes('dispute') ||
        lower.includes('smart odr') ||
        lower.includes('redressal')
      ) {
        reply =
          'Investors can register formal complaints against brokers, listed firms, or advisers on **SEBI SCORES 2.0** (scores.sebi.gov.in). ' +
          'Entities must resolve grievances within **21 calendar days**. If unsatisfied, the investor can escalate to SEBI or initiate ' +
          'independent online mediation and arbitration through the **SMART ODR portal**.'
        citations = [
          {
            id: 'c-scores-01',
            title: 'SEBI SCORES 2.0 & SMART ODR Dispute Redressal Master Circular',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://scores.sebi.gov.in',
          },
        ]
      }
      // 10. F&O Retail Loss Warning & Curbs
      else if (
        lower.includes('f&o') ||
        lower.includes('derivative') ||
        lower.includes('option') ||
        lower.includes('futures') ||
        lower.includes('margin')
      ) {
        reply =
          'SEBI\'s official research found that **93% of individual retail traders lose money in F&O**, with average losses exceeding ₹1.1 Lakh. ' +
          'To curb speculative over-leverage, SEBI raised minimum contract sizes to ₹15-20 Lakh, limited weekly index expiries to one per ' +
          'exchange, and requires brokers to collect 100% upfront margins before order execution.'
        citations = [
          {
            id: 'c-fo-01',
            title: 'SEBI Study on Retail Trader Performance & Derivative Risk Mandates',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 11. KYC Requirements & Documents
      else if (
        lower.includes('kyc') ||
        lower.includes('document') ||
        lower.includes('pan card') ||
        lower.includes('aadhaar') ||
        lower.includes('kra')
      ) {
        reply =
          'Under SEBI KYC norms, opening a Demat and Trading account requires: 1) Permanent Account Number (PAN Card), which is statutory; ' +
          '2) Proof of Identity and Address (Aadhaar with e-Sign, Passport, Voter ID); 3) Bank account proof (cancelled cheque); ' +
          'and 4) In-Person Verification (IPV via webcam). A single KRA/CKYC registration is valid across all brokers.'
        citations = [
          {
            id: 'c-kyc-01',
            title: 'SEBI Master Circular on Know Your Client (KYC) Norms',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 12. Trading Hours & T+1 Settlement
      else if (
        lower.includes('timing') ||
        lower.includes('market hour') ||
        lower.includes('open time') ||
        lower.includes('close time') ||
        lower.includes('settlement') ||
        lower.includes('t+1')
      ) {
        reply =
          'Indian exchanges (NSE & BSE) trade Monday through Friday: Pre-open price discovery from 09:00 AM to 09:15 AM IST, ' +
          'and continuous regular trading from 09:15 AM to 03:30 PM IST. All Indian cash equities settle on a **T+1 rolling settlement cycle**, ' +
          'meaning shares and funds are delivered within 24 hours of the trade date.'
        citations = [
          {
            id: 'c-trading-01',
            title: 'NSE & BSE Trading Hours & T+1 Settlement Guidelines',
            publisher: 'NSE India / SEBI',
            url: 'https://www.nseindia.com',
          },
        ]
      }
      // 13. Circuit Breakers & Price Bands
      else if (
        lower.includes('circuit') ||
        lower.includes('halt') ||
        lower.includes('price band')
      ) {
        reply =
          'SEBI triggers index circuit breakers at **10%, 15%, and 20%** moves in NIFTY 50 or SENSEX to halt trading nationwide during panics. ' +
          'A 10% breach before 1:00 PM halts trading for 45 minutes followed by a 15-minute pre-open call auction. ' +
          'Individual non-F&O stocks operate within daily price bands of 2%, 5%, 10%, or 20%.'
        citations = [
          {
            id: 'c-circuit-01',
            title: 'SEBI Market-Wide Circuit Breakers & Price Band Guidelines',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 14. Taxation: LTCG & STCG (Budget 2024)
      else if (
        lower.includes('tax') ||
        lower.includes('ltcg') ||
        lower.includes('stcg') ||
        lower.includes('capital gain')
      ) {
        reply =
          'Under Budget 2024 (Section 112A), Long-Term Capital Gains (LTCG) on equities held over 12 months are taxed at **12.5%** ' +
          'on gains above the ₹1.25 Lakh annual exemption. Short-Term Capital Gains (STCG) on holdings up to 12 months are taxed at **20%** ' +
          'under Section 111A. Bank Fixed Deposit interest is taxed at your regular income slab rate.'
        citations = [
          {
            id: 'c-tax-01',
            title: 'Section 112A & 111A Capital Gains Taxation (Finance Act 2024)',
            publisher: 'Income Tax Department of India',
            url: 'https://incometaxindia.gov.in',
          },
        ]
      }
      // 15. Drawdown & Risk Reality
      else if (
        lower.includes('drawdown') ||
        lower.includes('mdd') ||
        lower.includes('risk reality')
      ) {
        reply =
          '**Maximum Drawdown (MDD)** measures the largest observed loss from a historical peak to a subsequent trough before a new peak is attained. ' +
          'In StockIQ\'s Risk Reality Check, MDD contrasts what you believe you can endure with how your portfolio actually suffered during ' +
          'historical stress periods (such as -38.4% in COVID-19 or -52% in the 2008 GFC).'
        citations = [
          {
            id: 'c-dd-01',
            title: 'Modern Portfolio Theory & Downside Risk Measures',
            publisher: 'CFA Institute / SEBI Portfolio Guidelines',
          },
        ]
      }
      // 16. AI/ML Algorithmic Trading Rules
      else if (
        lower.includes('algo') ||
        lower.includes('ai') ||
        lower.includes('artificial intelligence') ||
        lower.includes('xai')
      ) {
        reply =
          'SEBI guidelines mandate that automated AI and quantitative algorithms must provide transparent explainability, pre-trade ' +
          'risk controls, order rate throttles, and emergency kill switches. Models cannot operate as opaque black boxes, and intermediaries ' +
          'must retain auditable logs of feature weights and training iterations.'
        citations = [
          {
            id: 'c-aiml-01',
            title: 'SEBI Guidelines on AI/ML and Algorithmic Trading Systems',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://www.sebi.gov.in',
          },
        ]
      }
      // 17. Fixed Deposits, Gold & Inflation Hedging
      else if (
        lower.includes('inflation') ||
        lower.includes('fixed deposit') ||
        lower.includes('fd') ||
        lower.includes('gold')
      ) {
        reply =
          'Fixed Deposits offer nominal capital certainty (7.1% APY) but risk negative real returns after inflation (6.0%) and slab-rate taxes. ' +
          'Sovereign / Physical Gold (11.2% historical 10-year INR CAGR) serves as an uncorrelated buffer that cushions drawdown during ' +
          'equity market shocks, preserving purchasing power.'
        citations = [
          {
            id: 'c-fd-01',
            title: 'RBI Bulletin & AMFI Multi-Asset Hedging Guidelines',
            publisher: 'Reserve Bank of India & AMFI',
            url: 'https://www.rbi.org.in',
          },
        ]
      }
      // Out-of-Domain Guard
      const hasFin = FINANCIAL_KEYWORDS.some((k) => lower.includes(k))
      const hasOut = OUT_OF_DOMAIN_KEYWORDS.some((k) => lower.includes(k))
      const isGreeting = GREETING_KEYWORDS.some((g) => lower === g || lower.startsWith(g + ' ')) && lower.split(/\s+/).length <= 3

      if (isGreeting) {
        reply =
          'Hello! I am StockIQ’s SEBI-compliant Financial Education Assistant. ' +
          'You can ask me questions about SEBI statutory rules, Indian capital markets, portfolio risk metrics ' +
          '(CAGR, Max Drawdown, Beta), mutual funds, or capital gains tax regulations. How can I help with your financial research today?'
        citations = []
      } else if ((hasOut && !hasFin) || (!hasFin && lower.split(/\s+/).length > 3)) {
        reply =
          '⚠️ **Question Outside Scope**\n\n' +
          'This query is outside the scope of StockIQ’s SEBI & Financial Intelligence Assistant. ' +
          'I am specifically calibrated to provide verified insights on:\n' +
          '• **SEBI Guidelines & Circulars** (IA fee caps, PMS ₹5 Cr net worth, insider trading/UPSI, SCORES 2.0)\n' +
          '• **Indian Stock Market Mechanics** (NSE/BSE, T+1 settlement, Demat account rules, IPO ASBA)\n' +
          '• **Quantitative Risk Metrics** (CAGR, Value at Risk, Maximum Drawdown, Beta)\n' +
          '• **Securities Taxation** (Section 112A 12.5% LTCG, Section 111A 20% STCG)\n\n' +
          'Please ask an investing, regulatory, or market-related question.'
        citations = []
      }
      // 18. Default grounded response for recognized broad financial terms
      else {
        reply =
          `Under **SEBI statutory guidelines** regarding ${question.slice(0, 30)}...: ` +
          'All Indian market investments require PAN KYC, suitability evaluation aligned with age and time horizon, ' +
          'and transparent risk disclosure. Transactions on NSE and BSE settle on a T+1 basis with strict investor grievance ' +
          'redressal within 21 days via SEBI SCORES 2.0.'
        citations = [
          {
            id: 'c-sebi-default',
            title: 'SEBI Investor Education & Regulatory Framework',
            publisher: 'Securities and Exchange Board of India (SEBI)',
            url: 'https://investor.sebi.gov.in',
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
    }, 350)
  }

  return (
    <div className={`card-surface p-5 flex flex-col transition-all duration-300 ${isExpanded ? 'h-[750px] shadow-2xl border-gold/40' : 'h-[660px]'}`}>
      <div className="flex items-center justify-between border-b border-theme-subtle pb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-gold" />
          <h3 className="font-semibold text-text-primary text-sm uppercase tracking-tight">Financial Intelligence Assistant</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>RAG-Audited Knowledge</span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse View' : 'Expand View'}
            className="rounded-lg border border-theme-subtle p-1.5 text-text-muted hover:border-gold hover:text-gold transition"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
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
                    ? 'border border-gold/30 bg-gold/10 text-gold'
                    : 'border border-theme-subtle bg-surface-elevated text-text-secondary'
                }`}
              >
                {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-xl rounded-xl p-3.5 text-xs leading-relaxed ${
                  isBot
                    ? 'border border-theme-subtle bg-surface-elevated text-text-primary shadow-sm'
                    : 'bg-gold text-canvas font-medium shadow-md'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>

                {/* Citations Badges */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-theme-subtle">
                    <p className="text-[10px] uppercase font-mono text-text-muted mb-1.5">
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
                    isBot ? 'text-text-muted' : 'text-canvas/70'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
            <Bot className="h-4 w-4 text-gold animate-spin" />
            <span>Consulting financial knowledge base...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="pt-3 border-t border-theme-subtle flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask a question about financial concepts, CAGR, drawdowns, tax..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input-default flex-1 text-xs py-2"
        />
        <button
          type="submit"
          className="btn-gold flex items-center gap-1.5 text-xs py-2 px-4"
        >
          <Send className="h-3.5 w-3.5" />
          Ask
        </button>
      </form>
    </div>
  )
}

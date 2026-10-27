"""Statutory SEBI Regulatory Documents and Rules Corpus for RAG Vector Indexing."""

from typing import Dict, List, Any

SEBI_REGULATORY_DOCUMENTS: List[Dict[str, Any]] = [
    {
        "doc_id": "SEBI-IA-2013",
        "title": "SEBI (Investment Advisers) Regulations, 2013 & Amendments",
        "category": "Investment Advisory & Suitability",
        "circular_no": "SEBI/L-NRO/GN/2012-13/31/3472",
        "effective_date": "2013-01-21",
        "official_url": "https://www.sebi.gov.in/legal/regulations/jan-2013/securities-and-exchange-board-of-india-investment-advisers-regulations-2013_24155.html",
        "sections": [
            {
                "section": "Regulation 15 - General Responsibility & Fiduciary Duty",
                "summary": "Investment Advisers (IAs) act in a fiduciary capacity towards clients, disclose all conflicts of interest, and maintain strict segregation between advisory and execution/distribution activities.",
                "text": (
                    "Under Regulation 15 of SEBI (Investment Advisers) Regulations, an Investment Adviser shall act in a fiduciary "
                    "capacity towards its clients and shall disclose all conflicts of interests as and when they arise. "
                    "An investment adviser shall not receive any consideration by way of remuneration or compensation or in any other "
                    "form, from any person other than the client being advised, in respect of the underlying products or securities. "
                    "There must be complete arm's-length segregation between advisory and execution or distribution services."
                ),
            },
            {
                "section": "Regulation 17 - Mandatory Risk Profiling & Suitability Assessment",
                "summary": "IAs must obtain complete demographic, financial, and risk capacity information before giving any advice.",
                "text": (
                    "Regulation 17 mandates that Investment Advisers shall ensure that advice is suitable to the client's risk profile. "
                    "The adviser must obtain adequate information regarding the client's age, investment horizon, other investments, "
                    "financial situation, and risk tolerance (Conservative, Moderate, Aggressive). "
                    "No advice can be rendered without documenting a written rationale justifying why the recommended security or "
                    "asset class aligns with the client's risk capacity and ability to absorb drawdowns."
                ),
            },
            {
                "section": "Regulation 15A - Fee Limits & Client Charging Guidelines",
                "summary": "SEBI capped advisory fees at a maximum of 2.5% of AUA per annum or ₹1,25,000 fixed fee per family.",
                "text": (
                    "Under SEBI Circular SEBI/HO/IMD/DF1/CIR/P/2020/182, fees charged by Investment Advisers under the Assets under "
                    "Advice (AUA) mechanism shall not exceed 2.5 percent of AUA per annum per client across all services. "
                    "Under the Fixed Fee mode, maximum fees charged shall not exceed ₹1,25,000 per annum per client family. "
                    "Fees cannot be charged more than two quarters in advance, and refund policies for premature termination are mandatory."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-PIT-2015",
        "title": "SEBI (Prohibition of Insider Trading) Regulations, 2015",
        "category": "Market Integrity & Insider Trading",
        "circular_no": "SEBI/L-NRO/GN/2014-15/21/85",
        "effective_date": "2015-05-15",
        "official_url": "https://www.sebi.gov.in/legal/regulations/jan-2015/securities-and-exchange-board-of-india-prohibition-of-insider-trading-regulations-2015_28884.html",
        "sections": [
            {
                "section": "Regulation 2(1)(n) - Definition of UPSI",
                "summary": "Unpublished Price Sensitive Information (UPSI) comprises non-public facts that materially affect share prices.",
                "text": (
                    "UPSI means any information, relating to a company or its securities, directly or indirectly, that is not generally "
                    "available which upon becoming generally available is likely to materially affect the price of the securities. "
                    "This explicitly includes financial results, dividends, changes in capital structure, mergers, de-mergers, "
                    "acquisitions, delisting, major expansion plans, and changes in key managerial personnel (KMP)."
                ),
            },
            {
                "section": "Regulation 3 & 4 - Prohibition on Communication and Trading while in Possession of UPSI",
                "summary": "No insider shall communicate or trade securities while possessing unpublished material information.",
                "text": (
                    "No insider shall communicate, provide, or allow access to any UPSI, relating to a company or securities listed "
                    "or proposed to be listed, to any person including other insiders except where such communication is in furtherance "
                    "of legitimate purposes, performance of duties or discharge of legal obligations. "
                    "Any person trading in securities while possessing UPSI is presumed to have traded motivated by that information, "
                    "attracting severe civil penalties and disgorgement under Section 15G of the SEBI Act."
                ),
            },
            {
                "section": "Regulation 3(5) - Structured Digital Database (SDD)",
                "summary": "Listed companies must maintain an internally hosted tamper-proof digital log of all UPSI sharing.",
                "text": (
                    "Boards of listed entities and market intermediaries must maintain a Structured Digital Database (SDD) containing "
                    "the nature of UPSI and the names of persons with whom information is shared, along with their Permanent Account Number "
                    "(PAN) or equivalent legal identifier. The database must have time-stamped audit trails and cannot be outsourced to third-party cloud servers."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-PFUTP-2003",
        "title": "SEBI (Prohibition of Fraudulent and Unfair Trade Practices) Regulations, 2003",
        "category": "Market Manipulation & Fraud Prevention",
        "circular_no": "SEBI/LAD/DOP/17-7-2003",
        "official_url": "https://www.sebi.gov.in/legal/regulations/jul-2003/securities-and-exchange-board-of-india-prohibition-of-fraudulent-and-unfair-trade-practices-relating-to-securities-market-regulations-2003_18804.html",
        "sections": [
            {
                "section": "Regulation 3 & 4 - Market Manipulation, Front-Running & Fake Tips",
                "summary": "Prohibits circular trading, pump-and-dump, spoofing, and distributing unregistered tips on messaging channels.",
                "text": (
                    "No person shall directly or indirectly employ any device, scheme or artifice to defraud, engage in any act, practice "
                    "or course of business which operates as a fraud or deceit upon any person in connection with the purchase or sale of securities. "
                    "Prohibited unfair practices explicitly include: circular trading creating artificial volume, front-running client orders, "
                    "spoofing limit order books, and disseminating misleading rumors or guaranteed price predictions on social media "
                    "(Telegram, WhatsApp, YouTube) to inflate prices before dumping stock."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-SCORES-2024",
        "title": "SEBI SCORES 2.0 & SMART ODR Dispute Redressal Master Circular",
        "category": "Investor Protection & Grievance Redressal",
        "circular_no": "SEBI/HO/OIAE/OIAE_IAD-1/P/CIR/2024/21",
        "official_url": "https://scores.sebi.gov.in/",
        "sections": [
            {
                "section": "SCORES 2.0 Timeline & SMART ODR Escalation Ladder",
                "summary": "Standardized 21-calendar-day resolution timeline and online arbitration under SMART ODR.",
                "text": (
                    "SEBI launched SCORES 2.0 (SEBI Complaints Redress System) with automated routing to designated entities. "
                    "Entities must resolve investor complaints within 21 calendar days of receipt. "
                    "If unsatisfied with the resolution or in case of delay, the complainant can escalate to the First Reviewer (Designated Body) "
                    "within 15 days, and subsequently to SEBI. For unresolvable commercial disputes, investors can initiate online mediation "
                    "and conciliation via the SMART ODR (Online Dispute Resolution) portal."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-AI-ML-2024",
        "title": "SEBI Guidelines on AI/ML and Algorithmic Trading Systems in Indian Securities",
        "category": "Fintech, AI Models & Algorithmic Controls",
        "circular_no": "SEBI/HO/MRD/DSA/CIR/P/2023/142",
        "official_url": "https://www.sebi.gov.in/legal/circulars/",
        "sections": [
            {
                "section": "Algorithmic Risk Management & AI Explainability Mandate",
                "summary": "SEBI requires testing, explainability, audit trails, and human-in-the-loop oversight for automated systems.",
                "text": (
                    "Entities deploying Artificial Intelligence (AI) and Machine Learning (ML) technologies for quantitative trading, "
                    "stock selection, or risk analytics must ensure rigorous pre-trade risk controls, including kill switches, price execution "
                    "bands, and maximum order value limits. Models must adhere to explainability standards, ensuring that retail recommendations "
                    "are not black-box obscurities, and retain audit logs of feature weights and training iterations for regulatory examination."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-DERIVATIVES-2024",
        "title": "SEBI Regulatory Framework for Retail Investor Protection in Equity F&O",
        "category": "Derivatives & Risk Disclosures",
        "circular_no": "SEBI/HO/MRD/TPD-1/P/CIR/2024/132",
        "official_url": "https://www.sebi.gov.in/",
        "sections": [
            {
                "section": "Retail F&O Risk Disclosures & Contract Size Rationalization",
                "summary": "SEBI mandates 9-out-of-10 retail loss disclosure, upfront margin collection, and increased minimum contract sizes.",
                "text": (
                    "Based on SEBI study indicating that 93% of individual retail traders incurred net losses in the equity derivatives (F&O) segment, "
                    "brokers are required to prominently display standardized risk disclosures prior to order placement. "
                    "SEBI increased minimum derivative contract values from ₹5 Lakh to ₹15-20 Lakh, restricted weekly index expiries to one per exchange, "
                    "and mandated 100% upfront margin collection including extreme loss margin (ELM) to curb speculative over-leverage."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-DEMAT-ELIGIBILITY-2024",
        "title": "SEBI & Depository Regulations on Demat Eligibility, Minimum Age & Minor Accounts",
        "category": "Account Opening, KYC & Eligibility",
        "circular_no": "SEBI/HO/MIRSD/DOP/CIR/P/2021/600",
        "effective_date": "2021-08-03",
        "official_url": "https://www.sebi.gov.in/legal/circulars/aug-2021/standardization-of-account-opening-process_51680.html",
        "sections": [
            {
                "section": "Eligibility Clause 3 - Age of Majority (18 Years) & Minor Accounts",
                "summary": "Minimum age to independently trade and open an active trading account in Indian stock markets is 18 years. Minors under 18 can only hold Demat accounts managed by a legal guardian.",
                "text": (
                    "Under the Indian Contract Act, 1872 and SEBI / Depository (NSDL/CDSL) master circulars, the statutory minimum age "
                    "to independently open a trading account and trade in the Indian stock market is 18 years (age of majority). "
                    "Minors (individuals under 18 years of age) are legally permitted to hold a Demat account opened on their behalf "
                    "and operated solely by their natural or court-appointed legal guardian for passive holding and gifting of shares. "
                    "However, minor accounts cannot execute speculative intraday trades or enter into Equity Derivatives (Futures & Options) "
                    "contracts. Upon reaching 18 years of age, the account is converted into a standard individual adult account following fresh KYC."
                ),
            },
            {
                "section": "Eligibility Clause 5 - Mandatory KYC Documentation for Demat Accounts",
                "summary": "Mandatory prerequisites for opening a Demat and trading account in India: PAN card, Aadhaar, bank proof, and In-Person Verification.",
                "text": (
                    "To open a Demat and Trading account in India under SEBI Know Your Client (KYC) regulations, an investor must provide: "
                    "1) Valid Permanent Account Number (PAN) linked with Aadhaar; 2) Proof of identity and address (Aadhaar, Passport, Voter ID); "
                    "3) Active Bank Account proof (cancelled cheque or bank statement with IFSC); 4) In-Person Verification (IPV) or video KYC. "
                    "No transactions can be executed in Indian secondary markets without an authenticated PAN-verified Demat and trading account."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-ICDR-2018",
        "title": "SEBI (Issue of Capital and Disclosure Requirements) Regulations, 2018",
        "category": "Primary Markets & IPO Guidelines",
        "circular_no": "SEBI/LAD-NRO/GN/2018/31",
        "official_url": "https://www.sebi.gov.in/legal/regulations/sep-2018/securities-and-exchange-board-of-india-issue-of-capital-and-disclosure-requirements-regulations-2018_40328.html",
        "sections": [
            {
                "section": "Regulation 32 & 49 - ASBA Mandate & Retail IPO Quotas",
                "summary": "Mandatory ASBA mechanism via UPI/bank, minimum 35% retail allocation quota, and anchor investor lock-ins.",
                "text": (
                    "Under SEBI ICDR regulations, all retail investors applying for Initial Public Offerings (IPOs) must use "
                    "Application Supported by Blocked Amount (ASBA) or UPI block mechanism, ensuring funds remain in the investor's bank "
                    "account until final share allotment. In mainboard book-built IPOs, a minimum of 35% of the net offer is strictly reserved "
                    "for Retail Individual Investors (maximum application value ₹2,00,000). Anchor investors are subject to a 30-day lock-in "
                    "for 50% of allocated shares and a 90-day lock-in for the remaining 50%."
                ),
            },
            {
                "section": "Regulation 38 - Minimum Public Shareholding (MPS) 25%",
                "summary": "Listed companies must maintain a continuous minimum public float of 25% to prevent price manipulation.",
                "text": (
                    "Every listed entity must maintain at least 25% public shareholding at all times. Companies listing with less than 25% "
                    "must achieve compliance within three years from listing date. Failure attracts trading freezes, promoter share freezing, "
                    "and penal proceedings to protect public liquidity."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-LODR-2015",
        "title": "SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015",
        "category": "Corporate Governance & Continuous Disclosures",
        "circular_no": "SEBI/LAD-NRO/GN/2015-16/013",
        "official_url": "https://www.sebi.gov.in/legal/regulations/sep-2015/securities-and-exchange-board-of-india-listing-obligations-and-disclosure-requirements-regulations-2015_30620.html",
        "sections": [
            {
                "section": "Regulation 30 - Material Events Disclosure within 30 Minutes",
                "summary": "Immediate disclosure of price-sensitive corporate events, earnings, dividends, acquisitions, and board outcomes.",
                "text": (
                    "Regulation 30 mandates listed entities to disclose all material events to stock exchanges immediately and no later than "
                    "30 minutes from closure of the board meeting for financial results, dividends, buybacks, or fund raising. "
                    "Unscheduled material developments such as fires, fraud, regulatory actions, or cyber breaches must be reported within 12 hours "
                    "to maintain complete transparency for market participants."
                ),
            },
            {
                "section": "Regulation 17 & 23 - Board Independence & Related Party Transactions (RPT)",
                "summary": "Mandatory 50% independent directors if chairman is executive, and prior audit committee approval for all RPTs.",
                "text": (
                    "The board of directors must comprise an optimum combination of executive and non-executive directors with at least one "
                    "independent woman director. If the chairperson is an executive director, at least half the board must be independent. "
                    "All Related Party Transactions (RPTs) require prior review and approval by the Audit Committee, and material RPTs require "
                    "prior approval by ordinary resolution of non-related public shareholders."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-MF-1996",
        "title": "SEBI (Mutual Funds) Regulations, 1996 & Scheme Categorization Standards",
        "category": "Mutual Funds & Asset Management Standards",
        "circular_no": "SEBI/HO/IMD/DF3/CIR/P/2017/114",
        "official_url": "https://www.sebi.gov.in/legal/circulars/oct-2017/categorization-and-rationalization-of-mutual-fund-schemes_36199.html",
        "sections": [
            {
                "section": "Categorization Circular - Large, Mid, Small Cap Definitions",
                "summary": "Strict market-cap definitions: Large Cap (Top 100 stocks), Mid Cap (101-250), Small Cap (251st onwards).",
                "text": (
                    "To ensure true-to-label investing, SEBI standardized equity mutual fund categories: "
                    "1) Large Cap Funds must invest minimum 80% in top 100 companies by full market capitalization; "
                    "2) Mid Cap Funds must invest minimum 65% in 101st to 250th companies; "
                    "3) Small Cap Funds must invest minimum 65% in 251st company onwards; "
                    "4) Flexi Cap Funds must maintain at least 65% across market caps without fixed allocation limits. "
                    "Every scheme must display a monthly Risk-o-meter indicating risk levels from Low to Very High."
                ),
            },
            {
                "section": "Regulation 52 - Total Expense Ratio (TER) Caps",
                "summary": "Statutory caps on AMC management fees and operational costs scaled by Assets Under Management (AUM).",
                "text": (
                    "SEBI enforces tiered Total Expense Ratio (TER) limits for equity mutual funds: maximum 2.25% on the first ₹500 Crore of AUM, "
                    "decreasing systematically down to 1.05% for AUM exceeding ₹50,000 Crore. Direct plans must be offered with lower expense ratios "
                    "excluding distributor commission, ensuring higher net returns for self-directed retail investors."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-RA-2014",
        "title": "SEBI (Research Analysts) Regulations, 2014",
        "category": "Research Analysis & Stock Recommendations",
        "circular_no": "SEBI/LAD-NRO/GN/2014-15/07/1414",
        "official_url": "https://www.sebi.gov.in/legal/regulations/sep-2014/securities-and-exchange-board-of-india-research-analysts-regulations-2014_27909.html",
        "sections": [
            {
                "section": "Regulation 16 & 19 - Trading Restrictions & Conflict Disclosures",
                "summary": "Mandatory NISM certification, 30-day pre/5-day post trading blackouts, and disclosure of financial interest in recommendations.",
                "text": (
                    "Individuals or entities publishing research reports, stock ratings, or price targets must obtain SEBI registration as a Research Analyst (RA). "
                    "Research analysts and their associates cannot trade securities in the subject company 30 days before and 5 days after publishing a research report. "
                    "Every recommendation must disclose: 1) whether the analyst owns shares in the company; 2) receipt of compensation or investment banking fees; "
                    "and 3) any material conflict of interest that could bias objective analysis."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-TRADING-SETTLEMENT-2024",
        "title": "NSE & BSE Trading Hours, Circuit Breakers and T+1 Rolling Settlement Framework",
        "category": "Secondary Market Mechanics & Risk Controls",
        "circular_no": "SEBI/HO/MRD2/DCAP/P/CIR/2021/624",
        "official_url": "https://www.sebi.gov.in/legal/master-circulars/oct-2023/master-circular-for-stock-exchanges-and-clearing-corporations_78129.html",
        "sections": [
            {
                "section": "Clause 1.2 - Market Hours & T+1 Settlement",
                "summary": "NSE/BSE operate 09:00 - 15:30 IST with mandatory T+1 trade-date-plus-one-day settlement for all cash equities.",
                "text": (
                    "Trading sessions run Monday through Friday: Pre-open price discovery from 09:00 AM to 09:15 AM IST; "
                    "continuous order matching from 09:15 AM to 03:30 PM IST; post-closing from 03:40 PM to 04:00 PM IST. "
                    "Indian secondary markets follow the T+1 settlement cycle, wherein securities are credited to the buyer's Demat and funds "
                    "paid out to the seller within 24 hours of trade execution."
                ),
            },
            {
                "section": "Clause 2.4 - Market-Wide Circuit Breakers & Price Bands",
                "summary": "Index circuit triggers at 10%, 15%, and 20% on NIFTY/SENSEX halt trading nationwide to prevent flash panics.",
                "text": (
                    "A 10% breach in NIFTY 50 or SENSEX before 1:00 PM IST halts trading nationwide for 45 minutes followed by a 15-minute call auction. "
                    "A 15% breach triggers a longer suspension, and a 20% movement halts trading for the rest of the day. "
                    "Non-derivative individual equities operate within daily dynamic price bands of 2%, 5%, 10%, or 20%."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-TAX-CAPITAL-GAINS-2024",
        "title": "Statutory Indian Capital Gains & Securities Taxation Framework (Budget 2024)",
        "category": "Securities Taxation & Investor Returns",
        "circular_no": "Finance (No. 2) Act 2024 / Sec 112A & 111A",
        "official_url": "https://incometaxindia.gov.in/",
        "sections": [
            {
                "section": "Section 112A & 111A - LTCG and STCG Tax Rates on Listed Equities",
                "summary": "Long-Term Capital Gains (>12 months) taxed at 12.5% beyond ₹1.25 Lakh exemption; Short-Term Capital Gains (<=12 months) taxed at 20%.",
                "text": (
                    "Under Finance (No. 2) Act 2024 amendments to Section 112A of the Income Tax Act, Long Term Capital Gains (LTCG) "
                    "on listed equities and equity-oriented mutual funds held for more than 12 months are taxed at 12.5% on aggregate capital gains "
                    "exceeding ₹1,25,000 per financial year. Short Term Capital Gains (STCG) on shares held for 12 months or less are taxed at 20% "
                    "under Section 111A. Securities Transaction Tax (STT) applies on both buy and sell delivery transactions (0.1%) and F&O sales."
                ),
            },
        ],
    },
    {
        "doc_id": "SEBI-PMS-2020",
        "title": "SEBI (Portfolio Managers) Regulations, 2020 & Net Worth Requirements",
        "category": "Portfolio Management Services & HNI Mandates",
        "circular_no": "SEBI/LAD-NRO/GN/2019/46 & CIR/P/2020/22",
        "official_url": "https://www.sebi.gov.in/legal/regulations/jan-2020/securities-and-exchange-board-of-india-portfolio-managers-regulations-2020_45719.html",
        "sections": [
            {
                "section": "Regulation 9 - Net Worth Requirement of ₹5 Crore for Portfolio Managers",
                "summary": "Every registered Portfolio Manager must maintain continuous minimum tangible net worth of ₹5 Crore.",
                "text": (
                    "Under Regulation 9 of SEBI (Portfolio Managers) Regulations, 2020, every applicant seeking registration as a Portfolio Manager "
                    "or holding a certificate of registration must continuously maintain a minimum net worth of **₹5 Crore** (raised from ₹2 Crore "
                    "to enhance financial resilience and risk governance). Net worth is defined as paid-up capital plus free reserves less accumulated "
                    "losses and deferred expenditure, certified by an independent statutory auditor."
                ),
            },
            {
                "section": "Regulation 23 - Client Minimum Ticket Size of ₹50 Lakh",
                "summary": "Minimum client investment amount in Portfolio Management Services (PMS) is strictly ₹50 Lakh.",
                "text": (
                    "Under Regulation 23 of SEBI (Portfolio Managers) Regulations, 2020, the portfolio manager cannot accept funds or securities worth "
                    "less than **₹50 Lakh** from any client. This minimum threshold ensures that PMS products are restricted to sophisticated High "
                    "Net Worth Individuals (HNIs) capable of absorbing individual equity drawdown and strategy risk. Funds and securities of each client "
                    "must be segregated and held in dedicated client-named Demat and bank accounts."
                ),
            },
        ],
    },
]


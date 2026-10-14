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
]


"""Financial Education, Calculators, and Regulatory Sources API Endpoints."""

import math
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_optional
from app.db.session import get_db
from app.models.user import User
from app.schemas.education import (
    CalculationResult,
    CalculatorRequest,
    CalculatorResponse,
    ChatMessage,
    GlossaryItem,
    SourceCitation,
)
from app.services.rag_service import RAGService


router = APIRouter()


GLOSSARY_ITEMS: List[GlossaryItem] = [
    GlossaryItem(
        term="CAGR",
        category="Returns & Growth",
        definition="Compound Annual Growth Rate represents the constant annualized geometric growth rate that smooths out multi-year fluctuations.",
        statutory_reference="NISM Series X-A Curriculum",
    ),
    GlossaryItem(
        term="Max Drawdown",
        category="Risk & Volatility",
        definition="The maximum observed peak-to-trough decline of an investment corpus before a new peak is reached.",
        statutory_reference="SEBI Portfolio Risk Guidelines",
    ),
    GlossaryItem(
        term="LTCG Tax",
        category="Taxation",
        definition="Long Term Capital Gains tax on listed equity shares held for >12 months, taxed at 12.5% on gains exceeding ₹1.25 Lakh per financial year.",
        statutory_reference="Income Tax Act, Section 112A",
    ),
    GlossaryItem(
        term="Value at Risk (VaR)",
        category="Risk Modeling",
        definition="Statistical technique measuring maximum expected loss at a 95% or 99% confidence level over a defined time horizon.",
        statutory_reference="Basel III / SEBI Quantitative Standards",
    ),
    GlossaryItem(
        term="Beta",
        category="Market Sensitivity",
        definition="Measure of systematic risk or volatility of an individual security in comparison to the benchmark market index (NIFTY 50).",
        statutory_reference="NISM Equity Research Analyst Module",
    ),
]


@router.get("/glossary", response_model=List[GlossaryItem], summary="List financial glossary terms")
def get_glossary(
    current_user: User = Depends(get_current_user),
) -> List[GlossaryItem]:
    """Retrieve verified definitions for key financial, statutory, and quantitative metrics."""
    return GLOSSARY_ITEMS


@router.get("/sources", response_model=List[SourceCitation], summary="List verified regulatory knowledge sources")
def get_knowledge_sources(
    current_user: User = Depends(get_current_user),
) -> List[SourceCitation]:
    """Retrieve registered regulatory and educational authorities indexing the RAG vector store."""
    return [
        SourceCitation(
            id="src-sebi-01",
            title="SEBI Investor Education Guidelines & Risk Categorization",
            publisher="Securities and Exchange Board of India (SEBI)",
            url="https://investor.sebi.gov.in/",
            confidence_score=0.99,
        ),
        SourceCitation(
            id="src-nism-02",
            title="NISM Certification: Mutual Fund & Quantitative Metrics",
            publisher="National Institute of Securities Markets (NISM)",
            url="https://www.nism.ac.in/",
            confidence_score=0.98,
        ),
        SourceCitation(
            id="src-amfi-03",
            title="AMFI Asset Allocation & Risk-o-meter Standards",
            publisher="Association of Mutual Funds in India (AMFI)",
            url="https://www.amfiindia.com/",
            confidence_score=0.97,
        ),
        SourceCitation(
            id="src-itd-04",
            title="Section 112A Capital Gains & Securities Taxation Framework",
            publisher="Income Tax Department, Government of India",
            url="https://incometaxindia.gov.in/",
            confidence_score=0.99,
        ),
    ]


@router.post("/calculator", response_model=CalculatorResponse, summary="Compute financial formula calculator")
def calculate_financial_metric(
    request: CalculatorRequest,
    current_user: User = Depends(get_current_user),
) -> CalculatorResponse:
    """Calculate SIP wealth creation, CAGR, Drawdown, or Bank Fixed Deposit returns."""
    ctype = request.calculator_type

    if ctype == "sip":
        # Monthly compounding annuity formula: M = P * ((1 + r)^n - 1) / r * (1 + r)
        monthly_rate = (request.rate / 100.0) / 12.0
        n_months = int(request.tenure_years * 12)
        p = request.monthly_sip or 10000.0

        future_val = p * (((math.pow(1.0 + monthly_rate, n_months) - 1.0) / monthly_rate) * (1.0 + monthly_rate))
        total_invested = p * n_months
        wealth_gain = future_val - total_invested

        results = [
            CalculationResult(label="Total Invested Amount", value=f"₹{total_invested:,.0f}"),
            CalculationResult(label="Estimated Wealth Gain", value=f"₹{wealth_gain:,.0f}"),
            CalculationResult(label="Total Expected Maturity", value=f"₹{future_val:,.0f}", subtext=f"At {request.rate}% p.a. expected CAGR over {request.tenure_years:.0f} years"),
        ]
        explanation = f"A monthly SIP of ₹{p:,.0f} growing at an assumed {request.rate}% CAGR accumulates ₹{future_val:,.0f} over {request.tenure_years:.0f} years."

    elif ctype == "cagr":
        start_val = request.principal
        end_val = request.monthly_sip or (start_val * 2.0)  # use second field or double
        cagr = (math.pow(end_val / start_val, 1.0 / request.tenure_years) - 1.0) * 100.0 if start_val > 0 else 0.0

        results = [
            CalculationResult(label="Starting Investment", value=f"₹{start_val:,.0f}"),
            CalculationResult(label="Ending Value", value=f"₹{end_val:,.0f}"),
            CalculationResult(label="Annualized CAGR", value=f"{cagr:.2f}% p.a.", subtext=f"Over {request.tenure_years:.1f} years"),
        ]
        explanation = f"Your investment compounded at an annual smoothed rate of {cagr:.2f}% per year."

    elif ctype == "drawdown":
        peak = request.peak_value or (request.principal * 1.2)
        trough = request.trough_value or (request.principal * 0.8)
        dd = ((peak - trough) / peak) * 100.0 if peak > 0 else 0.0
        recovery_needed = ((peak - trough) / trough) * 100.0 if trough > 0 else 0.0

        results = [
            CalculationResult(label="Peak Portfolio High", value=f"₹{peak:,.0f}"),
            CalculationResult(label="Trough Low", value=f"₹{trough:,.0f}"),
            CalculationResult(label="Maximum Drawdown (MDD)", value=f"-{dd:.2f}%", subtext="Decline from peak"),
            CalculationResult(label="Gain Required to Break Even", value=f"+{recovery_needed:.2f}%", subtext="From the trough"),
        ]
        explanation = f"A {dd:.1f}% drawdown requires a +{recovery_needed:.1f}% subsequent gain from the bottom just to break even."

    else:  # FD calculator
        p = request.principal
        r = request.rate / 100.0
        t = request.tenure_years
        # Quarterly compounding
        maturity = p * math.pow(1.0 + r / 4.0, 4.0 * t)
        interest = maturity - p

        results = [
            CalculationResult(label="Principal Deposit", value=f"₹{p:,.0f}"),
            CalculationResult(label="Total Interest Earned", value=f"₹{interest:,.0f}"),
            CalculationResult(label="Maturity Value", value=f"₹{maturity:,.0f}", subtext=f"Quarterly compounding at {request.rate}% p.a."),
        ]
        explanation = f"Fixed Deposit matures with guaranteed capital of ₹{maturity:,.0f} at {request.rate}% p.a."

    return CalculatorResponse(
        calculator_type=ctype,
        results=results,
        explanation=explanation,
    )


@router.post("/chat", response_model=ChatMessage, summary="Ask financial education chatbot")
def chat_with_education_assistant(
    request: dict,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> ChatMessage:
    """Ask educational question grounded in regulatory documents with interactive source badges."""
    query = request.get("query", "").strip() or "What is CAGR?"
    session_id = request.get("session_id")
    user_id = str(current_user.id) if current_user else "anonymous-investor"
    return RAGService.get_education_chat_message(
        query=query,
        session_id=session_id,
        user_id=user_id,
        db=db,
    )

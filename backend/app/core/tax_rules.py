"""Indian Capital Gains Tax Rules and Statutory Thresholds.

Effective-dated rule definitions for Indian Income-tax Act provisions:
- Section 111A: Short-term capital gains on listed equity shares / equity-oriented funds
- Section 112A: Long-term capital gains on listed equity shares / equity-oriented funds
- Budget 2024 changes effective from 23 July 2024
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Dict, List, Optional


@dataclass(frozen=True)
class TaxRuleVersion:
    rule_id: str
    version_label: str
    effective_from: date
    effective_to: Optional[date]
    asset_category: str
    stcg_rate: Decimal
    ltcg_rate: Decimal
    ltcg_exemption_threshold: Decimal
    holding_period_months: int
    cess_rate: Decimal = Decimal("0.04")  # 4% Health & Education Cess
    stt_deductible: bool = False
    description: str = ""


# Effective-dated statutory rule sets for Indian capital gains taxation
TAX_RULES: List[TaxRuleVersion] = [
    # Rules effective from 23 July 2024 (Finance Act 2024 / Union Budget 2024)
    TaxRuleVersion(
        rule_id="RULE_2024_POST_BUDGET",
        version_label="Finance (No. 2) Act 2024 (Effective 23-Jul-2024 onwards)",
        effective_from=date(2024, 7, 23),
        effective_to=None,
        asset_category="LISTED_EQUITY",
        stcg_rate=Decimal("0.20"),  # Section 111A: 20%
        ltcg_rate=Decimal("0.125"),  # Section 112A: 12.5%
        ltcg_exemption_threshold=Decimal("125000.00"),  # Annual exemption: ₹1,25,000
        holding_period_months=12,
        cess_rate=Decimal("0.04"),
        stt_deductible=False,
        description="Under Budget 2024, STCG under Section 111A is increased to 20% and LTCG under Section 112A is 12.5% with an annual exemption limit of ₹1,25,000 for transfers on or after 23 July 2024.",
    ),
    # Rules prior to 23 July 2024
    TaxRuleVersion(
        rule_id="RULE_2024_PRE_BUDGET",
        version_label="Pre-Budget 2024 Regime (Transfers up to 22-Jul-2024)",
        effective_from=date(2018, 4, 1),
        effective_to=date(2024, 7, 22),
        asset_category="LISTED_EQUITY",
        stcg_rate=Decimal("0.15"),  # Section 111A: 15%
        ltcg_rate=Decimal("0.10"),  # Section 112A: 10%
        ltcg_exemption_threshold=Decimal("100000.00"),  # Annual exemption: ₹1,00,000
        holding_period_months=12,
        cess_rate=Decimal("0.04"),
        stt_deductible=False,
        description="Prior to 23 July 2024, STCG under Section 111A was 15% and LTCG under Section 112A was 10% on gains exceeding ₹1,00,000.",
    ),
]


def get_tax_rule_for_transfer(transfer_date: date, asset_category: str = "LISTED_EQUITY") -> Optional[TaxRuleVersion]:
    """Retrieve the effective statutory tax rule configuration based on the transfer/sale date."""
    for rule in TAX_RULES:
        if rule.asset_category != asset_category:
            continue
        if rule.effective_from <= transfer_date:
            if rule.effective_to is None or transfer_date <= rule.effective_to:
                return rule
    # Fallback to current active rule if within modern era
    return TAX_RULES[0]


def get_financial_year(dt: date) -> str:
    """Return the Indian Financial Year string, e.g. 'FY 2024-25' for a given date."""
    if dt.month >= 4:
        return f"FY {dt.year}-{str(dt.year + 1)[-2:]}"
    else:
        return f"FY {dt.year - 1}-{str(dt.year)[-2:]}"


def get_all_supported_rules() -> List[Dict]:
    """Return JSON-serializable list of all supported tax rules for API consumption."""
    return [
        {
            "rule_id": r.rule_id,
            "version_label": r.version_label,
            "effective_from": r.effective_from.isoformat(),
            "effective_to": r.effective_to.isoformat() if r.effective_to else None,
            "asset_category": r.asset_category,
            "stcg_rate_percent": float(r.stcg_rate * 100),
            "ltcg_rate_percent": float(r.ltcg_rate * 100),
            "ltcg_exemption_threshold": float(r.ltcg_exemption_threshold),
            "holding_period_months": r.holding_period_months,
            "cess_rate_percent": float(r.cess_rate * 100),
            "stt_deductible": r.stt_deductible,
            "description": r.description,
        }
        for r in TAX_RULES
    ]

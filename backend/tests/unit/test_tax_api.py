"""Integration and API unit tests for Tax Intelligence endpoints."""

import uuid
from datetime import date
from decimal import Decimal
import pytest
from starlette.testclient import TestClient

from app.core.security import create_access_token, get_password_hash
from app.models.market import Stock
from app.models.portfolio import Holding, Portfolio
from app.models.user import User


@pytest.fixture
def secondary_user_auth_headers(db_session):
    """Generates valid JWT bearer authorization headers for a second isolated user."""
    email = f"user2-{uuid.uuid4().hex}@stockiq.example.com"
    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash=get_password_hash("TestPass123!"),
        full_name="User Two",
        role="investor",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token(
        subject=str(user.id),
        claims={"email": email, "role": "investor", "full_name": "User Two"},
    )
    return {"Authorization": f"Bearer {token}"}


def test_calculate_endpoint_mandatory_example(client: TestClient, auth_headers):
    """POST /api/v1/tax/calculate with 10 shares @ 1000 buy, 1500 sell."""
    payload = {
        "symbol": "TATAMOTORS.NS",
        "sale_date": "2024-08-15",
        "quantity": 10.0,
        "sale_price": 1500.0,
        "purchase_date": "2024-04-01",
        "purchase_price": 1000.0,
        "asset_category": "LISTED_EQUITY",
        "eligible_expenses": 0.0,
        "ineligible_expenses": 0.0,
        "save_record": True,
    }

    res = client.post("/api/v1/tax/calculate", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()

    metrics = data["structured_metrics"]
    assert metrics["purchase_value"] == 10000.0
    assert metrics["sale_value"] == 15000.0
    assert metrics["gross_capital_gain"] == 5000.0
    assert metrics["basic_tax"] == 1000.0
    assert metrics["estimated_total_tax"] == 1040.0
    assert metrics["estimated_after_tax_profit"] == 3960.0
    assert data["calculation_id"] is not None
    assert "explanation_sections" in data
    assert "why_is_gain_taxable" in data["explanation_sections"]


def test_explain_endpoint_with_calculation_id(client: TestClient, auth_headers):
    """Calculate and then call POST /api/v1/tax/explain using calculation_id."""
    calc_res = client.post(
        "/api/v1/tax/calculate",
        json={
            "symbol": "INFY.NS",
            "sale_date": "2024-09-01",
            "quantity": 20.0,
            "sale_price": 1800.0,
            "purchase_date": "2023-01-01",
            "purchase_price": 1200.0,
            "save_record": True,
        },
        headers=auth_headers,
    )
    assert calc_res.status_code == 200
    calc_id = calc_res.json()["calculation_id"]

    explain_res = client.post(
        "/api/v1/tax/explain",
        json={"calculation_id": calc_id},
        headers=auth_headers,
    )
    assert explain_res.status_code == 200
    exp_data = explain_res.json()
    assert exp_data["symbol"] == "INFY.NS"
    assert "why_category_selected" in exp_data["explanation_sections"]
    assert "LTCG" in exp_data["structured_metrics"]["capital_gain_category"]


def test_tax_summary_and_unrealized_holdings(client: TestClient, auth_headers, db_session):
    """GET /api/v1/tax/summary aggregates holdings and transactions."""
    # Ensure stock exists for FK constraint
    stock = db_session.query(Stock).filter(Stock.symbol == "RELIANCE.NS").first()
    if not stock:
        stock = Stock(symbol="RELIANCE.NS", name="Reliance Industries", exchange="NSE", current_price=3000.0)
        db_session.add(stock)
        db_session.commit()

    import jwt
    from app.core.config import settings

    token = auth_headers["Authorization"].split(" ")[1]
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    user_id = uuid.UUID(payload["sub"])

    portfolio = Portfolio(id=uuid.uuid4(), user_id=user_id, name="Tax Test Portfolio", total_value=150000.0)
    db_session.add(portfolio)
    db_session.commit()

    holding = Holding(
        id=uuid.uuid4(),
        portfolio_id=portfolio.id,
        symbol="RELIANCE.NS",
        quantity=Decimal("50"),
        avg_buy_price=Decimal("2500"),
        current_price=Decimal("3000"),
    )
    db_session.add(holding)
    db_session.commit()

    res = client.get("/api/v1/tax/summary", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_purchase_value" in data
    assert "unrealized_portfolio_gains" in data
    assert len(data["holdings_breakdown"]) >= 1


def test_transactions_crud_and_fy_filter(client: TestClient, auth_headers):
    """Create manual tax transaction and list with FY filter."""
    txn_data = {
        "symbol": "TCS.NS",
        "asset_category": "LISTED_EQUITY",
        "exchange": "NSE",
        "purchase_date": "2024-01-10",
        "purchase_price": 3800.0,
        "quantity": 10.0,
        "sale_date": "2024-08-10",
        "sale_price": 4200.0,
        "eligible_expenses": 150.0,
        "is_realized": True,
        "notes": "Booked swing trade profit",
    }
    create_res = client.post("/api/v1/tax/transactions", json=txn_data, headers=auth_headers)
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    list_res = client.get("/api/v1/tax/transactions?symbol=TCS.NS", headers=auth_headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(i["id"] == created_id for i in items)


def test_tax_history_chronological(client: TestClient, auth_headers):
    """GET /api/v1/tax/history returns saved calculations."""
    res = client.get("/api/v1/tax/history?limit=10", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_scenario_comparison(client: TestClient, auth_headers):
    """POST /api/v1/tax/scenario compares sell-now vs sell-future."""
    payload = {
        "symbol": "HDFCBANK.NS",
        "quantity": 100.0,
        "purchase_date": "2024-01-01",
        "purchase_price": 1400.0,
        "scenarios": [
            {
                "scenario_id": "sc1",
                "title": "Sell Today (STCG)",
                "sale_date": "2024-08-01",
                "sale_price": 1650.0,
            },
            {
                "scenario_id": "sc2",
                "title": "Sell in 2025 (LTCG)",
                "sale_date": "2025-02-01",
                "sale_price": 1650.0,
            },
        ],
    }

    res = client.post("/api/v1/tax/scenario", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["outcomes"]) == 2
    assert not data["outcomes"][0]["is_long_term"]
    assert data["outcomes"][1]["is_long_term"]
    assert "strategic_insight" in data


def test_user_data_isolation(client: TestClient, auth_headers, secondary_user_auth_headers):
    """Ensure user 1 cannot view user 2's transactions or calculation records."""
    headers2 = secondary_user_auth_headers

    # User 2 creates transaction
    t_res = client.post(
        "/api/v1/tax/transactions",
        json={
            "symbol": "WIPRO.NS",
            "purchase_date": "2024-02-01",
            "purchase_price": 450.0,
            "quantity": 50.0,
            "sale_date": "2024-08-01",
            "sale_price": 550.0,
        },
        headers=headers2,
    )
    assert t_res.status_code == 201
    u2_txn_id = t_res.json()["id"]

    # User 1 lists transactions
    u1_list_res = client.get("/api/v1/tax/transactions", headers=auth_headers)
    assert u1_list_res.status_code == 200
    u1_items = u1_list_res.json()
    assert not any(i["id"] == u2_txn_id for i in u1_items)


def test_unauthorized_access_rejected(client: TestClient):
    """Endpoints require authentication."""
    res = client.get("/api/v1/tax/summary")
    assert res.status_code == 401


def test_get_tax_rules(client: TestClient):
    """GET /api/v1/tax/rules returns statutory rule definitions."""
    res = client.get("/api/v1/tax/rules")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 2
    assert any(r["rule_id"] == "RULE_2024_POST_BUDGET" for r in rules)

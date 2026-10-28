"""Unit tests for Next-Day NSE and BSE Opening Price & Gap Prediction service."""

import pytest
from app.services.opening_prediction_service import OpeningPredictionService


def test_opening_overview_benchmarks():
    """Verify next day opening overview returns valid benchmarks for NSE and BSE."""
    res = OpeningPredictionService.get_overview()

    assert res.market_sentiment in ("BULLISH_GAP", "BEARISH_GAP", "NEUTRAL")
    assert res.gift_nifty_implied_open > 0
    assert len(res.indices) >= 4

    # Verify NIFTY 50 and SENSEX are present with valid quantile intervals
    symbols = [idx.symbol for idx in res.indices]
    assert "^NSEI" in symbols
    assert "^BSESN" in symbols

    for idx in res.indices:
        assert idx.predicted_open_price > 0
        assert idx.open_p10 < idx.open_p50 < idx.open_p90
        assert 0.0 <= idx.p_gap_up <= 1.0
        assert idx.direction in ("GAP_UP", "GAP_DOWN", "FLAT")
        assert len(idx.overnight_factors) > 0


def test_opening_stock_symbol_lookup():
    """Verify single-symbol lookup works for major equities."""
    reliance = OpeningPredictionService.get_symbol_opening("RELIANCE.NS")
    assert reliance is not None
    assert reliance.symbol == "RELIANCE.NS"
    assert reliance.name == "Reliance Industries Ltd."
    assert reliance.predicted_open_price > 0
    assert reliance.open_p10 < reliance.open_p50 < reliance.open_p90
    assert reliance.confidence_score >= 0.80

    tcs = OpeningPredictionService.get_symbol_opening("TCS")
    assert tcs is not None
    assert tcs.symbol == "TCS.NS"


def test_nonexistent_symbol_returns_none():
    """Verify querying an invalid symbol returns None gracefully."""
    invalid = OpeningPredictionService.get_symbol_opening("UNKNOWN_TICKER_999")
    assert invalid is None


def test_opening_predictions_api_endpoints(client):
    """Verify the mounted FastAPI router endpoints respond properly."""
    res = client.get("/api/v1/opening-predictions")
    assert res.status_code == 200
    data = res.json()
    assert "gift_nifty_implied_open" in data
    assert "indices" in data
    assert len(data["indices"]) >= 4

    # Single symbol endpoint
    sym_res = client.get("/api/v1/opening-predictions/%5ENSEI")
    assert sym_res.status_code == 200
    sym_data = sym_res.json()
    assert sym_data["symbol"] == "^NSEI"
    assert sym_data["predicted_open_price"] > 0

    # 404 for invalid symbol
    err_res = client.get("/api/v1/opening-predictions/INVALID_TICKER_XYZ")
    assert err_res.status_code == 404

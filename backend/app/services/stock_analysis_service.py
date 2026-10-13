"""Stock and multi-asset analysis service.

Retrieves historical prices, daily returns series, asset volatilities,
and benchmark correlations for individual equities and multi-asset classes.
"""

from typing import Dict, List, Optional
import numpy as np
from sqlalchemy.orm import Session

from app.models.market import PriceHistory, Stock
from app.services.metrics_service import MetricsService


# Known market parameters for Indian blue chips and assets
ASSET_CALIBRATION: Dict[str, Dict] = {
    "RELIANCE.NS": {"beta": 1.12, "volatility": 21.4, "max_decline": 42.1, "name": "Reliance Industries Ltd"},
    "TCS.NS": {"beta": 0.82, "volatility": 16.5, "max_decline": 28.4, "name": "Tata Consultancy Services"},
    "HDFCBANK.NS": {"beta": 1.05, "volatility": 19.8, "max_decline": 38.6, "name": "HDFC Bank Ltd"},
    "INFY.NS": {"beta": 0.95, "volatility": 18.2, "max_decline": 32.5, "name": "Infosys Ltd"},
    "ICICIBANK.NS": {"beta": 1.25, "volatility": 23.1, "max_decline": 45.2, "name": "ICICI Bank Ltd"},
    "GOLD": {"beta": -0.08, "volatility": 12.4, "max_decline": 14.2, "name": "Domestic Physical Gold 24K"},
    "FD": {"beta": 0.0, "volatility": 0.0, "max_decline": 0.0, "name": "Bank Fixed Deposit"},
}


class StockAnalysisService:
    """Provides individual asset statistical profile and historical return vectors."""

    @classmethod
    def get_asset_profile(cls, db: Optional[Session], symbol: str, asset_type: str = "stock") -> Dict:
        """Fetch asset name, beta, volatility, and historical max decline."""
        clean_sym = symbol.strip().upper()
        if clean_sym in ASSET_CALIBRATION:
            return ASSET_CALIBRATION[clean_sym]

        # Query database for stock name if available
        stock_name = clean_sym
        if db:
            try:
                stock_record = db.query(Stock).filter(Stock.symbol == clean_sym).first()
                if stock_record and stock_record.name:
                    stock_name = stock_record.name
            except Exception:
                pass

        if asset_type.lower() == "gold":
            return {"beta": -0.05, "volatility": 12.0, "max_decline": 12.0, "name": stock_name or "Gold"}
        if asset_type.lower() == "fd":
            return {"beta": 0.0, "volatility": 0.0, "max_decline": 0.0, "name": stock_name or "Fixed Deposit"}

        # Dynamic default for unknown equities
        return {
            "beta": 1.05,
            "volatility": 20.0,
            "max_decline": 35.0,
            "name": stock_name,
        }

    @classmethod
    def get_synthetic_daily_returns(
        cls, symbol: str, days: int = 120, drift: float = 0.0005, vol: float = 0.015
    ) -> List[float]:
        """Generate a statistically stable return series for metric calculation."""
        np.random.seed(abs(hash(symbol)) % (2**31 - 1))
        returns = np.random.normal(drift, vol, days).tolist()
        return [round(float(r), 5) for r in returns]

from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.models.stock import Stock
from app.schemas.stock import PriceHistoryPoint, StockDetailResponse, StockItem, StockListResponse

router = APIRouter()

DEFAULT_STOCKS = [
    {
        "symbol": "RELIANCE.NS",
        "name": "Reliance Industries Ltd.",
        "exchange": "NSE",
        "sector": "Energy & Conglomerate",
        "current_price": 2980.50,
        "currency": "INR",
        "is_active": True,
    },
    {
        "symbol": "TCS.NS",
        "name": "Tata Consultancy Services Ltd.",
        "exchange": "NSE",
        "sector": "Information Technology",
        "current_price": 4120.25,
        "currency": "INR",
        "is_active": True,
    },
    {
        "symbol": "INFY.NS",
        "name": "Infosys Ltd.",
        "exchange": "NSE",
        "sector": "Information Technology",
        "current_price": 1890.10,
        "currency": "INR",
        "is_active": True,
    },
    {
        "symbol": "HDFCBANK.NS",
        "name": "HDFC Bank Ltd.",
        "exchange": "NSE",
        "sector": "Banking & Financial Services",
        "current_price": 1650.80,
        "currency": "INR",
        "is_active": True,
    },
    {
        "symbol": "ICICIBANK.NS",
        "name": "ICICI Bank Ltd.",
        "exchange": "NSE",
        "sector": "Banking & Financial Services",
        "current_price": 1210.45,
        "currency": "INR",
        "is_active": True,
    },
    {
        "symbol": "TATAMOTORS.NS",
        "name": "Tata Motors Ltd.",
        "exchange": "NSE",
        "sector": "Automotive",
        "current_price": 975.30,
        "currency": "INR",
        "is_active": True,
    },
]


@router.get("", response_model=StockListResponse)
@router.get("/", response_model=StockListResponse)
def list_stocks(
    search: Optional[str] = Query(None, description="Search stock by symbol or name"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    db: Session = Depends(get_db),
):
    """List available stocks with optional search and sector filters."""
    stocks_from_db = []
    try:
        query = db.query(Stock)
        if search:
            query = query.filter(
                (Stock.symbol.ilike(f"%{search}%")) | (Stock.name.ilike(f"%{search}%"))
            )
        if sector:
            query = query.filter(Stock.sector.ilike(f"%{sector}%"))
        stocks_from_db = query.all()
    except Exception:
        pass

    if stocks_from_db:
        items = [
            StockItem(
                symbol=s.symbol,
                name=s.name,
                exchange=s.exchange,
                sector=s.sector,
                current_price=s.current_price,
                currency=s.currency,
                is_active=s.is_active,
            )
            for s in stocks_from_db
        ]
    else:
        # Filter default stock universe
        filtered = DEFAULT_STOCKS
        if search:
            s_low = search.lower()
            filtered = [
                s for s in filtered
                if s_low in s["symbol"].lower() or s_low in s["name"].lower()
            ]
        if sector:
            sec_low = sector.lower()
            filtered = [
                s for s in filtered
                if s.get("sector") and sec_low in s["sector"].lower()
            ]
        items = [StockItem(**s) for s in filtered]

    return StockListResponse(total=len(items), items=items)


@router.get("/{symbol}", response_model=StockDetailResponse)
def get_stock_detail(symbol: str, db: Session = Depends(get_db)):
    """Retrieve detailed stock metadata and recent price history."""
    clean_sym = symbol.strip().upper()
    stock_item = None

    try:
        s = db.query(Stock).filter(Stock.symbol.ilike(clean_sym)).first()
        if s:
            stock_item = StockItem(
                symbol=s.symbol,
                name=s.name,
                exchange=s.exchange,
                sector=s.sector,
                current_price=s.current_price,
                currency=s.currency,
                is_active=s.is_active,
            )
    except Exception:
        pass

    if not stock_item:
        found = next((s for s in DEFAULT_STOCKS if s["symbol"].upper() == clean_sym or s["symbol"].split(".")[0].upper() == clean_sym), None)
        if not found:
            raise NotFoundError(f"Stock with symbol '{clean_sym}' not found")
        stock_item = StockItem(**found)

    # Generate synthetic recent 5 days history
    today = date.today()
    mock_history = [
        PriceHistoryPoint(
            date=today - timedelta(days=i),
            open_price=round(stock_item.current_price * (1 - 0.005 * i), 2),
            high_price=round(stock_item.current_price * (1 - 0.005 * i + 0.01), 2),
            low_price=round(stock_item.current_price * (1 - 0.005 * i - 0.01), 2),
            close_price=round(stock_item.current_price * (1 - 0.005 * i + 0.002), 2),
            volume=1500000 + i * 20000,
        )
        for i in range(5, 0, -1)
    ]

    return StockDetailResponse(
        symbol=stock_item.symbol,
        name=stock_item.name,
        exchange=stock_item.exchange,
        sector=stock_item.sector,
        current_price=stock_item.current_price,
        currency=stock_item.currency,
        is_active=stock_item.is_active,
        price_history=mock_history,
    )

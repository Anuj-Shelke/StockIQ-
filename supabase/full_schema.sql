-- ====================================================================
-- StockIQ PostgreSQL / Supabase Complete Schema Initialization
-- Run this in your Supabase SQL Editor to create all tables instantly!
-- ====================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'investor',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_superuser BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Investor Profiles Table
CREATE TABLE IF NOT EXISTS investor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER CHECK (age >= 18 AND age <= 100),
    occupation VARCHAR(100),
    annual_income NUMERIC(15, 2),
    risk_tolerance VARCHAR(50) NOT NULL DEFAULT 'moderate',
    horizon_years INTEGER NOT NULL DEFAULT 5,
    goal VARCHAR(255),
    invest_amount NUMERIC(15, 2),
    risk_score_computed INTEGER
);

-- 4. Stocks Table
CREATE TABLE IF NOT EXISTS stocks (
    symbol VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    exchange VARCHAR(20) NOT NULL DEFAULT 'NSE',
    current_price NUMERIC(12, 4),
    beta NUMERIC(6, 4),
    is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector);

-- 5. Price History Table
CREATE TABLE IF NOT EXISTS price_history (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL REFERENCES stocks(symbol) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    open NUMERIC(12, 4) NOT NULL,
    high NUMERIC(12, 4) NOT NULL,
    low NUMERIC(12, 4) NOT NULL,
    close NUMERIC(12, 4) NOT NULL,
    volume BIGINT NOT NULL,
    CONSTRAINT uq_stock_trade_date UNIQUE(symbol, trade_date)
);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_trade_date ON price_history(trade_date);

-- 6. Portfolios Table
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Primary Portfolio',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

-- 7. Holdings Table
CREATE TABLE IF NOT EXISTS holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL REFERENCES stocks(symbol) ON DELETE CASCADE,
    quantity NUMERIC(12, 4) NOT NULL,
    avg_buy_price NUMERIC(12, 4) NOT NULL,
    CONSTRAINT uq_portfolio_symbol UNIQUE(portfolio_id, symbol)
);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON holdings(portfolio_id);

-- 8. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL REFERENCES stocks(symbol) ON DELETE CASCADE,
    pred_date DATE NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    signal VARCHAR(20) NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL,
    p_up NUMERIC(5, 4),
    p_gap_up NUMERIC(5, 4),
    open_p10 NUMERIC(12, 4),
    open_p50 NUMERIC(12, 4),
    open_p90 NUMERIC(12, 4),
    close_p10 NUMERIC(12, 4),
    close_p50 NUMERIC(12, 4),
    close_p90 NUMERIC(12, 4),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uq_stock_pred_version UNIQUE(symbol, pred_date, model_version)
);
CREATE INDEX IF NOT EXISTS idx_predictions_symbol ON predictions(symbol);

-- 9. SHAP Explanations Table
CREATE TABLE IF NOT EXISTS shap_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    feature VARCHAR(100) NOT NULL,
    shap_value NUMERIC(10, 6) NOT NULL,
    rank INTEGER NOT NULL,
    plain_text TEXT
);
CREATE INDEX IF NOT EXISTS idx_shap_explanations_prediction_id ON shap_explanations(prediction_id);

-- 10. Risk Simulations Table
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    change_json JSONB NOT NULL,
    exposure_before JSONB,
    exposure_after JSONB,
    risk_before INTEGER,
    risk_after INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Review Requests (Admin Audit / Dispute) Table
CREATE TABLE IF NOT EXISTS review_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    asset VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. Knowledge Base Documents (SEBI RAG) Table
CREATE TABLE IF NOT EXISTS kb_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    source_url TEXT,
    version VARCHAR(50) NOT NULL DEFAULT '1.0',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    checksum VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 13. Knowledge Base Chunks (with 384-d pgvector embedding)
CREATE TABLE IF NOT EXISTS kb_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(384),
    page_no INTEGER
);

-- ====================================================================
-- SEED INITIAL MOCK DATA
-- ====================================================================

-- Demo User (Password: demo1234)
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('demo@stockiq.ai', '$2b$12$e80MvQkK7s1Z1F4p1c4Tz.q4Q0E4E4O4e80MvQkK7s1Z1F4p1c4Tz', 'Demo Investor', 'investor')
ON CONFLICT (email) DO NOTHING;

-- Top Indian Stocks
INSERT INTO stocks (symbol, name, sector, exchange, current_price, beta)
VALUES 
    ('RELIANCE.NS', 'Reliance Industries Ltd.', 'Energy & Conglomerate', 'NSE', 2980.50, 1.05),
    ('TCS.NS', 'Tata Consultancy Services Ltd.', 'Information Technology', 'NSE', 4120.25, 0.78),
    ('INFY.NS', 'Infosys Ltd.', 'Information Technology', 'NSE', 1890.10, 0.88),
    ('HDFCBANK.NS', 'HDFC Bank Ltd.', 'Banking & Financial Services', 'NSE', 1650.80, 0.95),
    ('ICICIBANK.NS', 'ICICI Bank Ltd.', 'Banking & Financial Services', 'NSE', 1210.45, 1.12),
    ('SBIN.NS', 'State Bank of India', 'Banking & Financial Services', 'NSE', 815.30, 1.25)
ON CONFLICT (symbol) DO NOTHING;

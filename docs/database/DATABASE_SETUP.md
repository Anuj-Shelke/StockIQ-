# 🐘 StockIQ Database Setup & Architecture Guide

This document describes the relational database setup for **StockIQ**, powered by **PostgreSQL 16** with the **pgvector** extension, **SQLAlchemy 2**, and **Alembic**.

---

## 🏗️ Architecture Overview

| Component | Technology | Purpose |
|---|---|---|
| **RDBMS** | PostgreSQL 16 | Relational data store for accounts, portfolios, market data, and telemetry |
| **Vector Extension** | pgvector (`pg16`) | Fast similarity search on 384-dimensional embeddings for SEBI RAG chatbot |
| **ORM** | SQLAlchemy 2.0+ | Modern type-safe data modeling, session management, and connection pooling |
| **Driver (Sync)** | `psycopg` (v3 binary) | High-performance synchronous PostgreSQL database driver |
| **Driver (Async)** | `asyncpg` | High-throughput asynchronous driver for async FastAPI routes |
| **Migrations** | Alembic | Track, upgrade, and rollback database schema versions |
| **Local Dev** | Docker Compose | One-command containerized local PostgreSQL + pgvector environment |

---

## ⚡ Quickstart for Local Development

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine (with Compose v2+)
- Python 3.11+ / 3.13

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in both the repository root and `backend/`:

```bash
# From repository root
cp .env.example .env
cp .env.example backend/.env
```

Ensure the following database variables are set:
```env
# Database Credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=stockiq

# SQLAlchemy connection strings
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/stockiq
ASYNC_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/stockiq
```

> **Security Note**: Never commit `.env` files to git. Both root and backend `.gitignore` ignore `.env` and secret files.

---

### 3. Start PostgreSQL with pgvector via Docker Compose

In the root directory, start the database container:

```bash
# Start PostgreSQL 16 + pgvector container in background
docker compose up -d db

# Check container health and status
docker compose ps
```

The container automatically mounts `scripts/init-db.sql`, which ensures `uuid-ossp` and `vector` extensions are initialized:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

---

### 4. Run Alembic Database Migrations

Navigate to the `backend` directory and activate your virtual environment:

```powershell
# Windows PowerShell
cd backend
.\.venv\Scripts\Activate.ps1

# Linux / macOS
# source .venv/bin/activate
```

Apply migrations to bring the database up to the latest revision:

```bash
alembic upgrade head
```

To rollback the last migration:
```bash
alembic downgrade -1
```

To view SQL without executing (Offline Mode):
```bash
alembic upgrade head --sql
```

---

## 📊 Database Schema Catalog

The schema implements the **StockIQ Software Requirements Specification (SRS)**:

```mermaid
erDiagram
    users ||--o| investor_profiles : "has"
    users ||--o{ portfolios : "owns"
    users ||--o{ recommendations : "receives"
    users ||--o{ chat_sessions : "starts"
    portfolios ||--o{ holdings : "contains"
    portfolios ||--o{ simulations : "scenario"
    stocks ||--o{ price_history : "records"
    stocks ||--o{ holdings : "held_in"
    stocks ||--o{ predictions : "generates"
    predictions ||--o{ shap_explanations : "explained_by"
    predictions ||--o{ recommendations : "powers"
    chat_sessions ||--o{ chat_messages : "contains"
    kb_documents ||--o{ kb_chunks : "chunked_into"
```

### Table Definitions

1. **`users`**
   - `id`: UUID (Primary Key, `gen_random_uuid()`)
   - `email`: VARCHAR(255) Unique, Index
   - `password_hash`: VARCHAR(255)
   - `role`: VARCHAR(50) (`investor`, `admin`)
   - `is_active`: BOOLEAN
   - `created_at`: TIMESTAMPTZ

2. **`investor_profiles`**
   - `id`: UUID (Primary Key)
   - `user_id`: UUID Foreign Key -> `users.id` (ON DELETE CASCADE, Unique)
   - `age`: INT (Check constraint: `age >= 18 AND age <= 100`)
   - `occupation`: VARCHAR(100)
   - `annual_income`: NUMERIC(15, 2)
   - `risk_tolerance`: VARCHAR(50) (`low`, `moderate`, `high`)
   - `horizon_years`: INT
   - `goal`: VARCHAR(255)
   - `invest_amount`: NUMERIC(15, 2)
   - `risk_score_computed`: INT (0 to 100)

3. **`stocks`**
   - `symbol`: VARCHAR(20) (Primary Key, e.g., `TCS.NS`, `RELIANCE.NS`)
   - `name`: VARCHAR(255)
   - `sector`: VARCHAR(100), Index
   - `exchange`: VARCHAR(20) (`NSE`)
   - `beta`: NUMERIC(6, 4)
   - `is_active`: BOOLEAN

4. **`price_history`**
   - `id`: BIGSERIAL (Primary Key)
   - `symbol`: VARCHAR(20) Foreign Key -> `stocks.symbol` (ON DELETE CASCADE), Index
   - `trade_date`: DATE, Index
   - `open`, `high`, `low`, `close`: NUMERIC(12, 4)
   - `volume`: BIGINT
   - *Constraint*: `UNIQUE(symbol, trade_date)`

5. **`portfolios`**
   - `id`: UUID (Primary Key)
   - `user_id`: UUID Foreign Key -> `users.id` (ON DELETE CASCADE), Index
   - `name`: VARCHAR(100)
   - `created_at`: TIMESTAMPTZ

6. **`holdings`**
   - `id`: UUID (Primary Key)
   - `portfolio_id`: UUID Foreign Key -> `portfolios.id` (ON DELETE CASCADE), Index
   - `symbol`: VARCHAR(20) Foreign Key -> `stocks.symbol` (ON DELETE CASCADE)
   - `quantity`: NUMERIC(12, 4)
   - `avg_buy_price`: NUMERIC(12, 4)
   - *Constraint*: `UNIQUE(portfolio_id, symbol)`

7. **`simulations`**
   - `id`: UUID (Primary Key)
   - `portfolio_id`: UUID Foreign Key -> `portfolios.id` (ON DELETE CASCADE), Index
   - `change_json`: JSONB
   - `exposure_before`, `exposure_after`: JSONB
   - `risk_before`, `risk_after`: INT
   - `created_at`: TIMESTAMPTZ

8. **`predictions`**
   - `id`: UUID (Primary Key)
   - `symbol`: VARCHAR(20) Foreign Key -> `stocks.symbol` (ON DELETE CASCADE), Index
   - `pred_date`: DATE, Index
   - `model_version`: VARCHAR(50)
   - `signal`: VARCHAR(20) (`BUY`, `HOLD`, `SELL`)
   - `confidence`: NUMERIC(5, 4)
   - `p_up`, `p_gap_up`: NUMERIC(5, 4)
   - `open_p10`, `open_p50`, `open_p90`: NUMERIC(12, 4)
   - `close_p10`, `close_p50`, `close_p90`: NUMERIC(12, 4)
   - *Constraint*: `UNIQUE(symbol, pred_date, model_version)`

9. **`shap_explanations`**
   - `id`: UUID (Primary Key)
   - `prediction_id`: UUID Foreign Key -> `predictions.id` (ON DELETE CASCADE), Index
   - `feature`: VARCHAR(100)
   - `shap_value`: NUMERIC(10, 6)
   - `rank`: INT
   - `plain_text`: TEXT

10. **`recommendations`**
    - `id`: UUID (Primary Key)
    - `user_id`: UUID Foreign Key -> `users.id` (ON DELETE CASCADE), Index
    - `prediction_id`: UUID Foreign Key -> `predictions.id` (ON DELETE CASCADE), Index
    - `suitability`: VARCHAR(50) (`SUITABLE`, `MODERATE`, `LOW`)
    - `reason_text`: TEXT
    - `created_at`: TIMESTAMPTZ, Index
    - *Index*: `idx_recommendations_user_created (user_id, created_at)`

11. **`chat_sessions`**
    - `id`: UUID (Primary Key)
    - `user_id`: UUID Foreign Key -> `users.id` (ON DELETE CASCADE), Index
    - `created_at`: TIMESTAMPTZ

12. **`chat_messages`**
    - `id`: UUID (Primary Key)
    - `session_id`: UUID Foreign Key -> `chat_sessions.id` (ON DELETE CASCADE), Index
    - `role`: VARCHAR(20) (`user`, `assistant`, `system`)
    - `content`: TEXT
    - `sources_json`: JSONB
    - `feedback`: SMALLINT (`+1`, `-1`)
    - `latency_ms`: INT
    - `prompt_version`: VARCHAR(50)
    - `created_at`: TIMESTAMPTZ
    - *Index*: `idx_chat_messages_session_created (session_id, created_at)`

13. **`kb_documents`**
    - `id`: UUID (Primary Key)
    - `title`: VARCHAR(255)
    - `source_url`: TEXT
    - `version`: VARCHAR(50)
    - `status`: VARCHAR(50)
    - `checksum`: VARCHAR(64) Unique (SHA-256)
    - `uploaded_by`: UUID Foreign Key -> `users.id` (ON DELETE SET NULL)
    - `created_at`: TIMESTAMPTZ

14. **`kb_chunks`**
    - `id`: UUID (Primary Key)
    - `document_id`: UUID Foreign Key -> `kb_documents.id` (ON DELETE CASCADE), Index
    - `chunk_text`: TEXT
    - `embedding`: `VECTOR(384)` (bge-small-en-v1.5)
    - `page_no`: INT
    - `tsv`: TSVECTOR
    - *Indexes*:
      - GIN index on `tsv`: Full-text search
      - HNSW index on `embedding` (`vector_cosine_ops`): Cosine similarity search

15. **`audit_logs`**
    - `id`: BIGSERIAL (Primary Key)
    - `user_id`: UUID Foreign Key -> `users.id` (ON DELETE SET NULL), Index
    - `action`: VARCHAR(100)
    - `ip_address`: VARCHAR(45)
    - `details`: TEXT
    - `created_at`: TIMESTAMPTZ, Index

16. **`llm_usage`**
    - `id`: BIGSERIAL (Primary Key)
    - `user_id`: UUID Foreign Key -> `users.id` (ON DELETE SET NULL), Index
    - `model`: VARCHAR(100)
    - `prompt_tokens`, `completion_tokens`, `total_tokens`: INT
    - `estimated_cost_usd`: NUMERIC(10, 6)
    - `latency_ms`: INT
    - `created_at`: TIMESTAMPTZ, Index

17. **`asset_rates`**
    - `id`: SERIAL (Primary Key)
    - `asset_type`: VARCHAR(50) (`GOLD`, `FD`, `INFLATION`)
    - `rate_date`: DATE, Index
    - `annual_rate_pct`: NUMERIC(6, 4)
    - *Constraint*: `UNIQUE(asset_type, rate_date)`

18. **`feature_flags`**
    - `key`: VARCHAR(100) (Primary Key)
    - `is_enabled`: BOOLEAN
    - `description`: VARCHAR(255)

---

## 🧪 Testing

Run the full integration test suite:

```bash
cd backend
pytest tests/integration/test_database.py -v
```

The tests verify:
- All 18 tables and metadata integrity
- Alembic migration upgrade & rollback offline SQL compilation
- Primary keys and UUID generation
- Foreign-key cascades (`ON DELETE CASCADE`, `ON DELETE SET NULL`)
- Check constraints (`age >= 18 AND age <= 100`)
- Unique constraints (`email`, `(symbol, trade_date)`, `(portfolio_id, symbol)`, `checksum`, `(asset_type, rate_date)`)
- pgvector 384-dimensional vector embedding storage and retrieval
- JSONB telemetry and citation storage

---

## 🔒 Security Requirements
1. **No Hardcoded Credentials**: All passwords and host configurations are loaded via environment variables (`pydantic-settings`).
2. **Password Security**: Passwords are never stored in plaintext; hashed using bcrypt via `passlib`.
3. **ORM Parameterization**: All database interaction utilizes SQLAlchemy parameterized queries, preventing SQL injection.
4. **Least Privilege**: Application accesses the database through designated credentials.

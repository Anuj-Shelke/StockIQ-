# 📈 StockIQ

### AI-Based Investment Research, Portfolio Risk Analysis & Financial Education

**StockIQ** is an AI-powered web application designed to help users understand investments through **portfolio analysis, historical risk assessment, cross-asset comparison, and Explainable AI**.

Instead of simply showing an investment suggestion, StockIQ focuses on explaining **why a result is produced, how it was calculated, and what risks are involved.**

> **Understand the Risk. Explore the Data. Know the Reasoning.**

---

## 🎯 Problem

Beginner investors often see charts, returns, and investment suggestions but struggle to understand:

* How risky their portfolio actually is.
* How much money could have been lost during historical market stress.
* How stocks compare with alternatives such as gold and fixed deposits.
* What metrics like volatility and drawdown actually mean.
* Why an AI system produced a particular insight.

StockIQ aims to make these concepts easier to understand through transparent, educational analysis.

---

## 💡 Our Solution

StockIQ combines:

**Portfolio Analysis + Historical Stress Testing + Cross-Asset Comparison + Explainable AI + Financial Education**

The core feature is the **Risk Reality Check**, which helps users compare their perceived risk tolerance with how their hypothetical portfolio behaved under historical market conditions.

For example:

> A user enters a ₹1,00,000 portfolio and states that they are comfortable with a 15% decline.

StockIQ can analyse a selected historical period and show:

* Maximum historical drawdown.
* Approximate loss in rupees.
* Recovery period where applicable.
* Portfolio concentration.
* Individual asset contribution to the observed result.
* Explanation of how the calculations were performed.

Historical simulations are educational and **do not predict future returns**.

---

## ✨ Key Features

### 📊 1. Risk Reality Check

Analyse a portfolio using historical market data.

* Portfolio allocation
* Historical returns
* Volatility
* Maximum drawdown
* Recovery analysis
* Historical stress scenarios
* Risk-tolerance comparison

### ⚖️ 2. Stock vs Gold vs FD

Compare hypothetical investment outcomes across:

* 📈 Stocks
* 🪙 Gold
* 🏦 Fixed Deposits

The comparison clearly shows the assumptions and methodology used for each asset.

### 🧠 3. Explainable AI

StockIQ does not rely on an AI model alone to calculate financial results.

The architecture separates:

**Financial calculations → Verified results → AI explanation**

Users can inspect:

* Why a metric was calculated.
* The formula used.
* Historical period considered.
* Data source.
* Assumptions and limitations.

### 📚 4. Contextual Financial Education

A RAG-based educational layer can help users understand concepts such as:

* Volatility
* Drawdown
* CAGR
* Diversification
* Compounding
* Investment risk
* Relevant investor-education information

Where appropriate, responses can reference the underlying sources.

### 🛡️ 5. Human Review & Admin Dashboard

Users can report a potentially incorrect or misleading analysis.

Authorised reviewers can:

* View reported analyses.
* Inspect calculations and assumptions.
* Review AI explanations.
* Record findings.
* Mark issues as resolved or requiring correction.

The admin dashboard also provides operational information such as:

* Number of users.
* Number of analyses.
* Saved analysis snapshots.
* Review requests.
* Data-quality status.

### 📧 6. Event-Based Notifications

Important events can trigger email notifications.

For example:

**Customer reports issue → Review request created → Admin/Expert notified → Review completed → Customer notified**

This demonstrates a complete full-stack workflow rather than a frontend-only application.

---

## 🏗️ System Architecture

```text
                    USER
                     │
                     ▼
             React Frontend
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
 Customer Dashboard        Admin Dashboard
        │                         │
        └────────────┬────────────┘
                     ▼
              FastAPI Backend
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
 Financial       AI / RAG      PostgreSQL
 Analysis        Layer          Database
       │             │             │
       ▼             ▼             ▼
 Market Data    Knowledge     Saved Analyses
                Sources       & Reviews
                     │
                     ▼
              Email Notifications
```

---

## 🛠️ Technology Stack

| Layer               | Technology                     |
| ------------------- | ------------------------------ |
| Frontend            | React + TypeScript             |
| UI                  | Tailwind CSS                   |
| Charts              | Recharts                       |
| Backend             | Python + FastAPI               |
| Database            | PostgreSQL / Supabase          |
| Authentication      | Supabase Auth                  |
| Data Analysis       | Pandas + NumPy                 |
| ML                  | Scikit-learn where appropriate |
| AI                  | LLM + Explainable AI layer     |
| RAG                 | Embeddings + Vector Search     |
| Email               | Email API                      |
| Frontend Deployment | Vercel                         |
| Backend Deployment  | Render                         |

---

## 📂 Project Structure

```text
StockIQ/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── features/
│       │   ├── customer-dashboard/
│       │   ├── portfolio/
│       │   ├── risk-check/
│       │   ├── asset-comparison/
│       │   ├── explainability/
│       │   ├── admin-dashboard/
│       │   └── review-management/
│       ├── services/
│       └── utils/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── integrations/
│   │   └── core/
│   └── tests/
│
├── supabase/
│   └── migrations/
│
├── docs/
│
└── README.md
```

---

## 🔄 Example Workflow

```text
User enters portfolio
        ↓
Backend validates input
        ↓
Historical data retrieved
        ↓
Financial calculations performed
        ↓
Risk & comparison results generated
        ↓
Results saved as analysis snapshot
        ↓
Explainable AI explains the results
        ↓
User views charts + calculations + explanation
        ↓
User can report an issue
        ↓
Admin/Expert reviews the analysis
        ↓
Review outcome is recorded
        ↓
User receives notification
```

---

## 🔐 Responsible AI

StockIQ is designed as an **educational financial analysis platform**.

The system aims to:

* Clearly distinguish historical analysis from future predictions.
* Show assumptions behind calculations.
* Avoid fabricating financial data.
* Keep financial calculations independent from LLM-generated explanations.
* Provide source-backed educational information.
* Handle unavailable or incomplete data explicitly.
* Protect customer information through authentication and access controls.

StockIQ does **not execute trades**.

Any future functionality involving personalised investment advice would require appropriate regulatory and compliance assessment.

### ⚠️ Disclaimer

> StockIQ is an educational/hackathon project focused on investment research, portfolio risk analysis, historical analysis, and explainable financial insights. It does not execute trades and is not professional financial advice. Historical performance and hypothetical scenarios do not guarantee future results.

---

## 💻 Local Development Quickstart

### 🗄️ Database (PostgreSQL 16 + pgvector)

```bash
# 1. Start PostgreSQL 16 with pgvector extension in the background
docker compose up -d db

# 2. For the SQLite demo migration and startup commands, use the Windows PowerShell section below.
cd backend
```

For full database architecture, table descriptions, and testing instructions, see [Database Setup Guide](docs/database/DATABASE_SETUP.md).

### Frontend (React + Vite + TypeScript)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be running at `http://localhost:5173`.

### Backend (FastAPI + Python)

```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

For a local SQLite demo in Windows PowerShell, use a scratch database explicitly so the ignored `backend/.env` database URL is not selected:

```powershell
Set-Location backend
$env:DATABASE_URL = "sqlite:///./stockiq-demo.db"
$env:ALLOW_SQLITE_FALLBACK = "false"
python -m alembic upgrade head
python -m app.scripts.seed_admin
python -m uvicorn app.main:app --reload --port 8000
```

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `ADMIN_NAME` in the gitignored `backend/.env` before running the seed command. The command hashes the password, creates the account once, and leaves an existing account unchanged unless run with `--force`. The Vite development server uses the real API by default; `VITE_AUTH_MOCK=true` opts into the UI mock.

The backend API will be running at `http://localhost:8000`.
Interactive API documentation will be available at `http://localhost:8000/docs`.

### Authentication fallback and email configuration

The backend mirrors successfully authenticated accounts into `backend/.stockiq_auth.db`. If PostgreSQL becomes unavailable, password login, token refresh, and authenticated identity lookup use this local SQLite store. New registrations can also be created there during an outage. Set `AUTH_FALLBACK_DB` to a persistent writable path when deploying; an ephemeral container filesystem will lose fallback accounts after a restart. Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` so the admin can be provisioned into the fallback store when needed. Database-backed portfolio, review, and analysis operations still require the primary database.

Registration sends a welcome email, review submissions notify `ADMIN_NOTIFY_EMAIL` (or `ADMIN_EMAIL`), and resolved reviews notify the requester. Set `RESEND_API_KEY` and `FROM_EMAIL` in the backend environment. Resend's `onboarding@resend.dev` sender can deliver only to the Resend account owner's email; to deliver these messages to arbitrary users, verify a sender domain in Resend and set `FROM_EMAIL` to an address on that domain. Use the same settings in the deployed backend environment.

The backend's primary database connection is `DATABASE_URL`; the current app does not make Supabase REST API calls. A Supabase API key alone does not configure the SQLAlchemy database connection. To use Supabase as the primary database, set `DATABASE_URL` to the project's PostgreSQL connection string. For a separate Supabase REST integration, configure both `SUPABASE_URL` and its API key and add the relevant client code.

---

## 🚀 Project Status

**Currently under development.**

### Planned milestones

* [ ] Portfolio management
* [ ] Historical stock analysis
* [ ] Risk Reality Check
* [ ] Stock vs Gold vs FD comparison
* [ ] Explainable AI
* [ ] Analysis history
* [ ] Customer dashboard
* [ ] Admin dashboard
* [ ] Human review workflow
* [ ] Email notifications
* [ ] RAG-based financial education
* [ ] Testing and deployment

---

## 🌟 Vision

StockIQ aims to move beyond:

> **"Here is an investment suggestion."**

and towards:

> **"Here is what the data shows, here is the risk, here is how we calculated it, and here is why the system reached this conclusion."**

---

### 👥 Team

**Project:** StockIQ
**Category:** Artificial Intelligence · FinTech · Explainable AI · Full Stack Development

*Team member details can be added here.*

import React from 'react'
import {
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-8 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">StockIQ</span>
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v0.1.0 • Foundation
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Core Stack Initialized
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto my-auto py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            AI-based Investment Research &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Portfolio Risk Analysis
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            The foundation for StockIQ is successfully configured. Ready for structured, step-by-step feature development across frontend, backend, and database layers.
          </p>
        </div>

        {/* Foundation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Frontend Card */}
          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Frontend Layer</h2>
            <p className="text-sm text-slate-400 mb-4">
              React + TypeScript + Vite + Tailwind CSS + Recharts
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Feature-driven modular architecture</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Customer & Admin layout foundations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Design tokens & reusable UI slots</span>
              </li>
            </ul>
          </div>

          {/* Backend Card */}
          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Backend Layer</h2>
            <p className="text-sm text-slate-400 mb-4">
              Python + FastAPI + Clean Architecture
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>API v1 modular routers & health check</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Deterministic financial calculation services</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Replaceable integration adapters</span>
              </li>
            </ul>
          </div>

          {/* Data & Security Card */}
          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <Database className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Database & AI</h2>
            <p className="text-sm text-slate-400 mb-4">
              PostgreSQL / Supabase + Explainable AI
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Supabase migrations & seed folders</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>RAG & Vector storage abstractions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Zero secrets committed (.env.example only)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Alert */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 md:p-5 flex items-start gap-3.5">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300 font-semibold">Educational Project Notice: </strong>
            StockIQ is an educational and hackathon platform focused on investment research, portfolio risk analysis, historical stress testing, and explainable financial insights. It does not execute trades and is not professional financial advice.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <span>StockIQ Foundation • Clean Architecture</span>
        </div>
        <div>
          <span>Branch: <code>main</code> • Ready for feature branching</span>
        </div>
      </footer>
    </div>
  )
}

export default App

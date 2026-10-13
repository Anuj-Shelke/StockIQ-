import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Server } from 'lucide-react'
import { checkBackendHealth, MOCK_AUTH, type HealthResponse } from '@/services/api'

/** Live FastAPI health indicator (extracted from the original foundation page, behaviour unchanged). */
export function BackendStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(!MOCK_AUTH)
  const [error, setError] = useState<string | null>(null)

  const verify = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setHealth(await checkBackendHealth())
    } catch (err: unknown) {
      setHealth(null)
      setError(err instanceof Error ? err.message : 'Unable to connect to backend')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!MOCK_AUTH) void verify()
  }, [verify])

  if (MOCK_AUTH)
    return (
      <span
        title="Frontend-only demo: sign-in and dashboard data come from an in-browser mock. Set VITE_AUTH_MOCK=false to use the FastAPI backend."
        className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300"
      >
        <Server className="h-3 w-3" /> Demo mode · mock data
      </span>
    )

  if (loading)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
        <RefreshCw className="h-3 w-3 animate-spin text-blue-400" /> Pinging backend…
      </span>
    )
  if (health?.status === 'ok')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/50 bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Backend connected
      </span>
    )
  return (
    <button
      onClick={verify}
      title={error ?? 'Click to retry connecting to the FastAPI backend'}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-800/50 bg-amber-950/60 px-3 py-1 text-xs font-medium text-amber-300 transition hover:bg-amber-900/50"
    >
      <Server className="h-3 w-3 text-amber-400" /> Backend offline · retry
    </button>
  )
}

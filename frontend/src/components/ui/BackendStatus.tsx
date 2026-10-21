import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Server } from 'lucide-react'
import { checkBackendHealth, MOCK_AUTH, type HealthResponse } from '@/services/api'

/** Live FastAPI health indicator (extracted from the original foundation page, behaviour unchanged). */
export function BackendStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(!MOCK_AUTH)
  const [error, setError] = useState<string | null>(null)

  const verify = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      setHealth(await checkBackendHealth())
    } catch (err: unknown) {
      setHealth(null)
      setError(err instanceof Error ? err.message : 'Unable to connect to backend')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!MOCK_AUTH) void verify()
  }, [verify])

  useEffect(() => {
    if (MOCK_AUTH || health?.status === 'ok') return
    const timer = window.setInterval(() => {
      if (!document.hidden) void verify(true)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [health?.status, verify])

  if (MOCK_AUTH)
    return (
      <span
        title="Frontend-only demo: sign-in and dashboard data come from an in-browser mock. Set VITE_AUTH_MOCK=false to use the FastAPI backend."
        className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold"
      >
        <Server className="h-3 w-3" /> Demo mode · mock data
      </span>
    )

  if (loading)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-theme-subtle bg-surface px-3 py-1 text-xs text-text-muted">
        <RefreshCw className="h-3 w-3 animate-spin text-blue" /> Pinging backend…
      </span>
    )
  if (health?.status === 'ok')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gain/30 bg-gain/10 px-3 py-1 text-xs font-medium text-gain">
        <span className="h-2 w-2 animate-pulse rounded-full bg-gain" /> Backend connected
      </span>
    )
  return (
    <button
      onClick={() => void verify()}
      title={error ?? 'Click to retry connecting to the FastAPI backend'}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-medium text-warning transition hover:bg-warning/20"
    >
      <Server className="h-3 w-3 text-warning" /> Backend offline · retry
    </button>
  )
}

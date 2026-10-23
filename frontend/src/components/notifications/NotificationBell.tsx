import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import type { AppNotification } from '@/types/snapshotHistory'

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Review Request Approved',
    message: 'Auditor #829 verified TCS.NS 30-day forecast. Model assumptions validated.',
    type: 'REVIEW_UPDATE',
    timestamp: '10m ago',
    isRead: false,
  },
  {
    id: 'notif-2',
    title: 'Market Anomaly Alert',
    message: 'High intraday volatility recorded across NIFTY 50 Banking sector (+2.8%).',
    type: 'MARKET',
    timestamp: '2h ago',
    isRead: false,
  },
  {
    id: 'notif-3',
    title: 'Snapshot Saved',
    message: 'Analysis snapshot "TCS Margin Expansion Forecast" archived successfully.',
    type: 'ALERT',
    timestamp: '1d ago',
    isRead: true,
  },
]

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-lg p-2 text-text-secondary hover:bg-hover hover:text-text-primary transition"
        aria-label="Notification center"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-ink-950 font-mono">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="theme-dark-surface absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-xl border border-white/10 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded bg-gold-500/20 px-1.5 py-0.2 text-[10px] font-mono text-gold-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-gold-400 transition"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5 divide-y divide-white/5">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`pt-2 cursor-pointer transition p-2 rounded-lg ${
                    n.isRead ? 'hover:bg-white/[0.02]' : 'bg-white/[0.04] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {n.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default NotificationBell

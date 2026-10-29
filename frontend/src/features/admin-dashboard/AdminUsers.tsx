import { useCallback, useEffect, useState } from 'react'
import { ApiError, apiFetch } from '@/services/api'

interface AdminUser {
  id: string
  full_name?: string | null
  email: string
  role: string
  created_at: string
  is_active: boolean
}
interface AdminUsersResponse { items: AdminUser[]; total: number; limit: number; offset: number }
const PAGE_SIZE = 25

export function AdminUsers() {
  const [items, setItems] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiFetch<AdminUsersResponse>(`/admin/users?limit=${PAGE_SIZE}&offset=${offset}`)
      setItems(result.items)
      setTotal(result.total)
      setError(null)
    } catch (err) {
      setItems([])
      setError(err instanceof ApiError ? err.message : 'Could not load users. Please try again.')
    } finally { setLoading(false) }
  }, [offset])

  useEffect(() => { void load() }, [load])

  async function handleDelete(id: string) {
    setDeleting(true)
    setDeleteError(null)
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' })
      setConfirmDeleteId(null)
      await load()
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete user.')
    } finally {
      setDeleting(false)
    }
  }

  const userToDelete = confirmDeleteId ? items.find((u) => u.id === confirmDeleteId) : null

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-text-primary">Users</h1>
        <p className="mt-1 text-sm text-text-muted">Registered accounts from the StockIQ database.</p>
      </header>

      {error && <p role="alert" className="rounded-lg border border-loss/30 bg-loss/10 p-3 text-sm text-loss">{error}</p>}

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-surface w-full max-w-md space-y-4 rounded-xl p-6 shadow-xl">
            <h2 className="font-display text-lg font-bold text-text-primary">Delete User</h2>
            <p className="text-sm text-text-muted">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-text-primary">
                {userToDelete?.full_name || userToDelete?.email || confirmDeleteId}
              </span>
              ? This will remove all their data and cannot be undone.
            </p>
            {deleteError && (
              <p role="alert" className="rounded-lg border border-loss/30 bg-loss/10 p-3 text-sm text-loss">{deleteError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                className="btn-secondary px-4 py-2 text-sm"
                disabled={deleting}
                onClick={() => { setConfirmDeleteId(null); setDeleteError(null) }}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-loss px-4 py-2 text-sm font-medium text-white hover:bg-loss/80 disabled:opacity-50"
                disabled={deleting}
                onClick={() => void handleDelete(confirmDeleteId)}
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card-surface overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-text-muted">Loading users…</p>
        ) : items.length === 0 ? (
          <p className="p-5 text-sm text-text-muted">No registered users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-theme-subtle bg-surface-hover/30 text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-subtle">
                {items.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">{user.full_name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
                    <td className="px-4 py-3 capitalize">{user.role}</td>
                    <td className="px-4 py-3">{new Date(user.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{user.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded px-2 py-1 text-xs font-medium text-loss hover:bg-loss/10 disabled:opacity-40"
                        disabled={loading || deleting}
                        onClick={() => { setDeleteError(null); setConfirmDeleteId(user.id) }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{total ? `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}` : '0 users'}</span>
        <div className="flex gap-2">
          <button className="btn-secondary px-3 py-1.5" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>Previous</button>
          <button className="btn-secondary px-3 py-1.5" disabled={offset + PAGE_SIZE >= total || loading} onClick={() => setOffset(offset + PAGE_SIZE)}>Next</button>
        </div>
      </div>
    </section>
  )
}

export const ARENA_SESSION_STORAGE_PREFIX = 'stockiq.fno-arena.run.v1.'

export function arenaSessionStorageKey(userId: string): string {
  return `${ARENA_SESSION_STORAGE_PREFIX}${encodeURIComponent(userId)}`
}

/** Clears only F&O Arena session entries; safe to call while storage is blocked. */
export function clearArenaSessionStorage(): void {
  try {
    const storage = window.sessionStorage
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index)
      if (key?.startsWith(ARENA_SESSION_STORAGE_PREFIX)) storage.removeItem(key)
    }
  } catch {
    // Logout must continue even when session storage is unavailable.
  }
}

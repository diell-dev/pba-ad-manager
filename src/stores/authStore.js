import { create } from 'zustand'

const SESSION_KEY = 'pba_session'

// Restore session from sessionStorage (survives page refresh, cleared on tab close)
function restoreSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      const { user, accessToken } = JSON.parse(stored)
      if (accessToken) return { user, accessToken }
    }
  } catch { /* ignore corrupted data */ }
  return null
}

function saveSession(user, accessToken) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, accessToken }))
  } catch { /* ignore */ }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch { /* ignore */ }
}

const restored = restoreSession()

export const useAuthStore = create((set, get) => ({
  // ── Auth state ──
  isAuthenticated: !!restored,
  isLoading: !restored, // skip loading if we have a restored session
  user: restored?.user || null,
  accessToken: restored?.accessToken || null,
  error: null,

  // ── Actions ──
  setAuthenticated: (user, accessToken) => {
    saveSession(user, accessToken)
    set({ isAuthenticated: true, isLoading: false, user, accessToken, error: null })
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) =>
    set({ error, isLoading: false }),

  logout: () => {
    clearSession()
    set({ isAuthenticated: false, user: null, accessToken: null, error: null, isLoading: false })
  },

  getAccessToken: () => get().accessToken,
}))

import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  // ── Auth state ──
  isAuthenticated: false,
  isLoading: true,
  user: null, // { name, accessToken (encrypted ref), accounts[] }
  error: null,

  // ── Actions ──
  setAuthenticated: (user) =>
    set({ isAuthenticated: true, isLoading: false, user, error: null }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) =>
    set({ error, isLoading: false }),

  logout: () =>
    set({ isAuthenticated: false, user: null, error: null, isLoading: false }),

  // ── Check existing session ──
  checkSession: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        set({ isAuthenticated: true, user: data.user, isLoading: false })
      } else {
        set({ isAuthenticated: false, isLoading: false })
      }
    } catch {
      set({ isAuthenticated: false, isLoading: false })
    }
  },
}))

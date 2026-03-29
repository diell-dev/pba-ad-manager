import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  // ── Auth state ──
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null, // FB access token — stored in memory only, never persisted
  error: null,

  // ── Actions ──
  setAuthenticated: (user, accessToken) =>
    set({ isAuthenticated: true, isLoading: false, user, accessToken, error: null }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) =>
    set({ error, isLoading: false }),

  logout: () =>
    set({ isAuthenticated: false, user: null, accessToken: null, error: null, isLoading: false }),

  getAccessToken: () => get().accessToken,
}))

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { auth, metaData } from '@/lib/api'

export function useAuth() {
  const { isAuthenticated, isLoading, user, error, setAuthenticated, setLoading, setError, logout: storeLogout } = useAuthStore()
  const { setAccounts, selectAccount, selectedAccountId } = useAppStore()

  // Check session on mount — stateless, so this just ends loading state
  useEffect(() => {
    checkSession()
  }, [])

  // Load ad accounts when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAccounts()
    }
  }, [isAuthenticated])

  async function checkSession() {
    setLoading(true)
    try {
      const data = await auth.check()
      // If somehow we get a valid response, authenticate
      setAuthenticated(data.user || { name: 'Admin' }, data.accessToken)
    } catch {
      // Expected — stateless auth means no session to restore
      setLoading(false)
    }
  }

  async function login(username, password) {
    setLoading(true)
    setError(null)
    try {
      const data = await auth.login(username, password)
      // Store the access token in memory via the auth store
      setAuthenticated(data.user || { name: username }, data.accessToken)
    } catch (err) {
      setError(err.message || 'Login failed')
    }
  }

  async function logout() {
    try {
      await auth.logout()
    } catch { /* ignore */ }
    storeLogout()
    setAccounts([])
  }

  async function loadAccounts() {
    try {
      const accounts = await metaData.getAdAccounts()
      const formatted = accounts.map((a) => ({
        id: a.id,
        name: a.name || `Account ${a.id}`,
        currency: a.currency || 'USD',
        timezone: a.timezone_name || 'UTC',
        status: a.account_status,
      }))
      setAccounts(formatted)
      if (!selectedAccountId && formatted.length > 0) {
        selectAccount(formatted[0].id)
      }
    } catch (err) {
      console.warn('Could not load ad accounts:', err.message)
      setAccounts([])
    }
  }

  return { isAuthenticated, isLoading, user, error, login, logout }
}

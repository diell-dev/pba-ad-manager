import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Shell from '@/components/layout/Shell'
import ParticleBackground from '@/components/shared/ParticleBackground'
import Dashboard from '@/pages/Dashboard'
import Edit from '@/pages/Edit'
import Campaigns from '@/pages/Campaigns'
import Create from '@/pages/Create'
import Notifications from '@/pages/Notifications'
import Settings from '@/pages/Settings'
import Login from '@/pages/Login'
import { useAuth } from '@/hooks/useAuth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function AuthGate() {
  const { isAuthenticated, isLoading, error, login, loginDemo } = useAuth()

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-neon font-bold text-xl font-mono">P</span>
          </div>
          <p className="text-sm text-steel animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated — show login
  if (!isAuthenticated) {
    return <Login onLogin={login} onDemoLogin={loginDemo} error={error} loading={isLoading} />
  }

  // Authenticated — show app
  return (
    <>
      <ParticleBackground intensity="subtle" />
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/edit" element={<Edit />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/create" element={<Create />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthGate />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

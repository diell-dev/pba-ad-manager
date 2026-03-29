import { useState } from 'react'
import { LogIn, Play, AlertCircle } from 'lucide-react'
import ParticleBackground from '@/components/shared/ParticleBackground'

export default function Login({ onLogin, onDemoLogin, error, loading }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (username.trim() && password.trim()) {
      onLogin(username, password)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center relative overflow-hidden">
      {/* Full intensity particles for login */}
      <ParticleBackground intensity="full" />

      {/* Grid overlay */}
      <div className="pba-grid-overlay" />

      {/* Blue corner accent */}
      <div
        className="absolute top-0 left-0 w-[300px] h-[300px] z-10"
        style={{ background: '#0d06ff', clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
      />

      {/* Login card */}
      <div className="relative z-20 w-full max-w-md mx-4">
        <div className="bg-navy-light/70 backdrop-blur-2xl border border-border-glow rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-neon font-bold text-2xl font-mono">P</span>
            </div>
            <h1 className="text-2xl font-extrabold">
              PBA <span className="text-neon">Ad Manager</span>
            </h1>
            <p className="text-sm text-steel mt-1">Polar Bear Agency — Meta Ads Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-steel block mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-navy/60 border border-border-glow rounded-xl px-4 py-3 text-sm text-white placeholder-steel/40 focus:outline-none focus:border-neon/30 focus:ring-1 focus:ring-neon/20 transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-steel block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-navy/60 border border-border-glow rounded-xl px-4 py-3 text-sm text-white placeholder-steel/40 focus:outline-none focus:border-neon/30 focus:ring-1 focus:ring-neon/20 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/10 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full flex items-center justify-center gap-2 bg-neon text-navy font-bold rounded-xl px-4 py-3 hover:bg-neon/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border-glow" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-steel/40">or</span>
              <div className="flex-1 h-px bg-border-glow" />
            </div>

            {/* Demo login */}
            <button
              type="button"
              onClick={onDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-transparent border border-neon/20 text-neon font-semibold rounded-xl px-4 py-3 hover:bg-neon/5 hover:border-neon/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              <Play size={14} />
              Enter Demo Mode
            </button>
          </form>

          {/* PBA watermark */}
          <div className="text-center mt-8">
            <span className="text-[9px] font-mono uppercase tracking-[4px] text-steel/20 leading-relaxed">
              Polar Bear Agency
            </span>
          </div>
        </div>
      </div>

      {/* Bottom corner accent */}
      <div
        className="absolute bottom-0 right-0 w-[200px] h-[200px] z-10"
        style={{ background: '#0d06ff', clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
      />
    </div>
  )
}

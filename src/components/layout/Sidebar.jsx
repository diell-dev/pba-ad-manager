import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Sparkles,
  Megaphone,
  PlusCircle,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Settings,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'
import { NAV_TABS } from '@/utils/constants'

const ICON_MAP = {
  LayoutDashboard,
  Sparkles,
  Megaphone,
  PlusCircle,
  Bell,
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar, alertCounts } = useAppStore()
  const { logout } = useAuthStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r transition-all duration-200 ease-in-out',
        'bg-navy-light/80 backdrop-blur-xl border-border-glow',
        sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* ── Logo area ── */}
      <div className="flex items-center h-16 px-4 border-b border-border-glow">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center flex-shrink-0">
            <span className="text-neon font-bold text-sm font-mono">P</span>
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-up">
              <h1 className="text-sm font-bold tracking-wide text-white">
                PBA <span className="text-neon">Ad Manager</span>
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_TABS.map((tab) => {
          const Icon = ICON_MAP[tab.icon]
          const isActive = location.pathname === tab.path
          const isNotifications = tab.id === 'notifications'
          const totalAlerts = alertCounts.critical + alertCounts.warning

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group',
                isActive
                  ? 'bg-neon/10 text-neon'
                  : 'text-steel hover:text-white hover:bg-white/5'
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-neon rounded-r-full" />
              )}

              <Icon size={20} className="flex-shrink-0" />

              {!sidebarCollapsed && (
                <span className="animate-fade-up">{tab.label}</span>
              )}

              {/* Notification badge */}
              {isNotifications && totalAlerts > 0 && (
                <span
                  className={cn(
                    'flex items-center justify-center text-[10px] font-bold rounded-full',
                    sidebarCollapsed
                      ? 'absolute top-0.5 right-0.5 w-4 h-4'
                      : 'ml-auto w-5 h-5',
                    alertCounts.critical > 0
                      ? 'bg-red-500 text-white'
                      : 'bg-amber-500 text-navy'
                  )}
                >
                  {totalAlerts > 9 ? '9+' : totalAlerts}
                </span>
              )}

              {/* Tooltip when collapsed */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-navy-elevated rounded-md text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg border border-border-glow z-50">
                  {tab.label}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Bottom section ── */}
      <div className="p-3 border-t border-border-glow space-y-1">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-steel hover:text-white hover:bg-white/5 transition-colors"
        >
          <Settings size={20} className="flex-shrink-0" />
          {!sidebarCollapsed && <span>Settings</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-steel hover:text-white hover:bg-white/5 transition-colors"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={20} className="flex-shrink-0" />
          ) : (
            <>
              <PanelLeftClose size={20} className="flex-shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-steel hover:text-red-400 hover:bg-red-400/5 transition-colors"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* ── PBA watermark ── */}
      {!sidebarCollapsed && (
        <div className="px-4 pb-3 text-center">
          <span className="text-[9px] font-mono uppercase tracking-[4px] text-steel/30 leading-relaxed">
            Polar<br />Bear
          </span>
        </div>
      )}
    </aside>
  )
}

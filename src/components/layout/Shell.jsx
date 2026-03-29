import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/utils/cn'

export default function Shell() {
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="min-h-screen bg-navy relative">
      {/* PBA grid overlay */}
      <div className="pba-grid-overlay" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-200 ease-in-out min-h-screen',
          sidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]'
        )}
      >
        <TopBar />
        <main className="p-6 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

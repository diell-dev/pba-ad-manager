import { create } from 'zustand'
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { DEFAULT_THRESHOLDS } from '@/utils/constants'

export const useAppStore = create((set, get) => ({
  // ── Sidebar ──
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // ── Active tab ──
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Client / Ad Account selector ──
  accounts: [], // { id, name, currency, timezone }
  selectedAccountId: null,
  setAccounts: (accounts) => set({ accounts }),
  selectAccount: (id) => set({ selectedAccountId: id }),
  get selectedAccount() {
    const state = get()
    return state.accounts.find((a) => a.id === state.selectedAccountId) || null
  },

  // ── Date range ──
  datePreset: 'last7',
  dateRange: {
    start: startOfDay(subDays(new Date(), 7)),
    end: endOfDay(new Date()),
  },
  comparePrevious: false,
  setDatePreset: (preset) => {
    const now = new Date()
    let start, end

    switch (preset) {
      case 'today':
        start = startOfDay(now)
        end = endOfDay(now)
        break
      case 'yesterday':
        start = startOfDay(subDays(now, 1))
        end = endOfDay(subDays(now, 1))
        break
      case 'last7':
        start = startOfDay(subDays(now, 7))
        end = endOfDay(now)
        break
      case 'last30':
        start = startOfDay(subDays(now, 30))
        end = endOfDay(now)
        break
      case 'thisMonth':
        start = startOfMonth(now)
        end = endOfDay(now)
        break
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1))
        end = endOfMonth(subMonths(now, 1))
        break
      default:
        return
    }

    set({ datePreset: preset, dateRange: { start, end } })
  },
  setCustomDateRange: (start, end) =>
    set({ datePreset: 'custom', dateRange: { start, end } }),
  toggleCompare: () => set((s) => ({ comparePrevious: !s.comparePrevious })),

  // ── Notification thresholds (configurable) ──
  thresholds: DEFAULT_THRESHOLDS,
  updateThreshold: (key, values) =>
    set((s) => ({
      thresholds: {
        ...s.thresholds,
        [key]: { ...s.thresholds[key], ...values },
      },
    })),

  // ── Notification counts (for badge) ──
  alertCounts: { critical: 0, warning: 0 },
  setAlertCounts: (counts) => set({ alertCounts: counts }),
}))

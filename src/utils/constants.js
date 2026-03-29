// ── Navigation tabs ──
export const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/' },
  { id: 'edit', label: 'Edit', icon: 'Sparkles', path: '/edit' },
  { id: 'campaigns', label: 'Campaigns', icon: 'Megaphone', path: '/campaigns' },
  { id: 'create', label: 'Create', icon: 'PlusCircle', path: '/create' },
  { id: 'notifications', label: 'Notifications', icon: 'Bell', path: '/notifications' },
]

// ── Date range presets ──
export const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last7' },
  { label: 'Last 30 Days', value: 'last30' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'Custom', value: 'custom' },
]

// ── Notification severity levels ──
export const SEVERITY = {
  OK: 'ok',
  WARNING: 'warning',
  CRITICAL: 'critical',
}

// ── Default notification thresholds ──
export const DEFAULT_THRESHOLDS = {
  frequency: { warning: 3, critical: 5 },
  cprSpike: { warning: 30, critical: 50 }, // % above 7-day avg
  cpcSpike: { warning: 40 },
  ctrDrop: { warning: 25 }, // % decline
  convRateDrop: { warning: 30 },
  budgetPacing: { warning: 15 }, // % overspend
  underspend: { warning: 50, critical: 25 }, // % of daily budget
  learningPhase: { warning: 5 }, // days stuck
  noDelivery: { critical: 48 }, // hours
  creativeFatigue: { warning: 3 }, // frequency + declining CTR
  audienceOverlap: { warning: 30 }, // % overlap
  audienceSaturation: { warning: 70 }, // % reached
  smallAudience: { warning: 1000 }, // estimated reach
  budgetExhausted: { warning: 15 }, // hour of day (3pm = 15)
  lifetimeBudget: { warning: 10 }, // % remaining
  pixelNoEvents: { critical: 24 }, // hours
  highBounce: { warning: 80 }, // % bounce rate
  campaignEnding: { warning: 3 }, // days remaining
  spendAnomaly: { warning: 2 }, // std deviations
}

// ── Meta API config ──
export const META_API_VERSION = 'v21.0'
export const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

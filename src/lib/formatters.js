// ── Number formatting ──
export function formatCurrency(value, opts = {}) {
  const { compact = true, currency = 'USD' } = opts
  if (value === null || value === undefined) return '—'

  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value, opts = {}) {
  const { compact = true, decimals = 1 } = opts
  if (value === null || value === undefined) return '—'

  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: decimals,
    }).format(value)
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatROAS(value) {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(2)}x`
}

// ── Date formatting ──
export function formatDateRange(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const opts = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

// ── Date preset mapping (app store → Meta API) ──
// Returns { metaPreset, since, until } for use in Meta API calls
import { format } from 'date-fns'

export function getMetaDateParams(datePreset, dateRange) {
  // Map our preset names to Meta API date_preset values
  const PRESET_MAP = {
    today: 'today',
    yesterday: 'yesterday',
    last7: 'last_7d',
    last30: 'last_30d',
    thisMonth: 'this_month',
    lastMonth: 'last_month',
  }

  const metaPreset = PRESET_MAP[datePreset] || 'last_7d'

  // Also provide since/until for APIs that use time_range
  const since = format(dateRange.start, 'yyyy-MM-dd')
  const until = format(dateRange.end, 'yyyy-MM-dd')

  return { metaPreset, since, until }
}

// Returns the display label for the current date preset
export function getDatePresetLabel(datePreset, dateRange) {
  const labels = {
    today: 'Today',
    yesterday: 'Yesterday',
    last7: 'Last 7 days',
    last30: 'Last 30 days',
    thisMonth: 'This month',
    lastMonth: 'Last month',
  }
  if (datePreset === 'custom') return formatDateRange(dateRange.start, dateRange.end)
  return labels[datePreset] || 'Last 7 days'
}

// ── Change indicator ──
export function getChangeColor(value) {
  if (value > 0) return 'text-neon'
  if (value < 0) return 'text-red-400'
  return 'text-steel'
}

export function getChangeArrow(value) {
  if (value > 0) return '▲'
  if (value < 0) return '▼'
  return '–'
}

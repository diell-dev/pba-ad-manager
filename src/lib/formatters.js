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

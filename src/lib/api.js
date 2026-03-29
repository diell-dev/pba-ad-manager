// ── Fetch wrapper for Netlify Functions ──

const BASE = '/.netlify/functions'

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function request(endpoint, options = {}) {
  const { method = 'GET', body, params } = options

  let url = `${BASE}/${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) searchParams.set(k, v)
    })
    url += `?${searchParams.toString()}`
  }

  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  }

  if (body) fetchOptions.body = JSON.stringify(body)

  const res = await fetch(url, fetchOptions)

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(data.error || `Request failed: ${res.status}`, res.status, data)
  }

  return res.json()
}

// ── Auth ──
export const auth = {
  check: () => request('auth', { method: 'POST', body: { action: 'check' } }),
  login: (username, password) =>
    request('auth', { method: 'POST', body: { action: 'login', username, password } }),
  logout: () => request('auth', { method: 'POST', body: { action: 'logout' } }),
}

// ── Meta API proxy ──
export const meta = {
  get: (path, params = {}) =>
    request('meta-api', { params: { path, ...params } }),
  post: (path, body = {}) =>
    request('meta-api', { method: 'POST', body: { path, ...body } }),
}

// ── AI (Claude) ──
export const ai = {
  edit: (prompt, context) =>
    request('ai-edit', { method: 'POST', body: { prompt, context } }),
  parseStrategy: (documentText) =>
    request('ai-parse-strategy', { method: 'POST', body: { documentText } }),
}

// ── High-level Meta data fetchers ──
export const metaData = {
  // Get all ad accounts the user has access to
  getAdAccounts: async () => {
    const res = await meta.get('me/adaccounts', {
      fields: 'id,name,currency,timezone_name,account_status',
      limit: '50',
    })
    return res.data || []
  },

  // Get campaigns for an ad account within a date range
  getCampaigns: async (accountId, dateRange, statusFilter = 'active') => {
    const params = {
      fields: [
        'id', 'name', 'status', 'objective', 'daily_budget', 'lifetime_budget',
        'start_time', 'stop_time', 'created_time',
        'insights.date_preset(last_7d){spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type,frequency,reach}',
      ].join(','),
      limit: '100',
    }

    if (statusFilter === 'active') {
      params.effective_status = '["ACTIVE"]'
    } else if (statusFilter === 'paused') {
      params.effective_status = '["PAUSED"]'
    }

    const res = await meta.get(`${accountId}/campaigns`, params)
    return res.data || []
  },

  // Get ad sets for a campaign
  getAdSets: async (campaignId) => {
    const res = await meta.get(`${campaignId}/adsets`, {
      fields: [
        'id', 'name', 'status', 'daily_budget', 'lifetime_budget', 'bid_amount',
        'targeting', 'optimization_goal', 'billing_event',
        'insights.date_preset(last_7d){spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type,frequency,reach}',
      ].join(','),
      limit: '100',
    })
    return res.data || []
  },

  // Get ads for an ad set
  getAds: async (adSetId) => {
    const res = await meta.get(`${adSetId}/ads`, {
      fields: [
        'id', 'name', 'status', 'creative{id,title,body,thumbnail_url,image_url,video_id}',
        'insights.date_preset(last_7d){spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type,frequency}',
      ].join(','),
      limit: '100',
    })
    return res.data || []
  },

  // Get account-level insights with daily breakdown (for sparklines)
  getAccountInsights: async (accountId, since, until) => {
    const res = await meta.get(`${accountId}/insights`, {
      fields: 'spend,impressions,clicks,actions,cost_per_action_type,frequency,reach,ctr,cpc',
      time_range: JSON.stringify({ since, until }),
      time_increment: '1',
      limit: '90',
    })
    return res.data || []
  },

  // Get campaign insights with daily breakdown
  getCampaignInsights: async (campaignId, since, until) => {
    const res = await meta.get(`${campaignId}/insights`, {
      fields: 'spend,impressions,clicks,actions,cost_per_action_type,frequency,reach,ctr,cpc',
      time_range: JSON.stringify({ since, until }),
      time_increment: '1',
      limit: '90',
    })
    return res.data || []
  },
}

// ── Fetch wrapper for Netlify Functions ──
import { useAuthStore } from '@/stores/authStore'

const BASE = '/.netlify/functions'

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function request(endpoint, options = {}) {
  const { method = 'POST', body } = options

  const url = `${BASE}/${endpoint}`

  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }

  if (body) fetchOptions.body = JSON.stringify(body)

  const res = await fetch(url, fetchOptions)

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(data.error || `Request failed: ${res.status}`, res.status, data)
  }

  return res.json()
}

// Helper to get the current access token from the auth store
function getToken() {
  return useAuthStore.getState().accessToken
}

// ── Auth ──
export const auth = {
  check: () => request('auth', { body: { action: 'check' } }),
  login: (username, password) =>
    request('auth', { body: { action: 'login', username, password } }),
  logout: () => request('auth', { body: { action: 'logout' } }),
}

// ── Meta API proxy ──
// All requests go as POST to the serverless function with token + endpoint in body
export const meta = {
  get: (path, params = {}) =>
    request('meta-api', {
      body: {
        accessToken: getToken(),
        endpoint: `/${path}`,
        method: 'GET',
        params,
      },
    }),
  post: (path, params = {}) =>
    request('meta-api', {
      body: {
        accessToken: getToken(),
        endpoint: `/${path}`,
        method: 'POST',
        params,
      },
    }),
}

// ── AI (Claude) ──
export const ai = {
  edit: (prompt, context) =>
    request('ai-edit', { body: { prompt, context } }),
  parseStrategy: (documentText) =>
    request('ai-parse-strategy', { body: { documentText } }),
}

// ── High-level Meta data fetchers ──
export const metaData = {
  getAdAccounts: async () => {
    const res = await meta.get('me/adaccounts', {
      fields: 'id,name,currency,timezone_name,account_status',
      limit: '50',
    })
    return res.data || []
  },

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

  getAccountInsights: async (accountId, since, until) => {
    const res = await meta.get(`${accountId}/insights`, {
      fields: 'spend,impressions,clicks,actions,cost_per_action_type,frequency,reach,ctr,cpc',
      time_range: JSON.stringify({ since, until }),
      time_increment: '1',
      limit: '90',
    })
    return res.data || []
  },

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

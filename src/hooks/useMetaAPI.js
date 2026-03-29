import { useQuery } from '@tanstack/react-query'
import { metaData } from '@/lib/api'
import { useAppStore } from '@/stores/appStore'
import { format } from 'date-fns'

// ── Ad Accounts ──
export function useAdAccounts() {
  return useQuery({
    queryKey: ['adAccounts'],
    queryFn: metaData.getAdAccounts,
    staleTime: 5 * 60 * 1000, // 5 min
  })
}

// ── Campaigns for selected account ──
export function useCampaigns(statusFilter = 'active') {
  const { selectedAccountId, dateRange } = useAppStore()

  return useQuery({
    queryKey: ['campaigns', selectedAccountId, statusFilter, dateRange.start?.toISOString()],
    queryFn: () => metaData.getCampaigns(selectedAccountId, dateRange, statusFilter),
    enabled: !!selectedAccountId,
    staleTime: 60 * 1000,
  })
}

// ── All campaigns (any status) for a given account ──
export function useAllCampaigns() {
  const { selectedAccountId, dateRange } = useAppStore()

  return useQuery({
    queryKey: ['allCampaigns', selectedAccountId, dateRange.start?.toISOString()],
    queryFn: () => metaData.getCampaigns(selectedAccountId, dateRange, 'all'),
    enabled: !!selectedAccountId,
    staleTime: 60 * 1000,
  })
}

// ── Ad Sets for a campaign ──
export function useAdSets(campaignId) {
  return useQuery({
    queryKey: ['adSets', campaignId],
    queryFn: () => metaData.getAdSets(campaignId),
    enabled: !!campaignId,
    staleTime: 60 * 1000,
  })
}

// ── Ads for an ad set ──
export function useAds(adSetId) {
  return useQuery({
    queryKey: ['ads', adSetId],
    queryFn: () => metaData.getAds(adSetId),
    enabled: !!adSetId,
    staleTime: 60 * 1000,
  })
}

// ── Account-level daily insights (for sparklines) ──
export function useAccountInsights() {
  const { selectedAccountId, dateRange } = useAppStore()
  const since = dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : null
  const until = dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : null

  return useQuery({
    queryKey: ['accountInsights', selectedAccountId, since, until],
    queryFn: () => metaData.getAccountInsights(selectedAccountId, since, until),
    enabled: !!selectedAccountId && !!since && !!until,
    staleTime: 60 * 1000,
  })
}

// ── Campaign daily insights ──
export function useCampaignInsights(campaignId) {
  const { dateRange } = useAppStore()
  const since = dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : null
  const until = dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : null

  return useQuery({
    queryKey: ['campaignInsights', campaignId, since, until],
    queryFn: () => metaData.getCampaignInsights(campaignId, since, until),
    enabled: !!campaignId && !!since && !!until,
    staleTime: 60 * 1000,
  })
}

// ── Helper: extract result count from Meta actions array ──
export function extractResults(insights) {
  if (!insights?.actions) return 0
  // Priority: purchases > leads > link_clicks > landing_page_views
  const priority = ['offsite_conversion.fb_pixel_purchase', 'lead', 'link_click', 'landing_page_view']
  for (const action of priority) {
    const found = insights.actions.find((a) => a.action_type === action)
    if (found) return parseInt(found.value, 10)
  }
  // Fallback: sum all actions
  return insights.actions.reduce((sum, a) => sum + parseInt(a.value, 10), 0)
}

// ── Helper: extract cost per result ──
export function extractCPR(insights) {
  if (!insights?.cost_per_action_type) return null
  const priority = ['offsite_conversion.fb_pixel_purchase', 'lead', 'link_click', 'landing_page_view']
  for (const action of priority) {
    const found = insights.cost_per_action_type.find((a) => a.action_type === action)
    if (found) return parseFloat(found.value)
  }
  return null
}

// ── Helper: calculate ROAS from insights ──
export function calculateROAS(insights) {
  if (!insights?.actions || !insights?.spend) return null
  const purchaseValue = insights.actions.find(
    (a) => a.action_type === 'offsite_conversion.fb_pixel_purchase'
  )
  if (!purchaseValue) return null
  const spend = parseFloat(insights.spend)
  if (spend === 0) return null
  // This is a simplified ROAS — real ROAS needs purchase_roas or conversion_values
  return null // Will be calculated from actual conversion values when available
}

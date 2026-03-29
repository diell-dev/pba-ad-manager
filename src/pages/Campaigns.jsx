import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Download, Pause, Play, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import StatusDot from '@/components/shared/StatusDot'
import { useAppStore } from '@/stores/appStore'
import { meta } from '@/lib/api'
import { getMetaDateParams } from '@/lib/formatters'

const FILTERS = ['Active', 'Paused', 'All']

// ── Hook to fetch real campaigns from selected account ──
function useRealCampaigns(statusFilter) {
  const { selectedAccountId, datePreset, dateRange } = useAppStore()
  const { metaPreset } = getMetaDateParams(datePreset, dateRange)

  return useQuery({
    queryKey: ['campaigns', selectedAccountId, statusFilter, datePreset],
    queryFn: async () => {
      const params = {
        fields: [
          'id', 'name', 'status', 'objective', 'daily_budget', 'lifetime_budget',
          `insights.date_preset(${metaPreset}){spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type,frequency,reach}`,
        ].join(','),
        limit: '100',
      }

      if (statusFilter === 'Active') {
        params.effective_status = '["ACTIVE"]'
      } else if (statusFilter === 'Paused') {
        params.effective_status = '["PAUSED"]'
      }

      const res = await meta.get(`${selectedAccountId}/campaigns`, params)
      const campaigns = res.data || []

      return campaigns.map((c) => {
        const insights = c.insights?.data?.[0] || {}
        const spend = parseFloat(insights.spend || 0)
        const frequency = parseFloat(insights.frequency || 0)

        // Extract result count
        let results = 0
        let resultLabel = 'results'
        if (insights.actions) {
          const priority = [
            { type: 'offsite_conversion.fb_pixel_purchase', label: 'purchases' },
            { type: 'lead', label: 'leads' },
            { type: 'link_click', label: 'clicks' },
            { type: 'landing_page_view', label: 'views' },
          ]
          for (const { type, label } of priority) {
            const found = insights.actions.find((a) => a.action_type === type)
            if (found) {
              results = parseInt(found.value, 10)
              resultLabel = label
              break
            }
          }
        }

        // Extract cost per result
        let cpr = null
        if (insights.cost_per_action_type) {
          const priority = ['offsite_conversion.fb_pixel_purchase', 'lead', 'link_click']
          for (const type of priority) {
            const found = insights.cost_per_action_type.find((a) => a.action_type === type)
            if (found) {
              cpr = parseFloat(found.value)
              break
            }
          }
        }

        const budget = c.daily_budget
          ? `$${(parseInt(c.daily_budget, 10) / 100).toFixed(0)}/day`
          : c.lifetime_budget
            ? `$${(parseInt(c.lifetime_budget, 10) / 100).toFixed(0)} lifetime`
            : '—'

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective || '—',
          budget,
          spend: `$${spend.toFixed(2)}`,
          results: `${results} ${resultLabel}`,
          cpr: cpr ? `$${cpr.toFixed(2)}` : '—',
          roas: '—', // Would need conversion values
          frequency: frequency.toFixed(1),
        }
      })
    },
    enabled: !!selectedAccountId,
    staleTime: 60 * 1000,
  })
}

export default function Campaigns() {
  const [activeFilter, setActiveFilter] = useState('Active')
  const [search, setSearch] = useState('')
  const { data: campaigns, isLoading, isError } = useRealCampaigns(activeFilter)

  const filtered = (campaigns || []).filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Campaigns</h2>
          <p className="text-sm text-steel mt-1">Live campaigns from your Meta ad account</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-navy-light/60 border border-border-glow rounded-lg text-sm text-steel hover:text-white hover:border-border-hover transition-colors">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-navy-light/40 border border-border-glow rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                activeFilter === f
                  ? 'bg-neon/10 text-neon'
                  : 'text-steel hover:text-white'
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="bg-navy-light/40 border border-border-glow rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-steel/40 focus:outline-none focus:border-neon/30 w-64"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-steel">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading campaigns from Meta...
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="px-5 py-8 text-center text-amber-400 text-sm bg-amber-400/5 border border-amber-400/10 rounded-xl">
          Could not load campaigns. The API might be rate-limited or the token expired. Showing cached data if available.
        </div>
      )}

      {/* Campaign table */}
      {!isLoading && (
        <div className="bg-navy-light/40 border border-border-glow rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_100px_100px_100px_100px_80px_80px_40px] gap-4 px-5 py-3 border-b border-border-glow text-[10px] font-mono uppercase tracking-wider text-steel/60">
            <span>Campaign</span>
            <span className="text-right">Budget</span>
            <span className="text-right">Spend</span>
            <span className="text-right">Results</span>
            <span className="text-right">Cost/Result</span>
            <span className="text-right">ROAS</span>
            <span className="text-right">Freq</span>
            <span />
          </div>

          {/* Table rows */}
          {filtered.map((campaign) => (
            <button
              key={campaign.id}
              className="w-full grid grid-cols-[1fr_100px_100px_100px_100px_80px_80px_40px] gap-4 px-5 py-4 border-b border-border-glow/50 hover:bg-white/[0.02] transition-colors items-center text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {campaign.status === 'ACTIVE' ? (
                    <Play size={12} className="text-emerald-400" fill="currentColor" />
                  ) : (
                    <Pause size={12} className="text-steel/40" fill="currentColor" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-neon transition-colors">
                    {campaign.name}
                  </div>
                  <div className="text-[10px] text-steel/60 font-mono">{campaign.objective}</div>
                </div>
              </div>
              <span className="text-sm text-steel text-right">{campaign.budget}</span>
              <span className="text-sm text-white font-medium text-right">{campaign.spend}</span>
              <span className="text-sm text-white text-right">{campaign.results}</span>
              <span className="text-sm text-steel text-right">{campaign.cpr}</span>
              <span className="text-sm text-neon font-medium text-right">{campaign.roas}</span>
              <span className={cn(
                'text-sm font-medium text-right',
                parseFloat(campaign.frequency) > 4 ? 'text-red-400' :
                parseFloat(campaign.frequency) > 3 ? 'text-amber-400' : 'text-steel'
              )}>
                {campaign.frequency}
              </span>
              <ChevronRight size={14} className="text-steel/30 group-hover:text-neon/60 transition-colors ml-auto" />
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-steel text-sm">
              No campaigns found matching your filters.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

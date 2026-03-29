import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight, ChevronDown, Play, Pause, DollarSign, MousePointerClick, Eye, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import MetricCard from '@/components/shared/MetricCard'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { meta } from '@/lib/api'
import { format, subDays } from 'date-fns'

// ── Fetch campaigns with insights for a specific account ──
function useAccountCampaigns(accountId) {

  return useQuery({
    queryKey: ['accountCampaigns', accountId],
    queryFn: async () => {
      const res = await meta.get(`${accountId}/campaigns`, {
        fields: [
          'id', 'name', 'status', 'objective', 'daily_budget',
          'insights.date_preset(last_7d){spend,impressions,clicks,actions,cost_per_action_type,frequency,reach}',
        ].join(','),
        effective_status: '["ACTIVE","PAUSED"]',
        limit: '50',
      })

      return (res.data || []).map((c) => {
        const ins = c.insights?.data?.[0] || {}
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          spend: `$${parseFloat(ins.spend || 0).toFixed(2)}`,
          results: extractResultString(ins),
          cpr: extractCPRString(ins),
          frequency: parseFloat(ins.frequency || 0).toFixed(1),
          adSets: [], // loaded on expand
        }
      })
    },
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000,
  })
}

// ── Fetch ad sets for a campaign ──
function useAdSetsForCampaign(campaignId) {

  return useQuery({
    queryKey: ['adSets', campaignId],
    queryFn: async () => {
      const res = await meta.get(`${campaignId}/adsets`, {
        fields: [
          'id', 'name', 'status', 'daily_budget',
          'insights.date_preset(last_7d){spend,impressions,clicks,actions,cost_per_action_type,frequency,reach}',
        ].join(','),
        limit: '50',
      })

      return (res.data || []).map((as) => {
        const ins = as.insights?.data?.[0] || {}
        return {
          id: as.id,
          name: as.name,
          status: as.status,
          spend: `$${parseFloat(ins.spend || 0).toFixed(2)}`,
          results: extractResultString(ins),
          cpr: extractCPRString(ins),
          frequency: parseFloat(ins.frequency || 0).toFixed(1),
        }
      })
    },
    enabled: !!campaignId,
    staleTime: 2 * 60 * 1000,
  })
}

// ── Fetch ads for an ad set ──
function useAdsForAdSet(adSetId) {

  return useQuery({
    queryKey: ['ads', adSetId],
    queryFn: async () => {
      const res = await meta.get(`${adSetId}/ads`, {
        fields: [
          'id', 'name', 'status',
          'insights.date_preset(last_7d){spend,impressions,clicks,ctr,actions,cost_per_action_type,frequency}',
        ].join(','),
        limit: '50',
      })

      return (res.data || []).map((ad) => {
        const ins = ad.insights?.data?.[0] || {}
        return {
          id: ad.id,
          name: ad.name,
          status: ad.status,
          spend: `$${parseFloat(ins.spend || 0).toFixed(2)}`,
          results: extractResultString(ins),
          cpr: extractCPRString(ins),
          ctr: ins.ctr ? `${parseFloat(ins.ctr).toFixed(2)}%` : '—',
        }
      })
    },
    enabled: !!adSetId,
    staleTime: 2 * 60 * 1000,
  })
}

// ── Fetch daily insights for the chart ──
function useAccountDailyInsights(accountId) {
  const token = useAuthStore.getState().accessToken
  const since = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  const until = format(new Date(), 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['accountDaily', accountId, since, until],
    queryFn: async () => {
      const res = await meta.get(`${accountId}/insights`, {
        fields: 'spend,impressions,clicks,actions,frequency,reach',
        time_range: JSON.stringify({ since, until }),
        time_increment: '1',
        limit: '7',
      })
      return (res.data || []).map((day) => ({
        date: format(new Date(day.date_start), 'MMM dd'),
        spend: parseFloat(day.spend || 0),
        clicks: parseInt(day.clicks || 0, 10),
        impressions: parseInt(day.impressions || 0, 10),
      }))
    },
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000,
  })
}

// ── Helpers ──
function extractResultString(ins) {
  if (!ins.actions) return '0'
  const priority = [
    { type: 'offsite_conversion.fb_pixel_purchase', label: 'purchases' },
    { type: 'lead', label: 'leads' },
    { type: 'link_click', label: 'clicks' },
    { type: 'landing_page_view', label: 'views' },
  ]
  for (const { type, label } of priority) {
    const found = ins.actions.find((a) => a.action_type === type)
    if (found) return `${found.value} ${label}`
  }
  return '0'
}

function extractCPRString(ins) {
  if (!ins.cost_per_action_type) return '—'
  const priority = ['offsite_conversion.fb_pixel_purchase', 'lead', 'link_click']
  for (const type of priority) {
    const found = ins.cost_per_action_type.find((a) => a.action_type === type)
    if (found) return `$${parseFloat(found.value).toFixed(2)}`
  }
  return '—'
}

// ── Ad Row ──
function AdRow({ ad }) {
  return (
    <div className="grid grid-cols-[1fr_90px_90px_80px_70px] gap-3 px-4 py-2.5 text-xs items-center hover:bg-white/[0.02]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-navy-elevated border border-border-glow flex items-center justify-center text-[10px] text-steel">AD</div>
        <span className="text-steel">{ad.name}</span>
      </div>
      <span className="text-white text-right">{ad.spend}</span>
      <span className="text-white text-right">{ad.results}</span>
      <span className="text-steel text-right">{ad.cpr}</span>
      <span className="text-steel text-right">{ad.ctr}</span>
    </div>
  )
}

// ── AdSet Row (expandable → ads) ──
function AdSetRow({ adSet }) {
  const [expanded, setExpanded] = useState(false)
  const { data: ads, isLoading } = useAdsForAdSet(expanded ? adSet.id : null)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-[1fr_90px_90px_80px_70px] gap-3 px-4 py-3 text-sm items-center hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <ChevronRight size={14} className={cn('text-steel/40 transition-transform', expanded && 'rotate-90')} />
          <span className="text-white">{adSet.name}</span>
        </div>
        <span className="text-white text-right">{adSet.spend}</span>
        <span className="text-white text-right">{adSet.results}</span>
        <span className="text-steel text-right">{adSet.cpr}</span>
        <span className={cn(
          'text-right font-medium',
          parseFloat(adSet.frequency) > 4 ? 'text-red-400' :
          parseFloat(adSet.frequency) > 3 ? 'text-amber-400' : 'text-steel'
        )}>
          {adSet.frequency}
        </span>
      </button>
      {expanded && (
        <div className="ml-6 border-l border-border-glow/30">
          {isLoading ? (
            <div className="px-4 py-3 text-xs text-steel flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Loading ads...
            </div>
          ) : ads?.length > 0 ? (
            ads.map((ad) => <AdRow key={ad.id} ad={ad} />)
          ) : (
            <div className="px-4 py-3 text-xs text-steel/40">No ads in this ad set</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Campaign Row (expandable → adsets) ──
function CampaignRow({ campaign }) {
  const [expanded, setExpanded] = useState(false)
  const { data: adSets, isLoading } = useAdSetsForCampaign(expanded ? campaign.id : null)

  return (
    <div className="border-b border-border-glow/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-[1fr_90px_90px_80px_70px] gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors text-left group"
      >
        <div className="flex items-center gap-3">
          <ChevronRight size={16} className={cn('text-steel/40 transition-transform', expanded && 'rotate-90')} />
          {campaign.status === 'ACTIVE' ? (
            <Play size={12} className="text-emerald-400" fill="currentColor" />
          ) : (
            <Pause size={12} className="text-steel/40" fill="currentColor" />
          )}
          <span className="text-sm font-medium text-white group-hover:text-neon transition-colors">
            {campaign.name}
          </span>
        </div>
        <span className="text-sm text-white font-medium text-right">{campaign.spend}</span>
        <span className="text-sm text-white text-right">{campaign.results}</span>
        <span className="text-sm text-steel text-right">{campaign.cpr}</span>
        <span className={cn(
          'text-sm text-right font-medium',
          parseFloat(campaign.frequency) > 4 ? 'text-red-400' :
          parseFloat(campaign.frequency) > 3 ? 'text-amber-400' : 'text-steel'
        )}>
          {campaign.frequency}
        </span>
      </button>
      {expanded && (
        <div className="bg-navy/20">
          <div className="grid grid-cols-[1fr_90px_90px_80px_70px] gap-3 px-5 py-2 text-[10px] font-mono uppercase tracking-wider text-steel/40 border-b border-border-glow/20">
            <span className="pl-9">Ad Set</span>
            <span className="text-right">Spend</span>
            <span className="text-right">Results</span>
            <span className="text-right">CPR</span>
            <span className="text-right">Freq</span>
          </div>
          {isLoading ? (
            <div className="px-5 py-4 text-sm text-steel flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading ad sets...
            </div>
          ) : adSets?.length > 0 ? (
            adSets.map((adSet) => <AdSetRow key={adSet.id} adSet={adSet} />)
          ) : (
            <div className="px-5 py-4 text-sm text-steel/40">No ad sets in this campaign</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Chart Tooltip ──
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-elevated border border-border-glow rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] font-mono text-steel mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs">
          <span className="text-steel">{p.name}: </span>
          <span className="text-white font-medium">{p.name === 'spend' ? `$${p.value}` : p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── Main ClientDetail Component ──
export default function ClientDetail({ client, onBack }) {
  const { data: campaigns, isLoading: campaignsLoading } = useAccountCampaigns(client.id)
  const { data: chartData, isLoading: chartLoading } = useAccountDailyInsights(client.id)

  const displayCampaigns = campaigns || []
  const displayChart = chartData?.length > 0 ? chartData : []

  const summary = client.summary || {}

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} className="text-steel" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">{client.name}</h2>
          <p className="text-sm text-steel">Live data from Meta Marketing API</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Spend" value={summary.totalSpend ? `$${summary.totalSpend.toFixed(2)}` : '—'} icon={DollarSign} />
        <MetricCard label="Results" value={summary.totalResults?.toString() || '—'} icon={MousePointerClick} />
        <MetricCard label="Avg Frequency" value={summary.avgFrequency?.toString() || '—'} icon={RefreshCw} />
        <MetricCard label="Reach" value={summary.totalReach ? `${(summary.totalReach / 1000).toFixed(1)}K` : '—'} icon={Eye} />
      </div>

      {/* Chart */}
      <div className="bg-navy-light/40 border border-border-glow rounded-xl p-5">
        <h3 className="text-sm font-mono uppercase tracking-wider text-steel mb-4">Daily Performance (Last 7 Days)</h3>
        {chartLoading ? (
          <div className="flex items-center justify-center py-12 text-steel text-sm">
            <Loader2 size={16} className="animate-spin mr-2" /> Loading chart...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={displayChart}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff85" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00ff85" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#98b9ce', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#98b9ce', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="spend" stroke="#00ff85" fill="url(#spendGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Campaigns table */}
      <div className="bg-navy-light/40 border border-border-glow rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border-glow">
          <h3 className="text-sm font-mono uppercase tracking-wider text-steel">Campaigns</h3>
        </div>
        <div className="grid grid-cols-[1fr_90px_90px_80px_70px] gap-3 px-5 py-2 text-[10px] font-mono uppercase tracking-wider text-steel/40 border-b border-border-glow/50">
          <span>Campaign</span>
          <span className="text-right">Spend</span>
          <span className="text-right">Results</span>
          <span className="text-right">CPR</span>
          <span className="text-right">Freq</span>
        </div>
        {campaignsLoading ? (
          <div className="px-5 py-8 text-center text-steel text-sm flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading campaigns...
          </div>
        ) : (
          displayCampaigns.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} />
          ))
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Target, TrendingUp, Users, Loader2 } from 'lucide-react'
import MetricCard from '@/components/shared/MetricCard'
import StatusDot from '@/components/shared/StatusDot'
import ClientDetail from '@/components/dashboard/ClientDetail'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import { meta } from '@/lib/api'
import { format, subDays } from 'date-fns'

// ── Fetch campaigns + account insights for a single ad account ──
function useAccountSummary(accountId) {
  const token = useAuthStore.getState().accessToken
  const since = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  const until = format(new Date(), 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['accountSummary', accountId, since, until],
    queryFn: async () => {
      // Fetch campaigns and insights in parallel
      const [campaignsRes, insightsRes] = await Promise.all([
        meta.get(`${accountId}/campaigns`, {
          fields: 'id,name,status,objective',
          effective_status: '["ACTIVE","PAUSED"]',
          limit: '100',
        }),
        meta.get(`${accountId}/insights`, {
          fields: 'spend,impressions,clicks,actions,cost_per_action_type,frequency,reach,ctr,cpc',
          time_range: JSON.stringify({ since, until }),
          time_increment: '1',
          limit: '7',
        }),
      ])

      const campaigns = campaignsRes.data || []
      const dailyInsights = insightsRes.data || []

      // Aggregate totals
      let totalSpend = 0
      let totalResults = 0
      let totalReach = 0
      const spendTrend = []

      dailyInsights.forEach((day) => {
        const spend = parseFloat(day.spend || 0)
        totalSpend += spend
        totalReach += parseInt(day.reach || 0, 10)
        spendTrend.push(spend)

        // Extract results (purchases > leads > link_clicks)
        if (day.actions) {
          const priority = ['offsite_conversion.fb_pixel_purchase', 'lead', 'link_click', 'landing_page_view']
          for (const actionType of priority) {
            const found = day.actions.find((a) => a.action_type === actionType)
            if (found) {
              totalResults += parseInt(found.value, 10)
              break
            }
          }
        }
      })

      const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length
      const avgFrequency = dailyInsights.length > 0
        ? dailyInsights.reduce((sum, d) => sum + parseFloat(d.frequency || 0), 0) / dailyInsights.length
        : 0

      // Determine health status
      let status = 'ok'
      if (avgFrequency > 4) status = 'critical'
      else if (avgFrequency > 3) status = 'warning'

      return {
        totalSpend,
        totalResults,
        totalReach,
        activeCampaigns,
        totalCampaigns: campaigns.length,
        avgFrequency,
        status,
        spendTrend: spendTrend.length > 0 ? spendTrend : [0],
      }
    },
    enabled: !!accountId && !!token,
    staleTime: 2 * 60 * 1000,
  })
}

// ── Helpers ──
function formatMoney(val) {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`
  return `$${val.toFixed(0)}`
}

function formatNum(val) {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`
  return val.toString()
}

// ── Mini Sparkline ──
function MiniSparkline({ data, color = '#00ff85' }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const height = 28
  const id = `spark-${data.join('-')}`

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1 || 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${id})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Client Card (real data) ──
function ClientCard({ account, onClick }) {
  const { data, isLoading } = useAccountSummary(account.id)
  const hasToken = !!useAuthStore.getState().accessToken

  // If no token (demo mode), show demo data
  const summary = (!hasToken || !data) ? {
    totalSpend: Math.random() * 5000 + 500,
    totalResults: Math.floor(Math.random() * 200) + 20,
    activeCampaigns: Math.floor(Math.random() * 5) + 1,
    totalCampaigns: Math.floor(Math.random() * 8) + 2,
    status: ['ok', 'ok', 'warning', 'critical'][Math.floor(Math.random() * 4)],
    spendTrend: Array.from({ length: 7 }, () => Math.random() * 100 + 20),
    avgFrequency: (Math.random() * 3 + 1).toFixed(1),
  } : data

  const statusColor = summary.status === 'critical' ? '#ef4444' : summary.status === 'warning' ? '#f59e0b' : '#00ff85'

  return (
    <button
      onClick={() => onClick({ ...account, summary })}
      className="bg-navy-light/60 border border-border-glow rounded-xl p-5 text-left hover:border-border-hover transition-all duration-150 hover:shadow-[0_0_30px_rgba(0,255,133,0.06)] group w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusDot status={summary.status} />
            <h3 className="text-lg font-bold text-white group-hover:text-neon transition-colors">
              {account.name}
            </h3>
          </div>
          <p className="text-xs font-mono text-steel">
            {isLoading && hasToken ? (
              <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Loading...</span>
            ) : (
              `${summary.activeCampaigns || summary.totalCampaigns} active campaign${(summary.activeCampaigns || summary.totalCampaigns) !== 1 ? 's' : ''}`
            )}
          </p>
        </div>
        <MiniSparkline data={summary.spendTrend} color={statusColor} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel/60 mb-0.5">Spend</div>
          <div className="text-sm font-semibold text-white">
            {isLoading && hasToken ? '...' : formatMoney(summary.totalSpend)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel/60 mb-0.5">Results</div>
          <div className="text-sm font-semibold text-white">
            {isLoading && hasToken ? '...' : formatNum(summary.totalResults)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel/60 mb-0.5">Freq</div>
          <div className={cn(
            'text-sm font-semibold',
            parseFloat(summary.avgFrequency) > 4 ? 'text-red-400' :
            parseFloat(summary.avgFrequency) > 3 ? 'text-amber-400' : 'text-neon'
          )}>
            {isLoading && hasToken ? '...' : summary.avgFrequency}
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Dashboard Page ──
export default function Dashboard() {
  const [selectedClient, setSelectedClient] = useState(null)
  const { accounts } = useAppStore()

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
      />
    )
  }

  // Compute summary totals from visible accounts
  const totalAccounts = accounts.length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-sm text-steel mt-1">Overview of all ad accounts — click any card to drill down</p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Ad Accounts" value={totalAccounts.toString()} icon={Users} />
        <MetricCard label="Period" value="Last 7 days" icon={TrendingUp} />
        <MetricCard label="Data Source" value="Meta API" icon={Target} />
        <MetricCard label="Status" value="Live" icon={DollarSign} />
      </div>

      {/* Client grid */}
      <div>
        <h3 className="text-sm font-mono uppercase tracking-wider text-steel mb-4">
          Ad Accounts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <ClientCard
              key={account.id}
              account={account}
              onClick={setSelectedClient}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Bell, CheckCircle2, AlertTriangle, AlertOctagon, ChevronRight, Loader2 } from 'lucide-react'
import StatusDot from '@/components/shared/StatusDot'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/stores/appStore'
import { meta } from '@/lib/api'
import { DEFAULT_THRESHOLDS } from '@/utils/constants'

// ── Fetch all accounts' active campaigns with insights ──
function useAccountAlerts(accounts) {
  return useQuery({
    queryKey: ['notifications', accounts.map((a) => a.id).join(',')],
    queryFn: async () => {
      const results = []

      for (const account of accounts) {
        try {
          const res = await meta.get(`${account.id}/campaigns`, {
            fields: [
              'id', 'name', 'status', 'daily_budget',
              'insights.date_preset(last_7d){spend,impressions,clicks,actions,cost_per_action_type,frequency,reach,ctr}',
            ].join(','),
            effective_status: '["ACTIVE"]',
            limit: '50',
          })

          const campaigns = res.data || []
          const alerts = []

          for (const campaign of campaigns) {
            const ins = campaign.insights?.data?.[0]
            if (!ins) continue

            const freq = parseFloat(ins.frequency || 0)
            const ctr = parseFloat(ins.ctr || 0)
            const spend = parseFloat(ins.spend || 0)
            const dailyBudget = campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : 0

            // Frequency alerts
            if (freq >= DEFAULT_THRESHOLDS.frequency.critical) {
              alerts.push({
                severity: 'critical',
                campaign: campaign.name,
                message: `Frequency at ${freq.toFixed(1)} — creative fatigue detected`,
                metric: `Frequency: ${freq.toFixed(1)}`,
              })
            } else if (freq >= DEFAULT_THRESHOLDS.frequency.warning) {
              alerts.push({
                severity: 'warning',
                campaign: campaign.name,
                message: `Frequency at ${freq.toFixed(1)} — approaching fatigue threshold`,
                metric: `Frequency: ${freq.toFixed(1)}`,
              })
            }

            // Low CTR alert (below 1% for active campaigns with spend)
            if (spend > 0 && ctr > 0 && ctr < 1) {
              alerts.push({
                severity: 'warning',
                campaign: campaign.name,
                message: `Low CTR at ${ctr.toFixed(2)}% — consider refreshing creative`,
                metric: `CTR: ${ctr.toFixed(2)}%`,
              })
            }

            // Underspend alert
            if (dailyBudget > 0 && spend > 0) {
              const pacingPct = (spend / (dailyBudget * 7)) * 100
              if (pacingPct < DEFAULT_THRESHOLDS.underspend.critical) {
                alerts.push({
                  severity: 'critical',
                  campaign: campaign.name,
                  message: `Underspending — only ${pacingPct.toFixed(0)}% of budget used over 7 days`,
                  metric: `Pacing: ${pacingPct.toFixed(0)}%`,
                })
              }
            }

            // High CPR alert
            const actions = ins.actions || []
            const costPerAction = ins.cost_per_action_type || []
            const primaryAction = costPerAction.find(
              (a) => a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'lead' || a.action_type === 'link_click'
            )
            if (primaryAction && parseFloat(primaryAction.value) > 15) {
              alerts.push({
                severity: 'warning',
                campaign: campaign.name,
                message: `High cost per result at $${parseFloat(primaryAction.value).toFixed(2)}`,
                metric: `CPR: $${parseFloat(primaryAction.value).toFixed(2)}`,
              })
            }
          }

          // Determine account status
          const hasCritical = alerts.some((a) => a.severity === 'critical')
          const hasWarning = alerts.some((a) => a.severity === 'warning')
          const status = hasCritical ? 'critical' : hasWarning ? 'warning' : 'ok'

          results.push({
            client: account.name,
            accountId: account.id,
            status,
            alerts,
          })
        } catch (err) {
          // If fetch fails for an account, mark as ok with no alerts
          results.push({
            client: account.name,
            accountId: account.id,
            status: 'ok',
            alerts: [],
          })
        }
      }

      return results
    },
    enabled: accounts.length > 0,
    staleTime: 3 * 60 * 1000,
  })
}

function AlertRow({ alert }) {
  const isCritical = alert.severity === 'critical'

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 border-l-2 transition-colors',
      isCritical
        ? 'border-red-500 bg-red-500/5'
        : 'border-amber-400 bg-amber-400/5'
    )}>
      {isCritical ? (
        <AlertOctagon size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-mono text-steel/60">{alert.campaign}</span>
          <span className={cn(
            'text-[10px] font-mono px-1.5 py-0.5 rounded',
            isCritical ? 'bg-red-500/10 text-red-400' : 'bg-amber-400/10 text-amber-400'
          )}>
            {alert.metric}
          </span>
        </div>
        <p className="text-sm text-steel">{alert.message}</p>
      </div>
      <ChevronRight size={14} className="text-steel/20 mt-1" />
    </div>
  )
}

function ClientNotification({ notification }) {
  const isOk = notification.status === 'ok'

  return (
    <div className="bg-navy-light/40 border border-border-glow rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border-glow/50">
        <StatusDot status={notification.status} size="md" />
        <h3 className="text-base font-semibold text-white flex-1">{notification.client}</h3>
        {isOk ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">ALL OK</span>
          </div>
        ) : (
          <span className={cn(
            'text-xs font-mono px-2 py-1 rounded',
            notification.status === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-amber-400/10 text-amber-400'
          )}>
            {notification.alerts.length} alert{notification.alerts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {notification.alerts.length > 0 && (
        <div className="divide-y divide-border-glow/30">
          {notification.alerts.map((alert, i) => (
            <AlertRow key={i} alert={alert} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Notifications() {
  const accounts = useAppStore((s) => s.accounts)
  const { data: notifications, isLoading } = useAccountAlerts(accounts)

  const sorted = notifications
    ? [...notifications].sort((a, b) => {
        const order = { critical: 0, warning: 1, ok: 2 }
        return (order[a.status] ?? 2) - (order[b.status] ?? 2)
      })
    : []

  const criticalCount = sorted.filter((n) => n.status === 'critical').length
  const warningCount = sorted.filter((n) => n.status === 'warning').length
  const okCount = sorted.filter((n) => n.status === 'ok').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Notifications</h2>
        <p className="text-sm text-steel mt-1">Campaign health monitoring across all clients</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-steel text-sm">
          <Loader2 size={20} className="animate-spin mr-3" />
          Scanning campaigns for alerts...
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex gap-4">
            {[
              { status: 'critical', count: criticalCount },
              { status: 'warning', count: warningCount },
              { status: 'ok', count: okCount },
            ].map(({ status, count }) => (
              <div
                key={status}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border',
                  status === 'critical' ? 'border-red-500/20 bg-red-500/5' :
                  status === 'warning' ? 'border-amber-400/20 bg-amber-400/5' :
                  'border-emerald-400/20 bg-emerald-400/5'
                )}
              >
                <StatusDot status={status} />
                <span className="text-sm font-medium text-white">{count}</span>
                <span className="text-xs text-steel capitalize">
                  {status === 'ok' ? 'Ok' : status === 'critical' ? 'Critical' : 'Warning'}
                </span>
              </div>
            ))}
          </div>

          {/* Client notifications */}
          {sorted.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3 opacity-60" />
              <p className="text-steel">No ad accounts loaded yet. Go to Dashboard first.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sorted.map((notification) => (
                <ClientNotification key={notification.accountId} notification={notification} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { Bell, CheckCircle2, AlertTriangle, AlertOctagon, ChevronRight } from 'lucide-react'
import StatusDot from '@/components/shared/StatusDot'
import { cn } from '@/utils/cn'

const MOCK_NOTIFICATIONS = [
  {
    client: 'NuHealth',
    status: 'ok',
    alerts: [],
  },
  {
    client: 'Acme Corp',
    status: 'warning',
    alerts: [
      { severity: 'warning', campaign: 'Q1 Promo', message: 'Frequency at 3.4 — approaching fatigue threshold', metric: 'Frequency: 3.4' },
      { severity: 'warning', campaign: 'Q1 Promo', message: 'CTR dropped 28% vs last 7-day average', metric: 'CTR: 0.8%' },
    ],
  },
  {
    client: 'Kosovo Travel',
    status: 'ok',
    alerts: [],
  },
  {
    client: 'Prishtina Eats',
    status: 'critical',
    alerts: [
      { severity: 'critical', campaign: 'Weekend Orders', message: 'Frequency at 5.2 — creative fatigue detected', metric: 'Frequency: 5.2' },
      { severity: 'warning', campaign: 'Weekend Orders', message: 'Cost per order spiked 45% above 7-day average', metric: 'CPR: $20.90' },
      { severity: 'warning', campaign: 'Delivery Campaign', message: 'Underspending — only 38% of daily budget used', metric: 'Pacing: 38%' },
    ],
  },
]

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
  const sorted = [...MOCK_NOTIFICATIONS].sort((a, b) => {
    const order = { critical: 0, warning: 1, ok: 2 }
    return (order[a.status] ?? 2) - (order[b.status] ?? 2)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Notifications</h2>
        <p className="text-sm text-steel mt-1">Campaign health monitoring across all clients</p>
      </div>

      {/* Summary bar */}
      <div className="flex gap-4">
        {['critical', 'warning', 'ok'].map((status) => {
          const count = MOCK_NOTIFICATIONS.filter((n) => n.status === status).length
          return (
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
              <span className="text-xs text-steel capitalize">{status}</span>
            </div>
          )
        })}
      </div>

      {/* Client notifications */}
      <div className="space-y-4">
        {sorted.map((notification) => (
          <ClientNotification key={notification.client} notification={notification} />
        ))}
      </div>
    </div>
  )
}

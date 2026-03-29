import { useState } from 'react'
import { DollarSign, Target, TrendingUp, Users } from 'lucide-react'
import MetricCard from '@/components/shared/MetricCard'
import StatusDot from '@/components/shared/StatusDot'
import ClientDetail from '@/components/dashboard/ClientDetail'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/stores/appStore'

// Mock client data — will be replaced by real API data when connected
const MOCK_CLIENTS = [
  { id: '1', name: 'NuHealth', campaigns: 5, spend: '$4,230', results: '142 leads', roas: '3.2x', status: 'ok', trend: [30, 45, 42, 55, 60, 58, 65] },
  { id: '2', name: 'Acme Corp', campaigns: 3, spend: '$1,850', results: '89 purchases', roas: '2.8x', status: 'warning', trend: [50, 48, 45, 40, 38, 42, 35] },
  { id: '3', name: 'Kosovo Travel', campaigns: 2, spend: '$920', results: '2.1K clicks', roas: '1.5x', status: 'ok', trend: [20, 25, 30, 35, 40, 38, 42] },
  { id: '4', name: 'Prishtina Eats', campaigns: 4, spend: '$3,100', results: '67 orders', roas: '4.1x', status: 'critical', trend: [60, 55, 50, 45, 40, 35, 30] },
]

function MiniSparkline({ data, color = '#00ff85' }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const height = 28
  const id = `spark-${data.join('-')}`

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
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

function ClientCard({ client, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-navy-light/60 border border-border-glow rounded-xl p-5 text-left hover:border-border-hover transition-all duration-150 hover:shadow-[0_0_30px_rgba(0,255,133,0.06)] group w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusDot status={client.status} />
            <h3 className="text-lg font-bold text-white group-hover:text-neon transition-colors">
              {client.name}
            </h3>
          </div>
          <p className="text-xs font-mono text-steel">
            {client.campaigns} active campaign{client.campaigns !== 1 ? 's' : ''}
          </p>
        </div>
        <MiniSparkline
          data={client.trend}
          color={client.status === 'critical' ? '#ef4444' : client.status === 'warning' ? '#f59e0b' : '#00ff85'}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel/60 mb-0.5">Spend</div>
          <div className="text-sm font-semibold text-white">{client.spend}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel/60 mb-0.5">Results</div>
          <div className="text-sm font-semibold text-white">{client.results}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel/60 mb-0.5">ROAS</div>
          <div className="text-sm font-semibold text-neon">{client.roas}</div>
        </div>
      </div>
    </button>
  )
}

export default function Dashboard() {
  const [selectedClient, setSelectedClient] = useState(null)
  const { accounts } = useAppStore()

  // Use real accounts if available, fallback to mock
  const clients = accounts.length > 0
    ? accounts.map((acc, i) => ({
        ...MOCK_CLIENTS[i % MOCK_CLIENTS.length],
        id: acc.id,
        name: acc.name,
      }))
    : MOCK_CLIENTS

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-sm text-steel mt-1">Overview of all client accounts</p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Spend" value="$10,100" change={12.5} icon={DollarSign} />
        <MetricCard label="Total Results" value="2,298" change={8.3} icon={Target} />
        <MetricCard label="Avg ROAS" value="2.9x" change={-3.2} icon={TrendingUp} />
        <MetricCard label="Active Campaigns" value="14" change={0} icon={Users} />
      </div>

      {/* Client grid */}
      <div>
        <h3 className="text-sm font-mono uppercase tracking-wider text-steel mb-4">
          Client Accounts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => setSelectedClient(client)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

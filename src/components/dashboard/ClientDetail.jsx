import { useState } from 'react'
import { ArrowLeft, ChevronRight, ChevronDown, Play, Pause, DollarSign, MousePointerClick, Eye, RefreshCw } from 'lucide-react'
import { cn } from '@/utils/cn'
import MetricCard from '@/components/shared/MetricCard'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Mock detailed data (will be replaced by API hooks)
const MOCK_CHART_DATA = Array.from({ length: 7 }, (_, i) => ({
  date: `Mar ${22 + i}`,
  spend: Math.floor(Math.random() * 200) + 100,
  results: Math.floor(Math.random() * 30) + 5,
}))

const MOCK_CAMPAIGNS = [
  {
    id: '1',
    name: 'Weight Loss — Conversions',
    status: 'ACTIVE',
    spend: '$2,340',
    results: '89 leads',
    cpr: '$26.29',
    frequency: '2.1',
    adSets: [
      {
        id: 'as1',
        name: 'Women 25-44 — Health Interests',
        status: 'ACTIVE',
        spend: '$1,400',
        results: '56 leads',
        cpr: '$25.00',
        frequency: '1.9',
        ads: [
          { id: 'ad1', name: 'Video — Dr. Testimonial', status: 'ACTIVE', spend: '$800', results: '34 leads', cpr: '$23.53', ctr: '2.4%' },
          { id: 'ad2', name: 'Image — Before/After', status: 'ACTIVE', spend: '$600', results: '22 leads', cpr: '$27.27', ctr: '1.8%' },
        ],
      },
      {
        id: 'as2',
        name: 'Men 30-50 — Fitness',
        status: 'ACTIVE',
        spend: '$940',
        results: '33 leads',
        cpr: '$28.48',
        frequency: '2.3',
        ads: [
          { id: 'ad3', name: 'Video — Gym Transformation', status: 'ACTIVE', spend: '$940', results: '33 leads', cpr: '$28.48', ctr: '1.6%' },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'HRT — Awareness',
    status: 'ACTIVE',
    spend: '$890',
    results: '45K reach',
    cpr: '$0.02',
    frequency: '1.8',
    adSets: [],
  },
]

function AdRow({ ad }) {
  return (
    <div className="grid grid-cols-[1fr_90px_90px_80px_70px] gap-3 px-4 py-2.5 text-xs items-center hover:bg-white/[0.02]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-navy-elevated border border-border-glow flex items-center justify-center text-[10px] text-steel">
          AD
        </div>
        <span className="text-steel">{ad.name}</span>
      </div>
      <span className="text-white text-right">{ad.spend}</span>
      <span className="text-white text-right">{ad.results}</span>
      <span className="text-steel text-right">{ad.cpr}</span>
      <span className="text-steel text-right">{ad.ctr}</span>
    </div>
  )
}

function AdSetRow({ adSet }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-[1fr_90px_90px_80px_70px] gap-3 px-4 py-3 text-sm items-center hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {adSet.ads?.length > 0 ? (
            <ChevronRight size={14} className={cn('text-steel/40 transition-transform', expanded && 'rotate-90')} />
          ) : (
            <span className="w-3.5" />
          )}
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
      {expanded && adSet.ads?.length > 0 && (
        <div className="ml-6 border-l border-border-glow/30">
          {adSet.ads.map((ad) => (
            <AdRow key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignRow({ campaign }) {
  const [expanded, setExpanded] = useState(false)

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
      {expanded && campaign.adSets?.length > 0 && (
        <div className="bg-navy/20">
          <div className="grid grid-cols-[1fr_90px_90px_80px_70px] gap-3 px-5 py-2 text-[10px] font-mono uppercase tracking-wider text-steel/40 border-b border-border-glow/20">
            <span className="pl-9">Ad Set</span>
            <span className="text-right">Spend</span>
            <span className="text-right">Results</span>
            <span className="text-right">CPR</span>
            <span className="text-right">Freq</span>
          </div>
          {campaign.adSets.map((adSet) => (
            <AdSetRow key={adSet.id} adSet={adSet} />
          ))}
        </div>
      )}
    </div>
  )
}

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

export default function ClientDetail({ client, onBack }) {
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} className="text-steel" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">{client.name}</h2>
          <p className="text-sm text-steel">Account details and campaign performance</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Spend" value={client.spend} change={8.2} icon={DollarSign} />
        <MetricCard label="Results" value={client.results} change={12.5} icon={MousePointerClick} />
        <MetricCard label="ROAS" value={client.roas} change={-2.1} icon={RefreshCw} />
        <MetricCard label="Reach" value="24.5K" change={5.0} icon={Eye} />
      </div>

      {/* Chart */}
      <div className="bg-navy-light/40 border border-border-glow rounded-xl p-5">
        <h3 className="text-sm font-mono uppercase tracking-wider text-steel mb-4">Daily Performance</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={MOCK_CHART_DATA}>
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
        {MOCK_CAMPAIGNS.map((campaign) => (
          <CampaignRow key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Megaphone, Search, Download, Pause, Play, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import StatusDot from '@/components/shared/StatusDot'

const FILTERS = ['Active', 'Paused', 'Completed', 'All']

const MOCK_CAMPAIGNS = [
  { id: '1', name: 'NuHealth — Weight Loss — Conversions', status: 'ACTIVE', objective: 'Conversions', budget: '$100/day', spend: '$2,340', results: '89 leads', cpr: '$26.29', roas: '3.2x', frequency: '2.1' },
  { id: '2', name: 'NuHealth — HRT — Awareness', status: 'ACTIVE', objective: 'Awareness', budget: '$50/day', spend: '$890', results: '45K reach', cpr: '$0.02', roas: '—', frequency: '1.8' },
  { id: '3', name: 'Acme Corp — Q1 Promo', status: 'ACTIVE', objective: 'Sales', budget: '$75/day', spend: '$1,850', results: '34 purchases', cpr: '$54.41', roas: '2.8x', frequency: '3.4' },
  { id: '4', name: 'Kosovo Travel — Summer Push', status: 'PAUSED', objective: 'Traffic', budget: '$40/day', spend: '$920', results: '2.1K clicks', cpr: '$0.44', roas: '1.5x', frequency: '2.9' },
  { id: '5', name: 'Prishtina Eats — Weekend Orders', status: 'ACTIVE', objective: 'Conversions', budget: '$60/day', spend: '$1,400', results: '67 orders', cpr: '$20.90', roas: '4.1x', frequency: '5.2' },
]

export default function Campaigns() {
  const [activeFilter, setActiveFilter] = useState('Active')
  const [search, setSearch] = useState('')

  const filtered = MOCK_CAMPAIGNS.filter((c) => {
    if (activeFilter !== 'All' && c.status !== activeFilter.toUpperCase()) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Campaigns</h2>
          <p className="text-sm text-steel mt-1">All campaigns across your accounts</p>
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

      {/* Campaign table */}
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
    </div>
  )
}

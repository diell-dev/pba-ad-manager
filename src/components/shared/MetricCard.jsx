import { cn } from '@/utils/cn'
import { getChangeArrow, getChangeColor } from '@/lib/formatters'

export default function MetricCard({ label, value, change, icon: Icon, loading }) {
  if (loading) {
    return (
      <div className="bg-navy-light/60 border border-border-glow rounded-xl p-5">
        <div className="skeleton h-3 w-20 mb-3" />
        <div className="skeleton h-8 w-28 mb-2" />
        <div className="skeleton h-3 w-16" />
      </div>
    )
  }

  return (
    <div className="group bg-navy-light/60 border border-border-glow rounded-xl p-5 hover:border-border-hover transition-all duration-150 hover:shadow-[0_0_20px_rgba(0,255,133,0.06)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-steel">
          {label}
        </span>
        {Icon && <Icon size={16} className="text-steel/40 group-hover:text-neon/40 transition-colors" />}
      </div>

      <div className="text-2xl font-bold text-white mb-1 font-sans">
        {value}
      </div>

      {change !== undefined && change !== null && (
        <div className={cn('text-xs font-medium', getChangeColor(change))}>
          {getChangeArrow(change)} {Math.abs(change).toFixed(1)}% vs prev period
        </div>
      )}
    </div>
  )
}

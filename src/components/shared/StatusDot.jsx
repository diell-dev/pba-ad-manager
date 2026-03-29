import { cn } from '@/utils/cn'

const STATUS_STYLES = {
  ok: 'bg-emerald-400 shadow-emerald-400/40',
  warning: 'bg-amber-400 shadow-amber-400/40 pulse-warning',
  critical: 'bg-red-500 shadow-red-500/40 pulse-critical',
}

export default function StatusDot({ status = 'ok', size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'

  return (
    <span
      className={cn(
        'inline-block rounded-full shadow-[0_0_6px]',
        sizeClass,
        STATUS_STYLES[status]
      )}
    />
  )
}

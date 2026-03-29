import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Calendar, Search, ArrowLeftRight } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/utils/cn'
import { DATE_PRESETS } from '@/utils/constants'
import { formatDateRange } from '@/lib/formatters'

export default function TopBar() {
  const {
    accounts,
    selectedAccountId,
    selectAccount,
    datePreset,
    dateRange,
    setDatePreset,
    comparePrevious,
    toggleCompare,
  } = useAppStore()

  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [showDateDropdown, setShowDateDropdown] = useState(false)
  const accountRef = useRef(null)
  const dateRef = useRef(null)

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target))
        setShowAccountDropdown(false)
      if (dateRef.current && !dateRef.current.contains(e.target))
        setShowDateDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-16 border-b border-border-glow bg-navy/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
      {/* ── Left: Account selector ── */}
      <div className="relative" ref={accountRef}>
        <button
          onClick={() => setShowAccountDropdown(!showAccountDropdown)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
            'bg-navy-light/50 border border-border-glow hover:border-border-hover',
            'text-white'
          )}
        >
          <div className="w-6 h-6 rounded-md bg-electric/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-electric">
              {selectedAccount?.name?.[0] || 'A'}
            </span>
          </div>
          <span className="max-w-[180px] truncate">
            {selectedAccount?.name || 'Select Account'}
          </span>
          <ChevronDown size={14} className="text-steel" />
        </button>

        {showAccountDropdown && accounts.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-navy-elevated border border-border-glow rounded-lg shadow-xl py-1 z-50">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => {
                  selectAccount(account.id)
                  setShowAccountDropdown(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors',
                  account.id === selectedAccountId
                    ? 'bg-neon/10 text-neon'
                    : 'text-steel hover:text-white hover:bg-white/5'
                )}
              >
                <div className="w-6 h-6 rounded-md bg-electric/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-electric">
                    {account.name[0]}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-white">{account.name}</div>
                  <div className="text-xs text-steel">ID: {account.id}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Date range + compare ── */}
      <div className="flex items-center gap-3">
        {/* Compare toggle */}
        <button
          onClick={toggleCompare}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
            comparePrevious
              ? 'bg-neon/10 text-neon border border-neon/20'
              : 'text-steel hover:text-white hover:bg-white/5'
          )}
        >
          <ArrowLeftRight size={12} />
          Compare
        </button>

        {/* Date range picker */}
        <div className="relative" ref={dateRef}>
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
              'bg-navy-light/50 border border-border-glow hover:border-border-hover',
              'text-white'
            )}
          >
            <Calendar size={14} className="text-neon" />
            <span>
              {datePreset === 'custom'
                ? formatDateRange(dateRange.start, dateRange.end)
                : DATE_PRESETS.find((p) => p.value === datePreset)?.label}
            </span>
            <ChevronDown size={14} className="text-steel" />
          </button>

          {showDateDropdown && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-navy-elevated border border-border-glow rounded-lg shadow-xl py-1 z-50">
              {DATE_PRESETS.filter((p) => p.value !== 'custom').map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setDatePreset(preset.value)
                    setShowDateDropdown(false)
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left transition-colors',
                    datePreset === preset.value
                      ? 'bg-neon/10 text-neon'
                      : 'text-steel hover:text-white hover:bg-white/5'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

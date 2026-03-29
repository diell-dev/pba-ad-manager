import { Settings as SettingsIcon, Bell, Sliders, Shield } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/utils/cn'

export default function Settings() {
  const { thresholds, updateThreshold } = useAppStore()

  const thresholdGroups = [
    {
      title: 'Delivery Alerts',
      items: [
        { key: 'frequency', label: 'Frequency', warning: thresholds.frequency.warning, critical: thresholds.frequency.critical },
        { key: 'underspend', label: 'Underspend (%)', warning: thresholds.underspend.warning, critical: thresholds.underspend.critical },
        { key: 'learningPhase', label: 'Learning Phase (days)', warning: thresholds.learningPhase.warning },
      ],
    },
    {
      title: 'Cost Alerts',
      items: [
        { key: 'cprSpike', label: 'CPR Spike (%)', warning: thresholds.cprSpike.warning, critical: thresholds.cprSpike.critical },
        { key: 'cpcSpike', label: 'CPC Spike (%)', warning: thresholds.cpcSpike.warning },
      ],
    },
    {
      title: 'Performance Alerts',
      items: [
        { key: 'ctrDrop', label: 'CTR Drop (%)', warning: thresholds.ctrDrop.warning },
        { key: 'convRateDrop', label: 'Conv Rate Drop (%)', warning: thresholds.convRateDrop.warning },
      ],
    },
    {
      title: 'Audience Alerts',
      items: [
        { key: 'audienceOverlap', label: 'Audience Overlap (%)', warning: thresholds.audienceOverlap.warning },
        { key: 'audienceSaturation', label: 'Audience Saturation (%)', warning: thresholds.audienceSaturation.warning },
        { key: 'smallAudience', label: 'Min Audience Size', warning: thresholds.smallAudience.warning },
      ],
    },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-sm text-steel mt-1">Configure notification thresholds and preferences</p>
      </div>

      {thresholdGroups.map((group) => (
        <div key={group.title} className="bg-navy-light/40 border border-border-glow rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Sliders size={14} className="text-neon" />
            {group.title}
          </h3>
          <div className="space-y-4">
            {group.items.map((item) => (
              <div key={item.key} className="grid grid-cols-[1fr_120px_120px] gap-4 items-center">
                <span className="text-sm text-steel">{item.label}</span>
                <div>
                  <label className="text-[10px] font-mono uppercase text-amber-400/60 mb-1 block">Warning</label>
                  <input
                    type="number"
                    value={item.warning}
                    onChange={(e) => updateThreshold(item.key, { warning: Number(e.target.value) })}
                    className="w-full bg-navy/60 border border-border-glow rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400/30"
                  />
                </div>
                {item.critical !== undefined ? (
                  <div>
                    <label className="text-[10px] font-mono uppercase text-red-400/60 mb-1 block">Critical</label>
                    <input
                      type="number"
                      value={item.critical}
                      onChange={(e) => updateThreshold(item.key, { critical: Number(e.target.value) })}
                      className="w-full bg-navy/60 border border-border-glow rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-400/30"
                    />
                  </div>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

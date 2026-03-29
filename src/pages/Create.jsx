import { useState } from 'react'
import { PlusCircle, Upload, FileText, CheckCircle2, ArrowRight } from 'lucide-react'
import { cn } from '@/utils/cn'

const STEPS = [
  { id: 'upload', label: 'Upload Strategy', icon: Upload },
  { id: 'review', label: 'Review Structure', icon: FileText },
  { id: 'creatives', label: 'Attach Creatives', icon: PlusCircle },
  { id: 'confirm', label: 'Confirm & Create', icon: CheckCircle2 },
]

export default function Create() {
  const [currentStep, setCurrentStep] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Create Campaigns</h2>
        <p className="text-sm text-steel mt-1">
          Upload a strategy document and let AI build your campaigns
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const isActive = i === currentStep
          const isCompleted = i < currentStep

          return (
            <div key={step.id} className="flex items-center gap-2">
              <button
                onClick={() => i <= currentStep && setCurrentStep(i)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-neon/10 text-neon border border-neon/20'
                    : isCompleted
                    ? 'bg-neon/5 text-neon/60'
                    : 'text-steel/40'
                )}
              >
                <Icon size={16} />
                <span className="hidden md:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ArrowRight size={14} className="text-steel/20" />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="bg-navy-light/40 border border-border-glow rounded-xl p-8 min-h-[400px]">
        {currentStep === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false) }}
              className={cn(
                'w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer',
                dragOver
                  ? 'border-neon bg-neon/5 shadow-[0_0_40px_rgba(0,255,133,0.1)]'
                  : 'border-border-glow hover:border-border-hover'
              )}
            >
              <div className="w-16 h-16 rounded-2xl bg-neon/10 flex items-center justify-center mx-auto mb-4">
                <Upload size={28} className="text-neon" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Drop your strategy document
              </h3>
              <p className="text-sm text-steel mb-4">
                PDF, DOCX, or plain text — we'll parse it into campaign structures
              </p>
              <button className="px-5 py-2.5 bg-neon text-navy font-semibold rounded-lg hover:bg-neon/90 transition-colors text-sm">
                Browse Files
              </button>
            </div>
          </div>
        )}

        {currentStep > 0 && (
          <div className="flex items-center justify-center h-full text-steel text-sm">
            This step will be built once the AI parsing pipeline is connected.
          </div>
        )}
      </div>
    </div>
  )
}

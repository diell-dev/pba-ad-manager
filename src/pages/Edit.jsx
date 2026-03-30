import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Loader2, AlertTriangle, CheckCircle2, Undo2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ai, meta } from '@/lib/api'
import { useAppStore } from '@/stores/appStore'

const SUGGESTIONS = [
  'Pause all campaigns with frequency above 4',
  'Increase budget by 20% on top performing campaigns',
  'Show me campaigns with declining ROAS',
  'Duplicate best ad set in NuHealth Weight Loss campaign',
]

// ── Render an action plan from the AI ──
function ActionPlan({ plan }) {
  if (!plan) return null

  return (
    <div className="space-y-3 mt-3">
      {plan.actions?.length > 0 && (
        <div className="space-y-2">
          {plan.actions.map((action, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-navy/40 border border-border-glow/50 rounded-lg px-4 py-3"
            >
              <div className="mt-0.5">
                {action.reversible !== false ? (
                  <Undo2 size={14} className="text-neon/60" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-400/60" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-neon/10 text-neon">
                    {action.action_type}
                  </span>
                  <span className="text-[10px] font-mono text-steel/50">
                    {action.entity_type}
                  </span>
                </div>
                <p className="text-sm text-white">{action.description}</p>
                {action.entity_name && (
                  <p className="text-xs text-steel/60 mt-1">{action.entity_name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {plan.warnings?.length > 0 && (
        <div className="space-y-1">
          {plan.warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-amber-400/80">
              <AlertTriangle size={12} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {plan.actions?.length > 0 && (
        <p className="text-[10px] text-steel/40 font-mono">
          Preview only — execution not yet implemented
        </p>
      )}
    </div>
  )
}

export default function Edit() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const { selectedAccountId, accounts } = useAppStore()

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Welcome to the AI Command Center. Type a prompt to make changes to your Meta Ads campaigns. I\'ll show you a preview of all changes before executing anything.',
    },
  ])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send prompt to AI ──
  async function handleSend() {
    const text = prompt.trim()
    if (!text || isLoading) return

    // Add user message
    setMessages((m) => [...m, { role: 'user', content: text }])
    setPrompt('')
    setIsLoading(true)

    try {
      // Build context: fetch active campaigns from selected account (or first account)
      const accountId = selectedAccountId || accounts[0]?.id
      let context = {}

      if (accountId) {
        try {
          const res = await meta.get(`${accountId}/campaigns`, {
            fields: 'id,name,status,objective,daily_budget,lifetime_budget,insights.date_preset(last_7d){spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type,frequency,reach}',
            effective_status: '["ACTIVE","PAUSED"]',
            limit: '50',
          })
          context = {
            accountId,
            accountName: accounts.find((a) => a.id === accountId)?.name || accountId,
            campaigns: (res.data || []).map((c) => ({
              id: c.id,
              name: c.name,
              status: c.status,
              objective: c.objective,
              daily_budget: c.daily_budget,
              lifetime_budget: c.lifetime_budget,
              insights: c.insights?.data?.[0] || {},
            })),
          }
        } catch {
          // If campaign fetch fails, send without context
          context = { accountId, note: 'Could not fetch campaign data' }
        }
      }

      // Call AI endpoint
      const result = await ai.edit(text, context)

      // Add AI response
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: result.interpretation || 'Here\'s what I found:',
          actionPlan: result,
        },
      ])
    } catch (err) {
      console.error('AI Edit error:', err)
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: `Sorry, I couldn't process that request. ${err.message || 'The AI service may be temporarily unavailable.'}`,
          isError: true,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Page header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-neon" />
          <h2 className="text-2xl font-bold text-white">Edit</h2>
        </div>
        <p className="text-sm text-steel mt-1">
          AI-powered campaign management — describe what you want to change
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-navy-light/40 border border-border-glow rounded-xl flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'max-w-[80%] rounded-2xl px-5 py-3 text-sm',
                msg.role === 'user'
                  ? 'ml-auto bg-electric text-white'
                  : msg.isError
                    ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                    : 'bg-navy-elevated border border-border-glow text-steel'
              )}
            >
              {msg.content}
              {msg.actionPlan && <ActionPlan plan={msg.actionPlan} />}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-navy-elevated border border-border-glow">
              <div className="flex items-center gap-2 text-sm text-steel">
                <Loader2 size={14} className="animate-spin text-neon" />
                Analyzing your campaigns...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions — hide when loading or when conversation has started */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-6 pb-3">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="px-3 py-1.5 text-xs bg-navy-elevated border border-border-glow rounded-full text-steel hover:text-neon hover:border-neon/20 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border-glow">
          <div className="flex gap-3">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to change..."
              disabled={isLoading}
              className="flex-1 bg-navy/60 border border-border-glow rounded-xl px-4 py-3 text-sm text-white placeholder-steel/50 focus:outline-none focus:border-neon/30 focus:ring-1 focus:ring-neon/20 transition-all disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!prompt.trim() || isLoading}
              className="px-4 py-3 bg-neon text-navy font-semibold rounded-xl hover:bg-neon/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

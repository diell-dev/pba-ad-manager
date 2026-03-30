import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Sparkles, Send, Loader2, AlertTriangle, CheckCircle2,
  Undo2, Play, X, Ban, Clock,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { ai, meta } from '@/lib/api'
import { useAppStore } from '@/stores/appStore'

const SUGGESTIONS = [
  'Pause all campaigns with frequency above 4',
  'Increase budget by 20% on top performing campaigns',
  'Show me campaigns with declining ROAS',
  'Duplicate best ad set in NuHealth Weight Loss campaign',
]

// ── Execute a single action against the Meta API ──
async function executeAction(action) {
  const { entity_type, entity_id, action_type, parameters } = action

  // Can't execute on unknown entities
  if (!entity_id || entity_id === 'new' || entity_id === 'unknown') {
    return { success: false, error: 'No entity ID — cannot execute' }
  }

  const endpoint = `${entity_id}`

  try {
    switch (action_type) {
      case 'UPDATE_STATUS': {
        const status = parameters?.status?.toUpperCase() || 'PAUSED'
        await meta.post(endpoint, { status })
        return { success: true, detail: `Status → ${status}` }
      }

      case 'UPDATE_BUDGET': {
        const params = {}
        // Meta expects budget in cents
        if (parameters?.daily_budget != null) {
          params.daily_budget = Math.round(Number(parameters.daily_budget) * 100)
        }
        if (parameters?.lifetime_budget != null) {
          params.lifetime_budget = Math.round(Number(parameters.lifetime_budget) * 100)
        }
        if (Object.keys(params).length === 0) {
          return { success: false, error: 'No budget parameters provided' }
        }
        await meta.post(endpoint, params)
        return { success: true, detail: `Budget updated` }
      }

      case 'UPDATE_BID': {
        if (parameters?.bid_amount == null) {
          return { success: false, error: 'No bid amount provided' }
        }
        await meta.post(endpoint, {
          bid_amount: Math.round(Number(parameters.bid_amount) * 100),
        })
        return { success: true, detail: `Bid updated` }
      }

      case 'UPDATE_SCHEDULE': {
        const params = {}
        if (parameters?.start_time) params.start_time = parameters.start_time
        if (parameters?.end_time) params.end_time = parameters.end_time
        await meta.post(endpoint, params)
        return { success: true, detail: `Schedule updated` }
      }

      case 'UPDATE_TARGETING': {
        if (!parameters?.targeting) {
          return { success: false, error: 'No targeting data provided' }
        }
        await meta.post(endpoint, {
          targeting: JSON.stringify(parameters.targeting),
        })
        return { success: true, detail: `Targeting updated` }
      }

      case 'UPDATE_CREATIVE': {
        const params = {}
        if (parameters?.name) params.name = parameters.name
        await meta.post(endpoint, params)
        return { success: true, detail: `Creative updated` }
      }

      case 'UPDATE_NAME': {
        if (!parameters?.name) {
          return { success: false, error: 'No name provided' }
        }
        await meta.post(endpoint, { name: parameters.name })
        return { success: true, detail: `Renamed` }
      }

      case 'UPDATE_OPTIMIZATION': {
        if (!parameters?.optimization_goal) {
          return { success: false, error: 'No optimization goal provided' }
        }
        await meta.post(endpoint, { optimization_goal: parameters.optimization_goal })
        return { success: true, detail: `Optimization → ${parameters.optimization_goal}` }
      }

      case 'UPDATE_BILLING': {
        if (!parameters?.billing_event) {
          return { success: false, error: 'No billing event provided' }
        }
        await meta.post(endpoint, { billing_event: parameters.billing_event })
        return { success: true, detail: `Billing → ${parameters.billing_event}` }
      }

      case 'UPDATE_PACING': {
        if (!parameters?.pacing_type) {
          return { success: false, error: 'No pacing type provided' }
        }
        await meta.post(endpoint, { pacing_type: JSON.stringify(parameters.pacing_type) })
        return { success: true, detail: `Pacing updated` }
      }

      case 'DUPLICATE': {
        await meta.post(`${entity_id}/copies`, {
          rename_options: JSON.stringify({
            rename_suffix: parameters?.rename_suffix || ' (Copy)',
          }),
          ...(parameters?.deep_copy !== false ? { deep_copy: true } : {}),
        })
        return { success: true, detail: `Duplicated` }
      }

      case 'DELETE': {
        await meta.post(endpoint, { status: 'DELETED' })
        return { success: true, detail: `Archived` }
      }

      default:
        return { success: false, error: `Unknown action type: ${action_type}` }
    }
  } catch (err) {
    const msg = err?.data?.error?.message || err.message || 'API error'
    return { success: false, error: msg }
  }
}

// ── Status icon for each action row ──
function ActionStatusIcon({ status }) {
  switch (status) {
    case 'running':
      return <Loader2 size={14} className="animate-spin text-neon" />
    case 'success':
      return <CheckCircle2 size={14} className="text-green-400" />
    case 'failed':
      return <X size={14} className="text-red-400" />
    case 'skipped':
      return <Ban size={14} className="text-steel/40" />
    default:
      return <Clock size={14} className="text-steel/30" />
  }
}

// ── Render an action plan from the AI ──
function ActionPlan({ plan, onExecute, onCancel, executionState }) {
  if (!plan) return null
  const hasActions = plan.actions?.length > 0
  const isIdle = executionState === 'idle'
  const isRunning = executionState === 'running'
  const isDone = executionState === 'done'

  return (
    <div className="space-y-3 mt-3">
      {hasActions && (
        <div className="space-y-2">
          {plan.actions.map((action, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-3 bg-navy/40 border rounded-lg px-4 py-3 transition-colors',
                action._status === 'success'
                  ? 'border-green-500/30'
                  : action._status === 'failed'
                    ? 'border-red-500/30'
                    : 'border-border-glow/50'
              )}
            >
              <div className="mt-0.5">
                {action._status ? (
                  <ActionStatusIcon status={action._status} />
                ) : action.reversible !== false ? (
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
                  {action._detail && (
                    <span className={cn(
                      'text-[10px] font-mono',
                      action._status === 'success' ? 'text-green-400/70' : 'text-red-400/70'
                    )}>
                      {action._detail}
                    </span>
                  )}
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

      {/* Execute / Cancel buttons */}
      {hasActions && isIdle && (
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onExecute}
            className="flex items-center gap-2 px-4 py-2 bg-neon text-navy text-xs font-bold rounded-lg hover:bg-neon/90 transition-colors"
          >
            <Play size={12} />
            Execute {plan.actions.length} action{plan.actions.length > 1 ? 's' : ''}
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-navy border border-border-glow text-steel text-xs rounded-lg hover:text-white hover:border-steel/40 transition-colors"
          >
            <X size={12} />
            Cancel
          </button>
        </div>
      )}

      {isRunning && (
        <div className="flex items-center gap-2 text-xs text-neon pt-1">
          <Loader2 size={12} className="animate-spin" />
          Executing changes...
        </div>
      )}

      {isDone && (
        <div className="flex items-center gap-2 text-xs text-green-400 pt-1">
          <CheckCircle2 size={12} />
          Execution complete
        </div>
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
        'Welcome to the AI Command Center. Describe what you want to change and I\'ll analyze your campaigns, then execute the changes when you confirm.',
    },
  ])

  // Track execution state per message index: { [msgIdx]: 'idle' | 'running' | 'done' }
  const [execStates, setExecStates] = useState({})

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, execStates])

  // ── Execute all actions in a plan ──
  const handleExecute = useCallback(async (msgIdx) => {
    setExecStates((s) => ({ ...s, [msgIdx]: 'running' }))

    const plan = messages[msgIdx]?.actionPlan
    if (!plan?.actions?.length) return

    for (let i = 0; i < plan.actions.length; i++) {
      const action = plan.actions[i]

      // Mark action as running
      setMessages((prev) => {
        const updated = [...prev]
        const updatedPlan = { ...updated[msgIdx].actionPlan }
        updatedPlan.actions = [...updatedPlan.actions]
        updatedPlan.actions[i] = { ...updatedPlan.actions[i], _status: 'running' }
        updated[msgIdx] = { ...updated[msgIdx], actionPlan: updatedPlan }
        return updated
      })

      // Execute
      const result = await executeAction(action)

      // Mark action with result
      setMessages((prev) => {
        const updated = [...prev]
        const updatedPlan = { ...updated[msgIdx].actionPlan }
        updatedPlan.actions = [...updatedPlan.actions]
        updatedPlan.actions[i] = {
          ...updatedPlan.actions[i],
          _status: result.success ? 'success' : 'failed',
          _detail: result.success ? result.detail : result.error,
        }
        updated[msgIdx] = { ...updated[msgIdx], actionPlan: updatedPlan }
        return updated
      })
    }

    setExecStates((s) => ({ ...s, [msgIdx]: 'done' }))

    // Add summary message
    const finalPlan = messages[msgIdx]?.actionPlan
    const total = finalPlan?.actions?.length || 0
    setMessages((prev) => {
      // Re-read from latest state
      const currentPlan = prev[msgIdx]?.actionPlan
      const succeeded = currentPlan?.actions?.filter((a) => a._status === 'success').length || 0
      const failed = total - succeeded
      return [
        ...prev,
        {
          role: 'assistant',
          content: failed === 0
            ? `Done! All ${succeeded} action${succeeded > 1 ? 's' : ''} executed successfully.`
            : `Finished — ${succeeded} succeeded, ${failed} failed. Check the details above.`,
          isError: failed > 0,
        },
      ]
    })
  }, [messages])

  // ── Cancel (dismiss) a plan ──
  const handleCancel = useCallback((msgIdx) => {
    setExecStates((s) => ({ ...s, [msgIdx]: 'done' }))
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: 'Cancelled — no changes were made.' },
    ])
  }, [])

  // ── Send prompt to AI ──
  async function handleSend() {
    const text = prompt.trim()
    if (!text || isLoading) return

    setMessages((m) => [...m, { role: 'user', content: text }])
    setPrompt('')
    setIsLoading(true)

    try {
      const accountId = selectedAccountId || accounts[0]?.id
      let context = {}

      if (accountId) {
        try {
          // Fetch campaigns with full insights
          const res = await meta.get(`${accountId}/campaigns`, {
            fields: [
              'id', 'name', 'status', 'objective', 'daily_budget', 'lifetime_budget',
              'start_time', 'stop_time', 'buying_type', 'bid_strategy',
              'insights.date_preset(last_7d){spend,impressions,clicks,ctr,cpc,cpp,cpm,actions,cost_per_action_type,frequency,reach,conversions,conversion_values}',
            ].join(','),
            effective_status: '["ACTIVE","PAUSED"]',
            limit: '50',
          })

          const campaigns = (res.data || []).map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            objective: c.objective,
            daily_budget: c.daily_budget ? (Number(c.daily_budget) / 100).toFixed(2) : null,
            lifetime_budget: c.lifetime_budget ? (Number(c.lifetime_budget) / 100).toFixed(2) : null,
            start_time: c.start_time,
            stop_time: c.stop_time,
            buying_type: c.buying_type,
            bid_strategy: c.bid_strategy,
            insights: c.insights?.data?.[0] || {},
          }))

          context = {
            accountId,
            accountName: accounts.find((a) => a.id === accountId)?.name || accountId,
            totalCampaigns: campaigns.length,
            campaigns,
          }
        } catch {
          context = { accountId, note: 'Could not fetch campaign data' }
        }
      }

      const result = await ai.edit(text, context)

      const newMsgIdx = messages.length + 1 // +1 because user message was already added

      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: result.interpretation || 'Here\'s what I found:',
          actionPlan: result,
        },
      ])

      // Set execution state to idle if there are actions
      if (result.actions?.length > 0) {
        setExecStates((s) => ({ ...s, [newMsgIdx]: 'idle' }))
      }
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
              {msg.actionPlan && (
                <ActionPlan
                  plan={msg.actionPlan}
                  executionState={execStates[i] || (msg.actionPlan.actions?.length > 0 ? 'idle' : 'done')}
                  onExecute={() => handleExecute(i)}
                  onCancel={() => handleCancel(i)}
                />
              )}
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

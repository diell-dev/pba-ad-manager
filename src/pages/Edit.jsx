import { useState } from 'react'
import { Sparkles, Send, History, Undo2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const SUGGESTIONS = [
  'Pause all campaigns with frequency above 4',
  'Increase budget by 20% on top performing campaigns',
  'Show me campaigns with declining ROAS',
  'Duplicate best ad set in NuHealth Weight Loss campaign',
]

export default function Edit() {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Welcome to the AI Command Center. Type a prompt to make changes to your Meta Ads campaigns. I\'ll show you a preview of all changes before executing anything.',
    },
  ])

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
                  : 'bg-navy-elevated border border-border-glow text-steel'
              )}
            >
              {msg.content}
            </div>
          ))}
        </div>

        {/* Suggestions */}
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

        {/* Input */}
        <div className="p-4 border-t border-border-glow">
          <div className="flex gap-3">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to change..."
              className="flex-1 bg-navy/60 border border-border-glow rounded-xl px-4 py-3 text-sm text-white placeholder-steel/50 focus:outline-none focus:border-neon/30 focus:ring-1 focus:ring-neon/20 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && prompt.trim()) {
                  setMessages((m) => [...m, { role: 'user', content: prompt }])
                  setPrompt('')
                }
              }}
            />
            <button
              disabled={!prompt.trim()}
              className="px-4 py-3 bg-neon text-navy font-semibold rounded-xl hover:bg-neon/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

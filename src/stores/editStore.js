import { create } from 'zustand'

export const useEditStore = create((set, get) => ({
  // ── Prompt history ──
  history: [], // { id, timestamp, prompt, result, status }

  // ── Current prompt state ──
  currentPrompt: '',
  isProcessing: false,
  pendingActions: null, // parsed action plan from AI
  executionResult: null,

  // ── Actions ──
  setPrompt: (prompt) => set({ currentPrompt: prompt }),
  setProcessing: (processing) => set({ isProcessing: processing }),

  setPendingActions: (actions) => set({ pendingActions: actions }),
  clearPendingActions: () => set({ pendingActions: null, executionResult: null }),

  setExecutionResult: (result) => set({ executionResult: result }),

  addToHistory: (entry) =>
    set((s) => ({
      history: [
        { ...entry, id: Date.now(), timestamp: new Date().toISOString() },
        ...s.history,
      ],
    })),

  clearHistory: () => set({ history: [] }),
}))

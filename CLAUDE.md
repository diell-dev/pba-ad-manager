# PBA Ad Manager — project memory

Read this at the start of every session in this repo.

## What this is

**PBA Ad Manager** is Polar Bear Agency's internal tool for managing Meta (Facebook/Instagram) ad campaigns across clients. It connects to the Meta Marketing API via OAuth, surfaces campaigns in a dashboard, and uses Claude to (a) parse campaign strategies from plain-text briefs and (b) suggest/apply edits to existing ad copy, targeting, and budgets. Three.js is used for ambient visuals in the shell.

- **Stack:** Vite 8 + React 19 + React Router 7 · TanStack Query · Zustand (state) · Tailwind 4 · Three.js + R3F (visuals) · Recharts (metrics) · `@anthropic-ai/sdk` for AI · `crypto-js` for client-side token encryption
- **Backend:** Netlify Functions (`netlify/functions/*.js`) — no separate server
- **Hosting:** Netlify (one of the few PBA projects still on Netlify — not a migration target for Vercel unless Diell says so)
- **Auth:** App login gate → Meta OAuth for ad account access

## Hard rules

1. **Meta API tokens are sensitive.** Any access token touching the Meta Marketing API gets encrypted client-side (`crypto-js`) before storage, and never gets logged, echoed in a UI element, or committed. Same rule as GitHub PATs.
2. **AI edits to ads are never auto-applied.** Every Claude-generated change produces a **diff preview** the user must approve. Do not add an "auto-apply" shortcut without explicit discussion — it's a category of bug that could silently rewrite live campaigns.
3. **Meta rate limits are real.** Batch calls where possible; respect the platform rate-limit headers. TanStack Query's `staleTime` is set to 60s in `App.jsx` — don't drop it lower without a reason.
4. **This is a PBA internal tool, not a client deliverable.** The UX can prioritize power-user density over consumer-friendliness. Don't over-simplify at the cost of information density.
5. **Netlify-specific paths are load-bearing.** `netlify/functions/*` is referenced by the Netlify runtime. Don't move them into `/api/` without also updating `netlify.toml` and the frontend fetch URLs.
6. **Three.js in the shell is decorative, not load-blocking.** If the `ParticleBackground` / R3F scene ever blocks the login screen from rendering, lazy-load it — the auth flow must always work first.

## Architecture at a glance

```
/
  src/
    App.jsx              router + AuthGate + QueryClientProvider
    main.jsx             entry
    pages/
      Login.jsx          auth entry
      Dashboard.jsx      overview
      Campaigns.jsx      list + filter
      Create.jsx         new campaign (AI-assisted via strategy parse)
      Edit.jsx           edit existing (AI-suggested diffs)
      Notifications.jsx  alerts / rate-limit warnings
      Settings.jsx       account, tokens, preferences
    components/
      layout/Shell.jsx   nav + chrome
      shared/ParticleBackground.jsx   R3F ambient scene
      shared/ErrorBoundary.jsx
    hooks/useAuth.js     session + login flow
    lib/                 API clients, crypto helpers
    stores/              zustand stores
  netlify/functions/
    auth.js              app login
    oauth.js             Meta OAuth dance
    meta-api.js          proxy to Meta Marketing API
    ai-parse-strategy.js Claude call: strategy brief → campaign structure
    ai-edit.js           Claude call: generate diffs for existing ads
  netlify.toml           build + headers
  vite.config.js         path aliases (@/ → src/)
```

The `@/` import alias is configured in `vite.config.js` — match it in any new imports.

## Decisions log

- **v3.0** — Rebuild around Vite + React 19 + TanStack Query + Zustand. Previous version used a different stack; this one is the canonical one.
- **AI strategy parse flow** — The "Create" page accepts a plain-English brief ("run a 2-week campaign for this product with $500 budget targeting Germany, emphasize sustainability angle") and Claude turns it into a structured campaign object the user can edit before creation. Prompt is in `netlify/functions/ai-parse-strategy.js`.
- **AI edit flow** — "Edit" page can ask Claude to propose changes to copy / audience / budget; diff is shown; user approves per-field. Never auto-applies.
- **Three.js chrome** — Intentional PBA brand moment. Can be disabled per-route if perf becomes an issue, but keep the file.

## Common pitfalls (we've hit these — don't repeat)

- **Meta token expiry is silent.** When a token expires, the Meta API returns a generic error and fetches start failing. The user sees "empty campaigns list" and assumes the app is broken. Make sure error states distinguish "auth expired — reconnect Meta" from "no campaigns yet."
- **TanStack Query cache vs. Meta's eventual consistency.** Meta's API often lags 30–60s after a write. A `queryClient.invalidateQueries()` after a mutation can fetch stale data. Add a small delay or use optimistic updates for mutations.
- **R3F + React 19 StrictMode double-mount.** The particle scene reinitializes twice in dev. Harmless visually, but if you add side-effects in a Three.js component's `useEffect`, guard them.
- **Client-side `crypto-js` is not a security boundary by itself.** It's for making stolen localStorage less useful, not for resisting a hostile script. Tokens on the wire still need HTTPS + proper CORS.

## Quick commands

```bash
npm run dev        # vite dev server
npm run build      # vite build → dist/
npm run preview    # preview the production build locally
```

Deploy: `git push` → Netlify picks up `main`. Functions live in `netlify/functions/` and are deployed with the site.

## Last updated

2026-04-21 — initial file.

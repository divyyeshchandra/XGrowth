# X GlowUp — Original Plan

> Reconstructed from the very first conversation that designed this project, before git was
> initialized. This is the original full plan as written, preserved here for reference. It is
> **not** kept in sync with the current codebase — see the root `README.md` for live progress.

> The best free webapp to turn rough drafts into high-quality, viral-ready X posts.

X GlowUp takes a messy, rough idea and rewrites it into a clean, well-structured, mobile-readable X post (or thread) — with live device previews, an estimated virality score with reasoning, and niche angle suggestions. It's free to use (powered by free models), and power users can bring their own API key.

---

## Core Features

- **Post Restructuring** — Paste any rough draft → get a clean, well-structured X post/thread (hooks, line breaks, mobile readability, tone).
- **Live Responsive Previews** — See the post rendered as X would show it on Mobile (375px), Tablet (768px), and Desktop.
- **Virality Score** — An *estimated* 0–100 score with a reasoned breakdown (hook, emotion, CTA, length) and concrete improvement suggestions.
- **Niche Angle Helper** — Evergreen hook/angle/topic ideas for your niche. *(Honest note — this is not real-time trend data.)*
- **Bring Your Own Key (BYOK)** — Connect Groq, OpenRouter, Anthropic, OpenAI, or a custom OpenAI-compatible endpoint in seconds.
- **Free Tier** — Usable with no key at all, backed by free models and protected by server-side rate limiting.

---

## Tech Stack

| Layer        | Technology                                  | Reason                                         |
|--------------|-----------------------------------------------|--------------------------------------------------|
| Framework    | Next.js 15 (App Router)                      | Server route handlers + great DX + Vercel      |
| Styling      | Tailwind CSS + shadcn/ui                     | Fast, clean, accessible UI                     |
| AI Layer     | Vercel AI SDK                                | Multi-provider, streaming, structured output   |
| State        | Zustand                                      | Simple, lightweight client state               |
| Rate Limit   | Upstash Redis (or Vercel KV) — free tier    | Server-side IP rate limiting for the free tier |
| Deployment   | Vercel (free)                                | Easy, free, first-class Next.js support        |
| Providers    | Groq, OpenRouter, Anthropic, OpenAI, Custom | All OpenAI-compatible via the AI SDK           |

---

## Architecture (read this before Milestone 1)

The single most important design decision: **all AI calls go through a server-side Next.js Route Handler**, never directly from the browser.

```
┌──────────────┐   POST /api/generate          ┌──────────────────────┐        ┌──────────────┐
│   Browser    │   { mode, input, provider,    │  Next.js Route        │  AI    │  Provider    │
│  (client)    │ ─── userKey? } ─────────────► │  Handler (server)     │ ─────► │ Groq/OR/...  │
│              │                                │                       │        │              │
│ localStorage │ ◄─── streamed tokens ───────  │  - if userKey: BYOK   │ ◄───── │              │
│  holds keys  │                                │  - else: free key +   │        └──────────────┘
└──────────────┘                                │    IP rate limit      │
                                                └──────────────────────┘
```

Why server-side and not direct-from-browser:
- **CORS / security**: Anthropic and OpenAI block browser-origin calls; doing it client-side also exposes even the user's own key in the network tab and to any injected script.
- **Free-tier protection**: The free key must never touch the client. Rate limiting must happen on the server (see below).

Key handling rules:
- **BYOK keys** live only in the user's `localStorage`. They are sent to our route handler **per request**, used in-memory to make the provider call, and **never logged or persisted server-side**. This is shown to the user with a clear warning.
- **Free-tier key** is a server-only environment variable (`GROQ_FREE_KEY` / `OPENROUTER_FREE_KEY`) and is never sent to the client.

Free-tier abuse protection:
- `localStorage` counters are bypassable (incognito / clearing storage) and are used only for friendly UX ("X/10 used today"), **not** as the real limit.
- The real limit is **server-side, IP-based**, via Upstash Redis / Vercel KV (sliding window, e.g. N free generations per IP per day). This is the actual gate that protects the owner's quota.

### Proposed folder structure

```
app/
  layout.tsx
  page.tsx                  # main app (also serves as landing)
  api/
    generate/route.ts       # restructure + (optional) virality, streaming
    virality/route.ts       # virality-only (if run separately)
    niche/route.ts          # niche angle helper
components/
  ui/                       # shadcn primitives
  editor/                   # input area, toolbar
  preview/                  # device frames + X post mock
  virality/                 # score gauge, breakdown cards
  settings/                 # BYOK modal, provider selector
hooks/
  use-generate.ts           # wraps AI SDK client hook
  use-settings.ts           # provider/key state (Zustand-backed)
lib/
  ai/
    providers.ts            # provider registry + model map
    prompts.ts               # system prompts (restructure, virality, niche)
    schemas.ts               # zod schemas for structured output
  ratelimit.ts              # Upstash/KV sliding-window limiter
  storage.ts                # localStorage helpers (keys, history)
store/
  settings-store.ts          # Zustand store
types/
  index.ts
```

---

## Milestone-by-Milestone Execution Plan

> Times are for one focused developer. Treat them as ranges, not promises.

### Milestone 0 — Project Setup (1–2 days) · Priority: High
**Goal:** Project running locally with a clean structure.
- Initialize Next.js 15 (App Router) with TypeScript + Tailwind.
- Add shadcn/ui; set up dark mode as default (X-user friendly).
- Create the folder structure above.
- Install Vercel AI SDK + provider packages + Zustand + zod.
- Set up `.env.local` (`.env.example` committed) and the basic app shell/layout.

**Deliverable:** Working Next.js app with a clean UI shell.

### Milestone 1 — Free Tier + BYOK System (4–5 days) · Priority: Critical
**Goal:** Usable for free, and trivial to connect your own key.
- Build the `/api/generate` route handler (the architecture above) as the single AI entry point.
- **BYOK:** provider selector (Groq / OpenRouter / Anthropic / OpenAI / Custom), API-key input, store in `localStorage` with a clear security warning, settings modal.
- "Get Free Key" buttons with direct links (Groq & OpenRouter).
- **Free tier:** server-only free key + **server-side IP rate limiting** (Upstash/KV). Client `localStorage` counter is UX-only.
- Provider registry + model map in `lib/ai/providers.ts`.

**Deliverable:** Users can use the app free (rate-limited) or connect their own key.

### Milestone 2 — Core Feature: Post Restructuring (4–5 days) · Priority: Critical
**Goal:** The main value — rough text → clean X post.
- Main input textarea + toolbar.
- Generation flow via the AI SDK (streaming) against `/api/generate`.
- Strong, versioned system prompt: hooks, thread format, line breaks, mobile readability, tone control.
- Streaming output with loading states; "Regenerate" and "Copy" actions.
- Clean output rendering.

**Deliverable:** Paste rough text → get a well-structured X post/thread.

### Milestone 3 — Responsive Previews (3–4 days) · Priority: High
**Goal:** Show how the post looks across devices.
- Three preview modes: Mobile (375px), Tablet (768px), Desktop (full).
- **Use CSS-constrained containers that mock the X post UI** (avatar, handle, body, engagement row) — not iframes. Iframes can't render arbitrary draft text as a real X post, so a faithful CSS mock is the correct approach.
- Previews update live as output streams.
- Character count + thread-length / per-tweet limit indicators (280 chars).

**Deliverable:** Live Mobile/Tablet/Desktop previews of the post.

### Milestone 4 — Virality Score (4–5 days) · Priority: High
**Goal:** An estimated score + reasoning.
- Use **structured output (zod schema)** to return: score (0–100), breakdown (hook strength, emotional trigger, CTA, length, etc.), and improvement suggestions.
- Decide: second AI call vs. combined with restructuring (recommend separate call so the editor stays fast; trigger on demand).
- Visual score (gauge/progress + color), reasoning in cards.
- Toggle: "Show Virality Analysis."
- **UX honesty:** label it "Estimated" — it's an LLM heuristic, not a prediction of real engagement.

**Deliverable:** Users get an estimated virality score with explanation.

### Milestone 5 — Niche Angle Helper (3–4 days) · Priority: Medium
**Goal:** Help users find strong angles for their niche.
- Niche input (e.g. "crypto", "AI tools", "fitness").
- Prompt returns top **evergreen angles / hooks / topic frames** for that niche, in clean cards.
- **Honesty note (important):** An LLM has no live trend data — it cannot truthfully tell you "what's trending right now." This feature ships as an *angle/hook generator*, not a real-time trends tool, and the UI says so. A real-time version would require a paid data source (X API or a search/trends API) and is out of scope for the free MVP — tracked as a future enhancement.

**Deliverable:** Users get niche angle/hook suggestions.

### Milestone 6 — Polish, UX & Final Touches (4–5 days) · Priority: High
**Goal:** Make it feel premium.
- Loading/empty/error/success states across the app; subtle animations.
- History: last 5–10 generations in `localStorage`.
- Optional: "Save as Draft" / "Export as Image."
- Full mobile responsiveness; onboarding tooltips.
- In-app docs (how to get API keys); footer with credits.

**Deliverable:** Polished, production-ready webapp.

### Milestone 7 — Deployment & Launch (2–3 days) · Priority: High
**Goal:** Live and shareable.
- Deploy to Vercel; configure env vars (free keys, Upstash creds) in the dashboard.
- Optional custom domain.
- Add analytics (Vercel Analytics or Plausible — free).
- App-as-landing or a light dedicated landing.
- Launch on X, Reddit, Product Hunt.

**Deliverable:** Live webapp anyone can use.

---

## Timeline Summary

| Milestone | Focus                     | Est.       | Priority |
|-----------|----------------------------|------------|----------|
| 0         | Project Setup             | 1–2 days   | High     |
| 1         | Free Tier + BYOK          | 4–5 days   | Critical |
| 2         | Core Post Restructuring   | 4–5 days   | Critical |
| 3         | Responsive Previews       | 3–4 days   | High     |
| 4         | Virality Score            | 4–5 days   | High     |
| 5         | Niche Angle Helper        | 3–4 days   | Medium   |
| 6         | Polish & UX               | 4–5 days   | High     |
| 7         | Deployment                | 2–3 days   | High     |

**Total: ~26–33 days** of consistent work.

---

## Key Technical Decisions

1. **All AI calls run server-side** through Next.js Route Handlers — required for CORS, security, and free-tier protection.
2. **BYOK keys** live only in client `localStorage`, sent per-request, never persisted or logged on the server.
3. **Free-tier limit is enforced server-side by IP** (Upstash/KV); the client counter is cosmetic.
4. **Streaming** for the main generation; **structured output (zod)** for virality and niche results.
5. **Reusable AI hooks/functions** and a provider registry so adding a provider is a config change.
6. **Previews are CSS mocks** of the X post UI, not iframes.
7. **Virality and Niche features are framed honestly** (estimated / evergreen) — no fake real-time data claims.

---

## Environment Variables

```bash
# Server-only free-tier keys (never exposed to client)
GROQ_FREE_KEY=
OPENROUTER_FREE_KEY=

# Rate limiting (Upstash Redis — free tier)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
FREE_TIER_DAILY_LIMIT=10
```

BYOK keys are entered in the UI and stored in the browser — they are **not** environment variables.

---

## Known Limitations / Future Enhancements

- **Real-time trends** (true X trend data) requires a paid API — deferred past MVP.
- `localStorage` history/keys are per-browser and not synced across devices (acceptable for a free, no-login app).
- No user accounts in v1 — intentional, to keep it free and frictionless.

---

## Getting Started (as originally written)

> Build begins at Milestone 0. This section will be filled in once the project is scaffolded.

```bash
# coming in Milestone 0
npm install
npm run dev
```

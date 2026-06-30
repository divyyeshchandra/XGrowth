# X GlowUp

> The best free webapp to turn rough drafts into high-quality, viral-ready X posts.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Framework  | Next.js 15 (App Router)     |
| Styling    | Tailwind CSS + shadcn/ui    |
| AI Layer   | Vercel AI SDK               |
| State      | Zustand                     |
| Rate Limit | Upstash Redis (free tier)   |
| Deployment | Vercel (free)               |
| Providers  | Groq, OpenRouter, Anthropic, OpenAI, Custom |

## Architecture

All AI calls go through Next.js Route Handlers (server-side). BYOK keys are stored in `localStorage` and sent per-request — never persisted on the server. Free-tier rate limiting is enforced server-side by IP via Upstash Redis. Generation is **buffered, not streamed** (`generateText`) so deterministic post-processing in `lib/ai/format.ts` can clean the full output: strip AI-tell symbols (em-dashes, label-colons), flatten nested bullets, remove hallucinated links, and normalize spacing.

## Project Structure

```
src/
  app/
    page.tsx                  # main app
    layout.tsx                # root layout + dark mode
    api/
      generate/route.ts       # post restructuring
  components/
    ui/                       # shadcn primitives
    navbar.tsx                # top nav bar
    editor/output-card.tsx    # output display
    settings/settings-modal.tsx  # BYOK modal, provider selector
  hooks/
    use-generate.ts           # generation client hook
  lib/
    ai/
      providers.ts            # provider registry + model map
      prompts.ts              # system prompts (structure/tone/voice rules)
      format.ts                # deterministic post-processing
    ratelimit.ts               # server-side IP rate limiting
    storage.ts                 # localStorage helpers
  store/
    settings-store.ts          # Zustand store
  types/
    index.ts                   # TypeScript types
docs/
  prompt-archive/              # versioned snapshots of prompts.ts
viralXpostAlgo.md               # reference: viral post-writing formula we follow
```

## Environment Variables

```bash
# Real values go in .env.local (gitignored) — never commit them
GROQ_FREE_KEY=
OPENROUTER_FREE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
FREE_TIER_DAILY_LIMIT=10
```

---

## Milestone Plan & Progress

### ✅ Milestone 0 — Project Setup
Next.js 15 + Tailwind + shadcn/ui scaffolded, dark mode theme, folder structure, env vars.

### ✅ Milestone 1 — Free Tier + BYOK System
Provider selector (Groq/OpenRouter/Anthropic/OpenAI/Custom), settings modal, `localStorage` key storage with security notice, server-side IP rate limiting via Upstash for the free tier.

### ✅ Milestone 2 — Core Post Restructuring (expanded scope)
This became the bulk of the project. Originally "paste rough text, get a clean post" — it grew into a full AI-quality system after extensive iteration against real drafts:

- **4 selectable structures**: Smart (auto), Narrative (prose), Listicle, Curated — replacing the original Single/Thread toggle
- **Viral formula** (see `viralXpostAlgo.md`): a hook that ropes the reader in, readable white space, a personal/contextual body, one strong closer
- **Humanize voice pass**: dead-simple English, no AI-tell punctuation (em-dashes, label-colons, rhetorical questions), preserved human idioms, slang, and CTAs
- **Content integrity**: every draft is treated as if copied from someone else and is always rewritten (never echoed verbatim), while keeping facts/numbers/links exact — no fabrication, no inflated claims
- **Deterministic safety nets** (`lib/ai/format.ts`): strip hallucinated links, flatten nested bullets, normalize spacing, kill cliché phrases — so output quality doesn't depend entirely on the LLM following instructions
- **Mobile-first formatting**: one complete thought per line, heavy white space

### 🟡 Milestone 3 — Responsive Previews (partial)
Mobile/Tablet/Desktop preview tabs exist in the UI shell from Milestone 0 but haven't been revisited since. Needs a pass to confirm they render the current output correctly.

### ❌ Milestone 4 — Virality Score
Not started. Needs: a scoring prompt/route, structured JSON output (score + breakdown + suggestions), UI gauge wired to real generation.

### ❌ Milestone 5 — Niche Trends Helper
Not started. Framed as an "evergreen angle generator" (not real-time trends, since LLMs can't know live trends) per the original plan's honesty note.

### ❌ Milestone 6 — Polish & UX
Not started. History (last 5-10 generations), onboarding/tooltips, in-app docs, export options.

### ❌ Milestone 7 — Deployment & Launch
Not started. Deploy to Vercel, configure env vars, analytics, launch.

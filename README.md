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

## Project Structure

```
src/
  app/
    page.tsx                  # main app
    layout.tsx                # root layout + dark mode
    api/
      generate/route.ts       # post restructuring (streaming)
      virality/route.ts       # virality score
      niche/route.ts          # niche angle helper
  components/
    ui/                       # shadcn primitives
    navbar.tsx                # top nav bar
    editor/                   # input area, toolbar
    preview/                  # device frames + X post mock
    virality/                 # score gauge, breakdown cards
    settings/                 # BYOK modal, provider selector
  hooks/
  lib/
    ai/
      providers.ts            # provider registry + model map
      prompts.ts              # system prompts
      schemas.ts              # zod schemas for structured output
    ratelimit.ts              # server-side IP rate limiting
    storage.ts                # localStorage helpers
  store/
    settings-store.ts         # Zustand store
  types/
    index.ts                  # TypeScript types
```

## Architecture

All AI calls go through Next.js Route Handlers (server-side). BYOK keys are stored in localStorage and sent per-request — never persisted on the server. Free-tier rate limiting is enforced server-side by IP via Upstash Redis.

## Environment Variables

```bash
# See .env.example
GROQ_FREE_KEY=
OPENROUTER_FREE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
FREE_TIER_DAILY_LIMIT=10
```

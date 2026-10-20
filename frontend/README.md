# VoicePilot AI — Frontend

AI-powered voice sales calling dashboard built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Lucide icons.

> **Simulation mode:** this frontend does not place real calls, run real AI, or record audio. "Start Call" runs a clearly labeled scripted simulation so the UI can be demoed. Sample records are tagged **DEMO DATA**; simulated calls are tagged **SIMULATED**.

## Setup

```bash
pnpm install
cp .env.example .env.local   # optional — defaults to http://127.0.0.1:8000
pnpm dev
```

Open http://localhost:3000. No database or API keys are required to render the UI.

## Connecting the FastAPI backend

1. Set `NEXT_PUBLIC_API_URL` in `.env.local` (default `http://127.0.0.1:8000`).
2. Enable CORS on FastAPI for `http://localhost:3000`:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])
   ```
3. Open **Settings** in the app to verify the `/health` check.
4. Adjust endpoint paths in `lib/api/calls.ts` to match your routes.

Provider keys (telephony, STT, LLM) belong in the backend only — never in `NEXT_PUBLIC_*` variables.

## Project structure

```
app/                     layout, page, theme tokens (globals.css)
components/
  layout/                sidebar + top header
  dashboard/             metric cards
  call/                  call controls, voice orb, live transcript, AI insights
  calls/                 recent calls table, details dialog, recording player
  sections/              analytics + settings pages
  dashboard-app.tsx      app state + section routing
hooks/
  use-call-session.ts    call state machine (swap simulation for real provider here)
  use-microphone.ts      mic permission + stream handling
  use-audio-level.ts     live mic level for the visualizer
lib/
  api/client.ts          fetch wrapper, ApiError, NEXT_PUBLIC_API_URL
  api/calls.ts           typed backend endpoints
  demo/                  demo records + simulation script (UI demo only)
  types.ts               shared TypeScript types
```

The API layer never fabricates responses: if the backend is unreachable, requests throw an `ApiError` that the UI surfaces as an error state or toast.

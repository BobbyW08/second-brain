# Second Brain

A personal productivity app combining tasks, calendar, rich-text pages, tables, and AI — invite-only.

## Stack

TanStack Start + Nitro · Supabase (PostgreSQL + RLS + Auth + Realtime) · shadcn/ui + Tailwind v4 · FullCalendar v6 · BlockNote + @blocknote/xl-ai · Zustand · Vercel AI SDK · assistant-ui · react-arborist · Sonner

## Getting started

```bash
cp .env.example .env.local
# Fill in values — see .env.example for all required variables
npm install
npm run dev
```

## Key commands

```bash
npm run dev              # Dev server at http://localhost:3000
npm run build            # Production build
npm run check            # Biome lint + format
npm run typecheck        # TypeScript type check
npm run test             # Vitest unit tests
npm run db:types:remote  # Regenerate TypeScript types from hosted Supabase
```

## Environment variables

See `.env.example` for all required variables. Never commit `.env.local`.

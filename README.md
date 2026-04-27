# Second Brain

A personal productivity app combining tasks, calendar, rich-text pages, and AI — invite-only.

## Stack

TanStack Start + Nitro · Supabase · shadcn/ui + Tailwind v4 · FullCalendar v6 · BlockNote · react-arborist · Zustand · Sonner

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

## Design System
Jotion (sanidhyy/notion-clone, MIT) is the design system.
Use `hsl(var(--token))` CSS variables only. No hardcoded hex values anywhere.
See `memory-bank/second-brain-master-reference.md` for the full decision log.

## Known library status
react-arborist: abandoned by maintainer June 2025 (Issue #310).
Functional for now. Migrate to `lukasbach/headless-tree` before v0.5.

## Build status (April 27, 2026)
Current phase: **8-B — Empty states** (Phases 0–7 and 8-A complete)

Layout fixes:
- Ticket 0 ✅ — Jotion CSS variables adopted, hex tokens replaced
- Ticket A ✅ — CalendarView wrapper fixed (`flex-1 min-h-0 h-full overflow-hidden`)
- Ticket B ⚠️ OPEN — Files panel overlay + FolderTree not rendering.
  Fix prompt: `memory-bank/fix-prompts-v2.md` Prompt 2. Run before next feature session.
# Tech Context — Second Brain

## Full Stack

| Layer | Tool | Version | Notes |
|---|---|---|---|
| Framework | TanStack Start + Nitro | latest | SSR + server functions + Vercel deploy |
| Routing | TanStack Router | latest | File-based, type-safe, beforeLoad auth guard |
| Database | Supabase PostgreSQL | — | Free tier, RLS, Auth, Realtime, Storage |
| Auth | Supabase Auth | — | Google OAuth, invite-only, magic links |
| UI components | shadcn/ui | latest | Tailwind v4, copy-paste, fully owned |
| Styling | Tailwind CSS | v4 | Utility-first |
| Calendar | FullCalendar React | v6 | timeGrid, drag-drop, nowIndicator |
| Block editor | BlockNote + @blocknote/mantine | latest | Slash commands, drag-drop blocks |
| AI editor | @blocknote/xl-ai | latest | AI toolbar + /ai command — GPL-3 |
| Folder tree | react-arborist | latest | Drag-drop, inline rename, keyboard nav — MIT |
| AI chat UI | assistant-ui | latest | Streaming thread UI, WAI-ARIA — MIT |
| AI SDK | Vercel AI SDK | latest | streamText, useChat, Anthropic adapter |
| AI model | Anthropic Claude | API | claude-3-5-sonnet (chat), claude-3-haiku (suggestions) |
| State (client) | Zustand | latest | Persist, devtools, zero boilerplate |
| State (server) | TanStack Query | latest | Caching, invalidation, optimistic updates |
| Forms | React Hook Form + zod | latest | Type-safe validation, shadcn Form integration |
| Toasts | Sonner (shadcn) | latest | Non-blocking, undo button |
| Linting | Biome | latest | ESLint + Prettier replacement |
| Testing | Vitest | latest | Unit tests for pure functions |
| Deployment | Vercel Hobby | free | Nitro adapter, no custom vercel.json |

## Folder Structure

```
src/
  components/     # PascalCase, grouped by feature
  queries/        # camelCase — TanStack Query hooks
  hooks/          # useCamelCase
  server/         # camelCase — TanStack Start server functions
  types/          # PascalCase — TypeScript types
  lib/            # aiConstants.ts, utilities
  routes/         # TanStack Router file-based routes
supabase/
  migrations/     # SQL migration files
memory-bank/      # Cline memory bank (this folder)
```

## Key Patterns

- All Supabase calls use `.throwOnError()` — no silent error swallowing
- Server functions live in `src/server/` — never in a separate `api/` folder
- Every AI server function imports `TONE_SYSTEM_PROMPT` from `src/lib/aiConstants.ts`
- Zustand = client state only. TanStack Query = server/remote state only. Never mix.
- Protected routes use TanStack Router `beforeLoad` auth guard

## Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]   # server functions only

# Anthropic
ANTHROPIC_API_KEY=[key]

# App
VITE_APP_URL=http://localhost:3000             # Vercel URL in production
ADMIN_EMAIL=[your-email]                       # invite admin page access check
```

## Database Tables

- `profiles` — extended user data, Google tokens, tone preference
- `folders` — nested hierarchy for pages (parent_id self-reference)
- `pages` — rich text content (BlockNote JSON in `content` JSONB)
- `tasks` — priority bucket items (urgent / important / someday)
- `calendar_blocks` — scheduled time slots, Google Calendar sync
- `tables_schema` — dynamic field table definitions (columns JSONB)
- `table_rows` — rows for dynamic tables (data JSONB)
- `links` — bidirectional linking between pages/tasks/table rows
- `invites` — admin-issued invite tokens with expiry
- `ai_usage` — per-user AI consumption tracking

RLS enabled on all tables. Standard policy: `auth.uid() = user_id`.

## Key Commands

```bash
npm run dev          # Dev server at http://127.0.0.1:3000
npm run build        # Production build
npm run db:start     # Start local Supabase (Docker)
npm run db:reset     # Migrate + type-gen + seed
npm run db:types     # Regenerate TypeScript types
npm run check        # Biome lint + format
npm run typecheck    # TypeScript type checking
npm run test         # Vitest unit tests
```

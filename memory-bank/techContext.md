# Tech Context — Second Brain

## Full Stack

| Layer | Tool | Version | Notes |
|---|---|---|---|
| Framework | TanStack Start + Nitro | ^3.0.0 stable | SSR + server functions + Vercel deploy |
| Routing | TanStack Router | latest | File-based, type-safe, beforeLoad auth guard |
| Database | Supabase PostgreSQL | — | Free tier, RLS, Auth, Realtime, Storage |
| Auth | Supabase Auth | — | Google OAuth, invite-only |
| UI components | shadcn/ui | latest | Tailwind v4, copy-paste, fully owned |
| Styling | Tailwind CSS | v4 | Utility-first, dark mode via CSS vars |
| Calendar | FullCalendar React | v6 | timeGrid + interaction + dayGrid plugins |
| Block editor | BlockNote + @blocknote/mantine | latest | Default schema only — no custom inline content |
| Folder tree | react-arborist | latest | Drag-drop, inline rename, keyboard nav — MIT |
| Date parsing | chrono-node | latest | Free-text date input in task cards |
| State (client) | Zustand | latest | UI state only — panel open/closed, selected item |
| State (server) | TanStack Query | latest | All async/server state, caching, optimistic updates |
| Forms | React Hook Form + Zod | latest | shadcn Form integration |
| Toasts | Sonner | latest | Non-blocking, undo button support |
| Linting | Biome | latest | ESLint + Prettier replacement, one config file |
| Testing | Vitest | latest | Unit tests for pure functions |
| Deployment | Vercel Hobby | free | Nitro adapter, no custom vercel.json needed |

**Not in v0.1 — comes in v0.5:**
@blocknote/xl-ai, assistant-ui, @ai-sdk/anthropic, @ai-sdk/react, Vercel AI SDK,
Anthropic API. Do not install or import any of these until v0.5.

**Never use:**
googleapis npm package — 29 MB, crashes the build. Google Calendar calls use direct
fetch to REST endpoints with Bearer token auth only.

---

## Folder Structure

```
src/
  components/       # PascalCase, grouped by feature
  queries/          # camelCase — TanStack Query hooks
  hooks/            # useCamelCase
  server/           # camelCase — TanStack Start server functions only
  types/            # PascalCase — TypeScript types
  lib/              # taskConstants.ts, utilities, aiConstants.ts (unused until v0.5)
  stores/           # useStoreName.ts — Zustand stores
  utils/            # auth.ts, queryClient.ts, etc.
  routes/           # TanStack Router file-based routes
supabase/
  migrations/       # SQL migration files, run in order
memory-bank/        # Agent memory (this folder)
```

---

## Key Patterns

**Supabase calls:** Every call ends with `.throwOnError()`. No empty catch blocks.

**Server functions:** All server logic lives in `src/server/` as TanStack Start
`createServerFn` calls. Never in a separate `api/` folder.

**Mutations:** Every mutation that changes a list must have onMutate (optimistic
update + snapshot), onError (restore snapshot), onSettled (invalidate queries).
Reference: src/queries/tasks.ts useCreateTask.

**Server function calling convention:**
```ts
// Correct
syncGoogleCalendar({ data: { userId, accessToken } })
// Wrong
syncGoogleCalendar({ userId, accessToken })
```

**Auth guard:** Protected routes use `requireAuth()` from `src/utils/auth.ts` in
`beforeLoad`. Never check auth inside a component.

**State separation:**
- Zustand → panel open/closed, selected item, drag state, toggle state only
- TanStack Query → all data fetched from Supabase or Google
- Never store server data in Zustand. Never fetch inside a Zustand store.

**FullCalendar drag:** Only FullCalendar's `Draggable` class from
`@fullcalendar/interaction`. Never dnd-kit or react-dnd alongside FullCalendar.
TaskCard must have `className="task-card"` and data attributes: `data-task-id`,
`data-title`, `data-duration`.

---

## Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]   # server functions only

# Google OAuth (set in Supabase dashboard, not .env)
# Client ID and secret live in Supabase Auth settings

# App
VITE_APP_URL=http://localhost:3000             # Vercel URL in production
ADMIN_EMAIL=[your-email]                       # admin invite page access check
```

---

## Database Tables

- `profiles` — extended user data, Google OAuth tokens, tone preference
- `folders` — nested hierarchy (parent_id self-reference)
- `pages` — BlockNote JSON content, position column, linked_page_id on calendar_blocks
- `tasks` — bucket items with bucket_id, chrono-node parsed date/time fields
- `calendar_blocks` — scheduled time slots, google_event_id (unique), linked_page_id
- `buckets` — user-configurable priority buckets with color and position
- `links` — bidirectional linking between pages and tasks
- `invites` — admin-issued invite tokens with expiry
- `ai_usage` — reserved for v0.5, exists in schema but unused in v0.1

RLS enabled on all tables. Standard policy: `auth.uid() = user_id`.

**Dropped in v0.1 migrations:** `tables_schema`, `table_rows` (Migration 6).

---

## Key Commands

```bash
npm run dev          # Dev server at http://127.0.0.1:3000
npm run build        # Production build — must pass before every commit
npm run check        # Biome lint + format — must pass before every commit
npm run typecheck    # TypeScript type checking (tsc --noEmit)
npm run test         # Vitest unit tests
npm run db:start     # Start local Supabase (Docker)
npm run db:reset     # Run migrations + regenerate types + seed
npm run db:types     # Regenerate src/types/database.types.ts
```

---

## Reference Files for Patterns

When in doubt, look at existing working code before inventing a new pattern:

- Data layer pattern: `src/queries/tasks.ts`
- Calendar pattern: `src/components/calendar/CalendarView.tsx`
- Layout pattern: `src/components/layout/AppLayout.tsx`
- Auth pattern: `src/utils/auth.ts`

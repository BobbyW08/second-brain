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
| Deployment | Vercel Hobby | free | Nitro adapter, personal/non-commercial use |

**Not in v0.1 — comes in v0.5:**
@blocknote/xl-ai, assistant-ui, @ai-sdk/anthropic, @ai-sdk/react, Vercel AI SDK,
Anthropic API. Do not install or import any of these until v0.5.

**Never use:**
googleapis npm package — 29 MB, crashes the build. Google Calendar calls use direct
fetch to REST endpoints with Bearer token auth only.

---

## v0.5 Stack Additions (plan ahead — do not install yet)

| Layer | Tool | Notes |
|---|---|---|
| AI SDK | Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) | Use tanchat as integration reference |
| AI UI | assistant-ui (`@assistant-ui/react`, `@assistant-ui/react-ai-sdk`) | Chat panel component |
| AI routes | TanStack Start API routes (`createAPIFileRoute`) | See tanchat pattern below |
| MCP server | Supabase MCP server (official) | Exposes DB to Claude.ai — no API cost for analysis |
| Scheduled AI | Supabase Edge Functions + pg_cron | Daily briefs, weekly reviews, event-triggered AI |
| AI SDK alt | TanStack AI (`@tanstack/ai`) | In alpha April 2026 — evaluate at v0.5 start |

**AI SDK decision at v0.5 start:**
TanStack AI is in alpha as of April 2026 — it's the native TanStack ecosystem choice
but may have breaking changes. Vercel AI SDK is production-stable and assistant-ui
targets it. Default to Vercel AI SDK unless TanStack AI has reached stable by then.

**MCP + Scheduled AI architecture:**
- Supabase MCP server → connect to Claude.ai → analyze tasks/calendar/pages on Pro subscription (no API cost)
- pg_cron schedules Edge Functions (daily brief at 7am, weekly review Sunday evening)
- Database webhooks trigger Edge Functions on events (task complete → debrief page, etc.)
- Edge Functions call Anthropic API, write BlockNote JSON to pages table
- Supabase Realtime notifies app → Sonner toast → user opens the pre-written page
- This means heavy analysis/reports run on subscription; embedded interactive AI uses API

---

## Reference Repos (MIT licensed unless noted — copy freely)

Pre-vetted implementations for specific tickets. Full per-ticket porting notes with
exact file paths and code patterns are in memory-bank/second-brain-build-plan-addendum-v2.md.
Never copy styles verbatim — apply Second Brain design tokens.

| Ticket | Repo | What to use | Key note |
|---|---|---|---|
| 4-A / 4-B TaskCard | `satnaing/shadcn-admin` → `src/features/tasks/` | Form field structure from tasks-dialogs.tsx | Take fields, NOT the Sheet wrapper — use expand-in-place |
| 5-B / 5-C Calendar styling | `robskinney/shadcn-ui-fullcalendar-example` | CSS variable overrides for FullCalendar + shadcn | Apply Second Brain zone colors |
| 6-X Page headers | `sanidhyy/notion-clone` → `components/cover.tsx`, `icon-picker.tsx`, `toolbar.tsx` | Cover image + emoji icon + page toolbar | Replace Convex→Supabase, EdgeStore→Supabase Storage, no emoji-picker-react package |
| v0.5 AI routes (Apache-2.0) | `osadavc/tanchat` | TanStack Start + Vercel AI SDK integration | ONLY known TanStack Start AI chatbot reference — read before any AI route code |

**FullCalendar drag — exact pattern (from official docs):**
```tsx
// Two required props on <FullCalendar>:
droppable={true}   // external drops
editable={true}    // move/resize existing events

// Draggable setup in BucketPanel useEffect:
new Draggable(containerEl, {
  itemSelector: '.task-card',
  eventData: (el) => ({
    title: el.dataset.title,
    duration: el.dataset.duration,
    extendedProps: { taskId: el.dataset.taskId },
  }),
})

// On each TaskCard div:
className="task-card"
data-task-id={task.id}
data-title={task.title}
data-duration={task.duration ?? '01:00'}
```

**tanchat AI route pattern:**
```typescript
// src/routes/api/chat.ts
export const APIRoute = createAPIFileRoute('/api/chat')({
  POST: async ({ request }) => {
    const { messages } = await request.json()
    const result = streamText({ model: anthropic(AI_MODELS.default), system: TONE_SYSTEM_PROMPT, messages })
    return result.toUIMessageStreamResponse()
  },
})
```

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
Do not add `if (error) throw error` after `.throwOnError()` — it's redundant.

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

# Google OAuth — credentials live in Supabase Auth dashboard, not .env
# For server-side token refresh (Drive import, v0.5):
# GOOGLE_CLIENT_ID=[same value as in Supabase dashboard]
# GOOGLE_CLIENT_SECRET=[same value as in Supabase dashboard]

# App
VITE_APP_URL=http://localhost:3000             # Vercel URL in production
ADMIN_EMAIL=[your-email]                       # admin invite page access check

# v0.5 only (do not add until then):
# ANTHROPIC_API_KEY=[api-key]
```

---

## Database Tables

### v0.1 (all exist, RLS enabled)
- `profiles` — extended user data, Google OAuth tokens, tone preference
- `folders` — nested hierarchy (parent_id self-reference)
- `pages` — BlockNote JSON content, position column
- `tasks` — bucket items with bucket_id, chrono-node parsed date/time fields
- `calendar_blocks` — scheduled time slots, google_event_id (unique), linked_page_id
- `buckets` — user-configurable priority buckets with color and position
- `links` — bidirectional linking between pages and tasks
- `invites` — admin-issued invite tokens with expiry
- `ai_usage` — reserved for v0.5, exists in schema but unused in v0.1

Dropped in v0.1: `tables_schema`, `table_rows` (Migration 6).

### Phase 6-X (add when Phase 6-X begins)
- `pages.icon` — text column, emoji character
- `pages.cover_url` — text column, Supabase Storage public URL
- Supabase Storage bucket: `page-covers` (public, 5MB limit, image/* types)

### v0.5 (do not add until v0.5 work begins)
- `drive_synced_folders` — Google Drive folders the user has imported
- `drive_files` — cached Drive file metadata (flat, reconstructed as tree client-side)
- `ai_threads` — chat thread history for the AI panel
- `tasks.icon` — emoji column for task icons

### v1.0 (do not add until v1.0 work begins)
- `page_tags` — join table: page_id + user_id + tag (freeform text)
- `pages.reminder_at` — timestamptz for page reminders
- `pages.reminder_dismissed_at` — timestamptz for dismissed reminders
- `profiles.inbox_folder_id` — uuid pointing to the system Inbox folder

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

- Data layer: `src/queries/tasks.ts`
- Calendar: `src/components/calendar/CalendarView.tsx`
- Layout: `src/components/layout/AppLayout.tsx`
- Auth: `src/utils/auth.ts`
- Server function: `src/server/googleCalendar.ts`

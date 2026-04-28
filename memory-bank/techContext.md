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
| Block editor | BlockNote + @blocknote/mantine | latest | Default schema in v0.1; custom inline content in v0.5 |
| Folder tree | Migrating from react-arborist (abandoned June 2025) to pattern from aldhyx/station-a-notion-clone (MIT). See TICKET v0.5-0. No new tree library installed — aldhyx renders recursively with plain React components. | — | — |
| Date parsing | chrono-node | latest | Free-text date input in task cards |
| State (client) | Zustand | latest | UI state only |
| State (server) | TanStack Query | latest | All async/server state, caching, optimistic updates |
| Forms | React Hook Form + Zod | latest | shadcn Form integration |
| Toasts | Sonner | latest | Non-blocking, undo button support |
| Linting | Biome | latest | ESLint + Prettier replacement |
| Testing | Vitest | latest | Unit tests for pure functions |
| Deployment | Vercel Hobby | free | Nitro adapter, auto-deploy from GitHub main |

**Never install:**
- `@blocknote/xl-ai` — GPL-3.0, requires commercial license for closed-source apps
- `googleapis` npm package — 29MB, crashes Vercel build
- `@tanstack/ai` — still alpha April 2026

---

## v0.5 Stack Additions (now active)

| Layer | Tool | Notes |
|---|---|---|
| AI SDK | Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) | Use tanchat as integration reference |
| AI UI | assistant-ui (`@assistant-ui/react`, `@assistant-ui/react-ai-sdk`) | Chat panel component |
| AI routes | TanStack Start API routes (`createAPIFileRoute`) | See tanchat pattern below |
| AI constants | `src/lib/aiConstants.ts` | All server functions import from here — never inline prompts |
| MCP server | Supabase MCP server (official) | Configure, don't build — exposes DB to Claude.ai |
| Scheduled AI | Supabase Edge Functions + pg_cron | Daily briefs, weekly reviews, event-triggered AI |

**AI SDK decision:** TanStack AI is in alpha — use Vercel AI SDK for all v0.5 work.

---

## Reference Repos

| Feature | Repo | License | What to use |
|---|---|---|---|
| Folder tree (v0.5-0) | `aldhyx/station-a-notion-clone` | MIT | Lift sidebar tree + Supabase wiring. Translate Next.js → TanStack Start. Wire to existing query hooks — do not change hooks. |
| AI routes (v0.5-1) | `osadavc/tanchat` | Apache-2.0 | ONLY known TanStack Start + Vercel AI SDK reference. Read before any AI route work. |
| AI chat panel (v0.5-2) | assistant-ui official docs | MIT | `@assistant-ui/react` + `@assistant-ui/react-ai-sdk` |
| AI writing toolbar (v0.5-3) | BlockNote official docs | MPL-2.0 | `FormattingToolbarController` + custom button. NEVER `@blocknote/xl-ai`. |
| Chrome extension (v1.0-1) | `theluckystrike/chrome-extension-starter-mv3` | MIT | Full scaffold — React + TypeScript + Tailwind + MV3 |
| Web clipper extraction (v1.0-1) | `obsidianmd/obsidian-clipper` | MIT | Study only: Readability.js + Turndown pattern |
| Presentation mode (v1.0-2) | `hakimel/reveal.js` | MIT | BlockNote → Markdown → Reveal.js → fullscreen route |
| TaskCard (done) | `satnaing/shadcn-admin` | MIT | Form field structure — complete |
| FullCalendar CSS (done) | `robskinney/shadcn-ui-fullcalendar-example` | No license | Patterns only — complete |
| Page headers (done) | `sanidhyy/notion-clone` | MIT | Cover + icon + toolbar — complete |

---

## Key Patterns

**Supabase calls:** Every call ends with `.throwOnError()`. No empty catch blocks.

**Server functions:** All server logic in `src/server/` as `createServerFn`.
Never in a separate `api/` folder.

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

**AI constants (v0.5+):** Every AI server function imports `TONE_SYSTEM_PROMPT`
and `AI_MODELS` from `src/lib/aiConstants.ts`. Never inline system prompts.

**tanchat AI route pattern:**
```typescript
// src/routes/api/chat.ts
export const APIRoute = createAPIFileRoute('/api/chat')({
  POST: async ({ request }) => {
    const { messages } = await request.json()
    const result = streamText({
      model: anthropic(AI_MODELS.default),
      system: TONE_SYSTEM_PROMPT,
      messages
    })
    return result.toUIMessageStreamResponse()
  },
})
```

**FullCalendar drag — exact pattern:**
```tsx
// Two required props on :
droppable={true}
editable={true}

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

---

## Folder Structure
src/
components/       # PascalCase, grouped by feature
queries/          # camelCase — TanStack Query hooks
hooks/            # useCamelCase
server/           # camelCase — TanStack Start server functions only
types/            # PascalCase — TypeScript types
lib/              # taskConstants.ts, aiConstants.ts, utilities
stores/           # useStoreName.ts — Zustand stores
utils/            # auth.ts, queryClient.ts, etc.
routes/           # TanStack Router file-based routes
supabase/
migrations/       # SQL migration files, run in order
memory-bank/        # Agent memory (this folder)

---

## Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]   # server functions only

# Google OAuth — credentials live in Supabase Auth dashboard
# For server-side token refresh:
# GOOGLE_CLIENT_ID=[same as Supabase dashboard]
# GOOGLE_CLIENT_SECRET=[same as Supabase dashboard]

# App
VITE_APP_URL=http://localhost:3000
ADMIN_EMAIL=[your-email]

# v0.5 — add now
ANTHROPIC_API_KEY=[api-key]
```

---

## Database Tables

### v0.1 (all exist, RLS enabled)
- `profiles` — extended user data, Google OAuth tokens, tone preference
- `folders` — nested hierarchy (parent_id self-reference)
- `pages` — BlockNote JSON content, position, icon, cover_url
- `tasks` — bucket items with bucket_id, chrono-node parsed fields
- `calendar_blocks` — scheduled time slots, google_event_id (unique), linked_page_id
- `buckets` — user-configurable priority buckets with color and position
- `links` — bidirectional linking between pages and tasks
- `invites` — admin-issued invite tokens with expiry
- `ai_usage` — reserved for v0.5

### v0.5 (add as each ticket requires — run migration then npm run db:types)
- `ai_threads` — TICKET v0.5-1
- `captures` — TICKET v0.5-7
- `folders.is_system boolean` — TICKET v0.5-7
- `contacts` — TICKET v0.5-8
- `interactions` — TICKET v0.5-8
- `interaction_contacts` — TICKET v0.5-8
- `linked_entities` — TICKET v0.5-9
- `tasks.icon text` — TICKET v0.5-2 or standalone migration

### v1.0 (do not add until v1.0 work begins)
- `page_tags` — join table
- `pages.reminder_at` — timestamptz
- `pages.reminder_dismissed_at` — timestamptz

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

- Data layer:    `src/queries/tasks.ts`
- Calendar:      `src/components/calendar/CalendarView.tsx`
- Layout:        `src/components/layout/AppLayout.tsx`
- Auth:          `src/utils/auth.ts`
- Google API:    `src/server/googleCalendar.ts`
- AI constants:  `src/lib/aiConstants.ts` (create in v0.5-1 if not present)
# Second Brain

## What this app is

Second Brain is an invite-only personal productivity app for a single primary user.
The entire app is one split-panel surface. Left panel toggles between Priorities and
Files. Right panel toggles between Calendar and Editor. No separate pages for tasks,
journal, or tables. Everything lives on the dashboard.

Google Calendar two-way sync is a required MVP feature. The app does not function
without it. Do not defer or stub it.

---

## Current version: v0.5

v0.1 is complete and deployed to Vercel (commit c897259, April 28 2026).
v0.5-0 (Folder Tree Migration) is complete. v0.5-1 (AI Infrastructure) is next.

AI features are now being added in v0.5. The banned-AI-packages rule from v0.1
no longer applies. However: NEVER install @blocknote/xl-ai — it is GPL-3.0 and
requires a paid commercial license for closed-source apps. Build the AI writing
toolbar with FormattingToolbarController + a custom button instead.

---

## Stack

Framework:     TanStack Start + Nitro v3 (stable, not nightly)
Router:        TanStack Router (file-based, beforeLoad auth guard)
Database:      Supabase (PostgreSQL + RLS + Google OAuth)
UI:            shadcn/ui + Tailwind v4
Calendar:      FullCalendar v6 (timeGrid + interaction + dayGrid plugins)
Editor:        BlockNote + @blocknote/mantine (default schema only in v0.1;
               custom inline content allowed in v0.5 for [[PageTitle]] chips)
Folder tree:   Migrating from react-arborist (abandoned June 2025) to pattern
               lifted from aldhyx/station-a-notion-clone (MIT). See TICKET v0.5-0.
State client:  Zustand (UI state only)
State server:  TanStack Query (all async/server state)
Date parsing:  chrono-node (free-text date input in task cards)
Forms:         React Hook Form + Zod
Toasts:        Sonner
Linting:       Biome
Testing:       Vitest
Deploy:        Vercel Hobby (Nitro preset via process.env.VERCEL in vite.config.ts)

v0.5 additions (now active):
  AI SDK:      Vercel AI SDK (ai, @ai-sdk/anthropic, @ai-sdk/react)
  AI UI:       assistant-ui (@assistant-ui/react, @assistant-ui/react-ai-sdk)
  AI routes:   TanStack Start API routes — see tanchat pattern below
  MCP:         Supabase MCP server (official) — configure, don't build

NEVER install: @blocknote/xl-ai (GPL-3.0, commercial license required)
NEVER install: googleapis npm package (29MB, crashes Vercel build)
NEVER install: @tanstack/ai (still alpha April 2026 — use Vercel AI SDK)

CRITICAL for all AI work: Before writing a single line of AI code, clone and study
osadavc/tanchat (Apache-2.0) — the only known repo porting vercel/ai-chatbot to
TanStack Start. The route pattern is:
  src/routes/api/chat.ts → returns streamText().toUIMessageStreamResponse()
Do NOT port Next.js App Router AI examples directly. Use tanchat as the translation layer.

All AI server functions must import TONE_SYSTEM_PROMPT and AI_MODELS from
src/lib/aiConstants.ts. Never inline system prompts.

---

## Hard rules — never break these

1. No separate api/ folder. All server logic lives in src/server/ as TanStack Start
   server functions (createServerFn) or in server/routes/api/ as Nitro h3 handlers.
   Never create an api/ directory at the project root.

2. Every Supabase call ends with .throwOnError(). No silent error swallowing.
   No empty catch blocks.

3. Never use these words anywhere in JSX, variable names, CSS classes, comments,
   toast messages, or UI copy: overdue, late, missed, behind, failed, incomplete,
   "you should", "you need to". Language is always forward-looking and neutral.

4. Zustand is for client and UI state only (panel open/closed, selected item, drag
   state, toggle state). TanStack Query is for all server and async state. Never store
   server data in Zustand. Never fetch data inside a Zustand store.

5. Do not use dnd-kit or react-dnd for calendar drag. FullCalendar's Draggable class
   from @fullcalendar/interaction is the only drag library that touches the calendar.

6. Never use the googleapis npm package. Google Calendar API calls use direct fetch
   to REST endpoints with Bearer token auth. See src/server/googleCalendar.ts.

7. Never install @blocknote/xl-ai. It is GPL-3.0. Build the AI writing toolbar
   using FormattingToolbarController + a custom AI button calling the Vercel AI SDK.

8. All AI server functions import TONE_SYSTEM_PROMPT and AI_MODELS from
   src/lib/aiConstants.ts. Never inline system prompts anywhere.

9. After completing a session, update memory-bank/activeContext.md with the next
   ticket and update memory-bank/progress.md to check off completed items.
10. Universal capture must remain single-field first. Do not regress into
    dropdown-heavy intake.
11. Any external side effect from a capture — calendar creation, texting, outreach,
    contact sync writes — must be reviewable before execution. Nothing fires
    automatically.

---

## Folder structure
src/
components/     # PascalCase, grouped by feature
queries/        # camelCase — TanStack Query hooks
hooks/          # useCamelCase
server/         # camelCase — TanStack Start server functions only
types/          # PascalCase — TypeScript types
lib/            # taskConstants.ts, aiConstants.ts, utilities
stores/         # useStoreName.ts — Zustand stores
utils/          # auth.ts, queryClient.ts, etc.
routes/         # TanStack Router file-based routes
supabase/
migrations/     # SQL migration files, run in order
memory-bank/      # Agent memory — activeContext.md, progress.md, techContext.md

## File naming conventions

Components:       PascalCase    → src/components/[feature]/ComponentName.tsx
Query hooks:      camelCase     → src/queries/featureName.ts
Custom hooks:     useCamelCase  → src/hooks/useHookName.ts
Server functions: camelCase     → src/server/serverFnName.ts
Types:            PascalCase    → src/types/TypeName.ts
Stores:           useStoreName  → src/stores/useStoreName.ts
Constants:        SCREAMING_SNAKE_CASE for values, camelCase for objects

---

## Environment variables

```bash
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]   # server functions only
VITE_APP_URL=http://localhost:3000             # Vercel URL in production
ADMIN_EMAIL=[your-email]                       # admin invite page access check
ANTHROPIC_API_KEY=[api-key]                    # v0.5 — add now
# Google OAuth client ID and secret live in Supabase Auth dashboard, not .env
```

## Key commands

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

## Architecture patterns — always follow these

### TanStack Query mutations

Every mutation that changes a list must have:
- onMutate: cancel queries, snapshot previous, apply optimistic update, return snapshot
- onError: restore snapshot from context
- onSettled: invalidate queries

Reference implementation: src/queries/tasks.ts useCreateTask

### Server function calling convention

```ts
// Correct
syncGoogleCalendar({ data: { userId, accessToken } })
// Wrong
syncGoogleCalendar({ userId, accessToken })
```

### Auth guard

Protected routes use requireAuth() from src/utils/auth.ts in beforeLoad.
Never check authentication inside a component body.

### App layout structure

AppLayout (src/components/layout/AppLayout.tsx) uses plain flexbox layout
(shadcn SidebarProvider was replaced in Sessions 1-4).
Left panel content: BucketPanel (Priorities mode) or FolderTree (Files mode).
Right panel content: CalendarView (Priorities mode) or FilesLandingPage/PageView
(Files mode). Panel toggle state lives in useUIStore.

### AI constants (v0.5+)

```ts
// src/lib/aiConstants.ts — always import from here, never inline
export const AI_MODELS = {
  default: 'claude-sonnet-4-20250514',
  fast: 'claude-haiku-4-5-20251001',
} as const

export const TONE_SYSTEM_PROMPT = `...` // see aiConstants.ts for full text
```

---

## Database tables

### v0.1 (all exist, RLS enabled)
- `profiles` — extended user data, Google OAuth tokens, tone preference
- `folders` — nested hierarchy (parent_id self-reference)
- `pages` — BlockNote JSON content, position column, icon, cover_url
- `tasks` — bucket items with bucket_id, chrono-node parsed date/time fields
- `calendar_blocks` — scheduled time slots, google_event_id (unique), linked_page_id
- `buckets` — user-configurable priority buckets with color and position
- `links` — bidirectional linking between pages and tasks
- `invites` — admin-issued invite tokens with expiry
- `ai_usage` — reserved for v0.5

### v0.5 (add as each ticket requires — run migration, then npm run db:types)
- `ai_threads` — chat thread history (TICKET v0.5-1)
- `captures` — universal capture entries (TICKET v0.5-7)
- `folders.is_system` — boolean column for _system folder guard (TICKET v0.5-7)
- `contacts` — Google/manual contact cards (TICKET v0.5-8)
- `interactions` — AI-enriched interaction log (TICKET v0.5-8)
- `interaction_contacts` — many-to-many join (TICKET v0.5-8)
- `linked_entities` — universal backlink graph (TICKET v0.5-9)
- `tasks.icon` — emoji column for task icons (TICKET v0.5-2)

### v1.0 (do not add until v1.0 work begins)
- `page_tags` — join table: page_id + tag
- `pages.reminder_at` — timestamptz
- `pages.reminder_dismissed_at` — timestamptz

---

## Reference repos

Pre-vetted implementations. Never copy styles verbatim — always apply Second Brain
design tokens. Full ticket specs are in memory-bank/v05-v10-build-plan.md.

- Folder tree (v0.5-0): `aldhyx/station-a-notion-clone` (MIT)
  Lift sidebar tree component + Supabase wiring. Translate Next.js → TanStack Start.
  Do NOT change existing query hooks in src/queries/folders.ts or src/queries/pages.ts.

- AI routes (v0.5-1): `osadavc/tanchat` (Apache-2.0)
  ONLY known TanStack Start + Vercel AI SDK integration. Read before any AI route work.
  Route pattern: src/routes/api/chat.ts → streamText().toUIMessageStreamResponse()

- AI chat panel (v0.5-2): assistant-ui official docs (MIT)
  @assistant-ui/react + @assistant-ui/react-ai-sdk. Read TanStack Start guide.

- AI writing toolbar (v0.5-3): BlockNote official docs (MPL-2.0)
  FormattingToolbarController + custom AI button. NEVER @blocknote/xl-ai (GPL-3.0).

- Chrome extension scaffold (v1.0-1): `theluckystrike/chrome-extension-starter-mv3` (MIT)
  React + TypeScript + Tailwind + MV3. Use as base for web clipper.

- Web clipper extraction (v1.0-1): `obsidianmd/obsidian-clipper` (MIT)
  Study only: Readability.js + Turndown pattern for article/selection extraction.

- Presentation mode (v1.0-2): `hakimel/reveal.js` (MIT)
  BlockNote → Markdown → Reveal.js → fullscreen route.

- TaskCard (done, v0.1): `satnaing/shadcn-admin` → src/features/tasks/
- FullCalendar CSS (done, v0.1): `robskinney/shadcn-ui-fullcalendar-example` (no license — patterns only)
- Page headers (done, v0.1): `sanidhyy/notion-clone` (MIT)

---

## What is already built and working — do not rewrite

### Infrastructure
- Auth: Google OAuth, invite gate in auth.callback.tsx, requireAuth, admin invite page
- Database: all v0.1 tables with RLS, all 6 migration files run, generated types in
  src/types/database.types.ts
- App shell: AppLayout, AppSidebar, TopBar, dark mode ThemeProvider, Sonner Toaster
  (all rebuilt with Jotion architecture in Sessions 1-4 — plain flexbox, no SidebarProvider)
- Utils: useAutosave, useCurrentUser, archiveTasks, queryClient
- Vitest tests: 8 passing

### Data layer (src/queries/)
- tasks.ts — full CRUD with optimistic updates, useCompleteTask, useUndoCompleteTask
- buckets.ts — full CRUD with optimistic updates
- pages.ts — full CRUD, position, autosave
- folders.ts — full CRUD, rename, move, delete
- calendar.ts — calendar blocks CRUD, Google sync hooks

### Components
- Global search: ⌘K CommandDialog with navigation, link-picker mode, tasks + pages + folders
- BlockNote page editor: PageView with 800ms autosave, saving indicator, inline title editing
- FolderTree: rewritten v0.5-0 — recursive tree with Zustand expand state, New Folder button,
  system folder guard, double-click rename, rich context menu (no react-arborist, no aldhyx deps)
- BucketPanel: left panel in Priorities mode, configurable buckets, drag data attributes
- TaskCard: closed state + expand-in-place open state, chrono-node date parsing, all fields
- CompletedTodaySection: completed tasks with working undo
- CalendarView: 3-day default, zone labels + colors, droppable + editable, drag-to-schedule,
  drag-to-reschedule, drag-to-create, EventSidePanel wired on block click
- EventSidePanel: slides over calendar, shows block details, delete block, link to page
- MiniCalendarDrawer: narrow calendar drawer in Files mode
- FilesLandingPage: recent pages + linked calendar events
- SettingsPage: profile, theme, Google Calendar connect/disconnect/sync sections
- AppSidebar: ⌘B collapse, Priorities/Files mode toggle

### Styles
- calendar.css: full robskinney --fc-* variable wiring, dark mode scoped under .dark
- globals.css: complete Jotion token set including sidebar and chart tokens

### Server functions (src/server/)
- googleCalendar.ts: full rewrite using direct fetch (no googleapis), token refresh,
  create/update/delete/list events, inbound sync

---

## What has been deleted — do not recreate these files

src/components/ai/AIChatPanel.tsx          — being rebuilt properly in v0.5
src/components/editor/LinkChip.tsx         — being rebuilt properly in v0.5
src/components/editor/linkChipSpec.ts      — being rebuilt properly in v0.5
src/components/journal/JournalLayout.tsx   — journal is a folder, not a route
src/components/journal/JournalView.tsx     — journal is a folder, not a route
src/components/tables/ (all files)         — tables are BlockNote blocks, not a section
src/routes/_authenticated/journal/        — journal has no routes
src/routes/_authenticated/tables/         — tables section removed entirely
src/routes/_authenticated/tasks/index.tsx — tasks are in the left panel, not a page
src/stores/taskStore.ts                    — was never imported anywhere
src/hooks/useAIContext.ts                  — being rebuilt properly in v0.5
server/routes/api/ai-chat.ts               — being rebuilt properly in v0.5

If any import references these files, remove the import.

---

## Feature roadmap summary

| Feature | Version | Status |
|---|---|---|
| Auth, app shell, editor, search, buckets, calendar base | v0.1 | ✅ Complete |
| TaskCard, EventSidePanel, FilesLandingPage, Google sync, Search | v0.1 | ✅ Complete |
| Loading skeletons, empty states, error boundaries, tone audit | v0.1 | ✅ Complete |
| Deploy to Vercel | v0.1 | ✅ Complete — commit c897259 |
| Jotion page headers (icon + cover image) | v0.1 | ✅ Complete — included in Sessions 1-4 |
| Folder tree migration (react-arborist → aldhyx pattern) | v0.5 | ✅ Complete |
| AI infrastructure (route + constants + thread persistence) | v0.5 | ⏳ TICKET v0.5-1 |
| AI chat panel (assistant-ui) | v0.5 | ⏳ TICKET v0.5-2 |
| AI writing toolbar (FormattingToolbarController) | v0.5 | ⏳ TICKET v0.5-3 |
| AI journal prompts | v0.5 | ⏳ TICKET v0.5-4 |
| Scheduling suggestions ("Suggest my day") | v0.5 | ⏳ TICKET v0.5-5 |
| Supabase MCP server | v0.5 | ⏳ TICKET v0.5-6 |
| Universal Capture System (⌘J modal + AI pipeline) | v0.5 | ⏳ TICKET v0.5-7 |
| Contacts & Interactions (People CRM) | v0.5 | ⏳ TICKET v0.5-8 |
| Universal backlink graph + inline page linking | v0.5 | ⏳ TICKET v0.5-9 |
| Capture Review Queue + Action Approval UI | v0.5 | ⏳ TICKET v0.5-10 |
| Calendar Drafts from Capture Text | v0.5 | ⏳ TICKET v0.5-11 |
| SMS / Outreach Draft Actions from Capture | v0.5 | ⏳ TICKET v0.5-12 |
| Temporary External Capture Bridge (optional) | v0.5 | ⏳ TICKET v0.5-13 |
| Google Drive folder import | v0.5 | ⏳ TICKET v0.5-14 |
| Mobile layout | v0.5 | ⏳ TICKET v0.5-15 |

Full ticket specs: memory-bank/v05-v10-build-plan.md

---

## Session start protocol

1. Read CLAUDE.md (this file)
2. Read memory-bank/activeContext.md to find the current ticket
3. Read memory-bank/progress.md to see what is done and what is next
4. State the current ticket aloud and break it into atomic sub-tasks
5. List the files that will be touched
6. For any file marked "already working" above, modify only what is needed —
   do not rewrite the component

## Session end protocol

1. Review all changes against every hard rule in this file
2. Run npm run build — must complete without errors
3. Run npm run check — Biome lint must pass
4. Run npm run typecheck — must pass
5. Confirm no prohibited tone words appear in any JSX or copy added this session
6. Update memory-bank/activeContext.md with the next ticket
7. Update memory-bank/progress.md — check off completed items

## When in doubt

Look at existing working code before inventing a pattern.
- Data layer:    src/queries/tasks.ts
- Calendar:      src/components/calendar/CalendarView.tsx
- Layout:        src/components/layout/AppLayout.tsx
- Auth:          src/utils/auth.ts
- Google API:    src/server/googleCalendar.ts
- AI constants:  src/lib/aiConstants.ts

Do not add new npm packages without noting them in this file.
Do not change the Nitro version (must be ^3.0.0).
Do not change the Biome config.
Do not edit src/routeTree.gen.ts manually — it is auto-generated.
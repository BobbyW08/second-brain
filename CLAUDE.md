# Second Brain

## What this app is

Second Brain is an invite-only personal productivity app for a single primary user.
The entire app is one split-panel surface. Left panel toggles between Priorities and
Files. Right panel toggles between Calendar and Editor. No separate pages for tasks,
journal, or tables. Everything lives on the dashboard.

Google Calendar two-way sync is a required MVP feature. The app does not function
without it. Do not defer or stub it.

---

## Current version: v0.1 MVP

There are NO AI features in v0.1. Do not add, suggest, or restore anything from the
AI layer. This means: no AIChatPanel, no @blocknote/xl-ai, no AIExtension, no
TONE_SYSTEM_PROMPT usage, no @ai-sdk/* packages, no assistant-ui, no scheduling
suggestions, no journal AI prompts. If a file references these, remove the reference.
Do not ask whether to include them. They come in v0.5.

---

## Stack

Framework:     TanStack Start + Nitro v3 (stable, not nightly)
Router:        TanStack Router (file-based, beforeLoad auth guard)
Database:      Supabase (PostgreSQL + RLS + Google OAuth)
UI:            shadcn/ui + Tailwind v4
Calendar:      FullCalendar v6 (timeGrid + interaction + dayGrid plugins)
Editor:        BlockNote + @blocknote/mantine (default schema only)
State client:  Zustand (UI state only)
State server:  TanStack Query (all async/server state)
Date parsing:  chrono-node (free-text date input in task cards)
Forms:         React Hook Form + Zod
Toasts:        Sonner
Linting:       Biome
Testing:       Vitest
Deploy:        Vercel (Nitro preset via process.env.VERCEL in vite.config.ts)

Not in v0.1 — comes in v0.5: @blocknote/xl-ai, assistant-ui, @ai-sdk/anthropic,
@ai-sdk/react, Vercel AI SDK, Anthropic API. Do not install or import any of these.

Never use: googleapis npm package — 29 MB, crashes the build. Google Calendar calls
use direct fetch to REST endpoints with Bearer token auth only.

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
   to REST endpoints with Bearer token auth. See Phase 5-I of the build plan.

7. After completing a session, update memory-bank/activeContext.md with the next
   ticket and update memory-bank/progress.md to check off completed items.

---

## Folder structure

```
src/
  components/     # PascalCase, grouped by feature
  queries/        # camelCase — TanStack Query hooks
  hooks/          # useCamelCase
  server/         # camelCase — TanStack Start server functions only
  types/          # PascalCase — TypeScript types
  lib/            # taskConstants.ts, utilities, aiConstants.ts (unused until v0.5)
  stores/         # useStoreName.ts — Zustand stores
  utils/          # auth.ts, queryClient.ts, etc.
  routes/         # TanStack Router file-based routes
supabase/
  migrations/     # SQL migration files, run in order
memory-bank/      # Agent memory — activeContext.md, progress.md
```

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

AppLayout (src/components/layout/AppLayout.tsx) uses shadcn SidebarProvider.
Left panel content: BucketPanel (Priorities mode) or FolderTree (Files mode).
Right panel content: CalendarView (Priorities mode) or FilesLandingPage/PageView
(Files mode). Panel toggle state lives in useUIStore.

---

## Database tables

- `profiles` — extended user data, Google OAuth tokens, tone preference
- `folders` — nested hierarchy (parent_id self-reference)
- `pages` — BlockNote JSON content, position column
- `tasks` — bucket items with bucket_id, chrono-node parsed date/time fields
- `calendar_blocks` — scheduled time slots, google_event_id (unique), linked_page_id
- `buckets` — user-configurable priority buckets with color and position
- `links` — bidirectional linking between pages and tasks
- `invites` — admin-issued invite tokens with expiry
- `ai_usage` — reserved for v0.5, exists in schema but unused in v0.1

RLS enabled on all tables. Standard policy: auth.uid() = user_id.
Dropped in v0.1 migrations: tables_schema, table_rows (Migration 6).

---

## Design tokens — always use these exact values

Fonts:
  Primary:    Inter, system-ui, sans-serif
  Mono:       JetBrains Mono (dates, times, codes only)
  Weights:    400 regular, 500 medium only. Never 600 or 700.

Font sizes:
  22px  page titles
  16px  section headings
  13px  body, task titles, descriptions
  11px  labels, metadata, timestamps
  10px  uppercase bucket headers (+ uppercase + 0.06em letter-spacing)

Dark mode backgrounds:
  App base:        #0f0f11
  Panel:           #141418
  Card/task:       #1a1a20
  Hover/input:     #1e1e24
  Selected/active: #2e2e38
  Borders:         #2a2a30

Dark mode text:
  Primary:      #e8e8f0
  Secondary:    #aaaaB8
  Muted:        #666672
  Hints:        #444450

Priority left border colors:
  Urgent:    #E05555
  Important: #D4943A
  Someday:   #3A8FD4
  Unsorted:  #666672

Calendar zone backgrounds:
  Morning (06:00–11:59):   #1a1600
  Afternoon (12:00–17:59): #001520
  Evening (18:00–21:59):   #0f0820

Calendar block left borders:
  Second Brain task: #3A8FD4
  Google Calendar:   #3A8A3A

Border radius: tags 4px, cards and inputs 8px, panels and chrome 12px
Spacing scale: 4px, 8px, 12px, 16px, 24px

---

## What is already built and working — do not rewrite

- Auth: Google OAuth, invite gate in auth.callback.tsx, requireAuth, admin invite page
- Database: all tables with RLS, migration files, generated types in
  src/types/database.types.ts (regenerate after Phase 1 migrations)
- App shell: AppLayout, AppSidebar, TopBar, dark mode ThemeProvider, Sonner Toaster
- Global search: ⌘K CommandDialog with navigation and link-picker modes
- BlockNote page editor: PageView with autosave (800ms), saving indicator, inline title
  editing. Default schema only — no custom inline content specs.
- FolderTree: react-arborist with FolderNode renderer, inline rename on double-click.
  Note: onSuccess handlers in rename/move/delete mutations need userId fix (see broken)
- All TanStack Query hooks in src/queries/: correct optimistic updates and throwOnError
  throughout. These are the foundation — do not change their patterns.
- FullCalendar base: 3-day view, zone label structure, morning/afternoon/evening CSS,
  now indicator. Note: missing droppable and editable props (see broken)
- Settings: profile and theme sections work correctly
- Vitest tests: journalUtils.test.ts (5 passing), auth.test.ts (3 passing)
- Utils: useAutosave, useCurrentUser, useMediaQuery, archiveTasks, queryClient

---

## What is broken and must be fixed — do not work around, fix directly

1. FullCalendar missing droppable={true} and editable={true} in CalendarView.tsx.
   Without these, drag from bucket fails silently and block resize/move don't work.

2. FolderTree useRenameNode, useMoveNode, useDeleteNode in src/queries/folders.ts
   have empty onSuccess callbacks. Pass userId into these mutations so
   queryClient.invalidateQueries fires correctly after tree operations.

3. Root route src/routes/index.tsx always redirects to /login unconditionally.
   Must check session first and redirect to /dashboard if authenticated.

4. Priority names in src/lib/taskConstants.ts use high/medium/low.
   Must be urgent/important/someday/unsorted to match the database design.

5. Complete task toast undo button in src/queries/tasks.ts useCompleteTask has
   onClick: () => {}. Must call useUndoCompleteTask which is already implemented.

6. src/server/googleCalendar.ts uses googleapis package (29 MB, crashes build).
   Must be rewritten to use direct fetch calls. See Phase 5-I of build plan.

---

## What does not exist yet and must be built in v0.1

- src/components/tasks/BucketPanel.tsx — configurable buckets panel (left panel)
- src/components/tasks/TaskCard.tsx — replaces TaskPill, expand-in-place open state
- src/components/calendar/EventSidePanel.tsx — slides over calendar on block click
- src/components/layout/MiniCalendarDrawer.tsx — narrow drawer in Files mode
- src/components/files/FilesLandingPage.tsx — recent pages + linked events
- src/queries/buckets.ts — CRUD hooks for custom buckets
- Buckets database table and default bucket creation on signup (migration)
- pages.position column (migration)
- calendar_blocks.linked_page_id column (migration)
- calendar_blocks.google_event_id unique constraint (migration)
- Google Calendar two-way sync via direct fetch REST API calls (Phase 5-I)
- Sidebar collapse with ⌘B shortcut (shadcn SidebarTrigger already handles this)
- Journal folder auto-created on signup
- chrono-node free-text date parsing in task card

---

## What has been deleted — do not recreate these files

src/components/ai/AIChatPanel.tsx          — no AI in v0.1
src/components/editor/LinkChip.tsx         — no inline linking in v0.1
src/components/editor/linkChipSpec.ts      — no custom BlockNote schema in v0.1
src/components/journal/JournalLayout.tsx   — journal is a folder, not a route
src/components/journal/JournalView.tsx     — journal is a folder, not a route
src/components/tables/ (all files)         — tables are BlockNote blocks, not a section
src/routes/_authenticated/journal/        — journal has no routes in v0.1
src/routes/_authenticated/tables/         — tables section removed entirely
src/routes/_authenticated/tasks/index.tsx — tasks are in the left panel, not a page
src/stores/taskStore.ts                    — was never imported anywhere
src/hooks/useAIContext.ts                  — no AI in v0.1
server/routes/api/ai-chat.ts               — no AI in v0.1

If any import references these files, remove the import.
Do not ask whether to restore them. They are gone for v0.1.

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
4. Confirm no prohibited tone words appear in any JSX or copy added this session
5. Update memory-bank/activeContext.md with the next ticket
6. Update memory-bank/progress.md — check off completed items

## When in doubt

Look at existing working code before inventing a pattern.
- Data layer: src/queries/tasks.ts
- Calendar:   src/components/calendar/CalendarView.tsx
- Layout:     src/components/layout/AppLayout.tsx
- Auth:       src/utils/auth.ts

Do not add new npm packages without noting them in this file.
Do not change the Nitro version (must be ^3.0.0).
Do not change the Biome config.
Do not edit src/routeTree.gen.ts manually — it is auto-generated.
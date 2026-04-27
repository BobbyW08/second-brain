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
Folder tree:   react-arborist (drag-drop, inline rename, keyboard nav)
State client:  Zustand (UI state only)
State server:  TanStack Query (all async/server state)
Date parsing:  chrono-node (free-text date input in task cards)
Forms:         React Hook Form + Zod
Toasts:        Sonner
Linting:       Biome
Testing:       Vitest
Deploy:        Vercel Hobby (Nitro preset via process.env.VERCEL in vite.config.ts)

Not in v0.1 — comes in v0.5: @blocknote/xl-ai, assistant-ui, @ai-sdk/anthropic,
@ai-sdk/react, Vercel AI SDK, Anthropic API. Do not install or import any of these.

CRITICAL for v0.5 AI work: Before writing a single line of AI code, clone and study
osadavc/tanchat (Apache-2.0) — the only known repo porting vercel/ai-chatbot to
TanStack Start. The route pattern is:
  src/routes/api/chat.ts → returns streamText().toUIMessageStreamResponse()
Do NOT port Next.js App Router AI examples directly. Use tanchat as the translation layer.

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
   to REST endpoints with Bearer token auth. See src/server/googleCalendar.ts.

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

Do not add post-v0.1 schema until that version's work begins:
- v0.5: drive_synced_folders, drive_files, ai_threads, tasks.icon column
- v1.0: page_tags, pages.reminder_at + reminder_dismissed_at, profiles.inbox_folder_id,
        pages.icon + pages.cover_url (Phase 6-X migration)
Full specs are in memory-bank/second-brain-build-plan-addendum-v2.md.

---

## Design tokens — Jotion CSS variable system

Second Brain uses the Jotion (notion-clone) design system with HSL-based CSS variables defined in
`src/styles.css`. All colors are referenced via `hsl(var(--token))` CSS syntax, enabling consistent
theming and easy future palette changes. Source: sanidhyy/notion-clone/app/globals.css (MIT).

Core tokens (light and dark modes in `:root` and `.dark` blocks):
  --background, --foreground, --card, --card-foreground, --popover, --popover-foreground,
  --primary, --primary-foreground, --secondary, --secondary-foreground, --muted, --muted-foreground,
  --accent, --accent-foreground, --destructive, --border, --input, --ring

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

Domain-specific colors (remain as hex — NOT replaced with variables):
  Priority left border colors:
    Urgent:    #E05555
    Important: #D4943A
    Someday:   #3A8FD4
    Unsorted:  #666672

  Calendar zone backgrounds (not themeable):
    Morning (06:00–11:59):   #1a1600
    Afternoon (12:00–17:59): #001520
    Evening (18:00–21:59):   #0f0820

  Calendar block left borders (domain-specific):
    Second Brain task: #3A8FD4
    Google Calendar:   #3A8A3A

Border radius: tags 4px, cards and inputs 8px, panels and chrome 12px
Spacing scale: 4px, 8px, 12px, 16px, 24px

---

## Reference repos — MIT licensed, copy freely

Pre-vetted implementations to use as structural references. Never copy styles
verbatim — always apply Second Brain design tokens. Full per-ticket porting notes
are in memory-bank/second-brain-build-plan-addendum-v2.md.

- TaskCard (4-A / 4-B): `satnaing/shadcn-admin` → `src/features/tasks/`
  Take the form field structure from tasks-dialogs.tsx. Do NOT copy the Sheet wrapper —
  Second Brain uses expand-in-place, not a slide-in panel.

- FullCalendar styling (5-B / 5-C): `robskinney/shadcn-ui-fullcalendar-example`
  CSS variable overrides for FullCalendar with shadcn tokens.

- Page headers — icon + cover (Phase 6-X): `sanidhyy/notion-clone` →
  `components/cover.tsx` + `components/icon-picker.tsx` + `components/toolbar.tsx`
  Replace Convex → Supabase, EdgeStore → Supabase Storage, Clerk → useCurrentUser().
  Do NOT install emoji-picker-react — use a hardcoded emoji array instead.
  Full porting ticket: memory-bank/ticket-jotion-page-headers.md

- v0.5 AI routes (Apache-2.0): `osadavc/tanchat` — read before any AI route work.
  Route pattern: src/routes/api/chat.ts → streamText().toUIMessageStreamResponse()

---

## What is already built and working — do not rewrite

### Infrastructure
- Auth: Google OAuth, invite gate in auth.callback.tsx, requireAuth, admin invite page
- Database: all v0.1 tables with RLS, all 6 migration files run, generated types in
  src/types/database.types.ts
- App shell: AppLayout, AppSidebar, TopBar, dark mode ThemeProvider, Sonner Toaster
- Utils: useAutosave, useCurrentUser, useMediaQuery, archiveTasks, queryClient
- Vitest tests: auth.test.ts (3 passing)

### Data layer (src/queries/)
- tasks.ts — full CRUD with optimistic updates, useCompleteTask, useUndoCompleteTask
- buckets.ts — full CRUD with optimistic updates
- pages.ts — full CRUD, position, autosave
- folders.ts — full CRUD, rename, move, delete (onSuccess callbacks fixed in Phase 6-B)
- calendar.ts — calendar blocks CRUD, Google sync hooks

### Components
- Global search: ⌘K CommandDialog with navigation, link-picker mode, tasks + pages + folders
- BlockNote page editor: PageView with 800ms autosave, saving indicator, inline title editing.
  Default schema only — no custom inline content specs in v0.1.
- FolderTree: react-arborist, FolderNode renderer, inline rename on double-click
- BucketPanel: left panel in Priorities mode, configurable buckets, drag data attributes
- TaskCard: closed state + expand-in-place open state, chrono-node date parsing, all fields
- CompletedTodaySection: completed tasks with working undo
- CalendarView: 3-day default, zone labels + colors, droppable + editable, drag-to-schedule,
  drag-to-reschedule, drag-to-create, EventSidePanel wired on block click.
  Wrapper div fixed to `flex-1 min-h-0 h-full overflow-hidden` — calendar now renders at full height.
- EventSidePanel: slides over calendar, shows block details, delete block, link to page
- MiniCalendarDrawer: narrow calendar drawer in Files mode
- FilesLandingPage: recent pages + linked calendar events
- SettingsPage: profile, theme, Google Calendar connect/disconnect/sync sections
- AppSidebar: ⌘B collapse, Priorities/Files mode toggle

### Server functions (src/server/)
- googleCalendar.ts: full rewrite using direct fetch (no googleapis), token refresh,
  create/update/delete/list events, inbound sync

---

## What is broken and must be fixed

### Fixed this session
- CalendarView.tsx overflow bug ✅ — wrapper div changed from inline style to
  `className="flex-1 min-h-0 h-full overflow-hidden"`. FullCalendar `height="100%"` prop
  was already correct. AppLayout main panel flex layout was already correct.

### Still open — Ticket B
Files panel overlay and FolderTree not rendering. Fix prompt is Prompt 2 in
`memory-bank/fix-prompts-v2.md`. Run it in Claude Code before the next feature session.

**Ticket B symptoms:**
- Switching to Files mode may render BucketPanel on top of FolderTree (overlay)
- FolderTree may render empty even when folders/pages exist in Supabase

**Ticket B fix:**
```tsx
// AppSidebar — use ternary swap, not display:none stacking
<SidebarContent>
  {mode === 'priorities' ? <BucketPanel /> : <FolderTree userId={user.id} />}
</SidebarContent>
```
Sidebar must have: `w-[220px] min-w-[220px] overflow-x-hidden flex-shrink-0`
Reference: `satnaing/shadcn-admin` → `src/components/layout/app-sidebar.tsx`

---

## What remains to be built in v0.1

**Phase 8 — Polish and Launch (current)**
- 8-A: Loading skeletons on all data-fetching views ✅ COMPLETE
- 8-B: Empty states on all views that can be empty ← CURRENT TICKET
- 8-C: Error boundaries on all major views
- 8-D: Tone audit — grep for banned words across all JSX files
- 8-E: Deploy to Vercel

**Phase 6-X — Jotion-style page headers (after Phase 8)**
- Migration: add pages.icon (text) and pages.cover_url (text) columns
- src/server/pageHeader.ts — uploadPageCover + removePageCover server functions
- src/components/editor/IconPicker.tsx — emoji picker popover (no emoji-picker-react)
- src/components/editor/PageCover.tsx — cover image upload/display/remove
- src/components/editor/PageHeader.tsx — icon + add-cover + add-icon buttons above editor
- Wire PageHeader into PageView above the BlockNote editor
- Show page icon in FolderTree item alongside title
Full paste-ready Cline ticket: memory-bank/ticket-jotion-page-headers.md

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

## Feature roadmap summary

| Feature | Version | Status |
|---|---|---|
| Auth, app shell, editor, search, buckets, calendar base | v0.1 | ✅ Phases 0–3 complete |
| TaskCard, EventSidePanel, FilesLandingPage, Google sync, Search | v0.1 | ✅ Phases 4–7 complete |
| Loading skeletons | v0.1 | ✅ Phase 8-A complete |
| Empty states, error boundaries, tone audit, deploy | v0.1 | 🔄 Phase 8-B current |
| Jotion page headers (icon + cover image on pages) | v0.1 | ⏳ Phase 6-X — after Phase 8 |
| AI chat, writing toolbar, journal prompts, scheduling | v0.5 | Confirmed — read tanchat first |
| MCP server for Second Brain + scheduled AI via Edge Functions | v0.5 | Confirmed — see addendum v2 |
| Inline page linking + backlinks, task icons, mobile, recurring events | v0.5 | Confirmed |
| Google Drive folder import | v0.5 | Confirmed — use google-drive-import-recovered.md |
| Inbox Folder, Page Tags, Web Clipper, PDF Capture, Reminders, Presentation | v1.0 | Confirmed |

Full specs for v0.5 and v1.0 are in memory-bank/second-brain-build-plan-addendum-v2.md.
Do not begin v0.5 until v0.1 has been in daily personal use for at least 2 weeks.

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
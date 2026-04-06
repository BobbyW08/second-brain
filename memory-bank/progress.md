# Progress — Second Brain Build Plan

## Phase 0: Project Setup

- [x] Step 0-A: Audit existing folder
- [x] Step 0-B: Identify and extract template-worthy code
- [x] Step 0-C: Move old code to archive
- [x] Step 0-D: Verify folder is clean
- [x] Step 0-E: Initialize new project (clone starter, rename, git init, npm install)
- [x] Step 0-F: Create CLAUDE.md and Cline memory bank
- [x] Ticket 0-B: Configure Supabase project
- [x] Ticket 0-C: Configure Google OAuth scopes

## Phase 1: Auth, Invite System & App Shell

- [x] Ticket 1-A: Invite-only signup gate
- [x] Ticket 1-B: App shell layout (sidebar, dark mode, mobile)
- [ ] Ticket 1-C: User settings page

## Phase 2: Priority Bucket (Tasks)

- [ ] Ticket 2-A: Task data layer (queries, Zustand store)
- [ ] Ticket 2-B: Priority Bucket UI (TaskPill with data attributes)
- [ ] Ticket 2-C: Completed today section + auto-archive

## Phase 3: Calendar & Scheduling

- [ ] Ticket 3-A: FullCalendar base setup (3-day view, nowIndicator)
- [ ] Ticket 3-B: Morning/Afternoon/Evening zones
- [ ] Ticket 3-C: Calendar data layer (CRUD + drag/resize handlers)
- [ ] Ticket 3-D: Drag from bucket to calendar (FullCalendar Draggable)
- [ ] Ticket 3-E: Create blocks directly on calendar (select + Dialog)
- [ ] Ticket 3-F: Google Calendar sync (read + write + token refresh)

## Phase 4: Pages, Folders & Journal

- [ ] Ticket 4-A: Folder tree (react-arborist, CRUD, drag reorder)
- [ ] Ticket 4-B: BlockNote page editor (autosave, custom slash commands)
- [ ] Ticket 4-C: Journal section (auto-date, BlockNote, Vitest title tests)

## Phase 5: Tables

- [ ] Ticket 5-A: Table data layer
- [ ] Ticket 5-B: Table schema builder
- [ ] Ticket 5-C: Table view with inline editing (all 6 column types)
- [ ] Ticket 5-D: Row detail page with BlockNote notes

## Phase 6: Universal Linking & Global Search

- [ ] Ticket 6-A: ⌘K global search (CommandDialog)
- [ ] Ticket 6-B: Inline page linking in BlockNote (/link command)
- [ ] Ticket 6-C: Backlinks panel

## Phase 7: AI Features

- [ ] Ticket 7-A: Tone system prompt and AI constants (src/lib/aiConstants.ts)
- [ ] Ticket 7-B: AI chat sidebar (assistant-ui + streamText)
- [ ] Ticket 7-C: AI writing in BlockNote (@blocknote/xl-ai)
- [ ] Ticket 7-D: Scheduling suggestions
- [ ] Ticket 7-E: Journal AI prompts
- [ ] Ticket 7-F: AI usage tracking

## Phase 8: Polish, Mobile & Testing

- [ ] Ticket 8-A: Toast notifications (Sonner + undo buttons)
- [ ] Ticket 8-B: Empty states
- [ ] Ticket 8-C: Mobile layout (bottom sheets, coarse pointer detection)
- [ ] Ticket 8-D: Loading and error states (Skeleton + ErrorBoundary)
- [ ] Ticket 8-E: Unit tests (Vitest — journal title, AI context, block durations)

## Template Saves Checklist

- [x] 0-B: Typed Supabase client, auth callback, gen-types.sh, RLS policy → `supabase/`
- [x] 1-A: Invite-only pattern → `supabase/invite-pattern.ts`
- [x] 1-B: App shell layout → `components/app-shell.tsx`
- [ ] 2-A: TanStack Query hook with optimistic update → `tanstack/query-hook.ts`
- [ ] 3-F: Google Calendar server function → `google-calendar/calendar-server-fn.ts`
- [ ] 4-B: Autosave hook → `components/autosave-hook.ts`
- [ ] 7-A: TONE_SYSTEM_PROMPT + aiConstants.ts → `ai/tone-prompt.ts`
- [ ] 7-B: streamText server function → `ai/stream-route.ts`
- [ ] 8-B: Empty state component → `components/empty-state.tsx`

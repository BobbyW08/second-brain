# Progress — Second Brain Build Plan

---

## Phase 0 — Project Cleanup ✅
- [x] 0-A: Fix Nitro version (^3.0.0)
- [x] 0-B: Remove AI/googleapis packages, add chrono-node
- [x] 0-C: Delete files that don't belong in v0.1
- [x] 0-D: Gut references to deleted packages in existing files
- [x] 0-E: Fix priority naming in src/lib/taskConstants.ts
- [x] 0-F: Verify clean build
- [x] 0-G: Commit and push cleanup

## Phase 1 — Database Migrations ✅
- [x] Migration 1: Create buckets table + update handle_new_user trigger
- [x] Migration 2: Add new columns to tasks table
- [x] Migration 3: Add position column to pages
- [x] Migration 4: Add linked_page_id column to calendar_blocks
- [x] Migration 5: Add unique constraint on calendar_blocks.google_event_id
- [x] Migration 6: Drop tables_schema and table_rows
- [x] Regenerate src/types/database.types.ts

## Phase 2 — Route and Layout Restructure ✅
- [x] 2-A: Fix root redirect
- [x] 2-B: Remove journal routes and components
- [x] 2-C: Remove tables routes and components
- [x] 2-D: Remove standalone tasks route
- [x] 2-E: Confirm dashboard is the full app surface
- [x] 2-F: Confirm routeTree.gen.ts regenerates cleanly

## Phase 3 — Custom Buckets ✅
- [x] 3-A: src/queries/buckets.ts
- [x] 3-B: src/components/tasks/BucketPanel.tsx
- [x] 3-C: Sidebar collapse with ⌘B shortcut
- [x] 3-D: Bucket settings section in SettingsPage

## Phase 4 — Task Card Redesign ✅
- [x] 4-A: TaskCard closed state with data attributes
- [x] 4-B: TaskCard open state — all fields, chrono-node date parsing
- [x] 4-C: Completed Today section + undo button

## Phase 5 — Calendar and Google Sync ✅
- [x] 5-A through 5-J: all complete — see previous progress entries

## Phase 6 — Files and Editor ✅
- [x] 6-A through 6-E: all complete

## Phase 7 — Global Search ✅
- [x] 7-A through 7-C: all complete

## Phase 8 — Polish and Launch ✅
- [x] 8-A: Loading skeletons
- [x] 8-B: Empty states
- [x] 8-C: Error boundaries
- [x] 8-D: Tone audit — no banned words found
- [x] 8-E: Deploy to Vercel ✅ — commit c897259, April 28 2026

## Sessions 1–4: Jotion Component Rewrites ✅
- AppLayout, AppSidebar, TopBar, CalendarView, PageView, FolderTree,
  FilesLandingPage, CommandDialog — all rebuilt with Jotion architecture
- Plain flexbox layout replaces SidebarProvider
- Page headers (icon + cover) included natively — Phase 6-X superseded

## Session 5: Dead File Cleanup ✅ (April 27 2026)
- Removed 5 orphaned files. File count 88 → 83.

## TICKET-CAL-CSS ✅ (April 28 2026)
- calendar.css: full robskinney --fc-* variable wiring + dark mode scoping

## TICKET-TOKENS ✅ (April 28 2026)
- globals.css: Jotion token gap-fill — sidebar + chart tokens added

## TICKET-DEAD-CODE ✅ (April 28 2026)
- No dead imports, no banned words, no AI packages, no googleapis
- v0.1 deployed: commit c897259 → Vercel auto-deploy triggered

---

## v0.5 Features

- [x] v0.5-0 — Folder tree migration (react-arborist → aldhyx/station-a-notion-clone) ← COMPLETE
- [ ] v0.5-1 — AI infrastructure (tanchat route pattern, aiConstants.ts, ai_threads migration) ← CURRENT
- [ ] v0.5-2 — AI chat panel (assistant-ui + thread persistence)
- [ ] v0.5-3 — AI writing toolbar (FormattingToolbarController — NOT @blocknote/xl-ai)
- [ ] v0.5-4 — AI journal prompts (generateText on empty journal entry)
- [ ] v0.5-5 — Scheduling suggestions ("Suggest my day" manual trigger)
- [ ] v0.5-6 — Supabase MCP server setup
- [ ] v0.5-7 — Universal Capture System (⌘J modal + AI pipeline + _system folder)
- [ ] v0.5-8 — Contacts & Interactions (People CRM + Google Contacts sync)
- [ ] v0.5-9 — Universal backlink graph + inline page linking (/link slash command)
- [ ] v0.5-10 — Capture Review Queue + Action Approval UI
- [ ] v0.5-11 — Calendar Drafts from Capture Text
- [ ] v0.5-12 — SMS / Outreach Draft Actions from Capture
- [ ] v0.5-13 — Temporary External Capture Bridge (optional)
- [ ] v0.5-14 — Google Drive folder import
- [ ] v0.5-15 — Mobile layout (bottom nav, single-day calendar, swipe-up bucket)

## v1.0 Features

- [ ] v1.0-1 — Web Clipper Chrome Extension (theluckystrike MV3 scaffold + obsidian-clipper extraction)
- [ ] v1.0-2 — Presentation Mode (reveal.js)
- [ ] v1.0-3 — Page Tags (page_tags join table + ⌘K # prefix)
- [ ] v1.0-4 — PDF & Article Capture (/pdf and /article slash commands)
- [ ] v1.0-5 — Page Reminders (reminder_at + Sonner toast)

---

## What Is Already Built and Working

Auth (Google OAuth + invite gate), all v0.1 database tables with RLS,
app shell (AppLayout + AppSidebar + TopBar + dark mode — plain flexbox, Jotion architecture),
global search (⌘K CommandDialog — tasks + pages + folders + link-picker mode),
BlockNote PageView with 800ms autosave, FolderTree (react-arborist — migration pending v0.5-0),
all TanStack Query hooks in src/queries/, BucketPanel with configurable buckets,
TaskCard (closed + open state + chrono-node), CompletedTodaySection with undo,
FullCalendar (3-day view, zone colors, droppable, editable, drag-to-schedule,
drag-to-reschedule), EventSidePanel, MiniCalendarDrawer, FilesLandingPage,
googleCalendar.ts (direct fetch rewrite), SettingsPage (profile + theme + Google Calendar),
calendar.css (robskinney pattern), globals.css (full Jotion token set), Vitest (8 passing).
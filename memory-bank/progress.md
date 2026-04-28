# Progress — Second Brain Build Plan

---

## Phase 0 — Project Cleanup ✅

- [x] 0-A: Fix Nitro version (^3.0.0)
- [x] 0-B: Remove AI/googleapis packages, add chrono-node
- [x] 0-C: Delete files that don't belong in v0.1
- [x] 0-D: Gut references to deleted packages in existing files
- [x] 0-E: Fix priority naming in src/lib/taskConstants.ts (urgent/important/someday/unsorted)
- [x] 0-F: Verify clean build (npm run build + npm run check pass)
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

- [x] 2-A: Fix root redirect (check session before redirecting)
- [x] 2-B: Remove journal routes and components
- [x] 2-C: Remove tables routes and components
- [x] 2-D: Remove standalone tasks route
- [x] 2-E: Confirm dashboard is the full app surface
- [x] 2-F: Confirm routeTree.gen.ts regenerates cleanly

## Phase 3 — Custom Buckets ✅

- [x] 3-A: src/queries/buckets.ts — CRUD hooks with optimistic updates
- [x] 3-B: src/components/tasks/BucketPanel.tsx — full left panel in Priorities mode
- [x] 3-C: Sidebar collapse with ⌘B shortcut
- [x] 3-D: Bucket settings section in SettingsPage

## Phase 4 — Task Card Redesign ✅

- [x] 4-A: src/components/tasks/TaskCard.tsx — closed state with data attributes
- [x] 4-B: TaskCard open state — all fields, chrono-node date parsing
- [x] 4-C: Completed Today section + fix undo button onClick

## Phase 5 — Calendar and Google Sync ✅

- [x] 5-A: Fix FullCalendar missing droppable and editable props
- [x] 5-B: Clean up Morning/Afternoon/Evening zones with design tokens
- [x] 5-C: Calendar block appearance (source colors, wrapping titles)
- [x] 5-D: Journal link on day column headers
- [x] 5-E: src/components/calendar/EventSidePanel.tsx
- [x] 5-F: Create blocks by clicking and dragging on calendar
- [x] 5-G: Delete calendar block from EventSidePanel
- [x] 5-H: src/components/layout/MiniCalendarDrawer.tsx (Files mode)
- [x] 5-I: Rewrite src/server/googleCalendar.ts using direct fetch (no googleapis)
- [x] 5-J: Restore Google Calendar section in SettingsPage

## Phase 6 — Files and Editor ✅

- [x] 6-A: Left panel toggle behavior (Priorities ↔ Files)
- [x] 6-B: Fix FolderTree mutation onSuccess callbacks (pass userId, invalidate queries)
- [x] 6-C: src/components/files/FilesLandingPage.tsx
- [x] 6-D: Confirm PageView works correctly after Phase 0 cleanup
- [x] 6-E: Confirm Journal folder auto-creation on signup (handle_new_user trigger)

## Phase 7 — Global Search ✅

- [x] 7-A: Remove table rows from search, add tasks to search results
- [x] 7-B: Confirm ⌘K shortcut still works after cleanup
- [x] 7-C: Confirm link-picker mode works end to end

## Phase 8 — Polish and Launch ✅

- [x] 8-A: Loading skeletons on all data-fetching views
- [x] 8-B: Empty states on all views that can be empty
- [x] 8-C: Error boundaries on all major views
- [x] 8-D: Tone audit — no banned words found
- [ ] 8-E: Deploy to Vercel ← NEXT

## Fix Session: PageView Routing Bug ✅ (April 27, 2026)

Fixed critical issue where Supabase queries received literal `:1` param instead of UUID.
Root cause: PageView extracted pageId from URL params even though it's rendered in /dashboard
route with no pageId param.

Solution:
- Removed useParams() from PageView.tsx, added pageId prop from parent
- Updated CommandDialog to set activePageId in UIStore instead of navigating to deleted route
- Fixed dashboard.tsx to pass activePageId prop to PageView
- Verified all builds pass: npm run build, npm run check, npm run typecheck

## Phase 6-X — Jotion-Style Page Headers ⏳ (after Phase 8)

New phase added April 25, 2026. Adds Notion-style cover images and emoji icons
to pages, ported from sanidhyy/notion-clone (MIT). Full ticket in
memory-bank/ticket-jotion-page-headers.md.

- [ ] 6-X-migration: Add pages.icon (text) and pages.cover_url (text) columns +
      create page-covers Supabase Storage bucket
- [ ] 6-X-A: src/server/pageHeader.ts — uploadPageCover + removePageCover
- [ ] 6-X-B: src/components/editor/IconPicker.tsx — emoji picker (hardcoded array)
- [ ] 6-X-C: src/components/editor/PageCover.tsx — cover upload/display/remove
- [ ] 6-X-D: src/components/editor/PageHeader.tsx — toolbar above editor
- [ ] 6-X-E: Wire PageHeader into PageView
- [ ] 6-X-F: Show page icon in FolderTree item

---

## v0.5 Features (confirmed — do not start until v0.1 in daily use 2+ weeks)

- [ ] Supabase MCP server — expose tasks, pages, calendar to Claude.ai
- [ ] Scheduled AI via pg_cron + Edge Functions (daily brief, weekly review)
- [ ] Event-triggered AI via database webhooks (task complete, calendar debrief)
- [ ] AI chat panel — tanchat pattern, Vercel AI SDK, assistant-ui, right side panel
- [ ] AI writing toolbar — floating, useCompletion(), text selection trigger
- [ ] AI journal prompts — generateText() on empty entry, dismissable card
- [ ] Scheduling suggestions — manual "Suggest my day" button, drag-to-accept
- [ ] Inline page linking + backlinks — /link slash command, [[PageTitle]] chip
- [ ] Task icons — emoji picker in TaskCard open state, icon column on tasks table
- [ ] Mobile layout — bottom nav drawer, single-day calendar, swipe-up bucket
- [ ] Recurring event editing — "This / Following / All" dialog, RRULE
- [ ] Attendee response tracking — accept/decline display in EventSidePanel
- [ ] Google Drive folder import — use google-drive-import-recovered.md

## v1.0 Features (confirmed — do not start until v0.5 in daily use)

- [ ] Inbox Folder — system folder, default capture destination
- [ ] Page Tags — page_tags join table, tag browser in sidebar, ⌘K # prefix search
- [ ] Web Clipper Browser Extension — Chrome MV3, save to Inbox, article + full page + selection
- [ ] PDF and Article Capture + AI Summarize — /pdf and /article slash commands,
      Supabase Storage, Summarize button → Claude → new block below
- [ ] Page Reminders — reminder_at column, in-app Sonner toast notification
- [ ] Presentation Mode — H1 headings as slides, fullscreen, arrow key navigation

---

## What Is Already Built and Working

Documented in full in CLAUDE.md under "What is already built and working."

Key items: Auth (Google OAuth + invite gate), all v0.1 database tables with RLS,
app shell (AppLayout + AppSidebar + TopBar + dark mode), global search (⌘K CommandDialog
with tasks + pages + folders + link-picker mode), BlockNote PageView with 800ms autosave,
FolderTree with react-arborist, all TanStack Query hooks in src/queries/, BucketPanel
with configurable buckets, TaskCard (closed + open state + chrono-node), CompletedTodaySection
with undo, FullCalendar (3-day view, zone colors, droppable, editable, drag-to-schedule,
drag-to-reschedule), EventSidePanel, MiniCalendarDrawer, FilesLandingPage,
googleCalendar.ts (direct fetch rewrite), SettingsPage (profile + theme + Google Calendar),
Vitest tests (8 passing).

# Progress — Second Brain v0.1 Build Plan

## Phase 0 — Project Cleanup

- [x] 0-A: Fix Nitro version (^3.0.0)
- [x] 0-B: Remove AI/googleapis packages, add chrono-node
- [x] 0-C: Delete files that don't belong in v0.1
- [x] 0-D: Gut references to deleted packages in existing files
- [x] 0-F: Verify clean build (npm run build + npm run check pass)
- [x] 0-G: Commit and push cleanup

## Phase 1 — Database Migrations

- [x] Migration 1: Create buckets table + update handle_new_user trigger
- [x] Migration 2: Add new columns to tasks table
- [x] Migration 3: Add position column to pages
- [x] Migration 4: Add linked_page_id column to calendar_blocks
- [x] Migration 5: Add unique constraint on calendar_blocks.google_event_id
- [x] Migration 6: Drop tables_schema and table_rows
- [x] Regenerate src/types/database.types.ts

## Phase 2 — Route and Layout Restructure

- [x] 2-A: Fix root redirect (check session before redirecting)
- [x] 2-B: Remove journal routes and components
- [x] 2-C: Remove tables routes and components
- [x] 2-D: Remove standalone tasks route
- [x] 2-E: Confirm dashboard is the full app surface
- [x] 2-F: Confirm routeTree.gen.ts regenerates cleanly
- [x] 0-E: Fix priority naming in src/lib/taskConstants.ts (urgent/important/someday/unsorted)

## Phase 3 — Custom Buckets

- [x] 3-A: src/queries/buckets.ts — CRUD hooks with optimistic updates
- [x] 3-B: src/components/tasks/BucketPanel.tsx — full left panel in Priorities mode
- [x] 3-C: Sidebar collapse with ⌘B shortcut
- [x] 3-D: Bucket settings section in SettingsPage

## Phase 4 — Task Card Redesign

- [x] 4-A: src/components/tasks/TaskCard.tsx — closed state with data attributes
- [x] 4-B: TaskCard open state — all fields, chrono-node date parsing
- [x] 4-C: Completed Today section + fix undo button onClick

## Phase 5 — Calendar and Google Sync

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

## Phase 6 — Files and Editor

- [x] 6-A: Left panel toggle behavior (Priorities ↔ Files)
- [x] 6-B: Fix FolderTree mutation onSuccess callbacks (pass userId, invalidate queries)
- [x] 6-C: src/components/files/FilesLandingPage.tsx
- [x] 6-D: Confirm PageView works correctly after Phase 0 cleanup
- [x] 6-E: Confirm Journal folder auto-creation on signup (handle_new_user trigger)

## Phase 7 — Global Search

- [ ] 7-A: Remove table rows from search, add tasks to search results
- [ ] 7-B: Confirm ⌘K shortcut still works after cleanup
- [ ] 7-C: Confirm link-picker mode works end to end

## Phase 8 — Polish and Launch

- [ ] 8-A: Loading skeletons on all data-fetching views
- [ ] 8-B: Empty states on all views that can be empty
- [ ] 8-C: Error boundaries on all major views
- [ ] 8-D: Tone audit — search for banned words across all JSX files
- [ ] 8-E: Deploy to Vercel

---

## What Is Already Built and Working

Documented in full in CLAUDE.md under "What is already built and working." Key items: Auth (Google OAuth + invite gate), database schema with RLS, app shell (AppLayout + AppSidebar + TopBar + dark mode), global search (⌘K CommandDialog), BlockNote PageView with autosave, FolderTree with react-arborist, all TanStack Query hooks in src/queries/, FullCalendar base (3-day view, zone structure, now indicator), Settings (profile + theme), Vitest tests (8 passing), utility hooks.
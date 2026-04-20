SECOND BRAIN — BUILD PLAN v0.1
Complete and authoritative. No prior versions apply.
Last updated: April 18, 2026

WHAT THIS APP IS
Second Brain is an invite-only personal productivity app for a single primary user. The entire app is one split-panel surface. Left panel toggles between Priorities and Files. Right panel toggles between Calendar and Editor. There are no separate pages for tasks, journal, or tables. Everything lives on the dashboard. The calendar is the center of the product and is non-functional without Google Calendar two-way sync, which is a required MVP feature.

DESIGN SYSTEM
Fonts
Primary: Inter (import from Bunny Fonts or Google Fonts). Fallback: system-ui, sans-serif.
Mono: JetBrains Mono. Used only for dates, times, and code.
Weights: 400 regular and 500 medium only. Never 600 or 700.
Sizes:

22px — page titles
16px — section headings
13px — body text, task titles, descriptions
11px — labels, metadata, timestamps
10px — uppercase bucket headers and zone labels (uppercase + 0.06em letter spacing)

Colors — Dark Mode (primary design target)
Backgrounds in order of depth:

App base: #0f0f11
Panel background: #141418
Card and task background: #1a1a20
Hover and input background: #1e1e24
Selected and active: #2e2e38
Borders: #2a2a30

Text:

Primary: #e8e8f0
Secondary: #aaaaB8
Muted: #666672
Hints and placeholders: #444450

Priority and bucket colors:

Urgent: left border #E05555, card bg #2a1a1a
Important: left border #D4943A, card bg #2a1e0a
Someday: left border #3A8FD4, card bg #0a1a2a
Unsorted: left border #666672, card bg #1a1a20

Calendar zone tints:

Morning: background #1a1600, label color #7a6830, icon ☀
Afternoon: background #001520, label color #2e5a7a, icon ◑
Evening: background #0f0820, label color #5a3a7a, icon ☽

Calendar block sources:

Second Brain created block: #3A8FD4 left border, #1e2d3a background
Google Calendar import: #3A8A3A left border, #1e2a1e background

Spacing and Radius
Spacing scale: 4px, 8px, 12px, 16px, 24px.
Border radius: tags and badges 4px, cards and inputs 8px, panels and app chrome 12px.
Border width: 0.5px everywhere except featured items which use 1px.

PHASE 0 — PROJECT CLEANUP
Complete this entire phase before touching any feature work. The build must pass before moving on.
0-A: Fix Nitro version
In package.json change "nitro": "npm:nitro-nightly@latest" to "nitro": "^3.0.0". Run npm install.
0-B: Remove packages that crash the build or belong to v0.5
Remove from package.json dependencies: googleapis, @ai-sdk/anthropic, @ai-sdk/react, @assistant-ui/react, @assistant-ui/react-ai-sdk, @blocknote/xl-ai, ai.
Add to package.json dependencies: chrono-node.
Run npm install after both changes.
0-C: Delete files entirely
Delete these files, they do not belong in v0.1:

src/components/ai/AIChatPanel.tsx
src/components/editor/LinkChip.tsx
src/components/editor/linkChipSpec.ts
src/stores/taskStore.ts
src/hooks/useAIContext.ts
server/routes/api/ai-chat.ts

0-D: Gut references to deleted packages in existing files
src/server/googleCalendar.ts — remove the import { google } from 'googleapis' line and all googleapis usage. Replace all function bodies with throw new Error('Not implemented — see Phase 5'). Keep the file and keep all exported function names. This prevents import errors while the clean version is built in Phase 5.
src/components/pages/PageView.tsx — remove the AIExtension import and the extensions prop from useCreateBlockNote. Remove the editorSchema import from linkChipSpec and revert to the default BlockNote schema. Remove the backlinks Collapsible section. Remove the CommandDialogComponent in link mode. The component should use BlockNote with no customizations beyond the default.
src/components/layout/AppLayout.tsx — remove the syncGoogleCalendar useEffect and its import. Google sync gets re-added properly in Phase 5.
src/components/layout/TopBar.tsx — remove the MessageSquare chat button and its import.
src/components/journal/JournalView.tsx — remove the AI prompt fetch useEffect and the prompt banner JSX entirely.
src/components/settings/SettingsPage.tsx — remove the Google Calendar connect and disconnect section. Keep the profile and appearance sections. The Google Calendar section comes back in Phase 5 with the clean implementation.
src/stores/useUIStore.ts — remove chatPanelOpen and setChatPanelOpen. These have no purpose without the chat panel.
src/lib/aiConstants.ts — leave the file on disk but remove all imports of it across the codebase. Nothing in v0.1 uses it.
0-E: Fix priority naming
In src/lib/taskConstants.ts change PRIORITY_ORDER from ['high', 'medium', 'low'] to ['urgent', 'important', 'someday', 'unsorted']. Update PRIORITY_LABELS to match: Urgent, Important, Someday, Unsorted.
0-F: Verify clean build
Run npm run build. It must complete without errors and without out-of-memory failures. Run npm run check (Biome). Both must pass before moving to Phase 1.
0-G: Commit and push
git add -A, commit as "cleanup: remove AI layer, fix Nitro version, prep for v0.1 build", git push origin main.

PHASE 1 — DATABASE MIGRATIONS
All schema changes before any UI work. Run these in order.
Migration 1: Buckets table
Create a new table called buckets. Columns: id (uuid default gen_random_uuid() primary key), user_id (uuid references profiles on delete cascade not null), name (text not null), position (integer default 0), color (text), created_at (timestamptz default now()). Enable RLS. Policy: users can only access their own buckets.
On new user signup, the handle_new_user trigger must also create four default buckets: Urgent with color #E05555 at position 0, Important with color #D4943A at position 1, Someday with color #3A8FD4 at position 2, Unsorted with color #666672 at position 3.
Update the handle_new_user trigger in the migration to include the bucket inserts. Also create a pre-created folder called Journal in the pages/folders structure for each new user.
Migration 2: Update tasks table
Add these columns to the existing tasks table:

description (text)
color (text)
labels (text[] default '{}')
location (text)
attendees (jsonb default '[]')
recurring (text default 'none')
bucket_id (uuid references buckets on delete set null)

The bucket_id column is how tasks know which bucket they belong to. The existing priority column stays for backward compatibility but bucket_id becomes the source of truth for placement going forward.
Migration 3: Add position to pages
ALTER TABLE pages ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;
Migration 4: Add linked_page_id to calendar_blocks
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS linked_page_id uuid REFERENCES pages(id) ON DELETE SET NULL;
Migration 5: Add unique constraint on google_event_id
ALTER TABLE calendar_blocks ADD CONSTRAINT IF NOT EXISTS calendar_blocks_google_event_id_unique UNIQUE (google_event_id);
This constraint is required for the Google Calendar upsert sync to work. Without it the ON CONFLICT clause in the upsert has no column to conflict on.
Migration 6: Drop tables_schema and table_rows
Tables are no longer a separate database concept. They are BlockNote content inside pages.
DROP TABLE IF EXISTS table_rows;
DROP TABLE IF EXISTS tables_schema;
Regenerate src/types/database.types.ts after all migrations. Run: supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > src/types/database.types.ts

PHASE 2 — ROUTE AND LAYOUT RESTRUCTURE
Fix broken routing before building features.

2-A: Fix root redirect
src/routes/index.tsx currently throws unconditionally to /login. Rewrite it to check the session first. If a session exists, redirect to /dashboard. If no session, redirect to /login.

2-B: Remove journal routes entirely
Delete: src/routes/_authenticated/journal/index.tsx, src/routes/_authenticated/journal/_layout.tsx, src/routes/_authenticated/journal/$pageId.tsx.
Delete: src/components/journal/JournalLayout.tsx, src/components/journal/JournalView.tsx.
Journal is now a folder in the file tree, not a route. Journal entries are plain pages. A Journal folder is auto-created on signup (Migration 1). The calendar day header has a + Journal button that creates or opens a page in that folder for the selected date.

2-C: Remove tables routes entirely
Delete: src/routes/_authenticated/tables/ (entire directory and all files).
Delete: src/components/tables/ (entire directory and all files including TableView, TableSchemaBuilder, RowDetailView, SelectOptionsEditor, and all cell components).
Tables are now BlockNote table blocks inside any page. No separate section, no separate database tables (dropped in Migration 6).

2-D: Remove standalone tasks route
Delete: src/routes/_authenticated/tasks/index.tsx.
Tasks live in the left panel of the dashboard. There is no standalone tasks page.

2-E: Dashboard is the entire application surface
src/routes/_authenticated/dashboard.tsx renders the full split-panel layout directly. The AppLayout wraps it. The right panel of the dashboard is the CalendarView. The left panel is the BucketPanel. There is no separate /calendar route needed. Keep /calendar as a redirect to /dashboard for convenience if it helps, but remove it if it causes confusion.

2-F: Remove orphaned routes from routeTree.gen.ts
After deleting route files, TanStack Router regenerates routeTree.gen.ts automatically on next dev server start. Do not edit routeTree.gen.ts manually. Run npm run dev once to confirm the route tree regenerates without errors.

PHASE 3 — CUSTOM BUCKETS
The left panel priority view needs configurable buckets before task work can begin.
3-A: Bucket query hooks
New file: src/queries/buckets.ts.
Export: useBuckets(userId), useCreateBucket(), useUpdateBucket(), useDeleteBucket(), useReorderBuckets(). All mutations follow the standard optimistic update pattern with onMutate, onError, and onSettled. All Supabase calls end with .throwOnError().
3-B: BucketPanel component
New component: src/components/tasks/BucketPanel.tsx. This is the entire left panel content when in Priorities mode.
Structure from top to bottom: toggle bar (Priorities active, Files inactive), add task button (+), then the list of buckets fetched from the database in their position order, then the Completed Today section collapsed at the bottom.
Each bucket renders: colored dot, bucket name (uppercase, 10px, tracked), task count badge, collapse/expand chevron. Below the header: the list of TaskCard components for tasks belonging to that bucket, ordered by position. A small + button at the bottom of each bucket's task list to add a new task directly into that bucket.
Bucket header interactions: clicking the chevron collapses or expands the task list. Double-clicking the bucket name activates inline rename — a text input replaces the name, saves on Enter or blur. Right-clicking or long-pressing the header shows a context menu with Rename and Delete options. Delete shows a confirmation if the bucket has tasks.
An Add Bucket button at the very bottom of all buckets creates a new bucket with a default name and opens it in rename mode immediately.
3-C: Sidebar collapse
The left panel has a collapse toggle button at the top — a small panel icon. Clicking it slides the entire left panel closed using the shadcn SidebarTrigger and collapsible="offcanvas" behavior that is already configured in the shadcn Sidebar component.
When collapsed, a 40px rail remains visible so the user can reopen it. Keyboard shortcut is ⌘B. The right panel expands to fill the full width when collapsed. Collapsed state persists in localStorage across sessions. The shadcn SidebarProvider already handles this via the SIDEBAR_COOKIE_NAME cookie — confirm it is working correctly rather than rebuilding it.
3-D: Bucket settings
A Buckets section in src/components/settings/SettingsPage.tsx where users can add, rename, reorder, and delete buckets. Color picker per bucket showing the six available colors. This is the path for bulk edits. Inline rename in the panel is for quick single renames.

PHASE 4 — TASK CARD REDESIGN
The task card is the primary interaction surface of the entire app.
4-A: TaskCard component — closed state
New component: src/components/tasks/TaskCard.tsx. Replaces TaskPill entirely.
Closed state shows: colored left border (from task color field, not bucket color), task title word-wrapped with no clipping or ellipsis, a small calendar block icon if the task has a google_event_id (indicating it is synced to Google Calendar), a timestamp in mono font if a date is set. Nothing else. Keep it compact.
The task is draggable. It must have data attributes: data-task-id, data-title, data-duration (derived from end time minus start time, or default 60 minutes if no time set). It must have className="task-card" so FullCalendar Draggable can find it.
4-B: TaskCard component — open state
Clicking the card expands it downward inline. No popup. No modal. No new page. The card grows vertically. Exactly one card can be open at a time. Opening a second card closes the first. Clicking anywhere outside an open card closes it.
Fields inside an open card in order:
Title — editable text input, full width, larger font.
Description — plain multiline textarea. No rich text formatting. URL detection: when the textarea loses focus, scan for bare URLs and convert them to clickable links displayed below the textarea as chips. No inline formatting needed beyond that.
Priority and bucket — a row of buttons showing all of the user's bucket names. Clicking one moves the task to that bucket immediately and optimistically.
Color — six color swatches in a row. Clicking one changes the task's left border and stores the color. Colors: #E05555 red, #D4943A amber, #3A8FD4 blue, #3A8A3A green, #8A3A8A purple, #666672 gray.
Labels — tag input. Type and press Enter or comma to add a label. Labels show as small chips. Click a chip's X to remove it.
Date and time — a single plain text input. Free text entry parsed by chrono-node. The user types anything natural — 04/18/26 1600, 4pm, tomorrow 2pm, monday 10am, apr 18 3-4pm, friday — and it parses on blur. Display format when set: Apr 18 · 4:00pm – 5:00pm in JetBrains Mono. When the user clicks the field, show the editable text. On blur, parse with chrono-node. If parseable, save and show formatted result. If not parseable, show a subtle red border and hint text: Try: tomorrow 3pm or 04/18 1600. Do not clear what they typed. If only a time is given with no date, assume today. If only a date with no time, save with no time and no calendar sync triggers. If a range is given like 3-4pm, set start and end. If a single time like 3pm, set start and default end to start plus one hour.
Recurring — dropdown showing None, Daily, Weekly, Monthly. Only visible when a date and time are set.
Location — plain text input. Only visible when a date and time are set.
Attendees — tag input accepting email addresses. Only visible when a date and time are set.
Links — a paperclip icon button that opens ⌘K in link-picker mode to select an internal page, or a text input to paste an external URL. Selected links display as chips below showing the page title or URL domain. Click a chip's X to remove it.
Google Calendar indicator — if a google_event_id exists on this task, show a small green calendar dot with the text "Synced to Google Calendar." If a date and time are set but no google_event_id exists yet, show a "Sync to Google Calendar" button that triggers event creation. If Google is not connected, show nothing.
Delete — a trash button at the bottom of the open card. Moves to status archived. Does not hard delete. Shows a toast with Undo.
4-C: Completed Today section
At the very bottom of BucketPanel below all buckets. Collapsed by default, shows "Completed today (N)" header with a chevron. Expanding it shows completed tasks with a checkmark and their completion time. Completing a task shows a Sonner toast with an Undo button that calls useUndoCompleteTask — the onClick must not be an empty function. On app startup, archiveCompletedTasks runs to move anything completed before today to archived status.

PHASE 5 — CALENDAR AND GOOGLE SYNC
Google Calendar two-way sync is required for the app to function. It is not optional.
5-A: Fix the two broken FullCalendar props
In src/components/calendar/CalendarView.tsx add droppable={true} and editable={true} to the FullCalendar component. Without droppable, tasks cannot be dragged from the bucket onto the calendar. Without editable, existing blocks cannot be moved or resized. These are both one-line additions.
5-B: Morning, Afternoon, Evening zones
The slotLaneContent zone structure already exists in CalendarView. Clean it up to use the exact design tokens defined above. Morning zone from 06:00 to 11:59, Afternoon from 12:00 to 17:59, Evening from 18:00 to 21:59. Zone labels show the icon, name, and block count for that zone on that day.
5-C: Calendar block appearance
Each block is a solid colored rectangle determined by its source. Second Brain created blocks get blue left border #3A8FD4 and background #1e2d3a. Google Calendar imported blocks get green left border #3A8A3A and background #1e2a1e. Block shows title in full, wrapping if necessary. If the block is tall enough, shows start time in small mono font below the title. No clipping with ellipsis — allow wrapping.
5-D: Journal link on day headers
Each day column header gets a small + Journal button. Clicking it runs a query for a page in the Journal folder where journal_date equals that day. If found, open it in the right panel editor. If not found, create one using useCreatePage with page_type journal, the Journal folder id, and journal_date set to that day, then open it.
5-E: Event side panel
Clicking any calendar block opens EventSidePanel, a new component at src/components/calendar/EventSidePanel.tsx. It slides in from the right edge of the screen as an absolutely positioned overlay on top of the calendar. The calendar does not resize or shift. The panel is roughly 320px wide and overlaps the rightmost portion of the calendar.
The panel shows all the same fields as the TaskCard open state: title, description, date and time, location, attendees, recurring, labels, color, linked files, Google Calendar indicator. All fields are editable in place. Close button at the top right. Clicking the calendar outside the panel closes it.
One panel open at a time. Opening a panel for a different block closes the current one.
If the calendar block came from Google Calendar with no corresponding task, all fields remain editable and any changes sync back to Google.
5-F: Creating blocks directly on the calendar
Click and drag on an empty time slot to select a time range. A new block is created with that time range. EventSidePanel opens immediately. User types the title and fills in other fields. The block is saved on panel close if a title has been entered.
5-G: Calendar block delete
A delete button inside EventSidePanel. Clicking it deletes the calendar block, deletes the corresponding Google Calendar event if google_event_id exists, and shows a Sonner toast with Undo. useDeleteBlock and useUndoDeleteCalendarBlock are already implemented in src/queries/calendarBlocks.ts — they just need the UI wired to them.
5-H: Mini calendar drawer in Files mode
When the app is in Files mode, the main calendar panel slides fully off to the right. A 40px pull tab remains on the far right edge showing a calendar icon. Clicking it opens a narrow drawer (about 280px wide) that slides in from the right edge and overlays the content. It shows a 30-day mini calendar using FullCalendar dayGrid month view at the top, and an agenda list using FullCalendar list view below. Clicking the pull tab again closes it.
5-I: Google Calendar two-way sync
This is a required MVP feature. The app cannot function as a productivity tool without it.
Implementation approach: direct fetch, no googleapis package.
Rewrite src/server/googleCalendar.ts to use fetch calls to Google Calendar REST API endpoints. Never use the googleapis npm package — it bundles the entire Google API surface (29 MB) and crashes the build.
The four Google Calendar REST endpoints needed:
GET  https://www.googleapis.com/calendar/v3/calendars/primary/events
POST https://www.googleapis.com/calendar/v3/calendars/primary/events
PATCH https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}
DELETE https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}
Token refresh endpoint:
POST https://oauth2.googleapis.com/token
body: { client_id, client_secret, refresh_token, grant_type: 'refresh_token' }
Always refresh the access token before every Google API call. Store the refreshed token back to the user's profiles row. If the refresh fails (expired or revoked), mark the user's Google connection as disconnected and surface a reconnect prompt.
On authenticated app load (in AppLayout useEffect):
Fetch Google Calendar events for 14 days back and 14 days forward. For each event returned, upsert into calendar_blocks using google_event_id as the conflict key (the unique constraint added in Migration 5 makes this work). Set block_type to 'event', is_synced to true. If a calendar_blocks row has a google_event_id that is not in the fetched event list, delete that block (the event was deleted externally). Skip this entire step if the user has no google_refresh_token.
What to send to Google when creating an event from a task:
summary: task.title
description: task.description (or empty string)
location: task.location (or empty string)
start: { dateTime: startISO8601, timeZone: 'America/New_York' }
end: { dateTime: endISO8601, timeZone: 'America/New_York' }
attendees: task.attendees.map(email => ({ email }))
recurrence: map task.recurring to RRULE strings:
  daily → ['RRULE:FREQ=DAILY']
  weekly → ['RRULE:FREQ=WEEKLY']
  monthly → ['RRULE:FREQ=MONTHLY']
  none → [] (omit the field)
reminders: { useDefault: true }
Store the returned event id in calendar_blocks.google_event_id and on the task record.
What comes in from Google and maps to Second Brain fields:
event.id → google_event_id
event.summary → title
event.description → description
event.location → location
event.start.dateTime → start_time
event.end.dateTime → end_time
event.attendees[].email → attendees array
event.recurrence → recurring (parse RRULE back to daily/weekly/monthly/none)
event.colorId → color (map Google color IDs to app swatches)
Fields with no Google equivalent (priority, labels, bucket placement, linked files) remain blank on import and are editable in Second Brain without affecting Google.
Sync triggers:
Task dragged from bucket to calendar → create Google event → store google_event_id → show calendar icon on task card.
Task dragged back from calendar to bucket → delete Google event → clear google_event_id → remove calendar icon.
Task date and time set in task card open state → create Google event automatically → same as drag behavior.
Task date and time cleared in task card → delete Google event → clear google_event_id.
Calendar block title or time modified in EventSidePanel → PATCH Google event.
Calendar block deleted from EventSidePanel → DELETE Google event.
App load sync → fetch all and upsert as described above.
Manual sync button in calendar header → triggers the same fetch-and-upsert as app load, for when the user wants to pull in recent external changes without reloading.
Restore Google Calendar section in Settings:
In SettingsPage.tsx restore the Google Calendar connect and disconnect section. Connect button triggers signInWithOAuth with the calendar scope, access_type offline, prompt consent. Disconnect button clears all google_* columns in profiles. Shows connection status: connected with the calendar ID, or disconnected with a connect button.

PHASE 6 — FILES AND EDITOR
The right panel in Files mode.
6-A: Left panel toggle behavior
The toggle in the left panel header switches between Priorities and Files. Priorities mode: BucketPanel fills the left panel, CalendarView fills the right panel. Files mode: FolderTree fills the left panel, the Files landing page or open page editor fills the right panel, and the calendar slides off to the right.
6-B: FolderTree with full drag support
Fix useRenameNode, useMoveNode, and useDeleteNode in src/queries/folders.ts. Each has an empty onSuccess that does nothing. Pass userId into each mutation's context and call queryClient.invalidateQueries with the correct query key in onSuccess. Without this fix, the tree does not visually update after rename, move, or delete operations.
Enable onMove in the FolderTree component now that the pages.position column exists from Migration 3. Drag reorder of pages within a folder, drag a page into a different folder, drag a folder to root, drag a page to root — all should work.
Keep inline rename on double-click (already working). Keep right-click context menu with Rename and Delete. Keep the + button to create new pages.
6-C: Files landing page
New component: src/components/files/FilesLandingPage.tsx.
Shown in the right panel when Files mode is active and no page is selected.
Section 1 — Recent pages: five cards showing title and last modified time formatted naturally (2 min ago, yesterday, Apr 16). A Show more button expands to ten. Clicking a card opens that page in the editor. Query: pages ordered by updated_at descending, limit 10, exclude pages with page_type journal.
Section 2 — Documents linked to upcoming events: query calendar_blocks where start_time is between now and now plus 5 days and linked_page_id is not null. Join to get the linked page title. Show as a list with event name, date, and linked file title as a clickable chip. Clicking opens the page. If no results, show "No documents tied to upcoming events" in muted text.
6-D: Page editor
The existing PageView component stays as-is after Phase 0 cleanup. It has BlockNote with default schema, autosave at 800ms, saving indicator, inline title editing. These all work. Do not rewrite this component.
Tables inside pages use BlockNote's native table block. No custom implementation. The slash command menu already includes table insertion.
6-E: Journal folder creation on signup
Update the handle_new_user Postgres trigger (already modified in Migration 1) to also create a folder named Journal at position 0 in the user's folder tree. All journal entries created from the calendar day header will be placed inside this folder.

PHASE 7 — GLOBAL SEARCH
⌘K is already built. Minor additions only.
7-A: Add tasks to search results
The CommandDialog already searches pages, folders, and table rows. Remove table rows from the search (tables section is gone). Add tasks to the results. A task result shows the task title and its bucket name. Clicking it scrolls the bucket panel to that task and opens it in expanded state.
7-B: Keyboard shortcut
⌘K opens the CommandDialog. This is already wired in TopBar.tsx. Confirm it still works after the cleanup phases. Esc closes it.
7-C: Link picker mode
The CommandDialog already has a mode="link" prop. When triggered from the task card links field (paperclip icon), it opens in link mode. Selecting a result inserts a link chip into the task's links field. This is already implemented — confirm it works end to end.

PHASE 8 — POLISH AND LAUNCH
8-A: Loading skeletons
Every data-fetching view needs a skeleton state. BucketPanel shows skeleton task rows while buckets and tasks load. FolderTree shows skeleton rows while tree loads. CalendarView shows skeleton blocks while calendar blocks load. FilesLandingPage shows skeleton cards while recent pages load. The Skeleton component from shadcn is already imported.
8-B: Empty states
Every view that can be empty needs an EmptyState component. EmptyState already exists at src/components/shared/EmptyState.tsx. Use it in: empty bucket (no tasks), empty folder tree (no pages), empty files landing (no recent pages), empty calendar day. All empty state messages use forward-looking neutral language.
8-C: Error boundaries
Wrap every major view in the ErrorBoundary component at src/components/shared/ErrorBoundary.tsx. A crashed route shows a retry button and a neutral message. Not a blank screen.
8-D: Tone audit
Before shipping, search all JSX files for these words: overdue, late, missed, behind, failed, incomplete, "you should", "you need to". Replace every occurrence with neutral forward-looking language. No exceptions.
8-E: Deploy to Vercel
Connect GitHub repo to Vercel if not already connected. Add all .env.local variables to Vercel Environment Variables. The Nitro vite.config.ts already has preset: process.env.VERCEL ? "vercel" : "node-server" — confirm this is respected. Run a production build locally first with npm run build to confirm clean output before deploying.

FILES DELETED IN v0.1
src/components/ai/AIChatPanel.tsx
src/components/editor/LinkChip.tsx
src/components/editor/linkChipSpec.ts
src/components/journal/JournalLayout.tsx
src/components/journal/JournalView.tsx
src/components/tables/ (entire directory)
src/routes/_authenticated/journal/ (entire directory)
src/routes/_authenticated/tables/ (entire directory)
src/routes/_authenticated/tasks/index.tsx
src/stores/taskStore.ts
src/hooks/useAIContext.ts
server/routes/api/ai-chat.ts

FILES CREATED IN v0.1
src/components/tasks/BucketPanel.tsx
src/components/tasks/TaskCard.tsx
src/components/calendar/EventSidePanel.tsx
src/components/layout/MiniCalendarDrawer.tsx
src/components/files/FilesLandingPage.tsx
src/queries/buckets.ts
supabase/migrations/[date]_add_buckets_table.sql
supabase/migrations/[date]_update_tasks_columns.sql
supabase/migrations/[date]_add_pages_position.sql
supabase/migrations/[date]_add_calendar_linked_page.sql
supabase/migrations/[date]_add_google_event_id_unique.sql
supabase/migrations/[date]_drop_tables_schema_and_rows.sql

v0.5 — AI LAYER
Everything below waits until v0.1 is in daily use.
AI chat panel — right side panel slide-in, context-aware of current page and tasks.
AI writing toolbar — select text in page editor to improve, expand, or summarize.
Journal AI prompts — soft reflection question on empty journal entry, dismissible.
Scheduling suggestions — manual button in calendar header, not automatic.
Inline page linking — /link slash command in page editor with backlinks panel.
Task icons — icon picker in task card open state, displayed in closed state.
Mobile layout — bottom drawers, touch-friendly targets, coarse pointer detection.
Recurring event editing — choose one instance vs all instances.
Attendee response tracking — accept and decline status on invited attendees.
Google Calendar webhooks — real-time push instead of on-load polling.
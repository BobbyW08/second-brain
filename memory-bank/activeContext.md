# Active Context — Second Brain

## Current Ticket

**Phase 1 — Database Migrations** — ALL 6 MIGRATIONS, IN ORDER

Run all migrations before any UI work begins. The buckets table must exist before
BucketPanel can be built. The unique constraint on google_event_id must exist before
Google sync can be built.

Migration 1: Create buckets table + update handle_new_user trigger to insert 4 default
buckets (Urgent, Important, Someday, Unsorted) and create Journal folder on signup.

Migration 2: Add columns to tasks table — description, color, labels, location,
attendees, recurring, bucket_id.

Migration 3: ALTER TABLE pages ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

Migration 4: ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS linked_page_id uuid
REFERENCES pages(id) ON DELETE SET NULL;

Migration 5: ADD CONSTRAINT calendar_blocks_google_event_id_unique UNIQUE
(google_event_id);

Migration 6: DROP TABLE IF EXISTS table_rows; DROP TABLE IF EXISTS tables_schema;

After all migrations: regenerate src/types/database.types.ts.

---

## Broken Things to Fix (do these before or alongside new features)

These are documented in CLAUDE.md under "What is broken" — address them in the phase
where they naturally come up, not all at once:

- FullCalendar missing droppable={true} and editable={true} → fix in Phase 5-A
- FolderTree mutation onSuccess callbacks are empty → fix in Phase 6-B
- Root redirect in src/routes/index.tsx always goes to /login → fix in Phase 2-A
- Priority names are high/medium/low instead of urgent/important/someday/unsorted → fix in Phase 2 alongside route cleanup
- Complete task undo button onClick is empty → fix in Phase 4-C
- src/server/googleCalendar.ts uses googleapis → rewrite in Phase 5-I

---

## Next 3 Tickets After Phase 1

1. **Phase 2 — Route and Layout Restructure**
   - Fix root redirect (2-A)
   - Remove journal routes (2-B)
   - Remove tables routes (2-C)
   - Remove standalone tasks route (2-D)
   - Confirm dashboard is the full app surface (2-E)
   - Fix priority naming in taskConstants.ts

2. **Phase 3 — Custom Buckets**
   - src/queries/buckets.ts — CRUD hooks with optimistic updates (3-A)
   - src/components/tasks/BucketPanel.tsx — full left panel in Priorities mode (3-B)
   - Sidebar collapse with ⌘B (3-C)
   - Bucket settings in SettingsPage (3-D)

3. **Phase 4 — Task Card Redesign**
   - src/components/tasks/TaskCard.tsx — closed state with data attributes (4-A)
   - TaskCard open state — all fields including chrono-node date parsing (4-B)
   - Completed Today section + undo button fix (4-C)

---

## Session Instructions

At the start of every session, read these files in order:
1. CLAUDE.md
2. memory-bank/activeContext.md (this file)
3. memory-bank/progress.md

State the current ticket aloud, break it into atomic sub-tasks, list the files that
will be touched, and confirm no file marked as working in CLAUDE.md will be rewritten.

At the end of every session, update this file with the next ticket and update
memory-bank/progress.md to check off completed items.

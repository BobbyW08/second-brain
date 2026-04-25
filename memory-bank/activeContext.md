# Active Context — Second Brain

## Current Ticket

**Phase 8-A — Loading skeletons on all data-fetching views**

*Phase 4 bugs fixed. Critical issues resolved: drag-to-calendar now working (TaskCard has data-* attributes), undo button refreshes Completed Today section, link picker no longer writes garbage data to Supabase. Build, check, and typecheck all pass clean.*

Add loading skeleton states to all views that fetch data:
1. BucketPanel / task lists while loading
2. FolderTree while loading
3. CalendarView while events load
4. FilesLandingPage while pages/events load
5. PageView while page content loads

---

## Broken Things to Fix

All previously tracked broken items have been resolved:
- FullCalendar droppable/editable ✓ (Phase 5-A)
- Complete task undo button ✓ (Phase 4-C)
- src/server/googleCalendar.ts googleapis ✓ (Phase 5-I)
- TaskCard drag-to-calendar integration ✓ (Phase 4 audit)
- useUndoCompleteTask Completed Today cache ✓ (Phase 4 audit)
- useUIStore openLinkPicker garbage data ✓ (Phase 4 audit)

---

## Next 3 Tickets

1. **Phase 8-A — Loading skeletons on all data-fetching views**
2. **Phase 8-B — Empty states on all views that can be empty**
3. **Phase 8-C — Error boundaries on all major views**

---

## Phase 7 Completion Summary

- CommandDialog already had tasks in search results and no table_rows
- Cleaned up redundant `if (error) throw error` after `.throwOnError()`
- Added `status: 'active'` filter to task search query
- Fixed empty groups — each group only renders when it has results
- Added Folders group to rendered output (was searched but not shown)

---

## Session Instructions

At the start of every session, read these files in order:
1. CLAUDE.md
2. memory-bank/activeContext.md (this file)
3. memory-bank/progress.md

State the current ticket aloud, break it into atomic sub-tasks, list the files that will be touched, and confirm no file marked as working in CLAUDE.md will be rewritten.

At the end of every session, update this file with the next ticket and update memory-bank/progress.md to check off completed items.
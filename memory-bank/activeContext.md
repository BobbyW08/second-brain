# Active Context — Second Brain

## Current Ticket

**Phase 7-A — Remove table rows from search, add tasks to search results**

Refine the global search functionality to:
1. Remove table rows from search results
2. Add tasks to search results
3. Confirm ⌘K shortcut functionality
4. Verify link-picker mode works end to end

---

## Broken Things to Fix

These are documented in CLAUDE.md under "What is broken" — address them in the phase where they naturally come up:

- FullCalendar missing droppable={true} and editable={true} → fix in Phase 5-A
- Complete task undo button onClick is empty → fix in Phase 4-C
- src/server/googleCalendar.ts uses googleapis → rewrite in Phase 5-I

---

## Next 3 Tickets After Phase 6

1. **Phase 7-A — Remove table rows from search, add tasks to search results**
2. **Phase 7-B — Confirm ⌘K shortcut functionality**
3. **Phase 7-C — Verify link-picker mode**

---

## Phase 6 Completion Summary

- Implemented left panel toggle between Priorities and Files modes
- Fixed FolderTree mutation queries and onMove handler
- Created FilesLandingPage with recent pages and upcoming events
- Confirmed PageView compliance
- Verified Journal folder auto-creation on signup

---

## Session Instructions

At the start of every session, read these files in order:
1. CLAUDE.md
2. memory-bank/activeContext.md (this file)
3. memory-bank/progress.md

State the current ticket aloud, break it into atomic sub-tasks, list the files that will be touched, and confirm no file marked as working in CLAUDE.md will be rewritten.

At the end of every session, update this file with the next ticket and update memory-bank/progress.md to check off completed items.
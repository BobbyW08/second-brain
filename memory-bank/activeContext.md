# Active Context — Second Brain

## Current Ticket

**Phase 4 — Task Card Redesign**

The task card is the primary interaction surface. We need to implement the new `TaskCard.tsx` component.

1. Create `src/components/tasks/TaskCard.tsx`.
2. Implement closed state (Phase 4-A).
3. Implement open state with all fields (Phase 4-B).
4. Integrate with `BucketPanel` and `CompletedTodaySection`.

---

## Broken Things to Fix (do these before or alongside new features)

These are documented in CLAUDE.md under "What is broken" — address them in the phase
where they naturally come up, not all at once:

- FullCalendar missing droppable={true} and editable={true} → fix in Phase 5-A
- FolderTree mutation onSuccess callbacks are empty → fix in Phase 6-B
- Complete task undo button onClick is empty → fix in Phase 4-C
- src/server/googleCalendar.ts uses googleapis → rewrite in Phase 5-I

---

## Next 3 Tickets After Phase 3

1. **Phase 4 — Task Card Redesign** (Current)
2. **Phase 5 — Calendar and Google Sync**
3. **Phase 6 — Files and Editor**

---

## Phase 3 Completion Summary

- Implemented `src/queries/buckets.ts` with full CRUD and optimistic updates.
- Built `BucketPanel`, `BucketHeader`, `TaskStub`, and `CompletedTodaySection`.
- Wired `BucketPanel` into `dashboard.tsx`.
- Implemented bucket removal confirmation.
- Added Buckets management section to `SettingsPage.tsx`.
- Resolved build blocks (Nitro config, AddTaskInline props, GDrive_Import orphan).

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

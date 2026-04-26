# Active Context — Second Brain

## Current Ticket

**Phase 8-A — Loading skeletons on all data-fetching views**

*Phases 0–7 complete. Build, check, and typecheck all pass clean.*

Add loading skeleton states to all views that fetch data:
1. BucketPanel / task lists while loading
2. FolderTree while loading
3. CalendarView while events load
4. FilesLandingPage while pages/events load
5. PageView while page content loads

Use the shadcn Skeleton component (`npx shadcn@latest add skeleton` if not already
installed — flag if install is needed). Match the shape of the real content in each
view. No spinner language in skeleton states.

---

## Resolved Issues

All previously tracked broken items have been resolved:
- FullCalendar droppable/editable ✓ (Phase 5-A)
- Complete task undo button ✓ (Phase 4-C)
- src/server/googleCalendar.ts googleapis ✓ (Phase 5-I)
- TaskCard drag-to-calendar integration ✓ (Phase 4 audit)
- useUndoCompleteTask Completed Today cache ✓ (Phase 4 audit)
- useUIStore openLinkPicker garbage data ✓ (Phase 4 audit)
- Calendar block drag-reschedule event type ✓ (Phase 5 audit)
- EventSidePanel background color token ✓ (Phase 5 audit)
- FolderTree mutation onSuccess callbacks ✓ (Phase 6-B)
- Redundant error checks after .throwOnError() ✓ (Phase 7)

---

## Remaining v0.1 Tickets (in order)

1. **Phase 8-A — Loading skeletons** ← CURRENT
2. **Phase 8-B — Empty states on all views that can be empty**
3. **Phase 8-C — Error boundaries on all major views**
4. **Phase 8-D — Tone audit** (grep for: overdue, late, missed, behind, failed,
   incomplete, "you should", "you need to" across all JSX files)
5. **Phase 8-E — Deploy to Vercel**
6. **Phase 6-X — Jotion-style page headers** (icon + cover image on pages)
   This runs after Phase 8 is complete. Paste-ready Cline ticket is in
   memory-bank/ticket-jotion-page-headers.md. Requires a new migration before
   any code is written.

---

## Phase 7 Completion Summary

- CommandDialog already had tasks in search results and no table_rows
- Cleaned up redundant `if (error) throw error` after `.throwOnError()`
- Added `status: 'active'` filter to task search query
- Fixed empty groups — each group only renders when it has results
- Added Folders group to rendered output (was searched but not shown)

---

## v0.5 Architecture Notes (do not build yet — for planning context only)

**MCP server for Second Brain**
The app will expose a Supabase MCP server so Claude.ai (Pro subscription) can read
tasks, calendar blocks, pages, and journal entries directly. This enables behavioral
analysis, weekly reports, and scheduling suggestions through the claude.ai interface
at no additional API cost. Heavier interactive AI (embedded panel, writing toolbar)
will still use the Anthropic API.

**Scheduled + event-triggered AI via Supabase Edge Functions**
- Supabase pg_cron fires Edge Functions on schedule (e.g. daily brief at 7am,
  weekly review every Sunday evening)
- Database webhooks fire Edge Functions on events (e.g. task marked complete,
  calendar block ends, new journal entry created)
- Edge Functions call the Anthropic API, write results back as BlockNote JSON
  into the pages table
- Supabase Realtime notifies the app → Sonner toast → "Your morning brief is ready"
- Results land in Journal folder (scheduled) or linked page (event-triggered)

**AI SDK decision point**
tanchat (osadavc/tanchat, Apache-2.0) uses Vercel AI SDK — use this as the reference.
TanStack AI is in alpha as of April 2026 — evaluate at v0.5 start, but plan on
Vercel AI SDK for stability. assistant-ui currently targets Vercel AI SDK.

---

## Roadmap Reference

The authoritative post-v0.1 roadmap is in:
  memory-bank/second-brain-build-plan-addendum-v2.md (updated April 25, 2026)

Key rules:
- Do NOT begin v0.5 until v0.1 has been in daily personal use for at least 2 weeks
- v0.5 AI work: read osadavc/tanchat FIRST before writing any AI route code
- All hard rules in CLAUDE.md apply across all versions

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

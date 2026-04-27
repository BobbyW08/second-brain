# Active Context — Second Brain

## Current Ticket

**Phase 8-B — Empty states on all views that can be empty**

*Phases 0–7 and 8-A complete. Build, check, and typecheck all pass clean.*

Add empty state UI (via EmptyState component) to all views that can render with no data:
1. BucketPanel when no buckets exist
2. FolderTree when no folders/pages exist
3. FilesLandingPage when no recent pages or upcoming events
4. CalendarView when no events in the date range (rare but possible)

Match existing EmptyState usage. Use consistent icons and messaging.


IMPORTANT: Do not use Second Brain hex tokens anywhere. Use Jotion CSS variables.
 See second-brain-master-reference.md for the full decision log.
 
---
## Remaining Issues
- ~~Ticket A (calendar overflow)~~ ✓ Fixed April 27 — CalendarView.tsx wrapper now uses flex-1 min-h-0 h-full overflow-hidden
- Ticket B (Files panel overlay + FolderTree) — still open. Fix prompt is Prompt 2 in fix-prompts-v2.md. Depends on nothing — can be run next.

## Issues

- FullCalendar droppable/editable ✓ (Phase 5-A)
- Complete task undo button ✓ (Phase 4-C)
- src/server/googleCalendar.ts googleapis ✓ (Phase 5-I)
- Calendar layout overflow ✓ (fix-prompts-v2 Prompt 1) — CalendarView.tsx wrapper div changed from inline style={{ position: "relative", width: "100%", height: "100%" }} to className="flex-1 min-h-0 h-full overflow-hidden". FullCalendar height="100%" prop was already correct. Build + Biome pass.
- TaskCard drag-to-calendar integration - Can now be confirmed visually (calendar renders). Verify drag works end-to-end next session.

- useUndoCompleteTask Completed Today cache ✓ (Phase 4 audit)
- useUIStore openLinkPicker garbage data ✓ (Phase 4 audit)
- Calendar block drag-reschedule event type ✓ (Phase 5 audit)
- EventSidePanel background color token ✓ (Phase 5 audit)
- FolderTree mutation onSuccess callbacks ✓ (Phase 6-B)
- Redundant error checks after .throwOnError() ✓ (Phase 7)

---

## Remaining v0.1 Tickets (in order)

1. **Phase 8-A — Loading skeletons** ✅ COMPLETE
2. **Phase 8-B — Empty states on all views that can be empty** ✅ COMPLETE
3. **Phase 8-C — Error boundaries on all major views** ✅ COMPLETE
4. **Phase 8-E — Deploy to Vercel** ← CURRENT
5. **Phase 6-X — Jotion-style page headers** (icon + cover image on pages)
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
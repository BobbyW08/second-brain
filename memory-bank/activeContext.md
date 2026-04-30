# Active Context — Second Brain

## Current Ticket

**Google Calendar Two-Way Sync** ← IN PROGRESS

Full ticket spec: Cline ticket at start of session.

Summary: Implement two-way Google Calendar sync with:
- event_mappings table (migration 012)
- 8 server functions in googleCalendar.ts (token refresh, create/update/delete/fetch events, sync both directions)
- UI: CalendarView merges Google + local events, sync toggle, recurring event dialog
- Zustand store: calendarGoogleSyncEnabled flag

Status: Code complete. Build ✅ Typecheck ✅ Lint ✅

---

## v0.5-0 Complete ✅

Folder tree migration complete. react-arborist replaced with recursive tree adapted from
aldhyx/station-a-notion-clone. Key changes:
- FolderTree.tsx rewritten: Zustand-backed expand state, New Folder button (+ icon),
  system folder sorting (is_system pins to top)
- FolderNode.tsx rewritten: double-click rename, richer context menu (New Page,
  New Folder for folders), system folder guard (non-deletable, non-renameable)
- TreeNode type extended with is_system + parent_id
- Migration 0011 adds is_system boolean column to folders table
- Query hooks unchanged (useFoldersAndPages, buildTree only updated type mapping)

---

## v0.1 Complete ✅

v0.1 deployed to Vercel — commit c897259, April 28 2026.
All Phase 8 items complete. CSS refactoring, token audit, dead code audit all passed.
Full Jotion shell replacement (Sessions 1-4) includes page headers natively.

---

## v0.5 Ticket Queue (in order)

- [x] v0.5-0 — Folder tree migration (react-arborist → aldhyx pattern) ← COMPLETE
- [ ] v0.5-1 — AI infrastructure (route + aiConstants.ts + ai_threads table) ← CURRENT
- [ ] v0.5-2 — AI chat panel (assistant-ui)
- [ ] v0.5-3 — AI writing toolbar (FormattingToolbarController — NOT @blocknote/xl-ai)
- [ ] v0.5-4 — AI journal prompts
- [ ] v0.5-5 — Scheduling suggestions ("Suggest my day")
- [ ] v0.5-6 — Supabase MCP server setup
- [ ] v0.5-7 — Universal Capture System (⌘J modal + AI pipeline + _system folder)
- [ ] v0.5-8 — Contacts & Interactions (People CRM + Google Contacts sync)
- [ ] v0.5-9 — Universal backlink graph + inline page linking
- [ ] v0.5-10 — Capture Review Queue + Action Approval UI
- [ ] v0.5-11 — Calendar Drafts from Capture Text
- [ ] v0.5-12 — SMS / Outreach Draft Actions from Capture
- [ ] v0.5-13 — Temporary External Capture Bridge (optional)
- [ ] v0.5-14 — Google Drive folder import
- [ ] v0.5-15 — Mobile layout

---

## Issue Resolution (all v0.1 issues closed)

- ~~Ticket A (calendar overflow)~~ ✓ Fixed
- ~~Ticket B (Files panel overlay)~~ ✓ Fixed — Sessions 1-4 Jotion rewrites
- ~~react-arborist abandonment~~ → being addressed in v0.5-0

---

## Session Instructions

At the start of every session, read these files in order:
1. CLAUDE.md
2. memory-bank/activeContext.md (this file)
3. memory-bank/progress.md

State the current ticket, break it into atomic sub-tasks, list files to touch.
Confirm no file marked as working in CLAUDE.md will be rewritten unnecessarily.

At the end of every session, update this file with the next ticket and update
memory-bank/progress.md to check off completed items.
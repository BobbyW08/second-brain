# Active Context — Second Brain

## Current Ticket

**Phase 4 — Priorities Panel: Visual Overhaul + Functional Completion** ← COMPLETE

 Summary: Implemented new task card redesign with:
- 4A: Closed TaskCard — 3px left border, drag handle on hover, conditional metadata row
- 4B: Open TaskCard — inline expand, all fields (title, description, bucket popover, color swatches, labels via @notion-kit/tags-input, date with chrono-node parsing, links, short_id, subtasks)
- 4C: BucketHeader — redesigned with popover bucket selector, hover-only menu
- 4D: dnd-kit task reorder — DndContext + SortableContext per bucket, reorderTasks mutation with optimistic updates
- 4E: short_id migration + generate on createTask via @paralleldrive/cuid2

Status: Code complete. Build ✅ Typecheck ✅ (except pre-existing CalendarView errors) Lint ✅

---

## v0.5 Ticket Queue (in order)

- [x] v0.5-0 — Folder tree migration (react-arborist → aldhyx pattern) ← COMPLETE
- [x] v0.5-1 — AI infrastructure (route + aiConstants.ts + ai_threads table) ← COMPLETE
- [x] v0.5-2 — AI chat panel (assistant-ui + thread persistence) ← COMPLETE
- [x] v0.5-3 — AI writing toolbar (FormattingToolbarController — NOT @blocknote/xl-ai) ← COMPLETE
- [ ] v0.5-4 — AI journal prompts ← CURRENT
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
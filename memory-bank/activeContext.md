# Active Context — Second Brain

## Current Ticket

**TICKET v0.5-0 — Folder Tree Migration** ← CURRENT

Full ticket spec: memory-bank/v05-v10-build-plan.md → TICKET v0.5-0

Summary: react-arborist is abandoned (June 2025). Replace FolderTree.tsx by lifting
the sidebar tree component and Supabase wiring from aldhyx/station-a-notion-clone (MIT).
Translate Next.js App Router patterns → TanStack Start. Wire to existing query hooks
in src/queries/folders.ts and src/queries/pages.ts — do not change those hooks.

---

## v0.1 Complete ✅

v0.1 deployed to Vercel — commit c897259, April 28 2026.
All Phase 8 items complete. CSS refactoring, token audit, dead code audit all passed.
Full Jotion shell replacement (Sessions 1-4) includes page headers natively.

---

## v0.5 Ticket Queue (in order)

- [ ] v0.5-0 — Folder tree migration (react-arborist → aldhyx pattern) ← CURRENT
- [ ] v0.5-1 — AI infrastructure (route + aiConstants.ts + ai_threads table)
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
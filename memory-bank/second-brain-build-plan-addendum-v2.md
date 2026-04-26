# Second Brain — Build Plan Addendum v2
# Last updated: April 25, 2026
# Supersedes: second-brain-build-plan-addendum.md (April 25, 2026, first version)
#
# CHANGES IN THIS VERSION:
# - Added Jotion-style page headers as a new Phase 6-X ticket
# - Expanded FullCalendar drag section with exact code pattern from official docs
# - Expanded shadcn-admin section with exact file paths and component names
# - Added TanStack AI note for v0.5 (new alpha SDK — decision point flagged)
# - tanchat note updated with latest repo status
# - All four reference repos now have per-ticket code guidance, not just descriptions

---

# REFERENCE REPOS — MAPPED TO TICKETS

## 1. sanidhyy/notion-clone ("Jotion")
License: MIT | Stack: Next.js + Convex + BlockNote + EdgeStore
URL: https://github.com/sanidhyy/notion-clone
Port strategy: Components are pure React/shadcn. Replace Convex → Supabase,
EdgeStore → Supabase Storage, Clerk → useCurrentUser(). Apply Second Brain design tokens.

### What to take from Jotion

| Jotion file | What it gives you | Your file |
|---|---|---|
| `components/cover.tsx` | Cover image upload + display + remove | `src/components/editor/PageCover.tsx` |
| `components/icon-picker.tsx` | Emoji picker popover | `src/components/editor/IconPicker.tsx` |
| `components/toolbar.tsx` | Page header: icon + add-cover + add-icon buttons | `src/components/editor/PageHeader.tsx` |
| `components/search-command.tsx` | ⌘K search with document results | Already built — reference only if extending |

### Schema changes needed (Phase 6-X migration)
```sql
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS icon text,       -- emoji character
  ADD COLUMN IF NOT EXISTS cover_url text;  -- Supabase Storage public URL

-- Create bucket in Supabase Storage (dashboard or migration):
-- Name: page-covers | Public: true | Max size: 5MB
-- MIME: image/jpeg, image/png, image/webp, image/gif
```

### Key porting differences from Jotion
- Jotion uses `useParams().documentId` — you use `pageId` from TanStack Router params
- Jotion uses `useMutation(api.documents.update)` — you use `useUpdatePage()` from src/queries/pages.ts
- Jotion uses EdgeStore `useEdgeStore().edgestore.publicFiles.upload()` — you use a
  `createServerFn` in `src/server/pageHeader.ts` that uploads via Supabase Storage service client
- Jotion's cover.tsx accepts `preview` prop (unpublished state) — you don't need this
- Jotion's icon-picker uses the `emoji-picker-react` package — DO NOT install this.
  Use a hardcoded emoji array (~200 items) to avoid a 300KB dependency.

### Full ticket
See: ticket-jotion-page-headers.md (paste-ready Cline prompt)

---

## 2. FullCalendar External Dragging
URL: https://fullcalendar.io/docs/external-dragging

### The complete pattern (from official docs — read before touching Phase 5-A)

**Calendar component — two props required:**
```tsx
<FullCalendar
  plugins={[timeGridPlugin, interactionPlugin]}
  droppable={true}      // ← required for external drops
  editable={true}       // ← required for move/resize of existing events
  eventReceive={handleEventReceive}  // fires when external element dropped with event data
  drop={handleDrop}     // fires for ALL drops, with or without event data
  eventDrop={handleEventDrop}        // fires when EXISTING event is moved
  eventResize={handleEventResize}    // fires when EXISTING event is resized
/>
```

**TaskCard setup — data attributes + Draggable:**
```tsx
// In BucketPanel or TaskCard's useEffect:
import { Draggable } from '@fullcalendar/interaction'

useEffect(() => {
  const containerEl = bucketPanelRef.current
  if (!containerEl) return

  const draggable = new Draggable(containerEl, {
    itemSelector: '.task-card',     // matches className on each TaskCard
    eventData: (el) => ({
      title: el.dataset.title,
      duration: el.dataset.duration,  // e.g. '01:00'
      extendedProps: {
        taskId: el.dataset.taskId,
      },
    }),
  })

  return () => draggable.destroy()
}, [])

// On each TaskCard div:
<div
  className="task-card"
  data-task-id={task.id}
  data-title={task.title}
  data-duration={task.duration ?? '01:00'}
>
```

**eventReceive handler — persists the drop:**
```tsx
const handleEventReceive = async (info: EventReceiveArg) => {
  const taskId = info.event.extendedProps.taskId
  const startTime = info.event.start
  const endTime = info.event.end

  // 1. Create a calendar_block in Supabase
  await createCalendarBlock({
    data: { taskId, startTime: startTime.toISOString(), endTime: endTime?.toISOString() ?? null, userId }
  })

  // 2. Wire Google Calendar event creation here in Phase 7-B
}
```

**What callbacks fire when:**
- External drag → calendar: `drop` fires always. `eventReceive` fires only if `eventData` is set.
- Existing event moved: `eventDrop` fires.
- Existing event resized: `eventResize` fires.
- Task dragged back from calendar: `eventLeave` fires (use this to delete the calendar block).

**The fix for Phase 5-A is exactly two props:** `droppable={true}` and `editable={true}`.
Everything else for drag should already be wired from the Draggable setup.

---

## 3. satnaing/shadcn-admin
License: MIT | Stack: shadcn + Vite + React Router + TypeScript
URL: https://github.com/satnaing/shadcn-admin

### What to take from shadcn-admin

| shadcn-admin file | What it gives you | Your ticket |
|---|---|---|
| `src/features/tasks/index.tsx` | Tasks page with TanStack Table + filters | Reference only (you use BucketPanel) |
| `src/features/tasks/components/tasks-dialogs.tsx` | Task detail dialog/sheet open/closed state | **Phase 4-A/4-B TaskCard pattern** |
| `src/features/tasks/components/data-table-*.tsx` | Column defs, toolbar, row actions | Reference if adding table view later |
| `src/features/tasks/data/schema.ts` | Zod schema for task validation | Reference for your taskSchema |
| `src/components/layout/app-sidebar.tsx` | shadcn Sidebar composition pattern | Reference if refactoring AppSidebar |

### Key pattern for TaskCard (Phase 4-A / 4-B)

shadcn-admin's task feature uses a **Sheet** (slide-in panel) for the task open state,
not an expand-in-place card. For Second Brain, the design calls for expand-in-place.
Adapt the _form structure_ from their sheet, not the sheet itself:

```tsx
// From shadcn-admin src/features/tasks/components/tasks-dialogs.tsx
// They use: <Sheet> → <SheetContent> → <TasksForm>
// You use: expanded div below the closed card → same form fields

// Their task form fields (adapt these):
// - title (text input)
// - status (Select: todo / in-progress / done)
// - label (Select: bug / feature / documentation)
// - priority (Select: low / medium / high)

// Your equivalents:
// - title (text input with chrono-node date parsing)
// - bucket_id (bucket selector with color indicator)
// - due_date (chrono-node free text → date display)
// - description (Textarea)
// - location, attendees, recurring (Phase 7 fields)
// - links (paperclip icon → ⌘K link-picker mode)
// - "Sync to Google Calendar" toggle (stub in 4-B, wire in 7-B)
```

### Closed state design (Phase 4-A)
Study `src/features/tasks/components/columns.tsx` for the row rendering pattern.
Their closed state: checkbox | priority badge | title | label | assignee | date.
Your closed state: completion circle | priority left-border | title | due date chip.

### Important: shadcn-admin uses Vite + React Router, not TanStack Start
Import paths use `@/` aliases that map identically to your setup.
Component code is framework-agnostic — just copy component JSX, not routing.
Do not copy any `useNavigate`, `useParams`, or router imports from shadcn-admin.

---

## 4. osadavc/tanchat
License: Apache-2.0 | Stack: TanStack Start + Vercel AI SDK
URL: https://github.com/osadavc/tanchat

### What it is
A fork of vercel/ai-chatbot ported to TanStack Start. Currently the only known
reference implementation of Vercel AI SDK + TanStack Start together.

### Critical update: TanStack AI is now in alpha
As of early 2026, TanStack itself has released `@tanstack/ai` — a native AI SDK
designed for the TanStack ecosystem. This is a decision point for v0.5:

| Option | Pros | Cons |
|---|---|---|
| **Vercel AI SDK** (tanchat reference) | Production stable, 40+ providers, MCP support, assistant-ui compatible | Not native TanStack, gateway abstraction |
| **TanStack AI** (new alpha) | Native TanStack types, no vendor lock-in, isomorphic tools | Alpha — breaking changes likely, no MCP client yet |

**Recommendation for v0.5:** Start with Vercel AI SDK using tanchat as the reference.
Migrate to TanStack AI when it reaches stable (1.0). The two are API-compatible enough
that migration is feasible later. The assistant-ui library currently targets Vercel AI SDK,
which matters for the chat panel UI.

### The TanStack Start AI route pattern (from tanchat + official docs)

```typescript
// src/routes/api/chat.ts
import { createAPIFileRoute } from '@tanstack/react-router/start/api'
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { TONE_SYSTEM_PROMPT, AI_MODELS } from '@/lib/aiConstants'

export const APIRoute = createAPIFileRoute('/api/chat')({
  POST: async ({ request }) => {
    const { messages } = await request.json()

    const result = streamText({
      model: anthropic(AI_MODELS.default),
      system: TONE_SYSTEM_PROMPT,
      messages,
    })

    return result.toUIMessageStreamResponse()
  },
})
```

```typescript
// src/components/ai/AIChatPanel.tsx (v0.5 only)
import { useChat } from '@ai-sdk/react'

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
})
```

### What to study in tanchat before writing v0.5 AI code
1. How they handle message streaming in TanStack Start server routes
2. How they wire `useChat` to a TanStack Start API route (not a Next.js route)
3. Their message history persistence pattern (they use their own DB — adapt to Supabase)
4. Their middleware pattern for auth on the chat API route

### aiConstants.ts — must exist before any AI code
```typescript
// src/lib/aiConstants.ts
// This file must be imported by every AI server function.
// Never inline system prompts in server functions.

export const AI_MODELS = {
  default: 'claude-sonnet-4-20250514',
  fast: 'claude-haiku-4-5-20251001',
} as const

export const TONE_SYSTEM_PROMPT = `
You are an assistant integrated into Second Brain, a personal productivity app.

Core tone rules (non-negotiable):
- Never use: overdue, late, missed, behind, failed, incomplete
- Never say: "you should", "you need to", "you must"
- All suggestions are invitations, not instructions
- Frame everything as forward-looking and neutral
- Acknowledge what the user has done before suggesting what's next
- Never express urgency or create anxiety about the user's schedule

When suggesting scheduling: say "You might want to..." or "One option is..."
When referencing incomplete tasks: say "things you're still working on" or "tasks in progress"
`
```

---

# UPDATED PHASE REFERENCE TABLE

Incorporates all four repos. Every ticket now has a reference and a time estimate.

## v0.1 — Remaining Phases

| Ticket | What it builds | Reference | Estimate |
|---|---|---|---|
| **4-A** | TaskCard closed state | shadcn-admin `columns.tsx` row pattern | 2 hrs |
| **4-B** | TaskCard open state + chrono-node | shadcn-admin `tasks-dialogs.tsx` form | 3 hrs |
| **4-C** | Completed today + undo | Existing `useCompleteTask` — wire the onClick | 30 min |
| **5-A** | Fix droppable + editable | FullCalendar docs — 2 props | 10 min |
| **5-B/C** | Calendar zone + block styling | robskinney/shadcn-ui-fullcalendar-example | 1 hr |
| **5-D** | EventSidePanel slide-in | shadcn Sheet component pattern | 2 hrs |
| **5-E** | Click-to-create calendar blocks | FullCalendar `dateClick` callback | 1 hr |
| **5-F/G** | Event move + resize persistence | FullCalendar `eventDrop` + `eventResize` | 1 hr |
| **5-H** | Task drag from bucket to calendar | FullCalendar docs `eventReceive` pattern (above) | 1 hr |
| **5-I** | Google sync rewrite (no googleapis) | Existing server patterns, direct fetch | 3 hrs |
| **5-J** | Google Calendar settings section | Phase 7-D spec in build plan | 1 hr |
| **6-A/B** | Files mode toggle + FolderTree fix | Existing FolderTree mutations | 1 hr |
| **6-C** | FilesLandingPage | Jotion `toolbar.tsx` structure reference | 2 hrs |
| **6-X** | Page headers: icon + cover | Jotion `cover.tsx` + `icon-picker.tsx` ← **NEW** | 3 hrs |
| **7-A** | Add tasks to ⌘K | Existing CommandDialog — one query group | 30 min |
| **7-B** | Link picker in task cards | Existing `mode="link"` CommandDialog | 30 min |
| **8-A** | Google sync rewrite | Direct fetch REST pattern | Same as 5-I |
| **9-A–E** | Polish + deploy | Tone audit, skeletons, errors, Vercel | 4 hrs |

---

# UPDATED v0.5 FEATURES

Build after v0.1 is in daily use for 2+ weeks.

**AI chat panel**
Start with tanchat as the reference for the TanStack Start API route.
Use Vercel AI SDK (`@ai-sdk/anthropic`, `@ai-sdk/react`).
UI: assistant-ui (`@assistant-ui/react` + `@assistant-ui/react-ai-sdk`).
Thread history persisted to a new `ai_threads` table in Supabase.
Right side panel, same slide-in behavior as EventSidePanel.
Import `TONE_SYSTEM_PROMPT` and `AI_MODELS` from `src/lib/aiConstants.ts` — always.

**AI writing toolbar**
Floating toolbar appears when text is selected in BlockNote editor.
Options: improve, expand, summarize, change tone.
Uses `useCompletion()` from Vercel AI SDK (not `useChat` — single-turn, not multi-turn).
The toolbar is a shadcn Popover positioned via `getBoundingClientRect()` on the selection.

**AI journal prompts**
On empty journal entry create, single `generateText()` call for a gentle open-ended prompt.
Framed as an invitation: "Here's something to explore if you'd like..."
Not streamed — wait for the full response, then render it as a dismissable card above the editor.

**Scheduling suggestions**
Manual trigger: "Suggest my day" button in calendar header.
Claude reads tasks (bucket contents) + calendar gaps (free time blocks) → suggests a schedule.
User sees a preview panel: proposed time blocks with drag-to-accept.
Never auto-schedules. Never uses urgency language.

**Inline page linking + backlinks**
`/link` slash command in BlockNote opens ⌘K in link-picker mode.
Selected page inserts as a custom BlockNote inline content spec: `[[PageTitle]]` chip.
Backlinks panel in page metadata row: "Linked from: X pages".
Requires a new `links` join table (already in schema) and a custom BlockNote inline spec.

**Task icons**
Emoji picker (same `IconPicker.tsx` from Phase 6-X) in the task card open state.
Stored as `icon` column on tasks table (new migration).
Shown at 16px before the task title in the closed card state.

**Mobile layout**
Bottom navigation replacing the sidebar (shadcn Sheet as a bottom drawer).
Single-day calendar view on mobile (`timeGridDay`).
Task bucket as a bottom sheet (swipe-up from a floating button).

**Recurring event editing**
On modifying a recurring event: dialog with three options:
"This event", "This and all following", "All events".
RRULE parsing on the calendar_block.

**Attendee response tracking**
Accept/decline status displayed on invited attendees in EventSidePanel.
Display only — no RSVP sending from the app.

**Google Drive folder import**
Schema and full implementation code recovered in `google-drive-import-recovered.md`.
Recover that file rather than regenerating. Two internal helpers need regenerating:
`getFreshGoogleToken` (copy from `src/server/googleCalendar.ts` exact pattern) and
`fetchDriveFolderContentsRecursive` (spec documented in recovery file).

---

# UPDATED v1.0 FEATURES

All six features confirmed. Specs unchanged from previous addendum version.
See previous addendum for full implementation specs on each:
1. Inbox Folder
2. Page Tags
3. Web Clipper Browser Extension
4. PDF and Article Capture with AI Summarization
5. Page Reminders
6. Presentation Mode

---

# CONFIRMED FEATURE ROADMAP SUMMARY (UPDATED)

| Feature | Version | Status |
|---|---|---|
| Auth, app shell, editor, search, buckets, calendar base | v0.1 | ✅ Phases 0–3 complete |
| TaskCard (4), Calendar (5), Files + Page Headers (6), Search (7), Polish (8-9) | v0.1 | 🔄 In progress |
| AI chat, writing toolbar, journal prompts, scheduling | v0.5 | Confirmed — use tanchat reference |
| Inline page linking + backlinks, task icons, mobile, recurring events | v0.5 | Confirmed |
| Google Drive folder import | v0.5 | Confirmed — use recovery doc |
| Inbox Folder | v1.0 | Confirmed |
| Page Tags | v1.0 | Confirmed |
| Web Clipper Extension | v1.0 | Confirmed |
| PDF and Article Capture + AI Summarize | v1.0 | Confirmed |
| Page Reminders | v1.0 | Confirmed |
| Presentation Mode | v1.0 | Confirmed |

---

*This document supersedes second-brain-build-plan-addendum.md.*
*All hard rules in CLAUDE.md remain in effect across all versions.*
*Paste-ready Cline ticket for Phase 6-X (page headers) is in ticket-jotion-page-headers.md.*

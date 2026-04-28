# Second Brain — v0.5 + v1.0 Reference Repo Map & Build Plan
# Generated: April 2026
# For use with Claude Code agent

---

## BEFORE YOU START ANY SESSION

1. Read CLAUDE.md
2. Read memory-bank/activeContext.md
3. Read memory-bank/progress.md
4. State the ticket, break it into atomic sub-tasks, list files to touch
5. Run `npm run build && npm run check && npm run typecheck` — must pass clean before touching anything

Hard rules still apply across all v0.5 and v1.0 work. See CLAUDE.md.

---

## REFERENCE REPO MASTER TABLE

| Feature | Source Repo | License | What to Take |
|---|---|---|---|
| AI route pattern | `osadavc/tanchat` | Apache-2.0 | `src/routes/api/chat.ts` pattern: `streamText().toUIMessageStreamResponse()` |
| AI chat panel UI | `assistant-ui.com` official docs | MIT | `@assistant-ui/react` + `@assistant-ui/react-ai-sdk` — read TanStack Start guide at assistant-ui.com/docs |
| AI writing toolbar | BlockNote official docs | MPL-2.0 | `FormattingToolbarController` + custom AI button. **DO NOT use `@blocknote/xl-ai` — it is GPL-3.0 and requires a commercial license for closed-source apps** |
| AI journal prompts | Vercel AI SDK docs | — | `generateText()` — single-turn, no stream |
| Scheduling suggestions | Custom | — | No repo — build against existing calendar/tasks query hooks |
| Supabase MCP | Official Supabase MCP | Apache-2.0 | `npx @supabase/mcp` — configure, don't build |
| Universal Capture (⌘J modal) | Custom + Vercel AI SDK | — | Use existing CommandDialog pattern as structural base |
| Chrome extension scaffold | `theluckystrike/chrome-extension-starter-mv3` | MIT | Full scaffold — React + TypeScript + Tailwind + MV3 |
| Web Clipper page extraction | `obsidianmd/obsidian-clipper` | MIT | Study only: Readability.js + Turndown pattern for article/selection extraction |
| Folder tree migration | `aldhyx/station-a-notion-clone` | MIT | Lift the sidebar tree component + Supabase wiring directly. Translate Next.js App Router → TanStack Start patterns. Data layer unchanged. |
| Google Drive import | Internal spec | — | `google-drive-import-recovered.md` — recover file. Use googleCalendar.ts fetch pattern |
| Contacts (Google People API) | Google REST API | — | Direct fetch, same pattern as `src/server/googleCalendar.ts` |
| Backlink graph | Custom | — | No repo — new DB table + query hooks |
| Mobile layout | shadcn/ui docs | MIT | Sheet as bottom drawer, timeGridDay for calendar |
| Recurring events | FullCalendar docs | MIT | `@fullcalendar/rrule` plugin — canonical docs only |
| Presentation mode | `hakimel/reveal.js` | MIT | `npm install reveal.js` — BlockNote → Markdown → Reveal.js render |
| PDF capture | `@mozilla/readability` | Apache-2.0 | Article extraction for /article slash command |

### Critical license notes

- `@blocknote/xl-ai` = GPL-3.0. Closed-source projects need a paid commercial license. **BANNED** in this project. Build the AI toolbar with `FormattingToolbarController` + a custom button that calls the Vercel AI SDK server function directly.
- `robskinney/shadcn-ui-fullcalendar-example` = no license. Patterns only, never copy verbatim.
- TanStack AI = still alpha as of April 2026. Use Vercel AI SDK for all AI work.

---

## v0.5 BUILD ORDER

Work through these tickets in order. Each must pass build/check/typecheck before the next begins.

---

### TICKET v0.5-0 — Folder Tree Migration: react-arborist → aldhyx/station-a-notion-clone
**Priority: FIRST — do before any other v0.5 work**
**Complexity: Medium**
**Touches: src/components/files/FolderTree.tsx, package.json**

react-arborist is abandoned (maintainer stepped back, June 2025). Rather than adopting
a new tree library from scratch, lift the sidebar tree component and Supabase wiring
directly from `aldhyx/station-a-notion-clone` (MIT). This repo uses Supabase + Zustand +
shadcn/ui — the closest architectural match to this project. The translation surface is
small: Next.js App Router patterns → TanStack Start patterns only.

**Step 1 — Clone the reference repo into a temp directory**

```bash
git clone https://github.com/aldhyx/station-a-notion-clone C:/tmp/station-notion
```

Read these files from the clone before writing a single line of code:
- The sidebar component (look for `Sidebar.tsx` or equivalent in `components/`)
- The document/page list component that renders the tree items
- Any file that calls Supabase for folders or pages in the sidebar context
- Any Zustand store that tracks sidebar state (expanded items, selected item)

Map out exactly which files contain the tree UI, the Supabase queries, and the
Zustand state. You will port these three layers separately.

**Step 2 — Uninstall react-arborist**

```bash
npm uninstall react-arborist
```

Do not install any new tree library. The aldhyx sidebar renders the tree manually
using recursive components — no external tree library required.

**Step 3 — Port the tree UI layer**

Lift the sidebar tree component from the clone into `src/components/files/FolderTree.tsx`.

Translation rules (apply mechanically — do not deviate):
- `useRouter()` from next/navigation → `useNavigate()` from `@tanstack/react-router`
- `useParams()` from next/navigation → `useParams()` from `@tanstack/react-router`
- `"use client"` directive → remove entirely (not needed in TanStack Start)
- Next.js `<Link>` → TanStack Router `<Link>`
- Server components / `async` page functions → not applicable, remove
- `next/image` → plain `<img>` or shadcn equivalent
- Do NOT copy anything touching Prisma, NextAuth, or any Next.js-specific API

**Step 4 — Port the Supabase query layer**

The aldhyx repo queries Supabase for its document tree. Map those queries onto the
existing hooks in this project:
- `src/queries/folders.ts` — already has `useFolders()`, `useCreateFolder()`,
  `useRenameFolder()`, `useDeleteFolder()`
- `src/queries/pages.ts` — already has `usePages()`, `useCreatePage()`,
  `useDeletePage()`

Do NOT rewrite these hooks. Wire the ported tree component to the existing hooks.
If the aldhyx component expects a different data shape, adapt the component —
never change the existing query hooks to match the component.

**Step 5 — Port the Zustand state**

The aldhyx repo likely tracks expanded items and selected item in a Zustand store.
Add these fields to the existing `useUIStore.ts` — do not create a new store file.

```ts
// Add to useUIStore
expandedFolderIds: string[]
toggleFolderExpanded: (id: string) => void
```

**Step 6 — Preserve existing behavior**

These behaviors must work identically after the migration:
- [ ] Folder hierarchy renders correctly (nested folders + pages)
- [ ] Expand/collapse folders on click
- [ ] Click a page → navigates to that page in the editor
- [ ] Double-click to rename inline
- [ ] Right-click context menu: new page, rename, delete
- [ ] Drag-and-drop to reorder within the tree (if aldhyx has this — lift it)
- [ ] `_system` folder pins to top and shows non-deletable (v0.5 requirement —
      add `is_system` guard now so it's ready)

**Step 7 — Clean up**

```bash
rm -rf C:/tmp/station-notion
npm run build && npm run check && npm run typecheck
```

All three must pass. Fix anything that fails before committing.

**Step 8 — Update memory bank**

In `memory-bank/activeContext.md`: set current ticket to v0.5-1.
In `memory-bank/progress.md`: check off v0.5-0.

---

### TICKET v0.5-1 — AI Infrastructure: Route + Constants + Thread Persistence
**Estimated: 3–4h**
**Touches: src/lib/aiConstants.ts, src/routes/api/chat.ts, src/server/aiChat.ts, supabase/migrations/**

**Step 1 — Read tanchat first**

```bash
git clone https://github.com/osadavc/tanchat C:/tmp/tanchat
```

Read these files:
- `src/routes/api/chat.ts` — the TanStack Start route handler pattern
- Any file importing from `ai` or `@ai-sdk/*`
- How it wires `streamText().toUIMessageStreamResponse()`

This is the ONLY known working TanStack Start + Vercel AI SDK integration.
Do NOT port Next.js App Router examples. Do NOT use TanStack AI (still alpha).

Clean up after: `rm -rf C:/tmp/tanchat`

**Step 2 — Install AI packages**

```bash
npm install ai @ai-sdk/anthropic @assistant-ui/react @assistant-ui/react-ai-sdk
```

Do NOT install: `@ai-sdk/openai`, `openai`, `@blocknote/xl-ai`, `@tanstack/ai`.

**Step 3 — Create `src/lib/aiConstants.ts`** (if it doesn't already exist with content)

```typescript
// src/lib/aiConstants.ts
// ALL AI server functions must import from here. Never inline system prompts.

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

**Step 4 — Create the chat route** (`src/routes/api/chat.ts`)

Follow the tanchat pattern exactly. The route must:
- Accept POST with `{ messages }` body
- Call `streamText()` with `AI_MODELS.default` and `TONE_SYSTEM_PROMPT`
- Return `result.toUIMessageStreamResponse()`

**Step 5 — Migration: `ai_threads` table**

```sql
-- supabase/migrations/007_ai_threads.sql
CREATE TABLE ai_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text,
  messages jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own threads"
  ON ai_threads FOR ALL
  USING (auth.uid() = user_id);
```

Run migration, then `npm run db:types` to regenerate types.

---

### TICKET v0.5-2 — AI Chat Panel
**Estimated: 4–6h**
**Touches: src/components/ai/AIChatPanel.tsx, src/stores/useUIStore.ts, src/queries/aiThreads.ts**

**Reference:** https://www.assistant-ui.com/docs (read TanStack Start section specifically)

The chat panel slides in over the right panel (same animation as EventSidePanel).
It does NOT replace the calendar or editor — it overlays on top.

**Panel behavior:**
- Toggle via a button in the TopBar (or a keyboard shortcut)
- Thread list sidebar inside the panel (create/switch/delete threads)
- Thread history persisted to `ai_threads` table via `src/queries/aiThreads.ts`
- `useUIStore` gets a new `chatPanelOpen: boolean` toggle

**What NOT to do:**
- Do not make the chat panel a separate route
- Do not use a shadcn Sheet — use the same slide-in pattern as EventSidePanel
- Do not import anything from `@blocknote/xl-ai`

**assistant-ui wiring:**
The `@assistant-ui/react-ai-sdk` package provides `useVercelUseChatRuntime()` which
connects to the chat route from TICKET v0.5-1. All message streaming, retry, and
error handling come from that hook.

---

### TICKET v0.5-3 — AI Writing Toolbar
**Estimated: 3–4h**
**Touches: src/components/editor/AIWritingToolbar.tsx, src/components/editor/PageView.tsx, src/server/aiWriting.ts**

⚠️ **Do NOT install `@blocknote/xl-ai`.** It is GPL-3.0. Closed-source projects need a commercial license.

Instead, use BlockNote's `FormattingToolbarController` to inject a custom AI button
alongside the default formatting toolbar buttons. This is the MPL-2.0 path.

**Reference pattern (DEV article by mrsupercraft, Jan 2025):**
https://dev.to/mrsupercraft/extending-the-blocknote-editor-a-custom-formatting-bar-with-ai-powered-features-fh5

The pattern is:
```tsx
<BlockNoteView editor={editor} formattingToolbar={false}>
  <FormattingToolbarController
    formattingToolbar={() => (
      <FormattingToolbar>
        {/* all default buttons */}
        <AIToolbarButton /> {/* your custom button */}
      </FormattingToolbar>
    )}
  />
</BlockNoteView>
```

Your `AIToolbarButton` should:
1. Get the current text selection from `editor.getSelectedText()`
2. Open a small Popover with options: Improve, Expand, Summarize, Change tone
3. On selection, call a server function in `src/server/aiWriting.ts` using `useCompletion()`
4. On completion, replace the selected text with `editor.replaceBlocks()`

`src/server/aiWriting.ts` must:
- Import `TONE_SYSTEM_PROMPT` and `AI_MODELS` from `src/lib/aiConstants.ts`
- Use `generateText()` (not streaming — single-turn is fine for toolbar operations)
- Never inline a system prompt

---

### TICKET v0.5-4 — AI Journal Prompts
**Estimated: 2–3h**
**Touches: src/components/editor/PageView.tsx, src/server/aiJournal.ts**

When a page in the Journal folder is opened and is empty (no blocks, or only an
empty paragraph block), a gentle AI prompt appears as a dismissable card above the editor.

**Behavior:**
- Fires once per page open (not on every keystroke)
- Uses `generateText()` — not streamed, wait for full response
- Renders as a shadcn Card above the BlockNote editor with a dismiss (×) button
- The prompt framing must follow TONE_SYSTEM_PROMPT — invitation, not instruction
- "Here's something to explore if you'd like..." — never "You should write about..."

`src/server/aiJournal.ts` must:
- Import `TONE_SYSTEM_PROMPT` and `AI_MODELS` from `src/lib/aiConstants.ts`
- Accept the page title and recent journal page titles as context
- Return a single open-ended journal prompt string

**How to detect "Journal folder":**
Check `page.folder_id` against the folder where `name = 'Journal'` for this user.
This is already available via `useFolders()` from `src/queries/folders.ts`.

---

### TICKET v0.5-5 — Scheduling Suggestions ("Suggest My Day")
**Estimated: 4–5h**
**Touches: src/components/calendar/ScheduleSuggestions.tsx, src/server/aiSchedule.ts, src/components/calendar/CalendarView.tsx**

A "Suggest my day" button appears in the CalendarView header (right-aligned).
On click, it reads the current day's tasks + free time blocks and returns a proposed schedule.

**Critical rules:**
- This is ALWAYS manually triggered. Never auto-runs.
- Never uses urgency language. "You might want to place X here" — never "You need to do X".
- Results appear as a preview panel (not written to calendar). User drags to accept.
- Dragging a suggestion onto the calendar creates a real calendar block via `useCreateCalendarBlock()`.

`src/server/aiSchedule.ts` must:
- Import `TONE_SYSTEM_PROMPT` and `AI_MODELS` from `src/lib/aiConstants.ts`
- Accept: task list (titles + estimated durations), existing calendar blocks for the day
- Return: array of `{ taskId, suggestedStart, suggestedEnd, reasoning }` objects
- Never hard-code that a task "must" be done at a specific time

---

### TICKET v0.5-6 — Supabase MCP Server
**Estimated: 1–2h**
**Touches: supabase/config.toml or Supabase dashboard, documentation**

The Supabase MCP server exposes your database to Claude.ai Pro interface at zero
additional API cost. The user (Bobby) reads tasks, pages, and calendar blocks
through Claude.ai's Projects feature.

**What to set up:**
This is configuration, not code. The Supabase MCP server is official:
```bash
# Test locally
npx @supabase/mcp --url "$VITE_SUPABASE_URL" --key "$SUPABASE_SERVICE_ROLE_KEY"
```

Then configure in Claude.ai → Settings → MCP Servers with the Supabase project URL
and service role key. Only Bobby has access (invite-only app).

**What to expose:** tasks, pages, folders, calendar_blocks, profiles (read-only for bobby's own data).
**What NOT to expose:** profiles.google_access_token, profiles.google_refresh_token.

Document the setup steps in `memory-bank/mcp-setup.md`.

---

### TICKET v0.5-7 — Universal Capture System (⌘J Modal + AI Pipeline)
**Estimated: 6–8h**
**Touches: src/components/capture/CaptureModal.tsx, src/server/capture.ts, supabase/migrations/008_captures.sql, src/stores/useUIStore.ts**

**Step 1 — Migration**

```sql
-- supabase/migrations/008_captures.sql
CREATE TABLE captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  raw_text text NOT NULL,
  ai_classification text,
  ai_extracted_fields jsonb,
  routed_to jsonb,
  status text DEFAULT 'routed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE captures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own captures"
  ON captures FOR ALL USING (auth.uid() = user_id);
```

**Step 2 — ⌘J Capture Modal**

`CaptureModal.tsx`:
- Opens on `⌘J` (add to the existing keyboard shortcut handler in AppLayout or TopBar)
- A plain shadcn Dialog with a single large textarea — no labels, no dropdowns
- Placeholder: "Capture anything..."
- Submit on Enter (or button). Escape closes.
- On submit: call `createCapture` server function, close modal immediately (optimistic)
- Show a brief Sonner toast: "Captured — routing..."

**Step 3 — AI Routing Server Function**

`src/server/capture.ts`:
- Import `TONE_SYSTEM_PROMPT` and `AI_MODELS` from `src/lib/aiConstants.ts`
- Use `generateObject()` from Vercel AI SDK with Zod schema to classify the capture
- Classification schema: `{ classification, entities: { people, dates, tasks, topics }, routing }`
- Confident → auto-create records + insert into linked_entities + set status='routed'
- Ambiguous → insert into `_system/Inbox` folder page + set status='pending'

**_system folder:**
Create `_system` folder on first login (update `handle_new_user` trigger or create
a server function called from the auth callback). Contains: Inbox, Log, Templates.
Pin to top of folder tree. Non-deletable, non-renameable. Mark with `is_system = true`
column (add to folders table migration).

---

### TICKET v0.5-8 — Contacts & Interactions (People CRM)
**Estimated: 6–8h**
**Touches: supabase/migrations/009_contacts.sql, src/server/contacts.ts, src/components/contacts/, src/queries/contacts.ts**

**Step 1 — Migrations**

See the full schema in `second-brain-master-reference-v2.md` under "CONTACTS & INTERACTIONS."
Run migrations, regenerate types.

**Step 2 — Google Contacts sync**

`src/server/contacts.ts` — direct fetch to `people.googleapis.com` REST API.
Same token pattern as `src/server/googleCalendar.ts`. Same token refresh logic.
No new OAuth scope needed — `people.readonly` is already included in the Google OAuth setup.

Endpoint: `GET https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations`

**Step 3 — ⌘K contact search**

Add contacts to the CommandDialog search results group.
Clicking a contact shows: contact card + all interactions + linked events + linked pages + linked tasks.
These are pulled via the `linked_entities` table (built in TICKET v0.5-9).

**Step 4 — EventSidePanel integration**

If a calendar event attendee email matches a `contacts.email`, surface:
- The contact's name + company
- Their last 3 interactions
- A "View contact" link

---

### TICKET v0.5-9 — Universal Backlink Graph + Inline Page Linking
**Estimated: 5–7h**
**Touches: supabase/migrations/010_linked_entities.sql, src/queries/linkedEntities.ts, src/components/editor/PageView.tsx**

**Step 1 — Migration**

```sql
-- supabase/migrations/010_linked_entities.sql
CREATE TABLE linked_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (source_type, source_id, target_type, target_id)
);

ALTER TABLE linked_entities ENABLE ROW LEVEL SECURITY;
-- RLS policy: join through source or target entity to verify user ownership
```

**Step 2 — Backlinks panel in PageView**

Below the BlockNote editor: "Linked from: X pages · Y tasks · Z events"
Clicking expands an inline list of linked entity titles.
Pull via `src/queries/linkedEntities.ts` — query where `target_type='page' AND target_id=pageId`.

**Step 3 — Inline page linking (/link slash command)**

Add a `/link` slash menu item to BlockNote using `SuggestionMenuController`.
On trigger: open ⌘K in link-picker mode (already built in v0.1).
On selection: insert as a custom BlockNote inline content spec (`[[PageTitle]]` chip style).

This requires a custom `InlineContent` spec — the first custom schema in the project.
Follow BlockNote docs at blocknotejs.org/docs/custom-schemas/inline-content.

---

### TICKET v0.5-10 — Google Drive Folder Import
**Estimated: 4–6h**
**Touches: src/server/googleDrive.ts, src/components/files/DriveImportDialog.tsx**

**FIRST:** Recover `google-drive-import-recovered.md` from memory-bank. This file
has the full spec. Do NOT regenerate it from scratch. If you cannot find it, ask the user.

Two internal helpers from that spec:
1. `getFreshGoogleToken` — copy exact pattern from `src/server/googleCalendar.ts`
2. `fetchDriveFolderContentsRecursive` — the spec is in the recovery file

Google Drive REST API: `https://www.googleapis.com/drive/v3/files`
Same Bearer token auth pattern. Never use the `googleapis` npm package.

---

### TICKET v0.5-11 — Mobile Layout
**Estimated: 5–8h**
**Touches: src/components/layout/AppLayout.tsx, src/components/layout/MobileNav.tsx, new mobile variants of BucketPanel and CalendarView**

**Bottom navigation (replaces sidebar on mobile):**
- shadcn Sheet anchored to bottom
- 4 tabs: Priorities · Calendar · Files · Settings
- Detect mobile with a `useIsMobile()` hook checking `window.innerWidth < 768`
- On mobile: show single-day calendar (`timeGridDay`)
- On mobile: task bucket is a bottom sheet (swipe-up from a floating button)

**Pattern reference:**
`satnaing/shadcn-admin` → mobile nav pattern (but adapt — this project has 4 sections,
not the same as shadcn-admin's structure).

**Tap target rule still applies:** minimum 44×44px on ALL interactive elements.
On mobile this is especially critical — audit every button after this ticket.

---

## v0.5 MIGRATION SUMMARY

Run these migrations in order, one per ticket:
```
007_ai_threads.sql         (TICKET v0.5-1)
008_captures.sql           (TICKET v0.5-7)
009_contacts.sql           (TICKET v0.5-8)
010_linked_entities.sql    (TICKET v0.5-9)
```

Add columns:
```
tasks.icon text            (TICKET v0.5-2 or standalone migration)
folders.is_system boolean  (TICKET v0.5-7)
```

---

## v1.0 BUILD ORDER

Start only after v0.5 has been in daily use for 2+ weeks.

---

### TICKET v1.0-1 — Web Clipper Chrome Extension
**Estimated: 8–12h (separate repo/project)**
**Reference repos:**
- Scaffold: `theluckystrike/chrome-extension-starter-mv3` (MIT) — React + TypeScript + Tailwind + MV3
- Page extraction study: `obsidianmd/obsidian-clipper` (MIT) — Readability.js + Turndown pattern

**This lives in its own repo:** `github.com/BobbyW08/Second_Brain_Clipper`

**Setup:**
```bash
git clone https://github.com/theluckystrike/chrome-extension-starter-mv3.git second-brain-clipper
cd second-brain-clipper
npm install
npm install @mozilla/readability turndown
```

**Three clip modes:**
1. **Article** — Readability.js extracts main content → Turndown converts to Markdown
2. **Full page** — Turndown on `document.body.innerHTML`  
3. **Selection** — `window.getSelection().toString()` → send as raw text

**Extension to app communication:**
On clip, the extension POSTs to the Second Brain capture pipeline
(`/api/capture` server route) with the user's session token from `chrome.storage`.
The auth token is stored when the user connects the extension from Second Brain's Settings page.

**Settings page addition:**
New "Browser Extension" section in SettingsPage showing a one-time auth token
that the user pastes into the extension on first setup.

---

### TICKET v1.0-2 — Presentation Mode (reveal.js)
**Estimated: 4–6h**
**Touches: src/routes/_authenticated/present/$pageId.tsx, src/server/presentationMode.ts, package.json**

```bash
npm install reveal.js
npm install @types/reveal.js -D
```

**Pattern:** BlockNote page → serialize to Markdown → parse H1 headings as slide boundaries → inject into reveal.js HTML → render in fullscreen route.

**Route:** `src/routes/_authenticated/present/$pageId.tsx`
- Loads BlockNote JSON for the page
- Calls `src/server/presentationMode.ts` to convert to reveal.js HTML
- Mounts reveal.js in a fullscreen div
- Arrow keys advance slides (reveal.js handles natively)
- Press Escape to exit (navigate back)

**A "Present" button** appears in the PageView header (visible only when page has H1 headings).

**Slide boundary rule:** Every H1 block starts a new slide. H2 blocks start vertical sub-slides. All other blocks belong to the current slide.

---

### TICKET v1.0-3 — Page Tags
**Estimated: 3–4h**
**Touches: supabase/migrations/011_page_tags.sql, src/components/editor/TagInput.tsx, src/queries/tags.ts, CommandDialog**

**Migration:**
```sql
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  name text NOT NULL,
  UNIQUE(user_id, name)
);

CREATE TABLE page_tags (
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, tag_id)
);
```

**TagInput component:** A shadcn Combobox below the PageView title.
Type to search existing tags or create new. Enter to add. × to remove.

**⌘K integration:** `#tagname` prefix in search filters to pages with that tag.

---

### TICKET v1.0-4 — PDF & Article Capture
**Estimated: 5–7h**
**Touches: src/components/editor/blocks/, src/server/pdfCapture.ts, Supabase Storage**

**Two new BlockNote slash commands:**
- `/article [url]` — fetches URL, extracts with `@mozilla/readability`, inserts as content blocks
- `/pdf [upload]` — file picker, uploads to Supabase Storage, inserts as a PDF embed block

**AI Summarize button:**
Appears below each PDF or article block.
Calls `src/server/aiSummarize.ts` (imports `TONE_SYSTEM_PROMPT` + `AI_MODELS`).
Inserts the summary as a new text block immediately below the source block.

**Supabase Storage:** Create a `documents` bucket (private, RLS-protected by user_id).

---

### TICKET v1.0-5 — Page Reminders
**Estimated: 2–3h**
**Touches: supabase/migrations/012_reminder_at.sql, src/components/editor/PageHeader.tsx, src/hooks/usePageReminders.ts**

```sql
ALTER TABLE pages ADD COLUMN IF NOT EXISTS reminder_at timestamptz;
```

**PageHeader:** Add a "Set reminder" DateTimePicker button (shadcn Popover + Calendar).
When set, stores `reminder_at` on the page.

**`usePageReminders` hook:**
Runs on app load. Checks all pages with `reminder_at <= now() + 1 hour`.
Uses `setInterval` to check every minute.
When triggered: Sonner toast with the page title and a "Open page" action.

---

## v1.0 MIGRATIONS SUMMARY

```
011_page_tags.sql          (TICKET v1.0-3)
012_reminder_at.sql        (TICKET v1.0-5)
```

---

## STANDING HARD RULES (copy into every ticket)

1. Every Supabase call ends with `.throwOnError()`. No silent failures.
2. Banned words everywhere: `overdue`, `late`, `missed`, `behind`, `failed`, `incomplete`, `"you should"`, `"you need to"`.
3. All AI server functions import `TONE_SYSTEM_PROMPT` and `AI_MODELS` from `src/lib/aiConstants.ts`. Never inline system prompts.
4. Never use `googleapis` npm package. Google API = direct fetch + Bearer token.
5. `SUPABASE_SERVICE_ROLE_KEY` in server functions only.
6. No `@supabase/auth-ui-react`. No raw HTML `<form>` tags.
7. Never install `@blocknote/xl-ai` — it is GPL-3.0 and requires a commercial license.
8. TanStack AI is still alpha — use Vercel AI SDK for all AI work.
9. After every session: update memory-bank/activeContext.md and memory-bank/progress.md.
10. `npm run build && npm run check && npm run typecheck` must pass before every commit.

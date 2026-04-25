# Second Brain — Build Plan Addendum
# Last updated: April 25, 2026
# Paste this at the end of SecondBrain MVP Build Plan.md, replacing the existing v0.5 section.

---

# REFERENCE REPOS — PER-TICKET NOTES
# Add these annotations directly to the tickets in the phases below.

## Phase 4 — Task Card Redesign

**4-A / 4-B: TaskCard closed and open state**
Reference: `satnaing/shadcn-admin` — `src/features/tasks/` directory
License: MIT — copy freely
Why: Calm Linear-style card with closed/open states in shadcn. Exact visual pattern
you are targeting. Copy the structure and component composition, then swap in your
data model (bucket_id, chrono-node dates, priority colors). Do not copy styles
verbatim — apply Second Brain design tokens.

## Phase 5 — Calendar and Google Sync

**5-A: Fix FullCalendar droppable and editable props**
This is a 2-prop fix: add `droppable={true}` and `editable={true}` to the
`<FullCalendar>` component in CalendarView.tsx. That is the entire change.
Reference: https://fullcalendar.io/docs/external-dragging (official docs, not a repo)
Time: minutes, not hours.

**5-B / 5-C: Calendar zone styling and block appearance**
Reference: `robskinney/shadcn-ui-fullcalendar-example`
License: MIT — copy freely
Why: Shows exactly how to skin FullCalendar with shadcn tokens — CSS variable
overrides for event backgrounds, header buttons, toolbar. Use this as a reference for
your CSS override layer. Do not copy styles verbatim — apply Second Brain design
tokens (morning #1a1600, afternoon #001520, evening #0f0820, block borders #3A8FD4
and #3A8A3A).

## Phase 6 — Files and Editor

**6-C: FilesLandingPage**
Optional enhancement: `sanidhyy/notion-clone` ("Jotion") — `components/cover.tsx`
and `components/icon-picker.tsx`
License: MIT — copy freely
Why: If you want cover images and emoji icon pickers on pages (the Notion-style
header), these are drop-in implementations. Skip if you want a cleaner, less
Notion-like feel for launch. Not required for v0.1 shipping.

## Phase 7 (formerly Phase 8) — Global Search and Linking

**7-A (formerly 8-A): Add tasks to search**
The CommandDialog is already built. This ticket is:
1. Add a `useSearchTasks(query)` query hook to `src/queries/tasks.ts`
2. Add a "Tasks" result group in the CommandDialog alongside Pages and Folders
3. On selection: call `setOpenTaskId` in `useUIStore` to scroll to and open the task
Time: approximately 30 minutes. This is not a large change.

## v0.5 AI Features

**AI chat panel + all AI features**
Reference: `osadavc/tanchat` (Apache-2.0)
URL: https://github.com/osadavc/tanchat
Why: This is the ONLY known repo that ports vercel/ai-chatbot to TanStack Start with
the Vercel AI SDK. It is your exact stack. When you start v0.5 AI work, clone this
repo first and study the API route pattern before writing a single line of AI code.
The route pattern is:
  src/routes/api/chat.ts → returns streamText().toUIMessageStreamResponse()
Do not attempt to port Next.js App Router AI examples directly. Use tanchat as the
translation layer.

---

# UPDATED v0.5 FEATURES
# Replaces the previous v0.5 section in the build plan.

Build these after daily use of v0.1 confirms the core scheduling workflow is solid.
Do not begin v0.5 until v0.1 has been in daily personal use for at least 2 weeks.

**AI chat panel**
Right side panel, same slide-in behavior as EventSidePanel. Built with assistant-ui
+ @assistant-ui/react-ai-sdk. Thread history persisted to Supabase. Reference:
osadavc/tanchat for the TanStack Start API route. Start here before any other AI work.

**AI writing toolbar**
Floating toolbar in the BlockNote page editor. Select text → toolbar appears →
options: improve, expand, summarize, change tone. Uses useCompletion() from Vercel AI
SDK. Reference: Novel's apps/web/components/tailwind/advanced-editor.tsx for the
composition pattern, even though Novel is Tiptap-based.

**AI journal prompts**
A soft, dismissable prompt appears in an empty journal entry. Single API call on
entry create, result is a gentle open-ended question. Not a command — framed as an
invitation. No streaming needed; generateText() is sufficient.

**Scheduling suggestions**
Manual trigger only — a "Suggest my day" button in the calendar header, never
automatic. Claude reads tasks + calendar gaps and suggests a time-blocked plan.
User reviews and drags items to accept. Never auto-schedules.

**Inline page linking**
/link slash command in BlockNote that opens the ⌘K CommandDialog in link-picker mode.
Selecting a result inserts a [[PageTitle]] link chip as a custom inline content spec.
Backlinks panel appears in the page metadata row showing all pages that link to this one.
Requires a new BlockNote custom inline content spec — see BlockNote examples/03-custom-schema/05-suggestion-menus-mentions as the base.

**Task icons**
Icon picker in the task card open state. Emoji only, no image upload. Stored as a
text column on the tasks table. shadcn Popover with an emoji grid.

**Mobile layout**
Bottom navigation drawer replacing the sidebar. Single-day calendar view on mobile.
Touch-friendly 44px+ targets throughout. Bottom sheet for task bucket.

**Recurring event editing**
"This event", "This and following", "All events" edit dialog when modifying a
recurring calendar block. Requires RRULE parsing — reference kcsujeet/ilamy-calendar
(MIT) for the RFC 5545 edit semantics if needed.

**Attendee response tracking**
Accept/decline status on invited calendar attendees. Display only — no RSVP sending
from the app in v0.5.

**Google Drive folder import**
Import a Google Drive folder through Settings. Imported folders and their contents
appear in the Files section alongside pages. Schema: drive_synced_folders and
drive_files tables with sync_status tracking. Earlier code exists in conversation
history (April 6 session) — recover it rather than rewriting from scratch.

---

# v1.0 FEATURES
# Build these after v0.5 is stable and in regular use.
# All six are confirmed. None require changes to the v0.1 database schema.

---

## 1. Inbox Folder

**What it is**
A special system folder that acts as the default landing zone for anything saved
without a destination. Sits at the top of the sidebar, directly below Journal.
Cannot be deleted or renamed. Created automatically on account setup alongside Journal
via the handle_new_user trigger.

**Behavior**
- Any page created without an explicit folder destination lands in Inbox
- Web clipper (feature 3 below) saves to Inbox by default, with optional folder
  override at clip time
- Items in Inbox show a soft visual indicator — a muted dot or left-border tint —
  that communicates "unreviewed" without urgency language. No red. No "action needed."
- Items are fully usable in place: editable, linkable, referenceable without moving

**Triage interaction**
- Each item in the Inbox folder view has a "Move to folder" option in its context menu
- A "Sort through" button at the top of the Inbox opens a triage view: each item
  shown with its title and a folder picker dropdown, assignable in one pass
- Moving an item out removes the visual indicator
- No "empty inbox" framing — the inbox is a landing zone, not a task to be cleared

**Implementation notes**
- Add inbox_folder_id to profiles table (uuid, set by handle_new_user trigger)
- Inbox appears first in sidebar, above all user-created folders
- FolderTree needs an isInbox flag to render the indicator and prevent rename/delete
- The indicator is a 3px left border in #444450 (hint color), not a badge or icon

---

## 2. Page Tags

**What it is**
Any page or journal entry can have one or more freeform tags applied via a tag input
in the page metadata row. Implements the Zettelkasten principle of tags-over-categories —
complementing the existing folder structure rather than replacing it.

**Storage**
New join table: page_tags
  - id: uuid default gen_random_uuid() primary key
  - page_id: uuid references pages(id) on delete cascade
  - user_id: uuid references profiles(id) on delete cascade
  - tag: text not null
  - created_at: timestamptz default now()
  - unique(page_id, tag)
RLS: auth.uid() = user_id

**Tag input**
- Renders in the page metadata row below the inline title in PageView
- Type a tag name + Enter or comma to add. Backspace on empty input removes the last tag
- Existing tags render as small chips (border radius 4px, #1e1e24 bg, #aaaaB8 text)
- No predefined taxonomy — fully freeform

**Tag browser in sidebar**
- A "Tags" section appears at the bottom of the left panel in Files mode
- Clicking a tag filters the FolderTree to show only pages with that tag
- Active tag filter shown as a chip at the top of the folder tree with an × to clear
- Searching in ⌘K with a # prefix filters by tag (e.g., "#research" shows all pages
  tagged "research")

**Implementation notes**
- Tag autocomplete: as the user types, query existing tags for that user and show
  suggestions in a small popover (useQuery on page_tags distinct tags)
- Tag chips in the folder tree item are visible at 11px below the page title
- Full-text search in Phase 8 should include tag content as a search vector

---

## 3. Web Clipper Browser Extension

**What it is**
A Chrome extension that saves content from any webpage directly into Second Brain
with one click. The primary external capture surface — how research and reference
material enter the system without breaking flow.

**Clip modes**
- Article (default): strips navigation/ads using @mozilla/readability, saves clean
  article text as a BlockNote page in the Inbox
- Full page: saves the page URL + title + a brief description as a page stub
- Selection: saves only the selected text on the page, with source URL as metadata

**Extension behavior**
- Clicking the extension icon opens a small popup (300×400px)
- Popup shows: clip mode selector, destination folder picker (default: Inbox),
  optional title override, Save button
- On save: calls the Second Brain API, creates the page, shows a brief success
  confirmation, closes the popup
- Auth: extension stores the Supabase session token in chrome.storage.local on first
  login, refreshes automatically

**API endpoint**
New TanStack Start server function: src/server/clipPage.ts
Accepts: { url, mode, title?, folderId?, userId }
For article mode: fetches the URL server-side (avoids CORS), runs @mozilla/readability,
converts to BlockNote JSON, inserts into pages table
For full-page mode: creates a stub page with the URL embedded as a block
Returns: { pageId, pageUrl } so the extension can offer an "Open in Second Brain" link

**Implementation notes**
- Chrome Manifest V3 extension
- Build separately from the main app — its own package.json in /extension/
- Extension popup is a small React app using the same shadcn components
- CORS: the server function must accept requests from chrome-extension:// origins
- Rate limit: one clip per 2 seconds to prevent accidental spam

---

## 4. PDF and Article Capture with AI Summarization

**What it is**
Users can upload PDFs or paste article URLs directly into any page using a /pdf or
/article slash command in BlockNote. Supabase Storage (currently configured but unused)
stores uploaded files. A Summarize button on any captured document sends the content
to Claude and pastes the summary as a new block below the embed.

**Slash commands**
/pdf — opens a file picker, accepts .pdf files up to 50MB (Supabase Storage limit in config)
/article — opens a URL input, fetches the article text using @mozilla/readability server-side

**Storage**
Bucket: attachments (create in Supabase Storage)
Path pattern: {userId}/{pageId}/{filename}
Public URLs via supabase.storage.from('attachments').getPublicUrl(path)
Reference: BlockNote examples/02-backend/01-file-uploading for the useCreateBlockNote
uploadFile hook pattern — this is the exact integration needed

**The PDF block**
A custom BlockNote block type: ResearchBlock
Renders as:
  - PDF: an iframe embed with the Supabase Storage public URL + a toolbar row showing
    filename, file size, and a "Summarize" button
  - Article: the article title as a heading, source URL as a muted link, article text
    as collapsed content (expand toggle), and a "Summarize" button

**AI summarization**
The Summarize button:
1. Sends the PDF (as base64) or article text to a server function: src/server/summarize.ts
2. Server function calls Claude with the content + TONE_SYSTEM_PROMPT from aiConstants.ts
3. Response is streamed back and inserted as a new Paragraph block directly below the
   ResearchBlock using editor.insertBlocks()
4. Button shows a loading state during generation — no spinner language, just "Working..."
5. If summarization has already run, button changes to "Summarize again"

**AI link suggestions**
Captured documents are indexed the same as pages for the AI link suggestion feature
(v0.5 AI panel). Claude can surface connections between a saved PDF and existing
notes, tasks, or journal entries. No additional schema changes needed — the ResearchBlock
lives inside a normal page's BlockNote JSON content.

**Implementation notes**
- @mozilla/readability runs server-side only (src/server/) to avoid CORS and bundle size
- PDF text extraction server-side: use pdf-parse or pdfjs-dist for text extraction
  before sending to Claude (do not send raw binary to the API)
- Video summarization (via transcript) is explicitly out of scope for v1.0

---

## 5. Page Reminders

**What it is**
A lightweight reminder field on any page — not a full task, just a date and
notification. Distinct from linking a page to a calendar event (which creates a
visual time block) — a reminder is an explicit notification trigger at a specific time.

**The distinction from calendar linking**
Calendar link = "I'm working on this page during this time block" (visual, scheduling)
Page reminder = "Remind me to look at this page at this time" (notification, async)
Both can coexist on the same page.

**Reminder field**
- Appears in the page metadata row, next to the tags field
- Click to open a date + time picker (shadcn Calendar + time input)
- Set reminder renders as a chip: "Reminder: Mon Apr 28, 9:00 AM" with an × to clear
- Stored as a reminder_at timestamptz column on the pages table

**Notification delivery**
v1.0 scope: in-app notification only. When the user has the app open at or after the
reminder time, a Sonner toast appears: "[Page title] — you wanted to revisit this."
Clicking the toast navigates to the page.

Push notifications (browser or mobile) are a v2 feature, not scoped here.

**Implementation notes**
- Add reminder_at: timestamptz column to pages table (new migration)
- A client-side interval (every 60 seconds) checks for due reminders against a
  useQuery that fetches pages where reminder_at <= now() and reminder_at > now() - 10min
- Dismissed reminders: add reminder_dismissed_at column, set on toast dismiss
- Tone: the toast copy must not use urgency language. "You wanted to revisit this"
  not "You have a reminder" or "Overdue review"

---

## 6. Presentation Mode

**What it is**
Turn any page into a simple fullscreen slideshow. Each level-1 heading (H1) in the
BlockNote document becomes a slide. Content between headings becomes the slide body.

**Entry point**
A "Present" button in the page toolbar (top right of PageView, alongside the existing
metadata and options buttons). Clicking it enters fullscreen presentation mode.

**Presentation UI**
- Fullscreen overlay (dark, #0f0f11 background)
- Slide title: H1 text at 36px, #e8e8f0, centered
- Slide body: remaining block content at 18px, #aaaaB8, centered, max-width 800px
- Navigation: ← → arrow keys or on-screen chevron buttons
- Slide counter: "3 / 12" at bottom right, 11px #444450
- Esc to exit

**Slide parsing**
On "Present" click, read editor.document, split at every heading block of level 1,
group subsequent blocks as that slide's content. If no H1 headings exist, treat the
entire page as one slide.

**Implementation notes**
- No new database schema needed — reads live BlockNote content
- Presentation state lives in a local React useState (not Zustand, not persisted)
- Export to PDF or PPTX is explicitly out of scope for v1.0
- Tone: the "Present" button label is neutral — not "Start presentation" with implied
  performance anxiety framing

---

# CONFIRMED FEATURE ROADMAP SUMMARY

| Feature | Version | Status |
|---|---|---|
| Auth, app shell, editor, search, buckets, calendar base | v0.1 | ✅ Phases 0–3 complete |
| TaskCard, EventSidePanel, FilesLandingPage, Google sync, Polish | v0.1 | 🔄 Phases 4–9 in progress |
| AI chat, AI writing, scheduling suggestions, page linking | v0.5 | Confirmed, not started |
| Inline page linking + backlinks | v0.5 | Confirmed, not started |
| Task icons, mobile layout, recurring events | v0.5 | Confirmed, not started |
| Google Drive folder import | v0.5 | Confirmed, not started |
| Inbox Folder | v1.0 | Confirmed, not started |
| Page Tags | v1.0 | Confirmed, not started |
| Web Clipper Extension | v1.0 | Confirmed, not started |
| PDF and Article Capture + AI Summarize | v1.0 | Confirmed, not started |
| Page Reminders | v1.0 | Confirmed, not started |
| Presentation Mode | v1.0 | Confirmed, not started |

---

*This document supersedes the v0.5 section of SecondBrain MVP Build Plan.md.*
*All hard rules in CLAUDE.md remain in effect across all versions.*

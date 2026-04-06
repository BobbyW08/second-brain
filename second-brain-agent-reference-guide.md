# Second Brain — Agent Reference Guide: Pre-Built Resources & Implementation Notes

> **Purpose:** This document is a reference guide for the coding agents (Claude Code + Cline) working on the Second Brain project. It defines which libraries handle which features, exactly how to configure and integrate each one, what must be built custom, and how to set up the agent environment. Treat every decision in this document as final — do not substitute alternatives without flagging it for review.
>
> **Project folder:** `C:\dev\second_brain`
> **Template folder:** `C:\dev\coding_templates`
> **Stack summary:** TanStack Start + Nitro · Supabase · shadcn/ui + Tailwind v4 · FullCalendar v6 · BlockNote + @blocknote/xl-ai · react-arborist · assistant-ui · Vercel AI SDK · Zustand · Sonner · Vercel Hobby

---

## Tool Stack Decision Table

| Feature Area | Library / Tool | Install Command | Notes |
|---|---|---|---|
| App framework | TanStack Start + Nitro | (starter repo — see below) | SSR + server functions + Vercel deploy. No Vite. No separate `api/` folder. |
| Routing | TanStack Router | included in TanStack Start | File-based, type-safe, `beforeLoad` for auth guards |
| Database + Auth | Supabase | `npm install @supabase/supabase-js` | PostgreSQL + RLS + Auth + Realtime + Storage |
| Auth (Google OAuth) | Supabase Auth | (Supabase dashboard config) | Add `access_type: 'offline'` + `prompt: 'consent'` to get refresh token |
| UI components | shadcn/ui | `npx shadcn@latest init` | Tailwind v4, copy-paste components, fully owned code |
| Styling | Tailwind CSS v4 | included in starter repo | Use responsive prefixes `sm:`, `md:` for mobile |
| Calendar | FullCalendar v6 | `npm install @fullcalendar/react @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/daygrid` | timeGrid views, drag-drop, resize, nowIndicator |
| External drag (bucket→calendar) | FullCalendar Draggable | included in `@fullcalendar/interaction` | Use FullCalendar's own `Draggable` class — do NOT use dnd-kit or react-dnd |
| Block editor | BlockNote | `npm install @blocknote/react @blocknote/mantine` | Slash commands, drag-drop blocks, custom inline content |
| AI writing in editor | @blocknote/xl-ai | `npm install @blocknote/xl-ai` | AI toolbar button + `/ai` slash command + streaming. GPL-3.0 license (fine for private app) |
| Folder/page tree | react-arborist | `npm install react-arborist` | Drag-drop reorder, inline rename, keyboard nav, virtualization — MIT license |
| AI chat UI | assistant-ui | `npm install assistant-ui` | Streaming thread, markdown rendering, auto-scroll, WAI-ARIA — MIT license |
| AI streaming | Vercel AI SDK | `npm install ai @ai-sdk/anthropic @ai-sdk/react` | `streamText`, `useChat`, `useCompletion`, `toDataStreamResponse()` |
| AI models | Anthropic Claude API | (API key in .env) | `claude-3-5-sonnet-20241022` for chat/writing; `claude-3-haiku-20240307` for suggestions |
| Client state | Zustand | `npm install zustand` | Persist middleware, devtools. For UI state only — server state goes in TanStack Query |
| Server state | TanStack Query | `npm install @tanstack/react-query` | All Supabase data fetching, caching, mutation, optimistic updates |
| Forms | React Hook Form + zod | `npm install react-hook-form zod @hookform/resolvers` | Used in auth forms and settings. shadcn Form component wraps this |
| Toast notifications | Sonner | `npx shadcn@latest add sonner` | Non-blocking toasts, undo button support, promise handling |
| Command palette / search | shadcn Command | `npx shadcn@latest add command` | `CommandDialog` triggered on ⌘K / Ctrl+K |
| Sidebar layout | shadcn Sidebar | `npx shadcn@latest add sidebar` | `SidebarProvider`, `SidebarContent`, `SidebarTrigger` |
| Mobile bottom sheet | shadcn Drawer | `npx shadcn@latest add drawer` | Used for task bucket and folder tree on mobile |
| Loading skeletons | shadcn Skeleton | `npx shadcn@latest add skeleton` | Applied to every data-loading state |
| Linting | Biome | included in starter repo | Replaces ESLint + Prettier |
| Testing | Vitest | included in starter repo | Unit tests for pure functions only |
| Deployment | Vercel Hobby (free) | (connect GitHub repo) | Nitro adapter handles SSR + server functions automatically — no custom `vercel.json` |

---

## Feature-by-Feature Pre-Built Resource Mapping

This section tells the agent exactly what each library provides out of the box and what configuration is required for each feature area. Read the relevant section before starting each phase.

---

### Phase 1 — Foundation & Auth

#### Starter Repo

**Clone this repo as the project base before writing any code:**
`https://github.com/domgaulton/tanstack-start-supabase-auth-protected-routes`

This provides out of the box:
- TanStack Start with Nitro (Vercel adapter already configured)
- Supabase Auth with protected routes via `beforeLoad`
- shadcn/ui initialized
- Tailwind CSS v4
- Biome linting
- Vitest
- GitHub Actions CI/CD
- Vercel deployment config

After cloning: rename project in `package.json` to `second-brain`, delete the `.git` folder, run `git init` to start fresh, run `npm install`.

#### Invite-Only Signup

Use these two Supabase patterns together — no custom invites table required:

```typescript
// Prevent open signups — add to signInWithOtp and signInWithOAuth calls:
shouldCreateUser: false

// Generate an invite link from the admin page:
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'invite',
  email: 'user@example.com',
})
// Send data.properties.action_link via email (Supabase built-in or Resend)
```

The `invites` table in the schema is used to track which emails have been invited and by whom.

#### Google OAuth + Calendar Scope + Refresh Token

```typescript
// In your signInWithOAuth call:
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'https://www.googleapis.com/auth/calendar',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})

// In your auth callback route (fires after OAuth redirect):
const { data: { session } } = await supabase.auth.getSession()
const providerRefreshToken = session?.provider_refresh_token

if (providerRefreshToken) {
  await supabase
    .from('profiles')
    .update({ google_refresh_token: providerRefreshToken })
    .eq('id', session.user.id)
    .throwOnError()
}
```

Always store `provider_refresh_token` in the `profiles` table. Never store it in a cookie or localStorage.

#### Protected Routes

TanStack Router's `beforeLoad` is the auth guard pattern. The starter repo already implements this. All protected routes use:

```typescript
export const Route = createFileRoute('/app/_authenticated')({
  beforeLoad: async ({ context }) => {
    if (!context.user) throw redirect({ to: '/login' })
  },
})
```

#### shadcn Sidebar Layout Shell

```bash
npx shadcn@latest add sidebar
```

Build `AppLayout.tsx` using `SidebarProvider` → `Sidebar` → `SidebarContent`. The sidebar wraps the entire authenticated app. `SidebarTrigger` handles the collapse toggle. On mobile, use shadcn `Drawer` instead of the sidebar (see Phase 8).

---

### Phase 2 — Priority Bucket (Tasks)

#### Data Layer Pattern

All task data goes through TanStack Query. The pattern for every feature area:

```typescript
// src/queries/tasks.ts
export function useTasksByPriority() {
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('position')
        .throwOnError()
      return data
    },
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      await supabase
        .from('tasks')
        .update({ status: 'completed_today', completed_at: new Date().toISOString() })
        .eq('id', taskId)
        .throwOnError()
    },
    onMutate: async (taskId) => {
      // Optimistic update — cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', userId] })
      const previous = queryClient.getQueryData(['tasks', userId])
      queryClient.setQueryData(['tasks', userId], (old: Task[]) =>
        old.map(t => t.id === taskId ? { ...t, status: 'completed_today' } : t)
      )
      return { previous }
    },
    onError: (_err, _taskId, context) => {
      queryClient.setQueryData(['tasks', userId], context?.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks', userId] }),
  })
}
```

#### TaskPill Data Attributes — Required for Phase 3

Every `TaskPill` component **must** include these data attributes. They are required for FullCalendar's `Draggable` initialization in Phase 3. Add them in Phase 2 even though drag isn't wired yet:

```tsx
<div
  className="task-pill"
  data-task-id={task.id}
  data-title={task.title}
  data-block-size={task.block_size}   // 'S' | 'M' | 'L'
  data-priority={task.priority}
>
```

Block size S/M/L is **visual height only**. It is never a timer and never evaluative. The durations used when scheduling are: S = 30 minutes, M = 60 minutes, L = 90 minutes.

#### Completed Today Section

Use shadcn `Collapsible` for the "Completed Today" section below each priority group. Auto-archive at midnight: use Supabase `pg_cron` scheduled function, or on app load check if `completed_at` date is before today and archive. Never show guilt-inducing messaging around completed or archived tasks.

---

### Phase 3 — Calendar & Scheduling

#### FullCalendar Initial Setup

```typescript
// CalendarView.tsx
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'

<FullCalendar
  plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
  initialView="timeGridThreeDay"
  views={{
    timeGridThreeDay: {
      type: 'timeGrid',
      duration: { days: 3 },
      buttonText: '3 day',
    },
  }}
  headerToolbar={{
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridDay,timeGridThreeDay,dayGridMonth',
  }}
  nowIndicator={true}
  allDaySlot={true}
  allDayText="Anytime"
  slotMinTime="06:00:00"
  slotMaxTime="22:00:00"
  editable={true}
  selectable={true}
  slotLaneContent={renderZoneLabel}   // see Morning/Afternoon/Evening below
  eventDrop={handleEventDrop}
  eventResize={handleEventResize}
  eventReceive={handleEventReceive}
  select={handleSelect}
/>
```

#### Morning / Afternoon / Evening Zones

FullCalendar does not have named time zones natively. Use the `slotLaneContent` render prop:

```typescript
function renderZoneLabel(arg: SlotLaneContentArg) {
  const totalMs = arg.time.milliseconds
  const hours = totalMs / 3600000

  if (hours === 6) return <div className="zone-label">MORNING</div>
  if (hours === 12) return <div className="zone-label">AFTERNOON</div>
  if (hours === 18) return <div className="zone-label">EVENING</div>
  return null
}
```

Add CSS for `.zone-label` and a very subtle background tint on the time slots within each zone range using FullCalendar's `slotLaneClassNames` prop. Keep tints very low opacity — visual guide only, not a strong color block.

#### Drag from Task Bucket to Calendar

**Use FullCalendar's own `Draggable` class from `@fullcalendar/interaction`. Do NOT use dnd-kit, react-dnd, or any other drag library for this feature — they conflict with FullCalendar's internal event model.**

```typescript
// In PriorityBucket.tsx — initialize on mount:
import { Draggable } from '@fullcalendar/interaction'

useEffect(() => {
  const bucketEl = bucketRef.current
  if (!bucketEl) return

  const draggable = new Draggable(bucketEl, {
    itemSelector: '.task-pill',
    eventData: (el: HTMLElement) => ({
      id: el.dataset.taskId,
      title: el.dataset.title,
      duration: BLOCK_SIZE_DURATIONS[el.dataset.blockSize as BlockSize],
      // S = '00:30', M = '01:00', L = '01:30'
    }),
  })

  return () => draggable.destroy()
}, [])
```

```typescript
// In CalendarView.tsx — handle the drop:
const handleEventReceive = async (info: EventReceiveArg) => {
  const taskId = info.event.id
  await createCalendarBlock({
    task_id: taskId,
    title: info.event.title,
    start_time: info.event.start!.toISOString(),
    end_time: info.event.end!.toISOString(),
    block_type: 'task',
  })
  // Optionally mark task as scheduled (not completed — just flagged)
}
```

#### Move and Resize

`editable: true` on FullCalendar handles both. Wire the callbacks:

```typescript
const handleEventDrop = async (info: EventDropArg) => {
  await updateCalendarBlock({
    id: info.event.id,
    start_time: info.event.start!.toISOString(),
    end_time: info.event.end!.toISOString(),
  })
}

const handleEventResize = async (info: EventResizeDoneArg) => {
  await updateCalendarBlock({
    id: info.event.id,
    end_time: info.event.end!.toISOString(),
  })
}
```

Always call `.throwOnError()` on the Supabase mutation. If the update fails, call `info.revert()` to snap the event back.

#### Google Calendar Sync

Use a TanStack Start server function — not a Vercel Edge Function file, not a separate `api/` folder.

```typescript
// src/server/googleCalendar.ts
import { google } from 'googleapis'
import { createServerFn } from '@tanstack/start'

export const syncGoogleCalendar = createServerFn('GET', async (_, ctx) => {
  const profile = await getProfile(ctx.user.id)

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )

  oauth2Client.setCredentials({
    refresh_token: profile.google_refresh_token,
  })

  // Always refresh — never rely on expiry detection
  const { credentials } = await oauth2Client.refreshAccessToken()
  await updateGoogleTokens(ctx.user.id, credentials)

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startOfRange.toISOString(),
    timeMax: endOfRange.toISOString(),
  })

  // Upsert to calendar_blocks where google_event_id matches
  // ...
})
```

Install: `npm install googleapis`

Token refresh rule: call `oauth2Client.refreshAccessToken()` on **every** Google Calendar API call, then save updated credentials back to `profiles`. Never try to detect expiry — always refresh proactively.

---

### Phase 4 — Pages, Folders & Journal

#### react-arborist Folder Tree

```typescript
import { Tree } from 'react-arborist'

<Tree
  data={folderData}
  onCreate={handleCreate}
  onRename={handleRename}
  onMove={handleMove}
  onDelete={handleDelete}
  renderRow={FolderNode}  // custom renderer
/>
```

`react-arborist` provides out of the box: drag-drop reorder, inline rename (double-click activates), keyboard navigation (arrow keys, Enter, Escape, Delete), virtualization for large trees, and multi-select. You only need to write the `FolderNode` renderer (~30 lines) and the four callback handlers that write to Supabase.

#### BlockNote Editor

```typescript
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'

function PageEditor({ page }: { page: Page }) {
  const editor = useCreateBlockNote({
    initialContent: page.content ?? undefined,
  })

  // Autosave on change
  useAutosave(() => {
    updatePage({ id: page.id, content: editor.document })
  }, [editor.document], 800) // 800ms debounce

  return <BlockNoteView editor={editor} />
}
```

Built-in features that require zero configuration: slash command menu (`/`), formatting toolbar, drag-drop block reorder, heading/list/code/image/table block types.

Custom slash commands are added via `getSlashMenuItems` override — add `/link` (Phase 6) and `/ai` is added automatically by `@blocknote/xl-ai` (Phase 7).

#### Autosave Hook

```typescript
// src/hooks/useAutosave.ts
export function useAutosave(fn: () => void, deps: unknown[], delay = 800) {
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSaving(true)
    const timer = setTimeout(async () => {
      await fn()
      setSaving(false)
    }, delay)
    return () => clearTimeout(timer)
  }, deps)

  return { saving }
}
```

Show a small "Saving..." spinner with `saving` state in the page top bar. Never show a save button — autosave is always silent unless actively saving.

#### Journal Auto-Naming Logic

Journal entries auto-create on the first visit to `/journal` each day. Title logic:

```typescript
function getJournalTitle(createdAt: Date, updatedAt: Date): string {
  const start = createdAt
  const end = updatedAt

  if (isSameDay(start, end)) {
    return `Journal — ${format(start, 'EEEE, MMMM d')}`
  }
  if (isSameMonth(start, end)) {
    return `Journal — ${format(start, 'EEE')} – ${format(end, 'EEE')}, ${format(start, 'MMMM d')}–${format(end, 'd')}`
  }
  return `Journal — ${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
}
```

Write unit tests for this function in Vitest. Test cases: same day, same month different days, cross-month.

---

### Phase 5 — Tables

#### TanStack Table + shadcn Data Table

Use TanStack Table as the headless core with shadcn's Data Table component pattern for the UI shell (sort, filter, column visibility, row selection). Build a custom cell renderer per column type:

| Column Type | Renderer | Behavior |
|---|---|---|
| `text` | `<Input>` | Editable on click, saves on blur |
| `checkbox` | shadcn `<Checkbox>` | Toggles and saves immediately |
| `select` | shadcn `<Select>` | Dropdown with options from column config |
| `date` | shadcn `<Calendar>` in `<Popover>` | Date picker, saves on select |
| `number` | `<Input type="number">` | Editable on click, saves on blur |
| `url` | `<a>` in view mode, `<Input>` in edit | Click pencil icon to edit |

Column definitions are built dynamically from the `tables_schema.columns` JSONB array. Each column object has `{ id, name, type, options }`.

New row: "+ Add row" at the bottom of the table inserts an empty row inline with focus on the first cell.

Row detail page at `/tables/$tableId/rows/$rowId` shows all fields in a vertical form plus a BlockNote editor for notes (same autosave pattern as pages).

---

### Phase 6 — Universal Linking & Global Search

#### shadcn Command (⌘K Search)

```bash
npx shadcn@latest add command
```

```typescript
// Trigger on ⌘K / Ctrl+K
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setOpen(true)
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [])

// Render:
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Search pages, tasks, folders..." />
  <CommandList>
    <CommandGroup heading="Pages">
      {pageResults.map(p => <CommandItem key={p.id} onSelect={() => navigate(`/pages/${p.id}`)}>{p.title}</CommandItem>)}
    </CommandGroup>
    <CommandGroup heading="Tasks">
      {/* ... */}
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

#### BlockNote Inline Linking

Register a custom inline content type `LinkChip` in BlockNote. Displays as `[📄 Page Title]` inline in editor content. Register `/link` as a custom slash command that opens `CommandDialog` in link-picker mode. On item selection, insert the `LinkChip` with `{ type, id, title }`. On insert, also write a record to the `links` table.

---

### Phase 7 — AI Features

#### Tone System Prompt — Required on Every AI Route

Create `src/lib/aiConstants.ts` before building any AI route. Every server function that calls the Anthropic API **must** import `TONE_SYSTEM_PROMPT` from this file. Never inline a system prompt directly in a route.

```typescript
// src/lib/aiConstants.ts
export const TONE_SYSTEM_PROMPT = `
You are a supportive, forward-focused personal assistant integrated into a productivity tool.

REQUIRED TONE:
- Always use encouraging, present-tense, forward-looking language
- Focus on what is possible and what comes next
- Celebrate progress, however small

PROHIBITED WORDS AND PHRASES (never use these in any response):
- overdue, late, missed, behind, failed, incomplete
- "you should", "you need to", "you must", "you haven't"
- Any language implying the user is falling behind or doing something wrong

When discussing tasks or schedule, speak in terms of opportunity and choice, not obligation.
`

export const AI_MODELS = {
  chat: 'claude-3-5-sonnet-20241022',
  writing: 'claude-3-5-sonnet-20241022',
  suggestions: 'claude-3-haiku-20240307',   // cheaper model for background tasks
  journal: 'claude-3-haiku-20240307',
} as const
```

#### Vercel AI SDK Streaming Route Pattern

All AI routes are TanStack Start server functions using this pattern:

```typescript
// src/server/aiChat.ts
import { createServerFn } from '@tanstack/start'
import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { TONE_SYSTEM_PROMPT, AI_MODELS } from '../lib/aiConstants'

export const aiChatFn = createServerFn('POST', async (input: { messages: Message[] }) => {
  const result = await streamText({
    model: anthropic(AI_MODELS.chat),
    system: TONE_SYSTEM_PROMPT,
    messages: input.messages,
  })
  return result.toDataStreamResponse()
})
```

Use `claude-3-5-sonnet` for interactive chat and writing. Use `claude-3-haiku` for scheduling suggestions and journal prompts (background, non-interactive, cost-sensitive).

#### assistant-ui Chat Panel

```typescript
import { Thread, ThreadMessages, Composer } from 'assistant-ui'
import { useChat } from '@ai-sdk/react'

function AIChatPanel() {
  const chat = useChat({ api: '/api/ai-chat' })

  return (
    <Thread>
      <ThreadMessages />
      <Composer {...chat} />
    </Thread>
  )
}
```

`assistant-ui` provides: streaming message rendering, auto-scroll to latest message, markdown support, loading indicators, WAI-ARIA compliance. It integrates directly with Vercel AI SDK's `useChat`. This replaces ~200 lines of custom chat UI code.

#### @blocknote/xl-ai (AI Writing in Editor)

```typescript
import { createAIExtension } from '@blocknote/xl-ai'

const editor = useCreateBlockNote({
  initialContent: page.content,
  extensions: [
    createAIExtension({
      model: anthropic(AI_MODELS.writing),
      systemPrompt: TONE_SYSTEM_PROMPT,
    }),
  ],
})
```

`@blocknote/xl-ai` automatically adds: the AI formatting toolbar button, the `/ai` slash command in the slash menu, streaming responses, and available actions (continue writing, summarize, rewrite, brainstorm). No additional UI code needed.

#### Scheduling Suggestions

Server function input: urgent + important tasks, calendar blocks for next 7 days.
Output: `{ taskId, suggestedStart, suggestedEnd, reason }[]`

Display as non-blocking suggestion cards above the task bucket. Each card has "Schedule it" (creates calendar block) and "Not now" (hides for 24 hours) actions. Use `claude-3-haiku` for cost efficiency — these run silently in the background.

#### Journal AI Prompts

On new/empty journal page open, call the journal prompt server function. Display result in a subtle banner above the editor with "Start writing" (focuses editor body) and "Dismiss" actions. The prompt is generated using the day of week, recent task activity, and the user's `tone_preference` from `profiles`. Use `claude-3-haiku`.

#### AI Usage Tracking

```typescript
// src/hooks/useLogAIUsage.ts
export function useLogAIUsage() {
  return async (feature: 'chat' | 'writing' | 'scheduling' | 'journal_prompt', tokensUsed?: number) => {
    await supabase.from('ai_usage').insert({
      user_id: userId,
      feature,
      tokens_used: tokensUsed,
    }).throwOnError()
  }
}
```

In the settings page, display "AI calls this month: [n]" as informational only. Never frame usage as a warning, limit, or concern.

---

### Phase 8 — Mobile, Polish & Testing

#### Sonner Toast Notifications

```bash
npx shadcn@latest add sonner
```

Add `<Toaster />` once in the root layout. Use for all user feedback:

```typescript
import { toast } from 'sonner'

// Success
toast.success('Task added')

// With undo button (use for complete, delete, archive)
toast.success('Task complete', {
  action: {
    label: 'Undo',
    onClick: () => undoComplete(taskId),
  },
})

// Error
toast.error('Could not save. Try again.')

// Async operation
toast.promise(saveTask(), {
  loading: 'Saving...',
  success: 'Saved',
  error: 'Could not save',
})
```

Never use `alert()`, `confirm()`, or inline error text for transient feedback. All transient feedback goes through Sonner.

#### Empty State Pattern

Use this pattern for all empty views. Copy from shadcnblocks.com or build from this structure:

```tsx
function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 text-muted-foreground">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
```

Empty state copy must follow tone rules — no language implying the user is behind or has failed to do something.

#### Mobile Layout Rules

| View | Mobile Behavior |
|---|---|
| Sidebar | Collapses entirely; hidden by default |
| Folder tree | Opens as shadcn `Drawer` (bottom sheet) via nav button |
| Task bucket | Renders as shadcn `Drawer` triggered by floating `+` button |
| Calendar | `initialView` switches to `timeGridDay` when `useMediaQuery('(pointer: coarse)')` returns true |
| AI Chat panel | Full-screen bottom sheet (`Sheet` or `Drawer`) |
| All tap targets | Minimum 44×44px |

```typescript
// Detect touch device for calendar view switching:
const isTouchDevice = useMediaQuery('(pointer: coarse)')
const calendarInitialView = isTouchDevice ? 'timeGridDay' : 'timeGridThreeDay'
```

#### Loading and Error States

- Apply shadcn `<Skeleton>` to every view that loads async data
- Wrap each major view in an `<ErrorBoundary>` component
- All Supabase calls use `.throwOnError()` — errors bubble up to the error boundary or are caught in mutation `onError` callbacks and shown via `toast.error()`
- Set a global TanStack Query error handler in `QueryClient` config:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: true, // let ErrorBoundary catch
    },
    mutations: {
      onError: (error) => toast.error('Something went wrong. Try again.'),
    },
  },
})
```

#### Vitest Unit Tests

Write tests for every pure function. Required test coverage before Phase 8 is complete:

| Function | Test File | Cases to Cover |
|---|---|---|
| `getJournalTitle()` | `journal.test.ts` | Same day, same month, cross-month |
| `buildAIContext()` | `aiContext.test.ts` | Page route, task route, calendar route |
| `BLOCK_SIZE_DURATIONS` | `blockSize.test.ts` | S=30m, M=60m, L=90m |
| `buildSchedulingPayload()` | `scheduling.test.ts` | Correct serialization of tasks + blocks |

---

## What Must Be Built From Scratch

The following components have no pre-built library equivalent and must be written as custom code. These are the only items that require original implementation — everything else is configuration and wiring of existing tools.

| Component | Approx. Size | What It Does |
|---|---|---|
| `TaskPill.tsx` | ~60 lines | Title, S/M/L badge, completion circle, data attributes for drag |
| `PriorityBucket.tsx` | ~80 lines | Three-section layout, FullCalendar `Draggable` init, bucket ref |
| `FolderNode.tsx` | ~30 lines | Custom react-arborist row renderer with icon, title, context menu |
| `slotLaneContent` zone renderer | ~20 lines | FullCalendar zone label injection per time range |
| `useAutosave.ts` | ~15 lines | Debounced mutation hook with saving state |
| `getJournalTitle()` | ~15 lines | Date range formatting for journal entry titles |
| `buildAIContext()` | ~30 lines | Route-aware context string builder for AI requests |
| `useLogAIUsage.ts` | ~10 lines | Single Supabase insert wrapped in a hook |
| `aiConstants.ts` | ~30 lines | `TONE_SYSTEM_PROMPT` + `AI_MODELS` constants |
| Invite admin page | ~40 lines | Single form + Supabase `admin.generateLink()` call |
| `LinkChip` BlockNote type | ~25 lines | Custom inline content type registration |
| `useAIContext.ts` | ~30 lines | Builds context string from current route/data |

---

## Starter Repo Reference

**Repo:** `https://github.com/domgaulton/tanstack-start-supabase-auth-protected-routes`

What it includes:
- TanStack Start (Nitro adapter, Vercel deployment config)
- Supabase Auth (`createClient`, session handling, protected routes via `beforeLoad`)
- shadcn/ui initialized
- Tailwind CSS v4
- Biome (replaces ESLint + Prettier)
- Vitest
- GitHub Actions CI/CD pipeline

After cloning this repo, Phases 0 and 1 foundation work is largely configuration rather than code — wiring Supabase project credentials, setting Google OAuth scopes, adding `shouldCreateUser: false`, and adding the `provider_refresh_token` capture in the auth callback.

---

## CLAUDE.md & Cline Memory Bank Setup

### CLAUDE.md (project root)

Create this file at `C:\dev\second_brain\CLAUDE.md` before any coding session begins. Claude Code reads this file at the start of every terminal session.

```markdown
# Second Brain Project

## Stack
TanStack Start + Nitro | Supabase (PostgreSQL + RLS + Auth + Realtime) | shadcn/ui + Tailwind v4 | FullCalendar v6 | BlockNote + @blocknote/xl-ai | Zustand | TanStack Query | Vercel AI SDK | assistant-ui | react-arborist | Sonner | Biome | Vitest | Vercel Hobby

## Hard Rules
1. No Vite. No separate api/ folder. All server logic lives in TanStack Start server functions (createServerFn).
2. Every Supabase call ends with .throwOnError(). Never swallow database errors silently.
3. TONE: Never use the words overdue, late, missed, behind, failed, incomplete in any JSX string, variable name, comment, CSS class name, or database column name.
4. TONE: Never use the phrases "you should", "you need to", "you must", "you haven't" in any UI copy.
5. Block size S/M/L = visual height only. Never a timer. Never evaluative. Never surfaced to the user as a productivity metric.
6. Every AI route imports TONE_SYSTEM_PROMPT and AI_MODELS from src/lib/aiConstants.ts. Never define or inline a system prompt inside a route file.
7. Use Zustand for client/UI state. Use TanStack Query for server/async state. Never mix them.
8. Do not use dnd-kit or react-dnd for calendar drag. Use FullCalendar's Draggable class from @fullcalendar/interaction exclusively.
9. After completing each phase, extract reusable patterns to C:\dev\coding_templates\ with [PLACEHOLDER] comments replacing all project-specific values.

## File Naming Conventions
- Components: PascalCase → src/components/[feature]/ComponentName.tsx
- Queries/mutations: camelCase → src/queries/featureName.ts
- Hooks: use-prefix camelCase → src/hooks/useHookName.ts
- Server functions: camelCase → src/server/serverFnName.ts
- Types: PascalCase → src/types/TypeName.ts
- Constants: SCREAMING_SNAKE_CASE

## Coding Session Protocol
Start of session: Read CLAUDE.md and memory-bank/activeContext.md. State the current ticket and break it into sub-tasks.
End of session: Review completed code against all Hard Rules above. Update memory-bank/activeContext.md and memory-bank/progress.md. Confirm template save was completed if required by the ticket.
```

### Cline Memory Bank Files

Create the following files in `C:\dev\second_brain\memory-bank\` before the first Cline session. Ask Cline to "update memory bank" at the end of every coding session.

**`projectbrief.md`** — What this app is, who it's for, the tone rule, and the invite-only constraint.

**`techContext.md`** — Full stack list with versions, folder structure, environment variable names, and key architecture decisions (no Vite, server functions only, FullCalendar Draggable for drag).

**`activeContext.md`** — Currently active ticket number and name. Sub-tasks remaining. Last completed action. Next 2 tickets queued.

**`progress.md`** — Full checklist of all phases and tickets. Check off as completed.

**`decisionLog.md`** — Record of why each major library was chosen. Reference this when Cline suggests an alternative (e.g., "should I use dnd-kit instead?") — the answer is in this file.

### Cline Session Start Command

Paste this at the beginning of every Cline VS Code session:

```
Read memory-bank/activeContext.md and memory-bank/techContext.md before doing anything else.
The current ticket is listed in activeContext.md.
Follow all rules in CLAUDE.md.
Do not use Vite. Do not create files in any api/ folder. All server logic goes in src/server/ using TanStack Start createServerFn.
After completing all sub-tasks, run the dev server (npm run dev) and confirm no console errors before marking the ticket complete.
```

---

## Cost & Licensing Summary

| Tool | Cost | License |
|---|---|---|
| TanStack Start / Router / Query / Table | Free | MIT |
| Supabase (up to 2 projects, 500MB DB, 50k MAU) | Free tier | Apache 2.0 |
| shadcn/ui + all shadcn components | Free | MIT |
| FullCalendar (timeGrid, interaction, dayGrid) | Free | MIT |
| BlockNote core | Free | MPL-2.0 |
| @blocknote/xl-ai | Free | GPL-3.0 (private app — fine) |
| react-arborist | Free | MIT |
| assistant-ui | Free | MIT |
| Vercel AI SDK | Free | Apache 2.0 |
| Zustand | Free | MIT |
| Sonner | Free | MIT |
| Biome | Free | MIT |
| Vitest | Free | MIT |
| Vercel Hobby (100GB bandwidth/mo) | Free | — |
| Anthropic Claude API | Pay per token | — |
| Google Calendar API | Free (quota limits apply) | — |

**Only recurring cost is Anthropic API usage.** At invite-only MVP scale with a small user count, this will be minimal. Supabase free tier comfortably supports the full MVP and early user base. Vercel Hobby tier is sufficient until the app has significant traffic.

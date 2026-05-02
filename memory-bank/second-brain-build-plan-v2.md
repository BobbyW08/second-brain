# Second Brain — Build Plan v2
# Phase 4 + v0.5-1 through v0.5-10 + v1.0
# Generated: May 2026 2100

---

## STATUS

- **v0.1** — Complete and in daily use
- **v0.5-0** — Complete (folder tree migrated to aldhyx/station-a-notion-clone)
- **Phase 4** — Active (task card redesign)

---

## HARD RULES — apply to every ticket, every file

1. Every Supabase call ends with `.throwOnError()`. No silent failures.
2. Banned words everywhere in copy, comments, variable names: `overdue`, `late`,
   `missed`, `behind`, `failed`, `incomplete`.
3. All AI server functions import `TONE_SYSTEM_PROMPT` and `AI_MODELS` from
   `src/lib/aiConstants.ts`. Never inline a system prompt.
4. Never use the `googleapis` npm package. All Google API calls use direct `fetch`
   with Bearer token auth.
5. `SUPABASE_SERVICE_ROLE_KEY` in server functions only.
6. Never install `@blocknote/xl-ai` — GPL-3.0, requires commercial license.
7. Never install `@ai-sdk/openai` or `openai` — project uses Anthropic only.
8. Minimum 44×44px tap targets on all interactive elements.
9. After every session: update `memory-bank/activeContext.md` and
   `memory-bank/progress.md`.
10. `npm run build && npm run check && npm run typecheck` must pass before every commit.

---

## PACKAGE INSTALLS BY PHASE

```bash
# Phase 4 — already installed
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @notion-kit/tags-input
npm install @paralleldrive/cuid2

# v0.5-1 — AI infrastructure
npm install ai @ai-sdk/anthropic @assistant-ui/react @assistant-ui/react-ai-sdk

# v0.5-2 — Three-panel layout shell
npm install react-resizable-panels

# v0.5-5 — Capture system
npm install @mozilla/readability turndown pdf-parse
npm install -D @types/turndown @types/pdf-parse
```

---

## PHASE 4 — Priorities Panel: Visual Overhaul + Functional Completion

**Touches:** `src/components/tasks/TaskCard.tsx`, `src/components/tasks/BucketPanel.tsx`,
`src/components/tasks/BucketHeader.tsx`, `src/queries/tasks.ts`,
`supabase/migrations/[date]_tasks_short_id.sql`

---

### 4-A — Closed Task Card

Replace `TaskStub`. The 3px left border replaces the dot as the color indicator.
Drag handle appears on hover. Metadata row below title is conditional.

```tsx
<div
  ref={setNodeRef}
  style={{ transform: CSS.Transform.toString(transform), transition,
           borderLeftColor: task.color ?? '#666672' }}
  className="group relative flex items-start gap-2 rounded-lg bg-[#1a1a20]
             px-3 py-2.5 hover:bg-[#1e1e24] transition-colors cursor-pointer
             border-l-[3px]"
  onClick={() => setOpenTaskId(task.id)}
>
  {/* Drag handle — dnd-kit listeners target */}
  <span
    {...listeners} {...attributes}
    className="mt-[3px] shrink-0 opacity-0 group-hover:opacity-100
               transition-opacity cursor-grab active:cursor-grabbing text-[#444450]"
    onClick={e => e.stopPropagation()}
  >
    <GripVertical size={14} />
  </span>

  <div className="flex-1 min-w-0">
    <p className="text-[13px] text-[#e8e8f0] leading-snug break-words">
      {task.title || <span className="text-[#444450]">Untitled</span>}
    </p>

    {/* Metadata row — only renders if something exists */}
    {(task.due_at || task.labels?.length > 0) && (
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {task.due_at && (
          <span className="font-mono text-[11px] text-[#666672]">
            {formatTaskDate(task.due_at)}
          </span>
        )}
        {task.labels?.map(label => (
          <span key={label}
            className="text-[11px] text-[#aaaaB8] bg-[#2a2a30] rounded px-1.5 py-0.5">
            {label}
          </span>
        ))}
      </div>
    )}
  </div>

  {task.google_event_id && (
    <CalendarIcon size={12} className="shrink-0 mt-[3px] text-[#3A8A3A]" />
  )}

  {/* Complete button — stopPropagation prevents card open */}
  <button
    onClick={e => { e.stopPropagation(); onComplete(task.id) }}
    className="shrink-0 mt-[2px] w-[18px] h-[18px] rounded-full border
               border-[#444450] hover:border-[#3A8FD4] transition-colors"
    aria-label="Mark complete"
  />
</div>
```

---

### 4-B — Open Task Card

Inline expansion — card grows vertically in place. No modal, no sheet, no new route.
One card open at a time. Click outside → close. Opening a second card closes the first.

**Kill all ALL-CAPS field labels.** Every field uses icon + placeholder instead.

**Title:**
```tsx
<input
  autoFocus
  value={title}
  onChange={e => setTitle(e.target.value)}
  onBlur={() => updateTask.mutate({ id: task.id, title })}
  className="w-full text-[16px] text-[#e8e8f0] font-medium bg-transparent
             border-none outline-none placeholder:text-[#444450]"
  placeholder="Task title"
/>
```

**Description:**
```tsx
<textarea
  value={description}
  onChange={e => setDescription(e.target.value)}
  onBlur={e => {
    updateTask.mutate({ id: task.id, description })
    detectAndRenderUrls(e.target.value)  // convert bare URLs to chips below
  }}
  className="w-full text-[13px] text-[#aaaaB8] bg-transparent border-none
             outline-none resize-none placeholder:text-[#444450] leading-relaxed"
  placeholder="Add a note..."
  rows={2}
/>
```

**Bucket field — popover, not a row of dots:**
```tsx
<Popover>
  <PopoverTrigger asChild>
    <button className="flex items-center gap-1.5 text-[11px] text-[#aaaaB8]
                       hover:text-[#e8e8f0] transition-colors py-1">
      <span className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: currentBucket?.color ?? '#666672' }} />
      {currentBucket?.name ?? 'No bucket'}
      <ChevronDown size={10} className="text-[#444450]" />
    </button>
  </PopoverTrigger>
  <PopoverContent className="w-44 p-1 bg-[#1e1e24] border border-[#2a2a30] shadow-lg">
    {buckets.map(bucket => (
      <button key={bucket.id}
        onClick={() => { moveTask.mutate({ taskId: task.id, bucketId: bucket.id }); close() }}
        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-[12px]
          transition-colors ${task.bucket_id === bucket.id
            ? 'text-[#e8e8f0]'
            : 'text-[#666672] hover:text-[#aaaaB8] hover:bg-[#2a2a30]'}`}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: bucket.color ?? '#666672' }} />
        {bucket.name}
        {task.bucket_id === bucket.id && <Check size={10} className="ml-auto" />}
      </button>
    ))}
  </PopoverContent>
</Popover>
```

**Color swatches:** 6 circles, selected gets `ring-2 ring-offset-1 ring-offset-[#1a1a20] ring-white/40`.

**Labels — @notion-kit/tags-input:**
```tsx
import { TagsInput } from '@notion-kit/tags-input'
<TagsInput
  value={task.labels ?? []}
  onChange={labels => updateTask.mutate({ id: task.id, labels })}
  placeholder="Add label..."
/>
```

**Date field — icon-led, chrono-node on blur:**
```tsx
<div className="flex items-center gap-2">
  <CalendarIcon size={13} className="text-[#444450] shrink-0" />
  {isEditingDate || !task.due_at ? (
    <input
      value={dateInput}
      onChange={e => setDateInput(e.target.value)}
      onFocus={() => setIsEditingDate(true)}
      onBlur={() => {
        const parsed = chrono.parseDate(dateInput)
        if (parsed) {
          updateTask.mutate({ id: task.id, due_at: parsed.toISOString() })
          setIsEditingDate(false)
        } else if (dateInput) {
          setDateError(true)  // subtle red border, do NOT clear input
        }
      }}
      className={`text-[12px] bg-transparent border-none outline-none w-full
        ${dateError ? 'border-b border-[#E05555]' : ''}
        text-[#aaaaB8] placeholder:text-[#444450]`}
      placeholder="Set a date..."
    />
  ) : (
    <span className="font-mono text-[11px] text-[#aaaaB8] cursor-pointer"
          onClick={() => { setDateInput(formatDateForEdit(task.due_at)); setIsEditingDate(true) }}>
      {formatTaskDate(task.due_at)}
    </span>
  )}
</div>
{dateError && (
  <p className="text-[11px] text-[#E05555] ml-5">Try: tomorrow 3pm or apr 18 4-5pm</p>
)}
```

**Links — collapsed by default:**
```tsx
{!showLinks ? (
  <button onClick={() => setShowLinks(true)}
    className="flex items-center gap-2 text-[11px] text-[#444450]
               hover:text-[#666672] transition-colors">
    <Paperclip size={12} /> Add link
  </button>
) : (
  <div className="flex flex-col gap-1">
    <input placeholder="Paste a URL..."
      className="text-[12px] text-[#aaaaB8] bg-[#1e1e24] rounded px-2 py-1.5
                 border border-[#2a2a30] outline-none" />
    {task.links?.map(link => <LinkChip key={link} href={link} />)}
  </div>
)}
```

**Short ID:**
```tsx
<div className="flex items-center gap-1.5">
  <span className="font-mono text-[11px] text-[#444450]">#{task.short_id}</span>
  <button onClick={() => navigator.clipboard.writeText(task.short_id)}
    className="text-[#444450] hover:text-[#666672] transition-colors">
    <Copy size={10} />
  </button>
</div>
```

**Action row:**
```tsx
<div className="flex items-center justify-between pt-2 border-t border-[#2a2a30]/60">
  <button onClick={() => completeTask.mutate(task.id)}
    className="flex items-center gap-1.5 text-[12px] text-[#666672]
               hover:text-[#3A8FD4] transition-colors min-h-[44px] px-1">
    <CheckCircle2 size={14} /> Mark complete
  </button>
  <button onClick={() => deleteTask.mutate(task.id)}
    className="text-[#444450] hover:text-[#E05555] transition-colors
               min-h-[44px] min-w-[44px] flex items-center justify-center">
    <Trash2 size={14} />
  </button>
</div>
```

---

### 4-C — Bucket Header

```tsx
<div className="group flex items-center gap-2 px-3 py-2 border-b border-[#2a2a30]/40">
  <button onClick={onToggleExpand}
    className="flex items-center gap-1.5 flex-1 min-w-0">
    <ChevronRight
      size={13}
      className={`text-[#444450] transition-transform shrink-0
        ${isExpanded ? 'rotate-90' : ''}`}
    />
    <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672]
                     truncate">
      {bucket.name}
    </span>
    {taskCount > 0 && (
      <span className="text-[11px] text-[#444450] bg-[#2a2a30] rounded-full
                       px-1.5 py-0.5 leading-none ml-1 shrink-0">
        {taskCount}
      </span>
    )}
  </button>

  <button
    className="opacity-0 group-hover:opacity-100 transition-opacity
               text-[#444450] hover:text-[#aaaaB8] min-w-[44px] min-h-[44px]
               flex items-center justify-center"
    onClick={e => { e.stopPropagation(); openMenu() }}
  >
    <MoreHorizontal size={14} />
  </button>
</div>
```

---

### 4-D — dnd-kit Task Reorder

Wrap each bucket's task list. The FullCalendar `Draggable` in BucketPanel is unchanged —
dnd-kit operates on the list only, FullCalendar handles the calendar drop.

```tsx
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

// In BucketPanel, per bucket:
const sensors = useSensors(useSensor(PointerSensor, {
  activationConstraint: { distance: 8 }  // prevents accidental drags on click
}))

<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={({ active, over }) => {
    if (over && active.id !== over.id) {
      reorderTasks.mutate({ taskId: active.id as string, overId: over.id as string })
    }
  }}
>
  <SortableContext
    items={bucketTasks.map(t => t.id)}
    strategy={verticalListSortingStrategy}
  >
    {bucketTasks.map(task => <TaskCard key={task.id} task={task} />)}
  </SortableContext>
</DndContext>
```

Add `reorderTasks` mutation to `src/queries/tasks.ts` — updates `position` on affected
rows using the array index after reorder. Optimistic update: reorder locally, confirm on server.

---

### 4-E — short_id Migration

```sql
-- supabase/migrations/[date]_tasks_short_id.sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS short_id text UNIQUE;
UPDATE tasks SET short_id = left(replace(gen_random_uuid()::text, '-', ''), 7)
  WHERE short_id IS NULL;
```

On `createTask`: generate with `createId().slice(0, 7)` from `@paralleldrive/cuid2`.
Run `npm run db:types` after migration.

---

### 4-F — Subtasks (after 4-A through 4-E are stable and committed)

**Migration:**
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES tasks(id);
```

In the open card, below description, above the divider:
```tsx
<div className="flex flex-col gap-1">
  <p className="text-[10px] uppercase tracking-[0.06em] text-[#444450]">Subtasks</p>
  <DndContext sensors={sensors} collisionDetection={closestCenter}
    onDragEnd={handleSubtaskReorder}>
    <SortableContext items={subtasks.map(s => s.id)} strategy={verticalListSortingStrategy}>
      {subtasks.map(sub => <SubtaskRow key={sub.id} subtask={sub} />)}
    </SortableContext>
  </DndContext>
  <button onClick={() => createSubtask(task.id)}
    className="text-[11px] text-[#444450] hover:text-[#666672] text-left py-1">
    + Add subtask
  </button>
</div>
```

`SubtaskRow`: same drag handle + title + complete circle pattern as closed card.
Also gets `data-task-id` + `data-title` so FullCalendar's Draggable picks it up.

---

## v0.5-1 — AI Infrastructure: Route + Constants + Thread Persistence

**Estimated: 3–4h**
**Touches:** `src/lib/aiConstants.ts`, `src/routes/api/chat.ts`, `src/server/aiChat.ts`,
`supabase/migrations/007_ai_threads.sql`

**Step 1 — Read tanchat pattern first**
```bash
git clone https://github.com/osadavc/tanchat C:/tmp/tanchat
```
Read: `src/routes/api/chat.ts`, any file importing from `ai` or `@ai-sdk/*`.
This is the only known working TanStack Start + Vercel AI SDK integration.
Do not port Next.js App Router examples. Clean up after: `rm -rf C:/tmp/tanchat`

**Step 2 — Install**
```bash
npm install ai @ai-sdk/anthropic @assistant-ui/react @assistant-ui/react-ai-sdk
```

**Step 3 — Create `src/lib/aiConstants.ts`**
```ts
export const AI_MODELS = {
  default: 'claude-sonnet-4-20250514',
  fast:    'claude-haiku-4-5-20251001',
} as const

export const TONE_SYSTEM_PROMPT = `
You are an assistant integrated into Second Brain, a personal productivity app.

Tone rules — non-negotiable:
- Never use: overdue, late, missed, behind, failed, incomplete
- Never say: "you should", "you need to", "you must"
- All suggestions are invitations, not instructions
- Frame everything as forward-looking and neutral
- Never express urgency or create anxiety about the user's schedule
- When referencing tasks in progress: "things you're still working on"
`
```

**Step 4 — Create `src/routes/api/chat.ts`** (follow tanchat exactly)
```ts
import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAPIFileRoute } from '@tanstack/start/api'
import { AI_MODELS, TONE_SYSTEM_PROMPT } from '@/lib/aiConstants'

export const Route = createAPIFileRoute('/api/chat')({
  POST: async ({ request }) => {
    const { messages } = await request.json()
    const anthropic = createAnthropic()
    const result = streamText({
      model: anthropic(AI_MODELS.default),
      system: TONE_SYSTEM_PROMPT,
      messages,
    })
    return result.toUIMessageStreamResponse()
  },
})
```

**Step 5 — Migration**
```sql
CREATE TABLE ai_threads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title      text,
  messages   jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE ai_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own threads"
  ON ai_threads FOR ALL USING (auth.uid() = user_id);
```

Run migration. Run `npm run db:types`.

**Acceptance criteria:**
- [ ] `src/lib/aiConstants.ts` exists with `AI_MODELS` and `TONE_SYSTEM_PROMPT`
- [ ] POST to `/api/chat` streams a response
- [ ] `ai_threads` table exists with RLS enabled
- [ ] Build passes clean

---

## v0.5-2 — Three-Panel Shell + AI Chat Panel

**Estimated: 6–8h**
**Touches:** `src/components/layout/AppShell.tsx` (full rewrite), `src/components/ai/AIChatPanel.tsx`,
`src/queries/aiThreads.ts`, `src/stores/useUIStore.ts`

This ticket rewrites the AppShell layout. Left sidebar, main content, and right AI panel
sit on the same visual plane — no overlays, no z-index stacking. Left and right collapse
independently. Left and right are user-resizable with drag handles. Center responds to both.

### Step 1 — Install

```bash
npm install react-resizable-panels
```

`react-resizable-panels` (MIT, Brian Vaughn). Handles drag-to-resize, collapse/expand,
and persists panel sizes to localStorage automatically.

### Step 2 — AppShell layout rewrite

Replace the existing `AppShell.tsx` entirely:

```tsx
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'

export function AppShell() {
  const { aiPanelOpen, setAiPanelOpen, setLeftCollapsed } = useUIStore()
  const leftPanelRef = useRef(null)

  return (
    <div className="flex flex-col h-screen bg-[#141418] overflow-hidden">
      <TopBar />
      <PanelGroup
        direction="horizontal"
        autoSaveId="second-brain-panels"
        className="flex-1 min-h-0"
      >
        {/* Left — Priorities / Files sidebar */}
        <Panel
          ref={leftPanelRef}
          id="left"
          defaultSize={22}
          minSize={15}
          maxSize={35}
          collapsible
          collapsedSize={0}
          onCollapse={() => setLeftCollapsed(true)}
          onExpand={() => setLeftCollapsed(false)}
          className="flex flex-col min-h-0 bg-[#18181c]"
        >
          <LeftSidebar />
        </Panel>

        <PanelResizeHandle className="w-px bg-[#2a2a30] hover:bg-[#3A8FD4]
                                      transition-colors cursor-col-resize" />

        {/* Center — Calendar / Editor / Capture */}
        <Panel id="main" minSize={30} className="flex flex-col min-h-0">
          <MainContent />
        </Panel>

        {/* Right — AI panel — only mounts when open */}
        {aiPanelOpen && (
          <>
            <PanelResizeHandle className="w-px bg-[#2a2a30] hover:bg-[#3A8FD4]
                                          transition-colors cursor-col-resize" />
            <Panel
              id="right"
              defaultSize={28}
              minSize={20}
              maxSize={45}
              collapsible
              collapsedSize={0}
              className="flex flex-col min-h-0 bg-[#18181c] border-l border-[#2a2a30]"
            >
              <AIChatPanel />
            </Panel>
          </>
        )}

      </PanelGroup>
    </div>
  )
}
```

**Left collapse toggle:** The existing sidebar toggle button calls
`leftPanelRef.current.collapse()` / `.expand()`. Pass the ref down or use a store action.
The resize handle remains visible but has nothing to drag against when collapsed — this
is correct `react-resizable-panels` behavior.

**Right panel:** Only mounts when `aiPanelOpen === true`. When it opens, the center
panel shrinks naturally — `PanelGroup` handles redistribution with no layout jump.

**Size persistence:** `autoSaveId="second-brain-panels"` persists sizes to localStorage
across sessions automatically. No extra code needed.

### Step 3 — AIChatPanel

`src/components/ai/AIChatPanel.tsx`:

```tsx
export function AIChatPanel() {
  const { setAiPanelOpen } = useUIStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-[#2a2a30] shrink-0">
        <span className="text-[12px] font-medium text-[#aaaaB8] uppercase
                         tracking-[0.06em]">Assistant</span>
        <button onClick={() => setAiPanelOpen(false)}
          className="text-[#444450] hover:text-[#aaaaB8] transition-colors
                     min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={14} />
        </button>
      </div>

      <ThreadList />

      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        <Thread />
      </div>

      <div className="shrink-0 px-3 pb-3">
        <Composer />
      </div>
    </div>
  )
}
```

`Thread` and `Composer` from `@assistant-ui/react`. Wire via `useAssistantTransportRuntime`
pointing to `/api/chat`. Do not use `useVercelUseChatRuntime` — it assumes Next.js routes.

### Step 4 — Thread persistence in Supabase

**Create `src/queries/aiThreads.ts`** — `useRemoteThreadListRuntime` adapter:

| Adapter method | Supabase call |
|---|---|
| `list()` | `.from('ai_threads').select().eq('user_id', uid).order('updated_at', { ascending: false }).throwOnError()` |
| `initialize(threadId)` | `.from('ai_threads').insert({ id: threadId, user_id: uid, messages: [] }).throwOnError()` |
| `rename(threadId, title)` | `.from('ai_threads').update({ title }).eq('id', threadId).throwOnError()` |
| `archive(threadId)` | `.from('ai_threads').update({ status: 'archived' }).eq('id', threadId).throwOnError()` |
| `delete(threadId)` | `.from('ai_threads').delete().eq('id', threadId).throwOnError()` |

Persist on `onFinish`: PATCH `ai_threads.messages` with the full updated array.

### Step 5 — useUIStore additions

```ts
aiPanelOpen: boolean
setAiPanelOpen: (open: boolean) => void
leftCollapsed: boolean
setLeftCollapsed: (v: boolean) => void
```

Toggle `aiPanelOpen` on `⌘/` — add to AppShell keyboard handler.
Add AI toggle button to TopBar (right-aligned, beside the Synced indicator).

**Acceptance criteria:**
- [ ] Three panels coplanar — no overlays, no z-index stacking
- [ ] Drag handle between left and center resizes both correctly
- [ ] Drag handle between center and right resizes both correctly
- [ ] Left panel collapses to zero width on toggle, expands cleanly
- [ ] Right AI panel opens/closes via `⌘/` and TopBar button
- [ ] Panel sizes persist across page refresh
- [ ] Thread list works — create, switch, delete threads
- [ ] Messages persist in `ai_threads.messages` JSONB
- [ ] Build passes clean

---

## v0.5-3 — Contextual AI Prompt (Editor + Full App Context)

**Estimated: 4–5h**
**Touches:** `src/components/editor/AIPromptBar.tsx`, `src/components/editor/PageView.tsx`,
`src/server/aiContext.ts`, `src/server/aiWriting.ts`

**Do not install `@blocknote/xl-ai`.** This ticket does not use a popover with preset
options. It is a free-form prompt input where the AI has read access to everything in
the app — current page, all tasks, today's calendar events, folder structure.

### What it is

A prompt bar that appears at the bottom of the editor (above the page footer, pinned).
The user types any instruction in natural language. The AI has the full app context
injected and can act on anything it can see — rewrite text, create a task, explain
something in the current doc, reference a calendar event.

```
┌─ editor content ─────────────────────────────────────────────────┐
│  ...                                                              │
│  ...                                                              │
└───────────────────────────────────────────────────────────────────┘
┌─ AI prompt bar — pinned at bottom of PageView ───────────────────┐
│  ✦  [Ask anything about this page or your day...    ] [↵ Send]   │
└───────────────────────────────────────────────────────────────────┘
```

It is always visible when a page is open. It is not a toolbar button. It is not a popover.

### Step 1 — Context assembly server function

`src/server/aiContext.ts` — assembles the full context snapshot for the AI.
Called once per prompt submission. Never called on a timer or in the background.

```ts
import { createServerFn } from '@tanstack/start'
import { createClient } from '@/lib/supabase/server'

export const getAIContext = createServerFn('GET', async ({ userId, pageId }) => {
  const supabase = createClient()

  const [tasks, folders, pages, calendarBlocks, currentPage] = await Promise.all([
    supabase.from('tasks')
      .select('id, title, description, color, labels, due_at, completed_at, bucket_id, short_id')
      .eq('user_id', userId)
      .is('completed_at', null)
      .throwOnError(),

    supabase.from('folders')
      .select('id, name, is_system')
      .eq('user_id', userId)
      .throwOnError(),

    supabase.from('pages')
      .select('id, title, folder_id, created_at')
      .eq('user_id', userId)
      .throwOnError(),

    supabase.from('calendar_blocks')
      .select('id, title, start_at, end_at, google_event_id, all_day')
      .eq('user_id', userId)
      .gte('start_at', startOfToday())
      .lte('start_at', endOfWeek())
      .throwOnError(),

    pageId
      ? supabase.from('pages').select('id, title, content').eq('id', pageId).single().throwOnError()
      : Promise.resolve({ data: null }),
  ])

  return {
    tasks: tasks.data,
    folders: folders.data,
    pages: pages.data,
    calendarBlocks: calendarBlocks.data,
    currentPage: currentPage.data,
  }
})
```

### Step 2 — AI writing server function

`src/server/aiWriting.ts` — receives the user prompt + full context, streams a response.

```ts
import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createServerFn } from '@tanstack/start'
import { AI_MODELS, TONE_SYSTEM_PROMPT } from '@/lib/aiConstants'

export const aiPrompt = createServerFn('POST', async ({
  prompt,
  context,
  selectedText,
}: {
  prompt: string
  context: Awaited<ReturnType<typeof getAIContext>>
  selectedText?: string
}) => {
  const anthropic = createAnthropic()

  const contextBlock = `
## Your full context

### Active tasks (not complete)
${context.tasks?.map(t => `- [#${t.short_id}] ${t.title}${t.due_at ? ` — due ${t.due_at}` : ''}`).join('\n')}

### Calendar — today through end of week
${context.calendarBlocks?.map(b => `- ${b.title} at ${b.start_at}`).join('\n')}

### Current page: ${context.currentPage?.title ?? 'None'}
${context.currentPage?.content ? `\n${JSON.stringify(context.currentPage.content).slice(0, 3000)}` : ''}

### All pages
${context.pages?.map(p => `- ${p.title}`).join('\n')}

${selectedText ? `### Selected text in editor\n${selectedText}` : ''}
`

  const result = streamText({
    model: anthropic(AI_MODELS.default),
    system: TONE_SYSTEM_PROMPT + '\n\n' + contextBlock,
    prompt,
  })

  return result.toUIMessageStreamResponse()
})
```

### Step 3 — AIPromptBar component

`src/components/editor/AIPromptBar.tsx`:

```tsx
export function AIPromptBar({ pageId }: { pageId: string }) {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const editor = useBlockNoteEditor()

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResponse('')

    const selectedText = editor.getSelectedText()
    const context = await getAIContext({ userId, pageId })

    const res = await fetch('/api/ai-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt, context, selectedText }),
    })

    // Stream response into the response area
    for await (const chunk of res.body) {
      setResponse(prev => prev + decode(chunk))
    }

    setLoading(false)
    setPrompt('')
  }

  return (
    <div className="border-t border-[#2a2a30] bg-[#18181c] px-4 py-3">
      {response && (
        <div className="mb-3 text-[13px] text-[#aaaaB8] leading-relaxed
                        bg-[#1e1e24] rounded-lg p-3 border border-[#2a2a30]">
          {response}
          {/* If response contains text to insert into editor: */}
          <button onClick={() => editor.replaceBlocks([...], [])}
            className="text-[11px] text-[#3A8FD4] mt-2 block hover:underline">
            Insert into page
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-[#3A8FD4] shrink-0 text-[14px]">✦</span>
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit() }}
          placeholder="Ask anything about this page or your day..."
          className="flex-1 text-[13px] text-[#e8e8f0] bg-transparent border-none
                     outline-none placeholder:text-[#444450]"
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !prompt.trim()}
          className="text-[11px] text-[#3A8FD4] hover:text-[#5AAEF8] disabled:text-[#444450]
                     transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <CornerDownLeft size={13} />}
        </button>
      </div>
    </div>
  )
}
```

Mount `<AIPromptBar pageId={page.id} />` at the bottom of `PageView.tsx`, outside the
BlockNote editor scroll area.

### Step 4 — Add AI button to FormattingToolbar (text rewrites only)

When text IS selected, the `FormattingToolbarController` gets one extra button that
prefills the AIPromptBar with the selection and focuses it. This is not a popover —
it just focuses the prompt bar with `"Rewrite: [selected text]"` as a starting prompt.

```tsx
// In FormattingToolbar — one extra button, no popover
<AIFocusButton key="aiButton" onClick={() => {
  const selected = editor.getSelectedText()
  focusPromptBar(`Rewrite this: "${selected.slice(0, 80)}..."`)
}} />
```

**Acceptance criteria:**
- [ ] AIPromptBar visible at bottom of every open page
- [ ] Submitting a prompt assembles full context and streams a response
- [ ] Response displays in the bar, with "Insert into page" option when relevant
- [ ] Context includes: active tasks, this week's calendar, current page content, page list
- [ ] Selecting text and clicking AI toolbar button prefills prompt bar
- [ ] No `@blocknote/xl-ai` in package.json
- [ ] Build passes clean

---

## v0.5-4 — Supabase MCP Server

**Estimated: 1–2h**
**Touches:** `memory-bank/mcp-setup.md` (new file)

Configuration only. No code changes to the app.

```bash
# Test locally first
npx @supabase/mcp --url "$VITE_SUPABASE_URL" --key "$SUPABASE_SERVICE_ROLE_KEY"
```

Then configure in Claude.ai → Settings → MCP Servers with the Supabase project URL
and service role key.

**Expose:** `tasks`, `pages`, `folders`, `calendar_blocks`, `ai_threads`, `captures`
**Never expose:** `profiles.google_access_token`, `profiles.google_refresh_token`

Document full setup steps in `memory-bank/mcp-setup.md`.

---

## v0.5-5 — Universal Capture System

**Estimated: 8–10h**
**Touches:** `src/components/capture/CaptureModal.tsx`, `src/server/capture.ts`,
`src/stores/useUIStore.ts`, `supabase/migrations/008_captures.sql`,
`supabase/migrations/008b_folders_system_flag.sql`

### Step 1 — Migrations

```sql
-- 008_captures.sql
CREATE TABLE captures (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES profiles(id) ON DELETE CASCADE,
  raw_text          text NOT NULL,
  source            text NOT NULL DEFAULT 'modal',
  source_url        text,
  source_title      text,
  ai_classification text,
  ai_entities       jsonb,
  ai_confidence     numeric(3,2),
  routed_to         jsonb,
  status            text NOT NULL DEFAULT 'pending',
  created_at        timestamptz DEFAULT now()
);
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own captures"
  ON captures FOR ALL USING (auth.uid() = user_id);

-- 008b_folders_system_flag.sql
ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;
```

### Step 2 — _system folder on first login

In the auth callback or a `handle_new_user` trigger, create a `_system` folder
with `is_system = true`. Inside it create three pages: **Inbox**, **Log**, **Templates**.
These pages are non-deletable and non-renameable — guard with `is_system` check in
folder/page delete mutations.

In the FolderTree component: `_system` folder always pins to top regardless of position.
Hide rename and delete options from its context menu.

### Step 3 — ⌘J Capture Modal

`src/components/capture/CaptureModal.tsx`:
- Opens on `⌘J` — add to the global keyboard handler in AppLayout
- shadcn `Dialog` with a single `<textarea>` — nothing else
- Placeholder: `"Capture anything..."`
- `Enter` submits. `Escape` closes. `Shift+Enter` for newline.
- On submit: call `createCapture` server function, close immediately (optimistic)
- Sonner toast: `"Captured — routing..."`

Add `captureModalOpen: boolean` + `setCaptureModalOpen` to `useUIStore`.
Add a capture icon button to TopBar for non-keyboard access.

### Step 4 — AI Routing Pipeline

`src/server/capture.ts`:

```ts
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { AI_MODELS, TONE_SYSTEM_PROMPT } from '@/lib/aiConstants'
import { createId } from '@paralleldrive/cuid2'

const CaptureSchema = z.object({
  classification: z.enum(['task', 'event', 'note', 'contact', 'reference', 'ambiguous']),
  confidence:     z.number().min(0).max(1),
  entities: z.object({
    people:   z.array(z.string()),
    dates:    z.array(z.string()),
    tasks:    z.array(z.string()),
    topics:   z.array(z.string()),
    location: z.string().optional(),
    url:      z.string().optional(),
  }),
  suggestedTitle: z.string(),
  routing: z.object({
    destination:  z.enum(['tasks', 'calendar', 'pages', 'contacts', 'inbox']),
    bucketId:     z.string().optional(),
    folderId:     z.string().optional(),
    calendarDate: z.string().optional(),
  }),
})

export const createCapture = createServerFn('POST', async ({
  rawText, source = 'modal', sourceUrl, sourceTitle, userId
}: {
  rawText: string; source?: string; sourceUrl?: string
  sourceTitle?: string; userId: string
}) => {
  // 1. Insert capture immediately with status='routing'
  const { data: capture } = await supabase
    .from('captures')
    .insert({ user_id: userId, raw_text: rawText, source, source_url: sourceUrl,
              source_title: sourceTitle, status: 'routing' })
    .select().single().throwOnError()

  // 2. Run classification
  const anthropic = createAnthropic()
  const { object } = await generateObject({
    model: anthropic(AI_MODELS.default),
    system: TONE_SYSTEM_PROMPT,
    schema: CaptureSchema,
    prompt: `Extract all structured information from this capture:\n\n${rawText}`,
  })

  // 3. Route based on confidence
  if (object.confidence >= 0.8) {
    await autoRoute(capture.id, object, userId)   // create records, set status='routed'
  } else {
    await routeToInbox(capture.id, object, userId) // create Inbox page, set status='review'
  }

  return capture.id
})
```

### Step 5 — Multi-Format Text Extraction

All paths extract text then call `createCapture`. No new routing logic needed per format.

**Article/URL:**
```ts
import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'

export async function extractFromUrl(url: string) {
  const html = await fetch(url).then(r => r.text())
  const dom = new JSDOM(html, { url })
  const article = new Readability(dom.window.document).parse()
  const md = new TurndownService().turndown(article?.content ?? html)
  return { text: md, title: article?.title }
}
```

**PDF:**
```ts
import pdfParse from 'pdf-parse'

export async function extractFromPdf(buffer: Buffer) {
  const { text } = await pdfParse(buffer)
  return text
}
```

**Complex PDF or image** (use Anthropic vision — no extra package):
```ts
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

export async function extractFromImage(base64: string, mimeType: string) {
  const anthropic = createAnthropic()
  const { text } = await generateText({
    model: anthropic(AI_MODELS.default),
    messages: [{
      role: 'user',
      content: [
        { type: 'file', data: base64, mimeType },
        { type: 'text', text: 'Extract all text and structured content.' }
      ]
    }]
  })
  return text
}
```

**Audio** (Vercel AI SDK — no extra package beyond `ai`):
```ts
import { experimental_transcribeAudio } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

export async function extractFromAudio(audioBuffer: Buffer) {
  // Use when Anthropic audio transcription is available, or pass to whisper via API
  // For now: send audio as base64 to the capture pipeline as raw text placeholder
  // TODO: wire to transcription endpoint when stable
}
```

---

## v0.5-6 — Contacts & Interactions

**Estimated: 6–8h**
**Touches:** `supabase/migrations/009_contacts.sql`, `src/server/contacts.ts`,
`src/components/contacts/`, `src/queries/contacts.ts`

Direct fetch to `people.googleapis.com` — same Bearer token pattern as
`src/server/googleCalendar.ts`. `people.readonly` scope is already in the OAuth setup.

```ts
// src/server/contacts.ts
const res = await fetch(
  'https://people.googleapis.com/v1/people/me/connections' +
  '?personFields=names,emailAddresses,phoneNumbers,organizations',
  { headers: { Authorization: `Bearer ${accessToken}` } }
)
```

**⌘K integration:** Add contacts group to `CommandDialog` results.
**EventSidePanel:** If attendee email matches `contacts.email`, show contact card inline.
**Schema:** See `second-brain-master-reference-v2.md` under "CONTACTS & INTERACTIONS".

---

## v0.5-7 — Universal Backlink Graph + Inline Page Linking

**Estimated: 5–7h**
**Touches:** `supabase/migrations/010_linked_entities.sql`, `src/queries/linkedEntities.ts`,
`src/components/editor/PageView.tsx`, `src/components/tasks/TaskCard.tsx`

```sql
CREATE TABLE linked_entities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id   uuid NOT NULL,
  target_type text NOT NULL,
  target_id   uuid NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (source_type, source_id, target_type, target_id)
);
ALTER TABLE linked_entities ENABLE ROW LEVEL SECURITY;
```

**Backlinks in task open card** (add after this migration runs):
```tsx
// Below the links field in the open card
{backlinks.length > 0 && (
  <div className="flex flex-col gap-1 pt-2 border-t border-[#2a2a30]/60">
    {backlinks.map(link => (
      <div key={link.id} className="flex items-center gap-2 text-[11px] text-[#666672]">
        {link.target_type === 'calendar_block'
          ? <CalendarIcon size={11} />
          : <FileIcon size={11} />}
        <span>{link.label}</span>
        <button onClick={() => removeBacklink(link.id)}
          className="ml-auto text-[#444450] hover:text-[#E05555]">
          <X size={10} />
        </button>
      </div>
    ))}
  </div>
)}
```

**Inline page linking** — `/link` slash command via BlockNote `SuggestionMenuController`.
Opens ⌘K in link-picker mode → inserts `[[PageTitle]]` chip.
Follow blocknotejs.org/docs/custom-schemas/inline-content for the custom InlineContent spec.

---

## v0.5-8 — Capture Review Queue (Inbox UI)

**Estimated: 3–4h**
**Touches:** `src/components/capture/InboxView.tsx`, `src/queries/captures.ts`

Special renderer for the `_system/Inbox` page. Activates when
`folder.is_system = true AND folder.name = 'Inbox'`.

**State machine:**
```
routing → review        (ambiguous capture arrives, waits for human)
review  → routed        (user approves AI suggestion)
review  → review        (user edits and resubmits — re-runs routing)
```

**Each capture card shows:**
- Raw capture text
- AI-suggested classification and destination
- "Looks right" button → calls `approveCapture` → executes the routing → `status='routed'`
- "Edit" button → opens editable textarea → resubmits through routing pipeline

**Realtime:** Supabase Realtime subscription on `captures WHERE status='review'`.
Queue updates live as new ambiguous captures arrive.

---

## v0.5-9 — Google Drive Folder Import

**Estimated: 4–6h**
**Touches:** `src/server/googleDrive.ts`, `src/components/files/DriveImportDialog.tsx`

Recover `google-drive-import-recovered.md` from memory-bank before starting.
Copy `getFreshGoogleToken` pattern exactly from `src/server/googleCalendar.ts`.
Never use the `googleapis` package — direct fetch to `https://www.googleapis.com/drive/v3/files`.

---

## v0.5-10 — Mobile Layout

**Estimated: 5–8h**
**Touches:** `src/components/layout/AppLayout.tsx`, `src/components/layout/MobileNav.tsx`

```ts
// src/hooks/useIsMobile.ts
export function useIsMobile() {
  return window.innerWidth < 768
}
```

- Bottom navigation replaces sidebar on mobile (4 tabs: Priorities · Calendar · Files · Settings)
- shadcn `Sheet` anchored to bottom for task bucket panel
- `timeGridDay` for calendar on mobile (single day view)
- Reference: `satnaing/shadcn-admin` mobile nav pattern — adapt structure, do not copy verbatim
- Audit every interactive element after this ticket: minimum 44×44px, no exceptions

---

## v1.0 — Browser Extension (own repo)

**Repo:** `github.com/BobbyW08/Second_Brain_Clipper`
**Scaffold:** `theluckystrike/chrome-extension-starter-mv3` (MIT)
**Extraction reference:** `obsidianmd/obsidian-clipper` (MIT) — study only

Three clip modes:
1. Article: `@mozilla/readability` + `turndown` → Markdown → POST to `/api/capture`
2. Full page: `turndown` on `document.body.innerHTML`
3. Selection: `window.getSelection().toString()`

Auth: session token stored in `chrome.storage`, set once from Second Brain Settings.
Settings page addition: "Browser Extension" section with one-time auth token.

---

## v1.0 — Remaining Tickets (as previously specified)

- **v1.0-2:** Presentation mode (reveal.js)
- **v1.0-6:** Multi-doc split screen — main panel renders two pages side by side,
  each independently scrollable. Use a second nested `PanelGroup` (horizontal, inside
  the center `Panel` from v0.5-2). Split triggered by right-clicking a page in the
  tree and selecting "Open to the side". The two-panel state is stored in
  `useUIStore.splitPageIds: [string, string] | null`. Closing either panel reverts
  to single-doc view.
- **v1.0-3:** Page tags
- **v1.0-4:** PDF & Article Capture in editor (extends v0.5-5 extraction functions)
- **v1.0-5:** Page reminders

---

## TICKET DEPENDENCY MAP

```
Phase 4-A → 4-B → 4-C → 4-D → 4-E
                               └→ 4-F (subtasks, after all above stable)

v0.5-1 (AI infrastructure)
  └→ v0.5-2 (three-panel shell + AI chat)   ← layout architecture change
  └→ v0.5-3 (contextual AI prompt bar)       ← needs context assembly + v0.5-1 route

v0.5-4 (Supabase MCP) — independent

v0.5-5 (Universal Capture — 008_captures.sql)
  └→ v0.5-8 (review queue — needs captures table + status field)

v0.5-7 (linked_entities — 010_linked_entities.sql)
  └→ v0.5-6 contacts need linked_entities for linking
  └→ Phase 4-F backlinks need linked_entities

v0.5-9 (Google Drive) — independent
v0.5-10 (mobile) — independent, after Phase 4 stable
```

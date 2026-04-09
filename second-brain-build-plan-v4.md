# Second Brain — Complete Build Plan V4
## Stable Foundations First

**Philosophy:** Build in stable layers. Each layer is complete and locked before the next begins. No feature touches a file that will need rework because of a later feature. Pages are built once, fully, and never revisited.

**Coding Environment:** Claude Code (terminal — planning, ticketing, review) + Cline/Qwen3-235B (VS Code — actual code writing)
**Project folder:** `C:\dev\second_brain`
**Template folder:** `C:\dev\coding_templates`
**Backup/Archive folder:** `C:\backup-archive`

---

## Build Status

| Session | Focus | Status |
|---------|-------|--------|
| Pre-Session | Project cleanup & template extraction | ✅ DONE |
| 0 | Repo, tooling & environment | ✅ DONE |
| 1 | Database schema, types & RLS | ✅ DONE |
| 2 | Auth, Google OAuth & invite gate | ✅ DONE |
| 3 | Complete data layer (all queries) | ✅ DONE |
| 4 | Shared infrastructure | ✅ DONE |
| 5 | Tasks page (PriorityBucket, TaskPill) | ✅ DONE |
| 6 | Calendar page (FullCalendar, Google sync) | ✅ DONE |
| 7 | Pages & folder tree (BlockNote, FolderTree) | ✅ DONE |
| 8 | Journal page (auto-create, title util) | ✅ DONE |
| 9 | AI features (chat, writing, scheduling, journal) | ✅ DONE |
| 10 | Tables (TableView, schema builder, row detail) | ✅ DONE |
| 11 | Global search & linking (CommandDialog, LinkChip) | ✅ DONE |
| 12 | Settings & admin (profile, Google connect, invite) | ✅ DONE |
| 13 | Polish, mobile & testing | ⚠️ PARTIAL — see below |

### Session 13 Detail
| Ticket | Status |
|--------|--------|
| Loading skeletons (PriorityBucket, TableView, FolderTree, JournalLayout) | ✅ DONE |
| Tone word audit | ✅ PASS |
| journalUtils.test (5 cases) | ✅ DONE |
| ErrorBoundary wrapping in AppLayout | ❌ NOT DONE |
| Mobile layout (useMediaQuery in AppLayout, CalendarView) | ❌ NOT DONE |
| Tests: aiContext.test, blockSize.test, scheduling.test | ❌ NOT DONE |

### Post-Build Audit (2026-04-09)
7 runtime bugs corrected + dead code removed — see `memory-bank/updated_plan.md` for full list.

---

## The Layer Model

```
Layer 0 — Repo, tooling, environment
Layer 1 — Database schema, types, RLS (Supabase)
Layer 2 — Auth, session, protected routing
Layer 3 — All data layer (queries + mutations for every table)
Layer 4 — Shared infrastructure (constants, hooks, layout, stubs)
Layer 5+ — One page at a time, fully complete
```

Every layer must be complete and verified before the next begins. No exceptions.

---

## Pre-Session: Project Cleanup

### Step A — Audit existing folder
Read the full directory tree of `C:\dev\second_brain` recursively. List all files by folder. Do not delete anything yet. Output the full tree for review.

### Step B — Extract template-worthy code
Before moving anything, scan for reusable patterns:
- Working Supabase typed client or auth helpers
- Working Google OAuth flow
- `.env` or `.env.example` with correct variable names
- Working TanStack Query hooks
- Working RLS migration files
- Utility functions (date helpers, debounce, formatters)

For each item found: strip project-specific names, replace with `[PROJECT_NAME]`, `[TABLE_NAME]`, `[YOUR_VALUE]` placeholders, save to the correct subfolder of `C:\dev\coding_templates\`.

### Step C — Archive old code
Move everything from `C:\dev\second_brain` to `C:\backup-archive\second_brain_old_[DATE]`. Do NOT delete the `C:\dev\second_brain` folder — just empty it.

### Step D — Verify clean
List contents of `C:\dev\second_brain`. Should be empty or contain only `.git`. Confirm ready for fresh scaffold.

---

## Session 0 — Repo, Tooling & Environment

**Goal:** A running dev server with correct tooling. Nothing app-specific yet.

**Acceptance criteria:** `npm run dev` starts without errors. Biome lints without errors. Vitest runs (zero tests, zero failures). `.env.local` is populated. Supabase client connects.

---

### Ticket 0-A: Clone and initialize repo

Clone the starter repo:
```
https://github.com/domgaulton/tanstack-start-supabase-auth-protected-routes
```

- Rename project in `package.json` to `second-brain`
- Delete `.git` folder from cloned repo
- Run `git init` to start fresh version control
- Run `npm install`
- Verify `npm run dev` starts

---

### Ticket 0-B: Environment variables

Create `C:\dev\second_brain\.env.local`:

```
# Supabase
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]   # server functions only

# Anthropic
ANTHROPIC_API_KEY=[key]

# Google OAuth — tokens stored in profiles table, not .env
# Configure scopes in Supabase dashboard

# App
VITE_APP_URL=http://localhost:3000
ADMIN_EMAIL=[your-email]
```

Save a copy with no values to `C:\dev\coding_templates\env\.env.example`.

---

### Ticket 0-C: Create CLAUDE.md

Create `C:\dev\second_brain\CLAUDE.md`:

```markdown
# Second Brain Project

## Stack
TanStack Start + Nitro | Supabase (PostgreSQL + RLS + Auth + Realtime) | shadcn/ui + Tailwind v4 |
FullCalendar v6 | BlockNote + @blocknote/xl-ai | Zustand | TanStack Query | Vercel AI SDK |
assistant-ui | react-arborist | Sonner | Biome | Vitest | Vercel Hobby

## Hard Rules
1. No Vite. No separate api/ folder. All server logic in TanStack Start server functions (createServerFn).
2. Every Supabase call ends with .throwOnError(). Never swallow database errors silently.
3. TONE: Never use the words overdue, late, missed, behind, failed, incomplete in any JSX string,
   variable name, comment, CSS class, or database column.
4. TONE: Never use the phrases "you should", "you need to", "you must", "you haven't" in any UI copy.
5. Block size S/M/L = visual height only. Never a timer. Never evaluative.
6. Every AI route imports TONE_SYSTEM_PROMPT and AI_MODELS from src/lib/aiConstants.ts.
   Never define or inline a system prompt inside a route file.
7. Use Zustand for client/UI state. Use TanStack Query for server/async state. Never mix them.
8. Do not use dnd-kit or react-dnd for calendar drag. Use FullCalendar's Draggable class
   from @fullcalendar/interaction exclusively.
9. After each session, extract reusable patterns to C:\dev\coding_templates\ with [PLACEHOLDER] comments.

## File Naming Conventions
- Components: PascalCase → src/components/[feature]/ComponentName.tsx
- Queries/mutations: camelCase → src/queries/featureName.ts
- Hooks: use-prefix camelCase → src/hooks/useHookName.ts
- Server functions: camelCase → src/server/serverFnName.ts
- Types: PascalCase → src/types/TypeName.ts
- Constants: SCREAMING_SNAKE_CASE

## Session Protocol
START: Read CLAUDE.md and memory-bank/activeContext.md. State the current ticket. Break into sub-tasks.
END: Review completed code against all Hard Rules. Update memory-bank/activeContext.md and
     memory-bank/progress.md. Confirm template save done if required.
```

---

### Ticket 0-D: Create Cline memory bank

Create `C:\dev\second_brain\memory-bank\` with these files:

**`projectbrief.md`** — What this app is, who it's for, the tone rule, invite-only constraint.

**`techContext.md`** — Full stack list with versions, folder structure, env variable names, key architecture decisions.

**`activeContext.md`** — Current ticket. Sub-tasks remaining. Last completed action. Next 2 tickets queued.

**`progress.md`** — Full checklist of all sessions and tickets. Check off as completed.

**`decisionLog.md`** — Why each major library was chosen. Reference this when Cline suggests an alternative.

**Template save:** Extract `.env.example` to `C:\dev\coding_templates\env\.env.example`

---

## Session 1 — Database Schema, Types & RLS

**Goal:** The entire database is built, typed, and locked. Every table, every column, every RLS policy exists before any application code is written. The TypeScript types are generated and committed. This file — `src/types/database.types.ts` — never changes again unless the schema itself changes.

**Acceptance criteria:** All tables exist in Supabase. All RLS policies applied. `database.types.ts` generated and committed. A test query from the Supabase dashboard returns expected results.

---

### Ticket 1-A: Create Supabase project and run full schema migration

Create new Supabase project. Run the following SQL in full:

```sql
-- profiles: extended user data
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  google_access_token text,
  google_refresh_token text,
  google_token_expiry timestamptz,
  google_calendar_id text,
  tone_preference text default 'encouraging',
  ai_usage_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- folders: nested hierarchy for pages
create table folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  parent_id uuid references folders(id) on delete cascade,
  name text not null,
  icon text,
  position integer default 0,
  created_at timestamptz default now()
);

-- pages: rich text content nodes
create table pages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  title text not null default 'Untitled',
  content jsonb,
  page_type text default 'page',   -- 'page' | 'journal'
  journal_date date,
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- tasks: priority bucket items
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  priority text not null,          -- 'urgent' | 'important' | 'someday'
  block_size text not null default 'M',  -- 'S' | 'M' | 'L' (visual only)
  status text default 'active',    -- 'active' | 'completed_today' | 'archived'
  completed_at timestamptz,
  position integer default 0,
  notes jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- calendar_blocks: scheduled time slots
create table calendar_blocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  block_type text default 'task',  -- 'task' | 'event' | 'focus' | 'break'
  google_event_id text,
  color text,
  is_synced boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- tables_schema: dynamic field table definitions
create table tables_schema (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  name text not null,
  columns jsonb not null default '[]',
  created_at timestamptz default now()
);

-- table_rows: rows for dynamic tables
create table table_rows (
  id uuid default gen_random_uuid() primary key,
  table_id uuid references tables_schema(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  data jsonb not null default '{}',
  notes jsonb,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- links: bidirectional page/item linking
create table links (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  source_type text not null,       -- 'page' | 'task' | 'table_row'
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  created_at timestamptz default now()
);

-- invites: admin-issued invite tokens
create table invites (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  token text not null unique,
  used boolean default false,
  invited_by uuid references profiles(id),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

-- ai_usage: per-user AI consumption tracking
create table ai_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  feature text not null,           -- 'chat' | 'writing' | 'scheduling' | 'journal'
  tokens_used integer,
  created_at timestamptz default now()
);
```

---

### Ticket 1-B: Apply all RLS policies

```sql
-- Enable RLS on every table
alter table profiles enable row level security;
alter table folders enable row level security;
alter table pages enable row level security;
alter table tasks enable row level security;
alter table calendar_blocks enable row level security;
alter table tables_schema enable row level security;
alter table table_rows enable row level security;
alter table links enable row level security;
alter table ai_usage enable row level security;

-- Standard user-scoped policy (repeat for each table)
create policy "Users can only access their own data"
  on profiles for all using (auth.uid() = id);

create policy "Users can only access their own folders"
  on folders for all using (auth.uid() = user_id);

create policy "Users can only access their own pages"
  on pages for all using (auth.uid() = user_id);

create policy "Users can only access their own tasks"
  on tasks for all using (auth.uid() = user_id);

create policy "Users can only access their own calendar blocks"
  on calendar_blocks for all using (auth.uid() = user_id);

create policy "Users can only access their own table schemas"
  on tables_schema for all using (auth.uid() = user_id);

create policy "Users can only access their own table rows"
  on table_rows for all using (auth.uid() = user_id);

create policy "Users can only access their own links"
  on links for all using (auth.uid() = user_id);

create policy "Users can only access their own ai_usage"
  on ai_usage for all using (auth.uid() = user_id);
```

---

### Ticket 1-C: Create new-user trigger and generate TypeScript types

Create a trigger so every new auth signup automatically creates a `profiles` row:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

Then generate TypeScript types:
```bash
supabase gen types typescript --project-id [project-id] > src/types/database.types.ts
```

Commit `database.types.ts`. This file represents the schema contract for the rest of the project.

**Template save:** Extract RLS policy block, profiles trigger, and `gen-types.sh` script to `C:\dev\coding_templates\supabase\`

---

## Session 2 — Auth, Google OAuth & Invite Gate

**Goal:** Authentication is complete end-to-end. Google OAuth works with calendar scope and refresh token storage. Non-invited users are blocked. All future sessions can assume `user` and `session` exist in the context of protected routes.

**Acceptance criteria:** Google OAuth login completes. `profiles` row created on first login. `provider_refresh_token` stored in `profiles`. Non-invited email cannot create an account. Protected routes redirect unauthenticated users to `/login`.

---

### Ticket 2-A: Configure Google OAuth in Supabase

In Supabase dashboard → Auth → Providers → Google:
- Enable Google provider
- Add Google OAuth credentials (Client ID + Secret from Google Cloud Console)
- Add scope: `https://www.googleapis.com/auth/calendar`

In Google Cloud Console:
- Authorized redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`

---

### Ticket 2-B: Invite-only signup gate

```typescript
// In signInWithOAuth and signInWithOtp — prevent open signups:
shouldCreateUser: false

// Admin invite generation (used in admin page — Session 7):
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'invite',
  email: 'user@example.com',
})
// data.properties.action_link is the magic invite URL
```

The `invites` table tracks which emails were invited and by whom. The `shouldCreateUser: false` on all auth calls enforces the gate at the Supabase level.

---

### Ticket 2-C: Google OAuth sign-in with calendar scope + refresh token capture

```typescript
// Sign in call:
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

// Auth callback route — fires after OAuth redirect:
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

Rule: `provider_refresh_token` is always stored in `profiles`. Never in a cookie or localStorage.

---

### Ticket 2-D: Protected routes via TanStack Router beforeLoad

The starter repo already implements the `beforeLoad` auth guard pattern. Verify it works:

```typescript
export const Route = createFileRoute('/app/_authenticated')({
  beforeLoad: async ({ context }) => {
    if (!context.user) throw redirect({ to: '/login' })
  },
})
```

Test: visit a protected route while logged out → redirects to `/login`. Log in → reaches protected route.

**Template save:** Extract typed Supabase client, auth callback with token storage, invite pattern, and `gen-types.sh` to `C:\dev\coding_templates\supabase\`

---

## Session 3 — Complete Data Layer (All Tables)

**Goal:** Every Supabase query and mutation for every feature is written, typed, and tested against the live database before any UI code is written. This is the most important session in the project. Once this is done, every UI component in later sessions just calls hooks — no raw Supabase calls ever appear in component files.

**Rule:** No UI code in this session. Only `src/queries/` files.

**Acceptance criteria:** Every hook listed below is written and returns correct data when called from a test component or the Supabase dashboard. Every mutation correctly writes to the database. All calls end with `.throwOnError()`.

---

### Ticket 3-A: `src/queries/profiles.ts`

```typescript
useProfile()                    // get current user's profile
useUpdateProfile()              // update display_name, avatar_url, tone_preference
useUpdateGoogleTokens()         // update google_refresh_token, google_access_token, google_token_expiry
useDisconnectGoogle()           // null out all google_* fields
```

---

### Ticket 3-B: `src/queries/tasks.ts`

```typescript
useTasksByPriority()            // all active tasks, grouped by priority, ordered by position
useTask(taskId)                 // single task
useCreateTask()                 // insert new task with priority, title, block_size
useUpdateTask()                 // update title, block_size, notes, priority
useMoveTask()                   // update priority + position (for drag between buckets)
useReorderTasks()               // update position within a bucket
useCompleteTask()               // set status = 'completed_today', completed_at = now()
useUndoCompleteTask()           // set status = 'active', completed_at = null
useArchiveTask()                // set status = 'archived'
useArchiveCompletedBefore()     // archive all completed_today where completed_at < today
```

Every mutation that changes list order must use optimistic updates. Pattern:
```typescript
onMutate: async (input) => {
  await queryClient.cancelQueries({ queryKey: ['tasks', userId] })
  const previous = queryClient.getQueryData(['tasks', userId])
  queryClient.setQueryData(['tasks', userId], /* optimistic update */)
  return { previous }
},
onError: (_err, _input, context) => {
  queryClient.setQueryData(['tasks', userId], context?.previous)
},
onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks', userId] }),
```

---

### Ticket 3-C: `src/queries/calendarBlocks.ts`

```typescript
useCalendarBlocks(dateRange)    // blocks between start and end date
useCreateCalendarBlock()        // insert new block (from calendar select or task drop)
useUpdateCalendarBlock()        // update start_time, end_time, title, block_type
useDeleteCalendarBlock()        // delete block
useUndoDeleteCalendarBlock()    // restore deleted block
useSyncGoogleEvents()           // upsert blocks where google_event_id matches
```

---

### Ticket 3-D: `src/queries/folders.ts`

```typescript
useFolderTree()                 // all folders for user, with parent_id relationships
useCreateFolder()               // insert folder
useRenameFolder()               // update name
useMoveFolder()                 // update parent_id + position
useDeleteFolder()               // delete (cascades to pages)
```

---

### Ticket 3-E: `src/queries/pages.ts`

```typescript
usePages(folderId?)             // pages in folder, or all loose pages if no folderId
usePage(pageId)                 // single page with content
useCreatePage()                 // insert page with folder_id, page_type
useUpdatePage()                 // update title, content, is_pinned — used by autosave
useDeletePage()                 // delete page
useJournalPage(date)            // journal page for a specific date
useCreateJournalPage()          // insert page with page_type='journal', journal_date=today
```

---

### Ticket 3-F: `src/queries/tables.ts` and `src/queries/tableRows.ts`

```typescript
// tables.ts
useTables()                     // all table schemas for user
useTable(tableId)               // single table schema with columns
useCreateTable()                // insert table_schema
useUpdateTableSchema()          // update name, columns JSONB
useDeleteTable()                // delete table (cascades to rows)

// tableRows.ts
useTableRows(tableId)           // all rows for a table, ordered by position
useTableRow(rowId)              // single row
useCreateTableRow()             // insert empty row
useUpdateTableRow()             // update data JSONB for a row
useDeleteTableRow()             // delete row
useReorderTableRows()           // update positions
```

---

### Ticket 3-G: `src/queries/links.ts`

```typescript
useBacklinks(targetId)          // all links where target_id = targetId
useCreateLink()                 // insert link record (source → target)
useDeleteLink()                 // remove link
```

---

### Ticket 3-H: `src/queries/aiUsage.ts`

```typescript
useAIUsageThisMonth()           // count of ai_usage rows for current month
useLogAIUsage()                 // insert ai_usage record (feature, tokens_used)
```

**Template save:** Extract TanStack Query hook pattern with optimistic update to `C:\dev\coding_templates\tanstack\query-hook.ts`

---

## Session 4 — Shared Infrastructure

**Goal:** Everything that every page will import is built and locked here. By the end of this session, the project has a working app shell, all route stubs, all shared constants, all shared hooks, and all shared UI primitives. No page-specific code yet — only the frame every page will live inside.

**Acceptance criteria:** App shell renders for all authenticated routes. All route stubs navigate correctly. Dark mode works. `aiConstants.ts` is written. All shared hooks exist. `useAutosave` and `useMediaQuery` are tested. Zero console errors on navigation.

---

### Ticket 4-A: Install all libraries

Run all installs in one pass — never revisit this:

```bash
# UI
npx shadcn@latest init
npx shadcn@latest add sidebar drawer skeleton sonner command button input checkbox select calendar popover dialog collapsible

# Calendar
npm install @fullcalendar/react @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/daygrid

# Block editor
npm install @blocknote/react @blocknote/mantine @blocknote/xl-ai

# Folder tree
npm install react-arborist

# AI
npm install assistant-ui ai @ai-sdk/anthropic @ai-sdk/react

# State
npm install zustand

# Google Calendar
npm install googleapis

# Forms
npm install react-hook-form zod @hookform/resolvers

# Date utilities
npm install date-fns
```

---

### Ticket 4-B: `src/lib/aiConstants.ts` — AI constants and tone prompt

This file is written now and imported by every AI route later. No AI route ever inlines a system prompt.

```typescript
export const TONE_SYSTEM_PROMPT = `
You are a supportive, forward-focused personal assistant integrated into a productivity tool.

REQUIRED TONE:
- Always use encouraging, present-tense, forward-looking language
- Focus on what is possible and what comes next
- Celebrate progress, however small

PROHIBITED WORDS AND PHRASES (never use in any response):
- overdue, late, missed, behind, failed, incomplete
- "you should", "you need to", "you must", "you haven't"
- Any language implying the user is falling behind or doing something wrong

When discussing tasks or schedule, speak in terms of opportunity and choice, not obligation.
`

export const AI_MODELS = {
  chat: 'claude-3-5-sonnet-20241022',
  writing: 'claude-3-5-sonnet-20241022',
  suggestions: 'claude-3-haiku-20240307',
  journal: 'claude-3-haiku-20240307',
} as const

export const BLOCK_SIZE_DURATIONS: Record<'S' | 'M' | 'L', string> = {
  S: '00:30',  // 30 minutes
  M: '01:00',  // 60 minutes
  L: '01:30',  // 90 minutes
}
```

---

### Ticket 4-C: Shared hooks

**`src/hooks/useAutosave.ts`**
```typescript
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

**`src/hooks/useMediaQuery.ts`**
```typescript
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])
  return matches
}
```

**`src/hooks/useCurrentUser.ts`** — wraps Supabase session, returns `user` and `userId` with correct types.

**`src/hooks/useCommandDialog.ts`** — global `⌘K` / `Ctrl+K` handler that opens the command dialog.

---

### Ticket 4-D: Zustand stores

**`src/stores/useTaskStore.ts`**
```typescript
interface TaskStore {
  selectedTaskId: string | null
  dragState: { taskId: string; fromPriority: string } | null
  setSelectedTask: (id: string | null) => void
  setDragState: (state: TaskStore['dragState']) => void
}
```

**`src/stores/useUIStore.ts`**
```typescript
interface UIStore {
  commandOpen: boolean
  chatPanelOpen: boolean
  activePageId: string | null
  setCommandOpen: (open: boolean) => void
  setChatPanelOpen: (open: boolean) => void
  setActivePage: (id: string | null) => void
}
```

---

### Ticket 4-E: TanStack Query client setup

```typescript
// src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: true,
      staleTime: 1000 * 60,     // 1 minute
    },
    mutations: {
      onError: (error) => toast.error('Something went wrong. Try again.'),
    },
  },
})
```

---

### Ticket 4-F: App shell layout

Build `src/components/layout/AppLayout.tsx` using shadcn `SidebarProvider` + `Sidebar`:

- Left panel: collapsible sidebar with folder/page tree area (placeholder `<div>` with label "Folder Tree — Session 6")
- Main content area: `<Outlet />` from TanStack Router
- Top bar: user avatar, `⌘K` search trigger button, AI chat toggle button, notifications bell
- Right panel: AI chat panel (placeholder — Session 9)
- Mobile: sidebar collapses; bottom nav bar with icons for: Tasks, Calendar, Pages, Journal
- Dark mode: shadcn `ThemeProvider` with `localStorage` persistence

The sidebar placeholder sections are intentional — the actual trees get wired in their respective page sessions, but the layout frame is complete and never touched again.

---

### Ticket 4-G: All route stubs

Create every route file now as a stub — a page that renders a title and "Coming soon" so routing works from day one. This means the sidebar can link to every page immediately.

```
src/routes/
  _authenticated/
    dashboard.tsx         → stub
    tasks.tsx             → stub
    calendar.tsx          → stub
    pages/
      index.tsx           → stub
      $pageId.tsx         → stub
    journal/
      index.tsx           → stub
    tables/
      index.tsx           → stub
      $tableId/
        index.tsx         → stub
        settings.tsx      → stub
        rows/
          $rowId.tsx      → stub
    search.tsx            → stub
    settings.tsx          → stub
    admin/
      invite.tsx          → stub
```

Each stub exports a route with its title. The sidebar links to all of them. Navigation works in full before any real content is built.

---

### Ticket 4-H: Shared UI primitives

**`src/components/shared/EmptyState.tsx`**
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

**`src/components/shared/ErrorBoundary.tsx`** — wraps major views, catches thrown errors from TanStack Query.

**`src/components/shared/LoadingScreen.tsx`** — full-screen skeleton for initial app load.

Add `<Toaster />` from Sonner to root layout here — once, never again.

**Template save:** Extract app shell layout to `C:\dev\coding_templates\components\app-shell.tsx`. Extract autosave hook to `C:\dev\coding_templates\components\autosave-hook.ts`.

---

## Session 5 — Tasks Page (Complete)

**Goal:** The Tasks page is 100% complete. Priority buckets, task pills, completed today sections, inline create, reorder, complete with undo, archiving, and all Sonner toasts. A user can fully manage their tasks after this session. This page is never touched again.

**Acceptance criteria:** Tasks create, reorder within bucket, move between buckets, complete with undo toast, archive. "Completed Today" section collapses. Data persists after refresh. All `data-` attributes present on TaskPill (required for Session 6 calendar drag). Zero console errors.

---

### Ticket 5-A: TaskPill component

```tsx
// src/components/tasks/TaskPill.tsx
// IMPORTANT: data-* attributes are required here even though drag is wired in Session 6.
// Do not remove them — FullCalendar Draggable reads these attributes directly from the DOM.

<div
  className="task-pill ..."
  data-task-id={task.id}
  data-title={task.title}
  data-block-size={task.block_size}
  data-priority={task.priority}
>
  <button onClick={() => completeTask(task.id)}>○</button>
  <span>{task.title}</span>
  <Badge>{task.block_size}</Badge>
  <DropdownMenu>{/* edit, delete, move */}</DropdownMenu>
</div>
```

Block size badge: S / M / L as a small visual tag. Tooltip on hover: "Visual size only — not a time estimate." Never evaluate the meaning of the size to the user.

---

### Ticket 5-B: PriorityBucket component

```tsx
// src/components/tasks/PriorityBucket.tsx
// bucketRef is attached here. Draggable initialization happens in Session 6 without
// changing this component — the ref and data attributes are already in place.

const bucketRef = useRef<HTMLDivElement>(null)

<div ref={bucketRef}>
  <h2>{label}</h2>            {/* "Urgent" | "Important" | "Someday" */}
  {tasks.map(task => <TaskPill key={task.id} task={task} />)}
  <InlineCreateInput onSave={createTask} />
  <CompletedTodaySection tasks={completedTasks} />
</div>
```

---

### Ticket 5-C: InlineCreateInput component

```tsx
// src/components/tasks/InlineCreateInput.tsx
// Click "+" or press Enter on last task → input appears → blur/Enter saves → input disappears
```

---

### Ticket 5-D: CompletedTodaySection component

```tsx
// src/components/tasks/CompletedTodaySection.tsx
// shadcn Collapsible wrapping completed tasks for the bucket
// Auto-archive logic: on mount, call useArchiveCompletedBefore() for tasks completed before today
```

---

### Ticket 5-E: Tasks page assembly

`src/routes/_authenticated/tasks.tsx` — replaces stub:
- Three `PriorityBucket` components (Urgent, Important, Someday)
- Skeleton loading state while `useTasksByPriority()` loads
- EmptyState if no tasks in any bucket
- All Sonner toasts: create, complete (with undo), delete (with undo), move, archive

---

## Session 6 — Calendar Page (Complete)

**Goal:** The Calendar page is 100% complete. Three-day view, zone labels, drag from task bucket, create blocks on calendar, move/resize, Google Calendar sync, all toasts. This page is never touched again.

**Acceptance criteria:** Calendar renders 3-day default view. Zone labels visible. Tasks drag from bucket onto calendar and create blocks. Move and resize save. Google events appear. All error states handled with `info.revert()` on failed mutations.

---

### Ticket 6-A: CalendarView base

```tsx
// src/components/calendar/CalendarView.tsx
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'

const isTouchDevice = useMediaQuery('(pointer: coarse)')

<FullCalendar
  plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
  initialView={isTouchDevice ? 'timeGridDay' : 'timeGridThreeDay'}
  views={{
    timeGridThreeDay: { type: 'timeGrid', duration: { days: 3 }, buttonText: '3 day' },
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
  slotLaneContent={renderZoneLabel}
  eventDrop={handleEventDrop}
  eventResize={handleEventResize}
  eventReceive={handleEventReceive}
  select={handleSelect}
/>
```

---

### Ticket 6-B: Morning/Afternoon/Evening zone labels

```typescript
function renderZoneLabel(arg: SlotLaneContentArg) {
  const hours = arg.time.milliseconds / 3600000
  if (hours === 6)  return <div className="zone-label">MORNING</div>
  if (hours === 12) return <div className="zone-label">AFTERNOON</div>
  if (hours === 18) return <div className="zone-label">EVENING</div>
  return null
}
```

Add CSS: `.zone-label` — small muted uppercase text. Add very low-opacity background tint on slot rows within each zone range. Not a strong color block — a barely visible guide.

---

### Ticket 6-C: Wire FullCalendar Draggable to task bucket

**Do NOT use dnd-kit or react-dnd. Use FullCalendar's own `Draggable` class exclusively.**

```typescript
// In PriorityBucket.tsx — add useEffect that initializes Draggable:
import { Draggable } from '@fullcalendar/interaction'

useEffect(() => {
  const bucketEl = bucketRef.current
  if (!bucketEl) return
  const draggable = new Draggable(bucketEl, {
    itemSelector: '.task-pill',
    eventData: (el: HTMLElement) => ({
      id: el.dataset.taskId,
      title: el.dataset.title,
      duration: BLOCK_SIZE_DURATIONS[el.dataset.blockSize as 'S' | 'M' | 'L'],
    }),
  })
  return () => draggable.destroy()
}, [])
```

```typescript
// In CalendarView.tsx:
const handleEventReceive = async (info: EventReceiveArg) => {
  try {
    await createCalendarBlock({
      task_id: info.event.id,
      title: info.event.title,
      start_time: info.event.start!.toISOString(),
      end_time: info.event.end!.toISOString(),
      block_type: 'task',
    })
    toast.success('Block added to calendar')
  } catch {
    info.revert()
    toast.error('Could not add block. Try again.')
  }
}
```

---

### Ticket 6-D: Move, resize, and direct create

```typescript
const handleEventDrop = async (info: EventDropArg) => {
  try {
    await updateCalendarBlock({ id: info.event.id, start_time: ..., end_time: ... })
  } catch {
    info.revert()
    toast.error('Could not move block. Try again.')
  }
}

const handleEventResize = async (info: EventResizeDoneArg) => {
  try {
    await updateCalendarBlock({ id: info.event.id, end_time: ... })
  } catch {
    info.revert()
    toast.error('Could not resize block. Try again.')
  }
}

// Select an empty time range → open Dialog with title input + block type selector
const handleSelect = (info: DateSelectArg) => {
  setCreateDialogState({ start: info.start, end: info.end, open: true })
}
```

---

### Ticket 6-E: Google Calendar sync server function

```typescript
// src/server/googleCalendar.ts
import { google } from 'googleapis'
import { createServerFn } from '@tanstack/start'
import { TONE_SYSTEM_PROMPT } from '../lib/aiConstants'  // not used here, but pattern check

export const syncGoogleCalendar = createServerFn('GET', async (_, ctx) => {
  const profile = await getProfile(ctx.user.id)
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({ refresh_token: profile.google_refresh_token })

  // Always refresh proactively — never rely on expiry detection
  const { credentials } = await oauth2Client.refreshAccessToken()
  await updateGoogleTokens(ctx.user.id, credentials)

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  // Fetch and upsert events to calendar_blocks
  // Mark is_synced: true on synced events
  // Show Google logo badge on synced FullCalendar events
})
```

---

### Ticket 6-F: Calendar page assembly

`src/routes/_authenticated/calendar.tsx` — replaces stub:
- `CalendarView` component with full wiring
- Sidebar mini: PriorityBucket as a compact vertical strip (tasks draggable to calendar)
- Skeleton while calendar data loads
- All Sonner toasts: block create, move, resize, delete (with undo)

**Template save:** Extract `googleCalendar.ts` to `C:\dev\coding_templates\google-calendar\calendar-server-fn.ts`

---

## Session 7 — Pages & Folder Tree (Complete)

**Goal:** The Pages section is 100% complete. Folder tree with drag reorder and inline rename, BlockNote editor with autosave, page title editing, and the `/link` command placeholder. This session is never revisited.

**Acceptance criteria:** Folder tree renders. Drag reorder and inline rename work. Pages autosave. Title editable inline. Saving indicator shows. "Saving..." disappears after save completes.

---

### Ticket 7-A: FolderNode renderer

```tsx
// src/components/pages/FolderNode.tsx (~30 lines)
// Custom react-arborist row renderer:
// - Folder icon (open/closed state) or page icon
// - Title text (editable on double-click — react-arborist handles this)
// - "..." context menu: rename, move, delete, new page here
```

---

### Ticket 7-B: FolderTree component

```tsx
// src/components/pages/FolderTree.tsx
import { Tree } from 'react-arborist'

<Tree
  data={folderData}
  onCreate={handleCreate}    // calls useCreateFolder() or useCreatePage()
  onRename={handleRename}    // calls useRenameFolder() or useUpdatePage()
  onMove={handleMove}        // calls useMoveFolder() — updates parent_id + position
  onDelete={handleDelete}    // calls useDeleteFolder() or useDeletePage()
  renderRow={FolderNode}
/>
```

react-arborist provides out of the box: drag-drop reorder, inline rename (double-click), keyboard nav (arrows, Enter, Escape, Delete), virtualization, multi-select. Only the renderer and Supabase wiring are custom.

Wire `FolderTree` into `AppLayout.tsx` sidebar — replaces the placeholder from Session 4.

---

### Ticket 7-C: BlockNote page editor

```typescript
// src/components/pages/PageEditor.tsx
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'

function PageEditor({ page }: { page: Page }) {
  const editor = useCreateBlockNote({
    initialContent: page.content ?? undefined,
  })

  const { saving } = useAutosave(() => {
    updatePage({ id: page.id, content: editor.document })
  }, [editor.document], 800)

  return (
    <>
      <div className="top-bar">{saving && <span>Saving...</span>}</div>
      <BlockNoteView editor={editor} />
    </>
  )
}
```

BlockNote provides zero-config: slash command menu, formatting toolbar, drag-drop blocks, heading/list/code/table/image types.

---

### Ticket 7-D: Page view assembly

`src/routes/_authenticated/pages/$pageId.tsx` — replaces stub:
- Inline editable `<h1>` for page title (same autosave pattern)
- `PageEditor` component
- Breadcrumb: folder path → page title
- Top bar: saving indicator, is_pinned toggle, delete button
- Skeleton while page data loads

---

### Ticket 7-E: Pages index

`src/routes/_authenticated/pages/index.tsx` — replaces stub:
- EmptyState when no pages exist: "Start a page — add it to a folder or leave it loose."
- Recent pages grid otherwise

---

## Session 8 — Journal Page (Complete)

**Goal:** The Journal section is 100% complete. Auto-date creation, correct title formatting, same BlockNote editor as pages. Unit tests written and passing. This page is never revisited.

**Acceptance criteria:** Visiting `/journal` auto-creates today's entry if none exists. Title formats correctly for same-day, same-month, and cross-month ranges. Vitest tests pass.

---

### Ticket 8-A: Journal title logic and unit tests

```typescript
// src/lib/journalUtils.ts
import { format, isSameDay, isSameMonth } from 'date-fns'

export function getJournalTitle(createdAt: Date, updatedAt: Date): string {
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

```typescript
// src/lib/__tests__/journalUtils.test.ts
describe('getJournalTitle', () => {
  it('same day', ...)
  it('same month different days', ...)
  it('cross month', ...)
  it('cross year', ...)
})
```

---

### Ticket 8-B: Journal page assembly

`src/routes/_authenticated/journal/index.tsx` — replaces stub:
- On mount: call `useJournalPage(today)` — if null, call `useCreateJournalPage()`
- Same `PageEditor` component as pages
- Left sidebar list: all journal pages sorted by date descending
- No generic empty state for new journal entries — the AI prompt (Session 9) fills this role
- Skeleton while loading

---

## Session 9 — AI Features (Complete)

**Goal:** All AI features are built in one session against the already-written `aiConstants.ts`. AI chat sidebar, BlockNote AI writing, scheduling suggestions, journal prompts, and usage tracking. This session is never revisited.

**Acceptance criteria:** AI chat streams responses. BlockNote AI toolbar button appears and works. Scheduling suggestion cards render. Journal prompts appear on new empty entries. Usage tracked in `ai_usage` table.

---

### Ticket 9-A: AI server functions

All server functions in `src/server/` — all import from `aiConstants.ts`:

```typescript
// src/server/aiChat.ts
export const aiChatFn = createServerFn('POST', async (input: { messages: Message[] }) => {
  const result = await streamText({
    model: anthropic(AI_MODELS.chat),
    system: TONE_SYSTEM_PROMPT,
    messages: input.messages,
  })
  return result.toDataStreamResponse()
})

// src/server/aiWriting.ts  — same pattern, AI_MODELS.writing
// src/server/schedulingSuggestions.ts  — AI_MODELS.suggestions, returns JSON array
// src/server/journalPrompt.ts  — AI_MODELS.journal, returns single prompt string
```

---

### Ticket 9-B: `src/hooks/useAIContext.ts`

Builds a context string from current route/data for every AI message. Context includes: current page title + excerpt, current tasks (urgent + important), today's date, user's tone preference.

---

### Ticket 9-C: AI chat panel

```tsx
// src/components/ai/AIChatPanel.tsx
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

`assistant-ui` provides: streaming render, auto-scroll, markdown, loading indicators, WAI-ARIA.

Wire into `AppLayout.tsx` right panel — replaces the placeholder from Session 4. Toggle from top bar icon. On mobile: full-screen bottom sheet.

---

### Ticket 9-D: BlockNote AI writing

```typescript
// In PageEditor.tsx — add xl-ai extension:
import { createAIExtension } from '@blocknote/xl-ai'

const editor = useCreateBlockNote({
  initialContent: page.content ?? undefined,
  extensions: [
    createAIExtension({
      model: anthropic(AI_MODELS.writing),
      systemPrompt: TONE_SYSTEM_PROMPT,
    }),
  ],
})
```

`@blocknote/xl-ai` automatically adds: AI toolbar button, `/ai` slash command, streaming responses, continue/summarize/rewrite/brainstorm actions. No additional UI code needed.

---

### Ticket 9-E: Scheduling suggestions

Display as non-blocking cards above the task bucket in the calendar view. Each card:
- Text: "Consider scheduling: [task title] — [reason]"
- "Schedule it" → creates calendar block
- "Not now" → hides card for 24 hours (localStorage)

Fetch on calendar page mount using `useQuery` with `useSchedulingSuggestions()`. Uses `claude-3-haiku` for cost efficiency.

---

### Ticket 9-F: Journal AI prompts

On new/empty journal page open: fetch a prompt from `src/server/journalPrompt.ts`. Display in a subtle banner above editor:
- "Start writing" button: focuses editor body
- "Dismiss" button: hides banner

Input: day of week, last 3 completed tasks, user's `tone_preference` from `profiles`.

---

### Ticket 9-G: AI usage tracking wired everywhere

`useLogAIUsage()` called after every AI response in: chat, writing, scheduling, journal prompt. Tracks `feature` and `tokens_used`.

**Template save:** Extract `streamText` server function to `C:\dev\coding_templates\ai\stream-route.ts`. Extract `aiConstants.ts` to `C:\dev\coding_templates\ai\tone-prompt.ts`.

---

## Session 10 — Tables (Complete)

**Goal:** The Tables section is 100% complete. Schema builder, inline cell editing for all column types, row detail page with BlockNote notes. This session is never revisited.

**Acceptance criteria:** Tables create with custom columns. All 6 cell types edit inline and save. New row adds at bottom. Row detail opens and saves notes.

---

### Ticket 10-A: Table schema builder

`src/routes/_authenticated/tables/$tableId/settings.tsx` — replaces stub:
- Add, rename, reorder, delete columns
- Column type selector: text, checkbox, select, date, number, url
- `select` type: manage option list inline
- Saves to `tables_schema.columns` JSONB

---

### Ticket 10-B: Cell renderers

```typescript
// src/components/tables/cells/
TextCell.tsx        // <Input> on click, saves on blur
CheckboxCell.tsx    // shadcn <Checkbox>, saves immediately on toggle
SelectCell.tsx      // shadcn <Select> with options from column config
DateCell.tsx        // shadcn <Calendar> in <Popover>, saves on date select
NumberCell.tsx      // <Input type="number">, saves on blur
UrlCell.tsx         // <a> in view mode, <Input> on edit (pencil icon trigger)
```

---

### Ticket 10-C: Table view

`src/routes/_authenticated/tables/$tableId/index.tsx` — replaces stub:
- TanStack Table headless core + shadcn Data Table shell
- Dynamic column definitions built from `tables_schema.columns` JSONB
- Sort, filter, column visibility via TanStack Table built-ins
- "+ Add row" button at bottom → inserts empty row, focuses first cell

---

### Ticket 10-D: Row detail page

`src/routes/_authenticated/tables/$tableId/rows/$rowId.tsx` — replaces stub:
- All fields in vertical form layout, same renderers as table cells
- BlockNote editor for row notes (same autosave pattern as pages)
- "← Back to table" breadcrumb

---

### Ticket 10-E: Tables index

`src/routes/_authenticated/tables/index.tsx` — replaces stub:
- Grid of table cards
- "New table" button → creates table schema, navigates to settings

---

## Session 11 — Global Search & Linking (Complete)

**Goal:** `⌘K` search and inline BlockNote linking are fully functional. Backlinks panel shows on all pages. This session is never revisited.

**Acceptance criteria:** `⌘K` opens, searches all content types, navigates on Enter. `/link` in BlockNote opens link picker. LinkChip renders inline in editor. Backlinks panel populates.

---

### Ticket 11-A: CommandDialog (⌘K)

`useCommandDialog.ts` hook already wires the keyboard shortcut from Session 4. Build the dialog:

```tsx
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Search pages, tasks, folders, tables..." />
  <CommandList>
    <CommandGroup heading="Pages">
      {pageResults.map(p =>
        <CommandItem key={p.id} onSelect={() => navigate(`/pages/${p.id}`)}>
          📄 {p.title}
        </CommandItem>
      )}
    </CommandGroup>
    <CommandGroup heading="Tasks">{/* ... */}</CommandGroup>
    <CommandGroup heading="Folders">{/* ... */}</CommandGroup>
    <CommandGroup heading="Table Rows">{/* ... */}</CommandGroup>
  </CommandList>
</CommandDialog>
```

Search: Supabase `ilike` on title/content for each group. Keyboard nav and Enter-to-navigate are built into shadcn Command.

---

### Ticket 11-B: LinkChip custom BlockNote inline content type

```typescript
// src/components/pages/LinkChip.tsx
// Register a custom inline content type in BlockNote
// Displays as: [📄 Page Title] or [✓ Task Title] inline in editor
// On insert: also writes to links table (source_id → target_id)
```

Register `/link` as a custom slash command that opens `CommandDialog` in link-picker mode. On item selection, insert the `LinkChip`. This works because `PageEditor` is already built in Session 7 — only the extension registration changes.

---

### Ticket 11-C: Backlinks panel

In `PageView` (`$pageId.tsx`): below the editor, add a "Linked from" collapsible section. Calls `useBacklinks(page.id)`. Displays as a list of linked item titles that navigate on click.

---

## Session 12 — Settings & Admin Pages (Complete)

**Goal:** Settings page and admin invite page are fully functional. Google Calendar connection status is accurate. This session is never revisited.

**Acceptance criteria:** Settings saves profile changes. Dark mode toggle works. Google Calendar connect/disconnect updates `profiles`. Admin can generate invite links. Non-admins cannot access admin page.

---

### Ticket 12-A: Settings page

`src/routes/_authenticated/settings.tsx` — replaces stub:
- **Profile section:** display name input, avatar URL input, save button
- **Appearance section:** dark/light mode toggle (persists to localStorage via ThemeProvider)
- **AI Preferences section:** tone preference select (`encouraging`, `calm`, `direct`)
- **Google Calendar section:** shows connection status, disconnect button (calls `useDisconnectGoogle()`), connect button (calls `signInWithOAuth` with calendar scope)
- **Usage section:** "AI calls this month: [n]" from `useAIUsageThisMonth()` — informational only, never as a warning

---

### Ticket 12-B: Admin invite page

`src/routes/_authenticated/admin/invite.tsx` — replaces stub:
- Access check: if `user.email !== ADMIN_EMAIL` → render AccessDenied component
- Form: email input + "Generate invite" button
- Calls `supabase.auth.admin.generateLink({ type: 'invite', email })`
- Shows generated invite link for copying
- Table of past invites from `invites` table (email, date sent, used status)

---

## Session 13 — Polish, Mobile & Testing (Complete)

**Goal:** The app is production-ready. Every view has loading skeletons, error handling, empty states, and correct mobile layout. All Vitest tests pass.

**Acceptance criteria:** All views show skeletons during load. Toasts appear on all user actions. All views work correctly at 375px. All Vitest tests pass with no failures. Zero console errors across all pages.

---

### Ticket 13-A: Audit all loading states

Visit every route. Every view that fetches data must show shadcn `<Skeleton>` while loading. Add skeletons anywhere missing.

---

### Ticket 13-B: Audit all error states

Every `ErrorBoundary` must display a useful fallback with a retry button. All Supabase calls already use `.throwOnError()` — errors bubble correctly. Verify `toast.error()` appears on every mutation failure.

---

### Ticket 13-C: Audit all empty states

Every list view must show an `EmptyState` component when the list is empty. Verify all copy follows tone rules — no language implying the user is behind or failed.

---

### Ticket 13-D: Mobile audit (375px viewport)

| View | Required Mobile Behavior |
|---|---|
| Sidebar | Hidden; accessible via hamburger icon |
| Folder tree | Opens as shadcn `Drawer` (bottom sheet) via nav button |
| Task bucket | Renders as shadcn `Drawer` triggered by floating `+` button |
| Calendar | `initialView` = `timeGridDay` when `useMediaQuery('(pointer: coarse)')` |
| AI Chat | Full-screen `Sheet` (bottom) |
| All tap targets | Minimum 44×44px |

---

### Ticket 13-E: Vitest unit tests

```typescript
// All tests must pass before this session is marked complete:

// src/lib/__tests__/journalUtils.test.ts
getJournalTitle() — same day, same month, cross-month, cross-year

// src/lib/__tests__/aiContext.test.ts
buildAIContext() — page route, task route, calendar route, journal route

// src/lib/__tests__/blockSize.test.ts
BLOCK_SIZE_DURATIONS — S='00:30', M='01:00', L='01:30'

// src/lib/__tests__/scheduling.test.ts
buildSchedulingPayload() — correct serialization of tasks + blocks
```

---

### Ticket 13-F: Final template saves audit

Review `C:\dev\coding_templates\` — confirm all required templates were saved across sessions:

```
supabase/
  typed-client.ts          ✓ Session 2
  auth-context.tsx          ✓ Session 2
  rls-policy-template.sql   ✓ Session 1
  gen-types.sh              ✓ Session 1
  profiles-trigger.sql      ✓ Session 1
  invite-pattern.ts         ✓ Session 2
  google-token-storage.ts   ✓ Session 2

tanstack/
  query-hook.ts             ✓ Session 3
  optimistic-update.ts      ✓ Session 3
  server-function.ts        ✓ Session 4

ai/
  stream-route.ts           ✓ Session 9
  tone-prompt.ts            ✓ Session 4
  use-ai-context.ts         ✓ Session 9

components/
  app-shell.tsx             ✓ Session 4
  autosave-hook.ts          ✓ Session 4
  empty-state.tsx           ✓ Session 4
  inline-create-input.tsx   ✓ Session 5

google-calendar/
  calendar-server-fn.ts     ✓ Session 6
  token-refresh.ts          ✓ Session 6

env/
  .env.example              ✓ Session 0
```

---

## Deployment

**Vercel setup:**
- Connect GitHub repo to Vercel
- TanStack Start with Nitro adapter deploys automatically — no custom `vercel.json` needed
- Add all `.env.local` variables to Vercel Environment Variables dashboard
- Supabase: set `VITE_APP_URL` to Vercel production URL in Auth → URL Configuration

No separate serverless functions folder. No separate API deployment. All handled by TanStack Start + Nitro + Vercel.

---

## Session Summary

| Session | What Gets Built | Touchable After? |
|---|---|---|
| Pre | Cleanup, archive, templates extracted | — |
| 0 | Repo, tooling, env, CLAUDE.md, memory bank | Never |
| 1 | Full database schema, types, RLS | Never (unless schema changes) |
| 2 | Auth, Google OAuth, invite gate, protected routes | Never |
| 3 | All queries and mutations for all tables | Never |
| 4 | Libraries, constants, shared hooks, app shell, all route stubs | Never |
| 5 | Tasks page — 100% complete | Never |
| 6 | Calendar page — 100% complete | Never |
| 7 | Pages + folder tree — 100% complete | Never |
| 8 | Journal page — 100% complete | Never |
| 9 | All AI features — 100% complete | Never |
| 10 | Tables — 100% complete | Never |
| 11 | Global search + linking — 100% complete | Never |
| 12 | Settings + admin — 100% complete | Never |
| 13 | Polish, mobile, testing | Never |

**Total: 14 sessions (including pre-session cleanup). No session revisits any file built in a previous session except to wire in a previously-planned placeholder.**

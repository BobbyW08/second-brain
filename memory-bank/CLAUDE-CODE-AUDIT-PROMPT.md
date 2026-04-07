# Second Brain — Codebase Audit & Adapted Plan
## Instructions for Claude Code

You are auditing the existing `C:\dev\second_brain` codebase against the V4 build plan. Your job is to read the actual files on disk, compare them against the checklist below, and produce two outputs:

1. **A status report** — every item marked ✅ DONE, ⚠️ PARTIAL, or ❌ NOT DONE, with brief notes on what exists vs what's missing.
2. **An adapted session plan** — the remaining work only, reorganized into sessions using the same "never revisit a file" philosophy. Sessions that are 100% complete are removed. Sessions that are partial are trimmed to only what's missing.

**Do not delete or move any existing code.** Do not rewrite anything that is already working. This is an audit only — no code changes.

---

## Step 1 — Read the project structure

Run the following and output the full tree:

```bash
find C:/dev/second_brain -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/.tanstack/*" \
  | sort
```

Then read `package.json` and output:
- Project name
- All dependencies (name + version)
- All devDependencies (name + version)
- The `scripts` block

---

## Step 2 — Audit each session against what exists on disk

For each item below, check whether the file exists AND contains the described functionality. "File exists" is not enough — read the file and confirm the key exports/logic are present.

---

### SESSION 0 AUDIT — Repo, Tooling & Environment

**Check each item:**

- [ ] **0-A: Repo initialized** — Does `package.json` have `"name": "second-brain"`? Is there a `.git` folder? Run `npm install` and confirm no errors.
- [ ] **0-B: `.env.local` exists** — Does `C:\dev\second_brain\.env.local` exist? Does it contain `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `VITE_APP_URL`, `ADMIN_EMAIL`?
- [ ] **0-C: `CLAUDE.md` exists** — Does `C:\dev\second_brain\CLAUDE.md` exist? Does it contain the Hard Rules section with all 9 rules?
- [ ] **0-D: Memory bank exists** — Does `C:\dev\second_brain\memory-bank\` exist? Does it contain `projectbrief.md`, `techContext.md`, `activeContext.md`, `progress.md`, `decisionLog.md`?

---

### SESSION 1 AUDIT — Database Schema, Types & RLS

**Check each item:**

- [ ] **1-A: All tables exist in Supabase** — Read `src/types/database.types.ts`. Does it contain type definitions for ALL of these tables: `profiles`, `folders`, `pages`, `tasks`, `calendar_blocks`, `tables_schema`, `table_rows`, `links`, `invites`, `ai_usage`?
- [ ] **1-B: RLS policies** — Look for any migration files, SQL files, or Supabase migration folder. Do RLS policies exist for all tables? Check for files matching `*migration*`, `*rls*`, `*schema*`, `*.sql` anywhere in the project.
- [ ] **1-C: Profiles trigger** — Look for SQL that creates `handle_new_user()` trigger. Check migration files and any SQL files.
- [ ] **1-D: `database.types.ts` generated and committed** — Does `src/types/database.types.ts` exist? Is it auto-generated (look for the `@supabase/supabase-js` generated header comment)?

---

### SESSION 2 AUDIT — Auth, Google OAuth & Invite Gate

**Check each item:**

- [ ] **2-A: Google OAuth configured** — Look for `signInWithOAuth` calls. Does any file contain `scopes: 'https://www.googleapis.com/auth/calendar'` and `access_type: 'offline'` and `prompt: 'consent'`?
- [ ] **2-B: Invite gate (`shouldCreateUser: false`)** — Search all files for `shouldCreateUser`. Is it set to `false` on any auth calls?
- [ ] **2-C: `provider_refresh_token` capture** — Search for `provider_refresh_token`. Is it being read from the session and written to the `profiles` table in an auth callback?
- [ ] **2-D: Protected routes via `beforeLoad`** — Look for route files using `beforeLoad`. Does the pattern `if (!context.user) throw redirect` exist?

---

### SESSION 3 AUDIT — Complete Data Layer

For each query file, check: does the file exist AND does it export the listed functions?

**`src/queries/profiles.ts`**
- [ ] `useProfile()`
- [ ] `useUpdateProfile()`
- [ ] `useUpdateGoogleTokens()`
- [ ] `useDisconnectGoogle()`

**`src/queries/tasks.ts`**
- [ ] `useTasksByPriority()`
- [ ] `useTask(taskId)`
- [ ] `useCreateTask()`
- [ ] `useUpdateTask()`
- [ ] `useMoveTask()`
- [ ] `useReorderTasks()`
- [ ] `useCompleteTask()` — with optimistic update
- [ ] `useUndoCompleteTask()`
- [ ] `useArchiveTask()`
- [ ] `useArchiveCompletedBefore()`

**`src/queries/calendarBlocks.ts`**
- [ ] `useCalendarBlocks(dateRange)`
- [ ] `useCreateCalendarBlock()`
- [ ] `useUpdateCalendarBlock()`
- [ ] `useDeleteCalendarBlock()`
- [ ] `useUndoDeleteCalendarBlock()`
- [ ] `useSyncGoogleEvents()`

**`src/queries/folders.ts`**
- [ ] `useFolderTree()`
- [ ] `useCreateFolder()`
- [ ] `useRenameFolder()`
- [ ] `useMoveFolder()`
- [ ] `useDeleteFolder()`

**`src/queries/pages.ts`**
- [ ] `usePages(folderId?)`
- [ ] `usePage(pageId)`
- [ ] `useCreatePage()`
- [ ] `useUpdatePage()`
- [ ] `useDeletePage()`
- [ ] `useJournalPage(date)`
- [ ] `useCreateJournalPage()`

**`src/queries/tables.ts`**
- [ ] `useTables()`
- [ ] `useTable(tableId)`
- [ ] `useCreateTable()`
- [ ] `useUpdateTableSchema()`
- [ ] `useDeleteTable()`

**`src/queries/tableRows.ts`**
- [ ] `useTableRows(tableId)`
- [ ] `useTableRow(rowId)`
- [ ] `useCreateTableRow()`
- [ ] `useUpdateTableRow()`
- [ ] `useDeleteTableRow()`
- [ ] `useReorderTableRows()`

**`src/queries/links.ts`**
- [ ] `useBacklinks(targetId)`
- [ ] `useCreateLink()`
- [ ] `useDeleteLink()`

**`src/queries/aiUsage.ts`**
- [ ] `useAIUsageThisMonth()`
- [ ] `useLogAIUsage()`

**Also check:** Do any of the above mutations use optimistic updates? Search for `onMutate` and `cancelQueries` in query files.

**Also check:** Do ALL Supabase calls end with `.throwOnError()`? Search for `.from(` and count how many are missing `.throwOnError()`.

---

### SESSION 4 AUDIT — Shared Infrastructure

**Check each item:**

- [ ] **4-A: All libraries installed** — Check `package.json` dependencies for: `@fullcalendar/react`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`, `@fullcalendar/daygrid`, `@blocknote/react`, `@blocknote/mantine`, `@blocknote/xl-ai`, `react-arborist`, `assistant-ui`, `ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`, `zustand`, `googleapis`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`, `sonner`

- [ ] **4-B: `src/lib/aiConstants.ts`** — Does it exist? Does it export `TONE_SYSTEM_PROMPT`, `AI_MODELS`, and `BLOCK_SIZE_DURATIONS`? Does `TONE_SYSTEM_PROMPT` contain the prohibited words list?

- [ ] **4-C: `src/hooks/useAutosave.ts`** — Exists? Exports `useAutosave`? Has debounce logic with `setSaving`?
- [ ] **4-C: `src/hooks/useMediaQuery.ts`** — Exists? Exports `useMediaQuery`?
- [ ] **4-C: `src/hooks/useCurrentUser.ts`** — Exists? Returns typed `user` and `userId`?
- [ ] **4-C: `src/hooks/useCommandDialog.ts`** — Exists? Handles `⌘K` / `Ctrl+K` keydown?

- [ ] **4-D: `src/stores/useTaskStore.ts`** — Exists? Has `selectedTaskId`, `dragState`, and setters?
- [ ] **4-D: `src/stores/useUIStore.ts`** — Exists? Has `commandOpen`, `chatPanelOpen`, `activePageId`, and setters?

- [ ] **4-E: `src/lib/queryClient.ts`** — Exists? Exports a `QueryClient` with `defaultOptions` including global mutation error handler?

- [ ] **4-F: `AppLayout.tsx`** — Does a layout component exist that uses shadcn `SidebarProvider`? Does it have a top bar, main content area, and sidebar structure? Is `<Toaster />` from Sonner added in the root layout?

- [ ] **4-G: Route stubs** — Do routes exist for ALL of: `/tasks`, `/calendar`, `/pages`, `/pages/$pageId`, `/journal`, `/tables`, `/tables/$tableId`, `/tables/$tableId/settings`, `/tables/$tableId/rows/$rowId`, `/settings`, `/admin/invite`?

- [ ] **4-H: `src/components/shared/EmptyState.tsx`** — Exists?
- [ ] **4-H: `src/components/shared/ErrorBoundary.tsx`** — Exists?
- [ ] **4-H: `src/components/shared/LoadingScreen.tsx`** — Exists?

---

### SESSION 5 AUDIT — Tasks Page

- [ ] **`src/components/tasks/TaskPill.tsx`** — Exists? Has ALL FOUR data attributes: `data-task-id`, `data-title`, `data-block-size`, `data-priority`? Has `className="task-pill"` on the container element?
- [ ] **`src/components/tasks/PriorityBucket.tsx`** — Exists? Has a `ref` on the container element (`bucketRef`)? Renders three priority sections?
- [ ] **`src/components/tasks/InlineCreateInput.tsx`** — Exists? Inline input that appears on click and saves on blur/Enter?
- [ ] **`src/components/tasks/CompletedTodaySection.tsx`** — Exists? Uses shadcn `Collapsible`? Has archive-on-load logic?
- [ ] **Tasks route (`/tasks`)** — Is the stub replaced with real content? Does it render three `PriorityBucket` components?
- [ ] **Sonner toasts on tasks** — Search task components for `toast.success`, `toast.error`. Are create, complete (with undo), delete (with undo) all toasted?

---

### SESSION 6 AUDIT — Calendar Page

- [ ] **`src/components/calendar/CalendarView.tsx`** — Exists? Uses `@fullcalendar/react`? Has `timeGridThreeDay` custom view configured? Has `nowIndicator: true`? Has `allDayText="Anytime"`? Has `slotMinTime="06:00:00"` and `slotMaxTime="22:00:00"`?
- [ ] **Zone labels** — Is `slotLaneContent` prop present on FullCalendar? Is there a function that returns zone labels at hours 6, 12, 18?
- [ ] **FullCalendar Draggable** — Search for `new Draggable(` from `@fullcalendar/interaction`. Is it initialized in PriorityBucket with `itemSelector: '.task-pill'`? Are the `eventData` function data attributes reading `dataset.taskId`, `dataset.title`, `dataset.blockSize`?
- [ ] **`handleEventReceive`** — Does it call `createCalendarBlock` and call `info.revert()` on failure?
- [ ] **`handleEventDrop`** — Does it call `updateCalendarBlock` and call `info.revert()` on failure?
- [ ] **`handleEventResize`** — Does it call `updateCalendarBlock` and call `info.revert()` on failure?
- [ ] **`handleSelect`** — Does it open a Dialog for block creation?
- [ ] **`src/server/googleCalendar.ts`** — Exists? Uses `createServerFn`? Calls `oauth2Client.refreshAccessToken()` proactively on every call?
- [ ] **Calendar route (`/calendar`)** — Stub replaced with real content?

---

### SESSION 7 AUDIT — Pages & Folder Tree

- [ ] **`src/components/pages/FolderNode.tsx`** — Exists? Custom renderer for react-arborist with icon + title + context menu?
- [ ] **`src/components/pages/FolderTree.tsx`** — Exists? Uses `<Tree>` from `react-arborist`? Has `onCreate`, `onRename`, `onMove`, `onDelete` wired to Supabase mutations? Is it wired into `AppLayout.tsx` sidebar (replacing the placeholder)?
- [ ] **`src/components/pages/PageEditor.tsx`** — Exists? Uses `useCreateBlockNote`? Uses `useAutosave` with 800ms delay? Has saving indicator?
- [ ] **Pages route (`/pages/$pageId`)** — Stub replaced? Has inline editable `<h1>` title? Has `PageEditor`?
- [ ] **Pages index (`/pages`)** — Stub replaced? Has EmptyState?

---

### SESSION 8 AUDIT — Journal Page

- [ ] **`src/lib/journalUtils.ts`** — Exists? Exports `getJournalTitle(createdAt, updatedAt)`? Handles same-day, same-month, and cross-month cases?
- [ ] **`src/lib/__tests__/journalUtils.test.ts`** — Exists? Has test cases for same-day, same-month, cross-month?
- [ ] **Journal route (`/journal`)** — Stub replaced? Auto-creates today's entry on mount if none exists? Uses `PageEditor`?

---

### SESSION 9 AUDIT — AI Features

- [ ] **`src/server/aiChat.ts`** — Exists? Uses `createServerFn`? Imports `TONE_SYSTEM_PROMPT` and `AI_MODELS` from `aiConstants.ts`? Uses `streamText`?
- [ ] **`src/server/aiWriting.ts`** — Exists? Same pattern?
- [ ] **`src/server/schedulingSuggestions.ts`** — Exists? Returns `{ taskId, suggestedStart, suggestedEnd, reason }[]`?
- [ ] **`src/server/journalPrompt.ts`** — Exists? Returns a single prompt string?
- [ ] **`src/hooks/useAIContext.ts`** — Exists? Builds a context string from current route data?
- [ ] **`src/components/ai/AIChatPanel.tsx`** — Exists? Uses `assistant-ui` Thread components? Wired into `AppLayout.tsx` (replacing the placeholder)?
- [ ] **BlockNote xl-ai extension** — Is `createAIExtension` used in `PageEditor.tsx`? Does it pass `TONE_SYSTEM_PROMPT`?
- [ ] **Scheduling suggestion cards** — Do they render somewhere in the calendar view? Is there a dismiss/schedule action?
- [ ] **Journal AI prompt banner** — Does it appear in the journal route on new/empty entries?
- [ ] **`useLogAIUsage`** — Is it called after AI responses in chat, writing, scheduling, and journal prompt?

**Critical check:** Search ALL files in `src/server/` for inline system prompts (strings containing "You are" or "assistant"). Any file that contains a system prompt NOT imported from `aiConstants.ts` is a violation of Hard Rule 6.

---

### SESSION 10 AUDIT — Tables

- [ ] **`src/components/tables/cells/`** — Does this directory exist? Do cell components exist for: TextCell, CheckboxCell, SelectCell, DateCell, NumberCell, UrlCell?
- [ ] **`src/routes/_authenticated/tables/$tableId/settings.tsx`** — Stub replaced? Can add/rename/reorder/delete columns?
- [ ] **`src/routes/_authenticated/tables/$tableId/index.tsx`** — Stub replaced? Uses TanStack Table? Renders dynamic columns from schema?
- [ ] **`src/routes/_authenticated/tables/$tableId/rows/$rowId.tsx`** — Stub replaced? Has BlockNote notes editor?
- [ ] **Tables index (`/tables`)** — Stub replaced? Has "New table" button?

---

### SESSION 11 AUDIT — Global Search & Linking

- [ ] **`CommandDialog` component** — Exists somewhere? Searches pages, tasks, folders, table rows via Supabase `ilike`?
- [ ] **`⌘K` / `Ctrl+K` trigger** — Does `useCommandDialog.ts` (or equivalent) open it?
- [ ] **`LinkChip` BlockNote type** — Is a custom inline content type registered anywhere in BlockNote setup?
- [ ] **`/link` slash command** — Is it registered as a custom BlockNote slash command?
- [ ] **Backlinks panel** — Does `$pageId.tsx` show a "Linked from" section calling `useBacklinks()`?

---

### SESSION 12 AUDIT — Settings & Admin

- [ ] **`/settings` route** — Stub replaced? Has Profile, Appearance, AI Preferences, Google Calendar, Usage sections?
- [ ] **`/admin/invite` route** — Stub replaced? Has admin email check? Has invite form calling `admin.generateLink()`?

---

### SESSION 13 AUDIT — Polish, Mobile & Testing

- [ ] **Loading skeletons** — Search for `<Skeleton` across all component files. Are skeletons present in tasks, calendar, pages, journal, tables routes?
- [ ] **ErrorBoundary usage** — Search for `<ErrorBoundary`. Is it wrapping major views?
- [ ] **Mobile layout** — Search for `useMediaQuery` usage in route components. Is the calendar switching to `timeGridDay` on touch? Are Drawer components used for task bucket and folder tree on mobile?
- [ ] **Vitest tests** — Do these test files exist?
  - `src/lib/__tests__/journalUtils.test.ts`
  - `src/lib/__tests__/aiContext.test.ts`
  - `src/lib/__tests__/blockSize.test.ts`
  - `src/lib/__tests__/scheduling.test.ts`
- [ ] **Inline system prompts** — Final check: search ALL source files for strings containing prohibited words (`overdue`, `late`, `missed`, `behind`, `failed`, `incomplete`, `you should`, `you need to`) in JSX, variable names, or comments.

---

## Step 3 — Additional checks outside the session structure

Run these regardless of session status:

**Check for Vite references (Hard Rule 1):**
```bash
grep -r "vite" C:/dev/second_brain/src --include="*.ts" --include="*.tsx" -l
grep -r "from 'vite'" C:/dev/second_brain/src --include="*.ts" --include="*.tsx"
```

**Check for raw Supabase calls in component files (should be zero):**
```bash
grep -r "supabase.from(" C:/dev/second_brain/src/components --include="*.tsx" --include="*.ts"
```
Any result here is a violation — all Supabase calls must be in `src/queries/` or `src/server/`.

**Check for missing `.throwOnError()`:**
```bash
grep -rn "\.from(" C:/dev/second_brain/src/queries --include="*.ts" | grep -v "throwOnError"
```
List every line that calls `.from(` without a visible `.throwOnError()` nearby.

**Check for API folder violations (Hard Rule 1):**
```bash
ls C:/dev/second_brain/api 2>/dev/null && echo "VIOLATION: api/ folder exists" || echo "OK: no api/ folder"
```

**Check for inline system prompts (Hard Rule 6):**
```bash
grep -rn "You are a" C:/dev/second_brain/src/server --include="*.ts"
grep -rn "system:" C:/dev/second_brain/src/server --include="*.ts"
```
Any `system:` value that is not `TONE_SYSTEM_PROMPT` imported from `aiConstants.ts` is a violation.

**Check for dnd-kit or react-dnd (Hard Rule 8):**
```bash
grep -r "dnd-kit\|react-dnd\|@dnd-kit" C:/dev/second_brain/src --include="*.ts" --include="*.tsx"
```

**Check for prohibited tone words in JSX/UI copy:**
```bash
grep -rni "overdue\|\" late\|missed\|behind\|failed\|incomplete\|you should\|you need to" C:/dev/second_brain/src/components --include="*.tsx"
```

---

## Step 4 — Produce the status report

Output a table in this format:

```
SESSION 0 — Repo, Tooling & Environment
  0-A: Repo initialized              ✅ DONE
  0-B: .env.local                    ✅ DONE
  0-C: CLAUDE.md                     ⚠️  PARTIAL — exists but missing Hard Rules 7 and 8
  0-D: Memory bank                   ❌ NOT DONE

SESSION 1 — Database Schema, Types & RLS
  1-A: All tables in Supabase        ✅ DONE — all 10 tables present in database.types.ts
  1-B: RLS policies                  ⚠️  PARTIAL — policies found for profiles, tasks only
  ...
```

For every ⚠️ PARTIAL item, write a one-line note of exactly what is missing.
For every ❌ NOT DONE item, write a one-line note of what needs to be built.
For every ✅ DONE item, no note needed unless there is a Hard Rule violation.

Also output a separate **Violations** section for any Hard Rule violations found in Step 3.

---

## Step 5 — Produce the adapted plan

Based on the status report, output a new session plan that contains ONLY the remaining work.

**Rules for the adapted plan:**

1. Sessions that are 100% ✅ DONE are removed entirely.
2. Sessions that are ⚠️ PARTIAL become a "Gap Session" — list only the missing items, not the full session.
3. Sessions that are ❌ NOT DONE are included in full from the V4 plan.
4. Hard Rule violations become a "Fix Session" that runs before all other remaining sessions. Each violation is a ticket in that session.
5. The session order follows the same dependency logic as V4 — do not reorder sessions unless a dependency is unmet (e.g., if Session 3 queries are incomplete, Session 5 Tasks page cannot be considered done even if it appears to exist).
6. For any ⚠️ PARTIAL session, note which existing files should NOT be touched — only the missing exports/logic need to be added.

**Format the adapted plan exactly like the V4 plan:** each session has a Goal, Acceptance Criteria, and numbered tickets. Each ticket has actionable sub-tasks. No vague tickets.

---

## Step 6 — Update memory bank

After producing the adapted plan, update the memory bank files:

**`memory-bank/activeContext.md`** — Set to the first incomplete session/ticket from the adapted plan.

**`memory-bank/progress.md`** — Full checklist using the adapted plan's sessions and tickets. Mark completed items with ✅.

**`memory-bank/decisionLog.md`** — Add an entry: "Audit performed on [date]. Adapted plan replaces V4. [N] sessions complete, [N] partial, [N] not started."

---

## How to use this document

Paste the entire contents of this file into a Claude Code terminal session in `C:\dev\second_brain`. Claude Code will:

1. Run the bash commands to read the codebase
2. Read every file listed in the checklist
3. Output the status report
4. Output the adapted plan
5. Update the memory bank

Do not ask Claude Code to make any code changes during this session. This is an audit-only session. Code changes begin in the next session using the adapted plan.

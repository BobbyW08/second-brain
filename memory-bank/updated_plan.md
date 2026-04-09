# Second Brain — Codebase Audit & Adapted Plan
## Last Updated: 2026-04-09 (post full-codebase audit + Session 13 partial polish)

---

## STATUS REPORT

### SESSION 0 — Repo, Tooling & Environment
```
0-A: Repo initialized          ✅ DONE
0-B: .env.local                ✅ DONE  (all required vars + GOOGLE_CLIENT_ID/SECRET, VITE_ADMIN_EMAIL)
0-C: CLAUDE.md                 ✅ DONE  (9 rules present)
0-D: Memory bank               ✅ DONE  (all 5 .md files)
```

### SESSION 1 — Database Schema, Types & RLS
```
1-A: All 10 tables             ✅ DONE  (profiles, folders, pages, tasks, calendar_blocks,
                                          tables_schema, table_rows, links, invites, ai_usage)
1-B: RLS policies              ✅ DONE  (4 migration files in supabase/migrations/)
1-C: Profiles trigger          ✅ DONE
1-D: database.types.ts         ✅ DONE
```

### SESSION 2 — Auth, Google OAuth & Invite Gate
```
2-A: Google OAuth scopes       ✅ DONE  (calendar scope, offline, consent in login + settings)
2-B: invite gate               ✅ DONE  — auth.callback.tsx now checks invites table after
                                              OAuth exchange; non-invited Google users are signed
                                              out and redirected to /login; admin email bypasses
2-C: provider_refresh_token    ✅ DONE  (captured in auth.callback.tsx, written to profiles)
2-D: Protected routes          ✅ DONE  (_authenticated.tsx uses requireAuth())
```

### SESSION 3 — Complete Data Layer
```
profiles.ts                    ✅ DONE  (useUpdateGoogleTokens, useDisconnectGoogle added)
tasks.ts                       ✅ DONE  (useTask, useReorderTasks, useUndoCompleteTask,
                                          useArchiveCompletedBefore all present; toasts added)
calendarBlocks.ts              ✅ DONE  (useUndoDeleteCalendarBlock, useSyncGoogleEvents added;
                                          syncGoogleCalendar missing import FIXED)
folders.ts                     ✅ DONE
pages.ts                       ✅ DONE  (usePages, useDeletePage added)
tables.ts                      ✅ DONE
tableRows.ts                   ✅ DONE  (useTableRow, useReorderTableRows added)
links.ts                       ✅ DONE  (schema corrected — no link_text/source_title)
aiUsage.ts                     ✅ DONE  (tokens_used column, date-range query)
Optimistic updates             ✅ DONE
.throwOnError() coverage       ✅ DONE
```

### SESSION 4 — Shared Infrastructure
```
aiConstants.ts                 ✅ DONE  (src/lib/aiConstants.ts — TONE_SYSTEM_PROMPT, AI_MODELS,
                                          BLOCK_SIZE_DURATIONS; root lib/aiConstants.ts deleted)
useMediaQuery.ts               ✅ DONE  (MOBILE_QUERY preset included)
useCurrentUser.ts              ✅ DONE  (returns { user, userId })
useCommandDialog.ts            ✅ DELETED  (was not imported anywhere; had Zustand anti-pattern)
useUIStore.ts                  ✅ DONE  (commandOpen, chatPanelOpen, activePageId + setters)
queryClient.ts                 ✅ DONE  (staleTime in defaultOptions.queries)
EmptyState.tsx                 ✅ DONE
ErrorBoundary.tsx              ✅ DONE  (named export alongside default export)
LoadingScreen.tsx              ✅ DONE  (Loader2 spinner)
/dashboard route               ✅ DONE  (uses CalendarView)
/pages/index route             ✅ DONE  (shows EmptyState)
/tables/index route            ✅ DONE  (lists tables + New Table button)
AppSidebar nav items           ✅ DONE  (Calendar → /calendar, Pages → /pages, Tables → /tables)
```

### SESSION 5 — Tasks Page
```
TaskPill                       ✅ DONE
PriorityBucket                 ✅ DONE  (userId bug fixed; CompletedTodaySection extracted;
                                          Skeleton loading state)
InlineCreateInput              ✅ DONE
CompletedTodaySection          ✅ DONE  (separate Collapsible component, useCompletedTodayTasks)
Toast feedback                 ✅ DONE  (toast.success in useCreateTask, useCompleteTask,
                                          useArchiveTask)
```

### SESSION 6 — Calendar Page
```
CalendarView                   ✅ DONE  (allDayText="Anytime"; Skeleton loading state added;
                                          useMediaQuery imported)
Draggable                      ✅ DONE
handleEventReceive/Drop/Resize ✅ DONE
handleSelect                   ✅ DONE
googleCalendar.ts              ✅ DONE
/calendar route                ✅ DONE  (src/routes/_authenticated/calendar.tsx)
```

### SESSION 7 — Pages & Folder Tree
```
FolderNode                     ✅ DONE
FolderTree                     ✅ DONE  (Skeleton loading state)
PageView/PageEditor            ✅ DONE  (BlockNote, useAutosave 800ms, saving indicator;
                                          link.source_id bug FIXED, link.source_type displayed)
$pageId route                  ✅ DONE
/pages/index route             ✅ DONE
```

### SESSION 8 — Journal Page
```
journalUtils (getJournalTitle) ✅ DONE
journalUtils.test              ✅ DONE  (5 test cases)
Journal routes                 ✅ DONE  (JournalView, JournalLayout, all three routes;
                                          Skeleton loading state added)
```

### SESSION 9 — AI Features
```
server/routes/api/ai-chat.ts   ✅ DONE  (Nitro h3 route; handles /api/ai-chat streaming;
                                          serverDir: 'server' in vite.config.ts)
src/server/aiChat.ts           ✅ DELETED  (unused TanStack Start server fn — Nitro route
                                              handles /api/ai-chat; duplicate removed)
src/server/aiWriting.ts        ✅ DONE  (improveWriting, AI_MODELS.fast)
src/server/schedulingSuggestions.ts ✅ DONE  (getSchedulingSuggestions, generateObject;
                                              { data: {...} } calling convention FIXED)
src/server/journalPrompt.ts    ✅ DONE  (getJournalPrompt, AI_MODELS.fast;
                                              { data: {...} } calling convention FIXED)
useAIContext.ts                ✅ DONE  (route-based context string)
AIChatPanel.tsx                ✅ DONE  (uses /api/ai-chat Nitro endpoint via useChat)
BlockNote xl-ai (PageView)     ✅ DONE  (createAIExtension wired; linkChipSpec.ts uses
                                              createElement to stay .ts)
Scheduling suggestion cards    ✅ DONE  (in CalendarView; { data: {...} } call FIXED)
Journal AI prompt banner       ✅ DONE  (in JournalView)
TopBar chat toggle             ✅ DONE
AppLayout AIChatPanel          ✅ DONE
AppLayout syncGoogleCalendar   ✅ FIXED  ({ data: {...} } calling convention corrected)
```

### SESSION 10 — Tables
```
Cell components (all 6)        ✅ DONE
$tableId route (TableView)     ✅ DONE
$tableId/settings              ✅ DONE
rows/$rowId                    ✅ DONE
Tables index route             ✅ DONE  (useCreateTable(userId) param FIXED;
                                          mutate payload shape FIXED)
Row detail navigation          ✅ DONE  (ChevronRight button in each TableView row)
```

### SESSION 11 — Global Search & Linking
```
CommandDialog                  ✅ DONE  (navigation bugs fixed; open/onOpenChange
                                          controlled props added for link mode)
⌘K trigger                    ✅ DONE
linkChipSpec.ts                ✅ DONE  (createReactInlineContentSpec + editorSchema)
PageView LinkChip registration ✅ DONE  (editorSchema used; /link slash command; backlinks panel;
                                          link.source_id FIXED)
RowDetailView editorSchema     ✅ DONE  (uses editorSchema from linkChipSpec)
/link slash command            ✅ DONE  (opens CommandDialog in link mode, inserts linkChip)
Backlinks panel                ✅ DONE  (Collapsible "Linked from" section at bottom of PageView)
```

### SESSION 12 — Settings & Admin
```
Settings page                  ✅ DONE
Admin invite                   ✅ DONE
```

### SESSION 13 — Polish, Mobile & Testing
```
Loading skeletons              ✅ DONE  (PriorityBucket, TableView, FolderTree, JournalLayout,
                                          CalendarView, JournalView)
ErrorBoundary wrapping         ✅ DONE  (AppLayout wraps <Outlet /> in <ErrorBoundary>)
Mobile layout                  ❌ NOT DONE  (useMediaQuery imported in CalendarView but not
                                              wired into view switching or AppLayout drawer)
aiContext.test                 ❌ NOT DONE
blockSize.test                 ❌ NOT DONE
scheduling.test                ❌ NOT DONE
journalUtils.test              ✅ DONE  (5 tests)
Tone word check                ✅ PASS
```

---

## POST-AUDIT FIXES (2026-04-09) — All Resolved

Full codebase import/route/logic audit corrected the following:

### Runtime Bugs Fixed
1. `calendarBlocks.ts` — `syncGoogleCalendar` called but never imported → added import
2. `tables/index.tsx` — `useCreateTable()` missing required `userId` arg → `useCreateTable(userId)`;
   mutate payload had wrong shape (`user_id` field not part of mutationFn input) → removed
3. `AppLayout.tsx` — `syncGoogleCalendar({ userId, ... })` wrong calling convention →
   `syncGoogleCalendar({ data: { userId, ... } })` (TanStack Start server fn convention)
4. `CalendarView.tsx` — `getSchedulingSuggestions({...})` same issue → wrapped with `{ data: ... }`
5. `JournalView.tsx` — `getJournalPrompt({ journalDate })` same issue → wrapped with `{ data: ... }`
6. `PageView.tsx` — `link.sourceId` (doesn't exist; Supabase returns snake_case) → `link.source_id`;
   `link.sourceTitle` (never fetched) → `link.source_type`
7. `CommandDialog.tsx` — no `open`/`onOpenChange` props (PageView passed them, but they were
   unrecognized); added controlled/uncontrolled pattern

### Dead Code Removed
- `lib/aiConstants.ts` (root) — stale duplicate; wrong model names; non-compliant tone prompt;
  nothing imported it. Real file: `src/lib/aiConstants.ts`
- `src/server/aiChat.ts` — unused TanStack Start server fn; Nitro route handles `/api/ai-chat`
- `src/hooks/useCommandDialog.ts` — not imported anywhere; had Zustand array-selector anti-pattern
- `src/components/routes/dashboard/index.tsx` + `tasks/index.tsx` — orphan components at wrong path
- Empty directories: `src/routes/journal/`, `src/routes/pages/`, `src/components/routes/`,
  `src/components/components/`

---

## VIOLATIONS — All Resolved

```
Hard Rule 1 (no api/ folder)    — FIXED. calendarBlocks.ts was using fetch('/api/...'). Nitro
                                   route at server/routes/api/ai-chat.ts is correct TanStack
                                   Start/Nitro pattern (serverDir: 'server').

Hard Rule 5 (TONE_SYSTEM_PROMPT) — FIXED. All 5 server files + Nitro route import from
                                   '@/lib/aiConstants' → resolves to src/lib/aiConstants.ts.
                                   Root-level lib/aiConstants.ts (stale duplicate) deleted.
```

---

## REMAINING WORK

### SESSION 13 — Outstanding
- Mobile layout: wire `useMediaQuery` into AppLayout (Sheet drawer on mobile), switch
  CalendarView `initialView` to `timeGridDay` on mobile
- Tests: `aiContext.test.ts`, `blockSize.test.ts`, `scheduling.test.ts`

---

## ARCHITECTURAL NOTES

- PriorityBucket lives in AppSidebar (sidebar-first layout — do NOT move it)
- CalendarView is the home screen (`/dashboard` and `/calendar` both render it)
- `/tasks` route is a stub — not needed given sidebar layout
- AIChatPanel uses Nitro route at `server/routes/api/ai-chat.ts` via `useChat({ api: '/api/ai-chat' })`
  This is the correct pattern for streaming in TanStack Start + Nitro

---

## VERIFICATION CHECKLIST

1. `npm run lint` → 0 errors
2. `npm run typecheck` → 0 TypeScript errors
3. `npm run test` → all tests pass (journalUtils: 5 cases)
4. `/dashboard` → CalendarView, 3-day view, scheduling hints
5. Tasks in sidebar PriorityBucket, drag to calendar works
6. `/journal` → auto-creates today entry, AI prompt banner shows
7. `/pages/$pageId` → BlockNote, autosave, `/link` command inserts chip, backlinks panel
8. `/tables` → list of tables, New Table navigates to settings
9. `/tables/$tableId` → ChevronRight navigates to row detail
10. ⌘K → page navigates correctly; table_row uses correct tableId
11. AI chat panel opens from TopBar, tone-compliant responses
12. Settings → Google Calendar connect/disconnect works
13. Error boundary wraps outlet — route errors show error UI not blank screen

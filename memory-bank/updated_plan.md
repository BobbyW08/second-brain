# Second Brain — Codebase Audit & Adapted Plan
## Last Updated: 2026-04-07 (post Gap-3 through Gap-11 audit)

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
2-B: shouldCreateUser: false   ⚠️  PARTIAL  — invite system exists in admin/invite.tsx but
                                              no shouldCreateUser: false found in generateLink
2-C: provider_refresh_token    ✅ DONE  (captured in auth.callback.tsx, written to profiles)
2-D: Protected routes          ✅ DONE  (_authenticated.tsx uses requireAuth())
```

### SESSION 3 — Complete Data Layer
```
profiles.ts                    ✅ DONE  (useUpdateGoogleTokens, useDisconnectGoogle added;
                                          parse error fixed)
tasks.ts                       ✅ DONE  (useTask, useReorderTasks, useUndoCompleteTask,
                                          useArchiveCompletedBefore all present; toasts added)
calendarBlocks.ts              ✅ DONE  (useUndoDeleteCalendarBlock, useSyncGoogleEvents added;
                                          fetch('/api/...') → syncGoogleCalendar server fn fixed)
folders.ts                     ✅ DONE
pages.ts                       ✅ DONE  (usePages, useDeletePage added)
tables.ts                      ✅ DONE
tableRows.ts                   ✅ DONE  (useTableRow, useReorderTableRows added;
                                          missing useQuery import fixed)
links.ts                       ✅ DONE  (created; schema corrected — no link_text/source_title;
                                          useDeleteLink cache key fixed)
aiUsage.ts                     ✅ DONE  (created; schema corrected — tokens_used column,
                                          date-range query, no .single())
Optimistic updates             ✅ DONE
.throwOnError() coverage       ✅ DONE
```

### SESSION 4 — Shared Infrastructure
```
aiConstants.ts                 ✅ DONE  (TONE_SYSTEM_PROMPT, AI_MODELS, BLOCK_SIZE_DURATIONS)
useMediaQuery.ts               ✅ DONE  (MOBILE_QUERY preset included)
useCurrentUser.ts              ✅ DONE  (returns { user, userId })
useCommandDialog.ts            ✅ DONE  (reads from useUIStore)
useUIStore.ts                  ✅ DONE  (commandOpen, chatPanelOpen, activePageId + setters)
queryClient.ts                 ⚠️  PARTIAL  — staleTime set at wrong level (root key instead
                                              of defaultOptions.queries.staleTime)
EmptyState.tsx                 ✅ DONE
ErrorBoundary.tsx              ⚠️  PARTIAL  — default export only; should also be named export
                                              (import sites may need `import ErrorBoundary from ...`)
LoadingScreen.tsx              ❌ NOT DONE  — file does not exist
/dashboard route               ✅ DONE  (uses CalendarView, not a stub)
/pages/index route             ✅ DONE  (shows EmptyState)
/tables/index route            ✅ DONE  (lists tables + New Table button)
AppSidebar nav items           ✅ DONE  (Calendar → /calendar, Pages → /pages, Tables → /tables)
```

### SESSION 5 — Tasks Page
```
TaskPill                       ✅ DONE
PriorityBucket                 ✅ DONE  (userId bug fixed; CompletedTodaySection extracted)
InlineCreateInput              ✅ DONE
CompletedTodaySection          ✅ DONE  (separate Collapsible component, useCompletedTodayTasks)
Toast feedback                 ✅ DONE  (toast.success in useCreateTask, useCompleteTask,
                                          useArchiveTask)
```

### SESSION 6 — Calendar Page
```
CalendarView                   ✅ DONE  (allDayText="Anytime" added)
Draggable                      ✅ DONE
handleEventReceive/Drop/Resize ✅ DONE
handleSelect                   ✅ DONE
googleCalendar.ts              ✅ DONE
/calendar route                ✅ DONE  (src/routes/_authenticated/calendar.tsx)
```

### SESSION 7 — Pages & Folder Tree
```
FolderNode                     ✅ DONE
FolderTree                     ✅ DONE
PageView/PageEditor            ✅ DONE  (BlockNote, useAutosave 800ms, saving indicator)
$pageId route                  ✅ DONE
/pages/index route             ✅ DONE
```

### SESSION 8 — Journal Page
```
journalUtils (getJournalTitle) ✅ DONE
journalUtils.test              ✅ DONE  (5 test cases)
Journal routes                 ✅ DONE  (JournalView, JournalLayout, all three routes)
```

### SESSION 9 — AI Features
```
src/server/aiChat.ts           ⚠️  PARTIAL  — exists with chatStream + TONE_SYSTEM_PROMPT;
                                              BUG: imports from 'lib/aiConstants' not '@/lib/aiConstants'
src/server/aiWriting.ts        ⚠️  PARTIAL  — exists with improveWriting;
                                              BUG: same wrong import path 'lib/aiConstants'
src/server/schedulingSuggestions.ts ⚠️  PARTIAL  — exists with getSchedulingSuggestions;
                                              BUG: same wrong import path 'lib/aiConstants'
src/server/journalPrompt.ts    ⚠️  PARTIAL  — exists with getJournalPrompt;
                                              BUG: same wrong import path 'lib/aiConstants'
useAIContext.ts                ✅ DONE  (route-based context string)
AIChatPanel.tsx                ⚠️  PARTIAL  — exists, uses @assistant-ui/react;
                                              BUG: imports from 'stores/useUIStore' and
                                              'hooks/useAIContext' (missing @/ alias)
BlockNote xl-ai (PageView)     ✅ DONE  (createAIExtension wired in PageView)
Scheduling suggestion cards    ✅ DONE  (in CalendarView)
Journal AI prompt banner       ✅ DONE  (in JournalView)
TopBar chat toggle             ⚠️  PARTIAL  — button present;
                                              BUG: imports from 'stores/useUIStore' (missing @/)
AppLayout AIChatPanel          ✅ DONE  (renders AIChatPanel; not yet wrapped in ErrorBoundary)
useLogAIUsage calls            ⚠️  PARTIAL  — called in CalendarView and JournalView;
                                              aiUsage.ts schema was wrong (now fixed — tokens_used)
```

### SESSION 10 — Tables
```
Cell components (all 6)        ✅ DONE
$tableId route (TableView)     ✅ DONE
$tableId/settings              ✅ DONE
rows/$rowId                    ✅ DONE
Tables index route             ✅ DONE
Row detail navigation          ✅ DONE  (ChevronRight button in each TableView row)
```

### SESSION 11 — Global Search & Linking
```
CommandDialog                  ✅ DONE  (navigation bugs fixed — tableId, removed folder group)
⌘K trigger                    ✅ DONE
linkChipSpec.ts                ✅ DONE  (createReactInlineContentSpec + editorSchema)
PageView LinkChip registration ⚠️  PARTIAL  — editorSchema used ✅, /link slash command ✅,
                                              backlinks panel ✅;
                                              BUG: imports from 'lib/aiConstants' (missing @/)
RowDetailView schema update    ❌ NOT DONE  — still uses old inlineContentTypes API
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
Loading skeletons              ❌ NOT DONE
ErrorBoundary wrapping         ❌ NOT DONE  (ErrorBoundary component exists but not applied in AppLayout)
Mobile layout                  ❌ NOT DONE  (useMediaQuery exists but not wired into AppLayout/CalendarView)
aiContext.test                 ❌ NOT DONE
blockSize.test                 ❌ NOT DONE
scheduling.test                ❌ NOT DONE
journalUtils.test              ✅ DONE  (5 tests)
Tone word check                ✅ PASS
```

---

## VIOLATIONS
```
Hard Rule 1 (no api/ folder)    — FIXED. calendarBlocks.ts was using fetch('/api/sync-google-calendar').
                                   Now calls syncGoogleCalendar server fn directly.

Hard Rule 5 (TONE_SYSTEM_PROMPT) — ACTIVE VIOLATION in 4 server files + AIChatPanel + TopBar.
                                   Import path is 'lib/aiConstants' instead of '@/lib/aiConstants'.
                                   This will cause a module-not-found error at build time.
                                   Fix before running build or typecheck.
```

---

## REMAINING WORK (priority order)

### IMMEDIATE — Fix import paths (5 files, ~5 lines each)
All five files use `'lib/aiConstants'` or `'stores/useUIStore'` etc. without the `@/` alias.
This is a Hard Rule 5 violation and will break the build.

Files to fix:
- `src/server/aiChat.ts` — `'lib/aiConstants'` → `'@/lib/aiConstants'`
- `src/server/aiWriting.ts` — same
- `src/server/schedulingSuggestions.ts` — same
- `src/server/journalPrompt.ts` — same
- `src/components/pages/PageView.tsx` — same
- `src/components/ai/AIChatPanel.tsx` — `'stores/useUIStore'` → `'@/stores/useUIStore'`; `'hooks/useAIContext'` → `'@/hooks/useAIContext'`
- `src/components/layout/TopBar.tsx` — `'stores/useUIStore'` → `'@/stores/useUIStore'`

### SHORT-TERM — Minor gaps
- Create `src/components/shared/LoadingScreen.tsx` (spinner, centered)
- Fix `src/lib/queryClient.ts` — move staleTime into `defaultOptions.queries.staleTime`
- Fix `src/components/shared/ErrorBoundary.tsx` — add named export alongside default export
- Update `src/components/tables/RowDetailView.tsx` — swap `inlineContentTypes` for `editorSchema` (same fix applied to PageView)

### SESSION 13 — Remaining polish
- Loading skeletons in PriorityBucket, TableView, FolderTree, JournalLayout
- Wrap `<SidebarInset>` outlet in AppLayout with `<ErrorBoundary>`
- Mobile layout: useMediaQuery in AppLayout (Sheet drawer), CalendarView `initialView` switch
- Tests: aiContext.test.ts, blockSize.test.ts, scheduling.test.ts

---

## ARCHITECTURAL NOTE

- PriorityBucket lives in AppSidebar (sidebar-first layout — do NOT move it)
- CalendarView is the home screen (`/dashboard` and `/calendar` both render it)
- `/tasks` route is a stub — not needed given sidebar layout

---

## VERIFICATION CHECKLIST (run after remaining work)

1. `npm run lint` → 0 errors
2. `npm run typecheck` → 0 TypeScript errors
3. `npm run test` → all tests pass
4. `/dashboard` → CalendarView, 3-day view, scheduling hints
5. Tasks in sidebar PriorityBucket, drag to calendar works
6. `/journal` → auto-creates today entry, AI prompt banner shows
7. `/pages/$pageId` → BlockNote, autosave, `/link` command inserts chip, backlinks panel
8. `/tables` → list of tables, New Table navigates to settings
9. `/tables/$tableId` → ChevronRight navigates to row detail
10. ⌘K → page navigates correctly; table_row uses correct tableId
11. AI chat panel opens from TopBar, tone-compliant responses
12. Settings → Google Calendar connect/disconnect works

# Decision Log — Second Brain

## Framework: TanStack Start + Nitro (not Next.js)

**Chosen:** TanStack Start + Nitro
**Rejected:** Next.js, Remix, SvelteKit

**Why:** TanStack Start provides type-safe server functions co-located with the frontend — no separate `api/` folder needed. TanStack Router's `beforeLoad` auth guard is fully typed. Nitro adapter deploys to Vercel without custom config. The owner already has a working TanStack Start + Supabase starter template that eliminates setup friction.

---

## Database & Auth: Supabase (not PlanetScale + Auth.js)

**Chosen:** Supabase (PostgreSQL + Auth + RLS + Realtime)
**Rejected:** PlanetScale, Neon, Firebase

**Why:** Free tier covers the project's scale. Supabase Auth handles Google OAuth with provider token extraction built-in. RLS enforces data isolation at the database level. Realtime subscription available for future use. Single vendor reduces operational complexity.

---

## Calendar: FullCalendar v6 (not react-big-calendar, DHTMLX)

**Chosen:** FullCalendar v6 React
**Rejected:** react-big-calendar, DHTMLX Scheduler, custom implementation

**Why:** FullCalendar's `Draggable` API (from `@fullcalendar/interaction`) is the only reliable way to implement external drag-from-bucket-to-calendar without conflicts. react-big-calendar has poor drag-drop interop. Custom implementations would require months of work. FullCalendar v6 supports the exact 3-day view + zone rendering required.

**Critical note:** Do NOT use dnd-kit or react-dnd alongside FullCalendar — they conflict with FullCalendar's event model. Use only FullCalendar's built-in `Draggable`.

---

## Block Editor: BlockNote (not TipTap, Notion-like custom)

**Chosen:** BlockNote + @blocknote/mantine + @blocknote/xl-ai
**Rejected:** TipTap, Plate, Lexical, custom ProseMirror

**Why:** BlockNote provides slash commands, drag-drop blocks, and custom content types out of the box. `@blocknote/xl-ai` adds AI toolbar and `/ai` slash command with minimal integration work — it accepts a custom backend URL so the Anthropic API key stays server-side. GPL-3 license is acceptable for a private app.

---

## Folder Tree: react-arborist (not custom tree, rc-tree)

**Chosen:** react-arborist
**Rejected:** rc-tree, dnd-kit tree, custom recursive component

**Why:** react-arborist provides drag-drop reordering, inline rename, keyboard navigation, and virtualization for large trees — all MIT licensed. Building this from scratch would be a multi-week effort. rc-tree has poor TypeScript support.

---

## AI Chat UI: assistant-ui (not custom chat, react-chat-ui)

**Chosen:** assistant-ui
**Rejected:** Custom streaming chat component, react-chat-ui

**Why:** assistant-ui provides a production-quality streaming thread UI with markdown rendering, WAI-ARIA accessibility, and built-in Vercel AI SDK integration. MIT licensed. Saves 2–3 days of custom chat component work.

---

## State Management: Zustand (client) + TanStack Query (server)

**Chosen:** Zustand for client state, TanStack Query for server state
**Rejected:** Redux, Jotai, SWR, mixed approach

**Why:** Clear separation of concerns. TanStack Query handles caching, background refetch, and optimistic updates for server data. Zustand handles ephemeral client state (selected item, drag state, panel open/closed) with zero boilerplate. The rule "never mix them" prevents the common mistake of storing server data in Zustand (which creates stale data bugs).

---

## Tone Policy: No negative/evaluative language

**Decision:** All language — UI copy, variable names, AI responses, comments — must be supportive and forward-focused. The banned word list (overdue, late, missed, behind, failed, incomplete, you should, you need to) is enforced via CLAUDE.md and TONE_SYSTEM_PROMPT.

**Why:** The app is a personal productivity tool, not a task management system that judges performance. Negative language creates anxiety and discourages use. This is a hard product requirement, not a style preference.

---

## Linting: Biome (not ESLint + Prettier)

**Chosen:** Biome
**Rejected:** ESLint + Prettier

**Why:** Biome is 10–100x faster, requires one config file, and handles both linting and formatting. The TanStack Start starter already ships with Biome configured.

---

## Deployment: Vercel Hobby (not Railway, Fly.io, self-host)

**Chosen:** Vercel Hobby (free tier)
**Rejected:** Railway, Fly.io, DigitalOcean, self-hosted

**Why:** TanStack Start's Nitro adapter targets Vercel natively. No custom vercel.json needed. Free tier handles the expected traffic (single primary user). GitHub → Vercel auto-deploy pipeline works out of the box.

# CLINE TICKET: Jotion-Style Page Headers
# PHASE: 6-X (run after Phase 6 — Files and Editor — is complete)
# REFERENCE: sanidhyy/notion-clone (MIT) — components/cover.tsx, icon-picker.tsx, toolbar.tsx

═══════════════════════════════════════════════════════
MANDATORY: READ THESE FILES BEFORE TOUCHING ANYTHING
═══════════════════════════════════════════════════════

Read in this exact order. Do not skip any.

1. CLAUDE.md
2. memory-bank/activeContext.md
3. memory-bank/progress.md

Then read these source files before writing a single line of code:

4. src/components/pages/PageView.tsx
   ← Read the entire file. Locate exactly where the BlockNote editor is rendered.
     The new PageHeader component (icon + cover + title) goes ABOVE the editor.
     Do not change the autosave logic, the inline title input, or the editor itself.

5. src/components/layout/FolderTree.tsx (or wherever FolderNode is rendered)
   ← Locate the FolderNode renderer to understand where to add the page icon display.

6. src/queries/pages.ts (or equivalent)
   ← Find useUpdatePage or equivalent. The icon and cover_url fields will be added
     here as optional fields. Do not change the existing mutation shape.

7. src/types/database.types.ts
   ← Confirm the pages table columns BEFORE the migration. After the migration runs,
     regenerate this file and use the new types.

═══════════════════════════════════════════════════════
REFERENCE IMPLEMENTATION
═══════════════════════════════════════════════════════

Study these files in the sanidhyy/notion-clone repo BEFORE writing code.
Do NOT copy them verbatim. Port the logic and adapt to our stack:
  - Replace Convex queries with our TanStack Query hooks + server functions
  - Replace EdgeStore file upload with Supabase Storage upload
  - Replace Clerk auth with useCurrentUser()
  - Apply Second Brain design tokens (no Jotion styles)

Key files to study:
  components/cover.tsx       ← cover image display + upload + remove
  components/icon-picker.tsx ← emoji picker popover
  components/toolbar.tsx     ← page header with icon, title, add-cover button

═══════════════════════════════════════════════════════
ATOMIC SUB-TASKS — EXECUTE IN ORDER
═══════════════════════════════════════════════════════

────────────────────────────────────────────────────────
SUB-TASK A — Database migration
────────────────────────────────────────────────────────

Create: supabase/migrations/[date]_add_page_header_fields.sql

```sql
-- Add icon and cover image to pages
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS icon text,           -- emoji character, e.g. '📝'
  ADD COLUMN IF NOT EXISTS cover_url text;      -- Supabase Storage public URL

-- Create the attachments storage bucket if it doesn't exist
-- (Run this in Supabase dashboard Storage tab, or add as a migration comment)
-- Bucket name: page-covers
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
```

After creating the migration file, instruct the user to run:
  npm run db:reset   (or supabase db push for prod)
  npm run db:types   (regenerate src/types/database.types.ts)

Do NOT proceed to the remaining sub-tasks until the types file is regenerated.

────────────────────────────────────────────────────────
SUB-TASK B — Server function for cover upload/remove
────────────────────────────────────────────────────────

Create: src/server/pageHeader.ts

Two server functions:

1. uploadPageCover
   .validator: { userId: string, pageId: string, fileBase64: string, mimeType: string }
   .handler:
     - Decode base64 to Buffer
     - Upload to Supabase Storage bucket 'page-covers'
     - Path: `${userId}/${pageId}/cover.${ext}` (ext derived from mimeType)
     - Use SUPABASE_SERVICE_ROLE_KEY (server only)
     - Get public URL via supabase.storage.from('page-covers').getPublicUrl(path)
     - Update pages table: SET cover_url = publicUrl WHERE id = pageId AND user_id = userId
     - .throwOnError() on all Supabase calls
     - Return { coverUrl: string }

2. removePageCover
   .validator: { userId: string, pageId: string }
   .handler:
     - Get current cover_url from pages to extract the storage path
     - Delete from Supabase Storage: supabase.storage.from('page-covers').remove([path])
     - Update pages table: SET cover_url = null WHERE id = pageId AND user_id = userId
     - .throwOnError() on all Supabase calls
     - Return { success: true }

Note: icon is just a text column — update it via the existing useUpdatePage mutation,
no server function needed. Add icon as an optional field to the existing updatePage
server function if it isn't already there.

────────────────────────────────────────────────────────
SUB-TASK C — IconPicker component
────────────────────────────────────────────────────────

Create: src/components/editor/IconPicker.tsx

Port from Jotion's components/icon-picker.tsx. Remove all Convex references.

Props:
  onChange: (emoji: string) => void
  children: React.ReactNode  ← the trigger (the icon button itself)
  asChild?: boolean

Behavior:
  - shadcn Popover wrapping a grid of emoji characters
  - Use a curated flat list of ~200 common emojis organized in rows
    (productivity/work category first, then objects, nature, symbols)
  - Clicking an emoji calls onChange(emoji) and closes the popover
  - A "Remove" option at the top of the popover (only shown if the page already
    has an icon) calls onChange('') to clear
  - No external emoji library — inline the emoji list as a constant array

Design tokens:
  - Popover bg: #141418, border: #2a2a30
  - Emoji grid: 8 columns, each cell 36×36px (hover bg: #1e1e24, radius 6px)
  - Remove button: 11px, #666672 text, full width, hover bg #1e1e24
  - Popover width: 296px

ACCEPTANCE CRITERIA — C:
- [ ] Popover opens on trigger click
- [ ] Emoji grid renders correctly
- [ ] onChange fires with the selected emoji string
- [ ] Remove option clears the icon
- [ ] No external emoji package installed

────────────────────────────────────────────────────────
SUB-TASK D — PageCover component
────────────────────────────────────────────────────────

Create: src/components/editor/PageCover.tsx

Port from Jotion's components/cover.tsx. Replace EdgeStore with Supabase Storage.

Props:
  pageId: string
  userId: string
  coverUrl: string | null
  onCoverChange: (url: string | null) => void  ← optimistic update

Behavior:
  - If coverUrl is set: render a full-width image (height: 200px, object-fit: cover)
    with a hover overlay showing two buttons: "Change cover" and "Remove"
  - If coverUrl is null: render nothing (cover is added via the PageHeader toolbar)
  - "Change cover": opens a native <input type="file" accept="image/*"> via a hidden
    ref click. On file select, read as base64, call uploadPageCover server function.
    Show a loading overlay on the image while uploading.
  - "Remove": calls removePageCover server function, calls onCoverChange(null)
  - Optimistic update: call onCoverChange(localObjectUrl) immediately on file select,
    then replace with the real Supabase URL on success
  - On error: restore previous coverUrl, show Sonner toast: "Cover could not be saved."

Design tokens:
  - Cover image: w-full, h-[200px], object-cover, rounded-none (edge to edge)
  - Hover overlay: bg-black/20 absolute inset-0, opacity 0 → 1 on hover
  - Buttons: 11px, #e8e8f0, bg #0f0f11/60 backdrop-blur-sm, px-3 py-1.5, radius 6px
  - Loading: a subtle shimmer overlay (Skeleton from shadcn) over the image

IMPORTANT: Never use <form> tags. File input triggered via ref.click().

ACCEPTANCE CRITERIA — D:
- [ ] Cover image renders when coverUrl is set
- [ ] Nothing renders when coverUrl is null
- [ ] File picker opens on "Change cover" click
- [ ] Image uploads to Supabase Storage via uploadPageCover server function
- [ ] Optimistic preview shows immediately on file select
- [ ] Remove calls removePageCover and clears the image
- [ ] Error state shows toast and restores previous cover
- [ ] No <form> tags anywhere in the component
- [ ] Loading state during upload

────────────────────────────────────────────────────────
SUB-TASK E — PageHeader component (Jotion toolbar)
────────────────────────────────────────────────────────

Create: src/components/editor/PageHeader.tsx

Port from Jotion's components/toolbar.tsx. This is the area between the cover and
the title/editor — it holds the page icon and the action buttons.

Props:
  pageId: string
  userId: string
  icon: string | null
  coverUrl: string | null
  onIconChange: (emoji: string) => void
  onCoverChange: (url: string | null) => void

Layout (from top to bottom, this entire component sits above PageView's editor):
  1. PageCover (full-width, only renders if coverUrl is set)
  2. A row containing:
     a. If icon is set: a large emoji display (40px font, clickable → IconPicker)
     b. If icon is not set: nothing (icon added via the action buttons)
  3. A row of action buttons (visible on hover of the header area, always visible
     if no cover AND no icon):
     a. If no icon: "Add icon" button (Smile icon + label)
     b. If no cover: "Add cover" button (ImageIcon + label)
     Both buttons are 11px, #666672, hover #aaaaB8, no background

Behavior:
  - "Add icon" click: open IconPicker, on emoji selected call onIconChange(emoji)
  - "Add cover" click: trigger the hidden file input inside PageCover via a ref
    passed down from here — OR render an empty PageCover that self-triggers on mount.
    Simplest approach: render PageCover always, pass a `triggerOpen` boolean prop
    that auto-clicks the file input if true.
  - onIconChange: calls useUpdatePage mutation with { icon: emoji }
  - Icon click (when set): open IconPicker; selecting clears or changes it

Design tokens:
  - Icon display: text-5xl (40px), cursor-pointer, hover:opacity-80, p-1 radius-md
  - Action buttons: 13px, #666672, gap-1.5 with icon, py-1 px-2, hover:text-[#aaaaB8]
    hover:bg-[#1e1e24], radius 6px, min-h-[44px]
  - Header area padding: px-8 pb-4 pt-2 (matches BlockNote editor padding)

ACCEPTANCE CRITERIA — E:
- [ ] PageCover renders above the header when coverUrl is set
- [ ] Emoji icon displays at 40px when icon is set
- [ ] Clicking the emoji opens IconPicker
- [ ] "Add icon" button appears only when no icon is set
- [ ] "Add cover" button appears only when no cover is set
- [ ] Both buttons are 44px min touch targets
- [ ] Selecting an emoji from IconPicker updates the page via useUpdatePage
- [ ] onCoverChange wires through to PageCover

────────────────────────────────────────────────────────
SUB-TASK F — Wire PageHeader into PageView
────────────────────────────────────────────────────────

Modify: src/components/pages/PageView.tsx

1. Add icon and cover_url to the page query if not already fetched
2. Add local state for optimistic icon and cover updates:
   const [localIcon, setLocalIcon] = useState(page?.icon ?? null)
   const [localCoverUrl, setLocalCoverUrl] = useState(page?.cover_url ?? null)
3. Render <PageHeader> ABOVE the BlockNote editor div, with all four props wired
4. onIconChange: setLocalIcon(emoji) + call useUpdatePage({ icon: emoji })
5. onCoverChange: setLocalCoverUrl(url) (PageCover handles the server call itself)
6. Keep the existing inline title editing exactly as-is — PageHeader goes between
   cover and the title, OR the title stays in PageView above the editor — do NOT
   move or change the existing title input.

WHAT NOT TO CHANGE:
- The autosave logic (useAutosave with 800ms debounce)
- The BlockNote editor initialization (useCreateBlockNote)
- The saving indicator ("Saving..." / "Saved")
- The existing page title input (keep it exactly where it is)
- Any existing query hooks — only extend them

ACCEPTANCE CRITERIA — F:
- [ ] PageHeader renders above the editor without breaking autosave
- [ ] icon and cover_url from the database populate the header on load
- [ ] Optimistic updates show immediately before server confirmation
- [ ] npm run build passes
- [ ] npm run check passes

────────────────────────────────────────────────────────
SUB-TASK G — Show icon in FolderTree
────────────────────────────────────────────────────────

Modify: whichever component renders individual folder tree items (FolderNode or
equivalent in src/components/files/ or src/components/layout/).

1. The pages query that populates the folder tree must include the icon column.
   Add it to the select() call if not already present.
2. In the FolderNode renderer, if the page has an icon, render it as a small emoji
   (14px) before the page title, replacing the default page File icon.
3. If no icon, render the existing File icon as before.

Design:
  - Emoji: text-[14px], leading-none, w-4 shrink-0 (same width as the File icon)
  - No additional padding — drop-in replacement for the icon

ACCEPTANCE CRITERIA — G:
- [ ] Pages with an icon show the emoji in the folder tree
- [ ] Pages without an icon show the existing File icon
- [ ] FolderTree still renders, sorts, and reorders correctly
- [ ] No TypeScript errors on the icon field access

═══════════════════════════════════════════════════════
FILES TO CREATE
═══════════════════════════════════════════════════════

supabase/migrations/[date]_add_page_header_fields.sql
src/server/pageHeader.ts
src/components/editor/IconPicker.tsx
src/components/editor/PageCover.tsx
src/components/editor/PageHeader.tsx

═══════════════════════════════════════════════════════
FILES TO MODIFY
═══════════════════════════════════════════════════════

src/components/pages/PageView.tsx     (add PageHeader above editor)
src/queries/pages.ts                  (add icon, cover_url to select and updatePage)
FolderNode/FolderTree component       (add icon display in tree item)

═══════════════════════════════════════════════════════
HARD RULES — from CLAUDE.md
═══════════════════════════════════════════════════════

- All Supabase calls end with .throwOnError()
- No <form> tags anywhere — file input triggered via ref.click()
- No tone violations: no "failed", "error uploading your file", etc.
  Use: "Cover could not be saved. Try again."
- Minimum 44×44px tap targets on all buttons
- SUPABASE_SERVICE_ROLE_KEY in server functions only
- No new npm packages without flagging. This ticket requires NO new packages —
  emoji grid is a hardcoded array, file upload uses native browser APIs.
  If you feel you need a package, STOP and ask first.
- Do not edit routeTree.gen.ts
- Do not change Nitro version
- Do not rewrite existing working components — only extend them

═══════════════════════════════════════════════════════
SESSION END
═══════════════════════════════════════════════════════

1. Run npm run build — zero errors
2. Run npm run check — zero Biome errors
3. Run npm run typecheck — zero TypeScript errors
4. Manually test in browser:
   - Open a page → header area visible
   - Click "Add icon" → emoji picker opens → selecting emoji shows it
   - Click "Add cover" → file picker opens → image shows after upload
   - Reload the page → icon and cover persist
   - Open a different page → previous icon/cover gone (correct)
   - Check FolderTree → page with icon shows emoji, page without shows File icon
5. Update memory-bank/activeContext.md → next ticket
6. Update memory-bank/progress.md → check off this ticket

Report:
1. Files created (full paths)
2. Files modified (full paths + what changed)
3. Whether the page-covers Supabase Storage bucket needed manual creation
4. Any MIME type or file size edge cases encountered
5. Confirmation of all three command passes

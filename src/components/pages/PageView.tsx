import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { Loader2 } from 'lucide-react'
import { usePage } from '@/queries/pages'
import { useUpdatePage } from '@/queries/pages'
import { useAutosave } from '@/hooks/useAutosave'
import { LinkChip } from '@/components/editor/LinkChip'

export function PageView() {
  const { pageId } = useParams({ strict: false })
  
  const { data: page } = usePage(pageId)
  const { mutate: updatePage } = useUpdatePage()

  const [title, setTitle] = useState(page?.title ?? 'Untitled')

  // Slash command stubs:
  // /link — Phase 6 (Ticket 6-B): opens CommandDialog in link mode
  // /ai   — Phase 7 (Ticket 7-C): replaced by @blocknote/xl-ai configuration
  // These are registered when those tickets are complete. No action needed here.

  const editor = useCreateBlockNote({
    initialContent: page?.content ?? undefined,
    inlineContentTypes: [
      {
        type: 'linkChip',
        render: (props) => <LinkChip data={props.content} />,
      },
    ],
    slashCommands: [
      {
        name: 'link',
        execute: (_editor) => {
          // This will be handled by the CommandDialog in link mode
          // For now, we'll just show a placeholder
        },
        aliases: [],
        group: 'Insert',
        description: 'Insert a link to a page, task, folder, or table row',
      },
    ],
  })

  // Autosave content
  const { save: saveContent, isSaving: isSavingContent } = useAutosave(
    (content: unknown) => updatePage({ pageId, updates: { content } }),
    800
  )

  // Autosave title
  const { save: saveTitle } = useAutosave(
    (t: string) => updatePage({ pageId, updates: { title: t } }),
    800
  )

  // Update title when page data changes
  useEffect(() => {
    if (page?.title) {
      setTitle(page.title)
    }
  }, [page?.title])

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-6 py-8">
      {/* Top bar with saving indicator */}
      <div className="flex justify-end mb-2 h-5">
        {isSavingContent && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
      </div>

      {/* Inline editable title */}
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          saveTitle(e.target.value)
        }}
        className="text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground w-full mb-4"
        placeholder="Untitled"
        aria-label="Page title"
      />

      {/* BlockNote editor */}
      <BlockNoteView
        editor={editor}
        onChange={() => saveContent(editor.document)}
        theme="dark"
        slashMenu={true}
      />
    </div>
  )
}

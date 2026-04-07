import { createElement } from 'react'
import { createReactInlineContentSpec } from '@blocknote/react'
import { BlockNoteSchema, defaultInlineContentSpecs } from '@blocknote/core'
import { LinkChip } from '@/components/editor/LinkChip'

export const LinkChipSpec = createReactInlineContentSpec(
  {
    type: 'linkChip' as const,
    propSchema: {
      itemType: { default: 'page' as string },
      itemId: { default: '' },
      itemTitle: { default: '' },
    },
    content: 'none',
  },
  {
    render: (props) => createElement(LinkChip, {
      data: {
        type: props.inlineContent.props.itemType as 'page' | 'task' | 'folder' | 'table_row',
        id: props.inlineContent.props.itemId,
        title: props.inlineContent.props.itemTitle,
      },
    }),
  }
)

export const editorSchema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    linkChip: LinkChipSpec,
  },
})

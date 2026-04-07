import type { NodeRendererProps } from 'react-arborist';
import { Folder, FileText, MoreHorizontal, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { TreeNode } from '@/queries/folders';

export function FolderNode({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
  const isFolder = node.data.type === 'folder';

  return (
    <div
      style={style}
      ref={dragHandle}
      className={`flex items-center gap-1 px-2 py-1 rounded group ${node.isSelected ? 'bg-accent' : ''}`}
    >
      {/* Clickable area: chevron + icon + title */}
      <button
        type="button"
        className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer hover:bg-accent rounded"
        onClick={() => node.isInternal ? node.toggle() : node.select()}
      >
        {/* Chevron for folders */}
        {isFolder && (
          <ChevronRight
            className={`h-3 w-3 text-muted-foreground transition-transform flex-shrink-0 ${node.isOpen ? 'rotate-90' : ''}`}
          />
        )}

        {!isFolder && <span className="w-3 flex-shrink-0" />}

        {/* Icon */}
        {isFolder
          ? <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          : <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        }

        {/* Title — editable on double-click via arborist's built-in edit mode */}
        <span className="flex-1 text-sm truncate text-left">
          {node.isEditing
            ? <input
                defaultValue={node.data.name}
                onBlur={(e) => node.submit(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') node.submit(e.currentTarget.value);
                  if (e.key === 'Escape') node.reset();
                }}
                className="bg-transparent outline-none border-b border-primary w-full"
              />
            : node.data.name
          }
        </span>
      </button>

      {/* Context menu — only visible on hover */}
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted"
          aria-label="Options"
        >
          <MoreHorizontal className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => node.edit()}>Rename</DropdownMenuItem>
          {isFolder && (
            <DropdownMenuItem onClick={() => {/* handled by create button */}}>
              Add page
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => node.tree.delete(node.id)}
            className="text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

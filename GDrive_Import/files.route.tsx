// src/routes/_authenticated/files.tsx
// File storage page — shows all imported Google Drive folders and their contents.
// Accessible from the sidebar. Replaces the route stub from Session 4.

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Folder,
  FolderOpen,
  File,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  HardDrive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useDriveSyncedFolders,
  useDriveFiles,
  useSyncDriveFolder,
} from '@/queries/driveImport'
import type { DriveFile, DriveFileNode, DriveSyncedFolder } from '@/types/DriveImport'

// ============================================================
// Route
// ============================================================

export const Route = createFileRoute('/_authenticated/files')({
  component: FilesPage,
})

// ============================================================
// Helpers
// ============================================================

/** Build a tree from the flat drive_files list using drive_parent_id. */
function buildFileTree(
  files: DriveFile[],
  rootDriveFolderId: string
): DriveFileNode[] {
  const nodeMap = new Map<string, DriveFileNode>()
  for (const f of files) {
    nodeMap.set(f.drive_file_id, { ...f, children: [] })
  }

  const roots: DriveFileNode[] = []
  for (const node of nodeMap.values()) {
    const parentId = node.drive_parent_id
    if (!parentId || parentId === rootDriveFolderId || !nodeMap.has(parentId)) {
      roots.push(node)
    } else {
      nodeMap.get(parentId)!.children.push(node)
    }
  }

  return roots
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ============================================================
// File tree node (recursive)
// ============================================================

function FileTreeNode({
  node,
  depth = 0,
}: {
  node: DriveFileNode
  depth?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = node.is_folder && node.children.length > 0
  const indent = depth * 20

  return (
    <li>
      <div
        className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60 focus-within:bg-muted/60"
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        {/* Expand toggle — only for folders with children */}
        {node.is_folder ? (
          <button
            onClick={() => hasChildren && setExpanded((p) => !p)}
            aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={hasChildren ? expanded : undefined}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              expanded ? (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              )
            ) : (
              <span className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" aria-hidden />
        )}

        {/* Icon */}
        {node.is_folder ? (
          expanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
          )
        ) : (
          <File className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        )}

        {/* Name */}
        <span className="flex-1 truncate font-medium text-foreground">{node.name}</span>

        {/* Size */}
        {!node.is_folder && node.size_bytes && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatBytes(node.size_bytes)}
          </span>
        )}

        {/* Open in Drive */}
        {node.web_view_link && (
          <a
            href={node.web_view_link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${node.name} in Google Drive`}
            className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus:opacity-100"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          </a>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <ul role="list" aria-label={`Contents of ${node.name}`}>
          {node.children.map((child) => (
            <FileTreeNode key={child.drive_file_id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

// ============================================================
// Per-synced-folder panel
// ============================================================

function SyncedFolderPanel({
  folder,
  userId,
}: {
  folder: DriveSyncedFolder
  userId: string
}) {
  const [expanded, setExpanded] = useState(true)
  const { data: files, isLoading } = useDriveFiles(userId, folder.id)
  const syncMutation = useSyncDriveFolder(userId)

  const tree =
    files && files.length > 0
      ? buildFileTree(files, folder.drive_folder_id)
      : []

  const isSyncing =
    folder.sync_status === 'syncing' || syncMutation.isPending

  return (
    <div className="rounded-lg border bg-card">
      {/* Folder header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setExpanded((p) => !p)}
          aria-expanded={expanded}
          aria-controls={`folder-contents-${folder.id}`}
          className="flex min-h-[44px] flex-1 items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <HardDrive className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
          <span className="font-semibold text-sm">{folder.name}</span>
          {files && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({files.length} items)
            </span>
          )}
        </button>

        <Button
          variant="ghost"
          size="icon"
          aria-label={`Refresh ${folder.name}`}
          disabled={isSyncing}
          onClick={() => syncMutation.mutate(folder.id)}
          className="h-11 w-11 shrink-0"
        >
          <RefreshCw
            className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
            aria-hidden
          />
        </Button>
      </div>

      <Separator />

      {/* Contents */}
      <div
        id={`folder-contents-${folder.id}`}
        hidden={!expanded}
      >
        {isLoading && (
          <div className="space-y-2 p-3">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-7 w-2/3 pl-6" />
            <Skeleton className="h-7 w-1/2 pl-6" />
          </div>
        )}

        {!isLoading && folder.sync_status === 'pending' && (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            Sync in progress — check back in a moment.
          </p>
        )}

        {!isLoading && folder.sync_status === 'error' && (
          <p className="px-3 py-4 text-center text-sm text-destructive">
            {folder.error_message ?? 'An issue occurred during sync.'}
          </p>
        )}

        {!isLoading && folder.sync_status === 'ready' && tree.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            This folder appears to be empty.
          </p>
        )}

        {!isLoading && tree.length > 0 && (
          <ScrollArea className="max-h-[60vh]">
            <ul
              role="list"
              aria-label={`Files in ${folder.name}`}
              className="py-1"
            >
              {tree.map((node) => (
                <FileTreeNode key={node.drive_file_id} node={node} />
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Page
// ============================================================

function FilesPage() {
  // Get userId from auth context — adjust the import path to match your auth setup
  const { user } = Route.useRouteContext()

  const { data: syncedFolders, isLoading } = useDriveSyncedFolders(user.id)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">File Storage</h1>
          <p className="text-sm text-muted-foreground">
            Browse your imported Google Drive folders.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Navigate to Settings → Drive section
            // Adjust the path to match your router setup
            window.location.href = '/settings#drive'
          }}
          className="h-11"
        >
          Manage folders
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      )}

      {!isLoading && (!syncedFolders || syncedFolders.length === 0) && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <HardDrive className="h-10 w-10 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-semibold">No folders imported yet</p>
            <p className="text-sm text-muted-foreground">
              Go to Settings → Google Drive to add your first folder.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => { window.location.href = '/settings#drive' }}
            className="h-11"
          >
            Open Settings
          </Button>
        </div>
      )}

      {!isLoading && syncedFolders && syncedFolders.length > 0 && (
        <div className="space-y-4">
          {syncedFolders.map((folder) => (
            <SyncedFolderPanel
              key={folder.id}
              folder={folder}
              userId={user.id}
            />
          ))}
        </div>
      )}
    </main>
  )
}

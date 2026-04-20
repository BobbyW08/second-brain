// src/components/settings/DriveImportSection.tsx
// The "Google Drive" section that lives inside the Settings page.
// Drop this inside settings.tsx alongside the Calendar and Profile sections.
//
// Props:
//   userId  — from auth context (pass down from the route)

import { useState } from 'react'
import { toast } from 'sonner'
import { FolderOpen, RefreshCw, Trash2, ExternalLink, CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  useDriveSyncedFolders,
  useAddDriveSyncFolder,
  useSyncDriveFolder,
  useRemoveDriveSyncFolder,
} from '@/queries/driveImport'
import type { DriveSyncedFolder } from '@/types/DriveImport'

interface DriveImportSectionProps {
  userId: string
  googleConnected: boolean
}

// ============================================================
// Sub-component: individual folder row
// ============================================================

function SyncedFolderRow({
  folder,
  userId,
}: {
  folder: DriveSyncedFolder
  userId: string
}) {
  const syncMutation = useSyncDriveFolder(userId)
  const removeMutation = useRemoveDriveSyncFolder(userId)

  const isSyncing =
    folder.sync_status === 'syncing' || syncMutation.isPending

  const statusLabel: Record<DriveSyncedFolder['sync_status'], string> = {
    pending: 'Waiting for first sync',
    syncing: 'Syncing…',
    ready: folder.last_synced_at
      ? `Synced ${new Date(folder.last_synced_at).toLocaleString()}`
      : 'Ready',
    error: folder.error_message ?? 'An issue occurred',
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <FolderOpen className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{folder.name}</p>
        <p
          className={`text-xs ${
            folder.sync_status === 'error'
              ? 'text-destructive'
              : 'text-muted-foreground'
          }`}
        >
          {statusLabel[folder.sync_status]}
        </p>
      </div>

      {/* Refresh */}
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

      {/* Remove */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove ${folder.name}`}
            className="h-11 w-11 shrink-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{folder.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the folder from your file storage. Your files in Google
              Drive are untouched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMutation.mutate(folder.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============================================================
// Main section component
// ============================================================

export function DriveImportSection({ userId, googleConnected }: DriveImportSectionProps) {
  const [folderInput, setFolderInput] = useState('')

  const { data: syncedFolders, isLoading } = useDriveSyncedFolders(userId)
  const addMutation = useAddDriveSyncFolder(userId)
  const syncMutation = useSyncDriveFolder(userId)

  function handleAddFolder() {
    const trimmed = folderInput.trim()
    if (!trimmed) {
      toast.error('Paste a Google Drive folder link or ID.')
      return
    }
    addMutation.mutate(trimmed, {
      onSuccess: (newFolder) => {
        setFolderInput('')
        // Kick off the first sync automatically
        syncMutation.mutate(newFolder.id)
      },
    })
  }

  return (
    <section aria-labelledby="drive-import-heading" className="space-y-4">
      <div>
        <h3 id="drive-import-heading" className="text-base font-semibold">
          Google Drive
        </h3>
        <p className="text-sm text-muted-foreground">
          Import Drive folders into your file storage. Files stay in Drive — Second Brain
          keeps a synced index you can browse and search.
        </p>
      </div>

      <Separator />

      {/* Not connected state */}
      {!googleConnected && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-muted-foreground">
          <CloudOff className="h-5 w-5 shrink-0" aria-hidden />
          <div className="text-sm">
            <p className="font-medium text-foreground">Google account not connected</p>
            <p>Connect your Google account above to import Drive folders.</p>
          </div>
        </div>
      )}

      {/* Add folder input */}
      {googleConnected && (
        <div className="space-y-2">
          <Label htmlFor="drive-folder-input">Add a folder</Label>
          <div className="flex gap-2">
            <Input
              id="drive-folder-input"
              placeholder="Paste a Drive folder link or folder ID"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddFolder()
              }}
              disabled={addMutation.isPending}
              className="h-11 flex-1"
              aria-describedby="drive-folder-hint"
            />
            <Button
              onClick={handleAddFolder}
              disabled={addMutation.isPending || !folderInput.trim()}
              className="h-11 shrink-0"
            >
              {addMutation.isPending ? 'Adding…' : 'Add folder'}
            </Button>
          </div>
          <p id="drive-folder-hint" className="text-xs text-muted-foreground">
            The folder must be owned by or shared with your connected Google account.{' '}
            <a
              href="https://support.google.com/drive/answer/2494822"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline underline-offset-2"
            >
              How to find a folder link
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </p>
        </div>
      )}

      {/* Folder list */}
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      )}

      {!isLoading && syncedFolders && syncedFolders.length > 0 && (
        <div className="space-y-2" role="list" aria-label="Imported Drive folders">
          {syncedFolders.map((folder) => (
            <div key={folder.id} role="listitem">
              <SyncedFolderRow folder={folder} userId={userId} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!syncedFolders || syncedFolders.length === 0) && googleConnected && (
        <p className="text-sm text-muted-foreground">
          No folders added yet. Paste a Drive folder link above to get started.
        </p>
      )}
    </section>
  )
}

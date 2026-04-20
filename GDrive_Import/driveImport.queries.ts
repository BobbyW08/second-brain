// src/queries/driveImport.ts
// TanStack Query hooks for the Google Drive folder import feature.
// All mutations show Sonner toasts on success/error.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  addDriveSyncFolder,
  syncDriveFolder,
  removeDriveSyncFolder,
  getDriveSyncedFolders,
  getDriveFiles,
} from '@/server/driveImport'
import type { DriveFile, DriveSyncedFolder } from '@/types/DriveImport'

// ============================================================
// Query keys
// ============================================================

export const driveKeys = {
  syncedFolders: (userId: string) => ['drive', 'synced-folders', userId] as const,
  files: (userId: string, syncedFolderId: string) =>
    ['drive', 'files', userId, syncedFolderId] as const,
}

// ============================================================
// Queries
// ============================================================

export function useDriveSyncedFolders(userId: string) {
  return useQuery<DriveSyncedFolder[]>({
    queryKey: driveKeys.syncedFolders(userId),
    queryFn: () => getDriveSyncedFolders({ data: { userId } }),
    enabled: !!userId,
  })
}

export function useDriveFiles(userId: string, syncedFolderId: string) {
  return useQuery<DriveFile[]>({
    queryKey: driveKeys.files(userId, syncedFolderId),
    queryFn: () => getDriveFiles({ data: { userId, syncedFolderId } }),
    enabled: !!userId && !!syncedFolderId,
  })
}

// ============================================================
// Mutations
// ============================================================

export function useAddDriveSyncFolder(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (driveFolderIdOrUrl: string) =>
      addDriveSyncFolder({ data: { userId, driveFolderIdOrUrl } }),
    onSuccess: (newFolder) => {
      queryClient.invalidateQueries({ queryKey: driveKeys.syncedFolders(userId) })
      toast.success(`"${newFolder.name}" added. Syncing contents now…`)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not add the folder. Try again.')
    },
  })
}

export function useSyncDriveFolder(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (syncedFolderId: string) =>
      syncDriveFolder({ data: { userId, syncedFolderId } }),
    onSuccess: (result, syncedFolderId) => {
      queryClient.invalidateQueries({ queryKey: driveKeys.syncedFolders(userId) })
      queryClient.invalidateQueries({ queryKey: driveKeys.files(userId, syncedFolderId) })
      if (result.success) {
        toast.success(`Sync complete — ${result.filesUpserted} items updated.`)
      } else {
        toast.error(result.error || 'Sync encountered an issue.')
      }
    },
    onError: () => {
      toast.error('Sync encountered an issue. Try again.')
    },
  })
}

export function useRemoveDriveSyncFolder(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (syncedFolderId: string) =>
      removeDriveSyncFolder({ data: { userId, syncedFolderId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driveKeys.syncedFolders(userId) })
      toast.success('Folder removed from your file storage.')
    },
    onError: () => {
      toast.error('Could not remove the folder. Try again.')
    },
  })
}

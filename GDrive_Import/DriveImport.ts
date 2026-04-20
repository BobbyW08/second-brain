// src/types/DriveImport.ts
// Types for the Google Drive folder import feature.
// These extend database.types.ts — do not duplicate column names here,
// just add the shaped/derived types the components actually consume.

export type SyncStatus = 'pending' | 'syncing' | 'ready' | 'error'

export interface DriveSyncedFolder {
  id: string
  user_id: string
  drive_folder_id: string
  name: string
  last_synced_at: string | null
  sync_status: SyncStatus
  error_message: string | null
  created_at: string
}

export interface DriveFile {
  id: string
  user_id: string
  synced_folder_id: string
  drive_file_id: string
  drive_parent_id: string | null
  name: string
  mime_type: string
  is_folder: boolean
  size_bytes: number | null
  modified_at: string | null
  web_view_link: string | null
  icon_link: string | null
  created_at: string
}

// Shaped for the file tree renderer
export interface DriveFileNode extends DriveFile {
  children: DriveFileNode[]
}

// Raw item shape returned by the Google Drive API v3
export interface GoogleDriveApiFile {
  id: string
  name: string
  mimeType: string
  size?: string          // Drive returns size as a string
  modifiedTime?: string
  webViewLink?: string
  iconLink?: string
  parents?: string[]
}

export type DriveImportResult =
  | { success: true; filesUpserted: number }
  | { success: false; error: string }

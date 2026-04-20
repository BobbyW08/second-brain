// src/server/driveImport.ts
// Server functions for Google Drive folder import.
// All Google API calls use the user's stored OAuth tokens from the profiles table.
// SUPABASE_SERVICE_ROLE_KEY is used here — never expose this to the client.

import { createServerFn } from '@tanstack/start'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { DriveImportResult, GoogleDriveApiFile } from '@/types/DriveImport'

// ============================================================
// Internal helpers
// ============================================================

function getServiceClient() {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

/** Refresh the Google access token if it has expired. Returns a valid token. */
async function getFreshGoogleToken(userId: string): Promise<string> {
  const supabase = getServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', userId)
    .single()
    .throwOnError()

  if (!profile?.google_refresh_token) {
    throw new Error('Google account not connected. Connect Google from Settings to import Drive folders.')
  }

  const expiryMs = profile.google_token_expiry
    ? new Date(profile.google_token_expiry).getTime()
    : 0
  const isExpired = Date.now() > expiryMs - 60_000 // refresh 1 min early

  if (!isExpired && profile.google_access_token) {
    return profile.google_access_token
  }

  // Token is expired — refresh it
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: import.meta.env.GOOGLE_CLIENT_ID,
      client_secret: import.meta.env.GOOGLE_CLIENT_SECRET,
      refresh_token: profile.google_refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    throw new Error('Google token refresh failed. Please reconnect your Google account in Settings.')
  }

  const tokens = await res.json()
  const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await supabase
    .from('profiles')
    .update({
      google_access_token: tokens.access_token,
      google_token_expiry: newExpiry,
    })
    .eq('id', userId)
    .throwOnError()

  return tokens.access_token
}

/**
 * Fetch ALL files inside a Drive folder (including sub-folders) recursively.
 * Uses the Drive v3 files.list API with a parent query.
 * Returns a flat array — the tree is reconstructed client-side via drive_parent_id.
 */
async function fetchDriveFolderContentsRecursive(
  accessToken: string,
  rootFolderId: string
): Promise<GoogleDriveApiFile[]> {
  const all: GoogleDriveApiFile[] = []
  const queue: string[] = [rootFolderId]

  while (queue.length > 0) {
    const parentId = queue.shift()!
    let pageToken: string | undefined

    do {
      const params = new URLSearchParams({
        q: `'${parentId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, parents)',
        pageSize: '1000',
      })
      if (pageToken) params.set('pageToken', pageToken)

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Drive API error (${res.status}): ${body}`)
      }

      const json = await res.json()
      const files: GoogleDriveApiFile[] = json.files ?? []
      all.push(...files)

      // Queue sub-folders for recursive traversal
      for (const f of files) {
        if (f.mimeType === 'application/vnd.google-apps.folder') {
          queue.push(f.id)
        }
      }

      pageToken = json.nextPageToken
    } while (pageToken)
  }

  return all
}

/**
 * Fetch the metadata of a single Drive file/folder by ID.
 * Used to get the name of a folder the user wants to add.
 */
async function fetchDriveItemMeta(
  accessToken: string,
  driveId: string
): Promise<{ id: string; name: string; mimeType: string }> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveId}?fields=id,name,mimeType`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    if (res.status === 404) throw new Error('Folder not found. Check the Drive folder ID or URL.')
    throw new Error(`Drive API error (${res.status})`)
  }

  return res.json()
}

// ============================================================
// Public server functions
// ============================================================

/**
 * addDriveSyncFolder
 * Called from Settings when the user submits a Drive folder ID or URL.
 * - Validates the folder exists and is accessible
 * - Inserts a row into drive_synced_folders
 * - Returns the new row so the client can trigger a sync immediately
 */
export const addDriveSyncFolder = createServerFn({ method: 'POST' })
  .validator(z.object({
    userId: z.string().uuid(),
    driveFolderIdOrUrl: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const { userId, driveFolderIdOrUrl } = data

    // Extract the folder ID — support both raw IDs and Drive URLs
    // Drive folder URLs look like: https://drive.google.com/drive/folders/FOLDER_ID
    const folderIdMatch = driveFolderIdOrUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/)
    const driveFolderId = folderIdMatch ? folderIdMatch[1] : driveFolderIdOrUrl.trim()

    if (!driveFolderId || driveFolderId.length < 10) {
      throw new Error('Enter a valid Google Drive folder ID or URL.')
    }

    const accessToken = await getFreshGoogleToken(userId)
    const meta = await fetchDriveItemMeta(accessToken, driveFolderId)

    if (meta.mimeType !== 'application/vnd.google-apps.folder') {
      throw new Error('That link points to a file, not a folder. Share a folder link instead.')
    }

    const supabase = getServiceClient()
    const { data: row } = await supabase
      .from('drive_synced_folders')
      .upsert(
        {
          user_id: userId,
          drive_folder_id: driveFolderId,
          name: meta.name,
          sync_status: 'pending',
        },
        { onConflict: 'user_id, drive_folder_id' }
      )
      .select()
      .single()
      .throwOnError()

    return row
  })

/**
 * syncDriveFolder
 * Fetches all files inside the given Drive folder and upserts them
 * into drive_files. Marks sync_status = 'ready' when done.
 * Can be re-triggered from the Settings UI to refresh.
 */
export const syncDriveFolder = createServerFn({ method: 'POST' })
  .validator(z.object({
    userId: z.string().uuid(),
    syncedFolderId: z.string().uuid(), // PK from drive_synced_folders
  }))
  .handler(async ({ data }): Promise<DriveImportResult> => {
    const { userId, syncedFolderId } = data
    const supabase = getServiceClient()

    // Fetch the synced folder row to get the Drive folder ID
    const { data: syncedFolder } = await supabase
      .from('drive_synced_folders')
      .select('drive_folder_id')
      .eq('id', syncedFolderId)
      .eq('user_id', userId)
      .single()
      .throwOnError()

    if (!syncedFolder) throw new Error('Synced folder not found.')

    // Mark as syncing
    await supabase
      .from('drive_synced_folders')
      .update({ sync_status: 'syncing' })
      .eq('id', syncedFolderId)
      .throwOnError()

    try {
      const accessToken = await getFreshGoogleToken(userId)
      const driveFiles = await fetchDriveFolderContentsRecursive(
        accessToken,
        syncedFolder.drive_folder_id
      )

      // Map Drive API shape → drive_files table shape
      const rows = driveFiles.map((f) => ({
        user_id: userId,
        synced_folder_id: syncedFolderId,
        drive_file_id: f.id,
        drive_parent_id: f.parents?.[0] ?? null,
        name: f.name,
        mime_type: f.mimeType,
        size_bytes: f.size ? parseInt(f.size, 10) : null,
        modified_at: f.modifiedTime ?? null,
        web_view_link: f.webViewLink ?? null,
        icon_link: f.iconLink ?? null,
      }))

      if (rows.length > 0) {
        // Upsert in batches of 500 to stay within Supabase payload limits
        for (let i = 0; i < rows.length; i += 500) {
          await supabase
            .from('drive_files')
            .upsert(rows.slice(i, i + 500), { onConflict: 'user_id, drive_file_id' })
            .throwOnError()
        }
      }

      // Remove any stale files that are no longer in Drive
      const currentDriveIds = driveFiles.map((f) => f.id)
      if (currentDriveIds.length > 0) {
        await supabase
          .from('drive_files')
          .delete()
          .eq('synced_folder_id', syncedFolderId)
          .not('drive_file_id', 'in', `(${currentDriveIds.map((id) => `'${id}'`).join(',')})`)
          .throwOnError()
      }

      // Mark ready
      await supabase
        .from('drive_synced_folders')
        .update({
          sync_status: 'ready',
          last_synced_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', syncedFolderId)
        .throwOnError()

      return { success: true, filesUpserted: rows.length }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync encountered an issue.'
      await supabase
        .from('drive_synced_folders')
        .update({ sync_status: 'error', error_message: message })
        .eq('id', syncedFolderId)
        .throwOnError()
      return { success: false, error: message }
    }
  })

/**
 * removeDriveSyncFolder
 * Removes a synced folder and all its cached drive_files (cascaded by FK).
 */
export const removeDriveSyncFolder = createServerFn({ method: 'POST' })
  .validator(z.object({
    userId: z.string().uuid(),
    syncedFolderId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServiceClient()
    await supabase
      .from('drive_synced_folders')
      .delete()
      .eq('id', data.syncedFolderId)
      .eq('user_id', data.userId)
      .throwOnError()
    return { success: true }
  })

/**
 * getDriveSyncedFolders
 * Returns all synced folder rows for the current user.
 */
export const getDriveSyncedFolders = createServerFn({ method: 'GET' })
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getServiceClient()
    const { data: rows } = await supabase
      .from('drive_synced_folders')
      .select('*')
      .eq('user_id', data.userId)
      .order('created_at', { ascending: true })
      .throwOnError()
    return rows ?? []
  })

/**
 * getDriveFiles
 * Returns all cached drive_files for a given synced folder.
 * The client builds the tree from drive_parent_id.
 */
export const getDriveFiles = createServerFn({ method: 'GET' })
  .validator(z.object({
    userId: z.string().uuid(),
    syncedFolderId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServiceClient()
    const { data: rows } = await supabase
      .from('drive_files')
      .select('*')
      .eq('user_id', data.userId)
      .eq('synced_folder_id', data.syncedFolderId)
      .order('is_folder', { ascending: false }) // folders first
      .order('name', { ascending: true })
      .throwOnError()
    return rows ?? []
  })

-- ============================================================
-- Migration: Google Drive Folder Import
-- Run this in the Supabase SQL editor AFTER the base schema
-- from Ticket 1-A is already applied.
-- ============================================================

-- drive_synced_folders: folders the user has chosen to import from Google Drive
create table drive_synced_folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  drive_folder_id text not null,         -- Google Drive folder ID
  name text not null,                    -- Display name (fetched from Drive)
  last_synced_at timestamptz,            -- null = never synced yet
  sync_status text default 'pending',    -- 'pending' | 'syncing' | 'ready' | 'error'
  error_message text,
  created_at timestamptz default now(),
  -- One row per (user, Drive folder) — no duplicates
  unique (user_id, drive_folder_id)
);

-- drive_files: cached file/folder metadata fetched from Google Drive
create table drive_files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  synced_folder_id uuid references drive_synced_folders(id) on delete cascade,
  drive_file_id text not null,           -- Google Drive file ID
  drive_parent_id text,                  -- Drive ID of the parent (null = root of synced folder)
  name text not null,
  mime_type text not null,               -- e.g. 'application/vnd.google-apps.folder'
  is_folder boolean generated always as (mime_type = 'application/vnd.google-apps.folder') stored,
  size_bytes bigint,                     -- null for Google Workspace docs
  modified_at timestamptz,
  web_view_link text,                    -- Link to open in Drive
  icon_link text,
  created_at timestamptz default now(),
  -- One row per (user, Drive file)
  unique (user_id, drive_file_id)
);

-- ============================================================
-- Indexes
-- ============================================================

create index drive_synced_folders_user_id_idx on drive_synced_folders(user_id);
create index drive_files_user_id_idx on drive_files(user_id);
create index drive_files_synced_folder_id_idx on drive_files(synced_folder_id);
create index drive_files_drive_parent_id_idx on drive_files(drive_parent_id);

-- ============================================================
-- RLS
-- ============================================================

alter table drive_synced_folders enable row level security;
alter table drive_files enable row level security;

create policy "Users can only access their own synced folders"
  on drive_synced_folders for all using (auth.uid() = user_id);

create policy "Users can only access their own drive files"
  on drive_files for all using (auth.uid() = user_id);

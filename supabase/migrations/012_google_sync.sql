-- ============================================================================
-- Migration: Create event_mappings table for two-way Google Calendar sync
-- References: cal-sync backend/app/models/event_mapping.py
-- ============================================================================

-- event_mappings table
create table if not exists public.event_mappings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  local_block_id    uuid references public.calendar_blocks(id) on delete set null,
  google_event_id   text not null,
  google_calendar_id text not null default 'primary',
  sync_cluster_id   uuid not null default gen_random_uuid(),
  content_hash      text,
  origin            text not null check (origin in ('local', 'google')),
  last_synced_at    timestamptz,
  created_at        timestamptz not null default now()
);

-- Indexes
create unique index if not exists idx_event_mappings_user_google
  on public.event_mappings (user_id, google_event_id);

create index if not exists idx_event_mappings_user_block
  on public.event_mappings (user_id, local_block_id);

create index if not exists idx_event_mappings_cluster
  on public.event_mappings (sync_cluster_id);

-- Ensure calendar_blocks has the columns we need (should already exist, but guard)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'calendar_blocks' and column_name = 'google_event_id'
  ) then
    alter table public.calendar_blocks add column google_event_id text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'calendar_blocks' and column_name = 'is_google_synced'
  ) then
    alter table public.calendar_blocks add column is_google_synced boolean not null default false;
  end if;
end $$;

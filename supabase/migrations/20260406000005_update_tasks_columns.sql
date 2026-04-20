-- ============================================================
-- Migration 2: Add new columns to tasks table
-- ============================================================

-- Add new columns to tasks table
alter table public.tasks
  add column if not exists description text,
  add column if not exists color text,
  add column if not exists labels text[] default '{}',
  add column if not exists location text,
  add column if not exists attendees jsonb default '[]',
  add column if not exists recurring text default 'none',
  add column if not exists bucket_id uuid references public.buckets(id) on delete set null;

-- Add comment explaining bucket_id vs priority
comment on column public.tasks.bucket_id is 
  'Reference to bucket. This is the source of truth for task placement. The priority column remains for backward compatibility.';
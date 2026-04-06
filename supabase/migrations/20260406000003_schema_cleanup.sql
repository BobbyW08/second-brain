-- ============================================================
-- Schema cleanup — fix inconsistencies found in audit
-- ============================================================

-- 1. Drop redundant user_id column from profiles.
--    profiles.id IS the auth user id (used by RLS, trigger, and all app code).
--    user_id was a leftover from the starter template and is never set or read.
--    The starter template created RLS policies referencing user_id — drop them
--    first, then drop the column. Our correct policies (using id) were added in
--    migration 20260406000001 and remain in place.
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

alter table public.profiles drop column if exists user_id;

-- 2. Harden tasks.status — should never be null.
--    Default 'active' already exists; add NOT NULL to match app invariant.
alter table public.tasks alter column status set not null;

-- 3. Add updated_at to folders (missing unlike all other content tables).
alter table public.folders
  add column if not exists updated_at timestamptz default now() not null;

create trigger set_folders_updated_at
  before update on public.folders
  for each row execute function public.set_updated_at();

-- 4. Add updated_at to tables_schema (same omission as folders).
alter table public.tables_schema
  add column if not exists updated_at timestamptz default now() not null;

create trigger set_tables_schema_updated_at
  before update on public.tables_schema
  for each row execute function public.set_updated_at();

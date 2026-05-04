-- ============================================================================
-- Migration: Add Google OAuth token columns to profiles table
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'google_access_token'
  ) then
    alter table public.profiles add column google_access_token text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'google_refresh_token'
  ) then
    alter table public.profiles add column google_refresh_token text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'google_token_expiry'
  ) then
    alter table public.profiles add column google_token_expiry timestamptz;
  end if;
end $$;

-- ============================================================================
-- Migration: Add Google OAuth token columns to profiles table
-- Applied to production: May 4, 2026
-- ============================================================================

alter table public.profiles
  add column if not exists google_access_token text,
  add column if not exists google_refresh_token text,
  add column if not exists google_token_expiry timestamptz;

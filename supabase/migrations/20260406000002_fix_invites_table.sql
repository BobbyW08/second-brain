-- ============================================================
-- Fix invites table — replace old schema with Second Brain schema
-- The table was pre-existing from the starter template with
-- different column names. Drop and recreate cleanly.
-- ============================================================

-- Drop dependent functions from old starter template first
drop function if exists public.validate_invite_token(text);
drop function if exists public.accept_invite(text);

drop table if exists public.invites;

create table public.invites (
  id          uuid default gen_random_uuid() primary key,
  email       text not null unique,
  token       text not null unique,
  invited_by  uuid references public.profiles(id),
  expires_at  timestamptz default (now() + interval '7 days') not null,
  used        boolean default false not null,
  created_at  timestamptz default now() not null
);

alter table public.invites enable row level security;

-- Invites are managed server-side via service role key only.
-- No client-side RLS policy needed.

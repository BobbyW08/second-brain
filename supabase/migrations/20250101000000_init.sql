-- ============================================================
-- Second Brain — Full Schema
-- ============================================================

-- ─────────────────────────────────────────────
-- profiles: extended user data
-- ─────────────────────────────────────────────
create table public.profiles (
  id                   uuid references auth.users on delete cascade primary key,
  email                text not null,
  display_name         text,
  avatar_url           text,
  google_access_token  text,
  google_refresh_token text,
  google_token_expiry  timestamptz,
  google_calendar_id   text,
  tone_preference      text default 'encouraging',
  ai_usage_count       integer default 0,
  created_at           timestamptz default now() not null,
  updated_at           timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- folders: nested hierarchy for pages
-- ─────────────────────────────────────────────
create table public.folders (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  parent_id  uuid references public.folders(id) on delete cascade,
  name       text not null,
  icon       text,
  position   integer default 0,
  created_at timestamptz default now() not null
);

alter table public.folders enable row level security;

create policy "Users can manage own folders"
  on public.folders for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- pages: rich text content nodes
-- ─────────────────────────────────────────────
create table public.pages (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  folder_id    uuid references public.folders(id) on delete set null,
  title        text not null default 'Untitled',
  content      jsonb,
  page_type    text default 'page',
  journal_date date,
  is_pinned    boolean default false,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

alter table public.pages enable row level security;

create policy "Users can manage own pages"
  on public.pages for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- tasks: priority bucket items
-- ─────────────────────────────────────────────
create table public.tasks (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  title        text not null,
  priority     text not null,
  block_size   text not null default 'M',
  status       text default 'active',
  completed_at timestamptz,
  position     integer default 0,
  notes        jsonb,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

alter table public.tasks enable row level security;

create policy "Users can manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- calendar_blocks: scheduled time slots
-- ─────────────────────────────────────────────
create table public.calendar_blocks (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  task_id         uuid references public.tasks(id) on delete set null,
  title           text not null,
  start_time      timestamptz not null,
  end_time        timestamptz not null,
  block_type      text default 'task',
  google_event_id text,
  color           text,
  is_synced       boolean default false,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

alter table public.calendar_blocks enable row level security;

create policy "Users can manage own calendar blocks"
  on public.calendar_blocks for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- tables_schema: dynamic field tables
-- ─────────────────────────────────────────────
create table public.tables_schema (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  folder_id  uuid references public.folders(id) on delete set null,
  name       text not null,
  columns    jsonb not null default '[]',
  created_at timestamptz default now() not null
);

alter table public.tables_schema enable row level security;

create policy "Users can manage own tables"
  on public.tables_schema for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- table_rows: rows for dynamic tables
-- ─────────────────────────────────────────────
create table public.table_rows (
  id         uuid default gen_random_uuid() primary key,
  table_id   uuid references public.tables_schema(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  data       jsonb not null default '{}',
  notes      jsonb,
  position   integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.table_rows enable row level security;

create policy "Users can manage own table rows"
  on public.table_rows for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- links: bidirectional page/item linking
-- ─────────────────────────────────────────────
create table public.links (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  source_type text not null,
  source_id   uuid not null,
  target_type text not null,
  target_id   uuid not null,
  created_at  timestamptz default now() not null
);

alter table public.links enable row level security;

create policy "Users can manage own links"
  on public.links for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- invites: admin-issued invite tokens
-- ─────────────────────────────────────────────
create table public.invites (
  id          uuid default gen_random_uuid() primary key,
  email       text not null unique,
  token       text not null unique,
  used        boolean default false,
  invited_by  uuid references public.profiles(id),
  created_at  timestamptz default now() not null,
  expires_at  timestamptz default (now() + interval '7 days') not null
);

alter table public.invites enable row level security;

-- Only admins write to invites; no user self-service RLS needed
-- Invite validation is done server-side via service role key

-- ─────────────────────────────────────────────
-- ai_usage: per-user AI consumption tracking
-- ─────────────────────────────────────────────
create table public.ai_usage (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  feature     text not null,
  tokens_used integer,
  created_at  timestamptz default now() not null
);

alter table public.ai_usage enable row level security;

create policy "Users can manage own AI usage"
  on public.ai_usage for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- updated_at trigger (shared function)
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_pages_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger set_calendar_blocks_updated_at
  before update on public.calendar_blocks
  for each row execute function public.set_updated_at();

create trigger set_table_rows_updated_at
  before update on public.table_rows
  for each row execute function public.set_updated_at();

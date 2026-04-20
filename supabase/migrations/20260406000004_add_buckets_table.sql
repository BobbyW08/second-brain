-- ============================================================
-- Migration 1: Create buckets table + update handle_new_user trigger
-- ============================================================

-- Create buckets table
create table if not exists public.buckets (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  name       text not null,
  position   integer default 0,
  color      text,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.buckets enable row level security;

-- Create policy for buckets
create policy "Users can only access their own buckets"
  on public.buckets for all
  using (auth.uid() = user_id);

-- Add updated_at column and trigger
alter table public.buckets
  add column if not exists updated_at timestamptz default now() not null;

create trigger set_buckets_updated_at
  before update on public.buckets
  for each row execute function public.set_updated_at();

-- Update handle_new_user trigger to create default buckets and Journal folder
create or replace function public.handle_new_user()
returns trigger language plpgsql
security definer set search_path = ''
as $$
declare
  journal_folder_id uuid;
begin
  -- Insert or update profile information
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email      = excluded.email,
    avatar_url = excluded.avatar_url;
    
  -- Create default buckets for the new user
  insert into public.buckets (user_id, name, position, color)
  values
    (new.id, 'Urgent', 0, '#E05555'),
    (new.id, 'Important', 1, '#D4943A'),
    (new.id, 'Someday', 2, '#3A8FD4'),
    (new.id, 'Unsorted', 3, '#666672');
    
  -- Create Journal folder
  insert into public.folders (user_id, name, position)
  values (new.id, 'Journal', 0)
  returning id into journal_folder_id;
  
  return new;
end;
$$;
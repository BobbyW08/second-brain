-- Migration: Add start_time and end_time to tasks table
-- These fields support chrono-node free-text date parsing in TaskCard

alter table public.tasks
  add column if not exists start_time timestamptz,
  add column if not exists end_time timestamptz;

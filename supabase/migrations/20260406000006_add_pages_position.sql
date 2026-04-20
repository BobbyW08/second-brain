-- ============================================================
-- Migration 3: Add position column to pages
-- ============================================================

-- Add position column to pages table
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;
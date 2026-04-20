-- ============================================================
-- Migration 4: Add linked_page_id column to calendar_blocks
-- ============================================================

-- Add linked_page_id column to calendar_blocks table
ALTER TABLE public.calendar_blocks ADD COLUMN IF NOT EXISTS linked_page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL;
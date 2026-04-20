-- ============================================================
-- Migration 5: Add unique constraint on calendar_blocks.google_event_id
-- ============================================================

-- Add unique constraint on google_event_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'calendar_blocks_google_event_id_unique'
    ) THEN
        ALTER TABLE public.calendar_blocks ADD CONSTRAINT calendar_blocks_google_event_id_unique UNIQUE (google_event_id);
    END IF;
END $$;

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT calendar_blocks_google_event_id_unique ON public.calendar_blocks IS 
  'Required for Google Calendar upsert sync to work. Without it the ON CONFLICT clause in the upsert has no column to conflict on.';
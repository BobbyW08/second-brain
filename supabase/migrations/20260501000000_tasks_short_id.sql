-- Add short_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS short_id text UNIQUE;

-- Backfill existing tasks with 7-character unique IDs
UPDATE tasks SET short_id = left(replace(gen_random_uuid()::text, '-', ''), 7)
  WHERE short_id IS NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_short_id ON tasks(short_id);

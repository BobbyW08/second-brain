-- Add fields needed for Phase 4

-- due_at field for task due dates
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_at timestamptz;

-- google_event_id for calendar integration
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_event_id text;

-- parent_task_id for subtasks (4F)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES tasks(id);

-- Add index for parent_task_id
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

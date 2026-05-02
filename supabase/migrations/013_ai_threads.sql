-- supabase/migrations/013_ai_threads.sql
CREATE TABLE ai_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text,
  messages jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own threads"
  ON ai_threads FOR ALL
  USING (auth.uid() = user_id);

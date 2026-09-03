ALTER TABLE weekly_boq_controls
ADD COLUMN IF NOT EXISTS manual_tables JSONB NOT NULL DEFAULT '{}'::jsonb;

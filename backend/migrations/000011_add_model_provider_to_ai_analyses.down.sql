DROP INDEX IF EXISTS idx_ai_analyses_model_provider;

ALTER TABLE ai_analyses
DROP COLUMN IF EXISTS model_provider;

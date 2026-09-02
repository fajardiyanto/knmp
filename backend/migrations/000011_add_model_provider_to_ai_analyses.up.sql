ALTER TABLE ai_analyses
ADD COLUMN IF NOT EXISTS model_provider VARCHAR(30) NOT NULL DEFAULT 'rule_based';

CREATE INDEX IF NOT EXISTS idx_ai_analyses_model_provider ON ai_analyses(model_provider);

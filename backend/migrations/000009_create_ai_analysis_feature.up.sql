CREATE TABLE IF NOT EXISTS ai_analyses (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT REFERENCES knmps(id) ON DELETE SET NULL,
    assigned_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    submitted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    source_channel VARCHAR(30) NOT NULL DEFAULT 'web',
    source_sender VARCHAR(255) NULL,
    model_provider VARCHAR(30) NOT NULL DEFAULT 'rule_based',
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    input_text TEXT NULL,
    extracted_text TEXT NULL,
    risk_level VARCHAR(30) NOT NULL DEFAULT 'rendah',
    risk_score INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'perlu_review',
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_knmp ON ai_analyses(knmp_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_assigned_user ON ai_analyses(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_channel ON ai_analyses(source_channel);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_risk ON ai_analyses(risk_level, risk_score);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at);

INSERT INTO permissions (name, guard_name, created_at, updated_at)
VALUES
    ('ai_analysis_create', 'api', NOW(), NOW()),
    ('ai_analysis_read', 'api', NOW(), NOW()),
    ('ai_analysis_update', 'api', NOW(), NOW()),
    ('ai_analysis_delete', 'api', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_has_permissions (permission_id, role_id)
SELECT p.id, r.id
FROM permissions p
JOIN roles r ON r.name IN ('superadmin', 'super_admin', 'admin_ppk', 'admin', 'pengawas', 'wakil_ppk', 'ppk', 'kontraktor')
WHERE p.name IN ('ai_analysis_create', 'ai_analysis_read')
ON CONFLICT DO NOTHING;

INSERT INTO role_has_permissions (permission_id, role_id)
SELECT p.id, r.id
FROM permissions p
JOIN roles r ON r.name IN ('superadmin', 'super_admin', 'admin_ppk', 'admin', 'pengawas', 'wakil_ppk', 'ppk')
WHERE p.name IN ('ai_analysis_update', 'ai_analysis_delete')
ON CONFLICT DO NOTHING;

-- Users with assigned KNMP locations are scoped admins.
-- Keep their menu access explicit so admin_ppk role does not imply global access.

CREATE TABLE IF NOT EXISTS model_has_permissions (
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    model_type VARCHAR(150) NOT NULL DEFAULT 'App\\Models\\User',
    model_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (permission_id, model_id, model_type)
);

INSERT INTO permissions (name, guard_name, created_at, updated_at)
VALUES
('chat', 'api', NOW(), NOW()),
('anggaran_read', 'api', NOW(), NOW()),
('termin_read', 'api', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO model_has_permissions (permission_id, model_type, model_id)
SELECT DISTINCT p.id, 'App\\Models\\User', u.id
FROM users u
JOIN user_knmps uk ON uk.user_id = u.id
JOIN model_has_roles mhr ON mhr.model_id = u.id
JOIN roles r ON r.id = mhr.role_id
JOIN permissions p ON p.name IN (
    'dashboard',
    'chat',
    'kontrak_read',
    'lapangan_read',
    'pelaksanaan_read',
    'laporan_read',
    'anggaran_read',
    'termin_read',
    'absensi_read',
    'issue_read'
)
WHERE LOWER(r.name) IN ('admin_ppk', 'admin')
ON CONFLICT (permission_id, model_id, model_type) DO NOTHING;

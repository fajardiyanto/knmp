CREATE TABLE IF NOT EXISTS weekly_boq_controls (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT NOT NULL REFERENCES knmps(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    source_document TEXT NULL,
    contractor_claim_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
    supervisor_verified_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
    evidence_supported_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
    audit_exposure_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    summary TEXT NOT NULL DEFAULT '',
    manual_tables JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS weekly_boq_items (
    id BIGSERIAL PRIMARY KEY,
    boq_control_id BIGINT NOT NULL REFERENCES weekly_boq_controls(id) ON DELETE CASCADE,
    item_code VARCHAR(80) NOT NULL DEFAULT '',
    item_name VARCHAR(255) NOT NULL,
    contract_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    weight_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
    contract_volume NUMERIC(18,4) NOT NULL DEFAULT 0,
    unit VARCHAR(40) NOT NULL DEFAULT '',
    plan_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
    last_week_actual_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
    contractor_claim_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
    supervisor_verified_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
    evidence_supported_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
    deviation_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
    actual_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    evidence_status VARCHAR(30) NOT NULL DEFAULT 'missing',
    risk_level VARCHAR(30) NOT NULL DEFAULT 'rendah',
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_weekly_boq_controls_knmp ON weekly_boq_controls(knmp_id);
CREATE INDEX IF NOT EXISTS idx_weekly_boq_controls_period ON weekly_boq_controls(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_weekly_boq_controls_status ON weekly_boq_controls(status);
CREATE INDEX IF NOT EXISTS idx_weekly_boq_items_control ON weekly_boq_items(boq_control_id);
CREATE INDEX IF NOT EXISTS idx_weekly_boq_items_risk ON weekly_boq_items(risk_level);

INSERT INTO permissions (name, guard_name, created_at, updated_at)
VALUES
    ('boq_create', 'api', NOW(), NOW()),
    ('boq_read', 'api', NOW(), NOW()),
    ('boq_update', 'api', NOW(), NOW()),
    ('boq_delete', 'api', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_has_permissions (permission_id, role_id)
SELECT p.id, r.id
FROM permissions p
JOIN roles r ON r.name IN ('superadmin', 'super_admin', 'admin_ppk', 'admin', 'pengawas', 'wakil_ppk', 'ppk', 'kontraktor')
WHERE p.name IN ('boq_create', 'boq_read')
ON CONFLICT DO NOTHING;

INSERT INTO role_has_permissions (permission_id, role_id)
SELECT p.id, r.id
FROM permissions p
JOIN roles r ON r.name IN ('superadmin', 'super_admin', 'admin_ppk', 'admin', 'pengawas', 'wakil_ppk', 'ppk')
WHERE p.name IN ('boq_update', 'boq_delete')
ON CONFLICT DO NOTHING;

INSERT INTO model_has_permissions (permission_id, model_type, model_id)
SELECT p.id, 'App\Models\User', u.id
FROM permissions p
CROSS JOIN users u
WHERE p.name IN ('boq_create', 'boq_read', 'boq_update', 'boq_delete')
  AND EXISTS (
      SELECT 1
      FROM model_has_roles mhr
      JOIN roles r ON r.id = mhr.role_id
      WHERE mhr.model_id = u.id
        AND LOWER(r.name) IN ('superadmin', 'super_admin')
  )
ON CONFLICT DO NOTHING;

INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at)
SELECT 'KNMP Pematang Sei Baru', 'penyangga', '3.022000', '99.835000', 'on_track', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM knmps WHERE name ILIKE '%Pematang Sei Baru%'
);

WITH target_knmp AS (
    SELECT id
    FROM knmps
    WHERE name ILIKE '%Pematang Sei Baru%'
    ORDER BY id
    LIMIT 1
), inserted_control AS (
    INSERT INTO weekly_boq_controls (
        knmp_id, week_start, week_end, title, source_document,
        contractor_claim_pct, supervisor_verified_pct, evidence_supported_pct,
        audit_exposure_value, status, summary, created_at, updated_at
    )
    SELECT
        id,
        DATE '2026-08-25',
        DATE '2026-08-31',
        'Kontrol BOQ Mingguan - Pemantauan Itjen Asahan',
        'data/signed__Hasil_Pemantauan_Pekerjaan_Konstruksi_Pembangunan_Kampung_Nelayan_Merah_Putih_Desa_Pematang_Sei_Baru_Kabupaten_Asahan_Provinsi_Sumatera_Utara_20260902062128.pdf',
        93.39,
        90.13,
        90.13,
        328400000,
        'open',
        'Hasil pemantauan Itjen menunjukkan klaim progres kontraktor 93,39% sedangkan hasil pengukuran lapangan 90,13%. Selisih 3,26% bernilai sekitar Rp328,4 juta sehingga progres harus dikunci ke verified progress berbasis volume terpasang dan evidence.',
        NOW(),
        NOW()
    FROM target_knmp
    WHERE NOT EXISTS (
        SELECT 1 FROM weekly_boq_controls
        WHERE title = 'Kontrol BOQ Mingguan - Pemantauan Itjen Asahan'
          AND deleted_at IS NULL
    )
    RETURNING id
)
INSERT INTO weekly_boq_items (
    boq_control_id, item_code, item_name, contract_value, weight_pct,
    contract_volume, unit, plan_pct, last_week_actual_pct, contractor_claim_pct,
    supervisor_verified_pct, evidence_supported_pct, deviation_pct, actual_value,
    evidence_status, risk_level, notes, created_at, updated_at
)
SELECT id, item_code, item_name, contract_value, weight_pct, contract_volume, unit,
       plan_pct, last_week_actual_pct, contractor_claim_pct, supervisor_verified_pct,
       evidence_supported_pct, deviation_pct, actual_value, evidence_status, risk_level, notes, NOW(), NOW()
FROM inserted_control
CROSS JOIN (
    VALUES
        ('ITJEN-01', 'Progress fisik terpasang vs klaim kontraktor', 10073619631.00, 100.00, 100.0000, '%', 93.39, 85.00, 93.39, 90.13, 90.13, -3.26, 9079400000.00, 'partial', 'kritis', 'Gap 3,26% dari klaim kontraktor perlu dikunci sebagai audit exposure sampai backup volume lengkap.'),
        ('QC-01', 'Dokumen uji mutu beton dan slump test', 0.00, 0.00, 0.0000, 'dok', 100.00, 60.00, 70.00, 55.00, 45.00, -55.00, 0.00, 'missing', 'kritis', 'Itjen menyoroti bukti mutu yang belum lengkap untuk pekerjaan beton.'),
        ('MAT-01', 'Kesesuaian spesifikasi material strategis', 0.00, 0.00, 0.0000, 'set', 100.00, 80.00, 90.00, 75.00, 70.00, -30.00, 0.00, 'partial', 'sedang', 'Kontrol 3-way match diperlukan antara spesifikasi BOQ, approval material, dan material terpasang.'),
        ('DOC-01', 'Kelengkapan drawing, measurement sheet, dan as-built', 0.00, 0.00, 0.0000, 'dok', 100.00, 50.00, 65.00, 50.00, 40.00, -60.00, 0.00, 'missing', 'kritis', 'Dokumen backup volume dan as-built harus dilengkapi sebelum progress diakui penuh.')
) AS seed(item_code, item_name, contract_value, weight_pct, contract_volume, unit, plan_pct, last_week_actual_pct, contractor_claim_pct, supervisor_verified_pct, evidence_supported_pct, deviation_pct, actual_value, evidence_status, risk_level, notes);

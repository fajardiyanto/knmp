-- 000008_make_persiapans_knmp_nullable_and_seed.up.sql

ALTER TABLE persiapans ALTER COLUMN knmp_id DROP NOT NULL;

-- Seed contract readiness data (matching staging screenshot)
DELETE FROM persiapans WHERE jenis = 'kontrak';

INSERT INTO persiapans (knmp_id, user_id, nama, tanggal, jenis, keterangan, created_at, updated_at)
VALUES
(NULL, 1, 'Survey KNMP PENYANGGA', '2026-07-19', 'kontrak', '-', NOW(), NOW()),
(NULL, 1, 'Survey KNMP HUM', '2026-07-19', 'kontrak', '-', NOW(), NOW()),
(NULL, 1, 'Survey TEST', '2026-07-20', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Sungai%' LIMIT 1), 1, 'PT. Sadatani Jaya Tama', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Batam%' LIMIT 1), 1, 'CV. Kalika Berkah', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Rebo%' LIMIT 1), 1, 'PT. Indo Jaya Negara Abadi', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Mapur%' OR name ILIKE '%Tanjung%' LIMIT 1), 1, 'PT. Indo Jaya Negara Abadi', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Batu%' OR name ILIKE '%Bagan%' LIMIT 1), 1, 'PT. Duta Bangun Husaemi', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Belibak%' OR name ILIKE '%Kedai%' LIMIT 1), 1, 'CV. Pulau Tenggol', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Pasak%' OR name ILIKE '%Pasar%' LIMIT 1), 1, 'PT. Kalman Infra Perkasa', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Kelambir%' LIMIT 1), 1, 'PT. Bahari Sejahtera', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Sabaji%' LIMIT 1), 1, 'CV. Samudra Utama', '2026-08-26', 'kontrak', '-', NOW(), NOW());

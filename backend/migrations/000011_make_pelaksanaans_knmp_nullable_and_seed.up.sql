-- 000011_make_pelaksanaans_knmp_nullable_and_seed.up.sql

ALTER TABLE pelaksanaans ALTER COLUMN knmp_id DROP NOT NULL;

DELETE FROM pelaksanaans;

INSERT INTO pelaksanaans (knmp_id, user_id, nama, tanggal, keterangan, created_at, updated_at)
VALUES
(NULL, 1, 'KNMP HUB', '2026-07-29', '-', NOW(), NOW()),
(NULL, 1, 'KNMP PENYANGGA', '2026-07-29', '-', NOW(), NOW()),
(NULL, 1, 'KNMP HUB DEMO', '2026-07-31', '-', NOW(), NOW()),
(NULL, 1, 'KNMP PENYANGGA DEMO', '2026-07-31', '-', NOW(), NOW()),
(NULL, 1, 'PELAKSANAAN KNMP TEST', '2026-08-11', 'hanya untuk test', NOW(), NOW());

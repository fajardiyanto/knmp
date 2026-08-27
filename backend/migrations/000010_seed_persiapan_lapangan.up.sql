-- 000010_seed_persiapan_lapangan.up.sql

INSERT INTO persiapans (knmp_id, user_id, nama, tanggal, jenis, keterangan, created_at, updated_at)
VALUES
(NULL, 1, 'Test', '2026-07-30', 'lapangan', '-', NOW(), NOW());

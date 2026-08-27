-- 000018_seed_periode_2026.up.sql

DELETE FROM periodes;

INSERT INTO periodes (year, tanggal_mulai, tanggal_akhir, created_at, updated_at)
VALUES (2026, '2026-01-01', '2026-12-31', NOW(), NOW());

-- 000015_seed_absensi_sample.up.sql

DELETE FROM absensis;

INSERT INTO absensis (pelaksanaan_id, user_id, tipe_absensi, recorded_at, lat, long, status, created_by, created_at, updated_at)
VALUES
(
    COALESCE((SELECT id FROM pelaksanaans WHERE nama ILIKE '%PENYANGGA%' LIMIT 1), 1),
    1,
    'hadir',
    '2026-07-29 01:00:00',
    '-6.297813',
    '106.745827',
    'menunggu_pengawas',
    1,
    '2026-07-29 01:00:00',
    NOW()
);

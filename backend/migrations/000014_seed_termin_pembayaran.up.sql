-- 000014_seed_termin_pembayaran.up.sql

DELETE FROM pembayarans;

INSERT INTO pembayarans (persiapan_kontrak_id, kategori, name, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
VALUES
(
    COALESCE((SELECT id FROM persiapans WHERE nama ILIKE '%PENYANGGA%' LIMIT 1), 1),
    'Termin',
    'Test',
    'Termin 1',
    20000000.00,
    25.00,
    '123-456-7890',
    NOW(),
    NOW()
),
(
    COALESCE((SELECT id FROM persiapans WHERE nama ILIKE '%HUB%' AND nama NOT ILIKE '%DEMO%' LIMIT 1), 1),
    'Termin',
    'Termin 1',
    'Termin 1',
    100000000.00,
    25.00,
    '987-654-3210',
    NOW(),
    NOW()
),
(
    COALESCE((SELECT id FROM persiapans WHERE jenis = 'kontrak' LIMIT 1), 1),
    'Anggaran',
    'Anggaran Survey',
    'Termin 1',
    800000000.00,
    20.00,
    '111-222-3333',
    NOW(),
    NOW()
);

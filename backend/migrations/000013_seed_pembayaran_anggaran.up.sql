-- 000013_seed_pembayaran_anggaran.up.sql

DELETE FROM pembayarans;

INSERT INTO pembayarans (persiapan_kontrak_id, kategori, name, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
VALUES
(
    COALESCE((SELECT id FROM persiapans WHERE jenis = 'kontrak' LIMIT 1), 1),
    'Anggaran',
    'Anggaran Survey',
    'Termin 1',
    800000000.00,
    20.00,
    '123-456-7890',
    NOW(),
    NOW()
);

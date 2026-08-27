-- 000012_seed_8_laporans.up.sql

DELETE FROM laporans;

INSERT INTO laporans (pelaksanaan_id, user_id, nama, tanggal, jenis_laporan, keberapa, cuaca, jumlah_tenaga_kerja, rencana_progres_fisik, realisasi_progres_fisik, status, keterangan, created_at, updated_at)
VALUES
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%PENYANGGA DEMO%' LIMIT 1), 1, 'Kontraktor', '2026-07-29', 'mingguan', 1, 'berawan', 2, 25.00, 49.00, 'menunggu_wakil_ppk', 'kegiatan', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%HUB%' AND nama NOT ILIKE '%DEMO%' LIMIT 1), 1, 'Laporan', '2026-07-30', 'mingguan', 2, 'cerah', 5, 20.00, 15.00, 'baru', '-', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%HUB%' AND nama NOT ILIKE '%DEMO%' LIMIT 1), 1, 'Kontraktor', '2026-07-30', 'harian', NULL, 'cerah', 12, 10.00, 11.00, 'baru', 'Bangunan 2 kegiatan hari ini adalah perm...', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%PENYANGGA%' AND nama NOT ILIKE '%DEMO%' LIMIT 1), 1, 'Kontraktor', '2026-07-30', 'mingguan', 1, 'cerah', 1, 15.00, 15.00, 'menunggu_pengawas', 'Bangunan 5 | Bangunan 4 | Bangunan 2', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%TEST%' LIMIT 1), 1, 'Kontraktor', '2026-07-07', 'harian', NULL, 'cerah', 200, 30.00, 19.73, 'baru', '- -', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%PENYANGGA%' AND nama NOT ILIKE '%DEMO%' LIMIT 1), 1, 'MINGGUAN TEST', '2026-08-24', 'bulanan', 2, 'berawan', 20, 40.00, 60.00, 'menunggu_pengawas', 'test', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%HUB DEMO%' LIMIT 1), 1, 'LAPORAN HARIAN TEST', '2026-08-24', 'harian', 1, 'berawan', 1000, 20.00, 45.50, 'menunggu_wakil_ppk', '10', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%TEST%' LIMIT 1), 1, 'Kontraktor', '2026-08-28', 'mingguan', 1, 'cerah', 10, 50.00, 49.77, 'baru', 'gokil', NOW(), NOW());

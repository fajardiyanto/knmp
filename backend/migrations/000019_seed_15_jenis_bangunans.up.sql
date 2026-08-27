-- 000019_seed_15_jenis_bangunans.up.sql

DELETE FROM jenis_bangunans;

INSERT INTO jenis_bangunans (id, nama, deskripsi, is_active, created_at, updated_at)
VALUES
(1, 'Gedung 1', NULL, true, NOW(), NOW()),
(2, 'Gedung 34', 'fws', true, NOW(), NOW()),
(3, 'Gedung 2', NULL, true, NOW(), NOW()),
(4, 'Gedung 4', NULL, true, NOW(), NOW()),
(5, 'Gedung 5', NULL, true, NOW(), NOW()),
(6, 'Gedung 6', NULL, true, NOW(), NOW()),
(7, 'Gedung 7', NULL, true, NOW(), NOW()),
(8, 'Gedung 8', NULL, true, NOW(), NOW()),
(9, 'Gedung 11', NULL, true, NOW(), NOW()),
(10, 'gedung 9', NULL, true, NOW(), NOW()),
(11, 'Gedung 3', NULL, true, NOW(), NOW()),
(12, 'Gedung 10', NULL, true, NOW(), NOW()),
(13, 'Gedung Kantor', 'Kantor Operasional KNMP', true, NOW(), NOW()),
(14, 'Gedung Gudang', 'Penyimpanan Material', true, NOW(), NOW()),
(15, 'Gedung Workshop', 'Area Pemeliharaan', true, NOW(), NOW());

SELECT setval('jenis_bangunans_id_seq', (SELECT MAX(id) FROM jenis_bangunans));

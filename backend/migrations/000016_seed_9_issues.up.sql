-- 000016_seed_9_issues.up.sql

ALTER TABLE issues ALTER COLUMN knmp_id DROP NOT NULL;

DELETE FROM issues;

INSERT INTO issues (id, knmp_id, kategori_issue, tingkat, status, uraian_masalah, created_by, created_at, updated_at)
VALUES
(1, NULL, 'K3', 'Ringan', 'menunggu_pengawas', 'Isn''t', 1, NOW(), NOW()),
(2, NULL, 'K3', 'Sedang', 'menunggu_pengawas', 'masalah', 1, NOW(), NOW()),
(3, NULL, 'K3', 'Sedang', 'menunggu_pengawas', 'masalah ke2', 1, NOW(), NOW()),
(4, NULL, 'K3', 'Lainnya', 'menunggu_pengawas', 'test', 1, NOW(), NOW()),
(5, NULL, 'K3', 'Sedang', 'menunggu_pengawas', 'masalah dengan knmp', 1, NOW(), NOW()),
(6, NULL, 'K3', 'Sedang', 'menunggu_pengawas', 'tes', 1, NOW(), NOW()),
(7, NULL, 'material terlambat', 'Sedang', 'menunggu_pengawas', 'hello world', 1, NOW(), NOW()),
(8, NULL, 'material terlambat', 'Sedang', 'menunggu_pengawas', 'beo', 1, NOW(), NOW()),
(9, NULL, 'material terlambat', 'Sedang', 'menunggu_pengawas', 'beo', 1, NOW(), NOW());

SELECT setval('issues_id_seq', (SELECT MAX(id) FROM issues));

-- Seed sample documents for issues to reflect 16 photos & 1 verified
DELETE FROM documents WHERE documentable_type = 'issue';

INSERT INTO documents (documentable_type, documentable_id, category, file_name, file_path, file_type, size, status, uploaded_by, created_at, updated_at)
VALUES
('issue', 2, 'foto_issue', 'foto_masalah_1.jpg', 'uploads/issue/foto_masalah_1.jpg', 'image/jpeg', 102400, 'terverifikasi', 1, NOW(), NOW()),
('issue', 3, 'foto_issue', 'foto_masalah_2_a.jpg', 'uploads/issue/foto_masalah_2_a.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 3, 'foto_issue', 'foto_masalah_2_b.jpg', 'uploads/issue/foto_masalah_2_b.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 3, 'foto_issue', 'foto_masalah_2_c.jpg', 'uploads/issue/foto_masalah_2_c.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 3, 'foto_issue', 'foto_masalah_2_d.jpg', 'uploads/issue/foto_masalah_2_d.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 3, 'foto_issue', 'foto_masalah_2_e.jpg', 'uploads/issue/foto_masalah_2_e.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 4, 'foto_issue', 'foto_test_1.jpg', 'uploads/issue/foto_test_1.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 4, 'foto_issue', 'foto_test_2.jpg', 'uploads/issue/foto_test_2.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 4, 'foto_issue', 'foto_test_3.jpg', 'uploads/issue/foto_test_3.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 4, 'foto_issue', 'foto_test_4.jpg', 'uploads/issue/foto_test_4.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 4, 'foto_issue', 'foto_test_5.jpg', 'uploads/issue/foto_test_5.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 5, 'foto_issue', 'foto_knmp.jpg', 'uploads/issue/foto_knmp.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 6, 'foto_issue', 'foto_tes.jpg', 'uploads/issue/foto_tes.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 7, 'foto_issue', 'foto_hello.jpg', 'uploads/issue/foto_hello.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 8, 'foto_issue', 'foto_beo_1.jpg', 'uploads/issue/foto_beo_1.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW()),
('issue', 9, 'foto_issue', 'foto_beo_2.jpg', 'uploads/issue/foto_beo_2.jpg', 'image/jpeg', 102400, 'pending', 1, NOW(), NOW());

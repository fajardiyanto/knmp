-- 000009_seed_pcm_sample.up.sql

INSERT INTO pcm (persiapan_kontrak_id, nama, tanggal, keterangan, created_at, updated_at)
SELECT id, 'PCM Paket A', '2026-08-28', 'asd', NOW(), NOW()
FROM persiapans
WHERE nama ILIKE '%Pulau Tenggol%' AND jenis = 'kontrak'
LIMIT 1;

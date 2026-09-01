-- Normalize legacy/demo report rows whose title says weekly but type was saved as monthly.
UPDATE laporans
SET jenis_laporan = 'mingguan',
    updated_at = NOW()
WHERE deleted_at IS NULL
  AND LOWER(nama) LIKE '%mingguan%'
  AND LOWER(jenis_laporan) = 'bulanan';

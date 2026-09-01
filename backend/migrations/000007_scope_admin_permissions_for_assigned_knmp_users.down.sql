DELETE FROM model_has_permissions mhp
USING users u, user_knmps uk, permissions p
WHERE mhp.model_id = u.id
  AND uk.user_id = u.id
  AND mhp.permission_id = p.id
  AND p.name IN (
      'dashboard',
      'chat',
      'kontrak_read',
      'lapangan_read',
      'pelaksanaan_read',
      'laporan_read',
      'anggaran_read',
      'termin_read',
      'absensi_read',
      'issue_read'
  );

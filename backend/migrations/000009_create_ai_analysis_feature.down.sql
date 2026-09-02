DELETE FROM role_has_permissions rhp
USING permissions p
WHERE rhp.permission_id = p.id
  AND p.name IN ('ai_analysis_create', 'ai_analysis_read', 'ai_analysis_update', 'ai_analysis_delete');

DELETE FROM permissions
WHERE name IN ('ai_analysis_create', 'ai_analysis_read', 'ai_analysis_update', 'ai_analysis_delete');

DROP TABLE IF EXISTS ai_analyses CASCADE;

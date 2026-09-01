DELETE FROM model_has_roles mhr
USING users u, roles r
WHERE mhr.model_id = u.id
  AND mhr.role_id = r.id
  AND u.email = 'superadmin@gmail.com'
  AND r.name = 'super_admin';

DELETE FROM role_has_permissions rhp
USING roles r
WHERE rhp.role_id = r.id
  AND r.name = 'super_admin';

DELETE FROM roles WHERE name = 'super_admin';

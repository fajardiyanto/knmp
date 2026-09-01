-- Add snake_case super_admin role and migrate existing field users to admin.

INSERT INTO roles (name, guard_name, created_at, updated_at)
VALUES ('super_admin', 'api', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET updated_at = NOW();

INSERT INTO role_has_permissions (permission_id, role_id)
SELECT p.id, r.id
FROM permissions p
JOIN roles r ON r.name = 'super_admin'
ON CONFLICT (permission_id, role_id) DO NOTHING;

INSERT INTO model_has_roles (role_id, model_type, model_id)
SELECT r.id, 'App\\Models\\User', u.id
FROM users u
JOIN roles r ON r.name = 'super_admin'
WHERE u.email = 'superadmin@gmail.com'
ON CONFLICT (role_id, model_id, model_type) DO NOTHING;

DELETE FROM model_has_roles mhr
USING users u, roles r
WHERE mhr.model_id = u.id
  AND mhr.role_id = r.id
  AND u.email = 'superadmin@gmail.com'
  AND r.name <> 'super_admin';

INSERT INTO model_has_roles (role_id, model_type, model_id)
SELECT (
    SELECT id
    FROM roles
    WHERE LOWER(name) = 'admin_ppk'
    ORDER BY CASE WHEN name = 'Admin_ppk' THEN 0 ELSE 1 END, id
    LIMIT 1
), COALESCE(mhr.model_type, 'App\\Models\\User'), mhr.model_id
FROM model_has_roles mhr
JOIN roles old_role ON old_role.id = mhr.role_id
WHERE LOWER(old_role.name) = 'kontraktor'
ON CONFLICT (role_id, model_id, model_type) DO NOTHING;

DELETE FROM model_has_roles mhr
USING roles old_role
WHERE mhr.role_id = old_role.id
  AND LOWER(old_role.name) = 'kontraktor';

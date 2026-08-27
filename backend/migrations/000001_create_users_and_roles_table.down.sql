-- 000001_create_users_and_roles_table.down.sql

DROP TABLE IF EXISTS role_has_permissions;
DROP TABLE IF EXISTS model_has_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

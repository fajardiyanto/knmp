-- 000017_seed_7_users.up.sql

CREATE TABLE IF NOT EXISTS user_knmps (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    knmp_id BIGINT NOT NULL REFERENCES knmps(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, knmp_id)
);

-- Ensure standard roles exist
INSERT INTO roles (name, guard_name, created_at, updated_at)
VALUES 
('SuperAdmin', 'api', NOW(), NOW()),
('Wakil PPK', 'api', NOW(), NOW()),
('PPK', 'api', NOW(), NOW()),
('Pengawas', 'api', NOW(), NOW()),
('Admin_ppk', 'api', NOW(), NOW()),
('Kontraktor', 'api', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Seed / Upsert the 7 users from screenshot
-- Password for all: password (bcrypt hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)

INSERT INTO users (name, email, password, created_at, updated_at)
VALUES
('Wakil PPK', 'wakil_ppk@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('PPK', 'ppk@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Pengawas', 'pengawas@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Admin PPK', 'admin@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Kontraktor', 'kontraktor@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Hari Wijayanto', 'wakildemo@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Kontraktor persentasi', 'hello@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- Assign Roles
INSERT INTO model_has_roles (role_id, model_type, model_id)
SELECT r.id, 'App\\Models\\User', u.id
FROM users u
JOIN roles r ON (
    (u.email = 'wakil_ppk@gmail.com' AND r.name = 'Wakil PPK') OR
    (u.email = 'ppk@gmail.com' AND r.name = 'PPK') OR
    (u.email = 'pengawas@gmail.com' AND r.name = 'Pengawas') OR
    (u.email = 'admin@gmail.com' AND r.name = 'Admin_ppk') OR
    (u.email = 'kontraktor@gmail.com' AND r.name = 'Kontraktor') OR
    (u.email = 'wakildemo@gmail.com' AND r.name = 'Wakil PPK') OR
    (u.email = 'hello@gmail.com' AND r.name = 'Kontraktor')
)
ON CONFLICT (role_id, model_id, model_type) DO NOTHING;

-- Assign KNMP Matobe to user 6 & 7 if KNMP Matobe exists
INSERT INTO user_knmps (user_id, knmp_id, created_at, updated_at)
SELECT u.id, k.id, NOW(), NOW()
FROM users u
CROSS JOIN knmps k
WHERE u.email IN ('wakildemo@gmail.com', 'hello@gmail.com')
  AND k.name ILIKE '%Matobe%'
LIMIT 2
ON CONFLICT (user_id, knmp_id) DO NOTHING;

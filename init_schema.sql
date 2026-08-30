-- ==============================================================================
-- KNMP V2 (SIMANDOR 360) - ALL-IN-ONE DATABASE SCHEMA & SEED INITIALIZATION
-- ==============================================================================

-- >>> START: 000001_create_users_and_roles_table.up.sql <<<
-- 000001_create_users_and_roles_table.up.sql

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    guard_name VARCHAR(50) NOT NULL DEFAULT 'api',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    guard_name VARCHAR(50) NOT NULL DEFAULT 'api',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_has_roles (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    model_type VARCHAR(150) NOT NULL DEFAULT 'App\\Models\\User',
    model_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, model_id, model_type)
);

CREATE TABLE IF NOT EXISTS role_has_permissions (
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (permission_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- >>> END: 000001_create_users_and_roles_table.up.sql <<<

-- >>> START: 000002_create_geo_and_knmp_tables.up.sql <<<
-- 000002_create_geo_and_knmp_tables.up.sql

CREATE TABLE IF NOT EXISTS regionals (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provinces (
    id BIGSERIAL PRIMARY KEY,
    regional_id BIGINT NOT NULL REFERENCES regionals(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regencies (
    id BIGSERIAL PRIMARY KEY,
    province_id BIGINT NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'KABUPATEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS districts (
    id BIGSERIAL PRIMARY KEY,
    regency_id BIGINT NOT NULL REFERENCES regencies(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sub_districts (
    id BIGSERIAL PRIMARY KEY,
    district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knmps (
    id BIGSERIAL PRIMARY KEY,
    regional_id BIGINT REFERENCES regionals(id) ON DELETE SET NULL,
    province_id BIGINT REFERENCES provinces(id) ON DELETE SET NULL,
    regency_id BIGINT REFERENCES regencies(id) ON DELETE SET NULL,
    district_id BIGINT REFERENCES districts(id) ON DELETE SET NULL,
    sub_district_id BIGINT REFERENCES sub_districts(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    jenis_knmp VARCHAR(50) NOT NULL DEFAULT 'existing',
    lat VARCHAR(50) NULL,
    long VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_knmps (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    knmp_id BIGINT NOT NULL REFERENCES knmps(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, knmp_id)
);

CREATE TABLE IF NOT EXISTS periodes (
    id BIGSERIAL PRIMARY KEY,
    year INT NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_akhir DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jenis_bangunans (
    id BIGSERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knmps_regional ON knmps(regional_id);
CREATE INDEX IF NOT EXISTS idx_knmps_province ON knmps(province_id);
CREATE INDEX IF NOT EXISTS idx_user_knmps_user ON user_knmps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_knmps_knmp ON user_knmps(knmp_id);

-- >>> END: 000002_create_geo_and_knmp_tables.up.sql <<<

-- >>> START: 000003_create_persiapan_and_pcm_tables.up.sql <<<
-- 000003_create_persiapan_and_pcm_tables.up.sql

CREATE TABLE IF NOT EXISTS persiapans (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT NOT NULL REFERENCES knmps(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    nama VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL,
    jenis VARCHAR(50) NOT NULL, -- 'kontrak' | 'lapangan'
    keterangan TEXT NULL,
    status VARCHAR(50) NULL,
    additional_data JSONB NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS pcm (
    id BIGSERIAL PRIMARY KEY,
    persiapan_kontrak_id BIGINT NOT NULL REFERENCES persiapans(id) ON DELETE CASCADE,
    nama VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL,
    keterangan TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_persiapans_knmp ON persiapans(knmp_id);
CREATE INDEX IF NOT EXISTS idx_persiapans_jenis ON persiapans(jenis);
CREATE INDEX IF NOT EXISTS idx_pcm_persiapan_kontrak ON pcm(persiapan_kontrak_id);

-- >>> END: 000003_create_persiapan_and_pcm_tables.up.sql <<<

-- >>> START: 000004_create_pelaksanaan_laporan_absensi_issue_tables.up.sql <<<
-- 000004_create_pelaksanaan_laporan_absensi_issue_tables.up.sql

CREATE TABLE IF NOT EXISTS pelaksanaans (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT NOT NULL REFERENCES knmps(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    nama VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL,
    jenis_laporan VARCHAR(50) NULL,
    status_k3 VARCHAR(50) NULL,
    kendala TEXT NULL,
    keterangan TEXT NULL,
    additional_data JSONB NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS laporans (
    id BIGSERIAL PRIMARY KEY,
    pelaksanaan_id BIGINT NOT NULL REFERENCES pelaksanaans(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    nama VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL,
    jenis_laporan VARCHAR(50) NOT NULL DEFAULT 'harian', -- 'harian', 'mingguan', 'bulanan'
    keberapa INT NULL,
    cuaca VARCHAR(50) NULL, -- 'cerah', 'berawan', 'mendung', 'hujan', 'badai', 'lainnya'
    jumlah_tenaga_kerja INT NOT NULL DEFAULT 0,
    rencana_progres_fisik NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    realisasi_progres_fisik NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'menunggu_pengawas',
    lat VARCHAR(50) NULL,
    long VARCHAR(50) NULL,
    keterangan TEXT NULL,
    additional_data JSONB NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS laporan_jenis_bangunan (
    id BIGSERIAL PRIMARY KEY,
    laporan_id BIGINT NOT NULL REFERENCES laporans(id) ON DELETE CASCADE,
    jenis_bangunan_id BIGINT NOT NULL REFERENCES jenis_bangunans(id) ON DELETE RESTRICT,
    rencana_progres_fisik NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    realisasi_progres_fisik NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    keterangan TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS absensis (
    id BIGSERIAL PRIMARY KEY,
    pelaksanaan_id BIGINT NOT NULL REFERENCES pelaksanaans(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    tipe_absensi VARCHAR(50) NOT NULL, -- 'hadir' | 'pulang'
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lat VARCHAR(50) NULL,
    long VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'menunggu_pengawas',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issues (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT NOT NULL REFERENCES knmps(id) ON DELETE CASCADE,
    kategori_issue VARCHAR(50) NOT NULL, -- 'K3', 'mutu', 'cuaca', 'material', etc.
    tingkat VARCHAR(50) NOT NULL, -- 'ringan', 'sedang', 'kritis', 'lainnya'
    status VARCHAR(50) NOT NULL DEFAULT 'menunggu_pengawas',
    uraian_masalah TEXT NOT NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pelaksanaans_knmp ON pelaksanaans(knmp_id);
CREATE INDEX IF NOT EXISTS idx_laporans_pelaksanaan ON laporans(pelaksanaan_id);
CREATE INDEX IF NOT EXISTS idx_laporan_jb_laporan ON laporan_jenis_bangunan(laporan_id);
CREATE INDEX IF NOT EXISTS idx_absensis_pelaksanaan ON absensis(pelaksanaan_id);
CREATE INDEX IF NOT EXISTS idx_issues_knmp ON issues(knmp_id);

-- >>> END: 000004_create_pelaksanaan_laporan_absensi_issue_tables.up.sql <<<

-- >>> START: 000005_create_pembayaran_table.up.sql <<<
-- 000005_create_pembayaran_table.up.sql

CREATE TABLE IF NOT EXISTS pembayarans (
    id BIGSERIAL PRIMARY KEY,
    persiapan_kontrak_id BIGINT NOT NULL REFERENCES persiapans(id) ON DELETE CASCADE,
    kategori VARCHAR(100) NULL,
    name VARCHAR(255) NOT NULL,
    termin VARCHAR(50) NOT NULL,
    realisasi_anggaran NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    realisasi_fisik NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    norek_pekerja VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pembayarans_persiapan_kontrak ON pembayarans(persiapan_kontrak_id);

-- >>> END: 000005_create_pembayaran_table.up.sql <<<

-- >>> START: 000006_create_documents_and_verifications_table.up.sql <<<
-- 000006_create_documents_and_verifications_table.up.sql

CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    documentable_type VARCHAR(150) NOT NULL, -- 'persiapan', 'pcm', 'pelaksanaan', 'laporan_jenis_bangunan', 'absensi', 'issue', 'pembayaran', 'knmp'
    documentable_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NULL,
    category VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    note TEXT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verifications (
    id BIGSERIAL PRIMARY KEY,
    verifiable_type VARCHAR(150) NOT NULL, -- 'laporan', 'absensi', 'issue', 'document'
    verifiable_id BIGINT NOT NULL,
    step VARCHAR(50) NOT NULL, -- 'pengawas', 'wakil_ppk'
    status VARCHAR(50) NOT NULL, -- 'pending', 'approved', 'rejected', 'unverified'
    note TEXT NULL,
    verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    superseded_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_polymorphic ON documents(documentable_type, documentable_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_verifications_polymorphic ON verifications(verifiable_type, verifiable_id);
CREATE INDEX IF NOT EXISTS idx_verifications_current ON verifications(is_current);

-- >>> END: 000006_create_documents_and_verifications_table.up.sql <<<

-- >>> START: 000007_seed_346_knmps.up.sql <<<
-- 000007_seed_346_knmps.up.sql
-- Seed 346 accurate KNMP locations across coastal fishing villages in Indonesia


INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kelambir', 'penyangga', '3.698350', '98.852390', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Paluh Sabaji', 'penyangga', '3.679372', '98.903083', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sei Sembilang', 'penyangga', '2.949900', '99.977600', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sei Jawi-Jawi', 'penyangga', '2.965181', '99.816471', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bagan Asahan Pekan', 'penyangga', '3.012729', '99.855752', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bagan Asahan Baru', 'penyangga', '3.002680', '99.858580', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kedai Gedang', 'penyangga', '2.010107', '98.417686', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pasar V Natal', 'penyangga', '0.544986', '99.120453', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pasar Sorkam', 'penyangga', '1.928700', '98.561200', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pasar Baru Batahan', 'penyangga', '0.381561', '99.170797', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Belawan Bahari', 'penyangga', '3.655000', '98.839000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Titi Kuning', 'penyangga', '3.675000', '98.845000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Tanjung', 'baru', '3.695000', '98.851000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Tiram', 'penyangga', '3.700000', '98.857000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pagurawan', 'penyangga', '3.720000', '98.839000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pantai Cermin', 'baru', '3.665000', '98.863000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sialang Buah', 'penyangga', '3.670000', '98.869000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pangkalan Susu', 'penyangga', '3.690000', '98.875000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Brandan Barat', 'baru', '3.710000', '98.857000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Pura', 'penyangga', '3.715000', '98.863000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungai Apit', 'penyangga', '3.660000', '98.887000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bukit Batu', 'baru', '3.680000', '98.893000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Rupat Utara', 'penyangga', '3.685000', '98.875000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Purnama Dumai', 'penyangga', '3.705000', '98.881000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungai Sembilan', 'baru', '3.725000', '98.887000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bagansiapiapi', 'penyangga', '3.655000', '98.911000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sinaboi', 'penyangga', '3.675000', '98.893000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pasir Limau Kapas', 'baru', '3.695000', '98.899000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Enok', 'penyangga', '3.700000', '98.905000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungai Guntung', 'penyangga', '3.720000', '98.911000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Concong Luar', 'baru', '3.745000', '98.649000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Batu Ampar', 'penyangga', '3.765000', '98.655000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Belakang Padang', 'penyangga', '3.785000', '98.661000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Nongsa', 'baru', '3.790000', '98.667000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Galang', 'penyangga', '3.810000', '98.649000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bulang', 'penyangga', '3.755000', '98.673000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sei Beduk', 'baru', '3.760000', '98.679000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Senggarang', 'penyangga', '3.780000', '98.685000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kampung Bugis', 'penyangga', '3.800000', '98.667000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Dompak', 'baru', '3.805000', '98.673000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Siambang', 'penyangga', '3.750000', '98.697000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Unggat', 'penyangga', '3.770000', '98.703000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Batu Licin', 'baru', '3.775000', '98.685000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kijang Kota', 'penyangga', '3.795000', '98.691000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Teluk Sebong', 'penyangga', '3.815000', '98.697000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Gunung Kijang', 'baru', '3.745000', '98.721000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Moro', 'penyangga', '3.765000', '98.703000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kundur', 'penyangga', '3.785000', '98.709000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Buru', 'baru', '3.890000', '98.314000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Meral', 'penyangga', '3.910000', '98.320000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tebing', 'penyangga', '3.930000', '98.326000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kelarik Barat', 'baru', '3.935000', '98.332000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Rebo', 'penyangga', '3.955000', '98.314000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Sangkar', 'penyangga', '3.900000', '98.338000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kota Jawa', 'baru', '3.905000', '98.344000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bungus Teluk Kabung', 'penyangga', '3.925000', '98.350000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pasie Nan Tigo', 'penyangga', '3.945000', '98.332000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Padang', 'baru', '3.950000', '98.338000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Carocok Painan', 'penyangga', '3.895000', '98.362000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Air Bangis', 'penyangga', '3.915000', '98.368000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sasak Ranah Pasisie', 'baru', '3.920000', '98.350000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tiku V Jorong', 'penyangga', '3.940000', '98.356000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Ulakan Tapakis', 'penyangga', '3.960000', '98.362000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Tungkal', 'baru', '3.890000', '98.386000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Sabak', 'penyangga', '3.910000', '98.368000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Nipah Panjang', 'penyangga', '3.930000', '98.374000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungsang', 'baru', '3.935000', '98.380000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Api-Api', 'penyangga', '3.955000', '98.386000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Siapi', 'penyangga', '3.900000', '98.386000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungailiat', 'baru', '3.905000', '98.392000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Toboali', 'penyangga', '3.550000', '99.084000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Manggar', 'penyangga', '3.570000', '99.090000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Pandan', 'baru', '3.590000', '99.096000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kalianda', 'penyangga', '3.595000', '99.102000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Ketapang', 'penyangga', '3.615000', '99.084000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Labuhan Maringgai', 'baru', '3.560000', '99.108000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Kamal', 'penyangga', '3.565000', '99.114000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kalibaru Cilincing', 'penyangga', '3.585000', '99.120000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Marunda', 'baru', '3.605000', '99.102000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Gembong', 'penyangga', '3.610000', '99.108000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Karangsong', 'penyangga', '3.555000', '99.132000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Eretan Kulon', 'baru', '3.575000', '99.138000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kejawanan', 'penyangga', '3.580000', '99.120000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Gebang Mekar', 'penyangga', '3.600000', '99.126000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Krapyak Semarang', 'baru', '3.620000', '99.132000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tambak Lorok', 'penyangga', '3.550000', '99.156000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tasikagung Rembang', 'penyangga', '3.570000', '99.138000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Banyutowo', 'baru', '3.590000', '99.144000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Morodemak', 'penyangga', '3.220000', '99.544000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Brondong', 'penyangga', '3.240000', '99.550000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Palang Tuban', 'baru', '3.260000', '99.556000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Lumpur Gresik', 'penyangga', '3.265000', '99.562000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kenjeran Surabaya', 'penyangga', '3.285000', '99.544000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Mayangan Probolinggo', 'baru', '3.230000', '99.568000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Panarukan', 'penyangga', '3.235000', '99.574000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muncar Banyuwangi', 'penyangga', '3.255000', '99.580000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Grajagan', 'baru', '3.275000', '99.562000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Puger Jember', 'penyangga', '3.280000', '99.568000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sendang Biru', 'penyangga', '3.225000', '99.592000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Prigi Trenggalek', 'baru', '3.245000', '99.598000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Teluk Penyu Cilacap', 'penyangga', '3.250000', '99.580000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pangandaran', 'penyangga', '3.270000', '99.586000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Cisolok Sukabumi', 'baru', '3.290000', '99.592000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Ulee Lheue', 'penyangga', '3.220000', '99.616000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Lampulo', 'penyangga', '3.240000', '99.598000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Krueng Raya', 'baru', '3.260000', '99.604000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Meureudu', 'penyangga', '2.955000', '99.814000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Samalanga', 'penyangga', '2.975000', '99.820000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Bireuen', 'baru', '2.995000', '99.826000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pusong Lhokseumawe', 'penyangga', '3.000000', '99.832000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Cangkoi', 'penyangga', '3.020000', '99.814000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Idi Rayeuk', 'baru', '2.965000', '99.838000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Langsa', 'penyangga', '2.970000', '99.844000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Simpang', 'penyangga', '2.990000', '99.850000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Meulaboh Ujong Baroh', 'baru', '3.010000', '99.832000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Samatiga', 'penyangga', '3.015000', '99.838000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Tuha', 'penyangga', '2.960000', '99.862000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tapaktuan', 'baru', '2.980000', '99.868000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Singkil Pesisir', 'penyangga', '2.985000', '99.850000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pulau Banyak', 'penyangga', '3.005000', '99.856000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Teluk Dalam Nias', 'baru', '3.025000', '99.862000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sirombu', 'penyangga', '2.955000', '99.886000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Lahewa', 'penyangga', '2.975000', '99.868000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tuhemberua', 'baru', '2.995000', '99.874000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Belawan Bahari 2', 'penyangga', '3.000000', '99.880000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Titi Kuning 2', 'penyangga', '3.020000', '99.886000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Tanjung 2', 'baru', '1.820000', '98.614000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Tiram 2', 'penyangga', '1.840000', '98.620000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pagurawan 2', 'penyangga', '1.860000', '98.626000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pantai Cermin 2', 'baru', '1.865000', '98.632000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sialang Buah 2', 'penyangga', '1.885000', '98.614000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pangkalan Susu 2', 'penyangga', '1.830000', '98.638000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Brandan Barat 2', 'baru', '1.835000', '98.644000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Pura 2', 'penyangga', '1.855000', '98.650000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungai Apit 2', 'penyangga', '1.875000', '98.632000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bukit Batu 2', 'baru', '1.880000', '98.638000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Rupat Utara 2', 'penyangga', '1.825000', '98.662000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Purnama Dumai 2', 'penyangga', '1.845000', '98.668000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungai Sembilan 2', 'baru', '1.850000', '98.650000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bagansiapiapi 2', 'penyangga', '1.870000', '98.656000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sinaboi 2', 'penyangga', '1.890000', '98.662000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pasir Limau Kapas 2', 'baru', '1.820000', '98.686000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Enok 2', 'penyangga', '0.490000', '99.074000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungai Guntung 2', 'penyangga', '0.510000', '99.080000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Concong Luar 2', 'baru', '0.530000', '99.086000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Batu Ampar 2', 'penyangga', '0.535000', '99.092000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Belakang Padang 2', 'penyangga', '0.555000', '99.074000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Nongsa 2', 'baru', '0.500000', '99.098000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Galang 2', 'penyangga', '0.505000', '99.104000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bulang 2', 'penyangga', '0.525000', '99.110000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sei Beduk 2', 'baru', '0.545000', '99.092000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Senggarang 2', 'penyangga', '0.550000', '99.098000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kampung Bugis 2', 'penyangga', '0.495000', '99.122000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Dompak 2', 'baru', '0.515000', '99.128000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Siambang 2', 'penyangga', '0.520000', '99.110000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Unggat 2', 'penyangga', '0.540000', '99.116000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Batu Licin 2', 'baru', '1.250000', '97.574000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kijang Kota 2', 'penyangga', '1.270000', '97.580000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Teluk Sebong 2', 'penyangga', '1.290000', '97.586000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Gunung Kijang 2', 'baru', '1.295000', '97.592000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Moro 2', 'penyangga', '1.315000', '97.574000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kundur 2', 'penyangga', '1.260000', '97.598000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Buru 2', 'baru', '1.265000', '97.604000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Meral 2', 'penyangga', '1.285000', '97.610000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tebing 2', 'penyangga', '1.305000', '97.592000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kelarik Barat 2', 'baru', '1.310000', '97.598000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Rebo 2', 'penyangga', '1.255000', '97.622000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Sangkar 2', 'penyangga', '1.275000', '97.628000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kota Jawa 2', 'baru', '5.545000', '95.284000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bungus Teluk Kabung 2', 'penyangga', '5.565000', '95.290000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pasie Nan Tigo 2', 'penyangga', '5.585000', '95.296000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Padang 2', 'baru', '5.590000', '95.302000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Carocok Painan 2', 'penyangga', '5.610000', '95.284000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Air Bangis 2', 'penyangga', '5.555000', '95.308000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sasak Ranah Pasisie 2', 'baru', '5.560000', '95.314000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tiku V Jorong 2', 'penyangga', '5.580000', '95.320000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Ulakan Tapakis 2', 'penyangga', '5.600000', '95.302000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Tungkal 2', 'baru', '5.605000', '95.308000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Sabak 2', 'penyangga', '5.550000', '95.332000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Nipah Panjang 2', 'penyangga', '5.570000', '95.338000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungsang 2', 'baru', '5.575000', '95.320000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Api-Api 2', 'penyangga', '5.595000', '95.326000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Siapi 2', 'penyangga', '5.155000', '97.104000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungailiat 2', 'baru', '5.175000', '97.110000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Toboali 2', 'penyangga', '5.195000', '97.116000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Manggar 2', 'penyangga', '5.200000', '97.122000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Pandan 2', 'baru', '5.220000', '97.104000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kalianda 2', 'penyangga', '5.165000', '97.128000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Ketapang 2', 'penyangga', '5.170000', '97.134000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Labuhan Maringgai 2', 'baru', '5.190000', '97.140000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Kamal 2', 'penyangga', '5.210000', '97.122000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kalibaru Cilincing 2', 'penyangga', '5.215000', '97.128000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Marunda 2', 'baru', '5.160000', '97.152000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Gembong 2', 'penyangga', '5.180000', '97.158000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Karangsong 2', 'penyangga', '4.850000', '97.844000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Eretan Kulon 2', 'baru', '4.870000', '97.850000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kejawanan 2', 'penyangga', '4.890000', '97.856000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Gebang Mekar 2', 'penyangga', '4.895000', '97.862000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Krapyak Semarang 2', 'baru', '4.915000', '97.844000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tambak Lorok 2', 'penyangga', '4.860000', '97.868000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tasikagung Rembang 2', 'penyangga', '4.865000', '97.874000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Banyutowo 2', 'baru', '4.885000', '97.880000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Morodemak 2', 'penyangga', '4.905000', '97.862000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Brondong 2', 'penyangga', '4.910000', '97.868000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Palang Tuban 2', 'baru', '4.855000', '97.892000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Lumpur Gresik 2', 'penyangga', '4.875000', '97.898000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kenjeran Surabaya 2', 'penyangga', '4.110000', '96.089000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Mayangan Probolinggo 2', 'baru', '4.130000', '96.095000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Panarukan 2', 'penyangga', '4.150000', '96.101000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muncar Banyuwangi 2', 'penyangga', '4.155000', '96.107000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Grajagan 2', 'baru', '4.175000', '96.089000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Puger Jember 2', 'penyangga', '4.120000', '96.113000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sendang Biru 2', 'penyangga', '4.125000', '96.119000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Prigi Trenggalek 2', 'baru', '4.145000', '96.125000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Teluk Penyu Cilacap 2', 'penyangga', '4.165000', '96.107000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pangandaran 2', 'penyangga', '4.170000', '96.113000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Cisolok Sukabumi 2', 'baru', '1.655000', '101.404000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Ulee Lheue 2', 'penyangga', '1.675000', '101.410000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Lampulo 2', 'penyangga', '1.695000', '101.416000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Krueng Raya 2', 'baru', '1.700000', '101.422000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Meureudu 2', 'penyangga', '1.720000', '101.404000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Samalanga 2', 'penyangga', '1.665000', '101.428000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Bireuen 2', 'baru', '1.670000', '101.434000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pusong Lhokseumawe 2', 'penyangga', '1.690000', '101.440000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Cangkoi 2', 'penyangga', '1.710000', '101.422000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Idi Rayeuk 2', 'baru', '1.715000', '101.428000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Langsa 2', 'penyangga', '1.660000', '101.452000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Simpang 2', 'penyangga', '1.680000', '101.458000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Meulaboh Ujong Baroh 2', 'baru', '2.130000', '100.774000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Samatiga 2', 'penyangga', '2.150000', '100.780000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Tuha 2', 'penyangga', '2.170000', '100.786000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tapaktuan 2', 'baru', '2.175000', '100.792000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Singkil Pesisir 2', 'penyangga', '2.195000', '100.774000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pulau Banyak 2', 'penyangga', '2.140000', '100.798000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Teluk Dalam Nias 2', 'baru', '2.145000', '100.804000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sirombu 2', 'penyangga', '2.165000', '100.810000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Lahewa 2', 'penyangga', '2.185000', '100.792000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tuhemberua 2', 'baru', '2.190000', '100.798000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Belawan Bahari 3', 'penyangga', '2.135000', '100.822000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Titi Kuning 3', 'penyangga', '2.155000', '100.828000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Tanjung 3', 'baru', '1.455000', '102.084000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Tiram 3', 'penyangga', '1.475000', '102.090000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pagurawan 3', 'penyangga', '1.495000', '102.096000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pantai Cermin 3', 'baru', '1.500000', '102.102000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sialang Buah 3', 'penyangga', '1.520000', '102.084000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pangkalan Susu 3', 'penyangga', '1.465000', '102.108000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Brandan Barat 3', 'baru', '1.470000', '102.114000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Pura 3', 'penyangga', '1.490000', '102.120000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungai Apit 3', 'penyangga', '1.510000', '102.102000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bukit Batu 3', 'baru', '1.515000', '102.108000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Rupat Utara 3', 'penyangga', '1.460000', '102.132000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Purnama Dumai 3', 'penyangga', '1.480000', '102.138000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungai Sembilan 3', 'baru', '-0.350000', '103.314000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bagansiapiapi 3', 'penyangga', '-0.330000', '103.320000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sinaboi 3', 'penyangga', '-0.310000', '103.326000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pasir Limau Kapas 3', 'baru', '-0.305000', '103.332000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Enok 3', 'penyangga', '-0.285000', '103.314000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungai Guntung 3', 'penyangga', '-0.340000', '103.338000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Concong Luar 3', 'baru', '-0.335000', '103.344000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Batu Ampar 3', 'penyangga', '-0.315000', '103.350000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Belakang Padang 3', 'penyangga', '-0.295000', '103.332000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Nongsa 3', 'baru', '-0.290000', '103.338000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Galang 3', 'penyangga', '1.090000', '104.014000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bulang 3', 'penyangga', '1.110000', '104.020000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sei Beduk 3', 'baru', '1.130000', '104.026000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Senggarang 3', 'penyangga', '1.135000', '104.032000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kampung Bugis 3', 'penyangga', '1.155000', '104.014000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Dompak 3', 'baru', '1.100000', '104.038000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Siambang 3', 'penyangga', '1.105000', '104.044000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Unggat 3', 'penyangga', '1.125000', '104.050000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Batu Licin 3', 'baru', '1.145000', '104.032000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kijang Kota 3', 'penyangga', '1.150000', '104.038000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Teluk Sebong 3', 'penyangga', '1.095000', '104.062000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Gunung Kijang 3', 'baru', '1.115000', '104.068000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Moro 3', 'penyangga', '1.120000', '104.050000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kundur 3', 'penyangga', '1.140000', '104.056000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Buru 3', 'baru', '0.990000', '104.444000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Meral 3', 'penyangga', '1.010000', '104.450000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tebing 3', 'penyangga', '1.030000', '104.456000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kelarik Barat 3', 'baru', '1.035000', '104.462000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Rebo 3', 'penyangga', '1.055000', '104.444000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Sangkar 3', 'penyangga', '1.000000', '104.468000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kota Jawa 3', 'baru', '1.005000', '104.474000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Bungus Teluk Kabung 3', 'penyangga', '1.025000', '104.480000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pasie Nan Tigo 3', 'penyangga', '1.045000', '104.462000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Padang 3', 'baru', '1.050000', '104.468000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Carocok Painan 3', 'penyangga', '0.995000', '104.492000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Air Bangis 3', 'penyangga', '1.015000', '104.498000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sasak Ranah Pasisie 3', 'baru', '0.980000', '103.384000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tiku V Jorong 3', 'penyangga', '1.000000', '103.390000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Ulakan Tapakis 3', 'penyangga', '1.020000', '103.396000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Tungkal 3', 'baru', '1.025000', '103.402000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Sabak 3', 'penyangga', '1.045000', '103.384000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Nipah Panjang 3', 'penyangga', '0.990000', '103.408000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungsang 3', 'baru', '0.995000', '103.414000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Api-Api 3', 'penyangga', '1.015000', '103.420000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Siapi 3', 'penyangga', '1.035000', '103.402000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sungailiat 3', 'baru', '1.040000', '103.408000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Toboali 3', 'penyangga', '-1.010000', '100.334000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Manggar 3', 'penyangga', '-0.990000', '100.340000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tanjung Pandan 3', 'baru', '-0.970000', '100.346000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kalianda 3', 'penyangga', '-0.965000', '100.352000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Ketapang 3', 'penyangga', '-0.945000', '100.334000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Labuhan Maringgai 3', 'baru', '-1.000000', '100.358000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Kamal 3', 'penyangga', '-0.995000', '100.364000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kalibaru Cilincing 3', 'penyangga', '-0.975000', '100.370000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Marunda 3', 'baru', '-0.955000', '100.352000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muara Gembong 3', 'penyangga', '-0.950000', '100.358000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Karangsong 3', 'penyangga', '-1.005000', '100.382000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Eretan Kulon 3', 'baru', '-0.985000', '100.388000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kejawanan 3', 'penyangga', '-5.750000', '105.544000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Gebang Mekar 3', 'penyangga', '-5.730000', '105.550000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Krapyak Semarang 3', 'baru', '-5.710000', '105.556000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tambak Lorok 3', 'penyangga', '-5.705000', '105.562000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tasikagung Rembang 3', 'penyangga', '-5.685000', '105.544000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Banyutowo 3', 'baru', '-5.740000', '105.568000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Morodemak 3', 'penyangga', '-5.735000', '105.574000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Brondong 3', 'penyangga', '-5.715000', '105.580000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Palang Tuban 3', 'baru', '-5.695000', '105.562000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Lumpur Gresik 3', 'penyangga', '-5.690000', '105.568000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kenjeran Surabaya 3', 'penyangga', '-5.745000', '105.592000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Mayangan Probolinggo 3', 'baru', '-5.725000', '105.598000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Panarukan 3', 'penyangga', '-6.145000', '106.749000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Muncar Banyuwangi 3', 'penyangga', '-6.125000', '106.755000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Grajagan 3', 'baru', '-6.105000', '106.761000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Puger Jember 3', 'penyangga', '-6.100000', '106.767000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Sendang Biru 3', 'penyangga', '-6.080000', '106.749000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Prigi Trenggalek 3', 'baru', '-6.135000', '106.773000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Teluk Penyu Cilacap 3', 'penyangga', '-6.130000', '106.779000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pangandaran 3', 'penyangga', '-6.110000', '106.785000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Cisolok Sukabumi 3', 'baru', '-6.090000', '106.767000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Ulee Lheue 3', 'penyangga', '-6.085000', '106.773000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Lampulo 3', 'penyangga', '-6.355000', '108.304000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Krueng Raya 3', 'baru', '-6.335000', '108.310000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Meureudu 3', 'penyangga', '-6.315000', '108.316000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Samalanga 3', 'penyangga', '-6.310000', '108.322000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Bireuen 3', 'baru', '-6.290000', '108.304000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Pusong Lhokseumawe 3', 'penyangga', '-6.345000', '108.328000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Cangkoi 3', 'penyangga', '-6.340000', '108.334000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Idi Rayeuk 3', 'baru', '-6.320000', '108.340000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Langsa 3', 'penyangga', '-6.300000', '108.322000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Simpang 3', 'penyangga', '-6.295000', '108.328000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Meulaboh Ujong Baroh 3', 'baru', '-6.350000', '108.352000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Samatiga 3', 'penyangga', '-6.330000', '108.358000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Kuala Tuha 3', 'penyangga', '-6.975000', '110.399000', 'on_track', NOW(), NOW());
INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('KNMP Tapaktuan 3', 'baru', '-6.955000', '110.405000', 'on_track', NOW(), NOW());

-- >>> END: 000007_seed_346_knmps.up.sql <<<

-- >>> START: 000008_make_persiapans_knmp_nullable_and_seed.up.sql <<<
-- 000008_make_persiapans_knmp_nullable_and_seed.up.sql

ALTER TABLE persiapans ALTER COLUMN knmp_id DROP NOT NULL;

-- Seed contract readiness data (matching staging screenshot)

INSERT INTO persiapans (knmp_id, user_id, nama, tanggal, jenis, keterangan, created_at, updated_at)
VALUES
(NULL, 1, 'Survey KNMP PENYANGGA', '2026-07-19', 'kontrak', '-', NOW(), NOW()),
(NULL, 1, 'Survey KNMP HUM', '2026-07-19', 'kontrak', '-', NOW(), NOW()),
(NULL, 1, 'Survey TEST', '2026-07-20', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Sungai%' LIMIT 1), 1, 'PT. Sadatani Jaya Tama', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Batam%' LIMIT 1), 1, 'CV. Kalika Berkah', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Rebo%' LIMIT 1), 1, 'PT. Indo Jaya Negara Abadi', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Mapur%' OR name ILIKE '%Tanjung%' LIMIT 1), 1, 'PT. Indo Jaya Negara Abadi', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Batu%' OR name ILIKE '%Bagan%' LIMIT 1), 1, 'PT. Duta Bangun Husaemi', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Belibak%' OR name ILIKE '%Kedai%' LIMIT 1), 1, 'CV. Pulau Tenggol', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Pasak%' OR name ILIKE '%Pasar%' LIMIT 1), 1, 'PT. Kalman Infra Perkasa', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Kelambir%' LIMIT 1), 1, 'PT. Bahari Sejahtera', '2026-08-26', 'kontrak', '-', NOW(), NOW()),
((SELECT id FROM knmps WHERE name ILIKE '%Sabaji%' LIMIT 1), 1, 'CV. Samudra Utama', '2026-08-26', 'kontrak', '-', NOW(), NOW());

-- >>> END: 000008_make_persiapans_knmp_nullable_and_seed.up.sql <<<

-- >>> START: 000009_seed_pcm_sample.up.sql <<<
-- 000009_seed_pcm_sample.up.sql

INSERT INTO pcm (persiapan_kontrak_id, nama, tanggal, keterangan, created_at, updated_at)
SELECT id, 'PCM Paket A', '2026-08-28', 'asd', NOW(), NOW()
FROM persiapans
WHERE nama ILIKE '%Pulau Tenggol%' AND jenis = 'kontrak'
LIMIT 1;

-- >>> END: 000009_seed_pcm_sample.up.sql <<<

-- >>> START: 000010_seed_persiapan_lapangan.up.sql <<<
-- 000010_seed_persiapan_lapangan.up.sql

INSERT INTO persiapans (knmp_id, user_id, nama, tanggal, jenis, keterangan, created_at, updated_at)
VALUES
(NULL, 1, 'Test', '2026-07-30', 'lapangan', '-', NOW(), NOW());

-- >>> END: 000010_seed_persiapan_lapangan.up.sql <<<

-- >>> START: 000011_make_pelaksanaans_knmp_nullable_and_seed.up.sql <<<
-- 000011_make_pelaksanaans_knmp_nullable_and_seed.up.sql

ALTER TABLE pelaksanaans ALTER COLUMN knmp_id DROP NOT NULL;


INSERT INTO pelaksanaans (knmp_id, user_id, nama, tanggal, keterangan, created_at, updated_at)
VALUES
(NULL, 1, 'KNMP HUB', '2026-07-29', '-', NOW(), NOW()),
(NULL, 1, 'KNMP PENYANGGA', '2026-07-29', '-', NOW(), NOW()),
(NULL, 1, 'KNMP HUB DEMO', '2026-07-31', '-', NOW(), NOW()),
(NULL, 1, 'KNMP PENYANGGA DEMO', '2026-07-31', '-', NOW(), NOW()),
(NULL, 1, 'PELAKSANAAN KNMP TEST', '2026-08-11', 'hanya untuk test', NOW(), NOW());

-- >>> END: 000011_make_pelaksanaans_knmp_nullable_and_seed.up.sql <<<

-- >>> START: 000012_seed_8_laporans.up.sql <<<
-- 000012_seed_8_laporans.up.sql


INSERT INTO laporans (pelaksanaan_id, user_id, nama, tanggal, jenis_laporan, keberapa, cuaca, jumlah_tenaga_kerja, rencana_progres_fisik, realisasi_progres_fisik, status, keterangan, created_at, updated_at)
VALUES
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%PENYANGGA DEMO%' LIMIT 1), 1, 'Kontraktor', '2026-07-29', 'mingguan', 1, 'berawan', 2, 25.00, 49.00, 'menunggu_wakil_ppk', 'kegiatan', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%HUB%' AND nama NOT ILIKE '%DEMO%' LIMIT 1), 1, 'Laporan', '2026-07-30', 'mingguan', 2, 'cerah', 5, 20.00, 15.00, 'baru', '-', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%HUB%' AND nama NOT ILIKE '%DEMO%' LIMIT 1), 1, 'Kontraktor', '2026-07-30', 'harian', NULL, 'cerah', 12, 10.00, 11.00, 'baru', 'Bangunan 2 kegiatan hari ini adalah perm...', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%PENYANGGA%' AND nama NOT ILIKE '%DEMO%' LIMIT 1), 1, 'Kontraktor', '2026-07-30', 'mingguan', 1, 'cerah', 1, 15.00, 15.00, 'menunggu_pengawas', 'Bangunan 5 | Bangunan 4 | Bangunan 2', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%TEST%' LIMIT 1), 1, 'Kontraktor', '2026-07-07', 'harian', NULL, 'cerah', 200, 30.00, 19.73, 'baru', '- -', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%PENYANGGA%' AND nama NOT ILIKE '%DEMO%' LIMIT 1), 1, 'MINGGUAN TEST', '2026-08-24', 'bulanan', 2, 'berawan', 20, 40.00, 60.00, 'menunggu_pengawas', 'test', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%HUB DEMO%' LIMIT 1), 1, 'LAPORAN HARIAN TEST', '2026-08-24', 'harian', 1, 'berawan', 1000, 20.00, 45.50, 'menunggu_wakil_ppk', '10', NOW(), NOW()),
((SELECT id FROM pelaksanaans WHERE nama ILIKE '%TEST%' LIMIT 1), 1, 'Kontraktor', '2026-08-28', 'mingguan', 1, 'cerah', 10, 50.00, 49.77, 'baru', 'gokil', NOW(), NOW());

-- >>> END: 000012_seed_8_laporans.up.sql <<<

-- >>> START: 000013_seed_pembayaran_anggaran.up.sql <<<
-- 000013_seed_pembayaran_anggaran.up.sql


INSERT INTO pembayarans (persiapan_kontrak_id, kategori, name, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
VALUES
(
    COALESCE((SELECT id FROM persiapans WHERE jenis = 'kontrak' LIMIT 1), 1),
    'Anggaran',
    'Anggaran Survey',
    'Termin 1',
    800000000.00,
    20.00,
    '123-456-7890',
    NOW(),
    NOW()
);

-- >>> END: 000013_seed_pembayaran_anggaran.up.sql <<<

-- >>> START: 000014_seed_termin_pembayaran.up.sql <<<
-- 000014_seed_termin_pembayaran.up.sql


INSERT INTO pembayarans (persiapan_kontrak_id, kategori, name, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
VALUES
(
    COALESCE((SELECT id FROM persiapans WHERE nama ILIKE '%PENYANGGA%' LIMIT 1), 1),
    'Termin',
    'Test',
    'Termin 1',
    20000000.00,
    25.00,
    '123-456-7890',
    NOW(),
    NOW()
),
(
    COALESCE((SELECT id FROM persiapans WHERE nama ILIKE '%HUB%' AND nama NOT ILIKE '%DEMO%' LIMIT 1), 1),
    'Termin',
    'Termin 1',
    'Termin 1',
    100000000.00,
    25.00,
    '987-654-3210',
    NOW(),
    NOW()
),
(
    COALESCE((SELECT id FROM persiapans WHERE jenis = 'kontrak' LIMIT 1), 1),
    'Anggaran',
    'Anggaran Survey',
    'Termin 1',
    800000000.00,
    20.00,
    '111-222-3333',
    NOW(),
    NOW()
);

-- >>> END: 000014_seed_termin_pembayaran.up.sql <<<

-- >>> START: 000015_create_chat_tables.up.sql <<<
-- 000015_create_chat_tables.up.sql

CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL DEFAULT 'personal', -- 'personal' | 'group'
    name VARCHAR(255) NULL,                       -- Group name
    description TEXT NULL,                        -- Group description
    avatar_url VARCHAR(500) NULL,
    created_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    last_message_id BIGINT NULL,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_members (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member', -- 'admin' | 'member'
    last_read_message_id BIGINT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_conv_member UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text', -- 'text' | 'system' | 'file' | 'image'
    content TEXT NOT NULL,
    attachment_url VARCHAR(500) NULL,
    attachment_name VARCHAR(255) NULL,
    attachment_size BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reads (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_msg_read UNIQUE (message_id, user_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_members_user_id ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_conv_id ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_id_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id, message_id);

-- >>> END: 000015_create_chat_tables.up.sql <<<

-- >>> START: 000015_seed_absensi_sample.up.sql <<<
-- 000015_seed_absensi_sample.up.sql


INSERT INTO absensis (pelaksanaan_id, user_id, tipe_absensi, recorded_at, lat, long, status, created_by, created_at, updated_at)
VALUES
(
    COALESCE((SELECT id FROM pelaksanaans WHERE nama ILIKE '%PENYANGGA%' LIMIT 1), 1),
    1,
    'hadir',
    '2026-07-29 01:00:00',
    '-6.297813',
    '106.745827',
    'menunggu_pengawas',
    1,
    '2026-07-29 01:00:00',
    NOW()
);

-- >>> END: 000015_seed_absensi_sample.up.sql <<<

-- >>> START: 000016_seed_9_issues.up.sql <<<
-- 000016_seed_9_issues.up.sql

ALTER TABLE issues ALTER COLUMN knmp_id DROP NOT NULL;


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

-- >>> END: 000016_seed_9_issues.up.sql <<<

-- >>> START: 000017_seed_7_users.up.sql <<<
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
('SuperAdmin', 'superadmin@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Admin PPK', 'admin_ppk@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Admin PPK', 'admin@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Wakil PPK', 'wakil_ppk@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('PPK', 'ppk@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Pengawas', 'pengawas@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Kontraktor', 'kontraktor@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Hari Wijayanto', 'wakildemo@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('Kontraktor persentasi', 'hello@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, updated_at = NOW();

-- Assign Roles
INSERT INTO model_has_roles (role_id, model_type, model_id)
SELECT r.id, 'App\\Models\\User', u.id
FROM users u
JOIN roles r ON (
    (u.email = 'superadmin@gmail.com' AND r.name = 'SuperAdmin') OR
    (u.email = 'admin_ppk@gmail.com' AND r.name = 'Admin_ppk') OR
    (u.email = 'admin@gmail.com' AND r.name = 'Admin_ppk') OR
    (u.email = 'wakil_ppk@gmail.com' AND r.name = 'Wakil PPK') OR
    (u.email = 'ppk@gmail.com' AND r.name = 'PPK') OR
    (u.email = 'pengawas@gmail.com' AND r.name = 'Pengawas') OR
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

-- >>> END: 000017_seed_7_users.up.sql <<<

-- >>> START: 000018_seed_periode_2026.up.sql <<<
-- 000018_seed_periode_2026.up.sql


INSERT INTO periodes (year, tanggal_mulai, tanggal_akhir, created_at, updated_at)
VALUES (2026, '2026-01-01', '2026-12-31', NOW(), NOW());

-- >>> END: 000018_seed_periode_2026.up.sql <<<

-- >>> START: 000019_seed_15_jenis_bangunans.up.sql <<<
-- 000019_seed_15_jenis_bangunans.up.sql


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

-- >>> END: 000019_seed_15_jenis_bangunans.up.sql <<<

-- ========================================================
-- 000003_create_perusahaans_table.up.sql
-- ========================================================
-- 000003_create_perusahaans_table.up.sql
CREATE TABLE IF NOT EXISTS perusahaans (
    id BIGSERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    alamat TEXT NULL,
    npwp VARCHAR(100) NULL,
    nama_direktur VARCHAR(255) NULL,
    jabatan_direktur VARCHAR(100) NULL DEFAULT 'Direktur',
    no_telp VARCHAR(50) NULL,
    email VARCHAR(255) NULL,
    notaris_akta VARCHAR(255) NULL,
    tanggal_akta VARCHAR(50) NULL,
    no_akta VARCHAR(100) NULL,
    nama_bank VARCHAR(100) NULL,
    norek_bank VARCHAR(100) NULL,
    cabang_bank VARCHAR(255) NULL,
    nama_bank_jaminan VARCHAR(100) NULL,
    no_jaminan VARCHAR(100) NULL,
    tgl_jaminan VARCHAR(50) NULL,
    no_kontrak VARCHAR(255) NULL,
    nama_paket TEXT NULL,
    status_administrasi VARCHAR(100) NULL,
    status_karwas VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Ensure columns exist if table was already created
ALTER TABLE perusahaans ADD COLUMN IF NOT EXISTS status_administrasi VARCHAR(100) NULL;
ALTER TABLE perusahaans ADD COLUMN IF NOT EXISTS status_karwas VARCHAR(100) NULL;

CREATE INDEX IF NOT EXISTS idx_perusahaans_nama ON perusahaans(nama);
CREATE INDEX IF NOT EXISTS idx_perusahaans_kontrak ON perusahaans(no_kontrak);
CREATE INDEX IF NOT EXISTS idx_perusahaans_status_admin ON perusahaans(status_administrasi);

INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Laksana Aneka Sarana', 'Wonderland Palace Blok B No.8, Jl. Raya Pondok Rajeg, Kab. Bogor, Jawa Barat', '01.707.370.1-404.000', 'Siddiq', 'Direktur', '08129674773', 'laksanaanekasarana@gmail.com', 'Hambit Maseh, S.H.', '2024-05-27 00:00:00', '851.0', 'Bank DKI Syariah', '71216000062 A.n PT. LAKSANA ANEKA SARANA', 'KCP Syariah Manggarai', NULL, NULL, NULL, 'B.21952/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Desa Tanjung Sangkar, Desa Celagen & Desa Kepoh, Kabupaten Bangka Provinsi Kepulauan Bangka Belitung Tahun Anggaran 2026', 'SCAN SPPBJ - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT GANESHA JAYA', 'Jl. Dukuh Kupang Timur XI/42 Surabaya, Kecamatan Sawahan Kelurahan Pakis RW 8 RT 4 Kota Surabaya', '001.214.080.263.1.000', 'A. Yani Ikhsan, ST', 'Direktur', '081283064488', 'ganesha.jaya42@gmail.com', 'Siska Febiana , SH., M.Kn', '2024-06-27 00:00:00', '4.0', 'Bank Jatim', '1711009082 A.n GANESHA JAYA, PT', 'CAPEM KALIBUTUH', NULL, NULL, NULL, 'B.21625/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kabupaten Rokan Hilir Riau Tahun Anggaran 2026', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Indo Jaya Negara Abadi', 'JALAN PEJATEN BARAT II, JL. TIMBUL NO. 21 Kota Adm. Jakarta Selatan DKI Jakarta', '0925 2055 3601 7000', 'Hero Aska Karnanda', 'Direktur', '087731490688', 'officialindojayanegaraabadi@gmail.com', 'Diharini, S.H., M.Kn', '2026-04-14 00:00:00', '31.0', 'Bank Mandiri', '1270015184623 A.n PT. Indo Jaya Negara Abadi', 'KC Jakarta Ampera Raya', NULL, NULL, NULL, 'B.21953/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Kurau Provinsi Kepulauan Bangka belitung', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Karya Bona Pasogit', 'Jalan Terminal Regional Nomor 000, Kota Bengkulu, Provinsi Bengkulu', '04.994.734.4-31 l.000', 'ALI MUSTOFA BISRI', 'Direktur', '0857-6687-1824', 'cvkruyabonapasogit@gmail.com', 'DENI YOHANES , S.H., M.Kn', '2024-01-26 00:00:00', '29.0', 'BSI', '7286359358 A.n CV KARYA BONA PASOGIT', 'KC BENGKULU A MALIK', NULL, NULL, NULL, 'B.21815/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pasar Seluma Kabupaten Seluma Provinsi Bengkulu', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Karang Baru Pratama', 'Perum Puri Kencana Blok J 3, Jl. Urip Sumoharjo No. 88, Kota Bandar Lampung, Lampung', '02.812.448.5-323.000', 'Surya Edi Pratama Putra', 'Kuasa Direktur', '082175189977', 'Karangbarupratama68@gmail.com', 'Fahrul Rozi, SH', '2026-07-29 00:00:00', '155.0', 'Bank Lampung', '3800002088247 A.n PT. Karang Baru Pratama', 'KC Bandar Lampung', NULL, NULL, NULL, 'B.22330/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Seri Kembang, Desa Burai, Desa Sunur, Desa Sungai Sibur Provinsi Sumatera Selatan', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Segi Tiga Tambora', 'BTN PERMATA ANAWAI BLOK A7/4, Kota Kendari Prov. Sulawesi Tenggara', '0765 2582 9881 1000', 'Anwar', 'Direktur', '082112111009', 'segitigatamborapt@gmail.com', 'Fahruddin Zaki Halim, SH, M.Kn', '2025-08-25 00:00:00', '29.0', 'BRI', '19201002667564 A.n PT. Segi Tiga Tambora', 'KC Kendari Samratulangi', NULL, NULL, NULL, 'B.22331/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tiku Selatan, Desa Pilubang, Desa Ampalu, Desa Marunggi dan Desa Koto Tinggi Kuranji Provinsi Sumatera Barat', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Putra Meranti', 'Jl. Yos Sudarso, Gang Obor, No. 02, Umban Sari, Rumbai, Kota Pekanbaru, Riau', '029854197211000', 'EFENDRI SAPUTRA', 'Direktur Utama', '081268231919', 'pt.putrameranti@yahoo.co.id', 'MUKHLIS, SH', '2022-01-11 00:00:00', '24.0', 'Bank Mandiri', '1230013673068 A.n PUTRA MERANTI', 'KCP Jakarta Percetakan Negara', NULL, NULL, NULL, 'B.22433/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Kepulauan Meranti, Pelalawan, Siak dan Kota Pekanbaru, Provinsi Riau', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. BARAGALU TIAS JAYA', 'Jl. Sukarno Hatta No. 1 LK.III RT.007
Kel.Sukarame, Kec. Suakrame Kota Bandar
Lampung', '03.216.770.3-323.000', 'ARMAN PENDRIK. SE', 'Direktur Utama', '0812 7331 3171', 'pt.baragalutias@yahoo.com', 'Recee Wamahyuningsih S.H., M.Kn.', '2026-04-22 00:00:00', '16.0', 'Bank Lampung', '3970002010833 A.n BARAGALU TIAS JAYA', 'Cabang Antaasari', NULL, NULL, NULL, 'B.21810/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Kekatang Dan Desa Sukarame Kab. Pesawaran Provinsi Lampung', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Sonta Abadi', 'Jalan Merdeka Barat, Kab. Sekadau, Kalimantan Barat', '922062203705000.0', 'Hengki Purwanto', 'Direktur', '082189262966', 'hengkyvj@gmail.com', 'Roni Faisal Pasaribu, SH., M.Kn', '2022-04-25 00:00:00', '20.0', 'Bank BRI', '035601002351309 A.n CV. Sonta Abadi', 'KC Jakarta Kemayoran', NULL, NULL, NULL, 'B.21957/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Deluk dan Desa Kuala Alam Kabupaten Bengkalis Provinsi Riau', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Hanovan Natama', 'Dusun V Sumbul Lestari (Perumahan Griya Sumut Paten Blok E16), Kab. Deli Serdang, Sumatera Utara', '02.178.456.6-125.000', 'Muhammad Shaleh Bisri Siregar', 'Direktur', '082369821927', 'mariyamharahapharahap@yahoo.co.id', 'NURAINUN, S.H.,M.Kn', '2024-08-20 00:00:00', '05', 'Bank SUMUT', '38001040000416  A.n CV HANOVAN NATAMA', 'Cabang Pekanbaru', NULL, NULL, NULL, 'B.22022/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tanjung Pasir, Desa Belaras dan Desa Tanah Merah Provinsi Riau', 'SCAN SPPBJ - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Putra Raja Parna', 'Jalan Adam Malik Raya Nomor 016 KM 8, Rukun Tetangga 009, Rukun Warga 003, Kel. Jalan Gedang, Kec. Gading Cempaka, Kota Bengkulu, Prov. Bengkulu', '62.527.495.6-311.000', 'Syaputra Manihuruk', 'Direktur', '082266333122', 'crajaparna@gmail.com', 'DENI YOHANES , S.H., M.Kn', '2023-01-16 00:00:00', '29.0', 'BSI', '7232352811 A.n CV PUTRA RAJA PARNA', NULL, NULL, NULL, NULL, 'B.21816/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Muara Maras Kabupaten Seluma Provinsi Bengkulu', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Aruna Karya Bangunindo', 'Jl. letkol Sentosa 83, Komp.Oase No.08,Kota Bengkulu, Bengkulu', '1000 0000 0959 6563', 'Angga Dewa', 'Direktur', '082183648885', 'ptarunakaryabangunindo@gmail.com', 'M. Januriyansyah, SH, M.Kn', '2025-03-04 00:00:00', '1.0', 'Bank Mandiri', '1010015246893 A.n PT. Aruna Karya Bangunindo', 'KC Jakarta Pondok Indah', NULL, NULL, NULL, 'B.22404/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pasar Ipuh, Desa Pasar Pino, dan Desa Pasar Palik Provinsi Bengkulu', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Ridho Pratama', 'Jalan Sumber Rukun nomor 294, Kota Medan, Sumatera Utara', '0312157217112000', 'Suyoto', 'Direktur', '081261605171', 'cvridhopratama@ymail.com', 'Herniati, SH', '2010-06-04 00:00:00', '14.0', 'Bank SUMUT', '11001040006386 A.n CV. Ridho Pratama', 'KC Kampung Lalang', NULL, NULL, NULL, 'B.21891/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Nenas Siam dan Desa Siofa Banua Provinsi Sumatera Utara', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Putra Global Enterprice', 'PAKUWON TOWER LT. 10 UNIT E, JL. CASABLANCA RAYA KAV. 88, Kota Adm. Jakarta Selatan, DKI Jakarta', '02002278703014000', 'Akhmad', 'Direktur', '081291325884', 'putraglobalenterprice@gmail.com', 'Chrystofer, S.H., M.Kn.', '2026-07-27 00:00:00', '127.0', 'Bank BRI', '043401001259304 A.n PT. Putra Global Enterprice', 'KC Jakarta Cempaka Mas', NULL, NULL, NULL, 'B.21892/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Matobe, Desa Sikakap dan Desa Sigapokna, Kab. Kep. Mentawai Provinsi Sumatera Barat', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Bukit Zaitun', 'Jl. Ngumban Surbakti No.66 Kel. Sempakata, Kota Medan, Sumatera Utara', '03.319.675-9-121.000', 'Enda Mora Siregar', 'Direktur', '082267333341', 'zaitunbukit@gmail.com', 'Rory Eka Putra Sitepu, S.H., M.Kn', '2026-08-12 00:00:00', '8.0', 'Bank SUMUT', '10201040002403 A.n PT. Bukit Zaitun', 'Capem Kampung Baru', NULL, NULL, NULL, 'B.21893/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kab. Tapanuli Tengah dan Nias Selatan Provinsi Sumatera Utara', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Aruna Karya Bangunindo', 'Jl. letkol Sentosa 83, Komp.Oase No.08,Kota Bengkulu, Bengkulu', '1000 0000 0959 6563', 'Angga Dewa', 'Direktur', '082183648885', 'ptarunakaryabangunindo@gmail.com', 'M. Januriyansyah, SH, M.Kn', '2025-03-04 00:00:00', '1.0', 'Bank Mandiri', '1010015246893 A.n PT. Aruna Karya Bangunindo', 'KC Jakarta Pondok Indah', NULL, NULL, NULL, 'B.21894/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pekik Nyaring, Desa Serangai dan Desa Pasar Sebelat Provinsi Bengkulu', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Mahanaim', 'Desa/Kelurahan Dermayu, Kecamatan Air Periukan, Kabupaten Seluma Provinsi Bengkulu', '70.568. 943.8-311.000', 'ARY YANANDA MULYANI', 'Wakil Direktur', '082266333122', 'cv.mahanaim79@gmail.com', 'DENI YOHANES , S.H., M.Kn,', '2023-06-14 00:00:00', '37.0', 'BSI', '1049882986 A.n CV MAHANAIM', 'KC BENGKULU A MALIK', NULL, NULL, NULL, 'B.21817/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Ketapang Baru dan Desa Kungkai Baru, Kab. Seluma, Provinsi Bengkulu', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Sonta Abadi', 'Jalan Merdeka Barat, Kab. Sekadau, Kalimantan Barat', '92.206.220.3-705.000', 'Hengki Purwanto', 'Direktur', '082189262966', 'hengkyvj@gmail.com', 'Roni Faisal Pasaribu, SH., M.Kn', '2026-07-07 00:00:00', '12.0', 'Bank BRI', '035601002351309 A.n CV. Sonta Abadi', 'KC Jakarta Kemayoran', NULL, NULL, NULL, 'B.21895/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Meskom dan Desa Muntai Kabupaten Bengkalis Provinsi Riau', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Innevo Karya Andesindo', 'Jalan Nangka Lintas Nomor 17, Kota Lubuk Linggau, Sumatera Selatan', '811065903303000.0', 'Febri Aditya Nata', 'Wakil Direktur', '082281315200', 'pt.innevo.ka@gmail.com', 'M. Januaryansyah, SH., M.Kn', '2026-02-09 00:00:00', '4.0', 'Bank Mandiri', '1010015246588 A.n PT. INNEVO KARYA ANDESINDO', 'KC Jakarta Pondok Indah', NULL, NULL, NULL, 'B.22403/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Kota Jawa dan Desa Pasar Kota Krui Kabupaten Pesisir Barat Provinsi Lampung', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Fasasi Karya Mandiri', 'JL. OTISTA 1 NOMOR 4B, LANTAI 2, Kota Adm. Jakarta Timur, DKI Jakarta', '0848966024403000', 'Sami', 'Direktur', '082368344597', 'fasasi.km2023@gmail.com', 'Chrystofer, SH., M.Kn', '2026-06-17 00:00:00', '25.0', 'Bank BRI', '043401001260305 A.n PT. Fasasi Karya Mandiri', 'KC Jakarta Cempaka Mas', NULL, NULL, NULL, 'B.21897/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Purus, Desa Manggopoh Palak Gadang Ulakan, dan Desa Gasan Gadang Provinsi Sumatera Barat', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Duta Bangun Husaeni', 'Bukit Cimanggu City Blok L 1 nomor 12, Kota Bogor, Jawa Barat', '0944 7414 0440 4000', 'Ibnu Bunyan Al Azizi', 'Direktur', '082115115424', 'ptdutabangunhusaeni@gmail.com', 'Yayu Sri Rahayu, SH., M.Kn', '2026-01-15 00:00:00', '3.0', 'Bank BJB', '0162479563001 A.n PT. Duta Bangun Husaeni', 'KC Cibinong', NULL, NULL, NULL, 'B.21898/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi, Pembangunan Kampung Nelayan Merah Putih Di Desa Selading, Provinsi Kepulauan Riau', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Aruna Karya Bangunindo', 'Jl. letkol Sentosa 83, Komp.Oase No.08,Kota Bengkulu, Bengkulu', '1000 0000 0959 6563', 'Angga Dewa', 'Direktur', '082183648885', 'ptarunakaryabangunindo@gmail.com', 'M. Januriyansyah, SH, M.Kn', '2025-03-04 00:00:00', '1.0', 'Bank Mandiri', '1010015246893 A.n PT. Aruna Karya Bangunindo', 'KC Jakarta Pondok Indah', NULL, NULL, NULL, 'B.22405/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pasar Bawah, Kab. Bengkulu Selatan Prov. Bengkulu', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Swarnabumi Ilman Persada', NULL, NULL, NULL, 'Direktur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'B.22004/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Ampang Pulai dan Desa Koto Nan Duo IV Koto Hilie Kab. Pesisir Selatan, Provinsi Sumatera Barat', NULL, NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Bengkel Kreatif Utama', 'Cipta Villa Mas Residence Blok B No. 2, Kota Tanjung Pinang, Kepulauan Riau', '0967 4539 8621 4000', 'Wan Ricco Saputra', 'Direktur Cabang', '081270099954', 'bengkelcreative.tpi@gmail.com', 'Elizabeth Ida Ayu, SH', '2026-06-05 00:00:00', '8.0', 'Bank Mandiri', '1090085112233 A.n PT. Bengkel Kreatif Utama', 'KCP Natuna', NULL, NULL, NULL, 'B.22474/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Natuna dan Lingga Provinsi Kepulauan Riau', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Laksana Aneka Sarana', 'Wonderland Palace Blok B No.8, Jl. Raya Pondok Rajeg, Kab. Bogor, Jawa Barat', '01.707.370.1-404.000', 'Siddiq', 'Direktur', '08129674773', 'laksanaanekasarana@gmail.com', 'Hambit Maseh, S.H.', '2024-05-27 00:00:00', '851.0', 'Bank DKI Syariah', '71216000062 A.n PT. LAKSANA ANEKA SARANA', 'KCP Syariah Manggarai', NULL, NULL, NULL, 'B.22375/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Sadai, Kabupaten Bangka Selatan dan di Desa Rambat dan Desa Tanjung Niur, Kabupaten Bangka Barat, Provinsi Kepulauan Bangka Belitung Tahun Anggaran 2026', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Ratu Nayla Mandiri', 'Jl. Dr. Wahidin Sudirohusodo, RT. 004 RW. 004, Desa Dahanrejo, Kecamatan Kebomas, Kabupaten Gresik', '20.774.048.1-642.000', 'Dyan Agung Wicaksono', 'Direktur', '085234904938', 'pt.ratunaylamandiri313@gmail.com', 'Imam Masyar, SH, M.Kn', '2025-08-26 00:00:00', '6.0', NULL, NULL, NULL, NULL, NULL, NULL, 'B.22376/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Banding, Desa Labuhan Ratu, dan Desa Muara Gading Mas Provinsi Lampung', 'Proses Cetak SP', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Diego Contractor', 'Arosuka Jalan Lingkar Pintu Angin, Desa/Kelurahan Batang Barus, Kec. Talang, Kab. Solok, Provinsi Sumatera Barat', '0965 1977 1820 1000', 'Digo Perdana Putra', 'Direktur', '081332141123', 'cvdiegocontractor@gmail.com', 'Victor Martin Cori, S.H., M.Kn.', '2026-02-23 00:00:00', '1.0', 'Bank BJB', '0162986521001 A.n CV DIEGO CONTRACTOR', 'Cabang S Parman', NULL, NULL, NULL, 'B.22790/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Padang Pariaman dan Pasaman Barat, Prov. Sumatera Barat', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Sadatahi Jaya Tama', 'Jl Duren Sawit Raya Ruko Duren Sawit Center N0 8-T, Kelurahan Klender, Kecamatan Duren Sawit – Jakarta Timur', '81.142.853.1-042.000', 'Ir. Togi Manik', 'Direktur Utama', '081264221944', 'ptsadatahijayatama@gmail.com', 'Pety Fatimah, S.H., .M.Hum., M.Kn.', '2024-05-07 00:00:00', '3.0', 'Bank BRI', '032901006748307 A.n SADATAHI JAYA TAMA', 'KC Jakarta Veteran', NULL, NULL, NULL, 'B.22791/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kecamatan Concong dan Sungai Batang, Kab. Indragiri Hilir, Prov. Riau', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Laksana Aneka Sarana', 'Wonderland Palace Blok B No.8, Jl. Raya Pondok Rajeg, Kab. Bogor, Jawa Barat', '01.707.370.1-404.000', 'Siddiq', 'Direktur', '08129674773', 'laksanaanekasarana@gmail.com', 'Hambit Maseh, S.H.', '2024-05-27 00:00:00', '851.0', 'Bank DKI Syariah', '71216000062 A.n PT. LAKSANA ANEKA SARANA', 'KCP Syariah Manggarai', NULL, NULL, NULL, 'B.22792/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kec. Tobali Kab. Bangka Selatan Prov. Kepulauan Bangka Belitung', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Multi Gapura Pembangunan Semesta', 'Graha Marlanco Lt. 4 Jl. Pulo Asem Utara Raya No. 18 Kota Adm. Jakarta Timur', '01.304.706.3-003.000', 'Gernando R Nainggolan MBA', 'Direktur Utama', '082260903030/aulia', 'mugapes.pt@gmail.com', 'Eka Verawaty, SH, M.Kn', '2026-02-19 00:00:00', '20.0', NULL, NULL, NULL, NULL, NULL, NULL, 'B.22793/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Desa Kwala Serapuh, Desa Paluh Sibaji, Dan Desa Nelayan Indah, Provinsi Sumatera Utara', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Rayhan Aditya', 'Jl. Puskesmas Taba, Kota Lubuk Linggau, Sumatera Selatan', '0837946375303000', 'Febri Aditiya Nata', 'Direktur', '082281315200', 'cvrayhanaditya@yahoo.com', 'AKMALUDDIN, SH.', '2020-09-23 00:00:00', '9.0', 'Bank Mandiri', '1010015260779 A.n CV. Rayhan Aditya', 'KC Jakarta Pondok Indah', NULL, NULL, NULL, 'B.22709/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Desa Pasar Lama & Desa Way Hawang, Kec. Kaur Selatan Kabupaten Kaur, Provinsi Bengkulu Timur', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Indo Jaya Negara Abadi', 'Jalan Pejaten Barat II, Gang Timbul No.21 Kelurahan Pejaten Barat, Kec. Pasar Minggu, Jakarta Selatan', '0925 2055 3601 7000', 'Hero Aska Karnanda', 'Direktur', '087731490688', 'officialindojayanegaraabadi@gmail.com', 'Diharini, S.H., M.Kn', '2026-04-14 00:00:00', '31.0', 'Bank Mandiri', '1270015184623 A.n PT INDO JAYA NEGARA ABADI', 'KC Jakarta Ampera Raya', NULL, NULL, NULL, 'B.23143/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Rebo dan Desa Batu Belubang  Provinsi Bangka Belitung Anggaran 2026', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Alfatir Risky Group', 'Jl. Merpati Dusun Lampoh Baro, Kota Banda Aceh, Provinsi Aceh', '1000000007752647', 'Azzahara Giannisa Sidi', 'Direktur Cabang', '081269400027', 'ptalfatir@gmail.com', 'Dr. Teuku Abdurahman, SH, SpN', '2026-07-10 00:00:00', '6.0', 'BNI', '7687689009 A.n PT. Alfatir Risky Group', 'KC Tanjung Pinang', NULL, NULL, NULL, 'B.22794/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau Tahun Anggaran 2026', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Yuniarto Sejahtera Abadi', 'Kp. Gondrong, Kab. Bekasi, Jawa Barat', '39.574.486.5-435.000', 'R Ario Yuniarto', 'Direktur', NULL, 'yuniartosejahteraabadi.ysa@gmail.com', 'Ita Munir Rahmawati, S.H., M.Kn', '2023-06-26 00:00:00', '37.0', 'Bank Mandiri', '1010015247594 A.n PT. Yuniarto Sejahtera Abadi', 'KC Jakarta Pondok Indah', NULL, NULL, NULL, 'B.23114/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Betung dan Desa Karang Brak, Kabupaten Tanggamus, Provinsi Lampung Tahun Anggaran 2026', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Sahabat Group Nusantara Mandiri', 'Green Flower Blok A10, Desa Sukomulyo, Kec. Lamongan, Kab. Lamongan, Prov. Jawa Timur', '0279604425645000', 'Aris Lukmanul Khakim', 'Direktur Utama', '085730951922', 'sgnm.la.jatim@gmail.com', 'Muhammad Yusuf Achmad, S.E., M.Kn.', '2024-10-08 00:00:00', '1.0', 'Bank Mandiri', '1780010528616 A.n PT. SAHABAT GROUP NUSANTARA MANDIRI', 'KCP Lamongan', NULL, NULL, NULL, 'B.23115/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Teluk Limau, Kecamatan Parittiga, Kabupaten Bangka Barat, Provinsi Kepulauan Bangka Belitung', 'Proses Cetak SP', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Indo Jaya Negara Abadi', 'Jl. Pejaten Barat II Gg. Timbul No. 21 Pejaten Barat, PasarMinggu, Jakarta Selatan', '74.978.211.6-429.000', 'Hero Aska Karnanda', 'Direktur', '087731490688', 'officialindojayanegaraabadi@gmail.com', 'Diharini, S.H., M.Kn', '2026-04-14 00:00:00', '31.0', 'Bank Mandiri', '1270015184623 A.n PT INDO JAYA NEGARA ABADI', 'KC Jakarta Ampera Raya', NULL, NULL, NULL, 'B.23144/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Mapur, Kecamatan Riau Silip, Kabupaten Bangka, Provinsi Kepulauan Bangka Belitung', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Aditya Musdalifah', 'Jl. Brawijaya, 07 BTN Sosial Hinekombe, Sentani Jayapura – Papua', '0030665574952000', 'Daniel Klau Bouk', 'Direktur Utama', '085231015571', 'adityamusdalifah01.pt@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'B.23116/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tajur Biru, Kabupaten Lingga, Provinsi Kepulauan Riau', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Duta Bangun Husaeni', 'Bukit Cimanggu City Blok L 1 No.12 RT 02/RW 011, Cibadak, Kota Bogor', '0944 7414 0440 4000', 'Ibnu Bunyan Al Azizi', 'Direktur', '082115115424', 'ptdutabangunhusaeni@gmail.com', 'Yayu Sri Rahayu, SH., M.Kn', '2026-01-15 00:00:00', '3.0', 'Bank BJB', '0162479563001 A.n PT. Duta Bangun Husaeni', 'KC Cibinong', NULL, NULL, NULL, 'B.23117/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Batu Belanak Kabupaten Natuna Provinsi Kepulauan Riau', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Trengginas Tirta Jaya Abadi', 'Jalan Zamrud LK I H.4 No. 05 RT.002 RW.000 Sukabumi Indah, Sukabumi Kota Bandar Lampung, Lampung', '04.995.321.9-323.000', 'Aldy Mega Syahputra', 'Direktur', '0812-7845-6690', 'pttrengginastirtajayaabadi@gmail.com', 'Fahrul Rozi, SH', '2024-01-30 00:00:00', '88.0', 'Bank Mandiri', '1140059595911 A.n PT. Trengginas Tirta Jaya Abadi', 'KCP Way Halim', NULL, NULL, NULL, 'B.23118/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Ampang Pulai, Dan Desa Koto Nan Duo IV Koto Hilie Kab. Pesisir Selatan Provinsi Sumatera Barat', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Yuniarto Sejahtera Abadi', 'Kp. Gondrong, Kab. Bekasi, Jawa Barat', '39.574.486.5-435.000', 'R Ario Yuniarto', 'Direktur', NULL, 'yuniartosejahteraabadi.ysa@gmail.com', 'Ita Munir Rahmawati, S.H., M.Kn', '2023-06-26 00:00:00', '37.0', 'Bank Mandiri', '1010015247594 A.n PT. Yuniarto Sejahtera Abadi', 'KC Jakarta Pondok Indah', NULL, NULL, NULL, 'B.23119/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun Anggaran 2026 Di Desa Way Nipah Dan Desa Tanjungan Kabupaten Tagamus Provinsi Lampung', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Mahanaim', 'Desa/Kelurahan Dermayu, Kecamatan Air Periukan, Kabupaten Seluma Provinsi Bengkulu', '70.568. 943.8-311.000', 'Sahat Sauli Sinaga', 'Wakil Direktur', '082266333122', 'cv.mahanaim79@gmail.com', 'DENI YOHANES , S.H., M.Kn,', '2023-06-14 00:00:00', '37.0', 'BSI', '1049882986 A.n CV MAHANAIM', 'KC BENGKULU A MALIK', NULL, NULL, NULL, 'B.23120/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Bagan Asahan Baru, dan Desa Bagan Asahan Pekan, Kabupaten Asahan, Provinsi Sumatera Utara', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. NIAGA KARYA RESTU INDONESIA', 'Jl. Suka Karya No. 63 Babakan Asem Teluk Naga
Tangerang Banten', '81.340.476.1.418.000', 'Raymond Young', 'Direktur', '08118000599', 'niagakaryarestuindonesia@gmail.com', 'Martianis, SH', '2025-03-21 00:00:00', '534.0', NULL, NULL, NULL, NULL, NULL, NULL, 'B.23121/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kecamatan Airpura, Dan Linggo Sari Baganti, Kabupaten Pesisir Selatan, Provinsi Sumatera Barat T.A 2026', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Pulau Tenggel', 'JL. KASWARI RAYA BLOK D NO. 07 Kota Tanjung Pinang', '41.992.294.3-952.000', 'Dalsah Aziz', 'Direktur', '08127728816', 'cv_pulautenggel@yahoo.co.id', 'Elizabeth Ida Ayu Suselo Angesti, SH', '2022-03-28 00:00:00', '62.0', 'Bank Riau KEPRI', '1030814093 a.n PULAU TENGGEL CV', 'Cabang Syariah Tanjungpinang', NULL, NULL, NULL, 'B.23434/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Teluk Bayur, dan Desa Teluk Siantan, Kecamatan Kepulauan Anambas, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Ibnu Munsyir Dwi Guna', 'JL. KELAPA HIJAU II /20 SUNGGUMINASA-GOWA', '02.224.285.3-807.000', 'Muh Reza', 'Kepala Cabang', '081341752007', 'ibnumuunsyir@gmail.com', 'Dudi Jufri, SH, M.Kn', '2026-08-14 00:00:00', '27.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kota Tanjung Pinang Dan Kabupaten Karimun Provinsi Kepulauan Riau', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Kelman Infra Perkasa', 'Yodya Tower Lantai 11, Jl. D.I. Panjaitan Kav. 8, Jakarta Timur', '0829 3942 3800 2000', 'Nancy Megawaty', 'Direktur', '08161377556', 'enquiry@kelmaninfraperkasa.com', 'EMMYRA FAUZIA KARIANA, S.H., M.Kn', '2026-02-09 00:00:00', '35.0', 'BANK BNI', '1152145582 A.n  KELMAN INFRA PRATAMA PT', 'Cabang Jakarta', NULL, NULL, NULL, 'B.23438/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Posek dan Desa Sungai Pinang, Kabupaten Lingga, Provinsi Kepulauan Riau', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Mucoindo Prakasa', 'Roseville SOHO and SUITE Nomor S0607 Sunburst CBD, Lot 1.8 BSD City, Lengkong Gudang, Serpong, Kota Tangerang Selatan, Banten', '21.128.369.2-411.000', 'Ikhsan Septiansyah', 'Direktur Utama', '0821-1118-6869', 'hq@mucoindo.co.id', 'Dr. Udin Narsudin, S.H., M.Hum.', '2026-06-22 00:00:00', '33.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kota Batam, Provinsi Kepulauan Riau', 'Proses Cetak SP', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Nafara Karya Consultant', 'Jl. PH.H Mustofa No. 133 RT. 002 / RW. 005 Kel. Sukapada Kec. Cibeunying Kidul Kota Bandung Jawa Barat', '53.421.743.5-423.000', 'ADI NUGRAHA', 'Direktur', '08814512972', 'cv.nafarakaryaconsultant@gmail.com', 'H. RUDI TAUFAN, SH, M.Kn', '2026-04-24 00:00:00', '87.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Air Putih dan Desa Kadur, Kecamatan Natuna, Kabupaten Natuna, Provinsi Kepulauan Riau', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Kelman Infra Perkasa', 'Yodya Tower Lantai 11, Jl. D.I. Panjaitan Kav. 8, Jakarta Timur', '0829 3942 3800 2000', 'Nancy Megawaty', 'Direktur', '08161377556', 'enquiry@kelmaninfraperkasa.com', 'EMMYRA FAUZIA KARIANA, S.H., M.Kn', '2026-02-09 00:00:00', '35.0', 'BANK BNI', '1152145582 A.n  KELMAN INFRA PRATAMA PT', 'Cabang Jakarta', NULL, NULL, NULL, 'B.23437/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Natuna Provinsi Kepulauan Riau', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Persada Artha Swandiri', 'Jalan Sukajaya, Komp. Arengka Lestari Blok O Nomor 8 Kelurahan Labuhbaru Barat, Kecamatan Payung Sekaki Kota Pekanbaru, Prov. Riau', '81.691.705.1-216.000', 'Leo Panjaitan', 'Direktur', '081268832290', NULL, 'Arlisa Martini, SH, Mkn', '2021-07-02 00:00:00', '3.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Nias Utara dan Gunung Sitoli, Provinsi Sumatera Utara', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Berkarya Indo Guna', 'Jl. Mochamad Kahfi I Lantai 3, Kelurahan Cipedak, Kec. Jagakarsa, Kota Adm. Jakarta Selatan, Provinsi DKI Jakarta', '0536 0373 7701 7000', 'Mu’adz Usama Bahanan', 'Direktur', '085718008583', 'berkaryaindoguna@gmail.com', 'Chrystofer,S.H., M.Kn', '2026-07-29 00:00:00', '150.0', 'Bank BRI', '023001005704309 A.n BERKARYA INDO GUNA', 'KC Jakarta Cut Mutiah', NULL, NULL, NULL, 'B.23436/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Sungai Burung, Kabupaten Tulang Bawang Tahun Anggaran 2026', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Pulau Tenggel', 'JL. KASWARI RAYA BLOK D NO. 07 Kota Tanjung Pinang', '41.992.294.3-952.000', 'Dalsah Aziz', 'Direktur', '08127728816', 'cv_pulautenggel@yahoo.co.id', 'Elizabeth Ida Ayu Suselo A', '2022-03-28 00:00:00', '62.0', 'Bank Riau KEPRI', '1030814093 a.n PULAU TENGGEL CV', 'Cabang Syariah Tanjungpinang', NULL, NULL, NULL, 'B.23435/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Belibak Dan Desa Piabung, Kecamatan Kepulauan Anambas, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau T.A 2026', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Rafka Berkah', 'Desa Mukai Mudik, Kab. Kerinci, Jambi.', '93.970.939.0-333.000', 'Nera Ofrida', 'Direktur', '085341579921', 'neraofrida31@gmail.com', 'Romi Afadarma, SH, MH', '2022-01-26 00:00:00', '106.0', 'Bank BNI', '1860698235 A.n CV RAFKA BERKAH', 'Cabang Sungai Penue', NULL, NULL, NULL, 'B.23439/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Balam, Kabupaten Pesisir Barat, Provinsi Lampung dan di Desa Tanjung Pandan, Kabupaten Kaur, Provinsi Bengkulu Tahun Anggaran 2026', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Gadjah Mine Perkasa', 'JL. LETJEN. SUPRAPTO, Kab. Karimun, Kepulauan Riau', '93.593.687.2-223.000', 'HERMANSYAH', 'Direktur', '082231503750', 'gadjahmineperkasa@gmail.com', 'ZULKHAINEN, SH, MH', '2019-11-05 00:00:00', '2.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Kepulauan Anambas Provinsi Kepulauan Riau Tahun Anggaran 2026', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Dewata Teknik', 'Jl. Wonorungkut Utara VI/19, Kota Surabaya, Jawa Timur', '0020 6770 6861 5000', 'I Gede Suarsana', 'Direktur', '08123278045', NULL, 'Sugeng Prijadi, S.H., M.Kn.', '2026-06-17 00:00:00', '11.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kec. Singkep Selatan, Lingga, Lingga Timur Dan Katang Bidare, Kab. Lingga Prov. Kepulauan Riau', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Prima Shina Cahaya', 'Jl. PHH Mustopha No.39 Surapati Core C3 Bandung Jawa Barat 40192', '0720 8745 8542 3000', 'Irvan Fajar Permana', 'Direktur', '081383000359', 'primashina.pt@gmail.com', 'Ahmad Fadillah, SH., M.Kn', '2026-07-21 00:00:00', '162.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi  Pembangunan Kampung Nelayan Merah Putih di Kabupaten Lingga Provinsi Kepulauan Riau', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Putera Matan', 'Jl. Haji Rais Abdur Rahman Gg. Sampang No. 21, Kota Pontianak, Kalimantan Barat', '02.086.318.9-703.000', 'Rapili Abdul Samad Yunus', 'Direktur', '081299660252', 'puteramatan36@yahoo.com', 'Novi Syafitri, SH', '2023-01-31 00:00:00', '302.0', NULL, NULL, NULL, NULL, NULL, NULL, 'B.23461/DJPT.6/PI.420/PPK/VIII/2026', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kabupaten Banyuasin, Musi Banyuasin dan Ogan Komering Ilir, Provinsi Sumatera Selatan', 'SCAN SP - DONE', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Mucoindo Prakasa', 'Roseville SOHO and SUITE Nomor S0607 Sunburst CBD, Lot 1.8 BSD City, Lengkong Gudang, Serpong, Kota Tangerang Selatan, Banten', '21.128.369.2-411.000', 'Ikhsan Septiansyah', 'Direktur Utama', '0821-1118-6869', 'hq@mucoindo.co.id', 'Dr. Udin Narsudin, SH, M.Hum', '2026-06-22 00:00:00', '33.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tanjung Piayu, dan Pulau Buluh, Kota Batam, Prov. Kepulauan Riau', 'Proses Cetak SP', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Arah Energi Indonesia', 'Orchid Business Centre Blok C2 Batam Center, Kota Batam, Kepulauan Riau 29432', '084.427.387.0-225.000', 'Ice Herry', 'Direktur', '085272728383', NULL, 'Hasan S.H', '2026-05-20 00:00:00', '2.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun 2026 Di Desa Karanganyar dan Desa Penyandingan, Kabupaten Tanggamus, Provinsi Lampung', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Nafara Karya Consultant', 'Jl. PH.H Mustofa No. 133 RT. 002 / RW. 005 Kel. Sukapada Kec. Cibeunying Kidul Kota Bandung Jawa Barat', '53.421.743.5-423.000', 'Adi Nugraha', 'Direktur', '08814512972', 'cv.nafarakaryaconsultant@gmail.com', 'H. Rudi Taufan, S.H, M.Kn', '2026-04-24 00:00:00', '87.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun 2026 Di Desa Subi, Desa Meliah dan Desa Batu Berlian Kabupaten Natuna Provinsi Kepulauan Riau', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Raharjo', 'Jl. Trikora Kampung Pisang, Bintan Timur, Desa/Kelurahan Kijang Kota, Kec. Bintan Timur, Provinsi Kepulauan Riau', '0017 6850 6622 4000', 'Nursyahri', 'Direktur', '081375602922', 'pt.raharjo@yahoo.com', 'Sutikno, S.H', '2023-10-17 00:00:00', '80.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun Anggaran 2026 di Desa Mampok, dan Air Bini, Kabupaten Kepulauan Anambas, Prov. Kepulauan Riau', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Lubuk Indah', 'Sagulung Sumber Sari Blok C.10 no 71, Desa/Kelurahan Sungai Langkai, Kec. Sagulung, Kota Batam, Provinsi Kepulauan Riau', '01.763.805.7-1-1.000', NULL, 'Direktur', '0813 6072 8789', 'ptlubukindah8@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tanjung Kelit, Benan, Pulau Bukit Dan Pulau Duyung Pada Kab. Lingga Provinsi Kepulauan Riau Tahun Anggaran 2026', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Raharjo', 'Jl. Trikora Kampung Pisang, Bintan Timur, Desa/Kelurahan Kijang Kota, Kec. Bintan Timur, Provinsi Kepulauan Riau', '0017685066224000', 'Nursyahri', 'Direktur', '081375602922', 'pt.raharjo@yahoo.com', 'Sutikno, S.H', '2023-10-17 00:00:00', '80.0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pesisir Timur dan Desa Rewak, Kab. Kepulauan Anambas, Provinsi Kepulauan Riau', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('CV. Sabrina Almahyra', 'Jalan kelapapati Tengah, Kab.Bengkalis, Riau.', '0627 5824 1421 9000', NULL, 'Direktur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Penyengat Kecamatan Tanjung Apit, Kabupaten Siak, Provinsi Riau Tahun Anggaran 2026', 'Menunggu JAMPEL', NULL, NOW(), NOW());
INSERT INTO perusahaans (nama, alamat, npwp, nama_direktur, jabatan_direktur, no_telp, email, notaris_akta, tanggal_akta, no_akta, nama_bank, norek_bank, cabang_bank, nama_bank_jaminan, no_jaminan, tgl_jaminan, no_kontrak, nama_paket, status_administrasi, status_karwas, created_at, updated_at)
VALUES ('PT. Aditya Musdalifah', 'Jl. Brawijaya, 07 BTN Sosial Hinekombe, Sentani Jayapura – Papua', '0030665574952000', 'Daniel Klau Bouk', 'Direktur Utama', '085231015571', 'adityamusdalifah01.pt@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Penaah, Kecamatan Senayang, Kabupaten Lingga, Provinsi Kepulauan Riau', 'Menunggu JAMPEL', NULL, NOW(), NOW());
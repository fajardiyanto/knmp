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

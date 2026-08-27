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

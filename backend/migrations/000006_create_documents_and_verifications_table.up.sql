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

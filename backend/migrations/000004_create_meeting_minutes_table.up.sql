-- Create notulens table
CREATE TABLE IF NOT EXISTS notulens (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT REFERENCES knmps(id) ON DELETE SET NULL,
    judul VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    waktu_mulai VARCHAR(10),
    waktu_selesai VARCHAR(10),
    lokasi VARCHAR(255),
    pimpinan_rapat VARCHAR(255),
    notulis VARCHAR(255) DEFAULT 'Super Admin',
    agenda TEXT,
    hasil_pembahasan TEXT NOT NULL,
    tindak_lanjut TEXT,
    status VARCHAR(50) DEFAULT 'published',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create notulen_shares table for multi-user distribution
CREATE TABLE IF NOT EXISTS notulen_shares (
    id BIGSERIAL PRIMARY KEY,
    notulen_id BIGINT NOT NULL REFERENCES notulens(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_notulen_user_share UNIQUE(notulen_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notulens_knmp_id ON notulens(knmp_id);
CREATE INDEX IF NOT EXISTS idx_notulens_created_by ON notulens(created_by);
CREATE INDEX IF NOT EXISTS idx_notulen_shares_user_id ON notulen_shares(user_id);

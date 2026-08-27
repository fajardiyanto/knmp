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

# Referensi Database Schema & API Endpoints KNMP v2

Dokumen ini memuat skema tabel utama PostgreSQL dan daftar endpoint API untuk mempermudah pengembangan backend dan integrasi frontend.

---

## 1. Skema Tabel Utama Database

### A. Tabel `knmps` (346 Titik Se-Sumatera)
```sql
CREATE TABLE knmps (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    regional_id BIGINT,
    province_id BIGINT,
    regency_id BIGINT,
    district_id BIGINT,
    sub_district_id BIGINT,
    regional_name VARCHAR(100),
    province_name VARCHAR(100),
    regency_name VARCHAR(100),
    district_name VARCHAR(100),
    sub_district_name VARCHAR(100),
    jenis_knmp VARCHAR(50) DEFAULT 'penyangga', -- 'hub' | 'penyangga'
    lat VARCHAR(50),
    long VARCHAR(50),
    status VARCHAR(50) DEFAULT 'on_track',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### B. Tabel `persiapans` (58 Paket Kontrak, PCM, & Mobilisasi)
```sql
CREATE TABLE persiapans (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT REFERENCES knmps(id),
    user_id BIGINT REFERENCES users(id),
    nama VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL,
    jenis VARCHAR(50) NOT NULL, -- 'kontrak' | 'pcm' | 'mobilisasi'
    keterangan TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    additional_data JSONB, -- Memuat nomor_sp, spmk, nilai_kontrak, kontak, PPK
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### C. Tabel `pelaksanaans` (Kegiatan Harian Konstruksi)
```sql
CREATE TABLE pelaksanaans (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT REFERENCES knmps(id),
    user_id BIGINT REFERENCES users(id),
    nama VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL,
    jenis_laporan VARCHAR(50) DEFAULT 'harian', -- 'harian' | 'mingguan' | 'bulanan'
    status_k3 VARCHAR(50) DEFAULT 'aman',
    kendala TEXT,
    keterangan TEXT,
    additional_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### D. Tabel `laporans` (Laporan Proyek Resmi)
```sql
CREATE TABLE laporans (
    id BIGSERIAL PRIMARY KEY,
    pelaksanaan_id BIGINT REFERENCES pelaksanaans(id),
    user_id BIGINT REFERENCES users(id),
    nama VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL,
    jenis_laporan VARCHAR(50) NOT NULL, -- 'harian' | 'mingguan' | 'bulanan'
    keberapa INT DEFAULT 1,
    cuaca VARCHAR(50) DEFAULT 'cerah',
    jumlah_tenaga_kerja INT DEFAULT 0,
    rencana_progres_fisik NUMERIC(5,2) DEFAULT 0.00,
    realisasi_progres_fisik NUMERIC(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'baru', -- 'baru' | 'menunggu_pengawas' | 'terverifikasi'
    lat VARCHAR(50),
    long VARCHAR(50),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### E. Tabel `pembayarans` (Termin Kontrak)
```sql
CREATE TABLE pembayarans (
    id BIGSERIAL PRIMARY KEY,
    persiapan_kontrak_id BIGINT REFERENCES persiapans(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    termin VARCHAR(50) NOT NULL, -- 'Termin 1' (25%) | 'Termin 2' (25%) | 'Termin 3' (25%) | 'Termin 4' (20%) | 'Retensi' (5%)
    realisasi_anggaran NUMERIC(15,2) DEFAULT 0.00,
    realisasi_fisik NUMERIC(5,2) DEFAULT 0.00,
    norek_pekerja VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. Ringkasan API Endpoints

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Otentikasi user & penerbitan JWT token | Publik |
| `GET` | `/api/v1/knmp` | Daftar titik KNMP (otomatis scoped jika kontraktor) | Authenticated |
| `GET` | `/api/v1/knmp/map` | Data GeoJSON / titik koordinat peta Sumatera | Authenticated |
| `GET` | `/api/v1/knmp/widget` | Agregasi metrik dashboard & progress | Authenticated |
| `GET` | `/api/v1/persiapan?jenis=kontrak` | Daftar 58 paket kontrak & SPMK | Authenticated |
| `GET` | `/api/v1/persiapan?jenis=pcm` | Data rapat Pre-Construction Meeting | Authenticated |
| `GET` | `/api/v1/persiapan?jenis=mobilisasi` | Data mobilisasi alat & material | Authenticated |
| `GET` | `/api/v1/pelaksanaan` | Data pelaksanaan harian konstruksi | Authenticated |
| `GET` | `/api/v1/laporan` | Daftar laporan (scoped by KNMP) | Authenticated |
| `GET` | `/api/v1/laporan/project-report` | Generator data Laporan Proyek Terpadu (14 Bagian) | Authenticated |
| `PATCH`| `/api/v1/laporan/:id/verify` | Verifikasi status laporan (Pengawas/PPK) | Pengawas/PPK |
| `GET` | `/api/v1/pembayaran` | Data termin pembayaran kontrak | Authenticated |
| `GET` | `/api/v1/issue` | Daftar issue & kendala kritis lapangan | Authenticated |
| `GET` | `/api/v1/absensi` | Rekap kehadiran pekerja lapangan | Authenticated |
| `GET` | `/ws/chat` | WebSocket realtime chat antar-aktor proyek | Authenticated |

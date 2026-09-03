# RFC-001: Arsitektur BOQ Terintegrasi SIMANDOR 360 KNMP — Status Implementasi & Roadmap Pengembangan

| Metadata | Keterangan |
| :--- | :--- |
| **Nomor RFC** | RFC-001 |
| **Judul** | Evaluasi Keterpaduan BOQ & Volume SIMANDOR 360 KNMP v2 |
| **Status** | `PROPOSED / IN-PROGRESS` |
| **Dokumen Acuan** | `data/fixing/Paket_Lengkap_Konsep_SIMANDOR_360_KNMP/konsep_implementasi_boq_simandor_knmp_UPDATED.md` |
| **Workbook Acuan** | `BOQ_KNMP_Final.xlsx` (10 Sheets Standar KKP) |
| **Tanggal Terbit** | 03 September 2026 |
| **Target Sistem** | Backend Go (Fiber + PostgreSQL) & Frontend React (TypeScript + Vite) |

---

## 1. Ringkasan Eksekutif

Dokumen RFC (*Request for Comments*) ini merangkum hasil audit komparatif antara **Konsep Implementasi BOQ Terintegrasi SIMANDOR 360** (yang tertuang dalam dokumen cetak biru 2.560 baris) dengan **kondisi riil kode aplikasi KNMP v2** saat ini.

Tujuan utama dokumen ini adalah:
1. Memetakan secara transparan seluruh komponen modul BOQ yang **sudah berhasil diimplementasikan**.
2. Mengidentifikasi rincian kesenjangan (*gaps*) dan fitur yang **belum dibangun**.
3. Menyediakan arsitektur target, skema basis data usulan, serta peta jalan (*roadmap*) bertahap agar sistem SIMANDOR 360 dapat berfungsi utuh sebagai pusat kendali kuantitas fisik dan komersial program KNMP se-Sumatera (346 titik).

---

## 2. Prinsip Arsitektur Acuan (Blueprint Review)

Sesuai dokumen acuan `konsep_implementasi_boq_simandor_knmp_UPDATED.md`, modul BOQ bertumpu pada 3 prinsip utama:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. BOQ KONTRAK ADALAH BASELINE TERKUNCI (LOCKED REV-0)                │
│    BOQ kontrak tidak diedit harian. Perubahan volume/harga HANYA      │
│    melalui mekanisme persetujuan resmi VO / CCO / Addendum Kontrak.    │
├────────────────────────────────────────────────────────────────────────┤
│ 2. EMPAT LAYER PROGRES TERPISAH (4-LAYER PROGRESSION)                  │
│    Planned Progress   : Target baseline schedule / Kurva S             │
│    Reported Progress  : Klaim capaian harian kontraktor                │
│    Verified Progress  : Hasil opname / joint measurement pengawas      │
│    Certified Progress : Volume sah pada Monthly Certificate (MC)       │
├────────────────────────────────────────────────────────────────────────┤
│ 3. SATU INPUT, BANYAK OUTPUT (SINGLE SOURCE OF TRUTH)                 │
│    Kontraktor menginput volume harian sekali saja (Daily BOQ), lalu    │
│    otomatis mengalir ke Laporan Harian, Mingguan, Bulanan, & Kurva-S.  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Apa Saja yang SUDAH Dilakukan (Implemented Features)

Sistem saat ini telah memiliki fondasi pengawasan mingguan dan mitigasi audit yang kuat. Berikut rincian implementasi yang sudah berjalan:

### 3.1. Skema Basis Data & Migrasi Backend
Telah diterbitkan migrasi database PostgreSQL:
- **`000012_create_weekly_boq_control.up.sql`**:
  - Tabel `weekly_boq_controls`: Mencatat kontrol mingguan per titik KNMP (`knmp_id`), periode rentang tanggal (`week_start`, `week_end`), skor klaim kontraktor (`contractor_claim_pct`), skor verifikasi pengawas (`supervisor_verified_pct`), bukti fisik (`evidence_supported_pct`), dan nilai potensi risiko temuan audit (`audit_exposure_value`).
  - Tabel `weekly_boq_items`: Rincian item BOQ dengan kolom kode item, uraian, volume kontrak, satuan, nilai kontrak, bobot %, realisasi lalu, klaim kontraktor, verifikasi pengawas, bukti fisik, persentase deviasi, status bukti (`complete`/`partial`/`missing`), serta tingkat risiko (`rendah`/`sedang`/`kritis`).
  - Index performa pada relasi titik, periode, dan tingkat risiko.
  - Penambahan hak akses granular: `boq_create`, `boq_read`, `boq_update`, `boq_delete` ke peran `super_admin`, `admin_ppk`, `pengawas`, dan `kontraktor`.
- **`000013_add_weekly_boq_manual_tables.up.sql`**:
  - Kolom fleksibel `manual_tables JSONB` untuk mengakomodasi data Lampiran 2, 3, dan 4.

### 3.2. Endpoint API Backend (Golang Fiber)
Backend telah menyediakan RESTful API lengkap pada rute `/api/v1/boq-weekly`:
- `GET /api/v1/boq-weekly` — Daftar rekap kontrol BOQ dengan filter titik KNMP dan status.
- `GET /api/v1/boq-weekly/stats` — Agregat KPI: rata-rata klaim, rata-rata verifikasi, gap bukti, dan total nilai eksposur audit.
- `GET /api/v1/boq-weekly/:id` — Detail lengkap kontrol mingguan beserta seluruh item dan tabel lampiran.
- `POST /api/v1/boq-weekly` — Pembuatan rekap kontrol mingguan baru.
- `PUT /api/v1/boq-weekly/:id` — Pembaruan rincian item kontrol dan evaluasi pengawas.
- `PATCH /api/v1/boq-weekly/:id/status` — Persetujuan status kontrol (`open`, `in_review`, `closed`).
- `DELETE /api/v1/boq-weekly/:id` — Penghapusan kontrol (*soft delete*).

### 3.3. Antarmuka Pengguna Frontend (React + TypeScript)
Telah dibangun modul BOQ interaktif pada rute `/boq-weekly`:
1. **Halaman Dashboard Monitoring (`WeeklyBOQPage.tsx`)**:
   - Widget KPI Eksekutif: Kontrol Terbuka, Rata-rata Klaim vs Terverifikasi, Gap Bukti Fisik, dan Nilai Eksposur Audit (Rp).
   - Indikator Visual Gap Klaim vs Opname Pengawas.
   - Rekomendasi Tindak Lanjut Otomatis (*Follow-up Action Engine*) untuk item-item deviasi kritis (< -5%) atau bukti tidak lengkap.
   - Ekspor laporan audit ke format **Microsoft Excel (`ExcelJS`)**.
2. **Form Input Kontrol Mingguan 4 Lampiran (`WeeklyBOQInputPage.tsx`)**:
   - **Lampiran 1**: Matriks Kontrol Item BOQ, Bobot %, Realisasi Minggu Lalu, Klaim Kontraktor %, Verifikasi Pengawas %, Dukungan Bukti %, dan Kalkulasi Deviasi otomatis.
   - **Lampiran 2**: Validasi Dokumen Pendukung (Cek kesesuaian RAB, Gambar/RKS/Spektek, Fisik Terpasang, dan Keterangan Lapangan).
   - **Lampiran 3**: Matriks Foto Kondisi Lapangan dengan slot upload gambar langsung.
   - **Lampiran 4**: Rekapitulasi Deviasi Biaya & CCO (Kontrak Awal, CCO3, Rencana MC-100, Tambah/Kurang).

### 3.4. Integrasi Format Laporan Resmi KKP
- Modul cetak terpadu: **Laporan Harian, Laporan Mingguan, dan Laporan Bulanan**.
- Telah dilengkapi fitur zoom cetak, pratinjau mode portrait/landscape A4 dan A3.
- **Pembersihan Data Fiktif**: Seluruh nilai default/mock (seperti Rp 1,85 M, SPMK palsu, dan DIV-1 dummy) telah dieliminasi total. Apabila database belum memiliki input realisasi untuk titik/periode tersebut, antarmuka cetak secara bersih menampilkan label **`Tidak ada data`** dan tanda strip (**`-`**).

---

## 4. Matriks Evaluasi: Konsep Acuan vs Implementasi Riil

| Komponen Arsitektur | Target Konsep (`UPDATED.md`) | Kondisi Riil Saat Ini | Status |
| :--- | :--- | :--- | :---: |
| **Master BOQ Baseline** | Tabel `boq_items` permanen dikunci di Persiapan Kontrak (`REV-0 LOCKED`). | Belum ada master item kontrak independen; item BOQ baru dicatat per kontrol mingguan. | 🔴 **GAP** |
| **Excel Parser `BOQ_KNMP_Final.xlsx`** | Fitur import otomatis sheet `02_BOQ_DETAIL` dengan validasi balance nilai kontrak. | Belum ada parser Excel di backend/frontend; input item masih manual. | 🔴 **GAP** |
| **Quantity Take-Off (QTO)** | Sheet `03_HITUNG_VOLUME`: perhitungan rumus P×L×T per segmen lokasi dan tautan gambar kerja. | Belum ada tabel `quantity_takeoff` maupun antarmuka perhitungan dimensi volume. | 🔴 **GAP** |
| **Analisa Harga Satuan (AHSP)** | Sheet `04_AHSP`: rincian koefisien bahan, tenaga kerja, alat, serta overhead & profit. | Belum diimplementasikan ke dalam basis data maupun antarmuka pengguna. | 🔴 **GAP** |
| **Transaksi Harian per Item BOQ** | Transaksi volume terpasang harian per item BOQ (`daily_boq_progress`). | Modul Pelaksanaan baru mencatat progres persentase fisik umum, bukan volume per kode BOQ. | 🔴 **GAP** |
| **Multi-Layer Progress Tracking** | Pemisahan tegas: *Planned*, *Reported*, *Verified*, dan *Certified*. | Layer *Reported*, *Verified*, dan *Evidence* sudah berjalan di BOQ Weekly, namun *Certified (MC)* belum terpisah. | 🟡 **PARSIAL** |
| **Monthly Certificate (MC)** | Sheet `05_PROGRESS_MC`: modul sertifikasi bulanan (`mc_header` & `mc_items`) sebagai syarat termin. | Modul Pembayaran mencatat termin persentase global (25%, 50%, dll) tanpa sertifikasi kuantitas MC. | 🔴 **GAP** |
| **Addendum / VO / CCO Formal** | Sheet `06_ADDENDUM_VO`: alur persetujuan perubahan yang otomatis memperbarui `effective_quantity`. | Sudah ada tabel Lampiran 4 CCO, namun belum ada alur formal persetujuan versi (`REV-1`, `REV-2`). | 🟡 **PARSIAL** |
| **Evidence & Geotagged Visual** | Foto ber-GPS, timestamp, kategori *Before-During-After* per item pekerjaan. | Sudah didukung penuh pada modul Pelaksanaan, Laporan, dan Lampiran 3 BOQ. | 🟢 **SESUAI** |
| **Kurva-S Multi-Layer** | Kurva-S memplot 4 garis: Rencana, Klaim Harian, Hasil Opname, dan Sertifikat MC. | Sudah ada Kurva-S di Laporan/Pelaksanaan, namun baru menampilkan 2 garis (Rencana vs Realisasi). | 🟡 **PARSIAL** |
| **Period Lock & Audit Trail** | Penguncian periode cut-off mingguan dan histori perubahan (user, waktu, alasan). | Kolom status penguncian sudah ada (`open`/`closed`), namun riwayat revisi mendalam belum dicatat. | 🟡 **PARSIAL** |

---

## 5. Apa Saja yang BELUM Dilakukan (Remaining Backlog)

Untuk memenuhi cetak biru SIMANDOR 360 secara komprehensif, berikut 6 paket pekerjaan utama yang perlu dibangun:

### 5.1. Paket 1: Master BOQ Baseline Kontrak & Parser Import Excel
1. Membuat tabel master `boq_items` dan `boq_versions` di PostgreSQL.
2. Membangun modul upload file Excel pada menu **Persiapan Kontrak** (`/persiapan`) yang dapat membaca sheet `02_BOQ_DETAIL` dari workbook `BOQ_KNMP_Final.xlsx`.
3. Membangun logika validasi otomatis:
   $$\text{Total Nilai BOQ Hasil Hitung} = \sum (\text{Volume} \times \text{Harga Satuan})$$
   $$\text{Selisih} = |\text{Total Nilai BOQ} - \text{Nilai Kontrak SPMK}|$$
   Jika selisih $> 0$, sistem memberi peringatan *BOQ Not Balanced* dan memblokir status *Ready for PCM*.
4. Fitur tombol `[Lock Baseline REV-0]` setelah verifikasi selesai agar kuantitas dan harga satuan awal tidak dapat diubah langsung oleh kontraktor.

### 5.2. Paket 2: Transaksi Progres Harian Berbasis Volume Fisik
1. Membuat tabel transaksi `daily_boq_progress` di database.
2. Memodifikasi form input harian di modul **Pelaksanaan**:
   - Kontraktor tidak hanya mengisi teks catatan kegiatan, melainkan memilih item BOQ (dropdown autocomplete) dan menginput kuantitas fisik yang dikerjakan hari ini ($\text{m}^3$, $\text{m}^2$, $\text{m}'$, $\text{kg}$, $\text{titik}$, $\text{unit}$).
   - Kuantitas harian otomatis ditautkan dengan bukti foto geotagged.
3. Menghitung akumulasi volume klaim secara otomatis:
   $$\text{Reported Cumulative} = \sum \text{Reported Quantity Today}$$
   $$\text{Reported Progress (\%)} = \frac{\text{Reported Cumulative}}{\text{Effective Contract Quantity}} \times 100\%$$

### 5.3. Paket 3: Mesin Agregasi Otomatis ("Satu Input, Banyak Output")
1. Menghilangkan kebutuhan kontraktor/konsultan menginput persentase laporan secara berulang.
2. Backend secara otomatis mengagregasi data harian menjadi:
   - **Laporan Mingguan**: Agregasi 7 hari kalender (volume minggu lalu, volume minggu ini, kumulatif, dan deviasi).
   - **Laporan Bulanan**: Agregasi periode 30 hari / 1 bulan kalender.
   - **Kurva-S**: Garis realisasi harian & mingguan langsung di-plot dari hasil agregasi volume.

### 5.4. Paket 4: Modul Opname Lapangan & Sertifikasi MC (Monthly Certificate)
1. Membangun modul verifikasi berkala (opname bersama): pengawas lapangan mengukur volume terpasang riil (`measured_quantity` $\to$ `verified_quantity`).
2. Membuat tabel `mc_header` dan `mc_items` untuk penerbitan dokumen sertifikat bulanan (MC-01, MC-02, dst).
3. Menerapkan aturan bisnis (*business rule*) validasi sistem:
   $$\text{Certified Quantity (MC)} \le \text{Supervisor Verified Quantity}$$
4. Menghubungkan capaian volume MC dengan kesiapan pembayaran (*Payment Readiness*) pada modul **Termin Pembayaran Kontrak**.

### 5.5. Paket 5: Modul Perubahan Kontrak Formal (VO / CCO / Addendum)
1. Membuat tabel `contract_changes` dan `contract_change_items`.
2. Alur kerja bertingkat: Pengajuan usulan perubahan volume / item baru $\to$ Pembahasan teknis $\to$ Persetujuan PPK.
3. Setelah berstatus `APPROVED`, sistem otomatis memperbarui volume efektif tanpa menghapus volume kontrak awal:
   $$\text{Effective Contract Quantity} = \text{Original Quantity} + \sum \text{Approved Change Quantity}$$
4. Sistem melahirkan snapshot versi baru: `REV-1 (Addendum 01)`, `REV-2 (Addendum 02)`, sehingga histori audit kontrak tetap utuh.

### 5.6. Paket 6: Modul QTO (Hitung Volume) & Referensi AHSP
1. Menambahkan tab **QTO (Quantity Take-Off)** untuk mendokumentasikan rincian pengukuran dimensi bangunan (Panjang $\times$ Lebar $\times$ Tinggi/Tebal $\times$ Faktor Pengali).
2. Menyimpan referensi gambar kerja (*Shop Drawing ID*) pada setiap rincian perhitungan volume.
3. Menambahkan referensi harga satuan (AHSP) untuk dasar justifikasi harga pekerjaan tambah baru pada Addendum.

---

## 6. Usulan Skema Basis Data Lanjutan (Target DDL)

Berikut rancangan skema PostgreSQL yang disiapkan untuk melengkapi kapabilitas modul BOQ:

```sql
-- 1. Master BOQ Items (Baseline Kontrak)
CREATE TABLE IF NOT EXISTS boq_items (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT NOT NULL REFERENCES knmps(id) ON DELETE CASCADE,
    building_name VARCHAR(150) NOT NULL DEFAULT 'Fasilitas Utama',
    section VARCHAR(100) NOT NULL,              -- e.g. Divisi 1: Pekerjaan Persiapan
    item_code VARCHAR(50) NOT NULL,             -- e.g. B.02 / DIV-1.1
    item_name VARCHAR(255) NOT NULL,
    applicability VARCHAR(30) NOT NULL DEFAULT 'applicable', -- applicable / optional / not_applicable
    unit VARCHAR(30) NOT NULL,                  -- m3, m2, m, kg, ls, unit
    original_quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    approved_change_quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    effective_quantity NUMERIC(18,4) GENERATED ALWAYS AS (original_quantity + approved_change_quantity) STORED,
    contract_unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    original_amount NUMERIC(18,2) GENERATED ALWAYS AS (original_quantity * contract_unit_price) STORED,
    effective_amount NUMERIC(18,2) GENERATED ALWAYS AS ((original_quantity + approved_change_quantity) * contract_unit_price) STORED,
    weight_pct NUMERIC(8,4) NOT NULL DEFAULT 0,
    current_revision VARCHAR(20) NOT NULL DEFAULT 'REV-0',
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 2. Transaksi Progres Harian per Item BOQ
CREATE TABLE IF NOT EXISTS daily_boq_progress (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT NOT NULL REFERENCES knmps(id) ON DELETE CASCADE,
    boq_item_id BIGINT NOT NULL REFERENCES boq_items(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    quantity_today NUMERIC(18,4) NOT NULL DEFAULT 0,
    location_segment VARCHAR(150) NULL,
    weather VARCHAR(50) NULL,
    notes TEXT NULL,
    submitted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 3. Verifikasi Opname Lapangan (Joint Measurement)
CREATE TABLE IF NOT EXISTS quantity_verifications (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT NOT NULL REFERENCES knmps(id) ON DELETE CASCADE,
    boq_item_id BIGINT NOT NULL REFERENCES boq_items(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    reported_quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    measured_quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    verified_quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    difference NUMERIC(18,4) GENERATED ALWAYS AS (verified_quantity - reported_quantity) STORED,
    ba_document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'verified',
    verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Monthly Certificate (Sertifikat Pembayaran Bulanan)
CREATE TABLE IF NOT EXISTS mc_headers (
    id BIGSERIAL PRIMARY KEY,
    knmp_id BIGINT NOT NULL REFERENCES knmps(id) ON DELETE CASCADE,
    mc_number VARCHAR(50) NOT NULL,             -- e.g. MC-01, MC-02
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    submission_date DATE NOT NULL,
    total_certified_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft / submitted / approved / paid
    document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mc_items (
    id BIGSERIAL PRIMARY KEY,
    mc_id BIGINT NOT NULL REFERENCES mc_headers(id) ON DELETE CASCADE,
    boq_item_id BIGINT NOT NULL REFERENCES boq_items(id) ON DELETE CASCADE,
    previous_quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    current_quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    cumulative_quantity NUMERIC(18,4) GENERATED ALWAYS AS (previous_quantity + current_quantity) STORED,
    current_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    cumulative_amount NUMERIC(18,2) NOT NULL DEFAULT 0
);
```

---

## 7. Tahapan Eksekusi Bertahap (Roadmap)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 1: Master Baseline & Parser Excel (Estimasi: Sprint 1)            │
│ • Migrasi tabel boq_items & boq_versions                               │
│ • Upload & validasi balance file Excel BOQ_KNMP_Final.xlsx di Persiapan│
│ • Tombol Kunci Kontrak Baseline REV-0                                  │
├────────────────────────────────────────────────────────────────────────┤
│ FASE 2: Transaksi Kuantitas Harian & Agregasi Otomatis (Sprint 2)      │
│ • Integrasi input volume fisik harian pada modul Pelaksanaan           │
│ • Backend auto-aggregation: Daily -> Laporan Mingguan & Bulanan        │
│ • Eliminasi total input manual persentase yang berulang                │
├────────────────────────────────────────────────────────────────────────┤
│ FASE 3: Modul Opname Pengawas & MC Engine (Sprint 3)                   │
│ • Form verifikasi opname volume bersama pengawas                       │
│ • Lembar sertifikasi bulanan (MC-01, MC-02)                            │
│ • Sinkronisasi syarat pencairan Termin Pembayaran (Payment Readiness)  │
├────────────────────────────────────────────────────────────────────────┤
│ FASE 4: Addendum Kontrak (VO/CCO) & Kurva-S 4-Garis (Sprint 4)         │
│ • Alur pengajuan & persetujuan CCO/Addendum (REV-1, REV-2)             │
│ • Kurva-S visual 4 garis: Planned, Reported, Verified, Certified       │
│ • Penguncian histori periode cut-off & audit trail per item            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Kesimpulan & Rekomendasi

Sistem SIMANDOR 360 saat ini telah memiliki **fondasi pengawasan audit mingguan yang unggul** melalui modul `/boq-weekly` dan format pelaporan resmi KKP yang rapi tanpa data dummy. 

Untuk mentransformasikan sistem menjadi **platform ERP Konstruksi BOQ Terintegrasi penuh** sebagaimana yang diamanatkan oleh dokumen cetak biru:
- Langkah strategis berikutnya adalah mengeksekusi **Fase 1: Pembuatan Master BOQ Baseline Kontrak & Parser Excel Import** agar sistem memiliki daftar item kuantitas kontrak baku yang tidak berubah-ubah.
- Data master tersebut kemudian menjadi jangkar tunggal (*single anchor*) untuk seluruh pencatatan harian kontraktor, verifikasi pengawas, hingga sertifikat termin pembayaran.

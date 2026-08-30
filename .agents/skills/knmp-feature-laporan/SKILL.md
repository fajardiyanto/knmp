---
name: knmp-feature-laporan
description: Panduan teknis & domain untuk modul Laporan dan Generator Laporan Proyek Terpadu resmi KNMP v2. Gunakan skill ini saat membuat, mengedit, memodifikasi, atau memvalidasi laporan harian, mingguan, bulanan, kurva-S, 14 bagian laporan proyek terpadu, mode print/cetak A4/A3 Portrait & Landscape, fitur zoom, serta aturan scoping isolasi KNMP user.
---

# KNMP Feature: Laporan & Generator Laporan Proyek Terpadu

Modul ini bertanggung jawab atas pelaporan progres konstruksi, deviasi rencana vs realisasi, dokumentasi lapangan, dan penyusunan **Laporan Proyek Terpadu (Monthly Project Report)** format resmi PPK/Kontraktor.

---

## 1. Arsitektur Data & Model Backend

### Tabel Database
* `laporans`: Record utama laporan (nama, tanggal, `jenis_laporan`, `rencana_progres_fisik`, `realisasi_progres_fisik`, `status`, `cuaca`, `jumlah_tenaga_kerja`, `lat`, `long`).
* `laporan_jenis_bangunan`: Hubungan many-to-many ke master jenis bangunan & rincian progres per item.

### Hak Akses & Scoping (`laporan_repo.go`)
* **SuperAdmin / Admin PPK / PPK**: Melihat seluruh laporan dari semua titik KNMP.
* **Kontraktor / Operator Lapangan**: Hanya melihat laporan yang terkait dengan titik KNMP yang ditugaskan (`p.knmp_id = ANY(user_knmp_ids)` atau `l.user_id = user_id`).

### API Endpoints
* `GET /api/v1/laporan` — List laporan dengan filter (`knmp_id`, `pelaksanaan_id`, `status`, `jenis_laporan`, `search`).
* `POST /api/v1/laporan` — Simpan laporan baru dengan foto/geotagging & relasi jenis bangunan.
* `PATCH /api/v1/laporan/:id/verify` — Pengesahan laporan oleh Konsultan Pengawas / PPK (`menunggu_pengawas` ➔ `menunggu_wakil_ppk` ➔ `terverifikasi`).
* `GET /api/v1/laporan/project-report` — Mengembalikan agregasi data lengkap 14 bagian laporan proyek terpadu berdasarkan `knmp_id` dan `period_type` (`harian` | `mingguan` | `bulanan` | `custom`).

---

## 2. Struktur Frontend (`src/features/laporan/`)

* `components/LaporanPage.tsx`: Halaman utama tabel laporan, metrik card (Total, Dokumen, Gambar, Tanpa File), filter bar multi-kriteria, tombol verifikasi, dan tombol pembuka generator laporan.
* `components/MonthlyProjectReportModal.tsx`: Modal kanvas dokumen resmi yang memuat:
  1. **Toolbar Navigasi**: Period Type (`harian`, `mingguan`, `bulanan`, `custom`), Orientasi (`landscape` / `portrait`), Mode Edit Teks Narasi (`isEditMode`), Interactive Zoom (`50%`–`200%` dengan tombol reset `100%`), tombol Refresh, dan Cetak PDF.
  2. **14 Bagian Dokumen Resmi**:
     - *Seksi 1*: Identitas Proyek & Kontrak
     - *Seksi 2*: Highlight Bulan Ini (Capaian, Kendala, Tindak Lanjut)
     - *Seksi 3*: Time vs Progress (Kurva Waktu)
     - *Seksi 4*: Progress Fisik Pekerjaan (Bobot, Rencana %, Realisasi %, Deviasi, RAG Status)
     - *Seksi 5*: Pengendalian Tahapan (Milestone Konstruksi)
     - *Seksi 6*: Kinerja Mutu & Kualitas (Uji Lab, Temuan NCR, Punch List)
     - *Seksi 7*: Kinerja K3 & Keselamatan (Toolbox Meeting, Inspeksi, Jam Kerja Selamat)
     - *Seksi 8*: Status Material & Pengadaan (Semen, Precast, Tiang Pancang, Bollard)
     - *Seksi 9*: Dokumen & Persetujuan (Shop Drawing, Material Approval, Method Statement)
     - *Seksi 10*: Register Kendala & Risiko
     - *Seksi 11*: Status Keuangan & Pembayaran Termin
     - *Seksi 12*: Rencana Kerja 2 Minggu Kedepan
     - *Seksi 13*: Ringkasan Manajemen
     - *Seksi 14*: Lembar Pengesahan (Tanda tangan Kontraktor, Pengawas, PPK)
  3. **Document Sheet Immunity**: Kanvas `.printable-report-canvas` selalu berupa kertas putih bersih (*crisp white paper*) di Dark Mode maupun Light Mode, dengan teks hitam pekat kontras tinggi dan layout cetak A4/A3.

---

## 3. SOP Menambah / Memodifikasi Bagian Laporan

1. **Menambah Field Data Laporan**:
   - Tambahkan field pada `domain.MonthlyProjectReportData` di Golang (`backend/internal/domain/laporan.go`).
   - Query data terkait pada `laporan_repo.go` di method `GetMonthlyProjectReportData`.
   - Update interface TypeScript di `frontend/src/features/laporan/types.ts`.
   - Render pada `MonthlyProjectReportModal.tsx` di seksi yang bersangkutan.
2. **Menjaga Kerapian Cetak**:
   - Selalu berikan alternatif kelas lebar grid (`orientation === "portrait" ? "col-span-12" : "col-span-6"`).
   - Pastikan styling menggunakan font compact (`text-[8px]` s/d `text-[10px]`) dan `border-slate-900` untuk keterbacaan cetak optimal.

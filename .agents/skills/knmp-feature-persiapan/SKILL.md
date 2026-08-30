---
name: knmp-feature-persiapan
description: Panduan teknis & domain untuk modul Persiapan Proyek KNMP v2 (Master Kontrak, SPMK, PCM / Pre-Construction Meeting, Mobilisasi Alat & Material, dan Kelola Dokumen Standard Form). Gunakan skill ini saat mengelola paket pekerjaan konstruksi, upload dokumen Form 01-11, jadwal mobilisasi, atau verifikasi administrasi pra-konstruksi.
---

# KNMP Feature: Persiapan Proyek (Kontrak, PCM, & Mobilisasi)

Modul ini mengelola seluruh fase pra-konstruksi pembangunan Kampung Nelayan Merah Putih, meliputi kontrak kerja, penerbitan SPMK, rapat persiapan konstruksi (PCM), mobilisasi alat/tenaga kerja, serta checklist dokumen standar.

---

## 1. Arsitektur Data & Model Backend

### Tabel Database
* `persiapans`: Menyimpan seluruh data persiapan dengan kolom pembeda `jenis` (`'kontrak'`, `'pcm'`, `'mobilisasi'`).
  - Kolom `additional_data` (JSONB) memuat rincian paket: `nama_penyedia`, `nomor_sp`, `tgl_sp`, `nomor_spmk`, `tgl_mulai`, `tgl_selesai`, `nilai_kontrak`, `rekening_bank`, `ruang_lingkup` (daftar desa), `tim_ppk`, dan `kontak_direktur`.
* `documents`: Dokumen pendukung yang diunggah untuk masing-masing persiapan (`documentable_type = 'persiapan'`).

### 11 Standard Forms Persiapan Proyek
Aplikasi mendukung 11 kategori dokumen standar:
1. `form_01_spmk` — Surat Perintah Mulai Kerja (SPMK)
2. `form_02_surat_perjanjian_kontrak` — Surat Perjanjian Kontrak
3. `form_03_surat_penyerahan_lapangan` — Surat Penyerahan Lapangan
4. `form_04_jadwal_pelaksanaan_pekerjaan` — Jadwal Pelaksanaan Pekerjaan (Kurva-S)
5. `form_05_jadwal_pengadaan_bahan` — Jadwal Pengadaan Bahan
6. `form_06_jadwal_pengadaan_peralatan` — Jadwal Pengadaan Peralatan
7. `form_07_jadwal_tenaga_kerja` — Jadwal Tenaga Kerja
8. `form_08_metode_pelaksanaan` — Metode Pelaksanaan Pekerjaan
9. `form_09_organisasi_kerja` — Struktur Organisasi Kerja
10. `form_10_rencana_k3` — Rencana Keselamatan Konstruksi (K3)
11. `form_11_surat_permohonan_pcm` — Surat Permohonan PCM

### API Endpoints
* `GET /api/v1/persiapan?jenis=kontrak` — Daftar 58 paket kontrak konstruksi.
* `GET /api/v1/persiapan?jenis=pcm` — Daftar agenda & notulensi PCM.
* `GET /api/v1/persiapan?jenis=mobilisasi` — Daftar checklist & log mobilisasi.
* `POST /api/v1/persiapan` — Tambah data persiapan baru.
* `PUT /api/v1/persiapan/:id` — Update data persiapan.
* `POST /api/v1/documents` — Unggah file dokumen persiapan (PDF, gambar) dengan multipart form data.

---

## 2. Struktur Frontend (`src/features/persiapan/`)

* `components/PersiapanKontrakPage.tsx`: Halaman manajemen 58 paket kontrak, status administrasi (*Sudah ttd Kontrak*, *SPPBJ*, *Tender*), pencarian KNMP & wilayah kabupaten, modal tambah/edit kontrak, dan modal **"Kelola Dokumen"** untuk upload 11 formulir standar.
* `components/PcmPage.tsx`: Halaman monitoring rapat PCM, upload Berita Acara PCM, dokumentasi foto rapat, dan absensi peserta rapat.
* `components/MobilizationPage.tsx`: Halaman tracking mobilisasi logistik material (tiang pancang, precast, semen) dan alat berat ke titik dermaga nelayan.

---

## 3. SOP Pengelolaan & Penambahan Fitur Persiapan

1. **Menambah Kategori Dokumen Baru**:
   - Daftarkan kode kategori di array `standardForms` pada `PersiapanKontrakPage.tsx`.
   - Update repository dokumen jika ada validasi tipe file spesifik.
2. **Koneksi Otomatis ke Titik KNMP**:
   - Setiap entri kontrak wajib memiliki `knmp_id`. Jika paket mencakup beberapa desa, `additional_data.ruang_lingkup` menyimpan daftar seluruh desa terkait.

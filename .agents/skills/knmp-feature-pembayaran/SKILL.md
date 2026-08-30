---
name: knmp-feature-pembayaran
description: Panduan teknis & domain untuk modul Keuangan & Termin Pembayaran Kontrak KNMP v2. Gunakan skill ini saat memproses pencairan termin (25%, 50%, 75%, 100%, dan Retensi 5%), sinkronisasi realisasi anggaran vs realisasi fisik, rekap nomor rekening bank penyedia, serta integrasi total anggaran proyek.
---

# KNMP Feature: Pembayaran & Realisasi Keuangan

Modul ini mengatur tata kelola penyerapan anggaran konstruksi, pencairan termin bertahap berdasarkan capaian progres fisik lapangan, pencatatan rekening bank penyedia, serta retensi jaminan pemeliharaan.

---

## 1. Arsitektur Data & Model Backend

### Skema Termin Pembayaran Standar
Setiap kontrak konstruksi KNMP terbagi atas 5 tahap pencairan:
1. **Termin 1 (Uang Muka / Progres 25%)**: Pencairan 25% nilai kontrak setelah SPMK dan jaminan uang muka disetujui.
2. **Termin 2 (Progres Fisik 50%)**: Pencairan 25% nilai kontrak setelah fisik terverifikasi minimal 50%.
3. **Termin 3 (Progres Fisik 75%)**: Pencairan 25% nilai kontrak setelah fisik terverifikasi minimal 75%.
4. **Termin 4 (Progres Fisik 100% / PHO)**: Pencairan 20% nilai kontrak setelah Berita Acara Serah Terima Pertama (PHO).
5. **Retensi Pemeliharaan (5%)**: Sisa 5% yang ditahan selama masa pemeliharaan (FHO).

### Tabel Database
* `pembayarans`:
  - `persiapan_kontrak_id` (BIGINT): FK ke `persiapans(id)`.
  - `name` (VARCHAR): Deskripsi termin (misal: "Termin 1 (25%) - PT. Laksana Aneka Sarana").
  - `kategori` (VARCHAR): 'Realisasi Konstruksi' | 'Jaminan Pemeliharaan'.
  - `termin` (VARCHAR): 'Termin 1' | 'Termin 2' | 'Termin 3' | 'Termin 4' | 'Retensi'.
  - `realisasi_anggaran` (NUMERIC): Nominal rupiah pencairan.
  - `realisasi_fisik` (NUMERIC): Persentase capaian fisik syarat termin.
  - `norek_pekerja` (VARCHAR): Rekening bank resmi penyedia sesuai kontrak.

### API Endpoints
* `GET /api/v1/pembayaran` — List seluruh pembayaran termin.
* `GET /api/v1/pembayaran/total-anggaran` — Rekap total pagu kontrak, total realisasi terserap, dan sisa anggaran proyek se-Sumatera.
* `POST /api/v1/pembayaran` — Tambah pencairan termin baru.
* `PUT /api/v1/pembayaran/:id` — Update status pencairan termin.

---

## 2. Struktur Frontend (`src/features/pembayaran/`)

* `components/TerminPembayaranPage.tsx`: Halaman tracking pencairan termin per paket kontrak dengan indikator progress bar pencairan, status verifikasi SPP/SPM, dan rekening tujuan.
* `components/TotalAnggaranPage.tsx`: Dashboard eksekutif keuangan yang menampilkan total nilai 58 kontrak konstruksi (~Rp 600+ Miliar), grafik serapan bulanan, deviasi keuangan vs fisik, dan sisa pagu.

---

## 3. Aturan Bisnis & Validasi
* Nilai total dari seluruh termin (`Termin 1` + `Termin 2` + `Termin 3` + `Termin 4` + `Retensi`) untuk satu paket kontrak **tidak boleh melebihi** `nilai_kontrak` yang tertera pada `persiapans.additional_data`.

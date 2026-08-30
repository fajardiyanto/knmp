---
name: knmp-feature-issue-k3
description: Panduan teknis & domain untuk modul Manajemen Kendala (Issue Tracking), Mitigasi Risiko, dan K3 Konstruksi KNMP v2. Gunakan skill ini saat mengelola kendala lapangan (Ringan/Sedang/Kritis), verifikasi foto bukti kendala, formulir keselamatan kerja K3, atau integrasi status RAG proyek.
---

# KNMP Feature: Manajemen Kendala (Issue) & K3 Konstruksi

Modul ini memfasilitasi pelaporan, penelusuran (*tracking*), dan verifikasi penyelesaian kendala teknis/sosial/lingkungan di lapangan serta pemantauan standar Keselamatan dan Kesehatan Kerja (K3) pada proyek KNMP.

---

## 1. Arsitektur Data & Model Backend

### Tabel Database
* `issues`:
  - `knmp_id` (BIGINT): Titik KNMP lokasi kejadian.
  - `user_id` (BIGINT): Pelapor kendala.
  - `kategori_issue` (VARCHAR): 'Teknis' | 'Material' | 'Cuaca / Alam' | 'Sosial / Lahan' | 'K3 / Keselamatan'.
  - `tingkat` (VARCHAR): 'Ringan' | 'Sedang' | 'Kritis'.
  - `uraian_masalah` (TEXT): Deskripsi detail kendala.
  - `tindak_lanjut` (TEXT): Rencana mitigasi dan tindakan korektif.
  - `status` (VARCHAR): 'open' | 'in_progress' | 'resolved' | 'closed'.
* `documents`: Foto dokumentasi kondisi kendala sebelum dan sesudah perbaikan (`documentable_type = 'issue'`).

### API Endpoints
* `GET /api/v1/issue` — List seluruh kendala dengan filter tingkat keparahan, kategori, KNMP, dan status verifikasi.
* `POST /api/v1/issue` — Pelaporan kendala baru beserta unggah foto bukti.
* `PUT /api/v1/issue/:id` — Update status tindak lanjut kendala.
* `PATCH /api/v1/issue/:id/status` — Penutupan issue setelah diverifikasi pengawas.

---

## 2. Struktur Frontend (`src/features/issue/`)

* `components/IssuePage.tsx`: Halaman utama manajemen issue.
  - **4 Metrik Card**: Total Kendala, Total Bukti Foto, Kendala Terverifikasi, dan Menunggu Verifikasi.
  - **Tabel Register Risiko**: Menampilkan kategori, uraian kendala, tingkat keparahan (Badge Merah untuk *Kritis*, Kuning untuk *Sedang*, Hijau untuk *Ringan*), dan progres mitigasi.
  - **Modal Verifikasi & Solusi**: Tempat pengawas memeriksa bukti foto dan menandatangani persetujuan solusi penyelesaian kendala.

---

## 3. Integrasi ke Modul Laporan
* Seluruh kendala berstatus `'Kritis'` dan `'Sedang'` yang masih aktif (`status != 'closed'`) secara otomatis diekstrak oleh modul `Laporan Proyek Terpadu` ke dalam **Seksi 2 (Highlight Masalah)** dan **Seksi 10 (Register Kendala & Risiko)**.

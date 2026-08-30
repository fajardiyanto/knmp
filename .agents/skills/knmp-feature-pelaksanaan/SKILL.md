---
name: knmp-feature-pelaksanaan
description: Panduan teknis & domain untuk modul Pelaksanaan Konstruksi KNMP v2 (Kegiatan Harian, Foto Geotagging GPS, Cuaca, Tenaga Kerja, Status K3, dan Log Lapangan). Gunakan skill ini saat mengelola data pelaksanaan fisik, input log harian, upload bukti foto, atau integrasi dengan modul laporan.
---

# KNMP Feature: Pelaksanaan Harian Konstruksi

Modul ini adalah buku catatan (*site daily logbook*) digital tempat kontraktor dan pengawas mendokumentasikan aktivitas harian di titik pembangunan dermaga/kampung nelayan.

---

## 1. Arsitektur Data & Model Backend

### Tabel Database
* `pelaksanaans`:
  - `knmp_id` (BIGINT): Titik KNMP lokasi pekerjaan.
  - `user_id` (BIGINT): Kontraktor/operator pembuat log.
  - `nama` (VARCHAR): Judul kegiatan harian (misal: "Pengecoran Plat Dermaga Zona 1").
  - `tanggal` (DATE): Tanggal pelaksanaan.
  - `jenis_laporan` (VARCHAR): `harian` | `mingguan` | `bulanan`.
  - `status_k3` (VARCHAR): `aman` | `perlu_tindakan` | `insiden`.
  - `kendala` & `keterangan` (TEXT): Catatan lapangan & kendala teknis.
  - `additional_data` (JSONB): Info cuaca (*cerah*, *hujan*, *gelombang tinggi*), jumlah tenaga kerja (tukang, mandor, pekerja), dan alat yang beroperasi.
* `documents`: Foto-foto lapangan bergeotagging dan dokumen berita acara pendukung (`documentable_type = 'pelaksanaan'`).

### API Endpoints
* `GET /api/v1/pelaksanaan` — List pelaksanaan (otomatis scoped by `knmp_id` untuk user non-superadmin).
* `GET /api/v1/pelaksanaan/:id` — Detail pelaksanaan lengkap beserta relasi dokumen.
* `POST /api/v1/pelaksanaan` — Simpan log pelaksanaan baru.
* `PUT /api/v1/pelaksanaan/:id` — Update log pelaksanaan.
* `DELETE /api/v1/pelaksanaan/:id` — Soft delete pelaksanaan.

---

## 2. Struktur Frontend (`src/features/pelaksanaan/`)

* `components/PelaksanaanPage.tsx`: Halaman utama log pelaksanaan.
  - **4 Metrik Card**: Total Data Pelaksanaan, Dokumen Saja, Gambar/Foto Saja, dan Tanpa File.
  - **Filter Bar**: Search, Dropdown User, Dropdown KNMP (dengan label nama + kabupaten), Tipe File, dan Status Dokumen.
  - **Modal Tambah/Edit**: Form input nama kegiatan, tanggal, titik KNMP, jenis laporan, kondisi cuaca, jumlah tenaga kerja, kendala, dan keterangan.
  - **Modal Kelola Dokumen & Bukti Foto**: Upload multi-file foto lapangan dengan preview gambar interaktif.

---

## 3. SOP & Best Practices

1. **Relasi ke Modul Laporan**:
   - Setiap kali laporan mingguan/bulanan dibuat di modul `/laporan`, `pelaksanaan_id` menjadi jangkar pengait (*foreign key*) yang menghubungkan log lapangan harian dengan rekapitulasi laporan terpadu.
2. **Kamera & Geotagging**:
   - Foto yang diunggah harus memuat koordinat GPS agar sistem dapat memvalidasi posisi pengambilan foto sesuai dengan koordinat titik KNMP bersangkutan.

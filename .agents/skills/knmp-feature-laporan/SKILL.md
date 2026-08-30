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

* `components/ExecutiveProjectReportModalV2.tsx`: Modal eksekutif dual-mode (Bento Analytics Dashboard & Dokumen Cetak A4/A3) yang menampilkan metrik KPI, Kurva-S kumulatif, milestones, 7 paket pekerjaan, quality/K3, dan **lampiran dokumen/foto geotagging lapangan**.
* `docs/DATA_DICTIONARY_LAPORAN_V1_V2.md`: Kamus data lengkap dan silsilah data (*data lineage*) untuk seluruh field pada Laporan V1 dan V2.

---

## 3. Kamus Sumber Data & Silsilah Data (V1 & V2)

Lihat dokumentasi lengkap di: [`docs/DATA_DICTIONARY_LAPORAN_V1_V2.md`](file:///d:/spacecode/NGS/pertamina/knmp-v2/docs/DATA_DICTIONARY_LAPORAN_V1_V2.md).

1. **Progres Fisik & Deviasi**:
   - `realisasi_progres_fisik` vs `rencana_progres_fisik` dari tabel `laporans`.
   - Deviasi: `realisasi - rencana` (+ = surplus hijau, - = defisit merah).
2. **Pagu & Realisasi Keuangan**:
   - Nilai Pagu dari tabel `persiapans` / `perusahaans` (pagu master Rp 1.485.000.000).
   - Realisasi Keuangan: $\sum \text{realisasi\_anggaran}$ dari tabel `pembayarans`.
3. **Durasi Waktu & Kalender**:
   - Dihitung dari `tanggal_mulai_pelaksanaan` s.d `tanggal_akhir_pelaksanaan` pada tabel `persiapans`.
   - % Waktu Terpakai: $\frac{\text{Hari Berjalan}}{\text{Total Durasi Kontrak}} \times 100\%$.
4. **Kinerja K3 & HSE**:
   - Jam Kerja Selamat: `jumlah_tenaga_kerja * 8 jam kerja` dari tabel `laporans`.
   - Toolbox meeting & Inspeksi: frekuensi pengawasan K3 site.
5. **Dokumen Lampiran & Foto Fisik**:
   - Query dari tabel `documents` (`documentable_type = 'laporan'`, `documentable_id = laporan.id`).
   - Kategori: `status_k3_doc`, `ceklis_mutu_doc`, `laporan_pdf_doc`, `foto_kegiatan`, `foto_kegiatan_tambahan`.

---

## 4. SOP Menambah / Memodifikasi Bagian Laporan

1. **Menambah Field Data Laporan**:
   - Tambahkan field pada `domain.MonthlyProjectReportData` di Golang (`backend/internal/domain/laporan.go`).
   - Query data terkait pada `laporan_repo.go` di method `GetMonthlyProjectReportData`.
   - Update interface TypeScript di `frontend/src/features/laporan/types.ts`.
   - Render pada `ExecutiveProjectReportModalV2.tsx` dan `MonthlyProjectReportModal.tsx`.
2. **Menjaga Kerapian Cetak**:
   - Selalu berikan alternatif kelas lebar grid (`orientation === "portrait" ? "col-span-12" : "col-span-6"`).
   - Pastikan styling menggunakan font compact (`text-[8px]` s/d `text-[10px]`) dan `border-slate-900` untuk keterbacaan cetak optimal.

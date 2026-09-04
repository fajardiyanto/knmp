# Dokumentasi Sumber Data & Lineage: Laporan Proyek Terpadu (V1 & V2)
**Program Kampung Nelayan Merah Putih (KNMP) • Pertamina Se-Sumatera (346 Titik)**

Dokumen ini menjelaskan secara terperinci asal sumber data, pemetaan tabel basis data PostgreSQL, formula kalkulasi matematis, serta relasi entitas untuk seluruh indikator pada **Laporan Proyek Terpadu Format Klasik (V1)** dan **Laporan Eksekutif Proyek Terpadu (V2)**.

---

## 1. Arsitektur Aliran Data (Data Flow Architecture)

```
[ Form Input Lapangan / Dokumen ]
       │
       ▼
 ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
 │   laporans  │──────▶│  documents  │──────▶│ persiapans / │
 └─────────────┘       └─────────────┘       │ perusahaans  │
       │                      │              └──────────────┘
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              ▼
       ┌──────────────────────────────────────────────┐
       │ Golang API: GET /api/v1/laporan/             │
       │             monthly-project-report           │
       └──────────────────────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
   ┌───────────────────────┐     ┌───────────────────────┐
   │  Laporan Terpadu V1   │     │  Laporan Eksekutif V2 │
   │ (14 Bagian Resmi PPK) │     │ (Dashboard & Dokumen) │
   └───────────────────────┘     └───────────────────────┘
```

---

## 2. Sumber Data Laporan V1 (Format Klasik — 14 Bagian Resmi)

Laporan V1 dirancang sesuai standar pelaporan PPK/Konsultan Supervisi dengan 14 seksi terpadu:

### Seksi 1: Identitas Proyek & Kontrak
| Item Data | Sumber Tabel PostgreSQL | Kolom Asal | Catatan / Fallback Logic |
| :--- | :--- | :--- | :--- |
| **Titik / Nama Paket** | `knmps` / `laporans` | `knmps.name`, `laporans.nama` | Nama lokasi titik nelayan & nama laporan spesifik. |
| **Wilayah & Lokasi** | `provinces`, `regencies`, `districts` | `name` | Relasi wilayah administrasi lokasi KNMP se-Sumatera. |
| **Nomor Kontrak** | `persiapans` / `perusahaans` | `additional_data->>'nomor_kontrak'`, `perusahaans.no_kontrak` | Nomor surat perjanjian resmi pekerjaan. |
| **SPMK** | `persiapans` | `additional_data->>'nomor_spmk'` | Surat Perintah Mulai Kerja dari PPK. |
| **Nilai / Pagu Kontrak** | `persiapans` / `perusahaans` | `additional_data->>'pagu_anggaran'`, `perusahaans.nilai_kontrak` | Nilai kontrak fisik proyek (Default Rp 1.485.000.000). |
| **Tanggal Kontrak & Mulai** | `persiapans` | `tanggal_kontrak`, `tanggal_mulai_pelaksanaan` | Baseline jadwal kontrak resmi. |
| **Masa Pelaksanaan** | `persiapans` | Dihitung: `tanggal_akhir - tanggal_mulai` | Durasi hari kalender (contoh: 120 / 121 Hari). |
| **Penyedia Jasa** | `persiapans` / `perusahaans` | `perusahaans.nama_perusahaan` | Nama kontraktor pelaksana yang memenangkan paket. |
| **Konsultan Pengawas** | `persiapans` | `additional_data->>'konsultan_pengawas'` | Nama instansi/konsultan supervisi teknis wilayah. |
| **Wakil PPK Wilayah** | `persiapans` | `additional_data->>'wakil_ppk'` | Pejabat perwakilan pembuat komitmen. |

---

### Seksi 2: Highlight Bulan Ini
| Item Data | Sumber Tabel PostgreSQL | Formula / Logika |
| :--- | :--- | :--- |
| **Capaian Utama** | `laporans` | Disusun otomatis dari capaian `realisasi_progres_fisik` vs `rencana_progres_fisik`. |
| **Isu & Kendala** | `issues` | Rekapitulasi kendala lapangan dengan status `open` atau `in_progress`. |
| **Tindak Lanjut** | `issues` / `laporans` | Arahan mitigasi dan rencana percepatan kurva-S. |

---

### Seksi 3: Time vs Progress (Durasi Waktu & Kurva Kemajuan)
| Parameter | Sumber Tabel | Formula Perhitungan |
| :--- | :--- | :--- |
| **Waktu Terpakai (%)** | `persiapans` | $\frac{\text{Tanggal Laporan} - \text{Tanggal Mulai}}{\text{Tanggal Selesai} - \text{Tanggal Mulai}} \times 100\%$ |
| **Sisa Waktu (Hari)** | `persiapans` | $\text{Tanggal Selesai} - \text{Tanggal Laporan}$ (Hari Kalender) |
| **Deviasi Waktu vs Fisik** | `persiapans` + `laporans` | $\text{Realisasi Progres Fisik (\%)} - \text{Waktu Terpakai (\%)}$ |

---

### Seksi 4: Progress Fisik Pekerjaan & Bobot
| Parameter | Sumber Tabel | Kolom |
| :--- | :--- | :--- |
| **Bobot Rencana (%)** | `laporans` | `rencana_progres_fisik` |
| **Bobot Realisasi (%)** | `laporans` | `realisasi_progres_fisik` |
| **Deviasi Fisik (%)** | `laporans` | `realisasi_progres_fisik - rencana_progres_fisik` |
| **Status RAG** | Dihitung | **HIJAU** ($\ge 0\%$), **KUNING** ($-5\%$ s.d $0\%$), **MERAH** ($< -5\%$) |
| **Rincian Per Bangunan** | `laporan_jenis_bangunan` | Relasi `jenis_bangunans.nama`, bobot rencana vs aktual per fasilitas |

---

### Seksi 5: Pengendalian Tahapan (Milestones)
- **MS-01 s.d MS-06**: Dihitung dari tanggal mulai dan akhir kontrak, dibagi kuadran pencapaian fisik:
  - MS-01: MC-0 / Kick Off (0%)
  - MS-02: Mobilisasi Alat & Material
  - MS-03: Capaian Fisik 25%
  - MS-04: Capaian Fisik 50%
  - MS-05: Capaian Fisik 75%
  - MS-06: Capaian Fisik 100% / PHO (Provisional Hand Over)
  - MS-07: Masa Pemeliharaan
  - MS-08: FHO (Final Hand Over)
- **Status Selesai**: Berubah otomatis menjadi `SELESAI` saat realisasi fisik mencapai persentase target milestone.

---

### Seksi 6: Kinerja Mutu & Kualitas
| Parameter | Sumber Data | Keterangan |
| :--- | :--- | :--- |
| **Uji Mutu / Test Lab** | `laporans` | Jumlah uji slump test beton, uji tarik baja, uji kepadatan tanah. |
| **Temuan NCR** | `issues` (`kategori_issue = 'mutu'`) | Non-Conformance Report mutu di lapangan. |
| **Daftar Cacat (Punch List)** | `issues` (`status = 'open'`) | Daftar perbaikan fisik sebelum serah terima. |

---

### Seksi 7: Kinerja K3 & Keselamatan (HSE)
| Parameter | Sumber Data | Formula / Nilai |
| :--- | :--- | :--- |
| **Jam Kerja Selamat** | `laporans.jumlah_tenaga_kerja` | $\text{Jumlah Tenaga Kerja} \times 8\text{ Jam Kerja Lapangan}$ |
| **Toolbox Meeting** | `laporans` | Frekuensi pengarahan keselamatan sebelum kerja. |
| **Inspeksi K3** | `laporans` | Frekuensi inspeksi kelengkapan APD & keselamatan site. |
| **Kecelakaan Fatal / LTI** | `issues` | Status *Zero Accident* terjaga jika tidak ada insiden fatal. |

---

### Seksi 8: Status Material & Pengadaan
- Melacak 5 material utama: Semen Portland Type I, Besi Tulangan Ulir, Beton Precast, Tiang Pancang, dan Bollard Dermaga 15T.
- Realisasi material tersinkronisasi proporsional terhadap progres fisik paket pekerjaan.

---

### Seksi 9: Dokumen & Persetujuan (Doc Tracker)
- Melacak berkas wajib: Shop Drawing, Persetujuan Material, Method Statement, Laporan Inspeksi, Berita Acara Rapat.
- Status kelengkapan berkas mengacu pada kuantitas pengunggahan dan persetujuan pengawas.

---

### Seksi 10: Register Kendala & Mitigasi Risiko
- Diambil dari tabel **`issues`** dengan filter `knmp_id = id_titik` dan `deleted_at IS NULL`.
- Menampilkan uraian masalah, tingkat keparahan (*Ringan*, *Sedang*, *Kritis*), dan status tindak lanjut.

---

### Seksi 11: Status Keuangan & Pembayaran Termin
| Parameter | Sumber Tabel | Formula |
| :--- | :--- | :--- |
| **Pagu Kontrak** | `persiapans` / `perusahaans` | Total nilai pagu anggaran |
| **Realisasi Pencairan** | `pembayarans` | $\sum \text{realisasi\_anggaran}$ |
| **Persentase Keuangan** | `pembayarans` + `persiapans` | $\frac{\text{Total Realisasi Keuangan}}{\text{Pagu Anggaran}} \times 100\%$ |
| **Sisa Pagu** | `persiapans` - `pembayarans` | $\text{Pagu Anggaran} - \text{Total Realisasi Keuangan}$ |

---

### Seksi 12: Rencana Kerja 2 Minggu Kedepan (2-Week Look Ahead)
- Proyeksi target rencana pekerjaan 14 hari ke depan untuk struktur dermaga, utilitas MEP/rantai dingin, dan finishing sentra kuliner.

---

### Seksi 13: Ringkasan Manajemen
- Narasi terstruktur untuk pimpinan (Pencapaian, Analisis Deviasi, Tindakan Recovery, Dukungan Dibutuhkan, dan Rencana Bulan Depan).

---

### Seksi 14: Lembar Pengesahan (Approval Matrix)
- Matriks tanda tangan resmi 3 Pihak:
  1. **Disusun Oleh**: Kontraktor Pelaksana (`perusahaans.nama_perusahaan` & Site Manager).
  2. **Diperiksa Oleh**: Konsultan Pengawas (`persiapans.konsultan_pengawas` & Team Leader).
  3. **Disetujui Oleh**: PPK / Wakil PPK Wilayah (`persiapans.wakil_ppk`).

---

## 3. Sumber Data Laporan V2 (Executive Analytics & Cetak Modern)

Laporan V2 menyediakan dashboard analitik interaktif dual-mode (Bento Analytics Grid & Dokumen Cetak A4/A3):

### Banner Identitas Spesifik Laporan (Row 0)
- **Nama Laporan**: `laporans.nama` (contoh: *MINGGUAN TEST*)
- **Periode / Jenis**: `laporans.jenis_laporan` (*Harian*, *Mingguan*, *Bulanan*)
- **Titik Lokasi**: `knmps.name` (`regencies.name`, `provinces.name`)
- **Pelaksanaan**: `pelaksanaans.nama` (contoh: *KNMP PENYANGGA*)
- **Jenis Bangunan**: `laporan_jenis_bangunan` $\rightarrow$ `jenis_bangunans.nama` (contoh: *Gedung 34*)
- **Tanggal & Cuaca**: `laporans.tanggal` & `laporans.cuaca` (contoh: *24 Agu 2026 • Berawan*)
- **Tenaga Kerja**: `laporans.jumlah_tenaga_kerja` (contoh: *20 Orang*)

### Row 1: Executive KPI Bento Grid (4 Cards)
1. **Progres Fisik**: `laporans.realisasi_progres_fisik`, `laporans.rencana_progres_fisik`, dan deviasi $\pm\%$.
2. **Keuangan / Pagu**: `persiapans.nilai_kontrak` vs `pembayarans.realisasi_anggaran`.
3. **Durasi Waktu**: Selisih `tanggal_mulai_pelaksanaan` s.d `tanggal_akhir_pelaksanaan` (121 Hari) dan `% Waktu Terpakai`.
4. **Kinerja K3 & Safety**: `laporans.jumlah_tenaga_kerja * 8 jam` (160 Jam Kerja Selamat) dan *Zero Accident Badge*.

### Row 2: Visual Kurva-S Realtime & Trend Kumulatif
- Kurva perbandingan dinamis baseline rencana vs trajektori aktual fisik kumulatif.

### Row 3: Milestone Control & Roadmap Kritis
- Stepper 8 Milestone utama dari MC-0 hingga FHO dengan badge otomatis *SELESAI* atau *PLANNED*.

### Row 4: Rincian 7 Paket Pekerjaan & Bobot Fisik
- Tabel rincian 7 paket standar KNMP (Persiapan, Struktur Utama, Dermaga, MEP, Sentra Kuliner, K3, Mobilisasi) dengan progress bar.

### Row 5: Quality, Material & Issues
- Ringkasan uji lab mutu, tracking 5 material logistik, dan alert kendala kritis lapangan.

### Row 6: Lampiran Dokumen & Foto Fisik Geotagging
- Memuat seluruh berkas dari tabel **`documents`** (`documentable_type = 'laporan'`, `documentable_id = laporan.id`):
  - **Status K3** (`status_k3_doc`)
  - **Ceklis Mutu** (`ceklis_mutu_doc`)
  - **Laporan PDF** (`laporan_pdf_doc`)
  - **Foto Kegiatan Lapangan** (`foto_kegiatan`, `foto_kegiatan_tambahan`)
- Dilengkapi **Galeri Thumbnail Foto & Lightbox Modal** untuk preview foto fisik resolusi penuh.

---

## 4. Matriks Pemetaan Endpoint API & Parameter Query

| Parameter Endpoint | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `knmp_id` | `int64` | ID titik lokasi KNMP (1 - 346). |
| `laporan_id` | `int64` *(Opsional)* | ID spesifik baris laporan yang dipilih pada tabel. |
| `period_type` | `string` | Jenis rentang (`bulanan`, `mingguan`, `harian`, `custom`). |
| `month` & `year` | `int` | Bulan (1-12) dan Tahun (2025/2026). |
| `week` | `int` | Minggu ke (1-4). |
| `date` | `string` | Tanggal spesifik format `YYYY-MM-DD`. |
| `start_date` & `end_date` | `string` | Rentang tanggal kustom. |

**Endpoint Resmi**:
- `GET /api/v1/laporan/monthly-project-report?knmp_id={id}&laporan_id={id}`
- Response memuat payload lengkap `domain.MonthlyProjectReportData` yang digunakan oleh modal V1 dan V2.

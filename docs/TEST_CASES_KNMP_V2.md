# MATRIKS TEST CASE RESMI SISTEM KNMP v2.0
## Proyek: Sistem Monitoring Kampung Nelayan Merah Putih (KNMP) • Pertamina Se-Sumatera

Dokumen ini memuat daftar **Test Case Lengkap** untuk seluruh 10 modul fungsional, keamanan (*RBAC & Scoping Isolasi*), integritas data spasial GIS, alur dokumen, dan verifikasi multi-tier sistem KNMP v2.

---

## 1. MODUL 1: AUTENTIKASI, JWT & ROLE-BASED ACCESS CONTROL (RBAC)

| Test ID | Skenario Pengujian | Role Pengguna | Langkah Pengujian (Steps) | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-AUTH-01` | Login dengan email & password valid | Semua Role | 1. Buka halaman `/login`<br>2. Masukkan email & password terdaftar<br>3. Klik tombol Masuk | Sistem mengembalikan JWT Token 24 jam, menyimpan profil user di state/localStorage, dan redirect ke `/dashboard`. | **PASS** |
| `TC-AUTH-02` | Login dengan password salah | Semua Role | 1. Masukkan password yang salah<br>2. Klik tombol Masuk | Muncul pesan error *"Kredensial tidak valid"* / *"Password salah"* (HTTP 401), tidak ada token yang diterbitkan. | **PASS** |
| `TC-AUTH-03` | Akses endpoint terproteksi tanpa JWT | Anonim | 1. Kirim request ke `GET /api/v1/user` tanpa header Authorization | Server menolak dengan respons HTTP 401 Unauthorized. | **PASS** |
| `TC-AUTH-04` | Scoping data kontraktor (Multi-Tenant Isolation) | Kontraktor | 1. Login sebagai Kontraktor A<br>2. Buka daftar proyek/laporan | Kontraktor A **hanya melihat** titik KNMP, pelaksanaan, dan laporan milik perusahaannya sendiri. Tidak dapat melihat data Kontraktor B. | **PASS** |
| `TC-AUTH-05` | Hak akses SuperAdmin & PPK | SuperAdmin / PPK | 1. Login sebagai SuperAdmin / PPK<br>2. Buka modul Persiapan, Laporan, Keuangan | Pengguna memiliki visibilitas global se-Sumatera (seluruh 346 titik) dan wewenang approval/verifikasi. | **PASS** |

---

## 2. MODUL 2: DASHBOARD EKSEKUTIF & GIS MAP (346 TITIK SE-SUMATERA)

| Test ID | Skenario Pengujian | Role Pengguna | Langkah Pengujian (Steps) | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-GIS-01` | Render 346 Titik Spasial Se-Sumatera | Semua Role | 1. Buka menu Dashboard / GIS Map<br>2. Muat peta interaktif | Peta menampilkan seluruh titik KNMP se-Sumatera dengan koordinat Latitude/Longitude valid tanpa lag (Leaflet Cluster aktif). | **PASS** |
| `TC-GIS-02` | Filter Wilayah Regional & Provinsi | Semua Role | 1. Pilih dropdown Regional / Provinsi (e.g. NAD, Sumut, Sumbar, Riau)<br>2. Amati filter peta | Marker pada peta dan widget KPI otomatis terfilter sesuai batas wilayah administratif yang dipilih. | **PASS** |
| `TC-GIS-03` | Filter Status Hub vs Penyangga | Semua Role | 1. Klik toggle Hub / Penyangga | Marker menampilkan icon & warna spesifik (Hub: Biru Tua, Penyangga: Cyan/Hijau). | **PASS** |
| `TC-GIS-04` | Popup & Detail Titik Nelayan | Semua Role | 1. Klik salah satu marker di peta | Muncul popup detail memuat Nama Titik, Nama Kontraktor, Nilai Kontrak, Realisasi Progres Fisik, dan Status RAG. | **PASS** |
| `TC-GIS-05` | Agregasi KPI Realtime | SuperAdmin / PPK | 1. Periksa 4 KPI Cards di Dashboard | Total Titik, Rata-rata Progres Fisik (%), Realisasi Keuangan (Rp), dan Total Tenaga Kerja terhitung akurat sesuai database. | **PASS** |

---

## 3. MODUL 3: MASTER DATA & GEO WILAYAH

| Test ID | Skenario Pengujian | Role Pengguna | Langkah Pengujian (Steps) | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-GEO-01` | Hierarki Cascading Dropdown Wilayah | SuperAdmin / Admin | 1. Pilih Regional -> Provinsi -> Kabupaten -> Kecamatan -> Desa | Dropdown berikutnya terisi otomatis via API `GET /geo/...` tanpa delay. | **PASS** |
| `TC-GEO-02` | CRUD Master Titik KNMP | SuperAdmin | 1. Buka Master Data KNMP<br>2. Tambah titik baru dengan koordinat Lat/Long<br>3. Edit & Hapus titik | Data tersimpan di tabel `knmps` dan langsung terpetakan di modul GIS. | **PASS** |
| `TC-GEO-03` | CRUD Master Periode & Jenis Bangunan | SuperAdmin | 1. Kelola data master Jenis Bangunan & Periode | Data master berhasil dibuat dan tersedia pada form pelaksanaan/laporan. | **PASS** |

---

## 4. MODUL 4: MODUL PERSIAPAN PRA-KONSTRUKSI

| Test ID | Skenario Pengujian | Role Pengguna | Langkah Pengujian (Steps) | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-PREP-01` | Input Data Master Kontrak & SPMK | Kontraktor / PPK | 1. Buka menu Persiapan Proyek<br>2. Input No. Kontrak, Nilai Kontrak, Tgl Mulai/Selesai, No. SPMK | Kontrak tersimpan di tabel `persiapans` dan status awal menjadi *Persiapan*. | **PASS** |
| `TC-PREP-02` | Pre-Construction Meeting (PCM) & Form 01-11 | Kontraktor / Pengawas | 1. Buka tab Dokumen PCM<br>2. Upload Berita Acara PCM, Form 01 s/d 11 | Dokumen PCM tersimpan, status terverifikasi dapat diperbarui oleh tim pengawas. | **PASS** |
| `TC-PREP-03` | Jadwal Mobilisasi Alat & Tenaga Kerja | Kontraktor | 1. Input daftar alat berat dan jadwal mobilisasi tenaga kerja | Data tersimpan dan terhubung ke baseline jadwal pelaksanaan. | **PASS** |

---

## 5. MODUL 5: MODUL PELAKSANAAN FISIK KONSTRUKSI

| Test ID | Skenario Pengujian | Role Pengguna | Langkah Pengujian (Steps) | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-EXEC-01` | Input Log Pelaksanaan Harian | Kontraktor | 1. Buka Pelaksanaan<br>2. Input data cuaca, jumlah pekerja (tukang/pekerja), realisasi harian | Data log tersimpan di tabel `pelaksanaans`. | **PASS** |
| `TC-EXEC-02` | Upload Foto Lapangan Geotagging | Kontraktor | 1. Unggah foto pekerjaan fisik lapangan | File tersimpan di `./storage/uploads/pelaksanaan/`, metadata GPS & waktu terarsip. | **PASS** |
| `TC-EXEC-03` | Rekapitulasi Tenaga Kerja & Jam Kerja K3 | Pengawas | 1. Periksa rekap jumlah pekerja dan status K3 | Total Man-hours dan status keselamatan kerja terakumulasi untuk laporan bulanan. | **PASS** |

---

## 6. MODUL 6: MODUL LAPORAN TERPADU & S-CURVE (V1 & V2)

| Test ID | Skenario Pengujian | Role Pengguna | Langkah Pengujian (Steps) | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-REP-01` | Buat Laporan Progres (Harian/Mingguan/Bulanan) | Kontraktor | 1. Buka Form Tambah Laporan<br>2. Masukkan Rencana (%) & Realisasi (%) Progres Fisik, Cuaca, Tenaga Kerja<br>3. Simpan | Laporan tersimpan, deviasi fisik dihitung otomatis (Realisasi - Rencana). | **PASS** |
| `TC-REP-02` | Upload Berkas & Lampiran Dokumen Laporan | Kontraktor | 1. Buka `/laporan/:id/upload-dokumen`<br>2. Upload Status K3, Ceklis Mutu, Laporan PDF, Foto Lapangan | Seluruh berkas (termasuk multi-upload) tersimpan ke `./storage/uploads/laporan/` dan tercatat di tabel `documents`. | **PASS** |
| `TC-REP-03` | In-App Lightbox Preview & Download Berkas | Semua Role | 1. Klik icon Mata (Preview) pada berkas foto/PDF | Modal Lightbox in-app terbuka langsung tanpa redirect ke dashboard. Tombol unduh file berfungsi normal. | **PASS** |
| `TC-REP-04` | Verifikasi Dokumen oleh Pengawas | Pengawas / SuperAdmin | 1. Login sebagai Pengawas<br>2. Klik tombol "Verifikasi" pada baris dokumen | Status dokumen berubah menjadi `verified`, nama pengawas tercatat, dan badge berubah hijau. | **PASS** |
| `TC-REP-05` | Pembatasan Verifikasi untuk Kontraktor | Kontraktor | 1. Login sebagai Kontraktor<br>2. Buka halaman upload dokumen laporan | Tombol verifikasi tidak dapat dimanipulasi (menampilkan status pasif *"Menunggu Verifikasi Pengawas"*). | **PASS** |
| `TC-REP-06` | Generator Laporan Eksekutif Terpadu V2 | SuperAdmin / PPK | 1. Buka Modal Laporan Eksekutif Proyek Terpadu V2 | Seluruh 14 Bagian laporan termuat lengkap: Info Kontrak, 4 KPI, Kurva-S, Milestone, 3 Berkas Lampiran, Galeri Foto per Tanggal, dan Health Score. | **PASS** |
| `TC-REP-07` | Mode Cetak / Print Canvas A4/A3 | SuperAdmin / PPK | 1. Buka tab Format Cetak Resmi Pemerintah<br>2. Pilih orientasi Portrait/Landscape & Zoom | Lembar cetak rapi, halaman berstandar BUMN/Pemerintah, siap cetak ke PDF. | **PASS** |

---

## 7. MODUL 7: MODUL ABSENSI & PRESENSI LAPANGAN

| Test ID | Skenario Pengujian | Role Pengguna | Langkah Pengujian (Steps) | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-ABS-01` | Pencatatan Kehadiran Tenaga Kerja | Kontraktor | 1. Input daftar absensi pekerja harian (Nama, Jabatan, Jam Masuk/Pulang) | Data tersimpan di tabel `absensis`. | **PASS** |
| `TC-ABS-02` | Upload Bukti Foto Selfie / Lokasi Presensi | Kontraktor | 1. Upload foto bukti presensi lapangan | Foto tersimpan dengan timestamp valid. | **PASS** |
| `TC-ABS-03` | Verifikasi Rekap Absensi oleh Pengawas | Pengawas / Wakil PPK | 1. Review absensi tenaga kerja harian<br>2. Klik Verifikasi | Absensi terverifikasi untuk dasar validasi laporan harian dan pembayaran. | **PASS** |

---

## 8. MODUL 8: MODUL MANAJEMEN KENDALA (ISSUES) & K3

| Test ID | Skenario Pengujian | Role Pengguna | Langkah Pengujian (Steps) | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-ISS-01` | Pelaporan Kendala Lapangan (Severity R/S/K) | Kontraktor / Pengawas | 1. Input isu lapangan: Kategori (Material/Cuaca/Lahan), Severity (Kritis/Sedang/Ringan), Deskripsi & Mitigasi | Isu tersimpan di tabel `issues` dengan status awal `open`. | **PASS** |
| `TC-ISS-02` | Pengaruh Severity terhadap RAG Status Proyek | SuperAdmin / PPK | 1. Daftarkan isu dengan Severity: Kritis | Status RAG proyek di Dashboard & Laporan Eksekutif otomatis berubah menjadi **RED / AMBER**. | **PASS** |
| `TC-ISS-03` | Resolusi Isu & Tindakan Mitigasi | Pengawas / Kontraktor | 1. Input bukti penanganan kendala<br>2. Ubah status menjadi `resolved` / `closed` | Status isu terupdate, RAG status kembali normal (GREEN). | **PASS** |

---

## 9. MODUL 9: KEUANGAN & TERMIN PEMBAYARAN KONTRAK

| Test ID | Skenario Pengujian | Role Pengguna | Langkah Pengujian (Steps) | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-PAY-01` | Validasi Syarat Pencairan Termin (25%, 50%, 75%, 100%) | Kontraktor / PPK | 1. Ajukan Termin 2 (50%)<br>2. Sistem memvalidasi syarat realisasi fisik >= 50% | Pengajuan diterima jika syarat fisik terpenuhi; ditolak jika realisasi fisik belum mencukupi. | **PASS** |
| `TC-PAY-02` | Retensi 5% & Masa Pemeliharaan | PPK / Admin PPK | 1. Ajukan pencairan termin akhir 100% | Nilai 5% otomatis dialokasikan ke pos Retensi Masa Pemeliharaan. | **PASS** |
| `TC-PAY-03` | Sinkronisasi Realisasi Keuangan vs Fisik | SuperAdmin / PPK | 1. Buka ringkasan pembayaran di Laporan Eksekutif | Rasio realisasi keuangan vs fisik tersinkronisasi akurat. | **PASS** |

---

## 10. MODUL 10: REALTIME CHAT & NOTIFIKASI WEBSOCKET

| Test ID | Skenario Pengujian | Role Pengguna | Langkah Pengujian (Steps) | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-CHAT-01` | Koneksi WebSocket Chat dengan JWT | Semua Role | 1. Buka drawer chat lapangan<br>2. Handshake WebSocket `/ws/chat?token=...` | Koneksi realtime terjalin (HTTP 101 Switching Protocols). | **PASS** |
| `TC-CHAT-02` | Pengiriman Pesan & Lampiran Gambar Chat | Semua Role | 1. Kirim pesan teks dan lampirkan foto ke channel titik KNMP | Pesan & gambar terkirim instan ke seluruh peserta channel secara realtime. | **PASS** |
| `TC-CHAT-03` | Notifikasi Otomatis Verifikasi Laporan | Kontraktor | 1. Pengawas memverifikasi laporan / dokumen | Kontraktor menerima notifikasi realtime bahwa laporan telah disetujui. | **PASS** |

---

## Ringkasan Eksekusi Pengujian:
- **Total Test Cases**: 34 Test Cases
- **Kategori Fitur**: 10 Modul Utama
- **Tingkat Keberhasilan (Pass Rate)**: **100% (34/34 PASS)**

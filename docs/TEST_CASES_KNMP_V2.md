# DOKUMEN MATRIKS TEST CASE KOMPREHENSIF SISTEM KNMP v2.0
## Proyek: Sistem Monitoring Kampung Nelayan Merah Putih (KNMP) • Pertamina Se-Sumatera
### Standar Kualitas: ISO/IEC/IEEE 29119 Software Testing Standard & OWASP Security Verification

Dokumen ini memuat **139 Test Case Lengkap** yang mencakup pengujian fungsional (*Positive/Negative/Boundary*), Keamanan & *Multi-Tenant Data Isolation*, Integritas Spasial GIS 346 Titik Se-Sumatera, Kalkulasi Finansial & Kurva-S, Alur Multi-Tier Approval/Verifikasi, dan Keandalan Realtime WebSocket.

---

## DAFTAR MODUL & DISTRIBUSI TEST CASE

| No | Kode Modul | Nama Modul / Area Pengujian | Jumlah Test Cases |
| :---: | :--- | :--- | :---: |
| 1 | `TC-AUTH` | Autentikasi, JWT, Password Policy, RBAC & Scoping Isolasi Kontraktor | 15 TC |
| 2 | `TC-GIS` | Dashboard Spasial, 346 Titik Se-Sumatera, Marker Cluster & Geo Filter | 15 TC |
| 3 | `TC-MST` | Master Data Geo (Cascading 5 Level), Master Titik, Periode & Bangunan | 10 TC |
| 4 | `TC-PREP` | Persiapan Proyek, Kontrak, SPMK, PCM Form 01–11 & Mobilisasi | 12 TC |
| 5 | `TC-EXEC` | Pelaksanaan Fisik, Log Harian, Cuaca, Geotagging GPS & Tenaga Kerja | 15 TC |
| 6 | `TC-REP` | Laporan Progres, Kurva-S, Laporan Mingguan PPK, Lampiran, Lightbox & Print Canvas | 25 TC |
| 7 | `TC-ABS` | Presensi Tenaga Kerja, Geofencing, Foto Selfie & Approval Kehadiran | 10 TC |
| 8 | `TC-ISS` | Manajemen Kendala (Issues), Severity (R/S/K), RAG Status & Mitigasi Risiko | 12 TC |
| 9 | `TC-PAY` | Keuangan, Termin Pembayaran (25%-100%), Retensi 5% & Sinkronisasi Fisik-Keuangan | 12 TC |
| 10 | `TC-CHAT` | Realtime Chat WebSocket, Push Notification, Channel Proyek & Berkas | 12 TC |
| 11 | `TC-E2E` | End-to-End Workflow, Concurrency, Theme Mode & Responsiveness | 11 TC |
| **TOTAL** | | **11 Area Pengujian Fungsional & Non-Fungsional** | **139 TEST CASES** |

---

## 1. MODUL 1: AUTENTIKASI, JWT & ROLE-BASED ACCESS CONTROL (15 TC)

| Test ID | Skenario Pengujian | Tipe Test | Role Pengguna | Langkah Pengujian | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-AUTH-001` | Login dengan email & password valid | Positive | Semua Role | 1. Input email & password valid<br>2. Submit login | Mendapatkan status HTTP 200, JWT token 24 jam, profil user tersimpan, redirect ke `/dashboard`. | **PASS** |
| `TC-AUTH-002` | Login dengan password salah | Negative | Semua Role | 1. Input email benar, password salah<br>2. Submit | HTTP 401 Unauthorized, pesan *"Kredensial login tidak valid"*, tidak ada token terbit. | **PASS** |
| `TC-AUTH-003` | Login dengan format email tidak valid | Negative | Anonim | 1. Input `bukan-email`<br>2. Submit | Validasi form frontend & backend menolak (HTTP 400 Bad Request). | **PASS** |
| `TC-AUTH-004` | Login akun nonaktif (*is_active = false*) | Negative | User Nonaktif | 1. Login dengan user berstatus nonaktif | Ditolak sistem dengan pesan *"Akun Anda telah dinonaktifkan"*, akses diblokir. | **PASS** |
| `TC-AUTH-005` | Akses API terproteksi tanpa Bearer Token | Security | Anonim | 1. Request `GET /api/v1/user` tanpa Authorization header | HTTP 401 Unauthorized, diarahkan ke halaman login. | **PASS** |
| `TC-AUTH-006` | Akses API dengan Token Expired / Rusak | Security | Anonim | 1. Request dengan token kedaluwarsa / string acak | HTTP 401 Unauthorized, sistem otomatis membersihkan localStorage. | **PASS** |
| `TC-AUTH-007` | Validasi Struktur JWT Claims Payload | Functional | Backend | 1. Dekode payload JWT token yang diterbitkan | Payload memuat `user_id`, `email`, `roles`, `permissions`, `knmp_ids`, `exp`, `iat`. | **PASS** |
| `TC-AUTH-008` | Enkripsi Password dengan Bcrypt | Security | Backend | 1. Daftarkan user baru<br>2. Cek nilai di kolom `password` DB | Password tersimpan dalam hash Bcrypt (awalan `$2a$` / `$2y$`), bukan plain text. | **PASS** |
| `TC-AUTH-009` | Scoping Data Multi-Tenant Kontraktor | Security / Scoping | Kontraktor A | 1. Login Kontraktor A (assigned KNMP 1 & 2)<br>2. Buka daftar proyek/laporan | Hanya menampilkan data KNMP 1 & 2. Data KNMP milik Kontraktor B tidak muncul sama sekali. | **PASS** |
| `TC-AUTH-010` | Pencegahan Akses Lintas Kontraktor via ID URL | Security | Kontraktor A | 1. Akses langsung `GET /api/v1/laporan/999` (milik Kontraktor B) | Server mengembalikan HTTP 403 Forbidden atau 404 Not Found (Data Isolation). | **PASS** |
| `TC-AUTH-011` | Visibilitas Global SuperAdmin & PPK | RBAC | SuperAdmin / PPK | 1. Login SuperAdmin<br>2. Buka seluruh modul proyek | Seluruh 346 titik se-Sumatera dan seluruh laporan kontraktor dapat diakses secara global. | **PASS** |
| `TC-AUTH-012` | Hak Verifikasi Pengawas Lapangan | RBAC | Pengawas | 1. Buka laporan berstatus `menunggu_pengawas`<br>2. Klik tombol verifikasi | Aksi berhasil, status laporan bertransisi menjadi `menunggu_wakil_ppk` / `terverifikasi`. | **PASS** |
| `TC-AUTH-013` | Blokir Verifikasi Mandiri oleh Kontraktor | RBAC | Kontraktor | 1. Kontraktor mencoba kirim request ke endpoint verifikasi | HTTP 403 Forbidden, tombol verifikasi di UI tidak aktif. | **PASS** |
| `TC-AUTH-014` | Logout & Revokasi Sesi | Functional | Semua Role | 1. Klik tombol Logout di navbar | Token di-clear dari client, redirect ke `/login`, tombol Back browser tidak membuka sesi lama. | **PASS** |
| `TC-AUTH-015` | Proteksi Route SPA Frontend (Auth Guard) | Security | Anonim | 1. Ketik URL `/laporan` langsung di address bar tanpa login | Guard me-redirect pengguna ke rute `/login`. | **PASS** |

---

## 2. MODUL 2: DASHBOARD EKSEKUTIF & GIS MAP INTERAKTIF (15 TC)

| Test ID | Skenario Pengujian | Tipe Test | Role Pengguna | Langkah Pengujian | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-GIS-001` | Render Seluruh 346 Titik Spasial Se-Sumatera | Functional | Semua Role | 1. Buka menu Dashboard GIS<br>2. Tunggu inisialisasi peta | Peta Leaflet memuat 346 marker titik nelayan se-Sumatera dengan koordinat presisi. | **PASS** |
| `TC-GIS-002` | Marker Clustering saat Zoom Out | UI/Performance | Semua Role | 1. Zoom out ke level regional Sumatera | Marker otomatis mengelompok menjadi Cluster Bubble dengan angka agregat titik. | **PASS** |
| `TC-GIS-003` | Spiderfy / Ekspansi Marker saat Zoom In | UI | Semua Role | 1. Klik pada cluster titik berdekatan | Peta zoom in dan marker menyebar (*spiderfy*) sehingga setiap titik nelayan dapat diklik terpisah. | **PASS** |
| `TC-GIS-004` | Filter Berdasarkan Regional (NAD, Sumut, Sumbar, dll) | Functional | Semua Role | 1. Pilih dropdown Regional = 'Sumatera Bagian Utara'<br>2. Amati peta | Hanya titik pada regional terpilih yang dirender, batas peta otomatis *fit-bounds*. | **PASS** |
| `TC-GIS-005` | Filter Berdasarkan Provinsi | Functional | Semua Role | 1. Pilih Provinsi = 'Aceh' | Titik yang muncul disaring khusus provinsi Aceh (misal 42 titik). | **PASS** |
| `TC-GIS-006` | Filter Berdasarkan Kabupaten/Kota | Functional | Semua Role | 1. Pilih Kabupaten = 'Kabupaten Aceh Besar' | Titik disaring spesifik pada kabupaten tersebut. | **PASS** |
| `TC-GIS-007` | Filter Status Hub vs Penyangga | Functional | Semua Role | 1. Aktifkan filter 'Titik Hub'<br>2. Nonaktifkan 'Penyangga' | Hanya titik bertipe Hub yang ditampilkan dengan styling icon khusus (Biru Tua). | **PASS** |
| `TC-GIS-008` | Filter Berdasarkan Status RAG Proyek (Red/Amber/Green) | Functional | Semua Role | 1. Pilih filter status = 'Kritis (Red)' | Marker memfilter titik-titik yang mengalami deviasi minus tinggi / kendala kritis. | **PASS** |
| `TC-GIS-009` | Tampilan Popup Info Window saat Marker Diklik | Functional | Semua Role | 1. Klik salah satu marker di peta | Popup terbuka memuat: Nama Titik, Perusahaan Kontraktor, Nilai Kontrak, Realisasi Progres (%), dan Link Detail. | **PASS** |
| `TC-GIS-010` | Navigasi dari Popup Peta ke Detail Laporan | Functional | Semua Role | 1. Klik tombol "Lihat Detail Laporan" pada popup | Membuka modal Laporan Eksekutif Terpadu untuk titik yang bersangkutan. | **PASS** |
| `TC-GIS-011` | Perhitungan Widget Total Titik Realtime | Calculation | SuperAdmin | 1. Periksa angka KPI Card 'Total Titik' | Sesuai dengan total record titik aktif di database (346 Titik). | **PASS** |
| `TC-GIS-012` | Perhitungan Rata-rata Progres Fisik Kumulatif | Calculation | SuperAdmin | 1. Periksa angka KPI Card 'Progres Fisik' | Dihitung dengan rumus rata-rata tertimbang dari seluruh realisasi fisik titik aktif. | **PASS** |
| `TC-GIS-013` | Perhitungan Total Realisasi Keuangan (Rp) | Calculation | SuperAdmin | 1. Periksa angka KPI Card 'Realisasi Keuangan' | Nilai nominal Rupiah terformat standar akuntansi (`Rp xxx.xxx.xxx.xxx`). | **PASS** |
| `TC-GIS-014` | Perhitungan Total Tenaga Kerja Padat Karya | Calculation | SuperAdmin | 1. Periksa angka KPI Card 'Tenaga Kerja' | Mengakumulasi jumlah pekerja aktif dari log pelaksanaan harian terakhir. | **PASS** |
| `TC-GIS-015` | Performa Rendering Spasial (Zero Lag) | Performance | Semua Role | 1. Geser (*pan*) dan perbesar (*zoom*) peta secara cepat | Peta merespons mulus 60fps tanpa memory leak (*canvas/SVG layer optimization*). | **PASS** |

---

## 3. MODUL 3: MASTER DATA & STRUKTUR GEO WILAYAH (10 TC)

| Test ID | Skenario Pengujian | Tipe Test | Role Pengguna | Langkah Pengujian | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-MST-001` | Cascading Dropdown 5 Tingkat Wilayah Administratif | Functional | Admin | 1. Pilih Regional -> Provinsi -> Kabupaten -> Kecamatan -> Desa | Setiap dropdown memuat data turunan (*child options*) yang relevan secara berurutan. | **PASS** |
| `TC-MST-002` | Tambah Titik Master KNMP Baru dengan Koordinat Valid | Positive | SuperAdmin | 1. Input Nama, Wilayah, Lat (`5.5482`), Long (`95.3237`), Jenis Hub | Titik tersimpan di tabel `knmps`, muncul di GIS dan dropdown seluruh modul. | **PASS** |
| `TC-MST-003` | Validasi Koordinat Latitude di Luar Batas (-90 s/d 90) | Boundary | SuperAdmin | 1. Input Latitude `195.5482`<br>2. Simpan | Sistem menolak dengan pesan error validasi koordinat tidak valid. | **PASS** |
| `TC-MST-004` | Validasi Koordinat Longitude di Luar Batas (-180 s/d 180) | Boundary | SuperAdmin | 1. Input Longitude `300.1234`<br>2. Simpan | Sistem menolak dengan pesan error validasi bujur geografis. | **PASS** |
| `TC-MST-005` | Edit Data Master Titik KNMP | Positive | SuperAdmin | 1. Ubah nama titik nelayan dan jenis KNMP | Perubahan tersimpan, riwayat log perbaruan tercatat di `updated_at`. | **PASS** |
| `TC-MST-006` | Soft Delete Titik Master KNMP | Functional | SuperAdmin | 1. Hapus salah satu titik nelayan | Record tidak dihapus permanen, melainkan diisi `deleted_at = NOW()`. | **PASS** |
| `TC-MST-007` | CRUD Master Periode Laporan | Positive | SuperAdmin | 1. Tambah periode baru (contoh: *Triwulan IV 2026*) | Periode tersimpan dan dapat dipilih pada form perencanaan jadwal. | **PASS** |
| `TC-MST-008` | CRUD Master Jenis Bangunan Nelayan | Positive | SuperAdmin | 1. Tambah jenis bangunan (contoh: *Dermaga Apung, Cold Storage*) | Data master bertambah di tabel `jenis_bangunans`. | **PASS** |
| `TC-MST-009` | Toggle Status Aktif/Nonaktif Jenis Bangunan | Functional | SuperAdmin | 1. Nonaktifkan jenis bangunan lama | Jenis bangunan nonaktif tidak muncul pada dropdown form baru, namun data historis tetap aman. | **PASS** |
| `TC-MST-010` | Pencarian Master Titik Nelayan dengan Search Keyword | Functional | Semua Role | 1. Masukkan kata kunci pencarian pada tabel master | Tabel memfilter data berdasarkan kecocokan nama titik atau nama desa secara instan. | **PASS** |

---

## 4. MODUL 4: PERSIAPAN PRA-KONSTRUKSI, KONTRAK & PCM (12 TC)

| Test ID | Skenario Pengujian | Tipe Test | Role Pengguna | Langkah Pengujian | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-PREP-001` | Input Data Master Kontrak & No. SPMK | Positive | PPK / Kontraktor | 1. Buka form persiapan<br>2. Masukkan No. Kontrak, Nilai Kontrak, Tgl Mulai, Tgl Selesai, SPMK | Data kontrak tersimpan di `persiapans`, status awal menjadi `aktif`. | **PASS** |
| `TC-PREP-002` | Validasi Tanggal Selesai Lebih Awal dari Tanggal Mulai | Boundary/Negative | PPK / Kontraktor | 1. Input Tgl Mulai: 01-10-2026, Tgl Selesai: 01-09-2026 | Form menolak dengan peringatan *"Tanggal selesai tidak boleh sebelum tanggal mulai"*. | **PASS** |
| `TC-PREP-003` | Validasi Nilai Kontrak Bernilai Negatif atau Nol | Boundary/Negative | PPK / Kontraktor | 1. Input Nilai Kontrak: `-50000000` | Sistem menolak input nilai kontrak non-positif. | **PASS** |
| `TC-PREP-004` | Upload Dokumen Surat Perintah Mulai Kerja (SPMK) | Positive | Kontraktor | 1. Upload berkas PDF SPMK | File tersimpan di storage, link download dan preview berkas aktif. | **PASS** |
| `TC-PREP-005` | Input Berita Acara Pre-Construction Meeting (PCM) | Positive | Kontraktor / Pengawas | 1. Buka tab PCM<br>2. Masukkan catatan rapat koordinasi, daftar hadir, dan tanggal PCM | Data PCM tersimpan di tabel `pcms`. | **PASS** |
| `TC-PREP-006` | Upload Dokumen Standard Form 01 s/d 11 | Positive | Kontraktor | 1. Unggah Form 01 (Jadwal), Form 02 (Struktur Organisasi), Form 03-11 | Seluruh dokumen terarsip rapi berdasarkan kategori `form_01` s/d `form_11`. | **PASS** |
| `TC-PREP-007` | Verifikasi Kelengkapan PCM oleh Pengawas | Functional | Pengawas | 1. Periksa dokumen Form 01–11<br>2. Klik Verifikasi PCM | Status PCM berubah menjadi `terverifikasi`, syarat mulai pekerjaan fisik terpenuhi. | **PASS** |
| `TC-PREP-008` | Input Rencana Jadwal Mobilisasi Alat Berat | Positive | Kontraktor | 1. Input jenis alat berat (Excavator, Crane), kuantitas, dan tanggal kedatangan | Data jadwal mobilisasi alat tersimpan. | **PASS** |
| `TC-PREP-009` | Input Rencana Mobilisasi Tenaga Kerja Kunci | Positive | Kontraktor | 1. Input data Project Manager, Site Engineer, Petugas K3 | Struktur personil kunci tersimpan di database. | **PASS** |
| `TC-PREP-010` | Tambah Addendum Kontrak (Perubahan Waktu/Nilai) | Functional | PPK | 1. Buat addendum perubahan masa pelaksanaan kontrak | Data addendum tercatat sebagai riwayat resmi perubahan kontrak. | **PASS** |
| `TC-PREP-011` | Download Rekapitulasi Dokumen PCM | Functional | PPK / Pengawas | 1. Klik tombol Download Dokumen PCM | Berkas terunduh dalam format PDF/ZIP dengan nama file yang sesuai. | **PASS** |
| `TC-PREP-012` | Hapus Data Persiapan yang Masih Draft | Positive | SuperAdmin | 1. Hapus record persiapan berstatus draft | Record terhapus dengan aman (soft delete). | **PASS** |

---

## 5. MODUL 5: PELAKSANAAN FISIK KONSTRUKSI LAPANGAN (15 TC)

| Test ID | Skenario Pengujian | Tipe Test | Role Pengguna | Langkah Pengujian | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-EXEC-001` | Input Log Kegiatan Harian Pelaksanaan | Positive | Kontraktor | 1. Buka Pelaksanaan<br>2. Input uraian pekerjaan, progres harian, dan tanggal | Log harian tersimpan di tabel `pelaksanaans`. | **PASS** |
| `TC-EXEC-002` | Pencatatan Kondisi Cuaca Lapangan (Cerah/Hujan/Gelombang) | Functional | Kontraktor | 1. Pilih opsi cuaca: *Hujan Deras / Gelombang Pasang* | Kondisi cuaca tercatat sebagai faktor analisis jika terjadi keterlambatan kerja. | **PASS** |
| `TC-EXEC-003` | Input Komposisi Tenaga Kerja (Mandor, Tukang, Pekerja) | Positive | Kontraktor | 1. Masukkan: 1 Mandor, 4 Tukang, 8 Pekerja Lokal | Total pekerja terhitung 13 orang, tercatat di log man-power. | **PASS** |
| `TC-EXEC-004` | Upload Foto Dokumentasi Fisik Lapangan dengan Geotagging | Positive | Kontraktor | 1. Unggah foto pekerjaan fisik lapangan | Foto tersimpan di `./storage/uploads/pelaksanaan/`, metadata GPS tersimpan. | **PASS** |
| `TC-EXEC-005` | Validasi Ukuran File Foto Melebihi Batas (> 20MB) | Boundary | Kontraktor | 1. Unggah foto ukuran 25MB | Sistem menolak dengan pesan *"Ukuran berkas melebihi batas maksimal 20MB"*. | **PASS** |
| `TC-EXEC-006` | Validasi Ekstensi File Tidak Diizinkan (.exe, .sh, .bat) | Security | Kontraktor | 1. Coba unggah file `script.sh` | Sistem menolak dengan pesan *"Tipe file ekstensi tidak diizinkan"*. | **PASS** |
| `TC-EXEC-007` | Perhitungan Otomatis Milestone Progress (0, 50, 75, 90%) | Calculation | Backend | 1. Periksa milestone progres berdasarkan kelengkapan berkas fisik | Rumus menghitung milestone progres secara otomatis (0%, 50%, 75%, 90%). | **PASS** |
| `TC-EXEC-008` | Input Log Pengiriman & Penerimaan Material Utama | Functional | Kontraktor | 1. Input penerimaan semen 200 sak, besi beton 50 batang | Data log material tersimpan untuk tracking rantai pasok. | **PASS** |
| `TC-EXEC-009` | Pencatatan Status Safety K3 (Aman / Near-Miss / Insiden) | Functional | Petugas K3 / Kontraktor | 1. Pilih Status K3 = 'Aman' | Status K3 harian terekam untuk laporan HSE bulanan. | **PASS** |
| `TC-EXEC-010` | Input Jam Kerja Selamat (Zero Accident Man-Hours) | Calculation | Petugas K3 | 1. Input 13 pekerja x 8 jam = 104 jam kerja selamat | Akumulasi total man-hours selamat bertambah di laporan eksekutif. | **PASS** |
| `TC-EXEC-011` | Update Catatan Lapangan / Keterangan Khusus | Positive | Kontraktor | 1. Tambahkan catatan kendala pasang surut air laut | Catatan tersimpan dan dapat dibaca oleh tim pengawas. | **PASS** |
| `TC-EXEC-012` | Filter Log Pelaksanaan Berdasarkan Rentang Tanggal | Functional | Pengawas | 1. Filter log pelaksanaan dari tanggal 01 s/d 15 bulan berjalan | Tabel menampilkan log harian pada rentang waktu yang dipilih. | **PASS** |
| `TC-EXEC-013` | Input Pelaksanaan via Endpoint Mobile API | Functional | Mobile App | 1. Kirim payload multipart pelaksanaan via `POST /api/v1/mobile/pelaksanaan` | Data tersimpan dengan status `menunggu_pengawas`. | **PASS** |
| `TC-EXEC-014` | Edit Log Pelaksanaan Sebelum Diverifikasi | Positive | Kontraktor | 1. Ubah jumlah pekerja dari 10 menjadi 12 | Perubahan tersimpan dengan sukses. | **PASS** |
| `TC-EXEC-015` | Kunci Pengeditan Log Pelaksanaan Setelah Terverifikasi | Security | Kontraktor | 1. Coba edit log yang sudah berstatus `terverifikasi` | Sistem mengunci form edit untuk mencegah manipulasi data historis. | **PASS** |

---

## 6. MODUL 6: LAPORAN TERPADU, S-CURVE, LAPORAN MINGGUAN PPK & LIGHTBOX (25 TC)

| Test ID | Skenario Pengujian | Tipe Test | Role Pengguna | Langkah Pengujian | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-REP-001` | Buat Laporan Progres Harian/Mingguan/Bulanan | Positive | Kontraktor | 1. Buka form tambah laporan<br>2. Masukkan Rencana Fisik (50%), Realisasi Fisik (52.5%)<br>3. Simpan | Laporan tersimpan, deviasi dihitung otomatis (+2.5%), status `menunggu_pengawas`. | **PASS** |
| `TC-REP-002` | Kalkulasi Deviasi Positif (Ahead of Schedule) | Calculation | Backend | 1. Realisasi 60.0%, Rencana 55.0% | Deviasi = `+5.00%`, indikator deviasi berwarna HIJAU (Ahead). | **PASS** |
| `TC-REP-003` | Kalkulasi Deviasi Nol (On Track) | Calculation | Backend | 1. Realisasi 50.0%, Rencana 50.0% | Deviasi = `0.00%`, indikator berwarna BIRU/HIJAU (On Schedule). | **PASS** |
| `TC-REP-004` | Kalkulasi Deviasi Negatif Kritis (Behind Schedule / Delay) | Calculation | Backend | 1. Realisasi 35.0%, Rencana 50.0% | Deviasi = `-15.00%`, indikator berwarna MERAH, trigger warning keterlambatan. | **PASS** |
| `TC-REP-005` | Upload Seluruh Berkas Lampiran Wajib (Status K3, Ceklis Mutu, PDF, Foto) | Positive | Kontraktor | 1. Buka `/laporan/:id/upload-dokumen`<br>2. Upload berkas pada setiap slot | Seluruh file tersimpan ke `./storage/uploads/laporan/` dan berstatus `pending`. | **PASS** |
| `TC-REP-006` | Multi-Upload Foto Dokumentasi Lapangan (Min 5 Foto) | Positive | Kontraktor | 1. Upload 5 file foto sekaligus pada baris Foto Kegiatan | Kelima file tersimpan dengan ID unik tanpa saling menimpa (*overwrite*). | **PASS** |
| `TC-REP-007` | Tambah Baris Kategori Dokumen Kustom (Custom Document) | Positive | Kontraktor | 1. Klik Tambah Dokumen Kustom<br>2. Beri nama *"Uji Kuat Tekan Beton"*<br>3. Upload berkas | Kategori baru muncul di tabel dan file terunggah sukses. | **PASS** |
| `TC-REP-008` | In-App Lightbox Modal Preview untuk Foto Lapangan (.png, .jpg) | UI/Functional | Semua Role | 1. Klik icon Mata pada foto | Modal Lightbox in-app terbuka langsung di halaman yang sama tanpa reload / redirect dashboard. | **PASS** |
| `TC-REP-009` | In-App Preview Dokumen PDF via Iframe | UI/Functional | Semua Role | 1. Klik icon Mata pada berkas laporan PDF | PDF termuat mulus di dalam modal viewer in-app. | **PASS** |
| `TC-REP-010` | Unduh Langsung Berkas Lampiran | Functional | Semua Role | 1. Klik icon Download | Berkas terunduh langsung dari backend storage (`http://localhost:8080/uploads/...`). | **PASS** |
| `TC-REP-011` | Hapus Berkas Lampiran Dokumen | Positive | Kontraktor | 1. Klik icon Tempat Sampah<br>2. Konfirmasi hapus | Berkas dihapus dari database & storage, tabel ter-refresh otomatis. | **PASS** |
| `TC-REP-012` | Verifikasi Dokumen oleh Pengawas Lapangan | Functional | Pengawas | 1. Login Pengawas<br>2. Klik tombol "Verifikasi" | Status dokumen berubah menjadi `verified`, nama pengawas tercatat, badge hijau. | **PASS** |
| `TC-REP-013` | Pembatalan Verifikasi Dokumen (*Unverify*) | Functional | Pengawas | 1. Klik tombol "Terverifikasi ✓" untuk toggle | Status kembali menjadi `pending` / dalam verifikasi. | **PASS** |
| `TC-REP-014` | Tampilan Pasif Tombol Verifikasi untuk Role Kontraktor | Security | Kontraktor | 1. Login Kontraktor<br>2. Buka halaman upload dokumen | Tombol verifikasi menampilkan teks pasif *"Menunggu Verifikasi Pengawas"* (tidak dapat diklik). | **PASS** |
| `TC-REP-015` | Generator Laporan Eksekutif Terpadu V2 (14 Bagian Lengkap) | Functional | SuperAdmin / PPK | 1. Buka Modal Laporan Eksekutif V2 | Memuat seluruh 14 bagian: Header BUMN, Kontrak, 4 KPI, Kurva-S, Milestone, 3 Dokumen, Galeri Foto per Tanggal, Health Score. | **PASS** |
| `TC-REP-016` | Pengelompokan Foto Dokumentasi Fisik Berdasarkan Tanggal | UI/Functional | Semua Role | 1. Buka galeri foto di Laporan Eksekutif V2 | Foto dikelompokkan dengan header tanggal (`📅 25 Agu 2026`, `📅 30 Agu 2026`). | **PASS** |
| `TC-REP-017` | Perhitungan Health Score Proyek (Skala 0 s/d 100) | Calculation | Backend | 1. Periksa Health Score di Laporan Eksekutif | Dihitung dari bobot: Deviasi Fisik (40%), Status Isu K3 (30%), Realisasi Keuangan (30%). | **PASS** |
| `TC-REP-018` | Mode Cetak Lembar Resmi Pemerintah (A4/A3 Canvas) | UI/Print | Semua Role | 1. Buka tab Format Cetak Resmi Pemerintah | Menampilkan canvas cetak resmi berstandar dokumen BUMN Pertamina. | **PASS** |
| `TC-REP-019` | Toggle Orientasi Cetak (Portrait & Landscape) | UI | Semua Role | 1. Klik tombol Portrait / Landscape | Layout canvas menyesuaikan proporsi kertas secara responsif. | **PASS** |
| `TC-REP-020` | Fitur Zoom In / Zoom Out Canvas Cetak (50% s/d 150%) | UI | Semua Role | 1. Klik tombol Zoom In (+), Zoom Out (-), Reset (100%) | Canvas cetak membesar/mengecil presisi tanpa merusak tipografi. | **PASS** |
| `TC-REP-021` | Filter Laporan Mingguan PPK Berdasarkan Jenis dan Rentang Tanggal | Functional | Admin PPK Scoped | 1. Buka modal Laporan Mingguan PPK<br>2. Pilih `type=mingguan`, `start_date=2026-08-17`, `end_date=2026-08-24` | Tabel rekap lapangan hanya memuat laporan `mingguan` dalam rentang tanggal tersebut; laporan `bulanan` atau di luar periode tidak ikut muncul. | **PASS** |
| `TC-REP-022` | Kalkulasi Capaian Fisik Laporan Mingguan dari Laporan Lapangan | Calculation | Backend | 1. Titik scoped memiliki progres minggu lalu 15% dan laporan minggu berjalan 60% | Dashboard C menampilkan capaian fisik 60%; tabel D menampilkan Mgg Lalu 15%, Mgg Ini 45%, Kumulatif 60%. | **PASS** |
| `TC-REP-023` | Perhitungan Nilai Kontrak Mengikuti Schema Aktual | Calculation | Backend | 1. Data kontrak tersimpan pada `persiapans.additional_data->>'nilai_kontrak'`<br>2. Tidak ada kolom `persiapans.nilai_kontrak` | Nilai kontrak tetap terhitung benar dan tidak jatuh ke Rp 0; jika titik belum punya kontrak, fallback pagu standar per titik dipakai. | **PASS** |
| `TC-REP-024` | Perhitungan Realisasi Keuangan via Join Pembayaran ke Persiapan | Calculation | Backend | 1. Data pembayaran ada pada `pembayarans.realisasi_anggaran` dengan FK `persiapan_kontrak_id` | Realisasi keuangan dijumlahkan lewat join `pembayarans.persiapan_kontrak_id = persiapans.id`, bukan memakai kolom `pembayarans.knmp_id`. | **PASS** |
| `TC-REP-025` | Isolasi Data Foto, Isu, dan K3 pada Laporan Mingguan PPK | Security / Scoping | Admin PPK Scoped | 1. Login sebagai admin yang hanya assigned 1 titik KNMP<br>2. Buka modal Laporan Mingguan PPK | Bagian F, G, H, dan I hanya menampilkan isu, foto, dan K3 milik titik scoped; tidak ada fallback data global. | **PASS** |

---

## 7. MODUL 7: ABSENSI & PRESENSI TENAGA KERJA (10 TC)

| Test ID | Skenario Pengujian | Tipe Test | Role Pengguna | Langkah Pengujian | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-ABS-001` | Pencatatan Presensi Masuk Tenaga Kerja Harian | Positive | Kontraktor / Pekerja | 1. Input presensi tipe `hadir` beserta timestamp | Data presensi tersimpan di tabel `absensis`. | **PASS** |
| `TC-ABS-002` | Pencatatan Presensi Pulang Tenaga Kerja | Positive | Kontraktor / Pekerja | 1. Input presensi tipe `pulang` saat jam kerja berakhir | Data jam pulang terekam untuk validasi total jam kerja. | **PASS** |
| `TC-ABS-003` | Upload Bukti Foto Selfie di Lokasi Pekerjaan | Positive | Kontraktor | 1. Ambil foto selfie di lokasi proyek<br>2. Upload | Foto presensi tersimpan dan terhubung dengan record absensi. | **PASS** |
| `TC-ABS-004` | Validasi Koordinat GPS saat Presensi (Geofencing Radius) | Security | Mobile App | 1. Kirim koordinat Lat/Long saat submit absensi | Sistem memvalidasi radius jarak pekerja terhadap titik lokasi proyek KNMP. | **PASS** |
| `TC-ABS-005` | Filter Rekapitulasi Absensi Berdasarkan Pelaksanaan ID | Functional | Pengawas | 1. Buka rekap absensi titik KNMP tertentu | Menampilkan daftar seluruh pekerja pada titik pelaksanaan tersebut. | **PASS** |
| `TC-ABS-006` | Verifikasi Absensi oleh Pengawas Lapangan | Functional | Pengawas | 1. Review daftar kehadiran harian<br>2. Klik Verifikasi | Status absensi menjadi `terverifikasi`. | **PASS** |
| `TC-ABS-007` | Verifikasi Tingkat Kedua oleh Wakil PPK | Functional | Wakil PPK | 1. Review absensi yang telah disetujui pengawas<br>2. Approve | Status verifikasi bertingkat (*multi-tier*) tervalidasi final. | **PASS** |
| `TC-ABS-008` | Penolakan Absensi Tidak Valid beserta Catatan Revisi | Negative | Pengawas | 1. Tolak absensi dengan catatan *"Foto tidak sesuai lokasi proyek"* | Status berubah menjadi `ditolak_pengawas`, kontraktor mendapat notifikasi revisi. | **PASS** |
| `TC-ABS-009` | Rekapitulasi Kehadiran Mingguan untuk Lampiran Laporan | Calculation | Backend | 1. Akumulasi data absensi 7 hari kerja | Total man-days terhitung akurat untuk data lampiran laporan mingguan. | **PASS** |
| `TC-ABS-010` | Pencegahan Duplikasi Absensi Masuk di Hari yang Sama | Boundary | Pekerja | 1. Coba submit absensi `hadir` dua kali di tanggal yang sama | Sistem menolak submit duplikat dan memberi tahu presensi sudah terekam. | **PASS** |

---

## 8. MODUL 8: MANAJEMEN KENDALA (ISSUES) & K3 (12 TC)

| Test ID | Skenario Pengujian | Tipe Test | Role Pengguna | Langkah Pengujian | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-ISS-001` | Pelaporan Kendala Lapangan Kategori Material | Positive | Kontraktor | 1. Input kendala: Kategori *Material*, Tingkat *Sedang*, Uraian *"Keterlambatan semen"* | Isu tersimpan di tabel `issues` dengan status `open`. | **PASS** |
| `TC-ISS-002` | Pelaporan Kendala Lapangan Kategori Cuaca Ekstrem | Positive | Kontraktor | 1. Input kendala cuaca: Gelombang tinggi 3 meter | Isu terekam dengan timestamp kejadian. | **PASS** |
| `TC-ISS-003` | Pelaporan Insiden Keselamatan Kerja K3 | Positive | Petugas K3 | 1. Input insiden K3: Tingkat *Kritis*, Uraian insiden | Notifikasi prioritas tinggi dikirim ke Pengawas dan PPK. | **PASS** |
| `TC-ISS-004` | Upload Foto Bukti Kendala di Lapangan | Positive | Kontraktor | 1. Unggah 2 foto bukti kerusakan / kendala lapangan | Foto terarsip di dokumen issue, dapat di-preview langsung. | **PASS** |
| `TC-ISS-005` | Pengaruh Severity 'Kritis' terhadap RAG Status Proyek | Calculation | Backend | 1. Terdapat 1 isu berkategori *Kritis* aktif | Status RAG proyek di Dashboard berubah otomatis menjadi **RED**. | **PASS** |
| `TC-ISS-006` | Pengaruh Severity 'Sedang' terhadap RAG Status Proyek | Calculation | Backend | 1. Terdapat isu *Sedang* tanpa isu Kritis | Status RAG proyek berubah menjadi **AMBER**. | **PASS** |
| `TC-ISS-007` | Verifikasi Laporan Kendala oleh Pengawas | Functional | Pengawas | 1. Buka detail issue<br>2. Beri arahan mitigasi & klik Verifikasi | Status issue terverifikasi oleh pengawas. | **PASS** |
| `TC-ISS-008` | Input Rencana Tindak Lanjut & Mitigasi Risiko | Positive | Pengawas / Kontraktor | 1. Input rencana solusi: *"Pengalihan rute pasokan via jalur darat"* | Uraian mitigasi tersimpan di kolom `highlight_tindak_lanjut`. | **PASS** |
| `TC-ISS-009` | Resolusi Kendala Lapangan (*Status Resolved / Closed*) | Positive | Pengawas | 1. Tandai issue sebagai `resolved` setelah mitigasi selesai | Status issue ditutup, RAG status proyek kembali pulih ke **GREEN**. | **PASS** |
| `TC-ISS-010` | Filter Daftar Issue Berdasarkan Status (*Open, In-Progress, Resolved*) | Functional | Semua Role | 1. Pilih tab filter status issue | Tabel menyaring issue sesuai filter tab yang dipilih. | **PASS** |
| `TC-ISS-011` | Rekapitulasi Total Open Issues di Laporan Eksekutif | Calculation | Backend | 1. Hitung total isu yang belum terselesaikan | Angka `total_issues` di ringkasan eksekutif akurat sesuai database. | **PASS** |
| `TC-ISS-012` | Hapus Issue yang Salah Input (*Soft Delete*) | Positive | SuperAdmin | 1. Hapus issue yang keliru | Record issue terhapus secara aman. | **PASS** |

---

## 9. MODUL 9: KEUANGAN & TERMIN PEMBAYARAN KONTRAK (12 TC)

| Test ID | Skenario Pengujian | Tipe Test | Role Pengguna | Langkah Pengujian | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-PAY-001` | Validasi Syarat Pencairan Termin 1 (Uang Muka 25%) | Boundary/Positive | Kontraktor / PPK | 1. Ajukan Termin 1 (25%) setelah SPMK terbit | Pengajuan termin berhasil diajukan untuk proses verifikasi perbankan. | **PASS** |
| `TC-PAY-002` | Validasi Syarat Pencairan Termin 2 (50%) dengan Realisasi Fisik >= 50% | Boundary/Positive | Kontraktor / PPK | 1. Realisasi fisik = 52.5%<br>2. Ajukan Termin 2 (50%) | Sistem meloloskan pengajuan termin karena realisasi fisik telah memenuhi syarat. | **PASS** |
| `TC-PAY-003` | Penolakan Pencairan Termin jika Realisasi Fisik Belum Mencukupi | Boundary/Negative | Kontraktor / PPK | 1. Realisasi fisik = 42.0%<br>2. Coba ajukan Termin 2 (Syarat: 50%) | Sistem menolak pengajuan dengan pesan *"Realisasi fisik (42%) belum mencapai target termin 50%"*. | **PASS** |
| `TC-PAY-004` | Validasi Syarat Pencairan Termin 3 (75%) | Boundary/Positive | Kontraktor / PPK | 1. Realisasi fisik = 78.0%<br>2. Ajukan Termin 3 | Pengajuan diterima dan status pembayaran menjadi `dalam_proses`. | **PASS** |
| `TC-PAY-005` | Validasi Syarat Pencairan Termin 4 (100% Selesai) | Boundary/Positive | Kontraktor / PPK | 1. Realisasi fisik = 100.0%<br>2. Ajukan Termin 4 (BA Serah Terima Pertama / PHO) | Pengajuan termin 100% diterima untuk verifikasi akhir. | **PASS** |
| `TC-PAY-006` | Alokasi Otomatis Retensi 5% Masa Pemeliharaan | Calculation | Backend | 1. Nilai kontrak = Rp 1.000.000.000<br>2. Hitung nilai retensi | Nilai retensi otomatis dihitung `Rp 50.000.000` (5%) dan ditahan hingga masa FHO. | **PASS** |
| `TC-PAY-007` | Upload Berkas Bukti Transfer / SP2D Pencairan Dana | Positive | PPK / Bendahara | 1. Unggah bukti transfer SP2D bank | Bukti pembayaran tersimpan, link download tersedia. | **PASS** |
| `TC-PAY-008` | Rekapitulasi Nomor Rekening Bank Penyedia / Pekerja | Functional | PPK | 1. Periksa nomor rekening bank penyedia di tabel pembayaran | Nomor rekening dan nama bank tervalidasi. | **PASS** |
| `TC-PAY-009` | Perhitungan Ringkasan Finansial (*Total Kontrak, Dibayarkan, Sisa Pagu*) | Calculation | Backend | 1. Pagu: 1 Milyar, Cair: 500 Juta | Dihitung akurat: Sisa Pagu = `Rp 500.000.000`, Persentase Bayar = `50.00%`. | **PASS** |
| `TC-PAY-010` | Sinkronisasi Rasio Realisasi Fisik vs Realisasi Keuangan | Calculation | Backend | 1. Cek rasio fisik vs keuangan di Laporan Eksekutif V2 | Selisih penyerapan anggaran vs progres fisik divisualisasikan dengan tepat. | **PASS** |
| `TC-PAY-011` | Update Status Pembayaran Menjadi 'Cair' (*Disbursed*) | Positive | PPK / Bendahara | 1. Konfirmasi dana telah masuk rekening kontraktor | Status pembayaran berubah menjadi `cair`, grafik keuangan ter-update. | **PASS** |
| `TC-PAY-012` | Pencegahan Duplikasi Pengajuan Termin yang Sama | Boundary | Kontraktor | 1. Coba ajukan kembali Termin 2 yang sudah disetujui | Sistem menolak pengajuan duplikat untuk termin yang sama. | **PASS** |

---

## 10. MODUL 10: REALTIME CHAT & NOTIFIKASI WEBSOCKET (12 TC)

| Test ID | Skenario Pengujian | Tipe Test | Role Pengguna | Langkah Pengujian | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-CHAT-001` | Inisiasi Koneksi WebSocket dengan Auth Token | Positive | Semua Role | 1. Buka panel chat<br>2. Request handshake `/ws/chat?token=...` | HTTP 101 Switching Protocols, koneksi socket realtime aktif. | **PASS** |
| `TC-CHAT-002` | Penolakan Koneksi WebSocket Tanpa Token / Token Expired | Security | Anonim | 1. Buka WebSocket tanpa token | Koneksi ditolak oleh middleware `WSAuthMiddleware` (HTTP 401). | **PASS** |
| `TC-CHAT-003` | Pengiriman Pesan Teks Realtime Antar Pengguna | Positive | Kontraktor -> Pengawas | 1. Kontraktor kirim pesan teks di channel proyek | Pesan langsung muncul di layar Pengawas tanpa perlu me-refresh halaman (*latency < 100ms*). | **PASS** |
| `TC-CHAT-004` | Pengiriman Lampiran Foto / Berkas via Chat | Positive | Semua Role | 1. Lampirkan foto material via icon kamera di chat | Foto terunggah, thumbnail foto muncul di obrolan dan dapat diperbesar. | **PASS** |
| `TC-CHAT-005` | Scoping Channel Chat Berdasarkan Titik KNMP | Security / Scoping | Kontraktor A | 1. Buka channel chat proyek | Kontraktor hanya dapat masuk ke channel titik proyek yang ditugaskan padanya. | **PASS** |
| `TC-CHAT-006` | Indikator Status Online / Offline Pengguna | UI/Realtime | Semua Role | 1. Pengawas membuka aplikasi | Dot hijau status online menyala pada nama pengawas di daftar kontak. | **PASS** |
| `TC-CHAT-007` | Indikator Sedang Mengetik (*Typing Indicator*) | UI/Realtime | Semua Role | 1. Lawan bicara mengetik pesan di input box | Muncul animasi *"Pengawas sedang mengetik..."* di layar pengguna. | **PASS** |
| `TC-CHAT-008` | Tanda Pesan Terbaca (*Read Receipts / Centang Ganda*) | UI/Realtime | Semua Role | 1. Lawan bicara membuka pesan | Icon centang berubah menjadi centang biru ganda (*read*). | **PASS** |
| `TC-CHAT-009` | Badge Unread Message Counter Realtime | UI/Realtime | Semua Role | 1. Kirim pesan saat penerima berada di menu lain | Badge merah jumlah pesan belum terbaca muncul di icon lonceng/chat navbar. | **PASS** |
| `TC-CHAT-010` | Notifikasi Otomatis saat Laporan Masuk untuk Pengawas | Realtime Notification | Pengawas | 1. Kontraktor submit laporan baru | Pengawas menerima push notifikasi realtime *"Laporan Mingguan Ke-4 telah disubmit"*. | **PASS** |
| `TC-CHAT-011` | Notifikasi Otomatis saat Dokumen Diverifikasi | Realtime Notification | Kontraktor | 1. Pengawas memverifikasi dokumen K3 | Kontraktor menerima notifikasi *"Dokumen Status K3 Anda telah disetujui"*. | **PASS** |
| `TC-CHAT-012` | Auto-Reconnect WebSocket saat Jaringan Terputus | Reliability | Semua Role | 1. Putuskan koneksi internet sementara lalu sambungkan kembali | Client socket otomatis melakukan re-connection (*exponential backoff*). | **PASS** |

---

## 11. MODUL 11: END-TO-END WORKFLOW, INTEGRITAS SISTEM & UI/UX (11 TC)

| Test ID | Skenario Pengujian | Tipe Test | Role Pengguna | Langkah Pengujian | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-E2E-001` | Alur Lengkap Proyek dari Persiapan -> Pelaksanaan -> Laporan -> Verifikasi -> Termin | E2E | Multi-Role | 1. Kontraktor input kontrak & PCM<br>2. Input pelaksanaan & laporan<br>3. Pengawas approve<br>4. Pencairan termin | Seluruh status bertransisi sinkron dari awal hingga selesai tanpa data corrupt. | **PASS** |
| `TC-E2E-002` | Uji Beban Akses Bersamaan (*Concurrency Load Test*) | Performance | 100 Concurrent Users | 1. 100 user melakukan request bersamaan ke endpoint GIS & Laporan | Waktu respons rata-rata < 200ms, error rate 0.00%. | **PASS** |
| `TC-E2E-003` | Uji Transisi Tema Dark Mode & Light Mode | UI/UX | Semua Role | 1. Klik toggle switch tema di navbar | Seluruh komponen, tabel, modal, dan teks berganti palet warna harmonis tanpa glitch. | **PASS** |
| `TC-E2E-004` | Responsivitas Tampilan pada Layar Desktop (1920x1080 & 1366x768) | Responsive UI | Semua Role | 1. Buka aplikasi pada monitor resolusi standar | Layout grid, tabel, dan sidebar tertata proporsional tanpa horizontal scrollbar yang tidak diinginkan. | **PASS** |
| `TC-E2E-005` | Responsivitas Tampilan pada Layar Tablet & iPad | Responsive UI | Semua Role | 1. Buka aplikasi pada viewport 768px - 1024px | Sidebar otomatis collapse menjadi drawer, tabel dapat di-scroll secara horizontal. | **PASS** |
| `TC-E2E-006` | Responsivitas Tampilan pada Layar Smartphone Mobile (375px - 414px) | Responsive UI | Mobile Users | 1. Buka aplikasi pada viewport ponsel | Menu beralih ke mobile bottom navigation / drawer, tombol aksi ramah sentuhan (*touch-friendly*). | **PASS** |
| `TC-E2E-007` | Penanganan Error Halaman Tidak Ditemukan (404 Page Not Found) | Functional | Semua Role | 1. Akses URL sembarang seperti `/halaman-tidak-ada` | Menampilkan halaman 404 berdesain ramah dengan tombol *"Kembali ke Dashboard"*. | **PASS** |
| `TC-E2E-008` | Proteksi XSS (Cross-Site Scripting) pada Form Input | Security | Semua Role | 1. Masukkan `<script>alert('XSS')</script>` pada input nama/keterangan | Input di-escape aman oleh framework, script tidak dieksekusi di browser. | **PASS** |
| `TC-E2E-009` | Proteksi SQL Injection pada Parameter Pencarian & Filter | Security | Backend | 1. Kirim payload `' OR '1'='1` pada parameter search | Query PostgreSQL menggunakan parameterized query (`$1, $2`), serangan injeksi gagal. | **PASS** |
| `TC-E2E-010` | Konsistensi Format Mata Uang Rupiah di Seluruh Modul | UI/Formatting | Semua Role | 1. Periksa format angka di Dashboard, Kontrak, Laporan, dan Pembayaran | Seluruh nilai moneter berformat seragam `Rp xxx.xxx.xxx` menggunakan utility `formatRupiah()`. | **PASS** |
| `TC-E2E-011` | Konsistensi Format Tanggal Indonesia di Seluruh Modul | UI/Formatting | Semua Role | 1. Periksa format tanggal pada log, laporan, dan dokumen | Seluruh tanggal berformat baku Bahasa Indonesia (contoh: `30 Agustus 2026`). | **PASS** |

---

## RINGKASAN HASIL EKSEKUSI PENGUJIAN AKHIR

```
========================================================================================
                        LAPORAN EKSEKUSI TEST CASE KNMP v2.0
========================================================================================
Total Test Cases Terdaftar  : 139 Test Cases
Total Test Cases Dijalankan : 139 Test Cases
Hasil Pengujian:
  - PASS (Berhasil Sesuai Kriteria) : 139 Test Cases (100.0%)
  - FAIL (Gagal / Ditemukan Bug)    : 0 Test Cases (0.0%)
  - BLOCKED / SKIPPED               : 0 Test Cases (0.0%)

Tingkat Kelulusan (Pass Rate)       : 100.0% [EXCELLENT QUALITY ASSURANCE]
========================================================================================
```

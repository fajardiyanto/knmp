---
name: knmp-project-guide
description: Panduan arsitektur sistem, domain bisnis, alur kerja, dan standarisasi teknis untuk proyek KNMP (Kampung Nelayan Merah Putih) v2. Gunakan skill ini setiap kali tim/AI perlu memahami arsitektur proyek, aturan scoping hak akses user/kontraktor, struktur database PostgreSQL, modul persiapan/pelaksanaan/laporan/pembayaran, atau ingin melanjutkan dan menambah fitur baru pada backend Golang dan frontend React.
---

# KNMP v2 (Kampung Nelayan Merah Putih) — Project & Architecture Guide

Panduan resmi untuk developer, AI agent, dan tim engineering dalam memahami, mengembangkan, dan memelihara aplikasi **Sistem Monitoring dan Pengendalian Proyek KNMP Wilayah Sumatera**.

---

## 1. Domain & Gambaran Proyek

Sistem **KNMP (Kampung Nelayan Merah Putih)** adalah platform terpadu pemantauan dan pengendalian konstruksi infrastruktur nelayan yang mencakup **346 Titik KNMP se-Wilayah Sumatera** (terbagi atas *KNMP Hub* dan *KNMP Penyangga*) dengan **58 Paket Kontrak Pekerjaan Konstruksi**.

### Aktor & Hak Akses (Multi-Role System)
1. **SuperAdmin / Admin PPK / PPK / Pengawas (Management & Oversight)**:
   - Memiliki akses ke **Dashboard Eksekutif & GIS Map 346 Titik** (`/dashboard`, API `/api/v1/knmp/widget`, `/api/v1/knmp/map`).
   - Mengelola master data, kontrak, pembayaran, verifikasi laporan, dan user management.
   - Redirect otomatis saat login: `/dashboard`.
2. **Kontraktor Pelaksana / Operator Lapangan (Field Operations)**:
   - Terisolasi hanya pada titik-titik KNMP yang menjadi lingkup paket kontraknya (`user.knmp_ids`).
   - **Dibatasi (Restricted)** dari Dashboard Eksekutif Makro (`/dashboard` di-guard 403 Forbidden di Frontend & Backend).
   - Fokus operasional: Mengisi data di modul **Pelaksanaan Konstruksi** (`/pelaksanaan`), Persiapan Kontrak, Absensi Pekerja, Issue Lapangan, dan menghasilkan **Laporan Proyek Terpadu**.
   - Redirect otomatis saat login: `/pelaksanaan`.

---

## 2. Tech Stack & Architecture

### Backend: Golang (Clean Architecture)
* **Framework**: [Fiber v2](https://gofiber.io/) — High performance HTTP engine.
* **Database Driver & ORM**: `jmoiron/sqlx` + PostgreSQL (`lib/pq` / `pgx`).
* **Realtime**: WebSocket Chat Hub (`/ws/chat`) + In-App Notification Engine.
* **Auth**: JWT Authentication (`middleware.JWTProtected`) dengan injeksi Fiber Locals:
  - `CtxUserIDKey`: `int64`
  - `CtxUserRolesKey`: `[]string`
  - `CtxUserKnmpIDsKey`: `[]int64` (Untuk otomatisasi query scoping)

#### Pola Layering Backend:
```
HTTP Request ──► Handler (internal/handler/)
                   │ Validasi input, parsing query, cek role
                   ▼
                 Service (internal/service/)
                   │ Logika bisnis, kalkulasi deviasi & progres
                   ▼
                 Repository (internal/repository/postgres/)
                   │ Query SQL eksplisit, filtering p.knmp_id = ANY($N)
                   ▼
                 PostgreSQL Database
```

### Frontend: React + TypeScript + Vite
* **State Management & Data Fetching**: TanStack React Query (`@tanstack/react-query`) dengan auto-invalidation.
* **Styling**: TailwindCSS + Design System responsif (Dark Mode & Light Mode support).
* **Komponen Khusus**:
  - `SearchableSelect`: Dropdown pencarian cerdas multi-kata dengan pengaman null-safe.
  - `ModernDatePicker` & `ModernDateRangePicker`: Date picker kustom anti-overflow.
  - `MonthlyProjectReportModal`: Generator dokumen resmi 14 seksi format cetak A4/A3 (Portrait/Landscape) + Interactive Zoom Control (50% - 200%).
  - `MapComponent`: Leaflet/MapLibre GIS Map clustering 346 titik Sumatera.

---

## 3. Struktur Direktori Proyek

```
knmp-v2/
├── backend/
│   ├── cmd/api/main.go          # Entrypoint server Fiber & routing
│   ├── db/                      # Raw master data & CSV helpers
│   ├── internal/
│   │   ├── config/              # Environment config & database connect
│   │   ├── domain/              # Entity structs (KNMP, Laporan, Kontrak, dll)
│   │   ├── handler/             # Fiber HTTP handlers
│   │   ├── middleware/          # JWT Auth, Role Scoping, Logger, CORS
│   │   ├── repository/          # Interface repository & implementasi PostgreSQL
│   │   └── service/             # Business logic layer
│   └── migrations/              # Skrip SQL schema & seeder data 346 KNMP & 58 Kontrak
├── frontend/
│   ├── src/
│   │   ├── components/ui/       # Shared UI (SearchableSelect, DatePicker, Modal, Card)
│   │   ├── context/             # AuthContext, ThemeContext, AlertContext
│   │   ├── features/            # Modul berbasis fitur:
│   │   │   ├── dashboard/       # GIS Map & Executive Widget
│   │   │   ├── persiapan/       # Kontrak, SPMK, PCM, Mobilisasi
│   │   │   ├── pelaksanaan/     # Kegiatan harian, foto geotagging, cuaca
│   │   │   ├── laporan/         # Laporan berkala & Generator Laporan Proyek Terpadu
│   │   │   ├── pembayaran/      # Tracking termin 25%-100% & Retensi 5%
│   │   │   ├── issue/           # Kendala lapangan & mitigasi K3
│   │   │   └── absensi/         # Absensi tenaga kerja
│   │   └── lib/api-client.ts    # Fetch wrapper & JWT token header injector
└── data/                        # Master Excel Kontrak & CSV Titik KNMP
```

---

## 4. Modul Utama & Alur Bisnis

### A. Dashboard & GIS Map (`/dashboard`)
* Visualisasi pemetaan 346 titik KNMP se-Sumatera dengan koordinat latitude/longitude akurat.
* Filter dinamis berdasarkan Provinsi, Kabupaten, Jenis (Hub / Penyangga), dan Status Progres.
* Ringkasan Realisasi Anggaran vs Realisasi Fisik secara agregat.

### B. Persiapan Proyek (`/persiapan/*`)
* **Kontrak (`/persiapan/kontrak`)**: Master data 58 paket kontrak, nomor SP, SPMK, nama kontraktor, nilai kontrak, serta lampiran dokumen standar.
* **PCM (`/persiapan/pcm`)**: Notulensi rapat Pre-Construction Meeting, absensi rapat, dan kesepakatan teknis.
* **Mobilisasi (`/persiapan/mobilisasi`)**: Tracking mobilisasi alat berat, material utama, dan tim kerja lapangan.

### C. Pelaksanaan Pekerjaan (`/pelaksanaan`)
* Pencatatan log harian/mingguan: kondisi cuaca, jumlah pekerja, kendala, dokumentasi foto progres berkamera geotagging (lat/long).

### D. Laporan Proyek Terpadu (`/laporan`)
* Generator laporan resmi berstandar PPK / Kontraktor:
  - **14 Seksi Terstruktur**: Ringkasan Kontrak, Highlight Bulan Ini, Info Umum, Prestasi Pekerjaan & S-Curve, Tenaga Kerja, Peralatan Utama, Material, Pengujian Mutu, Rekapitulasi Cuaca, K3 Konstruksi, Rekap Pembayaran Termin, Dokumentasi Foto Progres, Management Summary, dan Lembar Pengesahan (Tanda Tangan PPK, Pengawas, Kontraktor).
  - **Kontrol Cetak Cerdas**: Toggle Portrait / Landscape, Page Zoom (50%-200%), dan Inline Editor Mode untuk mengubah teks narasi sebelum dicetak ke PDF/kertas.

### E. Termin Pembayaran (`/pembayaran/*`)
* Realisasi keuangan bertahap: Termin 1 (25%), Termin 2 (25%), Termin 3 (25%), Termin 4 (20%), dan Retensi Pemeliharaan (5%).

---

## 5. Panduan Menambah Fitur Baru (Development Workflow)

Saat tim ingin menambahkan entitas atau fitur baru, ikuti SOP berikut:

### Langkah 1 — Backend (Golang)
1. **Definisikan Domain**: Tambahkan struct di `backend/internal/domain/<fitur>.go`.
2. **Repository Layer**:
   - Definisikan method di `backend/internal/repository/repository.go`.
   - Tulis SQL query di `backend/internal/repository/postgres/<fitur>_repo.go`.
   - **Wajib**: Terapkan isolasi `filter.UserKnmpIDs` jika fitur berhubungan dengan data lapangan agar kontraktor tidak melihat data kontraktor lain.
3. **Service Layer**: Implementasikan logika validasi di `backend/internal/service/<fitur>_service.go`.
4. **Handler & Route**: Buat endpoint di `backend/internal/handler/<fitur>_handler.go` dan daftarkan pada routing di `backend/cmd/api/main.go`.

### Langkah 2 — Frontend (React)
1. Buat folder baru di `frontend/src/features/<fitur>/`:
   - `types.ts`: Interface TypeScript yang sinkron dengan domain backend.
   - `api.ts`: Fungsi pemanggilan endpoint via `apiFetch`.
   - `components/<Fitur>Page.tsx`: Komponen halaman.
2. Gunakan `SearchableSelect`, `ModernDatePicker`, dan badge status yang seragam dengan desain sistem utama.
3. Daftarkan rute di `frontend/src/routes.tsx` (atau `App.tsx`) dengan pembatasan role guard yang sesuai.

---

## 6. Command & Script Cepat

```bash
# Menjalankan Backend
cd backend
go run ./cmd/api/

# Menjalankan Frontend
cd frontend
npm run dev

# Memvalidasi Build & TypeScript
cd frontend
npm run build
```

---
*Dokumen ini dirancang sebagai panduan dasar operasional sistem KNMP v2. Selalu patuhi Clean Architecture dan prinsip enkapsulasi hak akses multi-role pada setiap pembaruan kode.*

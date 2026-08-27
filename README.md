# SIMANDOR 360 — KNMP V2

Platform terpadu untuk monitoring, pengawasan konstruksi, verifikasi dokumen berjenjang, dan komunikasi real-time Kawasan Nelayan Maju & Pesisir (KNMP).

> **Enterprise-Grade Monitoring System** yang dibangun dengan arsitektur bersih, performa tinggi, dan standar keamanan terstandarisasi.

---

## 📌 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
- [Modul & Fitur Utama](#-modul--fitur-utama)
- [Struktur Direktori](#-struktur-direktori)
- [Panduan Instalasi & Menjalankan](#-panduan-instalasi--menjalankan)
  - [1. Menggunakan Docker Compose (Direkomendasikan)](#1-menggunakan-docker-compose-direkomendasikan)
  - [2. Menjalankan Deployment Remote Database](#2-menjalankan-deployment-remote-database)
  - [3. Menjalankan Secara Lokal (Development Manual)](#3-menjalankan-secara-lokal-development-manual)
- [Default Akun & Autentikasi](#-default-akun--autentikasi)
- [Observabilitas & Tracing (Jaeger)](#-observabilitas--tracing-jaeger)
- [API & Endpoint Utama](#-api--endpoint-utama)

---

## 🎯 Tentang Proyek

**KNMP V2 (SIMANDOR 360)** adalah sistem informasi berbasis web yang dirancang untuk mengelola dan memonitor seluruh siklus hidup proyek pembangunan kawasan pesisir dan nelayan, mulai dari tahap persiapan kontrak, mobilisasi lapangan, pelaksanaan fisik harian/mingguan, absensi geolokasi pekerja, pengawasan isu teknis, hingga pencairan termin pembayaran dan serah terima (PHO/FHO).

Sistem ini dilengkapi dengan integrasi **Chat & Messaging Real-time** melalui WebSocket dan observabilitas terdistribusi menggunakan **OpenTelemetry & Jaeger**.

---

## ⚡ Arsitektur & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)                  │
│   TailwindCSS • TanStack Query • Leaflet • WebSocket Client │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / WebSocket (Reverse Proxy)
┌──────────────────────────────▼──────────────────────────────┐
│                    Nginx Gateway / Router                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                Backend API (Golang / Fiber v2)              │
│       Clean Architecture • JWT Auth • WebSocket Hub        │
│                OpenTelemetry Tracer Provider                │
└──────────────┬───────────────┬───────────────┬──────────────┘
               │               │               │
     ┌─────────▼────────┐ ┌────▼────┐ ┌────────▼────────┐
     │  PostgreSQL 16   │ │  MinIO  │ │  Jaeger Tracing │
     │ (Relational DB)  │ │   (S3)  │ │ (OTLP gRPC/UI)  │
     └──────────────────┘ └─────────┘ └─────────────────┘
```

| Layer | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Backend** | Golang 1.24+ / Fiber v2 | RESTful API berkinerja tinggi dengan arsitektur Clean Architecture |
| **Database** | PostgreSQL 16 | Basis data relasional dengan migrasi otomatis & indeks teroptimasi |
| **Frontend** | React 18 + TypeScript | UI modern, responsif, dan berbasis komponen modular |
| **Styling** | TailwindCSS | Desain bersih (*impeccable craft*) tanpa font bold berlebih |
| **State & API** | TanStack React Query | Manajemen caching, sinkronisasi server-state, dan safe null handlers |
| **Real-time** | WebSocket (Fiber / Native) | Komunikasi instan 1-to-1 dan group chat dengan read receipts |
| **Storage** | MinIO / S3 Storage | Penyimpanan berkas dan dokumen terdistribusi |
| **Tracing** | OpenTelemetry + Jaeger | Tracing latensi end-to-end dan log request otomatis |
| **Container** | Docker & Docker Compose | Multi-stage image build yang ringan dan terisolasi |

---

## 🚀 Modul & Fitur Utama

### 1. Dashboard Eksekutif & Peta Sebaran Interaktif
- **GIS Map View**: Visualisasi 346 titik sebaran lokasi KNMP di seluruh pesisir Indonesia.
- **Metric Cards**: Ringkasan status proyek (*Aktif, On Track, Perlu Perhatian, Kritis, Pemeliharaan*).
- **Progres Fisik & Anggaran**: Diagram komparasi rencana vs realisasi.

### 2. Manajemen Siklus Hidup Program (Fase Proyek)
- **Persiapan Kontrak (Contract Readiness)**: Manajemen dokumen lelang, SPK, SPMK, dan jaminan.
- **Pre-Construction Meeting (PCM)**: Berita acara, matriks kesiapan teknis, dan verifikasi dokumen.
- **Mobilization Report**: Pelaporan pengiriman alat berat, material, dan tim tenaga kerja.
- **Pelaksanaan Konstruksi**: Pencatatan progres mingguan, foto fisik 0%, 50%, 100%, dan cuaca.
- **Laporan Berkala**: Laporan mingguan dan bulanan terstruktur.
- **PHO, Pemeliharaan & FHO**: Serah terima pertama, masa retensi/garansi, dan serah terima akhir.

### 3. Keuangan & Termin Pembayaran
- **Ringkasan Anggaran**: Monitoring total pagu, realisasi anggaran, dan sisa dana per kontrak.
- **Termin Pembayaran**: Tracking milestone pembayaran (Uang Muka, Termin I - IV, Retensi).

### 4. Monitoring Lapangan (Absensi & Isu)
- **Absensi Berbasis Lokasi (GPS)**: Pencatatan kehadiran mandor dan pekerja lapangan dengan koordinat geografis.
- **Issue Tracker**: Pencatatan kendala teknis/sosial di lapangan beserta tingkat keparahan (*Rendah, Sedang, Tinggi*).

### 5. Verifikasi Dokumen Berjenjang
- Alur verifikasi multi-tier yang ketat:
  $$\text{Kontraktor (Upload)} \longrightarrow \text{Pengawas Lapangan (Verifikasi)} \longrightarrow \text{Wakil PPK / Admin PPK (Approval Final)}$$

### 6. User Chat & Messaging (Real-time)
- **Personal Chat (1-to-1)**: Percakapan langsung antar pegawai/tim.
- **Group Chat**: Ruang diskusi multi-pengguna berdasarkan wilayah atau tim kerja.
- **Live WebSocket Hub**: Pengiriman instan, status online, penanda terbaca (*read receipts*), dan badge counter pada sidebar.

---

## 📁 Struktur Direktori

```text
knmp-v2/
├── backend/                        # Golang Backend Service
│   ├── cmd/api/main.go            # Entrypoint API Server & Auto-migrator
│   ├── internal/
│   │   ├── config/                # Konfigurasi Environment & Flags
│   │   ├── domain/                # Entity Models, DTO, dan Enums
│   │   ├── handler/               # Fiber HTTP Handlers & WebSocket Upgrader
│   │   ├── middleware/            # JWT Auth, OTel Tracer, Logger, CORS
│   │   ├── repository/postgres/   # Data Access Layer & Migrations Runner
│   │   ├── router/                # Route Registrations
│   │   ├── service/               # Business Logic & Chat Hub Manager
│   │   ├── storage/               # Local Disk & S3 Storage Drivers
│   │   └── telemetry/             # OpenTelemetry & Jaeger Exporter Setup
│   ├── migrations/                # SQL Migrations (.up.sql)
│   ├── Dockerfile                 # Multi-stage Golang Build
│   └── go.mod
│
├── frontend/                       # React TypeScript Frontend
│   ├── src/
│   │   ├── app/                   # App Router & Providers
│   │   ├── components/layout/     # Sidebar, Navbar, dan Main Layout
│   │   ├── features/              # Feature-based Modules
│   │   │   ├── absensi/           # Modul Absensi Lapangan
│   │   │   ├── auth/              # Otentikasi & Session
│   │   │   ├── chat/              # Chat Workspace & WebSocket Hooks
│   │   │   ├── dashboard/         # Dashboard & Leaflet Map
│   │   │   ├── fase/              # PHO, FHO, Pemeliharaan
│   │   │   ├── issue/             # Kendala Lapangan
│   │   │   ├── knmp/              # Master KNMP, Wilayah & Periode
│   │   │   ├── laporan/           # Pelaporan Mingguan/Bulanan
│   │   │   ├── pembayaran/        # Anggaran & Termin Pembayaran
│   │   │   ├── pelaksanaan/       # Pelaksanaan Konstruksi
│   │   │   ├── persiapan/         # Kontrak, PCM, Lapangan
│   │   │   └── users/             # Manajemen User & Role
│   │   └── lib/                   # API Client Fetch & Helpers
│   ├── nginx.conf                 # Nginx Reverse Proxy Config
│   ├── Dockerfile                 # Multi-stage Node/Nginx Build
│   └── package.json
│
├── docker-compose.yml             # Local Full-Stack Deployment (DB Lokal)
├── docker-compose.remote.yml      # Deployment ke Remote Database
└── README.md                      # Dokumentasi Proyek
```

---

## 🛠️ Panduan Instalasi & Menjalankan

### 1. Menggunakan Docker Compose (Direkomendasikan)

Untuk menjalankan seluruh stack (Frontend, Backend, PostgreSQL Lokal, MinIO, Jaeger) secara terisolasi:

```bash
# Jalankan seluruh stack
docker compose up -d --build

# Periksa status container
docker compose ps
```

Layanan akan aktif pada:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **Jaeger UI**: [http://localhost:16686](http://localhost:16686)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001)

---

### 2. Menjalankan Deployment Remote Database

Jika ingin menghubungkan aplikasi ke server database PostgreSQL terpisah/remote:

```bash
# Jalankan container khusus remote stack
docker compose -f docker-compose.remote.yml up -d --build
```

Layanan remote stack akan aktif pada:
- **Frontend App**: [http://localhost:5174](http://localhost:5174)
- **Backend API**: [http://localhost:8088](http://localhost:8088)
- **MinIO Console**: [http://localhost:9003](http://localhost:9003)

---

### 3. Menjalankan Secara Lokal (Development Manual)

#### Prasyarat:
- Go 1.24+
- Node.js 20+ & npm
- PostgreSQL 16 aktif

#### A. Backend Setup:
```bash
cd backend
cp .env.example .env
# Sesuaikan kredensial DB pada .env

# Jalankan backend API
go run ./cmd/api
```

#### B. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Default Akun & Autentikasi

Database telah dilengkapi dengan data *seeder* default untuk memudahkan pengujian berbagai level hak akses:

| Peran (Role) | Email | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@gmail.com` | `password` | Akses penuh seluruh sistem, user management, dan bypass verifikasi |
| **Admin PPK** | `admin_ppk@gmail.com` | `password` | Persetujuan final dokumen, pembayaran, dan manajemen master data |
| **Wakil PPK** | `wakil_ppk@gmail.com` | `password` | Verifikasi dokumen tingkat 2 dan persetujuan laporan lapangan |
| **Pengawas Lapangan** | `pengawas@gmail.com` | `password` | Verifikasi dokumen tingkat 1, input absensi, dan monitoring progres |
| **Kontraktor** | `kontraktor@gmail.com` | `password` | Upload dokumen pelaksanaan, laporan berkala, dan penagihan termin |

---

## 📊 Observabilitas & Tracing (Jaeger)

Backend KNMP V2 terintegrasi penuh dengan **OpenTelemetry**:
- Setiap request HTTP dan query database secara otomatis menghasilkan span trace terdistribusi.
- Akses UI Jaeger di `http://localhost:16686` untuk melihat *waterfall latency*, status HTTP, serta error stack trace secara real-time.

---

## 📡 API & Endpoint Utama

Semua endpoint dilindungi oleh JWT Middleware (kecuali `/login` dan `/health`).

```text
POST   /api/v1/auth/login                # Login & pembuatan token JWT
GET    /api/v1/auth/me                   # Profil & hak akses pengguna aktif

# Master & Peta
GET    /api/v1/knmp/map                  # Data geo-titik sebaran untuk peta
GET    /api/v1/knmp/widget               # Ringkasan metrik dashboard

# Program & Pelaksanaan
GET    /api/v1/persiapan                 # List persiapan kontrak & lapangan
GET    /api/v1/pcm                       # List data Pre-Construction Meeting
GET    /api/v1/pelaksanaan               # List progres pelaksanaan konstruksi
GET    /api/v1/laporan                   # List laporan berkala

# Chat & WebSocket
GET    /ws/chat?token={jwt_token}        # Real-time WebSocket connection
GET    /api/v1/chat/conversations        # List percakapan pengguna
GET    /api/v1/chat/unread-count         # Total unread messages counter
POST   /api/v1/chat/conversations        # Mulai chat personal (1-to-1)
POST   /api/v1/chat/groups               # Buat grup diskusi baru
```

---

## 📄 Lisensi & Hak Cipta

© 2026 **SIMANDOR 360 / KNMP V2**. Hak cipta dilindungi. Dikembangkan untuk standardisasi pengawasan dan pemantauan infrastruktur pesisir.

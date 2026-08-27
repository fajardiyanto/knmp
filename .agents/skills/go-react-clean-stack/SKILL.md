---
name: go-react-clean-stack
description: Standar tech stack dan struktur folder untuk membangun aplikasi/sistem full-stack — backend Golang (clean architecture) + frontend React (TypeScript, feature-based) + koneksi database PostgreSQL. Gunakan skill ini setiap kali diminta membuat, scaffold, atau mendesain aplikasi web/dashboard/sistem monitoring (termasuk sistem monitoring KNMP), API, atau backend+frontend dari nol — terutama saat pengguna menyebut "golang", "go", "react", "connect ke db", "database", atau minta "struktur folder yang clean/rapi". Pastikan struktur folder, layering (handler/service/repository), dan konvensi penamaan mengikuti referensi di skill ini alih-alih pola generik/campur aduk.
---

# Go + React Clean Stack

Skill ini adalah standar teknis default untuk semua proyek full-stack yang
diminta pengguna: **backend Golang** dengan clean architecture, **frontend
React (TypeScript, Vite)** dengan struktur berbasis fitur, dan **koneksi
database PostgreSQL** lewat repository layer — bukan ORM magic atau query
tersebar di mana-mana.

## Kapan pakai skill ini

- Diminta membuat/scaffold aplikasi web, dashboard, sistem monitoring, atau API dari nol.
- Pengguna menyebut Golang/Go, React, database, atau "struktur folder yang clean/rapi".
- Melanjutkan pengembangan sistem yang desainnya sudah dibuat sebelumnya (mis. dokumen desain sistem monitoring rantai dingin KNMP) menjadi kode nyata.
- Diminta menambah fitur/modul baru ke proyek yang sudah pakai stack ini — tetap ikuti pola layering & folder yang sama, jangan menyimpang.

## Prinsip inti

1. **Backend Go pakai clean architecture**: `handler → service → repository → db`, tiap lapisan tidak boleh loncat (handler tidak boleh query DB langsung, dsb). Detail lengkap: `references/backend-golang.md`.
2. **Frontend React berbasis fitur**, bukan berbasis tipe file. Semua panggilan API lewat `features/<fitur>/api.ts`, state server pakai React Query. Detail lengkap: `references/frontend-react.md`.
3. **Koneksi DB eksplisit**: `sqlx` + driver `pgx` ke PostgreSQL, connection pool diatur manual, migration pakai `golang-migrate` (bukan auto-migrate ORM). Environment variables untuk semua kredensial, tidak pernah hardcode.
4. **Monorepo dengan folder terpisah** (`backend/`, `frontend/`) dan `docker-compose.yml` untuk dev lokal. Detail lengkap: `references/project-setup.md`.

## Cara pakai

1. Saat mulai scaffold proyek baru, baca ketiga file referensi dulu sebelum menulis kode apa pun.
2. Buat struktur folder persis seperti di referensi (boleh sesuaikan nama modul/fitur dengan domain proyek, tapi jangan ubah pola layering-nya).
3. Setiap tambah entitas/fitur baru: buat set lengkap `domain` → `repository` (interface + implementasi) → `service` → `handler` di backend, dan `features/<fitur>/` (api, types, hooks, components) di frontend.
4. Sebelum menyatakan selesai, cek daftar "Checklist clean folder structure" di `references/project-setup.md`.
5. Kalau proyek juga butuh identitas visual/warna dan skill `daybreak-design-system` tersedia, pakai token dari sana untuk styling frontend alih-alih warna default Tailwind.

## Referensi

- `references/backend-golang.md` — struktur folder Go, aturan layering, contoh kode tiap lapisan, koneksi DB, migration.
- `references/frontend-react.md` — struktur folder React berbasis fitur, aturan data fetching, contoh kode tiap layer.
- `references/project-setup.md` — struktur monorepo gabungan, docker-compose untuk dev lokal, checklist kebersihan struktur.
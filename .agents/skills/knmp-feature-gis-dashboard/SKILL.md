---
name: knmp-feature-gis-dashboard
description: Panduan teknis & domain untuk modul Dashboard Eksekutif & GIS Interactive Map KNMP v2 (Pemetaan 346 Titik Se-Sumatera, Marker Clustering, Filter Wilayah Hub/Penyangga, dan Widget Realtime Progres). Gunakan skill ini saat memodifikasi peta spasial, widget dashboard, metrik agregat, atau integrasi koordinat latitude/longitude titik nelayan.
---

# KNMP Feature: Dashboard Eksekutif & GIS Interactive Map

Modul ini adalah pusat komando visual (*executive control center*) yang menampilkan pemetaan geografis 346 titik Kampung Nelayan Merah Putih di seluruh pulau Sumatera beserta ringkasan progres fisik dan penyerapan anggaran secara realtime.

---

## 1. Arsitektur Data & Model Backend

### Tabel Database
* `knmps`: Menyimpan 346 master titik lokasi KNMP di Sumatera.
  - `name` (VARCHAR): Nama titik (misal: "KNMP Marok Tua", "KNMP Kelombok", "KNMP Kuala Langsa").
  - `jenis_knmp` (VARCHAR): `'hub'` (Pusat Sentra Nelayan) atau `'penyangga'` (Desa Penyangga).
  - `lat` & `long` (VARCHAR): Titik koordinat GPS lintang dan bujur.
  - `status` (VARCHAR): `'on_track'` | `'delayed'` | `'critical'`.
  - `regional_name`, `province_name`, `regency_name`, `district_name`, `sub_district_name`: Hirarki wilayah administratif.

### API Endpoints
* `GET /api/v1/knmp` — List titik KNMP dengan pencarian & filter wilayah.
* `GET /api/v1/knmp/map` — GeoJSON / data titik koordinat untuk rendering layer peta.
* `GET /api/v1/knmp/widget` — Agregasi metrik: total titik, total hub vs penyangga, rata-rata progres fisik, total deviasi, dan total serapan anggaran.

---

## 2. Struktur Frontend (`src/features/dashboard/`)

* `components/DashboardPage.tsx`: Halaman dashboard utama.
* `components/MapComponent.tsx`: Komponen peta GIS interaktif:
  - Menggunakan Leaflet / MapLibre dengan custom icon marker (Marker Biru untuk *Hub*, Marker Cyan untuk *Penyangga*).
  - **Marker Cluster**: Pengelompokan titik berdekatan saat di-zoom out.
  - **Popup Interaktif**: Menampilkan nama KNMP, kabupaten, kontraktor pelaksana, progres fisik %, status RAG, dan tombol pintas ke detail proyek.
* `components/DashboardWidgets.tsx`: Kartu-kartu metrik eksekutif, status RAG, dan kurva-S makro agregat.

---

## 3. SOP Pengelolaan Peta Spasial
1. **Validasi Koordinat**:
   - Seluruh latitude dan longitude di Sumatera berada pada rentang Lintang: `-6.0° s/d 6.0°` dan Bujur: `95.0° s/d 109.0°`.
2. **Sinkronisasi Marker**:
   - Filter dropdown pada toolbar dashboard (misal memilih Provinsi "Kepulauan Riau" atau Kabupaten "Lingga") secara otomatis memicu *fly-to bounding box* pada peta dan memfilter marker titik yang aktif.

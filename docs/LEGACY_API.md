# Legacy & Target API Specification — KNMP V2

All KNMP V2 API endpoints are exposed under `/api/v1` and use standard JSON response envelopes:
- Success: `{ "data": ... }` or `{ "data": [...], "meta": { "total": ..., "page": ..., "per_page": ... } }`
- Failure: `{ "error": "Human readable message", "code": "ERROR_CODE", "errors": [...] }`

---

## 1. Authentication & User Profile

### `POST /api/v1/auth/login`
- **Auth**: Public (Guest)
- **Request Body**:
  ```json
  {
    "email": "kontraktor@gmail.com",
    "password": "kontraktor"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
      "user": {
        "id": 1,
        "name": "Kontraktor",
        "email": "kontraktor@gmail.com",
        "roles": ["kontraktor"],
        "permissions": ["laporan_create", "laporan_read", ...]
      }
    }
  }
  ```

### `GET /api/v1/user`
- **Auth**: Bearer Token
- **Response `200 OK`**: Current authenticated user profile with assigned KNMPs and permissions.

### `DELETE /api/v1/auth/logout`
- **Auth**: Bearer Token
- **Response `200 OK`**: `{ "data": { "message": "Logout successful" } }`

---

## 2. Geographic & Master Lookups

### `GET /api/v1/geo/regionals`
### `GET /api/v1/geo/regionals/:regionalId/provinces`
### `GET /api/v1/geo/provinces/:provinceId/regencies`
### `GET /api/v1/geo/regencies/:regencyId/districts`
### `GET /api/v1/geo/districts/:districtId/sub-districts`
- **Auth**: Bearer Token
- **Query Params**: `search` (optional)
- **Response `200 OK`**: Returns list of entities `[{ "id": 1, "name": "..." }]`.

### `GET /api/v1/jenis-bangunan?is_active=1`
- **Auth**: Bearer Token
- **Response `200 OK`**: Active infrastructure types for progress reporting.

---

## 3. KNMP Master & Dashboard

### `GET /api/v1/knmp`
- **Query Params**: `search`, `regional_id`, `province_id`, `jenis_knmp`, `page`, `per_page`
- **Response `200 OK`**: Paginated list of KNMP locations.

### `GET /api/v1/knmp/widget`
- **Response `200 OK`**: KPI counts for Dashboard (total locations, total active, breakdown by regional).

### `GET /api/v1/knmp/map`
- **Response `200 OK`**: GeoJSON / point list with `lat`, `long`, `name`, `status`, and latest deviation for interactive map.

---

## 4. Mobile Upload Endpoints (High Priority)

### `POST /api/v1/mobile/absensi`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `pelaksanaan_id`: integer (required)
  - `tipe_absensi`: `hadir` | `pulang` (required)
  - `lat`: string (optional)
  - `long`: string (optional)
  - `photo`: file binary (`jpg`, `jpeg`, `png`, `webp`, `heic`, `heif`, max 20MB)
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "id": 1,
      "pelaksanaan_id": 1,
      "tipe_absensi": "hadir",
      "recorded_at": "2026-07-24T10:00:00+07:00",
      "status": "menunggu_pengawas",
      "documents": [
        {
          "id": 10,
          "category": "foto_absensi",
          "file_url": "https://..."
        }
      ]
    }
  }
  ```

### `POST /api/v1/mobile/laporan`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `pelaksanaan_id`: integer (required)
  - `nama`: string (required)
  - `tanggal`: string `YYYY-MM-DD` (required)
  - `jenis_laporan`: `harian` | `mingguan` | `bulanan` (required)
  - `keberapa`: integer (conditional, required if weekly/monthly)
  - `cuaca`: `cerah` | `berawan` | `mendung` | `hujan` | `badai` | `lainnya` (required)
  - `jumlah_tenaga_kerja`: integer (required)
  - `lat`: string, `long`: string (optional)
  - `keterangan`: string (optional)
  - `jenis_bangunan_details[0][jenis_bangunan_id]`: integer
  - `jenis_bangunan_details[0][rencana_progres_fisik]`: float
  - `jenis_bangunan_details[0][realisasi_progres_fisik]`: float
  - `jenis_bangunan_details[0][photos][]`: file[] (1 to 5 photos)
- **Response `201 Created`**: Complete report object with detailed building progress and attached document URLs.

### `POST /api/v1/mobile/issue`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `knmp_id`: integer (required)
  - `kategori_issue`: `K3` | `mutu` | `cuaca` | `material` (required)
  - `tingkat`: `ringan` | `sedang` | `kritis` | `lainnya` (required)
  - `uraian_masalah`: string (required)
  - `photos[]`: file[] (1 to 5 photos)
- **Response `201 Created`**: Created issue record with attached photo documents.

---

## 5. Verification Management Endpoints

### `PATCH /api/v1/laporan/:id/verify`
### `PATCH /api/v1/absensi/:id/verify`
### `PATCH /api/v1/issue/:id/verify`
### `PATCH /api/v1/documents/:id/verify`
- **Request Body**:
  ```json
  {
    "status": "approved", // or "rejected"
    "note": "Catatan hasil peninjauan lapangan"
  }
  ```
- **Response `200 OK`**: Updated entity with current verification status and audit record.

### `PATCH /api/v1/laporan/:id/unverify`
### `PATCH /api/v1/absensi/:id/unverify`
### `PATCH /api/v1/issue/:id/unverify`
- **Request Body**:
  ```json
  {
    "note": "Alasan pembatalan verifikasi"
  }
  ```
- **Response `200 OK`**: Reverts status to previous stage with audit trail.

---

## 6. Financial & Disbursement Endpoints

### `GET /api/v1/pembayaran/summary`
- **Response `200 OK`**: Total budgeted amount vs. total disbursed realization.

### `GET /api/v1/pembayaran/termin`
- **Response `200 OK`**: Progress and disbursement distribution grouped by termin.

### `GET /api/v1/pembayaran`
### `POST /api/v1/pembayaran`
### `GET /api/v1/pembayaran/:id`
### `PUT /api/v1/pembayaran/:id`
### `DELETE /api/v1/pembayaran/:id`

---

## 7. Document Handling Endpoints

### `GET /api/v1/documents/:id`
### `GET /api/v1/documents/:id/download`
### `POST /api/v1/documents`
### `PUT /api/v1/documents/:id`
### `DELETE /api/v1/documents/:id`
- **Authorization**: Enforces strict resource ownership and role permissions before streaming or presigning download URLs.

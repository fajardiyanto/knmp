# BOQ & Weekly Progress Control

Fitur ini menambahkan menu `BOQ Mingguan` untuk mengontrol klaim progres kontraktor terhadap progres yang sudah diverifikasi pengawas dan evidence yang valid.

## Tujuan

BOQ Weekly Control dibuat untuk menjawab pola temuan pemantauan Itjen pada dokumen:

`data/signed__Hasil_Pemantauan_Pekerjaan_Konstruksi_Pembangunan_Kampung_Nelayan_Merah_Putih_Desa_Pematang_Sei_Baru_Kabupaten_Asahan_Provinsi_Sumatera_Utara_20260902062128.pdf`

Contoh seed Asahan:

- Klaim kontraktor: `93,39%`
- Hasil cek fisik / verified progress: `90,13%`
- Gap: `3,26%`
- Estimasi audit exposure: `Rp328.400.000`

## Prinsip Kontrol

Progress yang diakui sistem bukan sekadar klaim kontraktor.

`PROGRESS = VERIFIED QUANTITY x APPROVED BOQ + VALID EVIDENCE`

Jika evidence belum lengkap, item BOQ tetap bisa dicatat, tetapi diberi status `partial` atau `missing` dan masuk indikator risiko.

## Backend

Migration:

- `backend/migrations/000012_create_weekly_boq_control.up.sql`
- `backend/migrations/000012_create_weekly_boq_control.down.sql`

Tabel:

- `weekly_boq_controls`
- `weekly_boq_items`

API:

- `GET /api/v1/boq-weekly`
- `GET /api/v1/boq-weekly/stats`
- `GET /api/v1/boq-weekly/:id`
- `POST /api/v1/boq-weekly`
- `PATCH /api/v1/boq-weekly/:id/status`
- `DELETE /api/v1/boq-weekly/:id`

Integrasi AI Scan:

- Dokumen dari web, Telegram, atau WhatsApp yang dianalisis sebagai `target_module=boq` dan valid ke titik KNMP otomatis membuat draft control BOQ.
- Draft dibuat dengan status `open`.
- Field utama yang dipakai: `contractor_claim_pct`, `supervisor_verified_pct`, `evidence_supported_pct`, `audit_exposure_value`, dan `boq_items`.
- Jika AI hanya menemukan angka progres umum, backend tetap membuat satu item control point agar gap klaim vs verified tidak hilang dari workflow.

Hak akses:

- `boq_read`
- `boq_create`
- `boq_update`
- `boq_delete`

Scoping:

- Super admin dapat melihat semua titik.
- User non-super hanya melihat data pada `user_knmp_ids`.
- User non-super tanpa assignment titik tidak menerima data global.

## Frontend

Route:

- `/boq-weekly`

Menu:

- Sidebar `PROGRAM` -> `BOQ Mingguan`

Tampilan memuat:

- Total kontrol BOQ
- Rata-rata claim kontraktor
- Rata-rata verified progress
- Total item kritis
- Total audit exposure
- Detail item BOQ: plan, claim, verified, evidence-supported progress, deviasi, status bukti, dan risiko.

## Test

Unit test:

- `backend/internal/service/boq_service_test.go`

Matriks test case:

- `docs/TEST_CASES_KNMP_V2.md` modul `TC-BOQ-001` sampai `TC-BOQ-007`

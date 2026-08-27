# Business Rules Catalog — KNMP V2

This catalog documents all business rules extracted from legacy PHP controllers, Eloquent models, validation request classes, database migrations, and workflow behaviors.

---

## 1. Explicit Business Rules [EXPLICIT]

These rules are explicitly enforced in the existing codebase:

### BR-EXP-01: Two-Step Verification Sequence
1. A new `Laporan`, `Absensi`, `Issue`, or `Document` record starts with verification status `menunggu_pengawas` (or `null`/`''`).
2. Only users possessing the `*_verify_pengawas` permission can approve or reject the record at Step 1 (`pengawas`).
3. If Pengawas approves, status changes to `menunggu_wakil_ppk`. If Pengawas rejects, status changes to `ditolak_pengawas`.
4. Step 2 (`wakil_ppk`) verification can ONLY occur if the current status is `menunggu_wakil_ppk`. Users with `*_verify_wakil_ppk` permission can approve (status becomes `terverifikasi`) or reject (status becomes `ditolak_wakil_ppk`).
5. Only one verification row per step can be active (`is_current = true`).

### BR-EXP-02: Verification Unverify Rules
1. A Pengawas can unverify a record only if they previously submitted a verification step and status is in `[ditolak_pengawas, menunggu_wakil_ppk, ditolak_wakil_ppk, terverifikasi]`. Unverifying reverts status to `menunggu_pengawas`.
2. A Wakil PPK can unverify a record only if they previously submitted a verification step and status is in `[ditolak_wakil_ppk, terverifikasi]`. Unverifying reverts status to `menunggu_wakil_ppk`.
3. When unverifying, the previous verification record is marked `is_current = false`, and a new audit record with `status = unverified` is appended.

### BR-EXP-03: Auto-Reset on Contractor Updates
1. If a record in status `ditolak_pengawas`, `menunggu_wakil_ppk`, `ditolak_wakil_ppk`, or `terverifikasi` is edited/updated, the verification state is automatically reset to `menunggu_pengawas`.
2. All current verification rows are marked `is_current = false, superseded_at = NOW()`.

### BR-EXP-04: Deviation Calculation
1. For every building detail in a physical report (`LaporanJenisBangunan`):
   $$\text{deviasi} = \text{realisasi\_progres\_fisik} - \text{rencana\_progres\_fisik}$$
2. If realisasi is 39.0% and rencana is 40.5%, deviasi is $-1.5\%$.

### BR-EXP-05: Mobile Upload File Constraints
1. Accepted image MIME types / extensions: `jpg`, `jpeg`, `png`, `webp`, `heic`, `heif`.
2. Accepted document extensions: `pdf`, `doc`, `docx`, `xls`, `xlsx`.
3. Maximum file size per photo / document: 20 MB.
4. For mobile laporan uploads: minimum 1 photo, maximum 5 photos per building detail.
5. For mobile absensi uploads: exactly 1 photo (selfie/proof of attendance).
6. For mobile issue uploads: minimum 1 photo, maximum 5 photos.

### BR-EXP-06: Geographic Cascade Constraints
1. Geographic hierarchy must maintain strict referential integrity:
   $$\text{Regional} \leftarrow \text{Province} \leftarrow \text{Regency} \leftarrow \text{District} \leftarrow \text{SubDistrict}$$
2. A KNMP location requires valid foreign keys across all 5 levels.

### BR-EXP-07: Phase Document Completion Sets
1. **Persiapan Kontrak** requires 11 standard contract forms (`form_01_spmk` through `form_11_surat_permohonan_pcm`).
2. **PCM** requires 2 standard forms (`form_12_surat_undangan_pcm`, `form_13_ba_pcm`).
3. **Persiapan Lapangan** requires 3 standard forms (`form_13_ba_pcm`, `form_14_ba_mc_0`, `form_15_laporan_mobilisasi`).
4. **Pembayaran** requires 5 financial forms (`form_19a_bapp`, `form_23_rpd`, `form_20_permohonan_pembayaran`, `form_21_kwitansi`, `form_22_ba_pembayaran`).

---

## 2. Derived Business Rules [DERIVED]

These rules are inferred from UI patterns, database scopes, and data aggregation logic:

### BR-DER-01: Pelaksanaan Milestone Progress
- A project's execution phase calculates upload milestone progress based on uploaded categories:
  - 3 completed sections = 90% (Pekerjaan Kritis)
  - 2 completed sections = 75% (Pengendalian Progress)
  - 1 completed section = 50% (Progress & Mutu Awal)
  - 0 completed sections = 0% (Belum Upload)

### BR-DER-02: Overall KNMP Health Status
- A KNMP location's operational status is determined by aggregating the latest report deviations and pending critical issues:
  - If latest average deviation $\ge 0\% \implies$ Green / On Track.
  - If $-5\% \le \text{deviation} < 0\% \implies$ Yellow / Minor Delay.
  - If $\text{deviation} < -5\%$ OR active critical issues exist $\implies$ Red / Delayed / Critical.

### BR-DER-03: User Scope & Tenancy
- Users assigned to specific KNMP locations via `user_knmps` are restricted to viewing and reporting on those locations.
- Superadmins and central Admin PPK users possess global visibility across all locations.

---

## 3. Assumptions [ASSUMPTION]

1. **Password Migration**: Legacy users have passwords hashed with Bcrypt. Go backend will support Bcrypt password verification seamlessly during login so existing accounts remain valid.
2. **Coordinates Format**: GPS latitudes and longitudes are stored as decimal strings/floats within standard Indonesian boundaries (Latitude $-11.0$ to $+6.0$, Longitude $95.0$ to $141.0$).
3. **Timezone**: All timestamps and date-sensitive operations default to Western Indonesia Time (WIB / `Asia/Jakarta`, UTC+7).

---

## 4. Open / TBD Items [TBD]

1. **Push Notifications**: Mobile notifications for issue alerts and verification requests are currently logged; integration with Firebase Cloud Messaging (FCM) or WebSocket in V2 is to be confirmed.
2. **Offline Mobile Sync**: Mobile app behavior when field connectivity is lost (local SQLite buffer sync vs. direct retry).

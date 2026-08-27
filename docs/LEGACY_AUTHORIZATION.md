# Legacy & Target Authorization (RBAC) Specification

This document maps all user roles, granular permissions, and security enforcement mechanisms in KNMP V2.

---

## 1. Role Definitions

| Role | Target Persona | Scope & Responsibility |
| :--- | :--- | :--- |
| **`superadmin`** | System Administrator | Unrestricted global access to all features, user administration, system settings, and master data. |
| **`admin_ppk`** | Central PPK Admin | Administrative management of KNMP contracts, payments, reports, and master data across all regions. |
| **`kontraktor`** | EPC / General Contractor | Creates and updates Persiapan, Pelaksanaan, Laporan Progres, Absensi, and Issues for assigned KNMPs. |
| **`pengawas`** | Field Supervisor / Inspector | Reviews, inspects, and performs Step 1 verification (`*_verify_pengawas`) on reports, attendance, and issues. |
| **`wakil_ppk`** | Deputy PPK Officer | Final authority for Step 2 verification (`*_verify_wakil_ppk`) on reports, attendance, and issues. |
| **`ppk`** | Pejabat Pembuat Komitmen | High-level executive monitoring dashboard, financial summaries, and final contract oversight. |

---

## 2. Granular Permissions Matrix

| Permission Name | `superadmin` | `admin_ppk` | `kontraktor` | `pengawas` | `wakil_ppk` | `ppk` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `dashboard` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `knmp_create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `knmp_read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `knmp_update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `knmp_delete` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `kontrak_create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `kontrak_read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `kontrak_update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `kontrak_delete` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `lapangan_create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `lapangan_read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `lapangan_update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `lapangan_delete` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `pelaksanaan_create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `pelaksanaan_read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `pelaksanaan_update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `pelaksanaan_delete` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `laporan_create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `laporan_read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `laporan_update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `laporan_delete` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `laporan_verify_pengawas` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `laporan_verify_wakil_ppk` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `laporan_unverify_pengawas` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `laporan_unverify_wakil_ppk` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `absensi_create` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `absensi_read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `absensi_update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `absensi_delete` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `absensi_verify_pengawas` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `absensi_verify_wakil_ppk` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `absensi_unverify_pengawas` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `absensi_unverify_wakil_ppk` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `issue_create` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `issue_read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `issue_update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `issue_delete` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `issue_verify_pengawas` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `issue_verify_wakil_ppk` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `issue_unverify_pengawas` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `issue_unverify_wakil_ppk` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `user_create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `user_read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `user_update` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `user_delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `periode_create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `periode_read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `periode_update` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `periode_delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `jenis_bangunan_create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `jenis_bangunan_read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `jenis_bangunan_update` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `jenis_bangunan_delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Go Backend Authorization Architecture

In Go Fiber, authorization is enforced via middleware and context helpers:

```go
// Example route definition
api.Patch("/laporan/:id/verify", 
    middleware.RequirePermission("laporan_verify_pengawas", "laporan_verify_wakil_ppk"), 
    laporanHandler.Verify,
)
```

1. **Authentication Middleware**: Decodes JWT and injects `user_id`, `roles`, `permissions`, and assigned `knmp_ids` into `c.Locals()`.
2. **Permission Guard**: Verifies that the user has at least one of the required permission strings.
3. **Data Scope Enforcement**: Handlers ensure that contractors or field supervisors cannot query or mutate records outside their assigned `knmp_ids`.

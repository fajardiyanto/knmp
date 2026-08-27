# Gap Analysis & Modernization Strategy — KNMP V2

This document classifies all legacy capabilities and defines improvements, deprecations, and architectural upgrades for KNMP V2.

---

## 1. Feature Classification Matrix

| Legacy Feature / Component | Classification | Modernization & Upgrade in V2 |
| :--- | :--- | :--- |
| **Authentication (Session vs Token)** | IMPROVE | Unify under high-performance JWT tokens for both React Web App and Mobile Client; eliminate session state in database. |
| **RBAC Authorization** | IMPROVE | Move from runtime PHP Spatie checks to explicit Go Fiber middleware + typed service layer checks with zero magic. |
| **DataTables Rendering** | REIMPLEMENT | Replace server-rendered Yajra DataTables with React TanStack Table with server-side pagination, sorting, and debounce search. |
| **Mobile Multipart Uploads** | IMPROVE | Reimplement `absensi`, `laporan`, and `issue` endpoints in Go with blazing fast streaming file validation and direct MinIO/S3 upload. |
| **Two-Step Verification Engine** | PRESERVE & HARDEN | Preserve the exact business logic (`menunggu_pengawas` → `menunggu_wakil_ppk` → `terverifikasi`) with strict audit logging in `verifications`. |
| **Document Access Authorization** | IMPROVE (SECURITY FIX) | Fix IDOR vulnerability in legacy `documents/{id}/download` by enforcing strict user-to-KNMP ownership checks before serving files. |
| **GIS Map View** | IMPROVE | Modernize OpenLayers view into a fluid React Map component with cluster pins, layer switching (satellite/streets), and popups. |
| **Database Migrations** | IMPROVE | Use `golang-migrate` with numbered SQL migrations; fix the rollback typo in legacy `knmps` migration. |
| **Legacy Blade Views** | DEPRECATE | Deprecate all server-rendered Blade templates in favor of a clean, responsive React + TypeScript Single Page Application (SPA). |
| **Queue / Database Worker** | IMPROVE | Replace Laravel database queue with idiomatic Go goroutines / asynchronous worker pools for mail and background tasks. |

---

## 2. Deprecated / Removed Items

1. **`App\Http\Controllers\Auth\ConfirmablePasswordController`**: Obsolete Laravel Breeze web session confirmation. Replaced by standard JWT re-authentication if needed.
2. **`App\Http\Controllers\Auth\EmailVerificationPromptController`**: Replaced by standard API status indicators.
3. **`Yajra DataTables` specific JSON responses**: Replaced by standard `{ data: [...], meta: { total, page, per_page } }` envelopes.

---

## 3. Key Improvements & Architectural Gains in V2

1. **Performance & Resource Footprint**:
   - Go compiled binary uses <30MB RAM compared to PHP-FPM + Nginx runtime (~200MB+), handling 10x higher request throughput with lower latency.
2. **Type Safety End-to-End**:
   - Golang domain structs strictly mirror TypeScript interfaces on the React frontend, eliminating runtime type mismatches.
3. **Independent Deployment & Scalability**:
   - Decoupled Go backend API and React SPA frontend can be built, tested, and containerized independently.
4. **Cloud-Native Storage**:
   - Direct integration with MinIO/S3 ensures scalable, durable document handling without filesystem lock-in.

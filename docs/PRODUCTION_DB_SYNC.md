# Production Database Sync Manual SQL

Panduan ini memakai file SQL saja untuk mengganti data production dengan data local.

File yang dipakai:

- `scripts/prod_wipe_all_data.sql`: menghapus isi tabel KNMP secara eksplisit pada schema `public`.
- `backups/knmp_local_data_20260901_093141_column_safe.sql`: dump data local saat ini dalam bentuk SQL insert dengan target kolom eksplisit untuk tabel legacy `perusahaans`.

## 1. Backup Production Dulu

Sebelum menjalankan wipe, ambil backup production dari panel hosting atau jalankan backup manual di server production.

## 2. Hapus Semua Data Production

Jalankan file ini pada database production:

```sql
\i scripts/prod_wipe_all_data.sql
```

Isi utama query:

```sql
BEGIN;

TRUNCATE TABLE
    public.absensis,
    public.conversation_members,
    public.conversations,
    public.districts,
    public.documents,
    public.issues,
    public.jenis_bangunans,
    public.knmps,
    public.laporan_jenis_bangunan,
    public.laporans,
    public.message_reads,
    public.messages,
    public.model_has_permissions,
    public.model_has_roles,
    public.notifications,
    public.notulen_shares,
    public.notulens,
    public.pcm,
    public.pelaksanaans,
    public.pembayarans,
    public.periodes,
    public.permissions,
    public.persiapans,
    public.perusahaans,
    public.provinces,
    public.regencies,
    public.regionals,
    public.role_has_permissions,
    public.roles,
    public.schema_migrations,
    public.sub_districts,
    public.user_knmps,
    public.users,
    public.verifications
RESTART IDENTITY CASCADE;

COMMIT;
```

## 3. Masukkan Data Local ke Production

Setelah wipe berhasil, jalankan dump data local:

```sql
\i backups/knmp_local_data_20260901_093141_column_safe.sql
```

Jika memakai command line:

```bash
psql "postgres://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require" -f scripts/prod_wipe_all_data.sql
psql "postgres://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require" -f backups/knmp_local_data_20260901_093141_column_safe.sql
```

Jika SQL client menampilkan `current transaction is aborted`, jalankan dulu:

```sql
ROLLBACK;
```

Setelah itu ulangi wipe dan import dari awal.

## 4. Generate Ulang Dump SQL Local

Jika data local berubah dan perlu export ulang, jalankan dari local PostgreSQL:

```bash
pg_dump --host localhost --port 5432 --username knmp --dbname knmp_db --data-only --column-inserts --no-owner --no-privileges --file backups/knmp_local_data_YYYYMMDD_HHMMSS.sql
```

Pada workspace ini `pg_dump` tersedia di container `knmp_postgres`, sehingga dump terbaru bisa dibuat dengan:

```powershell
$ts = Get-Date -Format yyyyMMdd_HHmmss
$containerFile = "/tmp/knmp_local_data_$ts.sql"
$hostFile = "backups\knmp_local_data_$ts.sql"
docker exec knmp_postgres pg_dump --username knmp --dbname knmp_db --data-only --column-inserts --no-owner --no-privileges --file $containerFile
docker cp "knmp_postgres:$containerFile" $hostFile
docker exec knmp_postgres rm -f $containerFile
```

## Catatan Penting

- Jalankan `prod_wipe_all_data.sql` hanya pada production yang sudah dibackup.
- Dump SQL ini berisi data saja, bukan schema. Pastikan schema production sudah sama dengan schema local.
- Jika production memakai SSL, gunakan `sslmode=require` pada connection string.
- Error `null value in column "created_at" of relation "perusahaans"` terjadi karena dump lama memakai `INSERT ... VALUES (...)` tanpa daftar kolom, sementara schema production memiliki kolom tambahan `status_administrasi` dan `status_karwas`. Gunakan file `column_safe` atau dump baru dengan `--column-inserts`.

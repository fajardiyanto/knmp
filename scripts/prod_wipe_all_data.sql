-- WARNING: Run this on production only when you intentionally want to delete
-- all KNMP data rows from the public schema.
--
-- Recommended flow:
-- 1. Take a production backup first.
-- 2. Run this file on production.
-- 3. Run the local data SQL dump generated from local DB.

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

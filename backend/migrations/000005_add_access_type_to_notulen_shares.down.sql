-- Remove access_type column from notulen_shares
ALTER TABLE notulen_shares DROP COLUMN IF EXISTS access_type;

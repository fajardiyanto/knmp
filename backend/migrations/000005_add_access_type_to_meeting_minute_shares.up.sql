-- Add access_type column to notulen_shares
ALTER TABLE notulen_shares ADD COLUMN IF NOT EXISTS access_type VARCHAR(20) DEFAULT 'viewer';

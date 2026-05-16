ALTER TABLE share ADD COLUMN legacy_id TEXT;
CREATE UNIQUE INDEX share_legacy_id_idx ON share(legacy_id) WHERE legacy_id IS NOT NULL;

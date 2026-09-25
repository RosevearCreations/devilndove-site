-- Release 467 Build 269 — Private Raw Media Intake Integrity
-- Additive-only CAIP private-media dedupe/recovery metadata.
-- Apply exactly once after backing up D1 and confirming the retained Build 241 private-media tables.
-- Runtime code never executes this DDL.

ALTER TABLE caip_media_upload_files ADD COLUMN content_fingerprint TEXT;
ALTER TABLE caip_media_upload_files ADD COLUMN content_fingerprint_version TEXT;
ALTER TABLE caip_media_upload_files ADD COLUMN recovery_of_file_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_caip_media_files_content_fingerprint
  ON caip_media_upload_files(creative_project_id, content_fingerprint, file_size_bytes, upload_status);
CREATE INDEX IF NOT EXISTS idx_caip_media_files_recovery
  ON caip_media_upload_files(recovery_of_file_id, caip_media_upload_file_id);

INSERT INTO schema_migration_ledger(
  migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at
) VALUES(
  'build269_caip_social_project_dedupe_integrity',
  'database_build269_caip_social_project_dedupe_integrity.sql',
  NULL,'applied',0,CURRENT_TIMESTAMP,
  'Adds bounded content-sample fingerprints, recovery lineage, duplicate-safe CAIP intake, and multipart completion integrity metadata for standalone/social project media.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,
  status='applied',
  destructive=0,
  applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),
  notes=excluded.notes,
  updated_at=CURRENT_TIMESTAMP;

-- Build 272 CAIP upload prerequisite check (READ ONLY)
-- Expected: all three required columns return present = 1.
SELECT
  required.name AS required_column,
  CASE WHEN actual.name IS NOT NULL THEN 1 ELSE 0 END AS present
FROM (
  SELECT 'content_fingerprint' AS name
  UNION ALL SELECT 'content_fingerprint_version'
  UNION ALL SELECT 'recovery_of_file_id'
) AS required
LEFT JOIN pragma_table_info('caip_media_upload_files') AS actual
  ON actual.name = required.name
ORDER BY required.name;

-- Expected when Build 269 migration was applied: one row with status = applied.
SELECT migration_key, file_name, status, applied_at
FROM schema_migration_ledger
WHERE migration_key = 'build269_caip_social_project_dedupe_integrity';

-- Existing private media table should still be queryable.
SELECT COUNT(*) AS caip_upload_file_rows
FROM caip_media_upload_files;

-- Devil n Dove Build 256 — read-only D1 verification.
-- Run after applying database_build256_media_content_studio.sql.

SELECT migration_key, file_name, status, destructive, applied_at
FROM schema_migration_ledger
WHERE migration_key = 'build256_media_content_studio';

SELECT name, type
FROM sqlite_master
WHERE name IN (
  'managed_media_metadata',
  'media_content_slots',
  'media_content_assignments',
  'managed_content_blocks',
  'media_content_change_audit',
  'idx_media_content_slots_page',
  'idx_media_content_assignments_active_slot',
  'idx_media_content_assignments_media',
  'idx_managed_content_blocks_page',
  'idx_media_content_audit_target'
)
ORDER BY type, name;

SELECT 'managed_media_metadata' AS object_name, COUNT(*) AS row_count FROM managed_media_metadata
UNION ALL SELECT 'media_content_slots', COUNT(*) FROM media_content_slots
UNION ALL SELECT 'active_media_assignments', COUNT(*) FROM media_content_assignments WHERE active = 1
UNION ALL SELECT 'managed_content_blocks', COUNT(*) FROM managed_content_blocks
UNION ALL SELECT 'published_content_blocks', COUNT(*) FROM managed_content_blocks WHERE published = 1
UNION ALL SELECT 'media_content_change_audit', COUNT(*) FROM media_content_change_audit;

SELECT page_path, slot_type, COUNT(*) AS slot_count
FROM media_content_slots
WHERE is_active = 1
GROUP BY page_path, slot_type
ORDER BY page_path, slot_type;

-- Expected result: zero rows.
PRAGMA foreign_key_check;

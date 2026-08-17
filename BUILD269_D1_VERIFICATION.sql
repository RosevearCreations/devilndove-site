-- Devil n Dove Build 269 — read-only CAIP verification.
-- Safe to run after database_build269_caip_social_project_dedupe_integrity.sql.

-- 1) Migration ledger.
SELECT migration_key,file_name,status,destructive,applied_at
FROM schema_migration_ledger
WHERE migration_key='build269_caip_social_project_dedupe_integrity';

-- 2) Required CAIP upload columns.
SELECT cid,name,type,notnull,dflt_value,pk
FROM pragma_table_info('caip_media_upload_files')
WHERE name IN ('file_fingerprint','content_fingerprint','content_fingerprint_version','recovery_of_file_id')
ORDER BY cid;

-- 3) Required indexes.
SELECT name,sql
FROM sqlite_master
WHERE type='index'
  AND name IN ('idx_caip_media_files_content_fingerprint','idx_caip_media_files_recovery')
ORDER BY name;

-- 4) Project 23 fingerprint coverage / status. Change 23 if testing another CAIP project.
SELECT
  COUNT(*) AS upload_rows,
  SUM(CASE WHEN upload_status='uploaded' THEN 1 ELSE 0 END) AS uploaded_rows,
  SUM(CASE WHEN upload_status='uploaded' AND COALESCE(content_fingerprint,'')<>'' THEN 1 ELSE 0 END) AS uploaded_with_strong_fingerprint,
  SUM(CASE WHEN upload_status='uploaded' AND COALESCE(content_fingerprint,'')='' THEN 1 ELSE 0 END) AS uploaded_needing_strong_fingerprint,
  SUM(CASE WHEN upload_status='failed' THEN 1 ELSE 0 END) AS failed_rows,
  SUM(CASE WHEN recovery_of_file_id IS NOT NULL THEN 1 ELSE 0 END) AS recovery_rows
FROM caip_media_upload_files
WHERE creative_project_id=23;

-- 5) Detect parent/part-state mismatches. Healthy completed uploads should not appear.
WITH actual_parts AS (
  SELECT
    caip_media_upload_file_id,
    COUNT(*) AS recorded_parts,
    SUM(CASE WHEN part_status='uploaded' AND COALESCE(etag,'')<>'' THEN 1 ELSE 0 END) AS actual_uploaded_parts,
    COALESCE(SUM(CASE WHEN part_status='uploaded' AND COALESCE(etag,'')<>'' THEN part_size_bytes ELSE 0 END),0) AS actual_uploaded_bytes,
    MIN(CASE WHEN part_status='uploaded' AND COALESCE(etag,'')<>'' THEN part_number END) AS first_uploaded_part,
    MAX(CASE WHEN part_status='uploaded' AND COALESCE(etag,'')<>'' THEN part_number END) AS last_uploaded_part
  FROM caip_media_upload_parts
  GROUP BY caip_media_upload_file_id
)
SELECT
  f.caip_media_upload_file_id,
  f.creative_project_id,
  f.original_filename,
  f.upload_status,
  f.expected_parts,
  f.uploaded_parts AS cached_uploaded_parts,
  COALESCE(a.actual_uploaded_parts,0) AS actual_uploaded_parts,
  f.file_size_bytes,
  f.uploaded_bytes AS cached_uploaded_bytes,
  COALESCE(a.actual_uploaded_bytes,0) AS actual_uploaded_bytes,
  COALESCE(a.recorded_parts,0) AS recorded_parts,
  a.first_uploaded_part,
  a.last_uploaded_part,
  f.etag,
  f.last_error
FROM caip_media_upload_files f
LEFT JOIN actual_parts a ON a.caip_media_upload_file_id=f.caip_media_upload_file_id
WHERE f.upload_status='uploaded'
  AND (
    f.expected_parts<>COALESCE(a.actual_uploaded_parts,0)
    OR f.file_size_bytes<>COALESCE(a.actual_uploaded_bytes,0)
    OR f.uploaded_parts<>COALESCE(a.actual_uploaded_parts,0)
    OR f.uploaded_bytes<>COALESCE(a.actual_uploaded_bytes,0)
  )
ORDER BY f.creative_project_id,f.caip_media_upload_file_id;

-- 6) Fingerprint duplicate groups inside Project 23. Strong fingerprint wins when present.
SELECT
  COALESCE(NULLIF(content_fingerprint,''),'legacy:'||COALESCE(file_fingerprint,'')) AS dedupe_fingerprint,
  file_size_bytes,
  COUNT(*) AS row_count,
  GROUP_CONCAT(caip_media_upload_file_id) AS upload_file_ids,
  GROUP_CONCAT(upload_status) AS statuses,
  GROUP_CONCAT(COALESCE(CAST(creative_asset_id AS TEXT),'none')) AS creative_asset_ids
FROM caip_media_upload_files
WHERE creative_project_id=23
  AND upload_status<>'archived'
  AND (COALESCE(content_fingerprint,'')<>'' OR COALESCE(file_fingerprint,'')<>'')
GROUP BY COALESCE(NULLIF(content_fingerprint,''),'legacy:'||COALESCE(file_fingerprint,'')),file_size_bytes
HAVING COUNT(*)>1
ORDER BY row_count DESC,file_size_bytes DESC;

-- 7) Clean-recovery lineage.
SELECT
  child.caip_media_upload_file_id AS recovery_file_id,
  child.original_filename,
  child.upload_status AS recovery_status,
  child.recovery_of_file_id,
  parent.upload_status AS prior_status,
  parent.last_error AS prior_error,
  child.object_key AS recovery_object_key,
  parent.object_key AS prior_object_key
FROM caip_media_upload_files child
LEFT JOIN caip_media_upload_files parent
  ON parent.caip_media_upload_file_id=child.recovery_of_file_id
WHERE child.recovery_of_file_id IS NOT NULL
ORDER BY child.caip_media_upload_file_id DESC;


-- 8) Current auth authority must be users/sessions with user_id-based sessions.
SELECT
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='users') AS users_table,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='sessions') AS sessions_table,
  (SELECT COUNT(*) FROM pragma_table_info('sessions') WHERE name='user_id') AS sessions_user_id_column,
  (SELECT COUNT(*) FROM pragma_table_info('sessions') WHERE name='session_token') AS sessions_session_token_column,
  (SELECT COUNT(*) FROM pragma_table_info('sessions') WHERE name='token') AS sessions_token_column;

-- 9) Production preservation dependencies. Live production should report all four tables.
SELECT name,type
FROM sqlite_master
WHERE type='table'
  AND name IN ('members_legacy','member_sessions_legacy','blog_posts','blog_comments')
ORDER BY name;

-- 10) Verify historical blog/member foreign-key targets after the 2026-08-17 maintenance.
SELECT 'blog_posts' AS child_table, "from" AS child_column, "table" AS parent_table, "to" AS parent_column, on_delete
FROM pragma_foreign_key_list('blog_posts')
UNION ALL
SELECT 'blog_comments', "from", "table", "to", on_delete
FROM pragma_foreign_key_list('blog_comments')
UNION ALL
SELECT 'member_sessions_legacy', "from", "table", "to", on_delete
FROM pragma_foreign_key_list('member_sessions_legacy')
ORDER BY child_table,child_column;

-- 11) Final relational integrity check. Healthy result: no rows.
PRAGMA foreign_key_check;

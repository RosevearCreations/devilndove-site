-- Devil n Dove Build 267 — read-only CAIP audit for Creative Project 23.
-- SAFE: SELECT-only. This file does not update D1 or delete R2 objects.

-- 1) Upload/recovery status summary.
SELECT upload_status, COUNT(*) AS row_count, SUM(file_size_bytes) AS total_bytes
FROM caip_media_upload_files
WHERE creative_project_id = 23
GROUP BY upload_status
ORDER BY upload_status;

-- 2) Files whose binary is marked uploaded but CAIP registration is still missing.
SELECT caip_media_upload_file_id, original_filename, file_size_bytes, object_key,
       upload_status, creative_asset_id, last_error, uploaded_at, updated_at
FROM caip_media_upload_files
WHERE creative_project_id = 23
  AND upload_status = 'uploaded'
  AND creative_asset_id IS NULL
ORDER BY caip_media_upload_file_id DESC;

-- 3) Probable duplicate intake rows (same stored intake fingerprint + size).
-- This fingerprint is useful for reconciliation but is NOT by itself a cryptographic
-- content proof. Build 267 does not physically delete R2 copies on this basis alone.
SELECT file_fingerprint, file_size_bytes, COUNT(*) AS active_rows,
       GROUP_CONCAT(caip_media_upload_file_id) AS upload_file_ids,
       GROUP_CONCAT(upload_status) AS statuses,
       GROUP_CONCAT(COALESCE(creative_asset_id,'')) AS creative_asset_ids
FROM caip_media_upload_files
WHERE creative_project_id = 23
  AND COALESCE(file_fingerprint,'') <> ''
  AND upload_status <> 'archived'
GROUP BY file_fingerprint, file_size_bytes
HAVING COUNT(*) > 1
ORDER BY active_rows DESC, file_size_bytes DESC;

-- 4) Verified checksum duplicates. These are the only duplicate groups Build 267
-- considers eligible for automatic redundant-R2 deletion after downstream-use checks.
SELECT checksum_value, file_size_bytes, COUNT(*) AS verified_rows,
       GROUP_CONCAT(caip_media_upload_file_id) AS upload_file_ids
FROM caip_media_upload_files
WHERE creative_project_id = 23
  AND checksum_status = 'verified'
  AND COALESCE(checksum_value,'') <> ''
  AND upload_status <> 'archived'
GROUP BY checksum_value, file_size_bytes
HAVING COUNT(*) > 1
ORDER BY verified_rows DESC, file_size_bytes DESC;

-- 5) Archived duplicate rows retained for audit history.
SELECT caip_media_upload_file_id, original_filename, file_size_bytes, object_key,
       creative_asset_id, last_error, updated_at
FROM caip_media_upload_files
WHERE creative_project_id = 23
  AND upload_status = 'archived'
ORDER BY caip_media_upload_file_id DESC;

-- 6) Canonical CAIP assets created for this project.
SELECT creative_asset_id, media_asset_id, asset_key, source_fingerprint,
       logical_archive_path, asset_status, media_type, original_filename, updated_at
FROM creative_assets
WHERE creative_project_id = 23
ORDER BY creative_asset_id DESC;

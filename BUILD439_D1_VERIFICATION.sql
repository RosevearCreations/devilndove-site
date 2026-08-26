-- Build 439 CAIP temporal evidence review — read-only Development verification.
SELECT 'creative_media_evidence_ranges' AS authority,
       COUNT(*) AS row_count
FROM creative_media_evidence_ranges;

SELECT 'creative_story_segment_evidence_links' AS authority,
       COUNT(*) AS row_count
FROM creative_story_segment_evidence_links;

SELECT 'caip_media_processing_artifacts' AS authority,
       COUNT(*) AS row_count
FROM caip_media_processing_artifacts;

SELECT name,type
FROM sqlite_master
WHERE name IN (
  'idx_creative_media_evidence_project','idx_creative_media_evidence_asset','idx_creative_media_evidence_story',
  'idx_creative_segment_evidence_links_segment','idx_creative_segment_evidence_links_range',
  'idx_caip_processing_artifacts_job','idx_caip_processing_artifacts_project',
  'trg_caip_processing_complete_requires_verified_artifact','trg_caip_processing_insert_complete_requires_verified_artifact'
)
ORDER BY type,name;

SELECT provider_key,lifecycle_status,capability_key,endpoint_policy
FROM creative_provider_profiles
WHERE provider_key IN ('caip_frame_builder','caip_audio_extractor')
ORDER BY provider_key;

SELECT migration_key,file_name,applied_at
FROM schema_migration_ledger
WHERE migration_key='build_439_caip_temporal_evidence_review';

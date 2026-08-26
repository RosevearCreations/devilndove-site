-- Build 439 CAIP temporal evidence review — strict read-only verification.
-- Any structural mismatch deliberately raises SQLite integer overflow.
SELECT CASE WHEN
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN (
    'creative_media_evidence_ranges','creative_story_segment_evidence_links','caip_media_processing_artifacts'
  )) = 3
  AND (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name IN (
    'idx_creative_media_evidence_project','idx_creative_media_evidence_asset','idx_creative_media_evidence_story',
    'idx_creative_segment_evidence_links_segment','idx_creative_segment_evidence_links_range',
    'idx_caip_processing_artifacts_job','idx_caip_processing_artifacts_project'
  )) = 7
  AND (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name IN (
    'trg_caip_processing_complete_requires_verified_artifact','trg_caip_processing_insert_complete_requires_verified_artifact'
  )) = 2
  AND (SELECT COUNT(*) FROM creative_provider_profiles
       WHERE provider_key IN ('caip_frame_builder','caip_audio_extractor') AND lifecycle_status='disabled') = 2
  AND (SELECT COUNT(*) FROM schema_migration_ledger
       WHERE migration_key='build_439_caip_temporal_evidence_review'
         AND file_name='database_build439_caip_temporal_evidence_review.sql') = 1
  AND (SELECT COUNT(*) FROM pragma_table_info('creative_media_evidence_ranges')
       WHERE name IN ('creative_project_id','creative_asset_id','marker_key','marker_type','evidence_category','start_seconds','end_seconds','review_status','verification_status')) = 9
  AND (SELECT COUNT(*) FROM pragma_table_info('caip_media_processing_artifacts')
       WHERE name IN ('caip_media_processing_job_id','artifact_key','artifact_role','object_key','file_size_bytes','verification_status','verification_evidence_json','verified_at')) = 8
THEN 1 ELSE abs(-9223372036854775808) END AS verification_pass;

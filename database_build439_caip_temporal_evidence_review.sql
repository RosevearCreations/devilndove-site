-- Devil n Dove Build 439 — CAIP temporal media evidence review and verified processing artifacts.
-- Additive / safe to rerun. Apply after the current CAIP migration chain.
-- This migration stores review metadata only. It does not read, copy, transform, publish,
-- overwrite, delete, or make public any source media or R2 object.

CREATE TABLE IF NOT EXISTS creative_media_evidence_ranges (
  creative_media_evidence_range_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  caip_media_upload_file_id INTEGER,
  linked_story_evidence_id INTEGER,
  marker_key TEXT NOT NULL UNIQUE,
  marker_type TEXT NOT NULL DEFAULT 'point' CHECK (marker_type IN ('point','range')),
  evidence_category TEXT NOT NULL DEFAULT 'process_proof' CHECK (evidence_category IN (
    'technique','problem','result','lesson','material_proof','process_proof','safety_quality','context','other'
  )),
  start_seconds REAL NOT NULL DEFAULT 0 CHECK (start_seconds >= 0),
  end_seconds REAL,
  source_duration_seconds REAL,
  title TEXT NOT NULL,
  note_text TEXT,
  transcript_excerpt TEXT,
  confidence_score INTEGER NOT NULL DEFAULT 100 CHECK (confidence_score BETWEEN 0 AND 100),
  verification_status TEXT NOT NULL DEFAULT 'source_observed' CHECK (verification_status IN ('unverified','source_observed','confirmed','rejected')),
  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (review_status IN ('needs_review','approved','rejected')),
  visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal','public_candidate')),
  story_candidate INTEGER NOT NULL DEFAULT 1 CHECK (story_candidate IN (0,1)),
  marker_status TEXT NOT NULL DEFAULT 'active' CHECK (marker_status IN ('active','archived')),
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_seconds IS NULL OR end_seconds >= start_seconds),
  CHECK (source_duration_seconds IS NULL OR source_duration_seconds >= 0),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE,
  FOREIGN KEY (caip_media_upload_file_id) REFERENCES caip_media_upload_files(caip_media_upload_file_id) ON DELETE SET NULL,
  FOREIGN KEY (linked_story_evidence_id) REFERENCES creative_story_evidence(creative_story_evidence_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_creative_media_evidence_project
  ON creative_media_evidence_ranges(creative_project_id,review_status,marker_status,start_seconds,creative_media_evidence_range_id);
CREATE INDEX IF NOT EXISTS idx_creative_media_evidence_asset
  ON creative_media_evidence_ranges(creative_asset_id,marker_status,start_seconds,end_seconds);
CREATE INDEX IF NOT EXISTS idx_creative_media_evidence_story
  ON creative_media_evidence_ranges(linked_story_evidence_id,review_status);

CREATE TABLE IF NOT EXISTS creative_story_segment_evidence_links (
  creative_story_segment_evidence_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_story_segment_id INTEGER NOT NULL,
  creative_media_evidence_range_id INTEGER NOT NULL,
  link_role TEXT NOT NULL DEFAULT 'supporting' CHECK (link_role IN ('primary','supporting','context')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_story_segment_id,creative_media_evidence_range_id),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_story_segment_id) REFERENCES creative_story_segments(creative_story_segment_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_media_evidence_range_id) REFERENCES creative_media_evidence_ranges(creative_media_evidence_range_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creative_segment_evidence_links_segment
  ON creative_story_segment_evidence_links(creative_story_segment_id,sort_order,creative_story_segment_evidence_link_id);
CREATE INDEX IF NOT EXISTS idx_creative_segment_evidence_links_range
  ON creative_story_segment_evidence_links(creative_media_evidence_range_id,creative_story_segment_id);

CREATE TABLE IF NOT EXISTS caip_media_processing_artifacts (
  caip_media_processing_artifact_id INTEGER PRIMARY KEY AUTOINCREMENT,
  caip_media_processing_job_id INTEGER NOT NULL,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  artifact_key TEXT NOT NULL UNIQUE,
  artifact_role TEXT NOT NULL CHECK (artifact_role IN ('proxy_video','thumbnail','frame','audio','transcript','metadata','other')),
  storage_provider TEXT,
  bucket_alias TEXT,
  object_key TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  checksum_algorithm TEXT,
  checksum_value TEXT,
  source_start_seconds REAL,
  source_end_seconds REAL,
  duration_seconds REAL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','head_verified','checksum_verified','missing','mismatch','rejected')),
  verification_evidence_json TEXT NOT NULL DEFAULT '{}',
  verified_by_user_id INTEGER,
  verified_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  CHECK (source_start_seconds IS NULL OR source_start_seconds >= 0),
  CHECK (source_end_seconds IS NULL OR source_end_seconds >= COALESCE(source_start_seconds,0)),
  CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  FOREIGN KEY (caip_media_processing_job_id) REFERENCES caip_media_processing_jobs(caip_media_processing_job_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_caip_processing_artifacts_job
  ON caip_media_processing_artifacts(caip_media_processing_job_id,verification_status,caip_media_processing_artifact_id);
CREATE INDEX IF NOT EXISTS idx_caip_processing_artifacts_project
  ON caip_media_processing_artifacts(creative_project_id,creative_asset_id,artifact_role,verification_status);

-- A future provider may not mark a media-producing job complete until at least one
-- artifact has been verified. Metadata/story/plan-only jobs are intentionally excluded.
CREATE TRIGGER IF NOT EXISTS trg_caip_processing_complete_requires_verified_artifact
BEFORE UPDATE OF job_status ON caip_media_processing_jobs
WHEN NEW.job_status='complete'
  AND NEW.job_type IN ('proxy_video','thumbnail','frame_extract','audio_extract','transcript')
  AND NOT EXISTS (
    SELECT 1
    FROM caip_media_processing_artifacts a
    WHERE a.caip_media_processing_job_id=NEW.caip_media_processing_job_id
      AND a.verification_status IN ('head_verified','checksum_verified')
  )
BEGIN
  SELECT RAISE(ABORT,'CAIP_PROCESSING_ARTIFACT_VERIFICATION_REQUIRED');
END;

CREATE TRIGGER IF NOT EXISTS trg_caip_processing_insert_complete_requires_verified_artifact
BEFORE INSERT ON caip_media_processing_jobs
WHEN NEW.job_status='complete'
  AND NEW.job_type IN ('proxy_video','thumbnail','frame_extract','audio_extract','transcript')
BEGIN
  SELECT RAISE(ABORT,'CAIP_PROCESSING_ARTIFACT_VERIFICATION_REQUIRED');
END;

-- Provider metadata only. No endpoint, credential, queue or provider execution is enabled here.
INSERT INTO creative_provider_profiles(
  provider_key,display_name,capability_key,lifecycle_status,endpoint_policy,
  config_redacted_json,consent_required,default_budget_cap_cents,created_at,updated_at
) VALUES
('caip_frame_builder','CAIP frame extraction adapter','frame_extract','disabled','provider not configured','{}',1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('caip_audio_extractor','CAIP audio extraction adapter','audio_extract','disabled','provider not configured','{}',1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT(provider_key) DO UPDATE SET
  display_name=excluded.display_name,
  capability_key=excluded.capability_key,
  endpoint_policy=excluded.endpoint_policy,
  config_redacted_json=excluded.config_redacted_json,
  consent_required=excluded.consent_required,
  updated_at=CURRENT_TIMESTAMP;

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build_439_caip_temporal_evidence_review',
  'database_build439_caip_temporal_evidence_review.sql',
  CURRENT_TIMESTAMP,
  'Adds first-class CAIP point/range timecode evidence, normalized story-segment evidence links, provider-output artifact verification metadata, and fail-closed verified-artifact requirements for media-processing completion. Source originals remain immutable/private; providers remain disabled.'
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,
  notes=excluded.notes;
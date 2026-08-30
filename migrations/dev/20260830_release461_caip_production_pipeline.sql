-- Release 461 — CAIP production pipeline authority. Additive Development migration only.
-- Existing private upload, creative asset, temporal evidence, story, Content Studio and handoff
-- authorities remain canonical. These tables store orchestration/review decisions only.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS caip_asset_ingest_contexts (
  caip_asset_ingest_context_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL UNIQUE,
  intake_source TEXT NOT NULL DEFAULT 'caip_private_media',
  capture_session_key TEXT, camera_label TEXT, device_label TEXT, capture_at TEXT, source_timecode TEXT,
  recognition_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (recognition_status IN ('needs_review','recognized','confirmed','rejected')),
  recognition_confidence INTEGER NOT NULL DEFAULT 0 CHECK (recognition_confidence BETWEEN 0 AND 100),
  metadata_json TEXT NOT NULL DEFAULT '{}', reviewed_by_user_id INTEGER, reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caip_capture_groups (
  caip_capture_group_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL, capture_group_key TEXT NOT NULL, title TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (sync_status IN ('needs_review','suggested','confirmed','rejected')),
  anchor_creative_asset_id INTEGER, sync_method TEXT NOT NULL DEFAULT 'capture_metadata', notes TEXT,
  created_by_user_id INTEGER, reviewed_by_user_id INTEGER, reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id,capture_group_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (anchor_creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS caip_capture_tracks (
  caip_capture_track_id INTEGER PRIMARY KEY AUTOINCREMENT,
  caip_capture_group_id INTEGER NOT NULL, creative_asset_id INTEGER NOT NULL, camera_label TEXT,
  source_role TEXT NOT NULL DEFAULT 'camera' CHECK (source_role IN ('camera','audio','reference')),
  sync_offset_seconds REAL NOT NULL DEFAULT 0, sync_confidence INTEGER NOT NULL DEFAULT 0 CHECK (sync_confidence BETWEEN 0 AND 100),
  sync_method TEXT NOT NULL DEFAULT 'capture_metadata', review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (review_status IN ('needs_review','confirmed','rejected')),
  notes TEXT, sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(caip_capture_group_id,creative_asset_id),
  FOREIGN KEY (caip_capture_group_id) REFERENCES caip_capture_groups(caip_capture_group_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caip_asset_quality_reviews (
  caip_asset_quality_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL, creative_asset_id INTEGER NOT NULL UNIQUE,
  focus_score INTEGER NOT NULL DEFAULT 0 CHECK (focus_score BETWEEN 0 AND 100),
  exposure_score INTEGER NOT NULL DEFAULT 0 CHECK (exposure_score BETWEEN 0 AND 100),
  stability_score INTEGER NOT NULL DEFAULT 0 CHECK (stability_score BETWEEN 0 AND 100),
  audio_score INTEGER NOT NULL DEFAULT 0 CHECK (audio_score BETWEEN 0 AND 100),
  story_usefulness_score INTEGER NOT NULL DEFAULT 0 CHECK (story_usefulness_score BETWEEN 0 AND 100),
  overall_quality_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_quality_score BETWEEN 0 AND 100),
  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (review_status IN ('needs_review','accepted','limited','rejected')),
  reason_codes_json TEXT NOT NULL DEFAULT '[]', review_notes TEXT, reviewed_by_user_id INTEGER, reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caip_asset_lifecycle_states (
  caip_asset_lifecycle_state_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL, creative_asset_id INTEGER NOT NULL UNIQUE,
  lifecycle_status TEXT NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('active','rejected','purge_requested','purge_cancelled','restored')),
  rejection_reason TEXT, purge_reason TEXT, purge_not_before TEXT,
  raw_delete_authorized INTEGER NOT NULL DEFAULT 0 CHECK (raw_delete_authorized IN (0,1)),
  requested_by_user_id INTEGER, restored_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caip_asset_lifecycle_events (
  caip_asset_lifecycle_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL, creative_asset_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('reject','restore','request_purge','cancel_purge')),
  from_status TEXT, to_status TEXT NOT NULL, reason TEXT, actor_user_id INTEGER, details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caip_semantic_evidence_annotations (
  caip_semantic_evidence_annotation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL, creative_media_evidence_range_id INTEGER NOT NULL UNIQUE,
  semantic_tags_json TEXT NOT NULL DEFAULT '[]', entities_json TEXT NOT NULL DEFAULT '[]', transcript_terms_json TEXT NOT NULL DEFAULT '[]',
  semantic_summary TEXT, source_method TEXT NOT NULL DEFAULT 'human_review',
  confidence_score INTEGER NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (review_status IN ('needs_review','approved','rejected')),
  reviewed_by_user_id INTEGER, reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_media_evidence_range_id) REFERENCES creative_media_evidence_ranges(creative_media_evidence_range_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caip_story_builder_drafts (
  caip_story_builder_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL, story_key TEXT NOT NULL, title TEXT NOT NULL,
  story_status TEXT NOT NULL DEFAULT 'draft' CHECK (story_status IN ('draft','review','approved','archived')),
  opening_summary TEXT, lesson_summary TEXT, recommendation_summary TEXT, private_storyboard_notes TEXT,
  source_segment_count INTEGER NOT NULL DEFAULT 0, source_evidence_count INTEGER NOT NULL DEFAULT 0,
  generated_by TEXT NOT NULL DEFAULT 'reviewed_evidence_template', created_by_user_id INTEGER, reviewed_by_user_id INTEGER, reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id,story_key), FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caip_story_builder_items (
  caip_story_builder_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  caip_story_builder_draft_id INTEGER NOT NULL, creative_story_segment_id INTEGER, creative_media_evidence_range_id INTEGER,
  item_role TEXT NOT NULL DEFAULT 'story_beat' CHECK (item_role IN ('opening','story_beat','lesson','result','closing')),
  item_title TEXT, item_text TEXT, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (caip_story_builder_draft_id) REFERENCES caip_story_builder_drafts(caip_story_builder_draft_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_story_segment_id) REFERENCES creative_story_segments(creative_story_segment_id) ON DELETE SET NULL,
  FOREIGN KEY (creative_media_evidence_range_id) REFERENCES creative_media_evidence_ranges(creative_media_evidence_range_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS caip_edit_timeline_drafts (
  caip_edit_timeline_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL, caip_story_builder_draft_id INTEGER, timeline_key TEXT NOT NULL, title TEXT NOT NULL,
  timeline_status TEXT NOT NULL DEFAULT 'draft' CHECK (timeline_status IN ('draft','review','approved','archived')),
  aspect_ratio TEXT NOT NULL DEFAULT '16:9', target_duration_seconds INTEGER NOT NULL DEFAULT 0, total_planned_seconds REAL NOT NULL DEFAULT 0,
  timeline_json TEXT NOT NULL DEFAULT '{}', provider_execution_status TEXT NOT NULL DEFAULT 'closed',
  created_by_user_id INTEGER, reviewed_by_user_id INTEGER, reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id,timeline_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (caip_story_builder_draft_id) REFERENCES caip_story_builder_drafts(caip_story_builder_draft_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS caip_edit_timeline_clips (
  caip_edit_timeline_clip_id INTEGER PRIMARY KEY AUTOINCREMENT,
  caip_edit_timeline_draft_id INTEGER NOT NULL, creative_asset_id INTEGER NOT NULL, creative_media_evidence_range_id INTEGER,
  clip_role TEXT NOT NULL DEFAULT 'evidence', source_in_seconds REAL NOT NULL DEFAULT 0, source_out_seconds REAL NOT NULL DEFAULT 0,
  timeline_in_seconds REAL NOT NULL DEFAULT 0, timeline_out_seconds REAL NOT NULL DEFAULT 0,
  camera_label TEXT, sync_offset_seconds REAL NOT NULL DEFAULT 0, caption_text TEXT, sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (caip_edit_timeline_draft_id) REFERENCES caip_edit_timeline_drafts(caip_edit_timeline_draft_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_media_evidence_range_id) REFERENCES creative_media_evidence_ranges(creative_media_evidence_range_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS caip_pipeline_events (
  caip_pipeline_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL, creative_asset_id INTEGER, event_type TEXT NOT NULL, actor_user_id INTEGER,
  details_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_caip_ingest_project ON caip_asset_ingest_contexts(creative_project_id,recognition_status,updated_at);
CREATE INDEX IF NOT EXISTS idx_caip_capture_groups_project ON caip_capture_groups(creative_project_id,sync_status,updated_at);
CREATE INDEX IF NOT EXISTS idx_caip_capture_tracks_group ON caip_capture_tracks(caip_capture_group_id,sort_order,caip_capture_track_id);
CREATE INDEX IF NOT EXISTS idx_caip_quality_project ON caip_asset_quality_reviews(creative_project_id,review_status,overall_quality_score);
CREATE INDEX IF NOT EXISTS idx_caip_lifecycle_project ON caip_asset_lifecycle_states(creative_project_id,lifecycle_status,updated_at);
CREATE INDEX IF NOT EXISTS idx_caip_lifecycle_events_asset ON caip_asset_lifecycle_events(creative_asset_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_caip_semantic_project ON caip_semantic_evidence_annotations(creative_project_id,review_status,confidence_score);
CREATE INDEX IF NOT EXISTS idx_caip_story_builder_project ON caip_story_builder_drafts(creative_project_id,story_status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_caip_story_items_draft ON caip_story_builder_items(caip_story_builder_draft_id,sort_order);
CREATE INDEX IF NOT EXISTS idx_caip_edit_timeline_project ON caip_edit_timeline_drafts(creative_project_id,timeline_status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_caip_edit_timeline_clips_draft ON caip_edit_timeline_clips(caip_edit_timeline_draft_id,sort_order);
CREATE INDEX IF NOT EXISTS idx_caip_pipeline_events_project ON caip_pipeline_events(creative_project_id,created_at DESC);
PRAGMA foreign_key_check;

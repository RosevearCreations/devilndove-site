-- Devil n Dove Build 183 — Visual Enrichment Studio, approved-media slots, screenshot pairs, alt-text suggestions, and low-bandwidth polish controls
-- Safe additive D1 migration. Run after database_build182_mobile_visual_polish.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS visual_candidate_media_assets (
  visual_candidate_media_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  visual_enrichment_candidate_id INTEGER,
  page_path TEXT NOT NULL,
  candidate_key TEXT,
  source_kind TEXT NOT NULL DEFAULT 'product_image',
  source_id INTEGER,
  thumbnail_url TEXT,
  image_url TEXT,
  alt_text TEXT,
  asset_status TEXT NOT NULL DEFAULT 'available',
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_visual_candidate_media_assets_candidate ON visual_candidate_media_assets(visual_enrichment_candidate_id, asset_status);
CREATE INDEX IF NOT EXISTS idx_visual_candidate_media_assets_page ON visual_candidate_media_assets(page_path, asset_status);

CREATE TABLE IF NOT EXISTS visual_parity_screenshot_pairs (
  visual_parity_screenshot_pair_id INTEGER PRIMARY KEY AUTOINCREMENT,
  desktop_mobile_parity_check_id INTEGER,
  page_path TEXT NOT NULL,
  desktop_screenshot_url TEXT,
  mobile_screenshot_url TEXT,
  desktop_object_key TEXT,
  mobile_object_key TEXT,
  pair_status TEXT NOT NULL DEFAULT 'needs_upload',
  diff_status TEXT NOT NULL DEFAULT 'not_compared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_visual_parity_screenshot_pairs_page ON visual_parity_screenshot_pairs(page_path, pair_status);

CREATE TABLE IF NOT EXISTS visual_polish_screenshot_jobs (
  visual_polish_screenshot_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  viewport_label TEXT NOT NULL DEFAULT 'mobile_390',
  job_status TEXT NOT NULL DEFAULT 'queued',
  evidence_page TEXT NOT NULL DEFAULT '/admin/dark-theme-evidence/',
  dark_theme_required INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_visual_polish_screenshot_jobs_status ON visual_polish_screenshot_jobs(job_status, page_path);

CREATE TABLE IF NOT EXISTS local_seo_visual_candidate_badges (
  local_seo_visual_candidate_badge_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  badge_label TEXT,
  badge_status TEXT NOT NULL DEFAULT 'prepared',
  candidate_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(page_path)
);

CREATE TABLE IF NOT EXISTS public_page_image_slot_assignments (
  public_page_image_slot_assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  slot_key TEXT NOT NULL,
  visual_enrichment_candidate_id INTEGER,
  media_asset_id INTEGER,
  assignment_status TEXT NOT NULL DEFAULT 'draft',
  h1_change_allowed INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  alt_text TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(page_path, slot_key)
);
CREATE INDEX IF NOT EXISTS idx_public_page_image_slot_assignments_status ON public_page_image_slot_assignments(assignment_status, page_path);

CREATE TABLE IF NOT EXISTS media_compression_budget_reports (
  media_compression_budget_report_id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'visual_candidate',
  source_id INTEGER,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  budget_status TEXT NOT NULL DEFAULT 'unknown_size',
  max_size_bytes INTEGER NOT NULL DEFAULT 350000,
  recommended_action TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS visual_diff_overlay_pairs (
  visual_diff_overlay_pair_id INTEGER PRIMARY KEY AUTOINCREMENT,
  screenshot_pair_id INTEGER,
  page_path TEXT NOT NULL,
  previous_image_url TEXT,
  current_image_url TEXT,
  overlay_status TEXT NOT NULL DEFAULT 'needs_review',
  difference_score INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS visual_candidate_alt_text_suggestions (
  visual_candidate_alt_text_suggestion_id INTEGER PRIMARY KEY AUTOINCREMENT,
  visual_enrichment_candidate_id INTEGER,
  page_path TEXT NOT NULL,
  suggested_alt_text TEXT NOT NULL,
  suggestion_status TEXT NOT NULL DEFAULT 'draft',
  copied_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS schema_validation_result_imports (
  schema_validation_result_import_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL DEFAULT 'LocalBusiness',
  validator_name TEXT NOT NULL DEFAULT 'manual',
  validation_status TEXT NOT NULL DEFAULT 'needs_import',
  issue_count INTEGER NOT NULL DEFAULT 0,
  imported_by_user_id INTEGER,
  imported_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS json_db_ownership_decisions (
  json_db_ownership_decision_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_table TEXT,
  ownership_status TEXT NOT NULL DEFAULT 'needs_decision',
  decision_reason TEXT,
  decided_by_user_id INTEGER,
  decided_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_path, target_table)
);

CREATE TABLE IF NOT EXISTS public_api_fallback_preview_cards (
  public_api_fallback_preview_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint_path TEXT NOT NULL,
  customer_message TEXT NOT NULL,
  fallback_status TEXT NOT NULL DEFAULT 'prepared',
  preview_context TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS mobile_visual_candidate_quick_cards (
  mobile_visual_candidate_quick_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  visual_enrichment_candidate_id INTEGER,
  page_path TEXT NOT NULL,
  quick_card_status TEXT NOT NULL DEFAULT 'ready_for_phone_review',
  tap_target_ok INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS seasonal_visual_campaigns (
  seasonal_visual_campaign_id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_key TEXT NOT NULL UNIQUE,
  campaign_label TEXT NOT NULL,
  campaign_status TEXT NOT NULL DEFAULT 'planning',
  page_path TEXT,
  image_need_count INTEGER NOT NULL DEFAULT 3,
  local_seo_phrase TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS gallery_hero_rotation_queue (
  gallery_hero_rotation_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL DEFAULT '/gallery/',
  media_asset_id INTEGER,
  image_url TEXT,
  alt_text TEXT,
  rotation_status TEXT NOT NULL DEFAULT 'candidate',
  sort_order INTEGER NOT NULL DEFAULT 0,
  approved_media_only INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS product_detail_visual_polish_checks (
  product_detail_visual_polish_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  product_slug TEXT,
  thumbnail_strip_status TEXT NOT NULL DEFAULT 'needs_review',
  featured_image_status TEXT NOT NULL DEFAULT 'needs_review',
  image_roles_status TEXT NOT NULL DEFAULT 'needs_review',
  mobile_zoom_status TEXT NOT NULL DEFAULT 'needs_review',
  issue_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS css_token_drift_checks (
  css_token_drift_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_key TEXT NOT NULL,
  expected_value TEXT,
  detected_value TEXT,
  drift_status TEXT NOT NULL DEFAULT 'prepared',
  token_group TEXT NOT NULL DEFAULT 'visual',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS visual_accessibility_notes (
  visual_accessibility_note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  note_kind TEXT NOT NULL DEFAULT 'motion_contrast_touch',
  note_status TEXT NOT NULL DEFAULT 'prepared',
  note_text TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS safe_deploy_json_ownership_exports (
  safe_deploy_json_ownership_export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 183',
  source_path TEXT NOT NULL,
  target_table TEXT,
  ownership_status TEXT NOT NULL DEFAULT 'documented',
  export_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public_low_bandwidth_preferences (
  public_low_bandwidth_preference_id INTEGER PRIMARY KEY AUTOINCREMENT,
  preference_key TEXT NOT NULL UNIQUE,
  preference_status TEXT NOT NULL DEFAULT 'available',
  default_value TEXT NOT NULL DEFAULT 'auto',
  customer_label TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS final_visual_deployment_report_rows (
  final_visual_deployment_report_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 183',
  row_kind TEXT NOT NULL,
  row_status TEXT NOT NULL DEFAULT 'prepared',
  row_summary TEXT NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO public_low_bandwidth_preferences (preference_key, preference_status, default_value, customer_label, created_at, notes)
SELECT 'public_low_bandwidth_mode', 'available', 'auto', 'Lighter images and quieter visual effects', CURRENT_TIMESTAMP, 'Customer-facing lighter media preference saved in browser storage and prepared for future account preference sync.'
WHERE NOT EXISTS (SELECT 1 FROM public_low_bandwidth_preferences WHERE preference_key='public_low_bandwidth_mode');

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_183_visual_enrichment_studio', 'database_build183_visual_enrichment_studio.sql', CURRENT_TIMESTAMP, 'Safe additive Build 183 schema for real visual enrichment workflow: media picker assets, screenshot pairs, image slots, compression budgets, alt-text suggestions, schema imports, JSON ownership, mobile quick cards, seasonal campaigns, gallery rotation, product visual checks, CSS token drift, low-bandwidth mode, and final visual deployment report rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

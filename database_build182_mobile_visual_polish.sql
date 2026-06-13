-- Devil n Dove Build 182 — mobile/desktop parity, visual polish, SEO enrichment, and fallback safety
-- Safe additive D1 migration. Run after database_build181_live_ops_followthrough.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS desktop_mobile_parity_checks (
  desktop_mobile_parity_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  viewport_label TEXT NOT NULL DEFAULT 'mobile_390',
  check_status TEXT NOT NULL DEFAULT 'needs_review',
  desktop_note TEXT,
  mobile_note TEXT,
  issue_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_desktop_mobile_parity_page ON desktop_mobile_parity_checks(page_path, viewport_label, check_status);

CREATE TABLE IF NOT EXISTS visual_enrichment_candidates (
  visual_enrichment_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  candidate_key TEXT NOT NULL,
  visual_kind TEXT NOT NULL DEFAULT 'image_slot',
  candidate_status TEXT NOT NULL DEFAULT 'needs_review',
  placement_selector TEXT,
  asset_hint TEXT,
  alt_text_hint TEXT,
  motion_safety TEXT NOT NULL DEFAULT 'reduced_motion_safe',
  local_seo_phrase TEXT,
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(page_path, candidate_key)
);
CREATE INDEX IF NOT EXISTS idx_visual_enrichment_candidates_status ON visual_enrichment_candidates(candidate_status, page_path);

CREATE TABLE IF NOT EXISTS visual_effect_safety_reviews (
  visual_effect_safety_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  effect_key TEXT NOT NULL,
  effect_status TEXT NOT NULL DEFAULT 'allowed_with_reduced_motion',
  affected_selector TEXT,
  prefers_reduced_motion_supported INTEGER NOT NULL DEFAULT 1,
  contrast_review_status TEXT NOT NULL DEFAULT 'passed_static',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS mobile_nav_touch_target_audits (
  mobile_nav_touch_target_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  target_selector TEXT NOT NULL DEFAULT '.nav a, .nav button, .btn',
  min_target_px INTEGER NOT NULL DEFAULT 44,
  audit_status TEXT NOT NULL DEFAULT 'prepared',
  issue_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_mobile_nav_touch_audits_page ON mobile_nav_touch_target_audits(page_path, created_at);

CREATE TABLE IF NOT EXISTS css_drift_review_runs (
  css_drift_review_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 182',
  css_path TEXT NOT NULL DEFAULT 'css/styles.css',
  open_brace_count INTEGER NOT NULL DEFAULT 0,
  close_brace_count INTEGER NOT NULL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public_page_visual_asset_budgets (
  public_page_visual_asset_budget_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  budget_status TEXT NOT NULL DEFAULT 'prepared',
  max_inline_effects INTEGER NOT NULL DEFAULT 3,
  max_new_images INTEGER NOT NULL DEFAULT 2,
  preferred_image_ratio TEXT NOT NULL DEFAULT '4:3 or square',
  lazy_loading_required INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_public_visual_asset_budgets_page ON public_page_visual_asset_budgets(page_path, budget_status);

CREATE TABLE IF NOT EXISTS route_fallback_review_rows (
  route_fallback_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  fallback_kind TEXT NOT NULL DEFAULT 'static_or_cached_message',
  fallback_status TEXT NOT NULL DEFAULT 'needs_live_review',
  user_message TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_route_fallback_review_rows_route ON route_fallback_review_rows(route_path, fallback_status);

CREATE TABLE IF NOT EXISTS schema_markup_validation_queue (
  schema_markup_validation_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL DEFAULT 'LocalBusiness',
  validation_status TEXT NOT NULL DEFAULT 'queued',
  source_hint TEXT NOT NULL DEFAULT 'static_jsonld',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_schema_markup_validation_queue_page ON schema_markup_validation_queue(page_path, schema_type, validation_status);

CREATE TABLE IF NOT EXISTS json_db_migration_candidates (
  json_db_migration_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_table TEXT,
  ownership_status TEXT NOT NULL DEFAULT 'needs_decision',
  duplication_risk TEXT NOT NULL DEFAULT 'medium',
  migration_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_json_db_migration_candidates_source ON json_db_migration_candidates(source_path, ownership_status);

CREATE TABLE IF NOT EXISTS visual_polish_admin_preferences (
  visual_polish_admin_preference_id INTEGER PRIMARY KEY AUTOINCREMENT,
  preference_key TEXT NOT NULL UNIQUE,
  preference_value TEXT,
  preference_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO visual_polish_admin_preferences (preference_key, preference_value, preference_status, created_at, notes)
SELECT 'default_viewport_pair', 'desktop_1440,mobile_390', 'active', CURRENT_TIMESTAMP, 'Build 182 default desktop/mobile review pair.'
WHERE NOT EXISTS (SELECT 1 FROM visual_polish_admin_preferences WHERE preference_key='default_viewport_pair');
INSERT INTO visual_polish_admin_preferences (preference_key, preference_value, preference_status, created_at, notes)
SELECT 'motion_policy', 'subtle_only_respect_reduced_motion', 'active', CURRENT_TIMESTAMP, 'Only subtle visual effects; CSS must respect prefers-reduced-motion.'
WHERE NOT EXISTS (SELECT 1 FROM visual_polish_admin_preferences WHERE preference_key='motion_policy');

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_182_mobile_visual_polish', 'database_build182_mobile_visual_polish.sql', CURRENT_TIMESTAMP, 'Safe additive Build 182 schema for desktop/mobile parity checks, visual enrichment candidates, CSS drift rows, SEO structured-data validation queue, fallback review rows, and JSON-to-D1 ownership candidates.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

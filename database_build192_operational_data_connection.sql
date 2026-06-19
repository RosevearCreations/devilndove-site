-- Devil n Dove Build 192 — Operational Data Connection and Live Proof Controls
-- Safe additive D1 migration. Run after database_build191_value_operations_followthrough.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS value_ops_next_snapshots (
  value_ops_next_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_label TEXT NOT NULL DEFAULT 'Build 192 follow-through',
  fee_configured_count INTEGER NOT NULL DEFAULT 0,
  fee_needs_review_count INTEGER NOT NULL DEFAULT 0,
  cost_configured_count INTEGER NOT NULL DEFAULT 0,
  cost_needs_review_count INTEGER NOT NULL DEFAULT 0,
  r2_derivative_open_count INTEGER NOT NULL DEFAULT 0,
  mobile_upload_open_count INTEGER NOT NULL DEFAULT 0,
  duplicate_candidate_count INTEGER NOT NULL DEFAULT 0,
  seo_schedule_open_count INTEGER NOT NULL DEFAULT 0,
  gbp_evidence_count INTEGER NOT NULL DEFAULT 0,
  performance_import_open_count INTEGER NOT NULL DEFAULT 0,
  legacy_admin_review_count INTEGER NOT NULL DEFAULT 0,
  snapshot_status TEXT NOT NULL DEFAULT 'needs_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS fee_cost_change_audit_rows (
  fee_cost_change_audit_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_kind TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  previous_json TEXT NOT NULL DEFAULT '{}',
  next_json TEXT NOT NULL DEFAULT '{}',
  change_reason TEXT,
  effective_date TEXT,
  changed_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fee_cost_audit_key ON fee_cost_change_audit_rows(setting_kind, setting_key, created_at DESC);

CREATE TABLE IF NOT EXISTS r2_derivative_worker_readiness_checks (
  r2_derivative_worker_readiness_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_key TEXT NOT NULL UNIQUE,
  check_label TEXT NOT NULL,
  check_status TEXT NOT NULL DEFAULT 'needs_review',
  expected_binding TEXT,
  route_path TEXT,
  evidence_url TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS mobile_resumable_upload_sessions (
  mobile_resumable_upload_session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_key TEXT NOT NULL UNIQUE,
  draft_key TEXT,
  user_id INTEGER,
  product_id INTEGER,
  device_key TEXT,
  file_name TEXT,
  mime_type TEXT,
  expected_bytes INTEGER NOT NULL DEFAULT 0,
  uploaded_bytes INTEGER NOT NULL DEFAULT 0,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  upload_status TEXT NOT NULL DEFAULT 'created',
  conflict_status TEXT NOT NULL DEFAULT 'not_checked',
  r2_object_key TEXT,
  client_started_at TEXT,
  last_client_sync_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_mobile_resumable_status ON mobile_resumable_upload_sessions(upload_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS mobile_draft_conflict_reviews (
  mobile_draft_conflict_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_key TEXT NOT NULL,
  local_version_at TEXT,
  server_version_at TEXT,
  conflict_status TEXT NOT NULL DEFAULT 'needs_review',
  chosen_resolution TEXT,
  resolved_by_user_id INTEGER,
  resolved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(draft_key, local_version_at, server_version_at)
);

CREATE TABLE IF NOT EXISTS approved_media_replacement_plan_rows (
  approved_media_replacement_plan_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  placeholder_asset_path TEXT,
  desired_media_role TEXT NOT NULL,
  approved_media_url TEXT,
  consent_status TEXT NOT NULL DEFAULT 'not_required',
  public_use_status TEXT NOT NULL DEFAULT 'needs_review',
  compression_status TEXT NOT NULL DEFAULT 'needs_review',
  alt_text_status TEXT NOT NULL DEFAULT 'needs_review',
  mobile_review_status TEXT NOT NULL DEFAULT 'needs_review',
  publication_status TEXT NOT NULL DEFAULT 'candidate',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(route_path, desired_media_role)
);
CREATE INDEX IF NOT EXISTS idx_media_replacement_status ON approved_media_replacement_plan_rows(publication_status, route_path);

CREATE TABLE IF NOT EXISTS search_console_import_schedules (
  search_console_import_schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_key TEXT NOT NULL UNIQUE,
  schedule_label TEXT NOT NULL,
  import_source TEXT NOT NULL DEFAULT 'manual_csv',
  expected_frequency TEXT NOT NULL DEFAULT 'monthly',
  target_report TEXT NOT NULL DEFAULT 'performance_pages_queries',
  last_import_at TEXT,
  next_due_at TEXT,
  schedule_status TEXT NOT NULL DEFAULT 'open',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS google_business_profile_evidence_records (
  google_business_profile_evidence_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_month TEXT NOT NULL,
  evidence_key TEXT NOT NULL,
  evidence_label TEXT NOT NULL,
  page_path TEXT,
  evidence_url TEXT,
  observed_value TEXT,
  observation_status TEXT NOT NULL DEFAULT 'recorded',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(observation_month, evidence_key, page_path)
);

CREATE TABLE IF NOT EXISTS customer_duplicate_merge_candidates (
  customer_duplicate_merge_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_key TEXT NOT NULL UNIQUE,
  match_kind TEXT NOT NULL DEFAULT 'email',
  match_value TEXT NOT NULL,
  source_summary_json TEXT NOT NULL DEFAULT '{}',
  confidence_score INTEGER NOT NULL DEFAULT 0,
  merge_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_customer_duplicate_status ON customer_duplicate_merge_candidates(merge_status, confidence_score DESC);

CREATE TABLE IF NOT EXISTS provider_live_test_runs (
  provider_live_test_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_key TEXT NOT NULL,
  test_kind TEXT NOT NULL DEFAULT 'configuration_presence',
  test_status TEXT NOT NULL DEFAULT 'not_run',
  request_reference TEXT,
  response_summary TEXT,
  secret_value_exposed INTEGER NOT NULL DEFAULT 0,
  tested_by_user_id INTEGER,
  tested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_provider_live_tests ON provider_live_test_runs(provider_key, test_kind, tested_at DESC);

CREATE TABLE IF NOT EXISTS lighthouse_import_schedules (
  lighthouse_import_schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  device_profile TEXT NOT NULL DEFAULT 'mobile',
  expected_frequency TEXT NOT NULL DEFAULT 'monthly',
  last_import_at TEXT,
  next_due_at TEXT,
  schedule_status TEXT NOT NULL DEFAULT 'open',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(route_path, device_profile)
);

CREATE TABLE IF NOT EXISTS legacy_admin_usage_rows (
  legacy_admin_usage_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL UNIQUE,
  route_label TEXT NOT NULL,
  command_center_area TEXT,
  last_used_at TEXT,
  usage_count_30d INTEGER NOT NULL DEFAULT 0,
  consolidation_status TEXT NOT NULL DEFAULT 'needs_usage_data',
  recommended_destination TEXT DEFAULT '/admin/command-center/',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS admin_consolidation_recommendations (
  admin_consolidation_recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL UNIQUE,
  recommendation_status TEXT NOT NULL DEFAULT 'needs_usage_data',
  recommended_action TEXT NOT NULL DEFAULT 'keep_until_usage_data_confirms',
  replacement_route TEXT DEFAULT '/admin/command-center/',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO r2_derivative_worker_readiness_checks (check_key,check_label,expected_binding,route_path,notes) VALUES
('binding_product_media_bucket','PRODUCT_MEDIA_BUCKET binding is present','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Required before real derivative generation.'),
('webp_generation','WebP derivative generation succeeds','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Create a tiny test object and confirm WebP output.'),
('avif_generation','AVIF derivative generation succeeds','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Optional but valuable for modern browsers.'),
('srcset_writeback','Generated srcset writes back to product/image records','DB','/admin/command-center/','Do not publish responsive markup until srcset has verified URLs.'),
('delete_cleanup','Derivative cleanup deletes test objects','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Prevents abandoned test files in R2.')
ON CONFLICT(check_key) DO UPDATE SET check_label=excluded.check_label,expected_binding=excluded.expected_binding,route_path=excluded.route_path,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO search_console_import_schedules (schedule_key,schedule_label,import_source,expected_frequency,target_report,next_due_at,notes) VALUES
('monthly_pages_queries','Monthly Search Console pages + queries CSV','manual_csv','monthly','performance_pages_queries',date('now','+30 days'),'Export Search Console performance data and validate headers before import.'),
('weekly_top_pages','Weekly top pages opportunity review','manual_csv','weekly','top_pages',date('now','+7 days'),'Review pages with impressions but weak clicks/CTR.'),
('quarterly_image_search','Quarterly image-search opportunity review','manual_csv','quarterly','image_search',date('now','+90 days'),'Check product/visual pages for image discovery opportunities.')
ON CONFLICT(schedule_key) DO UPDATE SET schedule_label=excluded.schedule_label,next_due_at=excluded.next_due_at,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO lighthouse_import_schedules (route_path,device_profile,next_due_at,notes) VALUES
('/','mobile',date('now','+30 days'),'Import PageSpeed/Lighthouse mobile evidence after deploy.'),
('/','desktop',date('now','+30 days'),'Import PageSpeed/Lighthouse desktop evidence after deploy.'),
('/shop/','mobile',date('now','+30 days'),'Shop page must stay fast despite visuals.'),
('/shop/','desktop',date('now','+30 days'),'Desktop shop grid should avoid layout drift.'),
('/gallery/','mobile',date('now','+30 days'),'Gallery proof images need compression and stable layout.'),
('/admin/command-center/','desktop',date('now','+30 days'),'Admin dashboard should remain usable on desktop.')
ON CONFLICT(route_path,device_profile) DO UPDATE SET next_due_at=excluded.next_due_at,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO legacy_admin_usage_rows (route_path,route_label,command_center_area,recommended_destination,notes) VALUES
('/admin/readiness/','Product Readiness','products','/admin/command-center/','Keep until Command Center shows equal or better daily product readiness workflow.'),
('/admin/visual-polish/','Visual Polish','visuals','/admin/command-center/','Keep until real media replacement workflow is fully integrated.'),
('/admin/visual-enrichment-studio/','Visual Enrichment Studio','visuals','/admin/command-center/','Keep for detailed visual work; Command Center should summarize.'),
('/admin/live-ops-followthrough/','Live Ops Follow-through','deploy','/admin/command-center/','Keep until live verification cards move fully into Command Center.'),
('/admin/go-live-execution/','Go-Live Execution','deploy','/admin/command-center/','Keep for final release gates; summarize in Command Center.'),
('/admin/application-sanity/','Application Sanity','planning','/admin/command-center/','Keep as reference until usage data confirms it is not needed often.'),
('/admin/markdown-sanity/','Markdown Sanity','planning','/admin/command-center/','Keep for documentation reviews; avoid deleting until handoff is stable.')
ON CONFLICT(route_path) DO UPDATE SET route_label=excluded.route_label,command_center_area=excluded.command_center_area,recommended_destination=excluded.recommended_destination,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO admin_consolidation_recommendations (route_path,recommendation_status,recommended_action,replacement_route,notes) VALUES
('/admin/readiness/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/visual-polish/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/visual-enrichment-studio/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/live-ops-followthrough/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/go-live-execution/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/application-sanity/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/markdown-sanity/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.')
ON CONFLICT(route_path) DO UPDATE SET recommendation_status=excluded.recommendation_status,recommended_action=excluded.recommended_action,replacement_route=excluded.replacement_route,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO approved_media_replacement_plan_rows (route_path,placeholder_asset_path,desired_media_role,notes,sort_order) VALUES
('/','/assets/visual-placeholders/workshop-process.svg','homepage_workshop_process','Replace with approved real workshop process photo.',10),
('/shop/','/assets/visual-placeholders/product-detail.svg','shop_product_detail','Replace with approved representative product photo.',20),
('/gallery/','/assets/visual-placeholders/before-after.svg','gallery_before_after','Replace with consented before/after proof.',30),
('/handmade-jewelry-ontario/','/assets/visual-placeholders/jewelry-macro.svg','jewelry_macro','Replace with approved jewelry macro photo.',40),
('/custom-candle-making-ontario/','/assets/visual-placeholders/candle-colour.svg','candle_colour','Replace with approved candle colour/process photo.',50),
('/custom-soap-making-ontario/','/assets/visual-placeholders/soap-texture.svg','soap_texture','Replace with approved soap texture/process photo.',60),
('/laser-engraving-ontario/','/assets/visual-placeholders/engraving-proof.svg','engraving_proof','Replace with approved engraving proof photo.',70),
('/vintage-finds-ontario/','/assets/visual-placeholders/vintage-condition.svg','vintage_condition','Replace with approved vintage condition photo.',80)
ON CONFLICT(route_path,desired_media_role) DO UPDATE SET placeholder_asset_path=excluded.placeholder_asset_path,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build_192_operational_data_connection',
  'database_build192_operational_data_connection.sql',
  CURRENT_TIMESTAMP,
  'Adds Build 192 follow-through records for real fee/cost audit, R2 derivative readiness, resumable mobile upload sessions and conflicts, approved real-media replacement planning, scheduled Search Console imports, GBP evidence, customer duplicate review, provider live-test records, Lighthouse schedules, and legacy admin consolidation telemetry.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;

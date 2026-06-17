-- Devil n Dove Build 189 — Value Ops Live Counts and Customer Funnel Controls
-- Safe additive D1 migration. Run after database_build186_markdown_consolidation_visual_placeholders.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS command_center_live_count_runs (
  command_center_live_count_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 189',
  run_status TEXT NOT NULL DEFAULT 'ok',
  total_products INTEGER NOT NULL DEFAULT 0,
  blocked_products INTEGER NOT NULL DEFAULT 0,
  open_orders INTEGER NOT NULL DEFAULT 0,
  checkout_starts INTEGER NOT NULL DEFAULT 0,
  orders_created INTEGER NOT NULL DEFAULT 0,
  seo_rows INTEGER NOT NULL DEFAULT 0,
  visual_rows INTEGER NOT NULL DEFAULT 0,
  performance_rows INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_command_center_live_runs_created ON command_center_live_count_runs(created_at DESC, run_status);

CREATE TABLE IF NOT EXISTS mobile_product_autosave_recovery_snapshots (
  mobile_product_autosave_recovery_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_key TEXT NOT NULL UNIQUE,
  route_path TEXT NOT NULL DEFAULT '/admin/mobile-product/',
  draft_status TEXT NOT NULL DEFAULT 'browser_local_recovery',
  field_count INTEGER NOT NULL DEFAULT 0,
  image_count INTEGER NOT NULL DEFAULT 0,
  latest_saved_at TEXT,
  recovered_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_mobile_autosave_recovery_status ON mobile_product_autosave_recovery_snapshots(draft_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS approved_visual_replacement_candidates (
  approved_visual_replacement_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  placeholder_asset TEXT,
  desired_real_media TEXT,
  approval_status TEXT NOT NULL DEFAULT 'needs_real_approved_photo',
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  alt_text_suggestion TEXT,
  performance_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(route_path, placeholder_asset)
);
CREATE INDEX IF NOT EXISTS idx_visual_replacement_status ON approved_visual_replacement_candidates(approval_status, consent_status, route_path);

CREATE TABLE IF NOT EXISTS local_seo_observation_rows (
  local_seo_observation_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  observation_source TEXT NOT NULL DEFAULT 'manual',
  observation_label TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  average_position REAL NOT NULL DEFAULT 0,
  google_business_profile_note TEXT,
  observed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_local_seo_observations_page ON local_seo_observation_rows(page_path, observed_at DESC);

CREATE TABLE IF NOT EXISTS product_cost_margin_review_rows (
  product_cost_margin_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  product_label TEXT,
  material_cost_cents INTEGER NOT NULL DEFAULT 0,
  labour_cost_cents INTEGER NOT NULL DEFAULT 0,
  marketplace_fee_cents INTEGER NOT NULL DEFAULT 0,
  suggested_price_cents INTEGER NOT NULL DEFAULT 0,
  current_price_cents INTEGER NOT NULL DEFAULT 0,
  margin_status TEXT NOT NULL DEFAULT 'needs_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_product_cost_margin_status ON product_cost_margin_review_rows(margin_status, product_id);

INSERT INTO approved_visual_replacement_candidates (route_path, placeholder_asset, desired_real_media, alt_text_suggestion, performance_note)
VALUES
('/', '/assets/visual-placeholders/workshop-process.svg', 'Approved real shop/process hero photo', 'Southern Ontario handmade gift workshop process photo', 'Compress before publishing; keep one H1 and low-bandwidth mode.'),
('/shop/', '/assets/visual-placeholders/product-detail.svg', 'Approved product collection photo', 'Devil n Dove product collection preview', 'Compress before publishing; use lazy loading.'),
('/gallery/', '/assets/visual-placeholders/before-after.svg', 'Approved before/after maker proof', 'Before and after workshop proof image', 'Use thumbnail versions for gallery speed.'),
('/custom-gifts-southern-ontario/', '/assets/visual-placeholders/before-after.svg', 'Approved custom gift process photo', 'Custom gift process proof in Southern Ontario', 'Consent review required before public use.'),
('/handmade-jewelry-ontario/', '/assets/visual-placeholders/jewelry-macro.svg', 'Approved jewelry macro detail', 'Handmade jewelry close-up detail', 'Crop square or 4:5 for mobile cards.'),
('/laser-engraving-ontario/', '/assets/visual-placeholders/engraving-proof.svg', 'Approved engraving example photo', 'Laser engraved material example', 'Show material examples near request CTA.'),
('/custom-candle-making-ontario/', '/assets/visual-placeholders/candle-colour.svg', 'Approved candle colour/scent photo', 'Custom candle colour and scent example', 'Avoid medical/aromatherapy claims.'),
('/custom-soap-making-ontario/', '/assets/visual-placeholders/soap-texture.svg', 'Approved soap texture/ingredient photo', 'Custom soap texture and ingredient example', 'Avoid medical claims; include allergen clarity.'),
('/vintage-finds-ontario/', '/assets/visual-placeholders/vintage-condition.svg', 'Approved vintage condition photo', 'Vintage find condition detail', 'Show wear/condition honestly.')
ON CONFLICT(route_path, placeholder_asset) DO UPDATE SET desired_real_media=excluded.desired_real_media, alt_text_suggestion=excluded.alt_text_suggestion, performance_note=excluded.performance_note, updated_at=CURRENT_TIMESTAMP;

INSERT INTO local_seo_observation_rows (page_path, observation_source, observation_label, notes)
VALUES
('/', 'manual', 'GBP and Search Console observation placeholder', 'Add real Search Console clicks/impressions and Google Business Profile notes after deployment.'),
('/custom-gifts-southern-ontario/', 'manual', 'Custom gifts local ranking check', 'Record manual ranking checks and GBP observations here.'),
('/handmade-jewelry-ontario/', 'manual', 'Handmade jewelry local ranking check', 'Pair impressions/clicks with approved product proof images.'),
('/laser-engraving-ontario/', 'manual', 'Laser engraving local ranking check', 'Track relevant search phrases, not just generic traffic.')
;

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_189_value_ops_live_counts', 'database_build189_value_ops_live_counts.sql', CURRENT_TIMESTAMP, 'Adds live Command Center count run rows, mobile autosave recovery rows, approved visual replacement candidates, local SEO observation rows, and product margin review rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

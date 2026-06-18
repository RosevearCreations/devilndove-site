-- Devil n Dove Build 191 — Value Operations Follow-through
-- Safe additive D1 migration. Run after database_build190_integrated_value_operations.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS marketplace_channel_fee_settings (
  marketplace_channel_fee_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_key TEXT NOT NULL UNIQUE,
  channel_label TEXT NOT NULL,
  percent_rate REAL NOT NULL DEFAULT 0,
  fixed_fee_cents INTEGER NOT NULL DEFAULT 0,
  payment_percent_rate REAL NOT NULL DEFAULT 0,
  payment_fixed_fee_cents INTEGER NOT NULL DEFAULT 0,
  advertising_percent_rate REAL NOT NULL DEFAULT 0,
  reserve_percent_rate REAL NOT NULL DEFAULT 0,
  calculation_status TEXT NOT NULL DEFAULT 'needs_configuration',
  effective_date TEXT,
  source_note TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS product_family_cost_defaults (
  product_family_cost_default_id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_key TEXT NOT NULL UNIQUE,
  family_label TEXT NOT NULL,
  material_cost_cents INTEGER NOT NULL DEFAULT 0,
  labour_minutes INTEGER NOT NULL DEFAULT 0,
  labour_rate_cents_per_hour INTEGER NOT NULL DEFAULT 0,
  packaging_cost_cents INTEGER NOT NULL DEFAULT 0,
  overhead_percent REAL NOT NULL DEFAULT 0,
  waste_percent REAL NOT NULL DEFAULT 0,
  default_channel_key TEXT,
  calculation_status TEXT NOT NULL DEFAULT 'needs_configuration',
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS marketplace_margin_override_history (
  marketplace_margin_override_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  channel_key TEXT NOT NULL,
  margin_status TEXT NOT NULL DEFAULT 'blocked',
  requested_reason TEXT,
  requested_by_user_id INTEGER,
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by_user_id INTEGER,
  approved_at TEXT,
  expires_at TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_marketplace_margin_override_product ON marketplace_margin_override_history(product_id, channel_key, approval_status, expires_at);

CREATE TABLE IF NOT EXISTS customer_timeline_admin_notes (
  customer_timeline_admin_note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_key TEXT NOT NULL,
  customer_email TEXT,
  note_text TEXT NOT NULL,
  visibility_scope TEXT NOT NULL DEFAULT 'admin_private',
  note_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customer_timeline_notes_key ON customer_timeline_admin_notes(customer_key, created_at DESC);

CREATE TABLE IF NOT EXISTS customer_story_output_drafts (
  customer_story_output_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_story_approval_batch_id INTEGER,
  source_kind TEXT NOT NULL,
  source_record_id INTEGER,
  product_id INTEGER,
  customer_key TEXT,
  consent_evidence_url TEXT,
  product_story_title TEXT,
  product_story_body TEXT,
  trust_block_body TEXT,
  gallery_caption TEXT,
  social_snippet TEXT,
  output_status TEXT NOT NULL DEFAULT 'draft',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_customer_story_output_status ON customer_story_output_drafts(output_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS search_console_mapping_previews (
  search_console_mapping_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_file TEXT,
  detected_headers_json TEXT NOT NULL DEFAULT '[]',
  mapping_json TEXT NOT NULL DEFAULT '{}',
  sample_rows_json TEXT NOT NULL DEFAULT '[]',
  validation_status TEXT NOT NULL DEFAULT 'needs_review',
  validation_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gbp_monthly_task_reminders (
  gbp_monthly_task_reminder_id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_month TEXT NOT NULL,
  task_key TEXT NOT NULL,
  task_label TEXT NOT NULL,
  page_path TEXT,
  task_status TEXT NOT NULL DEFAULT 'open',
  completed_at TEXT,
  completed_by_user_id INTEGER,
  evidence_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_month, task_key, page_path)
);

CREATE TABLE IF NOT EXISTS review_request_eligibility_rows (
  review_request_eligibility_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  customer_email TEXT,
  order_status TEXT,
  payment_status TEXT,
  fulfilled_at TEXT,
  eligible_after TEXT,
  eligibility_status TEXT NOT NULL DEFAULT 'needs_review',
  permission_status TEXT NOT NULL DEFAULT 'needs_review',
  cooldown_status TEXT NOT NULL DEFAULT 'not_checked',
  exclusion_reason TEXT,
  last_review_request_at TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approved_before_after_gallery_items (
  approved_before_after_gallery_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gallery_key TEXT NOT NULL UNIQUE,
  gallery_label TEXT NOT NULL,
  proof_kind TEXT NOT NULL DEFAULT 'before_after',
  route_context TEXT NOT NULL DEFAULT '/gallery/',
  product_id INTEGER,
  custom_request_id INTEGER,
  before_image_url TEXT,
  after_image_url TEXT,
  process_image_url TEXT,
  alt_text TEXT,
  story_note TEXT,
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  public_use_status TEXT NOT NULL DEFAULT 'needs_review',
  approval_status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_before_after_public ON approved_before_after_gallery_items(approval_status, public_use_status, consent_status, sort_order);

CREATE TABLE IF NOT EXISTS product_image_role_requirements (
  product_image_role_requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_key TEXT NOT NULL,
  role_key TEXT NOT NULL,
  role_label TEXT NOT NULL,
  role_description TEXT,
  minimum_count INTEGER NOT NULL DEFAULT 0,
  is_publish_blocker INTEGER NOT NULL DEFAULT 0,
  phone_prompt TEXT,
  desktop_prompt TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(family_key, role_key)
);

CREATE TABLE IF NOT EXISTS mobile_product_server_drafts (
  mobile_product_server_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_key TEXT NOT NULL UNIQUE,
  user_id INTEGER,
  device_key TEXT,
  route_path TEXT NOT NULL DEFAULT '/admin/mobile-product/',
  payload_json TEXT NOT NULL DEFAULT '{}',
  field_count INTEGER NOT NULL DEFAULT 0,
  image_count INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  client_saved_at TEXT,
  server_saved_at TEXT DEFAULT CURRENT_TIMESTAMP,
  recovered_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_mobile_server_drafts_user ON mobile_product_server_drafts(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS deployed_performance_measurements (
  deployed_performance_measurement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  measured_url TEXT,
  device_profile TEXT NOT NULL DEFAULT 'mobile',
  performance_score INTEGER,
  accessibility_score INTEGER,
  seo_score INTEGER,
  best_practices_score INTEGER,
  largest_contentful_paint_ms INTEGER,
  cumulative_layout_shift REAL,
  interaction_to_next_paint_ms INTEGER,
  total_transfer_bytes INTEGER,
  measurement_source TEXT NOT NULL DEFAULT 'manual_import',
  measured_at TEXT,
  imported_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_deployed_performance_route ON deployed_performance_measurements(route_path, device_profile, measured_at DESC);

CREATE TABLE IF NOT EXISTS responsive_image_publication_jobs (
  responsive_image_publication_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_image_url TEXT NOT NULL,
  source_record_kind TEXT,
  source_record_id INTEGER,
  route_context TEXT,
  target_widths_json TEXT NOT NULL DEFAULT '[480,768,1200,1600]',
  output_format TEXT NOT NULL DEFAULT 'webp',
  job_status TEXT NOT NULL DEFAULT 'queued',
  srcset_value TEXT,
  sizes_value TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_responsive_image_jobs_status ON responsive_image_publication_jobs(job_status, created_at DESC);

CREATE TABLE IF NOT EXISTS owner_daily_summary_exports (
  owner_daily_summary_export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  summary_date TEXT NOT NULL,
  summary_json TEXT NOT NULL DEFAULT '{}',
  export_format TEXT NOT NULL DEFAULT 'json',
  export_status TEXT NOT NULL DEFAULT 'generated',
  generated_by_user_id INTEGER,
  generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_owner_daily_summary_date ON owner_daily_summary_exports(summary_date DESC, generated_at DESC);

CREATE TABLE IF NOT EXISTS campaign_readiness_check_rows (
  campaign_readiness_check_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_key TEXT NOT NULL,
  check_key TEXT NOT NULL,
  check_label TEXT NOT NULL,
  check_status TEXT NOT NULL DEFAULT 'needs_review',
  evidence_url TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(campaign_key, check_key)
);

CREATE TABLE IF NOT EXISTS local_page_freshness_rows (
  local_page_freshness_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  last_content_update_at TEXT,
  last_product_proof_at TEXT,
  last_customer_proof_at TEXT,
  last_gbp_observation_month TEXT,
  freshness_status TEXT NOT NULL DEFAULT 'needs_review',
  next_review_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS real_device_qa_evidence (
  real_device_qa_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  device_label TEXT NOT NULL,
  viewport_width INTEGER,
  viewport_height INTEGER,
  browser_label TEXT,
  theme_mode TEXT NOT NULL DEFAULT 'light',
  qa_status TEXT NOT NULL DEFAULT 'needs_review',
  screenshot_url TEXT,
  issue_summary TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_real_device_qa_route ON real_device_qa_evidence(route_path, qa_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS live_environment_verification_runs (
  live_environment_verification_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  verification_scope TEXT NOT NULL DEFAULT 'bindings_and_providers',
  d1_status TEXT NOT NULL DEFAULT 'unchecked',
  r2_status TEXT NOT NULL DEFAULT 'unchecked',
  stripe_status TEXT NOT NULL DEFAULT 'unchecked',
  stripe_webhook_status TEXT NOT NULL DEFAULT 'unchecked',
  email_provider_status TEXT NOT NULL DEFAULT 'unchecked',
  cloudflare_api_status TEXT NOT NULL DEFAULT 'unchecked',
  overall_status TEXT NOT NULL DEFAULT 'needs_review',
  verified_by_user_id INTEGER,
  verified_at TEXT DEFAULT CURRENT_TIMESTAMP,
  details_json TEXT NOT NULL DEFAULT '{}',
  notes TEXT
);

INSERT INTO marketplace_channel_fee_settings (channel_key,channel_label,calculation_status,source_note,notes) VALUES
('onsite_stripe','Onsite Stripe','needs_configuration','Use the actual Stripe Canada pricing and account agreement.','Do not rely on an assumed percentage. Enter the current account-specific rate before using margin gates.'),
('etsy','Etsy','needs_configuration','Use current Etsy Canada listing, transaction, payment processing, ad, currency, tax, and regulatory fee details.','Fees can vary by country, ads, currency conversion, and account settings.'),
('facebook_meta','Facebook / Meta marketplace','needs_configuration','Use the active Meta commerce/marketplace terms for the selling method in use.','Manual local-sale and shipped-commerce fee structures can differ.'),
('paypal','PayPal','needs_configuration','Use the actual PayPal Canada merchant agreement and account rate.','Enter the current account-specific rate before enabling margin automation.'),
('manual_local','Manual local sale / pickup','needs_configuration','Enter actual cash/e-transfer/card processing assumptions.','Keep payment and packaging costs explicit.')
ON CONFLICT(channel_key) DO UPDATE SET channel_label=excluded.channel_label,source_note=excluded.source_note,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO product_family_cost_defaults (family_key,family_label,calculation_status,notes) VALUES
('jewelry','Jewelry','needs_configuration','Enter metal/findings, stones, labour, packaging, overhead, and expected scrap.'),
('engraving','Engraving','needs_configuration','Enter blank, masking, machine time, setup, finishing, packaging, and failed-piece allowance.'),
('candles','Candles','needs_configuration','Enter wax, vessel, wick, fragrance, dye, label, cure/storage, labour, and waste.'),
('soap','Soap','needs_configuration','Enter oils/base, fragrance, colour, additives, packaging, cure/storage, labour, and waste.'),
('vintage','Vintage / collectible','needs_configuration','Enter acquisition cost, cleaning, research, listing labour, packaging, and marketplace fees.'),
('mixed_media','Mixed media','needs_configuration','Enter materials, machine/hand labour, finishing, packaging, overhead, and waste.'),
('custom','Custom work','needs_configuration','Use quote-specific material, labour, setup, revisions, packaging, and contingency.')
ON CONFLICT(family_key) DO UPDATE SET family_label=excluded.family_label,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO product_image_role_requirements (family_key,role_key,role_label,role_description,minimum_count,is_publish_blocker,phone_prompt,desktop_prompt) VALUES
('all','hero','Hero image','Clear primary image showing the full item.',1,1,'Take one clear full-item photo first.','Select the strongest primary image.'),
('all','scale','Scale reference','Shows size in hand, beside a ruler, coin, or familiar object.',1,0,'Add one size/scale photo.','Add a measurement or scale reference.'),
('all','material','Material detail','Close-up of materials, texture, finish, or condition.',1,0,'Add one material close-up.','Add a material/texture detail.'),
('all','process','Process / workshop','Shows the honest making, restoration, or preparation process.',0,0,'Optional: add a process photo.','Add approved process proof where it helps trust.'),
('all','care','Care / use','Shows care, packaging, use, or handling instructions.',0,0,'Optional: add care/use photo.','Add care or use proof when relevant.'),
('vintage','condition','Condition detail','Shows wear, marks, maker marks, repairs, or age-related condition.',2,1,'Photograph every important condition detail.','Condition images are required for honest vintage listings.'),
('custom','before_after','Before / after','Shows customer-approved starting point and finished result.',0,0,'Add only with explicit public-use consent.','Link consent evidence before public placement.')
ON CONFLICT(family_key,role_key) DO UPDATE SET role_label=excluded.role_label,role_description=excluded.role_description,minimum_count=excluded.minimum_count,is_publish_blocker=excluded.is_publish_blocker,phone_prompt=excluded.phone_prompt,desktop_prompt=excluded.desktop_prompt,updated_at=CURRENT_TIMESTAMP;

INSERT INTO gbp_monthly_task_reminders (task_month,task_key,task_label,page_path,notes) VALUES
(strftime('%Y-%m','now'),'profile_accuracy','Review business hours, service area, categories, contact links, and appointment wording','/','Monthly manual review.'),
(strftime('%Y-%m','now'),'fresh_photos','Add or review approved recent product/workshop photos','/gallery/','Use real approved media; do not upload placeholders.'),
(strftime('%Y-%m','now'),'reviews','Review new customer reviews and responses','/reviews/','Respond honestly and avoid incentivized or fabricated reviews.'),
(strftime('%Y-%m','now'),'posts','Review whether a useful current product, event, or pickup update should be posted','/','Only publish accurate current information.'),
(strftime('%Y-%m','now'),'local_pages','Review local landing-page freshness and proof','/southern-ontario/','Keep wording useful and non-duplicative.')
ON CONFLICT(task_month,task_key,page_path) DO UPDATE SET task_label=excluded.task_label,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO campaign_readiness_check_rows (campaign_key,check_key,check_label,notes) VALUES
('holiday_gifts','inventory','Inventory and supply readiness','Confirm products and key supplies are available.'),
('holiday_gifts','approved_media','Approved real images','Use consented, compressed, mobile-reviewed images.'),
('holiday_gifts','seo','Titles, descriptions, internal links, and structured data','Keep visible copy and schema consistent.'),
('holiday_gifts','pickup_shipping','Pickup and shipping timing','State realistic order-by and pickup timing.'),
('holiday_gifts','social','Social drafts and source links','Use approved product/story sources.'),
('local_market','inventory','Market/pickup inventory','Confirm sale-ready quantities.'),
('local_market','approved_media','Local proof images','Use current real products and workshop proof.'),
('local_market','pickup_shipping','Pickup details','Use appointment/service-area wording accurately.')
ON CONFLICT(campaign_key,check_key) DO UPDATE SET check_label=excluded.check_label,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build_191_value_operations_followthrough',
  'database_build191_value_operations_followthrough.sql',
  CURRENT_TIMESTAMP,
  'Adds configurable channel fees, family cost defaults, margin overrides, customer notes, story outputs, Search Console mapping previews, GBP reminders, review eligibility, approved before/after galleries, image-role prompts, D1 mobile drafts, deployed performance imports, responsive image jobs, owner summaries, campaign readiness, local freshness, real-device QA, and environment verification.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;

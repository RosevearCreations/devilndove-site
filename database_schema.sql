-- Current cleanup sync 2026-05-10: active schema retained; database_upgrade_current_pass.sql was archived and reset for the next migration batch.
-- Current pass note: accounting now adds statement-import tables, reconciliation exceptions, fixed-asset groundwork, attachment-required month-close checks, export bundle v2 groundwork, and public colour-filter/catalog-preference support.
-- Current pass note: product records now support multi-colour storage using color_names_json while keeping color_name as the primary/filter field.
-- Current pass note: this storefront/discovery pass adds dedicated public Collections and Marketplaces pages, stronger sale-channel/provenance guidance, and broader internal linking without requiring new database tables.

-- Current pass reference note: products now also support merchandise_origin, sale_channel, external_listing_url, external_listing_label, condition_summary, era_label, and sourcing_notes so handmade, vintage, collectible, antique, oddity, and pre-built items can share the same catalog safely.
-- Current pass note: customer engagement workflow depth now includes purchaser-versus-recipient gift-card support, broader engagement queues, and storefront featured-testimonial placement.
-- Current pass note: phone-first finished-product entry now supports a lightweight wizard mode plus capture metadata for same-day draft review and safer bulk cleanup.
-- Current pass note: stock-unit versus usage-unit inventory handling was expanded for clearer craft-material costing and planning.
-- Current pass note: DD finished-product numbering now has a configurable start value in app_settings, defaulting to 1000 when older databases have not seeded the setting yet.
-- Current pass note: broad product repricing is now handled in code through the existing products table and admin bulk tooling; no new required schema tables were needed for this pass.
-- Current pass note: admin write-path resilience now extends beyond read-only fallback. Order status updates, manual payment recording, and refund/dispute actions log server-side incidents more defensively, while the order-detail UI can preserve failed admin writes locally for manual retry. Composite payment/refund/dispute indexes were added where those tables exist so health and follow-up queries stay responsive.
-- File: /database_schema.sql
-- Brief description: Core application auth and admin schema for the current Devil n Dove build.

-- Current pass note: phone product capture now resolves the shared D1 binding through DB or DD_DB and returns structured JSON failures instead of HTML parser breaks.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS admin_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id INTEGER,
  action TEXT,
  target_user_id INTEGER,
  target_type TEXT,
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);


CREATE TABLE IF NOT EXISTS auth_recovery_requests (
  auth_recovery_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_type TEXT NOT NULL CHECK (request_type IN ('forgot_password','forgot_email')),
  contact_email TEXT NOT NULL,
  possible_email TEXT,
  display_name TEXT,
  note TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_auth_recovery_requests_status_created_at ON auth_recovery_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_action_audit (
  admin_action_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  target_key TEXT,
  request_method TEXT,
  request_path TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_action_audit_created_at ON admin_action_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_action_audit_actor ON admin_action_audit(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_action_audit_target ON admin_action_audit(target_type, target_id, created_at DESC);


CREATE TABLE IF NOT EXISTS runtime_incidents (
  runtime_incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_scope TEXT,
  incident_code TEXT,
  severity TEXT DEFAULT 'warning',
  endpoint_path TEXT,
  request_method TEXT,
  message TEXT,
  details_json TEXT,
  related_user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  review_status TEXT DEFAULT 'open',
  admin_note TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_created_at ON runtime_incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_scope ON runtime_incidents(incident_scope, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_code_path ON runtime_incidents(incident_code, endpoint_path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_review_status_created ON runtime_incidents(review_status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_grouping ON runtime_incidents(severity, incident_scope, incident_code, endpoint_path, created_at DESC);




CREATE TABLE IF NOT EXISTS app_settings (
  app_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  updated_by_user_id INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);



-- Current pass: D1 migration ledger to track SQL files after they are run in Cloudflare D1.
CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','skipped','failed','pending_review')),
  destructive INTEGER NOT NULL DEFAULT 0,
  applied_by_user_id INTEGER,
  applied_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_status ON schema_migration_ledger(status, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_file ON schema_migration_ledger(file_name);

INSERT OR IGNORE INTO app_settings (setting_key, setting_value, is_public)
VALUES ('site.catalog.product_number_start', '1000', 0);


CREATE TABLE IF NOT EXISTS movie_catalog (
  movie_catalog_id INTEGER PRIMARY KEY AUTOINCREMENT,
  upc TEXT NOT NULL UNIQUE,
  slug TEXT,
  title TEXT,
  original_title TEXT,
  sort_title TEXT,
  summary TEXT,
  release_year INTEGER,
  media_format TEXT,
  genre TEXT,
  director_names TEXT,
  actor_names TEXT,
  front_image_url TEXT,
  back_image_url TEXT,
  runtime_minutes INTEGER,
  studio_name TEXT,
  trailer_url TEXT,
  imdb_id TEXT,
  alternate_identifier TEXT,
  metadata_status TEXT NOT NULL DEFAULT 'pending',
  metadata_source TEXT,
  estimated_value_low_cents INTEGER,
  estimated_value_high_cents INTEGER,
  estimated_value_currency TEXT,
  rarity_notes TEXT,
  collection_notes TEXT,
  value_search_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  featured_rank INTEGER,
  source_record_json TEXT,
  source_json_path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_movie_catalog_title ON movie_catalog(sort_title, title);
CREATE INDEX IF NOT EXISTS idx_movie_catalog_year ON movie_catalog(release_year);
CREATE INDEX IF NOT EXISTS idx_movie_catalog_status ON movie_catalog(status);
CREATE INDEX IF NOT EXISTS idx_movie_catalog_imdb_id ON movie_catalog(imdb_id);


-- Current pass note: the public movies page uses front_image_url/back_image_url from data/movies/movie_catalog_enriched.v2.json and can derive a trailer search URL at runtime when trailer_url is blank.


CREATE TABLE IF NOT EXISTS notification_outbox (
  notification_outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  destination TEXT,
  related_order_id INTEGER,
  related_payment_id INTEGER,
  payload_json TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','retry','sent','failed','cancelled')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_attempt_at TEXT,
  provider_message_id TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status ON notification_outbox(status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_order_payment ON notification_outbox(related_order_id, related_payment_id);


CREATE TABLE IF NOT EXISTS supplier_purchase_orders (
  supplier_purchase_order_id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','ordered','received','cancelled')),
  notes TEXT,
  total_estimated_cents INTEGER NOT NULL DEFAULT 0,
  ordered_applied_at TEXT,
  received_completed_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_supplier_purchase_orders_status ON supplier_purchase_orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS product_review_actions (
  product_review_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('approve','request_changes','publish','unpublish')),
  previous_review_status TEXT,
  new_review_status TEXT,
  previous_status TEXT,
  new_status TEXT,
  actor_user_id INTEGER,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_product_review_actions_product ON product_review_actions(product_id, created_at DESC);



-- Pass 16: departmental accounting + membership policy foundation
CREATE TABLE IF NOT EXISTS membership_tier_policies (
  membership_tier_policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_title TEXT,
  short_description TEXT,
  benefits_json TEXT,
  badge_color TEXT,
  is_visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS general_ledger_accounts (
  gl_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'expense',
  parent_group TEXT,
  normal_balance TEXT NOT NULL DEFAULT 'debit',
  sort_order INTEGER NOT NULL DEFAULT 0,
  gifi_code TEXT,
  gifi_label TEXT,
  gifi_section TEXT,
  gifi_review_state TEXT NOT NULL DEFAULT 'draft',
  gifi_review_note TEXT,
  gifi_reviewed_by_user_id INTEGER,
  gifi_reviewed_at TEXT,
  tax_deductibility_percent INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounting_vendors (
  accounting_vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_name TEXT NOT NULL UNIQUE,
  default_ledger_code TEXT,
  default_tax_percent REAL NOT NULL DEFAULT 0,
  payment_terms TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_vendors_active_name ON accounting_vendors(is_active, vendor_name);

CREATE TABLE IF NOT EXISTS accounting_expenses (
  expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_date TEXT,
  vendor_id INTEGER,
  vendor_name TEXT,
  amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  ledger_code TEXT,
  ledger_name TEXT,
  recurring_expense_rule_id INTEGER,
  source_mode TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_expenses_vendor ON accounting_expenses(vendor_id, vendor_name, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_expenses_recurring ON accounting_expenses(recurring_expense_rule_id, expense_date DESC);

CREATE TABLE IF NOT EXISTS accounting_recurring_expense_rules (
  recurring_expense_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER,
  vendor_name TEXT,
  rule_name TEXT NOT NULL,
  ledger_code TEXT,
  ledger_name TEXT,
  amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  due_day INTEGER,
  next_due_date TEXT,
  auto_create_mode TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_generated_at TEXT,
  last_generated_expense_id INTEGER,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_recurring_expense_rules_due ON accounting_recurring_expense_rules(is_active, next_due_date, frequency);

CREATE TABLE IF NOT EXISTS accounting_reconciliation_reviews (
  accounting_reconciliation_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  reconciliation_type TEXT NOT NULL,
  period_month TEXT NOT NULL,
  scope_key TEXT NOT NULL DEFAULT 'all',
  review_status TEXT NOT NULL DEFAULT 'draft',
  note TEXT,
  reference_amount_cents INTEGER NOT NULL DEFAULT 0,
  compared_amount_cents INTEGER NOT NULL DEFAULT 0,
  difference_cents INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reconciliation_type, period_month, scope_key)
);
CREATE INDEX IF NOT EXISTS idx_accounting_reconciliation_reviews_type_period ON accounting_reconciliation_reviews(reconciliation_type, period_month DESC, review_status);

CREATE TABLE IF NOT EXISTS accounting_writeoffs (
  writeoff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  writeoff_date TEXT,
  item_name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  reason_code TEXT NOT NULL DEFAULT 'other',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_costs (
  product_cost_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_number TEXT NOT NULL,
  cost_per_unit REAL NOT NULL DEFAULT 0,
  effective_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS accounting_overhead_allocations (
  allocation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL,
  ledger_code TEXT NOT NULL DEFAULT '',
  ledger_name TEXT NOT NULL DEFAULT '',
  allocation_basis TEXT NOT NULL DEFAULT 'manual',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period_month, ledger_code)
);

-- Current pass: indexes to support phone dashboard, accounting overview, and item-costing reads.

CREATE INDEX IF NOT EXISTS idx_accounting_expenses_date ON accounting_expenses(expense_date, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_writeoffs_date ON accounting_writeoffs(writeoff_date, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_costs_product_number_effective ON product_costs(product_number, effective_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_overhead_allocations_month ON accounting_overhead_allocations(period_month, ledger_code);
-- Current pass note: runtime_incidents remains the server-side fallback/error log table, and `/api/admin/runtime-incidents` now reads from it for admin review while client pages keep last-good snapshot fallbacks in the browser. This pass also adds order/payment-focused partial fallbacks plus a code/path index so admin incident review can stay fast as more endpoint warnings are recorded.



CREATE TABLE IF NOT EXISTS accounting_overhead_product_allocations (
  overhead_product_allocation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL,
  ledger_code TEXT NOT NULL DEFAULT '',
  product_id INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period_month, ledger_code, product_id)
);
CREATE INDEX IF NOT EXISTS idx_accounting_overhead_product_allocations_month ON accounting_overhead_product_allocations(period_month, ledger_code, product_id);
CREATE INDEX IF NOT EXISTS idx_accounting_overhead_product_allocations_product ON accounting_overhead_product_allocations(product_id, period_month DESC);

CREATE TABLE IF NOT EXISTS accounting_journal_entries (
  journal_entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_key TEXT NOT NULL,
  reference_code TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  total_debit_cents INTEGER NOT NULL DEFAULT 0,
  total_credit_cents INTEGER NOT NULL DEFAULT 0,
  imbalance_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (period_month, source_type, source_key)
);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_period ON accounting_journal_entries(period_month, entry_date DESC, journal_entry_id DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_source ON accounting_journal_entries(source_type, source_key, period_month);

CREATE TABLE IF NOT EXISTS accounting_journal_lines (
  journal_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id INTEGER NOT NULL,
  line_number INTEGER NOT NULL,
  ledger_code TEXT,
  ledger_name TEXT,
  line_description TEXT,
  debit_cents INTEGER NOT NULL DEFAULT 0,
  credit_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (journal_entry_id, line_number),
  FOREIGN KEY (journal_entry_id) REFERENCES accounting_journal_entries(journal_entry_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_entry ON accounting_journal_lines(journal_entry_id, line_number ASC);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_ledger ON accounting_journal_lines(ledger_code, created_at DESC);


CREATE TABLE IF NOT EXISTS accounting_gifi_review_notes (
  accounting_gifi_review_note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tax_year INTEGER NOT NULL,
  gifi_code TEXT NOT NULL,
  gifi_label TEXT,
  gifi_section TEXT,
  accountant_note TEXT,
  schedule_141_note TEXT,
  supporting_details TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft',
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tax_year, gifi_code)
);
CREATE INDEX IF NOT EXISTS idx_accounting_gifi_review_notes_year ON accounting_gifi_review_notes(tax_year, gifi_code);

CREATE TABLE IF NOT EXISTS accounting_period_closures (
  accounting_period_closure_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL UNIQUE,
  lock_state TEXT NOT NULL DEFAULT 'open',
  close_checklist_json TEXT,
  close_notes TEXT,
  locked_by_user_id INTEGER,
  locked_at TEXT,
  reopened_by_user_id INTEGER,
  reopened_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_period_closures_period ON accounting_period_closures(period_month, lock_state, updated_at DESC);

CREATE TABLE IF NOT EXISTS admin_pending_actions (
  admin_pending_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_action_id TEXT,
  action_scope TEXT,
  order_id INTEGER,
  action_label TEXT,
  endpoint_path TEXT,
  http_method TEXT,
  payload_json TEXT,
  queue_status TEXT DEFAULT 'queued',
  last_error TEXT,
  warning TEXT,
  attempt_count INTEGER DEFAULT 0,
  created_by_user_id INTEGER,
  resolved_by_user_id INTEGER,
  source_device_label TEXT,
  last_attempt_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_pending_actions_client_action_id ON admin_pending_actions(client_action_id);
CREATE INDEX IF NOT EXISTS idx_admin_pending_actions_status_created ON admin_pending_actions(queue_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_pending_actions_order_status ON admin_pending_actions(order_id, queue_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_pending_actions_scope_status ON admin_pending_actions(action_scope, queue_status, created_at DESC);

-- Current pass note: admin_pending_actions now provides a shared cross-device replay queue for failed admin writes, including order/payment actions and product review actions, while browser-local fallback remains the last safety net when even the queue cannot be reached.

-- Current pass note: catalog migration sync now accepts both collections and legacy item_kinds payloads.
-- Tools, supplies, and featured creations continue to upsert into catalog_items.
-- Movies now sync into movie_catalog so hybrid JSON + D1 movie authority can advance without violating the catalog_items item_kind constraint.
-- Current Pass Note — 2026-04-12
-- Movie catalog sync now uses chunked D1 batch upserts to stay below Worker invocation request ceilings.
-- Admin products now supports degraded query fallback during staged schema/data migrations.
-- No new tables were introduced in this pass; schema files were refreshed to reflect the current operational state.


-- Current pass note: the initial D1 catalog migration completed successfully for Tools, Supplies, Movies, and Featured Creations.
-- The main Catalog admin page no longer exposes the day-to-day migration panel, while `/api/admin/catalog-sync` remains available for maintenance or reseed recovery only.

-- 2026-04-13 pass note:
-- No brand-new required tables were introduced in this pass.
-- Current pass focused on DD-series label display, standalone brand-asset uploads,
-- and public social-link restoration through shared UI/footer behavior.

-- Current pass note
-- Added bulk site-inventory unit-cost update workflow in application code.
-- No schema expansion was required in this pass; existing site_item_inventory and site_inventory_movements tables were reused.

-- Pass 20 note — mobile capture compatibility repair
-- The live production database may still be missing one or more newer mobile-capture columns
-- on `products` (for example `capture_reference`) even though the current schema files include them.
-- Application code now checks the live table shape before writing optional mobile-capture fields so
-- `/api/admin/mobile-create-product` and `/api/admin/mobile-product-drafts` keep working during a
-- partial migration window. The preferred long-term fix is still to complete the products-table upgrade.

-- Current Pass Note — 2026-04-14
-- Approval-required storefront fields are now surfaced in the mobile capture UI and approval is blocked until readiness checks pass.


-- Current Pass Note — 2026-04-15
-- Added app_settings-backed dropdown master-data keys for product categories, colours, and shipping codes.
-- Product resource links now support per-unit, end-of-lot, and story-only inventory usage modes.
-- End-of-lot mode is intended for supplies such as wax/resin/clay where one lot may cover many finished products before inventory should be reduced.

-- Current Pass Note — 2026-04-16
-- Admin dropdown master-data is now wired through app_settings and tax_classes in application code.
-- Site inventory usage-unit support was added in application/runtime migration logic for cups, wicks, grams, spools, and end-of-lot costing.

-- Current Pass Update — 2026-04-17
-- This pass assumes/uses the following current-direction features in code:
-- 1) member wishlist and product interest request review workflows
-- 2) checkout recovery leads and recovery email notification outbox support
-- 3) gift card validation / redemption support
-- 4) product review / testimonial submission and approved review display
-- 5) pricing suggestion load/apply actions in admin
-- 6) continued schema-compatibility hardening for older D1 tables
-- Pass 29 - footer socials, engagement depth, and editor price write-back
-- Notes: live code now expects footer social fallback behavior, deeper engagement admin actions, and editor-side price preset write-back.

-- Pass 30 schema note: storefront gift-card purchases may use gift_cards.order_id, purchase_source, and pending_activation status; publish scoring now expects image-count-aware readiness.

-- Pass 31 note: gift card webhook activation, publish override gating, notification cooldown/exclusion support, and image validation workflow updates.

-- Pass 32 update (2026-04-20)
-- Current pass expects/supports these schema capabilities where applicable:
-- 1) notification_exclusions, notification_cooldown_rules, customer_engagement_runs, notification_dispatch_log
-- 2) product_publish_overrides plus product publish_readiness_score / image_quality_score / ready_check_notes support
-- 3) media_assets and product_image_annotations dimension/orientation tracking for listing-quality checks
-- 4) gift_cards purchaser/recipient/order/purchase_source friendly fulfillment support
-- 5) inventory and pricing decision support to continue using landed-cost, markup, packaging, shipping, and increase-planning signals

-- Pass 33 update
-- Deepened gift card delivery history and resend controls with recipient/purchaser audit support.
-- Strengthened listing-photo readiness with crop history, first-image scoring, and richer media-quality checks.
-- Expanded public trust/testimonial placement and support CTA coverage.
-- Pushed pricing toward a fuller operating console with receiving/packaging/shipping assumptions and save-time warnings.

-- Current Pass Update
-- Added/expected usage this pass:
-- 1) Member/storefront order-history views can read gift_cards by order_id.
-- 2) Member/storefront order-history views can read gift_card_delivery_audit by gift_card_id.
-- 3) product_image_annotations should continue to support width/height/orientation/crop/first_image_score.
-- 4) No destructive schema changes were introduced in this pass; this is a documentation sync note.


-- Current Pass Update
-- Merchandising-score image guidance now expects/supports the following where available:
-- 1) media_assets.width_px, height_px, image_orientation, background_consistency_score, subject_fill_score, sharpness_score, brightness_score, contrast_score, angle_group, shot_style, merchandising_score
-- 2) product_image_annotations keeps the prior width/height/orientation/crop/first_image_score fields and now also supports matching merchandising-score fields
-- 3) public upload/admin selection guidance uses these fields to warn earlier about soft, dark, low-fill, duplicate-angle, or portrait lead images


-- Current pass note: product image review now also supports merchandising_override_reason / merchandising_override_note and product_media_score_history trend snapshots for admin drift review.


CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_category_sort ON general_ledger_accounts(category, sort_order, code);
CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_gifi ON general_ledger_accounts(gifi_section, gifi_code, code);
CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_review_state ON general_ledger_accounts(gifi_review_state, is_active, code);


-- Pass update: accounting attachments and deeper reconciliation metadata
CREATE TABLE IF NOT EXISTS accounting_attachments (
  accounting_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  attachment_kind TEXT NOT NULL DEFAULT 'other',
  attachment_status TEXT NOT NULL DEFAULT 'uploaded',
  attachment_scope TEXT NOT NULL DEFAULT 'other',
  document_date TEXT,
  scope_key TEXT,
  provider_scope TEXT,
  storage_provider TEXT NOT NULL DEFAULT 'r2',
  bucket_name TEXT,
  object_key TEXT NOT NULL UNIQUE,
  public_url TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  expense_id INTEGER,
  vendor_id INTEGER,
  reconciliation_type TEXT,
  period_month TEXT,
  tax_year TEXT,
  statement_reference TEXT,
  statement_gross_cents INTEGER NOT NULL DEFAULT 0,
  statement_fee_cents INTEGER NOT NULL DEFAULT 0,
  statement_net_cents INTEGER NOT NULL DEFAULT 0,
  statement_tax_cents INTEGER NOT NULL DEFAULT 0,
  statement_shipping_cents INTEGER NOT NULL DEFAULT 0,
  statement_txn_count INTEGER NOT NULL DEFAULT 0,
  statement_period_start TEXT,
  statement_period_end TEXT,
  statement_detail_json TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_attachments_expense ON accounting_attachments(expense_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_attachments_vendor ON accounting_attachments(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_attachments_period ON accounting_attachments(period_month, tax_year, reconciliation_type, attachment_kind);
-- Build 134 schema cleanup: column accounting_attachments.attachment_status already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN attachment_status TEXT NOT NULL DEFAULT 'uploaded';
-- Build 134 schema cleanup: column accounting_attachments.document_date already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN document_date TEXT;
-- Build 134 schema cleanup: column accounting_attachments.scope_key already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN scope_key TEXT;
CREATE INDEX IF NOT EXISTS idx_accounting_attachments_scope ON accounting_attachments(reconciliation_type, period_month, scope_key, attachment_kind);

ALTER TABLE accounting_reconciliation_reviews ADD COLUMN statement_reference TEXT;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN difference_reason TEXT;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN detail_json TEXT;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN attachment_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN statement_amount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN book_amount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN tolerance_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN expected_rate_basis_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN observed_rate_basis_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN unresolved_item_count INTEGER NOT NULL DEFAULT 0;

-- Current pass additions for statement-backed accounting attachments
-- Build 134 schema cleanup: column accounting_attachments.attachment_scope already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN attachment_scope TEXT NOT NULL DEFAULT 'other';
-- Build 134 schema cleanup: column accounting_attachments.provider_scope already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN provider_scope TEXT;
-- Build 134 schema cleanup: column accounting_attachments.statement_gross_cents already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN statement_gross_cents INTEGER NOT NULL DEFAULT 0;
-- Build 134 schema cleanup: column accounting_attachments.statement_fee_cents already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN statement_fee_cents INTEGER NOT NULL DEFAULT 0;
-- Build 134 schema cleanup: column accounting_attachments.statement_net_cents already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN statement_net_cents INTEGER NOT NULL DEFAULT 0;
-- Build 134 schema cleanup: column accounting_attachments.statement_tax_cents already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN statement_tax_cents INTEGER NOT NULL DEFAULT 0;
-- Build 134 schema cleanup: column accounting_attachments.statement_shipping_cents already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN statement_shipping_cents INTEGER NOT NULL DEFAULT 0;
-- Build 134 schema cleanup: column accounting_attachments.statement_txn_count already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN statement_txn_count INTEGER NOT NULL DEFAULT 0;
-- Build 134 schema cleanup: column accounting_attachments.statement_period_start already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN statement_period_start TEXT;
-- Build 134 schema cleanup: column accounting_attachments.statement_period_end already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN statement_period_end TEXT;
-- Build 134 schema cleanup: column accounting_attachments.statement_detail_json already exists in the CREATE TABLE block; duplicate ALTER removed for fresh-schema smoke tests.
-- ALTER TABLE accounting_attachments ADD COLUMN statement_detail_json TEXT;


-- Current pass update: customer engagement automation timing rules


-- Current pass update: statement imports, reconciliation exceptions, and fixed-asset groundwork


-- Current pass: saved statement-import provider profiles for bank, PayPal, Stripe, Square, Etsy, and manual CSV formats.
CREATE TABLE IF NOT EXISTS accounting_statement_provider_profiles (
  accounting_statement_provider_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_scope TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  date_column TEXT,
  description_column TEXT,
  gross_column TEXT,
  fee_column TEXT,
  net_column TEXT,
  currency_column TEXT,
  reference_column TEXT,
  default_currency TEXT NOT NULL DEFAULT 'CAD',
  mapping_json TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_statement_provider_profiles_active ON accounting_statement_provider_profiles(is_active, provider_scope);

CREATE TABLE IF NOT EXISTS accounting_statement_imports (
  accounting_statement_import_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_scope TEXT NOT NULL DEFAULT 'other',
  import_status TEXT NOT NULL DEFAULT 'imported',
  source_filename TEXT,
  source_format TEXT NOT NULL DEFAULT 'csv',
  period_month TEXT,
  period_start TEXT,
  period_end TEXT,
  currency TEXT NOT NULL DEFAULT 'CAD',
  row_count INTEGER NOT NULL DEFAULT 0,
  gross_cents INTEGER NOT NULL DEFAULT 0,
  fee_cents INTEGER NOT NULL DEFAULT 0,
  net_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  deposit_cents INTEGER NOT NULL DEFAULT 0,
  withdrawal_cents INTEGER NOT NULL DEFAULT 0,
  txn_count INTEGER NOT NULL DEFAULT 0,
  statement_reference TEXT,
  detail_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_accounting_statement_imports_period ON accounting_statement_imports(provider_scope, period_month DESC, import_status);

CREATE TABLE IF NOT EXISTS accounting_statement_import_rows (
  accounting_statement_import_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  accounting_statement_import_id INTEGER NOT NULL,
  provider_scope TEXT NOT NULL DEFAULT 'other',
  txn_date TEXT,
  txn_type TEXT,
  description TEXT,
  reference_number TEXT,
  gross_cents INTEGER NOT NULL DEFAULT 0,
  fee_cents INTEGER NOT NULL DEFAULT 0,
  net_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  debit_cents INTEGER NOT NULL DEFAULT 0,
  credit_cents INTEGER NOT NULL DEFAULT 0,
  running_balance_cents INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT,
  matched_scope_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (accounting_statement_import_id) REFERENCES accounting_statement_imports(accounting_statement_import_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_accounting_statement_import_rows_import ON accounting_statement_import_rows(accounting_statement_import_id, txn_date);
CREATE INDEX IF NOT EXISTS idx_accounting_statement_import_rows_provider_ref ON accounting_statement_import_rows(provider_scope, txn_date, reference_number);

CREATE TABLE IF NOT EXISTS accounting_reconciliation_exceptions (
  accounting_reconciliation_exception_id INTEGER PRIMARY KEY AUTOINCREMENT,
  reconciliation_type TEXT NOT NULL,
  period_month TEXT NOT NULL,
  scope_key TEXT NOT NULL DEFAULT 'all',
  provider_scope TEXT,
  exception_status TEXT NOT NULL DEFAULT 'open',
  severity TEXT NOT NULL DEFAULT 'warning',
  reference_label TEXT,
  statement_amount_cents INTEGER NOT NULL DEFAULT 0,
  book_amount_cents INTEGER NOT NULL DEFAULT 0,
  difference_cents INTEGER NOT NULL DEFAULT 0,
  tolerance_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  detail_json TEXT,
  source_import_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_import_id) REFERENCES accounting_statement_imports(accounting_statement_import_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_accounting_reconciliation_exceptions_period ON accounting_reconciliation_exceptions(reconciliation_type, period_month DESC, exception_status);

CREATE TABLE IF NOT EXISTS accounting_fixed_assets (
  accounting_fixed_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_label TEXT NOT NULL,
  asset_category TEXT,
  cca_class TEXT,
  acquisition_date TEXT,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  salvage_cents INTEGER NOT NULL DEFAULT 0,
  business_use_percent INTEGER NOT NULL DEFAULT 100,
  vendor_name TEXT,
  related_expense_id INTEGER,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_accounting_fixed_assets_category ON accounting_fixed_assets(asset_category, cca_class, acquisition_date DESC);

CREATE TABLE IF NOT EXISTS notification_automation_settings (
  notification_automation_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL UNIQUE,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  send_after_hours INTEGER NOT NULL DEFAULT 24,
  max_age_days INTEGER NOT NULL DEFAULT 30,
  order_statuses_json TEXT,
  payment_statuses_json TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_automation_settings_kind ON notification_automation_settings(notification_kind);

CREATE TABLE IF NOT EXISTS community_events (
  community_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'market',
  event_status TEXT NOT NULL DEFAULT 'planned',
  starts_at TEXT,
  ends_at TEXT,
  venue_name TEXT,
  city TEXT,
  region_label TEXT,
  event_url TEXT,
  public_note TEXT,
  sale_channel_note TEXT,
  pickup_supported INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  recurrence_rule TEXT NOT NULL DEFAULT 'none',
  recurrence_interval INTEGER NOT NULL DEFAULT 1,
  recurrence_count INTEGER,
  recurrence_until TEXT,
  recurrence_label TEXT,
  image_url TEXT,
  image_alt TEXT,
  application_mode TEXT NOT NULL DEFAULT 'closed',
  application_url TEXT,
  vendor_capacity INTEGER NOT NULL DEFAULT 0,
  vendor_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_community_events_active_start ON community_events(is_active, starts_at, sort_order);

CREATE TABLE IF NOT EXISTS event_vendor_applications (
  event_vendor_application_id INTEGER PRIMARY KEY AUTOINCREMENT,
  community_event_id INTEGER,
  event_title_snapshot TEXT,
  vendor_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  city TEXT,
  offered_items TEXT,
  website_url TEXT,
  marketplace_url TEXT,
  instagram_url TEXT,
  setup_notes TEXT,
  application_status TEXT NOT NULL DEFAULT 'submitted',
  internal_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (community_event_id) REFERENCES community_events(community_event_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_event_vendor_applications_event_status ON event_vendor_applications(community_event_id, application_status, created_at DESC);

CREATE TABLE IF NOT EXISTS pickup_profiles (
  pickup_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  pickup_mode TEXT NOT NULL DEFAULT 'appointment',
  city TEXT,
  region_label TEXT,
  appointment_only INTEGER NOT NULL DEFAULT 1,
  lead_time_hours INTEGER NOT NULL DEFAULT 24,
  public_note TEXT,
  availability_note TEXT,
  map_url TEXT,
  contact_hint TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pickup_profiles_active_sort ON pickup_profiles(is_active, sort_order, label);

-- 2026-05-09 admin products resource-selector follow-up
-- No schema change was required for this pass.
-- The changes were admin UX/fallback improvements for inventory seed selectors and product resource-link editing.

-- Build 125 current pass: Amazon review/apply workflow, inventory cost history, and reconciliation queue hardening.
CREATE TABLE IF NOT EXISTS site_item_inventory_cost_history (
  site_item_inventory_cost_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER,
  source_type TEXT,
  external_key TEXT,
  item_name TEXT,
  previous_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  new_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  source_kind TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  source_reference TEXT,
  reason_note TEXT,
  changed_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_site_item_inventory_cost_history_item ON site_item_inventory_cost_history(site_item_inventory_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_item_inventory_cost_history_source ON site_item_inventory_cost_history(source_kind, source_id);

ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_inventory_id INTEGER;
ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_cost_history_id INTEGER;
ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_at TEXT;
ALTER TABLE amazon_purchase_import_staging ADD COLUMN reviewed_by_user_id INTEGER;

ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN assigned_to_user_id INTEGER;
ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN accountant_review_flag INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN resolved_by_user_id INTEGER;
ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN resolved_at TEXT;
ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN reopened_by_user_id INTEGER;
ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN reopened_at TEXT;
CREATE INDEX IF NOT EXISTS idx_accounting_reconciliation_exceptions_queue ON accounting_reconciliation_exceptions(exception_status, accountant_review_flag, updated_at DESC);

ALTER TABLE accounting_journal_entries ADD COLUMN posted_by_user_id INTEGER;
ALTER TABLE accounting_journal_entries ADD COLUMN posted_at TEXT;
ALTER TABLE accounting_journal_entries ADD COLUMN validation_message TEXT;


-- Build 130 note: no required schema change. Public product reads now avoid optional-column assumptions.

-- Build 132 note: no structural D1 schema change; mobile-navigation and predeploy-sanity code-only pass recorded in database_upgrade_current_pass.sql.

-- Build 133 note: storefront schema is current with admin Structured Data Health,
-- Live Sitemap Preview, and Storefront Value Backfill. Search Console staging
-- tables live in database_full_schema.sql and database_growth_analytics_seo_extension.sql.

-- Build 134 note: no structural schema change; create-product/admin product editor now adapts to existing product/media/SEO columns and treats draft-only fields as optional until publish readiness.

-- Build 135 schema sync note: no new structural tables are required for the media/R2 diagnostics,
-- product image health report, draft checklist, or reusable image picker. These features reuse existing
-- products, product_images, media_assets, product_image_annotations, runtime_incidents, and schema_migration_ledger tables.

-- Build 140 schema sync note: social queue scheduling, dry-run payload previews,
-- platform caption variants, duplicate/repost guardrails, and media-warning fields
-- are reflected in database_full_schema.sql, database_store_schema.sql,
-- database_growth_analytics_seo_extension.sql, and database_upgrade_current_pass.sql.

-- Build 146: custom request intake table.
CREATE TABLE IF NOT EXISTS custom_requests (
  custom_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  request_type TEXT NOT NULL,
  product_interest TEXT,
  deadline_date TEXT,
  budget_cents INTEGER,
  message TEXT NOT NULL,
  attachment_urls_json TEXT DEFAULT '[]',
  consent_to_contact INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_custom_requests_email ON custom_requests(email, created_at);

-- Build 150: reviewed trust blocks, Search Console SEO override apply loop, and accounting close workflow.
CREATE TABLE IF NOT EXISTS trust_block_items (
  trust_block_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_review_id INTEGER,
  item_kind TEXT NOT NULL DEFAULT 'testimonial',
  display_context TEXT NOT NULL DEFAULT 'sitewide',
  title TEXT,
  body TEXT NOT NULL,
  attribution_label TEXT,
  rating_label TEXT,
  related_product_id INTEGER,
  related_product_slug TEXT,
  related_product_name TEXT,
  locality_label TEXT,
  block_status TEXT NOT NULL DEFAULT 'draft',
  is_featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 0,
  privacy_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewer_notes TEXT,
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trust_block_items_public ON trust_block_items(block_status, is_public, display_context, sort_order);
CREATE INDEX IF NOT EXISTS idx_trust_block_items_product ON trust_block_items(related_product_id, related_product_slug);

CREATE TABLE IF NOT EXISTS seo_page_overrides (
  seo_page_override_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  source_action_id INTEGER,
  source_query_text TEXT,
  override_status TEXT NOT NULL DEFAULT 'draft',
  title_override TEXT,
  meta_description_override TEXT,
  internal_link_note TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_seo_page_overrides_status ON seo_page_overrides(override_status, page_path);

CREATE TABLE IF NOT EXISTS accounting_payment_applications (
  accounting_payment_application_id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER,
  order_id INTEGER,
  period_month TEXT NOT NULL,
  application_status TEXT NOT NULL DEFAULT 'draft',
  applied_amount_cents INTEGER NOT NULL DEFAULT 0,
  fee_amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_component_cents INTEGER NOT NULL DEFAULT 0,
  provider TEXT,
  transaction_reference TEXT,
  application_notes TEXT,
  created_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_payment_applications_period ON accounting_payment_applications(period_month, application_status);

CREATE TABLE IF NOT EXISTS accounting_hst_gst_reviews (
  accounting_hst_gst_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL UNIQUE,
  review_status TEXT NOT NULL DEFAULT 'draft',
  sales_tax_collected_cents INTEGER NOT NULL DEFAULT 0,
  input_tax_credit_cents INTEGER NOT NULL DEFAULT 0,
  net_tax_payable_cents INTEGER NOT NULL DEFAULT 0,
  filing_reference TEXT,
  filing_due_date TEXT,
  remittance_status TEXT NOT NULL DEFAULT 'not_ready',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_hst_gst_reviews_period ON accounting_hst_gst_reviews(period_month, review_status);

CREATE TABLE IF NOT EXISTS accountant_export_packages (
  accountant_export_package_id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_key TEXT NOT NULL UNIQUE,
  period_month TEXT,
  tax_year TEXT,
  package_status TEXT NOT NULL DEFAULT 'draft',
  manifest_json TEXT,
  created_by_user_id INTEGER,
  finalized_by_user_id INTEGER,
  finalized_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_accountant_export_packages_period ON accountant_export_packages(period_month, tax_year, package_status);

-- Build 150 compatibility note: existing Build 137 seo_opportunity_actions tables need
-- applied_override_id INTEGER and applied_at TEXT. The admin Search Console endpoint
-- self-heals those columns safely at runtime, avoiding duplicate-column migration failures.

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_150_trust_seo_close_workflow',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 150 adds approved trust blocks, reviewed SEO override application from Search Console actions, payment application, HST/GST review, month-end close readiness, and accountant export manifest packaging.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 151: custom request conversion drafts, UTM attribution joins, and accountant close CSV/evidence fields.
CREATE TABLE IF NOT EXISTS custom_request_quote_drafts (
  custom_request_quote_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL UNIQUE,
  quote_key TEXT NOT NULL UNIQUE,
  quote_status TEXT NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  request_type TEXT,
  requested_deadline TEXT,
  estimated_budget_cents INTEGER NOT NULL DEFAULT 0,
  scope_notes TEXT,
  quote_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_drafts_status ON custom_request_quote_drafts(quote_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_job_drafts (
  custom_request_job_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL UNIQUE,
  job_key TEXT NOT NULL UNIQUE,
  job_status TEXT NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  source_quote_draft_id INTEGER,
  customer_name TEXT,
  customer_email TEXT,
  work_type TEXT,
  target_due_date TEXT,
  estimated_budget_cents INTEGER NOT NULL DEFAULT 0,
  work_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_job_drafts_status ON custom_request_job_drafts(job_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_product_drafts (
  custom_request_product_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL UNIQUE,
  product_draft_key TEXT NOT NULL UNIQUE,
  product_draft_status TEXT NOT NULL DEFAULT 'draft',
  suggested_product_name TEXT NOT NULL,
  product_category TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  story_seed TEXT,
  seo_seed_title TEXT,
  seo_seed_description TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_product_drafts_status ON custom_request_product_drafts(product_draft_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_conversion_events (
  custom_request_conversion_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  conversion_type TEXT NOT NULL,
  target_key TEXT,
  target_table TEXT,
  target_id INTEGER,
  event_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_request_conversion_events_request ON custom_request_conversion_events(custom_request_id, created_at);

-- Runtime APIs self-heal these attribution/support columns when older D1 installs are missing them.
-- custom_requests: utm_source, utm_medium, utm_campaign, utm_content, utm_term, visitor_token, browser_session_token
-- site_visitor_sessions/site_page_views: utm_source, utm_medium, utm_campaign, utm_content, utm_term
-- accounting_hst_gst_reviews: remittance_evidence_url, reminder_date

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_151_custom_request_conversion_utm_close_export',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 151 mounts Custom Requests in Operations, adds quote/job/product draft conversion tables, captures UTM attribution for requests and visitor analytics, joins social UTM rollups to traffic/custom-request conversions, and adds accountant close CSV/remittance evidence support.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- =========================================================
-- BUILD 152 — CUSTOM REQUEST REPLY/PAYMENT CANDIDATES + HST REMINDER QUEUE
-- =========================================================

CREATE TABLE IF NOT EXISTS custom_request_reply_templates (
  custom_request_reply_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  template_key TEXT NOT NULL UNIQUE,
  template_status TEXT NOT NULL DEFAULT 'draft',
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  copied_at TEXT,
  sent_manually_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_reply_templates_request ON custom_request_reply_templates(custom_request_id, template_status, updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_reply_templates_unique_email ON custom_request_reply_templates(custom_request_id, channel);

CREATE TABLE IF NOT EXISTS custom_request_payment_candidates (
  custom_request_payment_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  candidate_key TEXT NOT NULL UNIQUE,
  candidate_type TEXT NOT NULL DEFAULT 'deposit',
  candidate_status TEXT NOT NULL DEFAULT 'draft',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  due_date TEXT,
  description TEXT,
  customer_name TEXT,
  customer_email TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_candidates_request ON custom_request_payment_candidates(custom_request_id, candidate_type, candidate_status);

CREATE TABLE IF NOT EXISTS notification_outbox (
  notification_outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  destination TEXT,
  related_order_id INTEGER,
  related_payment_id INTEGER,
  related_product_id INTEGER,
  payload_json TEXT,
  metadata_json TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_attempt_at TEXT,
  provider_message_id TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status ON notification_outbox(status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_kind ON notification_outbox(notification_kind, destination, created_at);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_152_custom_request_reply_payment_candidates_hst_reminders',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 152 adds manual customer reply templates, deposit/invoice candidates for custom requests, and HST/GST reminder queue support through notification_outbox.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- =========================================================
-- BUILD 153 — PRIVATE QUOTE PREVIEWS + CUSTOM REQUEST REFERENCE UPLOADS
-- =========================================================

CREATE TABLE IF NOT EXISTS custom_request_quote_share_links (
  custom_request_quote_share_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  share_token TEXT NOT NULL UNIQUE,
  share_status TEXT NOT NULL DEFAULT 'active',
  version_number INTEGER NOT NULL DEFAULT 1,
  supersedes_share_link_id INTEGER,
  resent_at TEXT,
  resend_note TEXT,
  customer_name TEXT,
  customer_email TEXT,
  title TEXT,
  quote_total_cents INTEGER NOT NULL DEFAULT 0,
  scope_summary TEXT,
  payment_summary_json TEXT DEFAULT '{}',
  expires_at TEXT,
  accepted_at TEXT,
  declined_at TEXT,
  customer_response_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_share_links_request ON custom_request_quote_share_links(custom_request_id, share_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_quote_share_links_token ON custom_request_quote_share_links(share_token, share_status);

CREATE TABLE IF NOT EXISTS custom_request_reference_uploads (
  custom_request_reference_upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  request_key TEXT NOT NULL,
  public_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  reference_use_status TEXT NOT NULL DEFAULT 'private_review_only',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_request_reference_uploads_request ON custom_request_reference_uploads(custom_request_id, created_at);

-- Runtime APIs self-heal these optional request upload columns on older D1 installs:
-- custom_requests.upload_token
-- custom_requests.reference_upload_count

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_153_custom_quote_preview_reference_uploads',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 153 adds private custom quote preview links, customer accept/decline tracking, and request-bound private-review reference image uploads for custom requests.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 154 custom quote, consent, SEO bake, gallery filter, and accountant export extension
ALTER TABLE custom_request_quote_drafts ADD COLUMN material_cost_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN labor_cost_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN pickup_shipping_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN tax_estimate_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN quote_total_cents INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS custom_request_quote_line_items (
  custom_request_quote_line_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER NOT NULL,
  line_type TEXT NOT NULL DEFAULT 'custom',
  line_label TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_amount_cents INTEGER NOT NULL DEFAULT 0,
  line_amount_cents INTEGER NOT NULL DEFAULT 0,
  is_taxable INTEGER NOT NULL DEFAULT 1,
  line_status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_line_items_quote ON custom_request_quote_line_items(quote_draft_id, line_status, sort_order);

CREATE TABLE IF NOT EXISTS custom_request_quote_revisions (
  custom_request_quote_revision_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  revision_type TEXT NOT NULL DEFAULT 'changed',
  revision_status TEXT NOT NULL DEFAULT 'open',
  revision_notes TEXT,
  snapshot_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_revisions_request ON custom_request_quote_revisions(custom_request_id, created_at);

CREATE TABLE IF NOT EXISTS custom_request_payment_request_drafts (
  custom_request_payment_request_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  share_link_id INTEGER,
  payment_request_key TEXT NOT NULL UNIQUE,
  payment_request_status TEXT NOT NULL DEFAULT 'review_needed',
  request_type TEXT NOT NULL DEFAULT 'deposit',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  customer_name TEXT,
  customer_email TEXT,
  due_date TEXT,
  review_notes TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  approved_payment_link_id INTEGER,
  approved_payment_link_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (share_link_id) REFERENCES custom_request_quote_share_links(custom_request_quote_share_link_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_request_drafts_request ON custom_request_payment_request_drafts(custom_request_id, payment_request_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_order_drafts (
  custom_request_order_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  share_link_id INTEGER,
  order_draft_key TEXT NOT NULL UNIQUE,
  order_draft_status TEXT NOT NULL DEFAULT 'review_needed',
  customer_name TEXT,
  customer_email TEXT,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  fulfillment_notes TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  order_id INTEGER,
  converted_by_user_id INTEGER,
  converted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (share_link_id) REFERENCES custom_request_quote_share_links(custom_request_quote_share_link_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_order_drafts_request ON custom_request_order_drafts(custom_request_id, order_draft_status, updated_at);

-- Reference uploads now also create media_consent_records rows with source_type='custom_request_reference_upload', consent_status='requested', and consent_scope='internal_only'.
-- Approved SEO can now be baked from data/site/seo-page-overrides.json using scripts/bake_approved_seo_overrides.py.
-- Accounting close workflow now supports format=zip for a CSV bundle plus evidence-index.csv and manifest.json.

-- Build 155 - approved custom request payment links, real order conversion, marketplace packs, and post-fulfillment prompts.
CREATE TABLE IF NOT EXISTS custom_request_payment_links (
  custom_request_payment_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  payment_request_draft_id INTEGER,
  quote_draft_id INTEGER,
  payment_link_key TEXT NOT NULL UNIQUE,
  link_token TEXT NOT NULL UNIQUE,
  link_status TEXT NOT NULL DEFAULT 'active',
  link_url_path TEXT,
  request_type TEXT NOT NULL DEFAULT 'deposit',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  customer_name TEXT,
  customer_email TEXT,
  provider TEXT NOT NULL DEFAULT 'manual_review',
  provider_reference TEXT,
  approval_notes TEXT,
  customer_viewed_at TEXT,
  customer_ready_at TEXT,
  customer_note TEXT,
  viewed_at TEXT,
  ready_to_pay_at TEXT,
  customer_ready_note TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (payment_request_draft_id) REFERENCES custom_request_payment_request_drafts(custom_request_payment_request_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_links_request ON custom_request_payment_links(custom_request_id, link_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_payment_links_token ON custom_request_payment_links(link_token, link_status);

CREATE TABLE IF NOT EXISTS custom_request_marketplace_export_packs (
  custom_request_marketplace_export_pack_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  product_draft_id INTEGER,
  export_key TEXT NOT NULL UNIQUE,
  export_status TEXT NOT NULL DEFAULT 'draft',
  etsy_title TEXT,
  etsy_description TEXT,
  etsy_tags TEXT,
  facebook_title TEXT,
  facebook_description TEXT,
  pinterest_title TEXT,
  pinterest_description TEXT,
  manual_listing_title TEXT,
  manual_listing_description TEXT,
  suggested_local_keywords TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (product_draft_id) REFERENCES custom_request_product_drafts(custom_request_product_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_marketplace_export_request ON custom_request_marketplace_export_packs(custom_request_id, export_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_fulfillment_prompts (
  custom_request_fulfillment_prompt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  order_id INTEGER,
  prompt_key TEXT NOT NULL UNIQUE,
  prompt_status TEXT NOT NULL DEFAULT 'draft',
  customer_name TEXT,
  customer_email TEXT,
  review_prompt_text TEXT,
  photo_prompt_text TEXT,
  consent_prompt_text TEXT,
  created_by_user_id INTEGER,
  sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_fulfillment_prompts_request ON custom_request_fulfillment_prompts(custom_request_id, prompt_status, updated_at);

-- Build 156 custom request payment/order/marketplace/consent upgrade
-- Runtime functions use PRAGMA table_info guarded ALTER TABLE ADD COLUMN for existing tables.
-- Keep this reference block with the current pass so D1, docs, and app expectations stay aligned.
CREATE TABLE IF NOT EXISTS custom_request_payment_link_approval_gates (
  custom_request_payment_link_approval_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  payment_request_draft_id INTEGER,
  order_draft_id INTEGER,
  order_id INTEGER,
  gate_status TEXT NOT NULL DEFAULT 'pending',
  gate_notes TEXT,
  gate_snapshot_json TEXT DEFAULT '{}',
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_gates_request ON custom_request_payment_link_approval_gates(custom_request_id, gate_status, checked_at);

CREATE TABLE IF NOT EXISTS custom_request_payment_checkout_records (
  custom_request_payment_checkout_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  payment_link_id INTEGER,
  order_id INTEGER,
  payment_id INTEGER,
  provider TEXT NOT NULL DEFAULT 'manual',
  checkout_status TEXT NOT NULL DEFAULT 'prepared',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  redirect_url TEXT,
  mode TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_checkout_records_request ON custom_request_payment_checkout_records(custom_request_id, provider, checkout_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_order_status_links (
  custom_request_order_status_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  order_status_token TEXT NOT NULL UNIQUE,
  link_status TEXT NOT NULL DEFAULT 'active',
  customer_email TEXT,
  customer_name TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_order_status_links_request ON custom_request_order_status_links(custom_request_id, link_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_order_status_links_token ON custom_request_order_status_links(order_status_token, link_status);

-- Existing table column expectations added by guarded runtime migrations in Build 156:
-- custom_request_payment_links: order_id, payment_id, external_share_status, gate_status, gate_checked_at, gate_notes, preferred_provider, checkout_redirect_url.
-- custom_request_marketplace_export_packs: csv_status, etsy_csv_row_json, facebook_csv_row_json, pinterest_csv_row_json.
-- custom_request_fulfillment_prompts: prompt_token, public_response_status, public_use_scope, review_text, customer_response_note, responded_at.

-- Build 157 - custom commerce hardening, candle/soap specs, marketplace presets, and consent proof review
ALTER TABLE products ADD COLUMN scent_profile TEXT;
ALTER TABLE products ADD COLUMN wax_or_base TEXT;
ALTER TABLE products ADD COLUMN soap_base TEXT;
ALTER TABLE products ADD COLUMN colour_recipe TEXT;
ALTER TABLE products ADD COLUMN batch_number TEXT;
ALTER TABLE products ADD COLUMN ingredient_notes TEXT;
ALTER TABLE products ADD COLUMN allergen_safety_notes TEXT;
ALTER TABLE products ADD COLUMN cure_ready_date TEXT;

ALTER TABLE custom_requests ADD COLUMN upload_token TEXT;
ALTER TABLE custom_requests ADD COLUMN reference_upload_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_requests ADD COLUMN scent_profile TEXT;
ALTER TABLE custom_requests ADD COLUMN wax_or_base TEXT;
ALTER TABLE custom_requests ADD COLUMN colour_notes TEXT;
ALTER TABLE custom_requests ADD COLUMN batch_number TEXT;
ALTER TABLE custom_requests ADD COLUMN ingredient_notes TEXT;
ALTER TABLE custom_requests ADD COLUMN allergen_safety_notes TEXT;

ALTER TABLE custom_request_quote_share_links ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_quote_share_links ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_quote_share_links ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_share_links ADD COLUMN lifecycle_note TEXT;

ALTER TABLE custom_request_payment_links ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_payment_links ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_payment_links ADD COLUMN resent_at TEXT;
ALTER TABLE custom_request_payment_links ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_payment_links ADD COLUMN lifecycle_note TEXT;

ALTER TABLE custom_request_order_status_links ADD COLUMN order_stage TEXT NOT NULL DEFAULT 'planning';
ALTER TABLE custom_request_order_status_links ADD COLUMN stage_notes TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN stage_updated_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN resent_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_order_status_links ADD COLUMN lifecycle_note TEXT;

ALTER TABLE custom_request_marketplace_export_packs ADD COLUMN manual_csv_row_json TEXT DEFAULT '{}';
ALTER TABLE custom_request_marketplace_export_packs ADD COLUMN preset_summary_json TEXT DEFAULT '{}';

ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN resent_at TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN lifecycle_note TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN public_proof_candidate_id INTEGER;

CREATE TABLE IF NOT EXISTS marketplace_channel_presets (
  marketplace_channel_preset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL UNIQUE,
  category_label TEXT,
  shipping_profile_label TEXT,
  default_tags_json TEXT DEFAULT '[]',
  default_fields_json TEXT DEFAULT '{}',
  preset_status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_channel_presets_status ON marketplace_channel_presets(preset_status, channel);

CREATE TABLE IF NOT EXISTS custom_request_order_stage_events (
  custom_request_order_stage_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  order_id INTEGER,
  stage_key TEXT NOT NULL,
  stage_label TEXT NOT NULL,
  stage_status TEXT NOT NULL DEFAULT 'current',
  stage_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_order_stage_events_request ON custom_request_order_stage_events(custom_request_id, created_at);

CREATE TABLE IF NOT EXISTS custom_request_public_proof_candidates (
  custom_request_public_proof_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  fulfillment_prompt_id INTEGER,
  candidate_key TEXT NOT NULL UNIQUE,
  candidate_type TEXT NOT NULL DEFAULT 'trust_block',
  candidate_status TEXT NOT NULL DEFAULT 'review_needed',
  public_use_scope TEXT,
  title TEXT,
  body_text TEXT,
  attribution_label TEXT,
  locality_label TEXT,
  source_review_text TEXT,
  customer_note TEXT,
  trust_block_item_id INTEGER,
  product_story_public_note_id INTEGER,
  review_notes TEXT,
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_public_proof_candidates_status ON custom_request_public_proof_candidates(candidate_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_payment_provider_tests (
  custom_request_payment_provider_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  test_status TEXT NOT NULL DEFAULT 'not_configured',
  mode TEXT,
  result_notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_provider_tests_provider ON custom_request_payment_provider_tests(provider, checked_at);

CREATE TABLE IF NOT EXISTS custom_candle_soap_product_specs (
  custom_candle_soap_product_spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER,
  product_id INTEGER,
  product_draft_id INTEGER,
  product_family TEXT NOT NULL DEFAULT 'candle',
  scent_profile TEXT,
  wax_or_base TEXT,
  colour_notes TEXT,
  batch_number TEXT,
  ingredient_notes TEXT,
  allergen_safety_notes TEXT,
  cure_ready_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_candle_soap_specs_request ON custom_candle_soap_product_specs(custom_request_id, product_family);

-- Build 158 catalog/media repair note:
-- No destructive schema migration is required. Existing tables used/verified this pass:
-- products.featured_image_url, product_images, product_image_annotations,
-- product_review_actions, product_publish_overrides, site_item_inventory,
-- product_resource_links, product_seo. Runtime guards now ensure the review/media
-- support tables exist before admin catalog actions run.
-- Build 159: Catalog Product Editor visual image manager repair.
-- No D1 schema migration required; existing products.featured_image_url and product_images/image URL update handling are reused.

-- Build 160 catalog/editor repair note:
-- No new table is required. Product save now synchronizes the featured image and gallery URLs
-- into product_images in displayed order, preserving existing product_image rows where URLs match
-- so product_image_annotations and publish-readiness checks remain attached.
-- Canonical URL handling now accepts relative internal product paths in product_seo.canonical_url.

-- Build 161 note: no new D1 tables required. Public product APIs now enrich products with image arrays from existing product_images rows. Admin catalog work was split into /admin/catalog-media/ and /admin/inventory-operations/. Product detail now has a JSON error wrapper so late query failures do not return HTML to the browser.
-- Build 162: shop/creations CSS contrast, dedicated gift-card page, and inventory image preview/list URL polish. No D1 schema migration required.

-- Build 163 — product readiness preview, image health counters, and gift-card artwork
-- No required D1 migration is introduced in this pass.
-- New endpoint `/api/admin/product-readiness` reads existing tables: products, product_seo, product_images, and product_image_annotations.
-- Dashboard counters read the same existing product/image/SEO fields and degrade safely through safeCount wrappers.
-- The new `/admin/readiness/` page is admin-only and noindex/nofollow.
-- Recommended future schema work: optional persisted readiness snapshots if we want historical blocker trends instead of live reads only.



-- Build 164 additions: custom_order_stage_photos, product-publish QA endpoint, and candle/soap spec editing.
CREATE TABLE IF NOT EXISTS custom_order_stage_photos (
  custom_order_stage_photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER,
  order_id INTEGER,
  stage_key TEXT NOT NULL DEFAULT 'planning',
  image_url TEXT,
  image_caption TEXT,
  public_use_status TEXT NOT NULL DEFAULT 'internal_review',
  uploaded_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS custom_candle_soap_product_specs (
  custom_candle_soap_product_spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  custom_request_id INTEGER,
  product_kind TEXT NOT NULL DEFAULT 'custom',
  scent_profile TEXT,
  wax_or_base TEXT,
  colour_notes TEXT,
  batch_number TEXT,
  ingredient_notes TEXT,
  allergen_safety_notes TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_candle_soap_product_specs_product ON custom_candle_soap_product_specs(product_id);

-- Build 165 notes:
-- Restores custom-requests.js deployment safety and adds admin workflow coverage for post-publish QA, marketplace preview, gift-card lookup, order-stage photos, candle/soap public specs, and accountant evidence URL checks.
-- New/confirmed runtime tables used by this pass include gift_cards, gift_card_redemptions, custom_order_stage_photos, custom_candle_soap_product_specs, trust_block_items, and accountant/HST evidence records.
-- No destructive migration is required; new endpoints create/ensure supporting tables where needed and rely on the existing current-pass schema notes.


-- Build 166 additions: gift-card lifecycle controls, public balance lookup, QA persistence, trust placements, local SEO queue, task queue, and moderated order-stage photos.
ALTER TABLE custom_order_stage_photos ADD COLUMN object_key TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN original_filename TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN mime_type TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN file_size_bytes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_order_stage_photos ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'needs_review';
ALTER TABLE custom_order_stage_photos ADD COLUMN proof_candidate_status TEXT NOT NULL DEFAULT 'not_requested';
ALTER TABLE custom_order_stage_photos ADD COLUMN approved_by_user_id INTEGER;
ALTER TABLE custom_order_stage_photos ADD COLUMN approved_at TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS product_publish_qa_results (
  product_publish_qa_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  product_slug TEXT,
  qa_status TEXT NOT NULL DEFAULT 'failed',
  passed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  checks_json TEXT,
  checked_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_publish_qa_results_product ON product_publish_qa_results(product_id, created_at);

CREATE TABLE IF NOT EXISTS gift_card_admin_events (
  gift_card_admin_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_id INTEGER,
  source_gift_card_id INTEGER,
  action_key TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trust_block_placements (
  trust_block_placement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_context TEXT NOT NULL UNIQUE,
  placement_label TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  max_items INTEGER NOT NULL DEFAULT 3,
  item_kind_filter TEXT,
  locality_filter TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_seo_landing_page_reviews (
  local_seo_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  page_label TEXT,
  target_keyword TEXT,
  target_locality TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  h1_status TEXT NOT NULL DEFAULT 'unchecked',
  title_meta_status TEXT NOT NULL DEFAULT 'unchecked',
  internal_link_status TEXT NOT NULL DEFAULT 'unchecked',
  notes TEXT,
  local_seo_score INTEGER NOT NULL DEFAULT 0,
  scoring_notes TEXT,
  scored_at TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Build 167: image derivatives, stage-photo moderation, gift-card redemption, marketplace CSV mapping, evidence attachments, Today task actions, local SEO scoring, and QA history.
CREATE TABLE IF NOT EXISTS product_image_derivatives (
  product_image_derivative_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_image_id INTEGER NOT NULL,
  product_id INTEGER,
  derivative_kind TEXT NOT NULL DEFAULT 'preview',
  target_width INTEGER NOT NULL DEFAULT 1200,
  target_height INTEGER NOT NULL DEFAULT 1200,
  crop_x REAL NOT NULL DEFAULT 0,
  crop_y REAL NOT NULL DEFAULT 0,
  crop_width REAL NOT NULL DEFAULT 1,
  crop_height REAL NOT NULL DEFAULT 1,
  source_image_url TEXT,
  derivative_url TEXT,
  derivative_status TEXT NOT NULL DEFAULT 'queued',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS stage_photo_moderation_events (
  stage_photo_moderation_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_order_stage_photo_id INTEGER NOT NULL,
  action_key TEXT NOT NULL,
  moderation_status TEXT,
  public_use_status TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS gift_card_lookup_attempts (
  gift_card_lookup_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hint TEXT,
  email_hash TEXT,
  client_key TEXT,
  was_success INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS marketplace_csv_mappings (
  marketplace_csv_mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL UNIQUE,
  mapping_json TEXT NOT NULL DEFAULT '[]',
  validation_json TEXT NOT NULL DEFAULT '{}',
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS accounting_evidence_attachments (
  accounting_evidence_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  evidence_kind TEXT,
  title TEXT,
  evidence_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  attachment_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS today_task_actions (
  today_task_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_key TEXT NOT NULL,
  task_label TEXT,
  action_status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS product_publish_qa_results (
  product_publish_qa_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  qa_status TEXT NOT NULL DEFAULT 'unchecked',
  qa_score INTEGER NOT NULL DEFAULT 0,
  qa_summary_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
-- local_seo_score, scoring_notes, and scored_at are included in the CREATE TABLE above.

-- Build 168 schema additions / compatibility notes
CREATE TABLE IF NOT EXISTS marketplace_export_image_selections (
  marketplace_export_image_selection_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  selected_image_urls_json TEXT,
  selected_product_image_ids_json TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, product_id)
);
CREATE TABLE IF NOT EXISTS custom_request_public_proof_candidates (
  custom_request_public_proof_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER,
  order_id INTEGER,
  source_kind TEXT NOT NULL DEFAULT 'stage_photo',
  source_record_id INTEGER,
  image_url TEXT,
  candidate_title TEXT,
  candidate_body TEXT,
  approval_status TEXT NOT NULL DEFAULT 'needs_review',
  trust_block_item_id INTEGER,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS gift_card_lookup_attempts (
  gift_card_lookup_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  lookup_email TEXT,
  code_suffix TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  result_status TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS candle_soap_batch_recalls (
  candle_soap_batch_recall_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  product_kind TEXT,
  recall_status TEXT NOT NULL DEFAULT 'watch',
  reason TEXT,
  customer_notice TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS accounting_evidence_attachments (
  accounting_evidence_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  evidence_kind TEXT,
  title TEXT,
  evidence_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  attachment_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE product_image_derivatives ADD COLUMN derivative_object_key TEXT;
ALTER TABLE product_image_derivatives ADD COLUMN file_size_bytes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE product_image_derivatives ADD COLUMN generation_method TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN consent_match_status TEXT NOT NULL DEFAULT 'not_checked';
ALTER TABLE today_task_actions ADD COLUMN snooze_until TEXT;


-- Build 169 schema additions: derivative output, proof candidates, gift delivery, local SEO, QA state, smoke tests.
CREATE TABLE IF NOT EXISTS gift_card_delivery_templates (
  gift_card_delivery_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT,
  body TEXT,
  template_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS gift_card_delivery_queue (
  gift_card_delivery_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_id INTEGER,
  recipient_email TEXT,
  delivery_kind TEXT NOT NULL DEFAULT 'activation',
  template_key TEXT,
  subject TEXT,
  body TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  queued_by_user_id INTEGER,
  queued_at TEXT DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS public_proof_candidates (
  public_proof_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_kind TEXT NOT NULL DEFAULT 'stage_photo',
  source_id INTEGER,
  product_id INTEGER,
  custom_request_id INTEGER,
  proof_title TEXT,
  proof_body TEXT,
  image_url TEXT,
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  moderation_status TEXT NOT NULL DEFAULT 'needs_review',
  placement_context TEXT NOT NULL DEFAULT 'sitewide',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS marketplace_export_history (
  marketplace_export_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  export_format TEXT NOT NULL DEFAULT 'csv',
  product_count INTEGER NOT NULL DEFAULT 0,
  ready_count INTEGER NOT NULL DEFAULT 0,
  blocked_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS product_qa_panel_states (
  product_qa_panel_state_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER,
  panel_key TEXT NOT NULL DEFAULT 'catalog_qa',
  panel_state TEXT NOT NULL DEFAULT 'collapsed',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id,user_id,panel_key)
);
CREATE TABLE IF NOT EXISTS local_seo_bake_actions (
  local_seo_bake_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  proposed_title TEXT,
  proposed_meta_description TEXT,
  internal_link_notes TEXT,
  action_status TEXT NOT NULL DEFAULT 'queued',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS local_seo_competitor_phrases (
  local_seo_competitor_phrase_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  phrase TEXT NOT NULL,
  phrase_kind TEXT NOT NULL DEFAULT 'competitor_phrase',
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS candle_soap_recall_notification_queue (
  candle_soap_recall_notification_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recipient_email TEXT,
  notification_status TEXT NOT NULL DEFAULT 'draft',
  subject TEXT,
  body TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS post_deploy_smoke_test_results (
  post_deploy_smoke_test_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  page_url TEXT NOT NULL,
  check_kind TEXT NOT NULL DEFAULT 'manual',
  result_status TEXT NOT NULL DEFAULT 'pending',
  http_status INTEGER,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE product_image_derivatives ADD COLUMN before_image_url TEXT;
ALTER TABLE product_image_derivatives ADD COLUMN comparison_notes TEXT;

-- Build 170 deployment hardening and workflow schema notes
-- Added/extended by app code as defensive CREATE TABLE/ALTER TABLE calls:
-- product_image_derivatives: derivative URL worker fallback and featured-image promotion notes.
-- marketplace_export_history: snapshot_json, replayed_from_history_id, rollback_note.
-- marketplace_export_replay_events: channel replay/rollback audit.
-- public_proof_candidates: promoted_trust_block_item_id, promoted_at, source_label.
-- public_proof_candidate_events: promotion audit trail.
-- gift_card_delivery_queue: delivery sender/history bridge to notification_outbox.
-- gift_card_lookup_lockouts: admin lockout controls for public balance lookup abuse.
-- local_seo_competitor_phrases: last_page_score, phrase_count, last_scored_at.
-- product_qa_blocker_history: blocker resolution persistence.
-- candle_soap_recall_customer_matches and candle_soap_recall_notification_queue: recall matching and send-review drafts.
-- post_deploy_smoke_test_results: live URL smoke-test storage.
-- dark_theme_screenshot_evidence: dark-theme screenshot/review evidence rows.


-- Build 171 admin safety and release readiness schema additions.
CREATE TABLE IF NOT EXISTS dark_theme_screenshot_evidence (
  dark_theme_screenshot_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  evidence_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  checklist_key TEXT,
  section_label TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  contrast_status TEXT NOT NULL DEFAULT 'unchecked',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dark_theme_evidence_review ON dark_theme_screenshot_evidence(page_path, review_status, contrast_status, updated_at);

CREATE TABLE IF NOT EXISTS gift_card_provider_send_logs (
  gift_card_provider_send_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_delivery_queue_id INTEGER,
  gift_card_id INTEGER,
  provider TEXT,
  recipient_email TEXT,
  provider_message_id TEXT,
  send_status TEXT NOT NULL DEFAULT 'attempted',
  request_summary_json TEXT,
  response_summary_json TEXT,
  error_text TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gift_card_provider_send_logs_queue ON gift_card_provider_send_logs(gift_card_delivery_queue_id, created_at);

CREATE TABLE IF NOT EXISTS r2_derivative_health_checks (
  r2_derivative_health_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_status TEXT NOT NULL DEFAULT 'unknown',
  bucket_binding_name TEXT,
  object_key TEXT,
  public_base_url TEXT,
  worker_route TEXT,
  message TEXT,
  details_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_seo_competitor_phrase_score_history (
  local_seo_competitor_phrase_score_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_seo_competitor_phrase_id INTEGER,
  page_path TEXT,
  phrase TEXT,
  phrase_count INTEGER NOT NULL DEFAULT 0,
  page_score INTEGER NOT NULL DEFAULT 0,
  scoring_label TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketplace_export_replay_events (
  marketplace_export_replay_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  source_history_id INTEGER,
  action_kind TEXT NOT NULL DEFAULT 'replay',
  affected_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE marketplace_export_history ADD COLUMN snapshot_json TEXT;
ALTER TABLE marketplace_export_history ADD COLUMN replayed_from_history_id INTEGER;
ALTER TABLE marketplace_export_history ADD COLUMN rollback_note TEXT;
ALTER TABLE public_proof_candidates ADD COLUMN consent_source_url TEXT;
ALTER TABLE public_proof_candidates ADD COLUMN promotion_contexts_json TEXT;
ALTER TABLE candle_soap_batch_recalls ADD COLUMN send_review_status TEXT NOT NULL DEFAULT 'draft';

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_171_admin_safety_release_readiness',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Admin evidence bundle, gift-card provider logs, marketplace rollback, local SEO history, recalls, and release readiness. Build 172 hotfix: file_name is included so the NOT NULL ledger constraint passes.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_171_admin_safety_release_readiness');

-- Build 173 deployment preflight and release-run history.
CREATE TABLE IF NOT EXISTS deployment_preflight_runs (
  deployment_preflight_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  run_status TEXT NOT NULL DEFAULT 'warning',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deployment_preflight_runs_status ON deployment_preflight_runs(run_status, created_at DESC);

-- Build 174: deployment preflight detail, post-deploy confirmations, and release package manifest support.
-- Safe to run after Build 173; additive only.

CREATE TABLE IF NOT EXISTS deployment_post_deploy_confirmations (
  deployment_post_deploy_confirmation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  confirmation_key TEXT NOT NULL,
  confirmation_label TEXT,
  confirmation_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  confirmed_by_user_id INTEGER,
  confirmed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(build_label, confirmation_key)
);

CREATE INDEX IF NOT EXISTS idx_deploy_confirmations_status
  ON deployment_post_deploy_confirmations(build_label, confirmation_status, updated_at DESC);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_174_preflight_detail_manifest',
  'database_build174_deployment_preflight_detail.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Deployment preflight detail drawers, schema diff, Markdown export, post-deploy confirmations, R2 visibility, and release package manifest support.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_174_preflight_detail_manifest');

-- Build 175: release control center, deeper preflight checks, provider webhooks, recall compliance, and local business schema.
-- Safe to run after Build 174; additive only.

CREATE TABLE IF NOT EXISTS deployment_history (
  deployment_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  branch_name TEXT,
  commit_sha TEXT,
  deploy_url TEXT,
  build_zip_label TEXT,
  package_manifest_hash TEXT,
  deployment_status TEXT NOT NULL DEFAULT 'planned',
  promoted_by_user_id INTEGER,
  promoted_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deployment_history_status ON deployment_history(deployment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_history_build ON deployment_history(build_label, created_at DESC);

CREATE TABLE IF NOT EXISTS deployment_manifest_comparisons (
  deployment_manifest_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  expected_manifest_path TEXT NOT NULL DEFAULT '/data/site/release-package-manifest.json',
  deployed_manifest_url TEXT,
  comparison_status TEXT NOT NULL DEFAULT 'not_run',
  expected_file_count INTEGER NOT NULL DEFAULT 0,
  deployed_file_count INTEGER NOT NULL DEFAULT 0,
  missing_file_count INTEGER NOT NULL DEFAULT 0,
  changed_file_count INTEGER NOT NULL DEFAULT 0,
  comparison_json TEXT NOT NULL DEFAULT '{}',
  compared_by_user_id INTEGER,
  compared_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_manifest_comparisons_build ON deployment_manifest_comparisons(build_label, comparison_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS deployment_screenshot_jobs (
  deployment_screenshot_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  page_path TEXT NOT NULL,
  screenshot_kind TEXT NOT NULL DEFAULT 'dark_theme_regression',
  viewport_width INTEGER NOT NULL DEFAULT 390,
  viewport_height INTEGER NOT NULL DEFAULT 844,
  theme TEXT NOT NULL DEFAULT 'dark',
  capture_status TEXT NOT NULL DEFAULT 'queued',
  evidence_url TEXT,
  r2_object_key TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  captured_by_user_id INTEGER,
  captured_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_screenshot_jobs_status ON deployment_screenshot_jobs(capture_status, build_label, created_at DESC);

CREATE TABLE IF NOT EXISTS preflight_response_keyword_checks (
  preflight_response_keyword_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  keyword TEXT NOT NULL,
  keyword_kind TEXT NOT NULL DEFAULT 'local_search',
  is_required INTEGER NOT NULL DEFAULT 1,
  last_status TEXT NOT NULL DEFAULT 'not_checked',
  last_count INTEGER NOT NULL DEFAULT 0,
  last_checked_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, keyword, keyword_kind)
);
CREATE INDEX IF NOT EXISTS idx_preflight_keywords_page ON preflight_response_keyword_checks(page_path, last_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_queue (
  product_qa_bulk_fix_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_code TEXT NOT NULL,
  fix_type TEXT NOT NULL DEFAULT 'manual_review',
  product_ids_json TEXT NOT NULL DEFAULT '[]',
  product_count INTEGER NOT NULL DEFAULT 0,
  approval_status TEXT NOT NULL DEFAULT 'needs_approval',
  preview_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  approved_at TEXT,
  applied_at TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_bulk_fix_queue_status ON product_qa_bulk_fix_queue(approval_status, blocker_code, updated_at DESC);

CREATE TABLE IF NOT EXISTS r2_private_health_tests (
  r2_private_health_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_kind TEXT NOT NULL DEFAULT 'signed_download',
  bucket_label TEXT,
  object_key TEXT,
  test_status TEXT NOT NULL DEFAULT 'not_run',
  http_status INTEGER,
  checksum_sha256 TEXT,
  bytes_tested INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_r2_private_health_tests_status ON r2_private_health_tests(test_kind, test_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS accounting_evidence_bundle_checksums (
  accounting_evidence_bundle_checksum_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  export_label TEXT,
  attachment_count INTEGER NOT NULL DEFAULT 0,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  zip_sha256 TEXT,
  manifest_json TEXT NOT NULL DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'not_verified',
  verified_by_user_id INTEGER,
  verified_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_bundle_checksums_period ON accounting_evidence_bundle_checksums(period_month, verification_status, created_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_provider_webhook_events (
  gift_card_provider_webhook_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  event_type TEXT,
  provider_event_id TEXT,
  provider_message_id TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'received',
  gift_card_delivery_log_id INTEGER,
  payload_json TEXT NOT NULL DEFAULT '{}',
  received_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  notes TEXT,
  UNIQUE(provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS idx_gift_card_webhooks_provider ON gift_card_provider_webhook_events(provider, delivery_status, received_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_channel_validation_rules (
  marketplace_channel_validation_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  column_key TEXT NOT NULL,
  rule_kind TEXT NOT NULL DEFAULT 'required_column',
  is_required INTEGER NOT NULL DEFAULT 1,
  rule_status TEXT NOT NULL DEFAULT 'active',
  severity TEXT NOT NULL DEFAULT 'blocker',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, column_key, rule_kind)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_validation_rules_channel ON marketplace_channel_validation_rules(channel, rule_status, severity);

CREATE TABLE IF NOT EXISTS marketplace_export_snapshot_diffs (
  marketplace_export_snapshot_diff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  previous_history_id INTEGER,
  current_history_id INTEGER,
  diff_status TEXT NOT NULL DEFAULT 'not_run',
  changed_row_count INTEGER NOT NULL DEFAULT 0,
  changed_field_count INTEGER NOT NULL DEFAULT 0,
  diff_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_snapshot_diffs_channel ON marketplace_export_snapshot_diffs(channel, diff_status, created_at DESC);

CREATE TABLE IF NOT EXISTS recall_compliance_reviews (
  recall_compliance_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  legal_note TEXT,
  compliance_note TEXT,
  approval_signature TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_compliance_reviews_batch ON recall_compliance_reviews(batch_number, review_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS recall_customer_previews (
  recall_customer_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  customer_id INTEGER,
  customer_email TEXT,
  product_summary TEXT,
  order_summary TEXT,
  preview_subject TEXT,
  preview_body TEXT,
  preview_status TEXT NOT NULL DEFAULT 'draft',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_customer_previews_batch ON recall_customer_previews(batch_number, preview_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS mobile_admin_saved_views (
  mobile_admin_saved_view_id INTEGER PRIMARY KEY AUTOINCREMENT,
  view_key TEXT NOT NULL UNIQUE,
  view_label TEXT NOT NULL,
  page_path TEXT NOT NULL,
  device_target TEXT NOT NULL DEFAULT 'phone',
  filter_json TEXT NOT NULL DEFAULT '{}',
  sort_json TEXT NOT NULL DEFAULT '{}',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mobile_admin_saved_views_target ON mobile_admin_saved_views(device_target, is_default, updated_at DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_settings (
  local_business_schema_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL DEFAULT 'Devil n Dove',
  canonical_url TEXT NOT NULL DEFAULT 'https://devilndove.com/',
  telephone TEXT,
  email TEXT,
  area_served_json TEXT NOT NULL DEFAULT '["Southern Ontario","Oxford County","Norfolk County"]',
  service_types_json TEXT NOT NULL DEFAULT '["handmade jewelry","custom gifts","laser engraving","custom candles","custom soap"]',
  same_as_json TEXT NOT NULL DEFAULT '[]',
  schema_status TEXT NOT NULL DEFAULT 'draft',
  schema_json TEXT NOT NULL DEFAULT '{}',
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_status ON local_business_schema_settings(schema_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS safe_deploy_export_records (
  safe_deploy_export_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  export_label TEXT,
  release_notes_path TEXT DEFAULT 'RELEASE_NOTES.md',
  preflight_markdown_path TEXT,
  manifest_path TEXT DEFAULT 'data/site/release-package-manifest.json',
  schema_paths_json TEXT NOT NULL DEFAULT '[]',
  smoke_results_json TEXT NOT NULL DEFAULT '{}',
  export_status TEXT NOT NULL DEFAULT 'planned',
  zip_sha256 TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_safe_deploy_exports_build ON safe_deploy_export_records(build_label, export_status, created_at DESC);

CREATE TABLE IF NOT EXISTS preflight_runtime_incident_links (
  preflight_runtime_incident_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_preflight_run_id INTEGER,
  runtime_incident_id INTEGER,
  check_code TEXT,
  page_path TEXT,
  link_status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_preflight_incident_links_run ON preflight_runtime_incident_links(deployment_preflight_run_id, link_status, created_at DESC);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_175_release_control_center',
  'database_build175_release_control.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Release control center, deployment history, manifest comparison, screenshot jobs, deeper URL keyword checks, QA bulk queues, R2 signed tests, gift-card webhooks, marketplace validation, recall compliance previews, mobile saved views, and local business schema output.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_175_release_control_center');

-- Build 176: release safety controls, downloadable safe deploy package, QA previews, recall locks, and richer local SEO schema.
-- Safe to run after Build 175; additive only.

CREATE TABLE IF NOT EXISTS safe_deploy_package_downloads (
  safe_deploy_package_download_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  package_kind TEXT NOT NULL DEFAULT 'safe_deploy_zip',
  included_files_json TEXT NOT NULL DEFAULT '[]',
  file_count INTEGER NOT NULL DEFAULT 0,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  zip_sha256 TEXT,
  download_status TEXT NOT NULL DEFAULT 'prepared',
  prepared_by_user_id INTEGER,
  prepared_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_safe_deploy_package_downloads_build ON safe_deploy_package_downloads(build_label, download_status, prepared_at DESC);

CREATE TABLE IF NOT EXISTS release_manifest_live_diffs (
  release_manifest_live_diff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  expected_manifest_url TEXT,
  deployed_manifest_url TEXT,
  diff_status TEXT NOT NULL DEFAULT 'not_run',
  expected_file_count INTEGER NOT NULL DEFAULT 0,
  deployed_file_count INTEGER NOT NULL DEFAULT 0,
  missing_file_count INTEGER NOT NULL DEFAULT 0,
  changed_file_count INTEGER NOT NULL DEFAULT 0,
  extra_file_count INTEGER NOT NULL DEFAULT 0,
  diff_json TEXT NOT NULL DEFAULT '{}',
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_release_manifest_live_diffs_build ON release_manifest_live_diffs(build_label, diff_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_export_validation_runs (
  marketplace_export_validation_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  export_history_id INTEGER,
  validation_status TEXT NOT NULL DEFAULT 'not_run',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  checked_rows INTEGER NOT NULL DEFAULT 0,
  result_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_export_validation_runs_channel ON marketplace_export_validation_runs(channel, validation_status, created_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_preview_items (
  product_qa_bulk_fix_preview_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER,
  product_id INTEGER NOT NULL,
  blocker_code TEXT NOT NULL,
  focus_field TEXT,
  current_value TEXT,
  suggested_value TEXT,
  fix_url TEXT,
  preview_status TEXT NOT NULL DEFAULT 'needs_review',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_preview_items_queue ON product_qa_bulk_fix_preview_items(product_qa_bulk_fix_queue_id, preview_status, blocker_code);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_apply_events (
  product_qa_bulk_fix_apply_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER,
  apply_status TEXT NOT NULL DEFAULT 'preview_only',
  applied_field TEXT,
  applied_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  event_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  applied_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_apply_events_queue ON product_qa_bulk_fix_apply_events(product_qa_bulk_fix_queue_id, apply_status, created_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_webhook_signature_checks (
  gift_card_webhook_signature_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  event_id INTEGER,
  signature_status TEXT NOT NULL DEFAULT 'not_checked',
  signature_header_present INTEGER NOT NULL DEFAULT 0,
  timestamp_header_present INTEGER NOT NULL DEFAULT 0,
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_gift_card_signature_checks_provider ON gift_card_webhook_signature_checks(provider, signature_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS recall_notification_locks (
  recall_notification_lock_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  lock_status TEXT NOT NULL DEFAULT 'locked_pending_review',
  required_review_status TEXT NOT NULL DEFAULT 'approved',
  matching_review_id INTEGER,
  last_checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  checked_by_user_id INTEGER,
  notes TEXT,
  UNIQUE(batch_number, recall_id)
);
CREATE INDEX IF NOT EXISTS idx_recall_notification_locks_status ON recall_notification_locks(lock_status, batch_number, last_checked_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_internal_link_suggestions (
  local_seo_internal_link_suggestion_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  suggested_anchor TEXT,
  reason TEXT,
  suggestion_status TEXT NOT NULL DEFAULT 'needs_review',
  score INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_path, target_path, suggested_anchor)
);
CREATE INDEX IF NOT EXISTS idx_local_link_suggestions_status ON local_seo_internal_link_suggestions(suggestion_status, score DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_search_console_trends (
  local_seo_search_console_trend_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  query_text TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  average_position REAL NOT NULL DEFAULT 0,
  period_start TEXT,
  period_end TEXT,
  trend_status TEXT NOT NULL DEFAULT 'imported',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_search_console_trends_page ON local_seo_search_console_trends(page_path, period_end DESC, impressions DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_bakes (
  local_business_schema_bake_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_setting_id INTEGER,
  bake_status TEXT NOT NULL DEFAULT 'draft',
  target_paths_json TEXT NOT NULL DEFAULT '[]',
  schema_json TEXT NOT NULL DEFAULT '{}',
  output_path TEXT DEFAULT 'data/site/local-business-schema.json',
  baked_by_user_id INTEGER,
  baked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_bakes_status ON local_business_schema_bakes(bake_status, baked_at DESC);

CREATE TABLE IF NOT EXISTS deployment_rollback_checklist_rows (
  deployment_rollback_checklist_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_history_id INTEGER,
  build_label TEXT,
  checklist_key TEXT NOT NULL,
  checklist_label TEXT NOT NULL,
  checklist_status TEXT NOT NULL DEFAULT 'not_checked',
  required_before_rollback INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(build_label, checklist_key)
);
CREATE INDEX IF NOT EXISTS idx_deployment_rollback_checklist_status ON deployment_rollback_checklist_rows(build_label, checklist_status, required_before_rollback);

CREATE TABLE IF NOT EXISTS cloudflare_deployment_import_runs (
  cloudflare_deployment_import_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_status TEXT NOT NULL DEFAULT 'not_configured',
  account_id_present INTEGER NOT NULL DEFAULT 0,
  project_name_present INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  response_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_cloudflare_import_runs_status ON cloudflare_deployment_import_runs(import_status, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_notification_routes (
  admin_notification_route_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_key TEXT NOT NULL UNIQUE,
  route_label TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'preflight',
  destination_page TEXT NOT NULL DEFAULT '/admin/',
  min_severity TEXT NOT NULL DEFAULT 'warn',
  route_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_notification_routes_status ON admin_notification_routes(route_status, source_kind, min_severity);

CREATE TABLE IF NOT EXISTS local_business_schema_extended_fields (
  local_business_schema_extended_field_id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_business_schema_setting_id INTEGER,
  opening_hours_json TEXT NOT NULL DEFAULT '[]',
  logo_url TEXT,
  image_url TEXT,
  payment_accepted_json TEXT NOT NULL DEFAULT '["Cash","Credit Card","Debit","E-transfer"]',
  price_range TEXT DEFAULT '$$',
  address_json TEXT NOT NULL DEFAULT '{}',
  geo_json TEXT NOT NULL DEFAULT '{}',
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(local_business_schema_setting_id)
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_extended_fields_setting ON local_business_schema_extended_fields(local_business_schema_setting_id, updated_at DESC);

INSERT OR IGNORE INTO admin_notification_routes (route_key, route_label, source_kind, destination_page, min_severity, route_status, created_at, updated_at)
VALUES
  ('preflight_blockers_dashboard', 'Preflight blockers to dashboard', 'preflight', '/admin/deployment-preflight/', 'fail', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('release_manifest_dashboard', 'Release manifest diffs to release control', 'release', '/admin/release-control/', 'warn', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('recall_lock_dashboard', 'Recall locks to recall admin', 'recall', '/admin/release-control/#recall-locks', 'warn', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_176_release_safety_controls',
  'database_build176_release_safety_controls.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Adds safe deploy package download tracking, live manifest diffs, marketplace validation previews, Product QA preview items, recall notification locks, gift-card webhook signature checks, local SEO link/trend rows, richer LocalBusiness bake tracking, rollback checklist rows, Cloudflare deployment import runs, and notification routes.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_176_release_safety_controls');



-- Build 177: deploy-readiness score, Cloudflare import, rollback controls, exact manifest diff rows, QA approvals, recall/customer previews, R2 private evidence test rows, and LocalBusiness JSON-LD injection targets.
-- Safe to run after Build 176; additive only.

CREATE TABLE IF NOT EXISTS release_manifest_diff_items (
  release_manifest_diff_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  release_manifest_live_diff_id INTEGER,
  build_label TEXT,
  file_path TEXT NOT NULL,
  diff_kind TEXT NOT NULL DEFAULT 'changed',
  expected_sha256 TEXT,
  deployed_sha256 TEXT,
  item_status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_release_manifest_diff_items_diff ON release_manifest_diff_items(release_manifest_live_diff_id, diff_kind, item_status);
CREATE INDEX IF NOT EXISTS idx_release_manifest_diff_items_file ON release_manifest_diff_items(file_path, diff_kind);

CREATE TABLE IF NOT EXISTS deployment_readiness_scores (
  deployment_readiness_score_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  score_status TEXT NOT NULL DEFAULT 'not_ready',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  manifest_blocker_count INTEGER NOT NULL DEFAULT 0,
  smoke_blocker_count INTEGER NOT NULL DEFAULT 0,
  rollback_blocker_count INTEGER NOT NULL DEFAULT 0,
  d1_marker_count INTEGER NOT NULL DEFAULT 0,
  score_json TEXT NOT NULL DEFAULT '{}',
  scored_by_user_id INTEGER,
  scored_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_deployment_readiness_scores_build ON deployment_readiness_scores(build_label, score_status, scored_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_approvals (
  product_qa_bulk_fix_approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'manual_only',
  approval_scope TEXT NOT NULL DEFAULT 'preview_group',
  approval_notes TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_bulk_fix_approvals_queue ON product_qa_bulk_fix_approvals(product_qa_bulk_fix_queue_id, approval_status, approved_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_channel_validation_rule_edits (
  marketplace_channel_validation_rule_edit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  column_key TEXT NOT NULL,
  rule_kind TEXT NOT NULL DEFAULT 'required_column',
  is_required INTEGER NOT NULL DEFAULT 1,
  severity TEXT NOT NULL DEFAULT 'blocker',
  rule_status TEXT NOT NULL DEFAULT 'active',
  edited_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, column_key, rule_kind)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_rule_edits_channel ON marketplace_channel_validation_rule_edits(channel, rule_status, severity);

CREATE TABLE IF NOT EXISTS recall_customer_match_previews (
  recall_customer_match_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  product_id INTEGER,
  order_id INTEGER,
  customer_email TEXT,
  customer_name TEXT,
  match_source TEXT NOT NULL DEFAULT 'order_product_batch',
  preview_status TEXT NOT NULL DEFAULT 'needs_review',
  notification_subject TEXT,
  notification_body TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_customer_matches_batch ON recall_customer_match_previews(batch_number, preview_status, created_at DESC);

CREATE TABLE IF NOT EXISTS r2_signed_download_health_tests (
  r2_signed_download_health_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_kind TEXT NOT NULL DEFAULT 'create_get_delete',
  bucket_label TEXT,
  object_key TEXT,
  create_status TEXT NOT NULL DEFAULT 'not_run',
  get_status TEXT NOT NULL DEFAULT 'not_run',
  delete_status TEXT NOT NULL DEFAULT 'not_run',
  checksum_sha256 TEXT,
  bytes_tested INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_r2_signed_download_tests_status ON r2_signed_download_health_tests(test_kind, create_status, get_status, delete_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS accounting_zip_checksum_links (
  accounting_zip_checksum_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  accounting_evidence_bundle_checksum_id INTEGER,
  safe_deploy_package_download_id INTEGER,
  period_month TEXT,
  zip_sha256 TEXT,
  link_status TEXT NOT NULL DEFAULT 'linked',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_accounting_zip_checksum_links_period ON accounting_zip_checksum_links(period_month, link_status, created_at DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_injection_targets (
  local_business_schema_injection_target_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  injection_status TEXT NOT NULL DEFAULT 'queued',
  schema_source TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  last_baked_at TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_business_injection_targets_status ON local_business_schema_injection_targets(injection_status, page_path);

CREATE TABLE IF NOT EXISTS dashboard_notification_cards (
  dashboard_notification_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_kind TEXT NOT NULL,
  source_id INTEGER,
  card_title TEXT NOT NULL,
  card_body TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  destination_page TEXT NOT NULL DEFAULT '/admin/',
  card_status TEXT NOT NULL DEFAULT 'open',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dashboard_notification_cards_status ON dashboard_notification_cards(card_status, severity, created_at DESC);

INSERT OR IGNORE INTO local_business_schema_injection_targets (page_path, injection_status, schema_source, notes, created_at, updated_at)
VALUES
  ('/', 'queued', 'data/site/local-business-schema.json', 'Homepage JSON-LD target for LocalBusiness bake.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('/handmade-jewelry-ontario/', 'queued', 'data/site/local-business-schema.json', 'Local handmade jewelry landing page JSON-LD target.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('/custom-gifts-southern-ontario/', 'queued', 'data/site/local-business-schema.json', 'Custom gifts local landing page JSON-LD target.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('/laser-engraving-ontario/', 'queued', 'data/site/local-business-schema.json', 'Laser engraving local landing page JSON-LD target.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_177_deploy_score_and_controls',
  'database_build177_deploy_score_and_controls.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Adds deploy-readiness scores, real Cloudflare deployment import storage, exact manifest diff item rows, rollback status controls, Product QA preview approvals and safe image-alt apply logging, marketplace rule editor rows, recall customer preview rows, private R2 evidence test rows, accounting ZIP checksum links, LocalBusiness JSON-LD injection targets, and dashboard notification cards.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_177_deploy_score_and_controls');

-- Build 178: deploy-readiness page, promote-live guardrails, marketplace row validation, recall copy review, webhook/R2 verification rows, local SEO chart/map helpers, LocalBusiness edit drafts, and notification snooze controls.

CREATE TABLE IF NOT EXISTS deployment_promote_live_checklist (
  deployment_promote_live_checklist_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  checklist_key TEXT NOT NULL,
  checklist_label TEXT NOT NULL,
  checklist_status TEXT NOT NULL DEFAULT 'needs_review',
  required_to_promote INTEGER NOT NULL DEFAULT 1,
  source_kind TEXT,
  source_id INTEGER,
  blocking_reason TEXT,
  resolved_note TEXT,
  resolved_by_user_id INTEGER,
  resolved_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(build_label, checklist_key)
);
CREATE INDEX IF NOT EXISTS idx_deployment_promote_live_checklist_status ON deployment_promote_live_checklist(build_label, checklist_status, required_to_promote);

CREATE TABLE IF NOT EXISTS deployment_readiness_drilldown_rows (
  deployment_readiness_drilldown_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_key TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  row_label TEXT NOT NULL,
  row_detail TEXT,
  destination_page TEXT,
  drilldown_status TEXT NOT NULL DEFAULT 'open',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deployment_readiness_drilldown_rows_status ON deployment_readiness_drilldown_rows(build_label, severity, drilldown_status, created_at DESC);

CREATE TABLE IF NOT EXISTS release_manifest_diff_view_filters (
  release_manifest_diff_view_filter_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_key TEXT NOT NULL UNIQUE,
  filter_label TEXT NOT NULL,
  diff_kind TEXT,
  path_contains TEXT,
  item_status TEXT,
  sort_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_apply_confirmations (
  product_qa_bulk_fix_apply_confirmation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER NOT NULL,
  confirmation_key TEXT NOT NULL DEFAULT 'apply_confirmed',
  confirmation_status TEXT NOT NULL DEFAULT 'pending',
  confirmed_by_user_id INTEGER,
  confirmed_at TEXT,
  confirmation_json TEXT NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_qa_bulk_fix_queue_id, confirmation_key)
);
CREATE INDEX IF NOT EXISTS idx_product_qa_apply_confirmations_status ON product_qa_bulk_fix_apply_confirmations(confirmation_status, confirmed_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_safe_apply_events (
  product_qa_safe_apply_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER,
  apply_kind TEXT NOT NULL,
  apply_status TEXT NOT NULL DEFAULT 'preview_only',
  affected_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  before_after_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_safe_apply_events_kind ON product_qa_safe_apply_events(apply_kind, apply_status, created_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_export_row_validation_results (
  marketplace_export_row_validation_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  product_id INTEGER,
  validation_status TEXT NOT NULL DEFAULT 'needs_review',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  missing_fields_json TEXT NOT NULL DEFAULT '[]',
  row_payload_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_row_validation_channel ON marketplace_export_row_validation_results(channel, validation_status, created_at DESC);

CREATE TABLE IF NOT EXISTS recall_customer_notification_copy_reviews (
  recall_customer_notification_copy_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  recall_customer_match_preview_id INTEGER,
  batch_number TEXT NOT NULL,
  customer_email TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  subject_preview TEXT,
  body_preview TEXT,
  compliance_notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_copy_reviews_status ON recall_customer_notification_copy_reviews(batch_number, review_status, created_at DESC);

CREATE TABLE IF NOT EXISTS recall_compliance_signature_attachments (
  recall_compliance_signature_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  candle_soap_batch_recall_id INTEGER,
  batch_number TEXT NOT NULL,
  attachment_kind TEXT NOT NULL DEFAULT 'signature_evidence',
  signer_name TEXT,
  evidence_url TEXT,
  r2_object_key TEXT,
  attachment_status TEXT NOT NULL DEFAULT 'needs_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_signature_attachments_batch ON recall_compliance_signature_attachments(batch_number, attachment_status, created_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_webhook_signature_verification_logs (
  gift_card_webhook_signature_verification_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  signature_status TEXT NOT NULL DEFAULT 'not_checked',
  algorithm TEXT,
  header_snapshot_json TEXT NOT NULL DEFAULT '{}',
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  verification_notes TEXT,
  event_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gift_card_webhook_verification_provider ON gift_card_webhook_signature_verification_logs(provider, signature_status, created_at DESC);

CREATE TABLE IF NOT EXISTS r2_signed_url_verification_results (
  r2_signed_url_verification_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket_label TEXT NOT NULL,
  object_key TEXT,
  signed_url_status TEXT NOT NULL DEFAULT 'not_configured',
  put_status TEXT NOT NULL DEFAULT 'not_run',
  get_status TEXT NOT NULL DEFAULT 'not_run',
  delete_status TEXT NOT NULL DEFAULT 'not_run',
  expires_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_r2_signed_url_verification_status ON r2_signed_url_verification_results(signed_url_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_search_console_chart_points (
  local_seo_search_console_chart_point_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  query_text TEXT,
  metric_kind TEXT NOT NULL DEFAULT 'impressions',
  metric_value REAL NOT NULL DEFAULT 0,
  period_start TEXT,
  period_end TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_seo_chart_points_page ON local_seo_search_console_chart_points(page_path, metric_kind, period_end DESC);

CREATE TABLE IF NOT EXISTS internal_link_map_edges (
  internal_link_map_edge_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  anchor_text TEXT,
  edge_status TEXT NOT NULL DEFAULT 'suggested',
  score INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_path, target_path, anchor_text)
);
CREATE INDEX IF NOT EXISTS idx_internal_link_map_edges_status ON internal_link_map_edges(edge_status, score DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_edit_drafts (
  local_business_schema_edit_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_status TEXT NOT NULL DEFAULT 'draft',
  business_name TEXT,
  canonical_url TEXT,
  telephone TEXT,
  email TEXT,
  area_served_json TEXT NOT NULL DEFAULT '[]',
  service_types_json TEXT NOT NULL DEFAULT '[]',
  same_as_json TEXT NOT NULL DEFAULT '[]',
  opening_hours_json TEXT NOT NULL DEFAULT '[]',
  address_json TEXT NOT NULL DEFAULT '{}',
  geo_json TEXT NOT NULL DEFAULT '{}',
  draft_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_edit_drafts_status ON local_business_schema_edit_drafts(draft_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS structured_data_validation_hints (
  structured_data_validation_hint_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL,
  hint_status TEXT NOT NULL DEFAULT 'needs_review',
  hint_severity TEXT NOT NULL DEFAULT 'info',
  hint_label TEXT NOT NULL,
  hint_detail TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_structured_data_validation_hints_page ON structured_data_validation_hints(page_path, schema_type, hint_status);

CREATE TABLE IF NOT EXISTS release_package_previous_zip_comparisons (
  release_package_previous_zip_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT,
  current_build_label TEXT NOT NULL,
  previous_build_label TEXT,
  current_manifest_hash TEXT,
  previous_manifest_hash TEXT,
  added_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  comparison_json TEXT NOT NULL DEFAULT '{}',
  comparison_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_release_zip_comparisons_build ON release_package_previous_zip_comparisons(current_build_label, created_at DESC);

CREATE TABLE IF NOT EXISTS dashboard_notification_card_snoozes (
  dashboard_notification_card_snooze_id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_notification_card_id INTEGER NOT NULL,
  snooze_until TEXT,
  snooze_status TEXT NOT NULL DEFAULT 'active',
  snooze_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dashboard_card_snoozes_status ON dashboard_notification_card_snoozes(snooze_status, snooze_until);

CREATE TABLE IF NOT EXISTS mobile_release_control_cards (
  mobile_release_control_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_key TEXT NOT NULL UNIQUE,
  card_label TEXT NOT NULL,
  destination_page TEXT NOT NULL DEFAULT '/admin/release-control/',
  card_status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mobile_release_control_cards_status ON mobile_release_control_cards(card_status, sort_order);

INSERT OR IGNORE INTO release_manifest_diff_view_filters (filter_key, filter_label, diff_kind, path_contains, item_status, sort_json, created_at, updated_at)
VALUES
  ('changed_public_pages', 'Changed public pages', 'changed', '.html', 'open', '{"sort":"file_path"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('missing_schema_or_data', 'Missing schema/data files', 'missing', 'data/', 'open', '{"sort":"file_path"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('changed_functions', 'Changed API functions', 'changed', 'functions/', 'open', '{"sort":"file_path"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO mobile_release_control_cards (card_key, card_label, destination_page, card_status, sort_order, payload_json, created_at, updated_at)
VALUES
  ('deploy_score', 'Deploy score', '/admin/deploy-readiness/', 'active', 10, '{"view":"score"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('manifest_diff', 'Manifest diff', '/admin/release-control/#manifest-diff', 'active', 20, '{"view":"manifest"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('recall_locks', 'Recall locks', '/admin/release-control/#recall-locks', 'active', 30, '{"view":"recall"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('safe_zip', 'Safe ZIP', '/admin/safe-deploy-package/', 'active', 40, '{"view":"zip"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('promote_live', 'Promote-live checklist', '/admin/deploy-readiness/#promote-live', 'active', 50, '{"view":"promote"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_178_promote_live_controls',
  'database_build178_promote_live_controls.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Adds deploy-readiness page support, promote-live checklist rows, manifest filters, QA apply confirmations, marketplace row validation, recall copy review/signature evidence rows, webhook/R2 verification logs, local SEO charts/link maps, LocalBusiness edit drafts, structured-data hints, dashboard snooze controls, mobile release cards, and previous ZIP comparison rows.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_178_promote_live_controls');



-- Build 179 promotion control additive migration.
-- Build 179 promotion control, local SEO visuals, provider verification, and go-live gates.
-- Safe additive migration. Run after database_build178_promote_live_controls.sql.

CREATE TABLE IF NOT EXISTS product_qa_safe_apply_rules (
  product_qa_safe_apply_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_code TEXT NOT NULL UNIQUE,
  apply_field TEXT NOT NULL,
  rule_status TEXT NOT NULL DEFAULT 'approval_required',
  requires_confirmation INTEGER NOT NULL DEFAULT 1,
  max_rows_per_run INTEGER NOT NULL DEFAULT 25,
  safety_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_seo_visual_chart_configs (
  local_seo_visual_chart_config_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  chart_key TEXT NOT NULL,
  chart_label TEXT NOT NULL,
  metric_kind TEXT NOT NULL DEFAULT 'impressions',
  period_label TEXT,
  chart_status TEXT NOT NULL DEFAULT 'active',
  config_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, chart_key)
);

CREATE TABLE IF NOT EXISTS internal_link_graph_snapshots (
  internal_link_graph_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_label TEXT NOT NULL,
  node_count INTEGER NOT NULL DEFAULT 0,
  edge_count INTEGER NOT NULL DEFAULT 0,
  missing_link_count INTEGER NOT NULL DEFAULT 0,
  graph_json TEXT NOT NULL DEFAULT '{}',
  snapshot_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_business_schema_bake_approvals (
  local_business_schema_bake_approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_business_schema_edit_draft_id INTEGER,
  approval_status TEXT NOT NULL DEFAULT 'needs_review',
  output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  target_paths_json TEXT NOT NULL DEFAULT '[]',
  schema_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  approved_at TEXT,
  bake_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_webhook_signature_secret_checks (
  provider_webhook_signature_secret_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  expected_secret_binding TEXT,
  signature_header_name TEXT,
  timestamp_header_name TEXT,
  secret_present INTEGER NOT NULL DEFAULT 0,
  signature_header_present INTEGER NOT NULL DEFAULT 0,
  timestamp_header_present INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'not_checked',
  verification_notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS r2_signed_url_expiry_tests (
  r2_signed_url_expiry_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket_label TEXT NOT NULL,
  object_key TEXT,
  create_status TEXT NOT NULL DEFAULT 'not_run',
  signed_url_status TEXT NOT NULL DEFAULT 'not_run',
  expiry_status TEXT NOT NULL DEFAULT 'not_run',
  expires_seconds INTEGER NOT NULL DEFAULT 60,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS recall_signature_evidence_uploads (
  recall_signature_evidence_upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  evidence_url TEXT,
  r2_object_key TEXT,
  upload_status TEXT NOT NULL DEFAULT 'metadata_only',
  uploaded_by_user_id INTEGER,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS recall_notification_release_gates (
  recall_notification_release_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  copy_review_status TEXT NOT NULL DEFAULT 'needs_review',
  signature_status TEXT NOT NULL DEFAULT 'needs_review',
  customer_match_status TEXT NOT NULL DEFAULT 'needs_review',
  release_status TEXT NOT NULL DEFAULT 'blocked',
  gate_notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batch_number, recall_id)
);

CREATE TABLE IF NOT EXISTS accounting_zip_export_links (
  accounting_zip_export_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  accountant_export_id INTEGER,
  safe_deploy_package_download_id INTEGER,
  zip_sha256 TEXT,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  evidence_file_count INTEGER NOT NULL DEFAULT 0,
  link_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS previous_zip_manifest_imports (
  previous_zip_manifest_import_id INTEGER PRIMARY KEY AUTOINCREMENT,
  previous_build_label TEXT,
  current_build_label TEXT NOT NULL,
  previous_manifest_json TEXT NOT NULL DEFAULT '{}',
  current_manifest_json TEXT NOT NULL DEFAULT '{}',
  added_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  import_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS dashboard_notification_card_actions (
  dashboard_notification_card_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_notification_card_id INTEGER NOT NULL,
  action_kind TEXT NOT NULL DEFAULT 'snooze',
  action_status TEXT NOT NULL DEFAULT 'active',
  snooze_until TEXT,
  action_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mobile_release_control_render_preferences (
  mobile_release_control_render_preference_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  preference_key TEXT NOT NULL DEFAULT 'mobile_release_cards',
  compact_mode INTEGER NOT NULL DEFAULT 1,
  large_tap_targets INTEGER NOT NULL DEFAULT 1,
  visible_cards_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, preference_key)
);

CREATE TABLE IF NOT EXISTS structured_data_page_previews (
  structured_data_page_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL,
  preview_status TEXT NOT NULL DEFAULT 'needs_review',
  jsonld_excerpt TEXT,
  issue_count INTEGER NOT NULL DEFAULT 0,
  validation_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, schema_type)
);

CREATE TABLE IF NOT EXISTS marketplace_export_download_gates (
  marketplace_export_download_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  export_history_id INTEGER,
  validation_run_id INTEGER,
  gate_status TEXT NOT NULL DEFAULT 'blocked_pending_validation',
  hard_blocker_count INTEGER NOT NULL DEFAULT 0,
  manual_override_required INTEGER NOT NULL DEFAULT 0,
  override_by_user_id INTEGER,
  override_at TEXT,
  gate_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, export_history_id)
);

CREATE TABLE IF NOT EXISTS release_rollback_row_actions (
  release_rollback_row_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_rollback_checklist_row_id INTEGER NOT NULL,
  action_status TEXT NOT NULL DEFAULT 'not_checked',
  action_note TEXT,
  acted_by_user_id INTEGER,
  acted_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS release_manifest_path_filter_runs (
  release_manifest_path_filter_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_key TEXT NOT NULL,
  diff_kind TEXT,
  path_contains TEXT,
  matched_count INTEGER NOT NULL DEFAULT 0,
  run_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  result_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS deployment_readiness_markdown_exports (
  deployment_readiness_markdown_export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  export_status TEXT NOT NULL DEFAULT 'prepared',
  markdown_body TEXT NOT NULL,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloudflare_deployment_release_matches (
  cloudflare_deployment_release_match_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_history_id INTEGER,
  build_label TEXT,
  branch_name TEXT,
  commit_sha TEXT,
  manifest_hash TEXT,
  match_status TEXT NOT NULL DEFAULT 'needs_review',
  match_score INTEGER NOT NULL DEFAULT 0,
  matched_by_user_id INTEGER,
  matched_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS promote_live_attempts (
  promote_live_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  attempt_status TEXT NOT NULL DEFAULT 'blocked',
  readiness_score INTEGER NOT NULL DEFAULT 0,
  blocker_count INTEGER NOT NULL DEFAULT 0,
  checklist_blocker_count INTEGER NOT NULL DEFAULT 0,
  smoke_blocker_count INTEGER NOT NULL DEFAULT 0,
  manifest_blocker_count INTEGER NOT NULL DEFAULT 0,
  d1_marker_blocker_count INTEGER NOT NULL DEFAULT 0,
  attempted_by_user_id INTEGER,
  attempted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS post_promotion_incident_watch_runs (
  post_promotion_incident_watch_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  watch_status TEXT NOT NULL DEFAULT 'not_run',
  runtime_404_count INTEGER NOT NULL DEFAULT 0,
  runtime_500_count INTEGER NOT NULL DEFAULT 0,
  provider_failure_count INTEGER NOT NULL DEFAULT 0,
  incident_rows_created INTEGER NOT NULL DEFAULT 0,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT OR IGNORE INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_179_promotion_control', 'database_build179_promotion_control.sql', CURRENT_TIMESTAMP, 'Build 179 promotion control, LocalBusiness bake approvals, provider/R2 verification, recall gates, marketplace gates, release matching, and post-promotion incident watcher.');

-- Build 180: Go-live execution controls, direct endpoint gates, visual SEO helpers, and post-promotion scheduling.
-- Safe additive migration only. Run after database_build179_promotion_control.sql.

CREATE TABLE IF NOT EXISTS product_qa_safe_apply_runs (
  product_qa_safe_apply_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 180',
  product_qa_bulk_fix_queue_id INTEGER,
  blocker_code TEXT NOT NULL,
  run_mode TEXT NOT NULL DEFAULT 'preview',
  apply_status TEXT NOT NULL DEFAULT 'preview_only',
  affected_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  run_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_safe_apply_runs_queue ON product_qa_safe_apply_runs(product_qa_bulk_fix_queue_id, blocker_code, created_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_chart_render_runs (
  local_seo_chart_render_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  metric_kind TEXT NOT NULL DEFAULT 'impressions',
  point_count INTEGER NOT NULL DEFAULT 0,
  min_value REAL NOT NULL DEFAULT 0,
  max_value REAL NOT NULL DEFAULT 0,
  svg_markup TEXT,
  render_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_seo_chart_render_runs_page ON local_seo_chart_render_runs(page_path, metric_kind, created_at DESC);

CREATE TABLE IF NOT EXISTS internal_link_graph_interactions (
  internal_link_graph_interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT,
  target_path TEXT,
  filter_kind TEXT NOT NULL DEFAULT 'click_through',
  interaction_status TEXT NOT NULL DEFAULT 'prepared',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_business_d1_export_bakes (
  local_business_d1_export_bake_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_table TEXT NOT NULL DEFAULT 'local_business_schema_settings',
  output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  target_paths_json TEXT NOT NULL DEFAULT '[]',
  schema_json TEXT NOT NULL DEFAULT '{}',
  bake_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_webhook_verification_runs (
  provider_webhook_verification_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  endpoint_path TEXT NOT NULL,
  signature_header TEXT,
  timestamp_header TEXT,
  verification_status TEXT NOT NULL DEFAULT 'setup_required',
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_provider_webhook_verification_runs_provider ON provider_webhook_verification_runs(provider, checked_at DESC);

CREATE TABLE IF NOT EXISTS r2_signed_download_route_tests (
  r2_signed_download_route_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL DEFAULT '/api/admin/private-evidence-download',
  object_key TEXT,
  token_status TEXT NOT NULL DEFAULT 'not_run',
  download_status TEXT NOT NULL DEFAULT 'not_run',
  expiry_status TEXT NOT NULL DEFAULT 'not_run',
  expires_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recall_evidence_ui_uploads (
  recall_evidence_ui_upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  source_page TEXT NOT NULL DEFAULT '/admin/candle-soap-recalls/',
  upload_status TEXT NOT NULL DEFAULT 'needs_upload',
  evidence_url TEXT,
  r2_object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recall_endpoint_gate_checks (
  recall_endpoint_gate_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  endpoint_path TEXT NOT NULL DEFAULT '/api/admin/candle-soap-recall-notifications',
  legacy_lock_status TEXT,
  release_gate_status TEXT,
  endpoint_gate_status TEXT NOT NULL DEFAULT 'blocked',
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_recall_endpoint_gate_checks_batch ON recall_endpoint_gate_checks(batch_number, checked_at DESC);

CREATE TABLE IF NOT EXISTS accountant_zip_endpoint_logs (
  accountant_zip_endpoint_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  endpoint_path TEXT NOT NULL DEFAULT '/api/admin/accounting-monthly-summary-export',
  zip_sha256 TEXT,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  evidence_file_count INTEGER NOT NULL DEFAULT 0,
  log_status TEXT NOT NULL DEFAULT 'prepared',
  safe_deploy_package_download_id INTEGER,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS previous_zip_binary_comparisons (
  previous_zip_binary_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT,
  previous_filename TEXT,
  current_filename TEXT,
  previous_sha256 TEXT,
  current_sha256 TEXT,
  added_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  comparison_status TEXT NOT NULL DEFAULT 'prepared',
  comparison_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_notification_visibility_states (
  dashboard_notification_visibility_state_id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_notification_card_id INTEGER,
  visibility_status TEXT NOT NULL DEFAULT 'visible',
  snooze_until TEXT,
  dismissed_at TEXT,
  user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dashboard_notification_card_id, user_id)
);

CREATE TABLE IF NOT EXISTS mobile_release_control_layout_runs (
  mobile_release_control_layout_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  layout_key TEXT NOT NULL DEFAULT 'phone_release_cards',
  rendered_card_count INTEGER NOT NULL DEFAULT 0,
  large_tap_targets INTEGER NOT NULL DEFAULT 1,
  layout_status TEXT NOT NULL DEFAULT 'prepared',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployment_preflight_structured_data_excerpts (
  deployment_preflight_structured_data_excerpt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL,
  excerpt_status TEXT NOT NULL DEFAULT 'needs_review',
  jsonld_excerpt TEXT,
  issue_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, schema_type)
);

CREATE TABLE IF NOT EXISTS marketplace_download_block_events (
  marketplace_download_block_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  gate_status TEXT NOT NULL,
  hard_blocker_count INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 1,
  requested_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS release_control_row_status_actions (
  release_control_row_status_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  row_kind TEXT NOT NULL,
  source_row_id INTEGER,
  action_status TEXT NOT NULL DEFAULT 'not_checked',
  action_note TEXT,
  acted_by_user_id INTEGER,
  acted_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS release_manifest_filter_drawer_runs (
  release_manifest_filter_drawer_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_key TEXT NOT NULL,
  path_contains TEXT,
  diff_kind TEXT,
  matched_count INTEGER NOT NULL DEFAULT 0,
  drawer_status TEXT NOT NULL DEFAULT 'prepared',
  result_json TEXT NOT NULL DEFAULT '[]',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deploy_readiness_score_trend_exports (
  deploy_readiness_score_trend_export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  point_count INTEGER NOT NULL DEFAULT 0,
  latest_score INTEGER NOT NULL DEFAULT 0,
  markdown_body TEXT NOT NULL,
  export_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloudflare_deployment_auto_matches (
  cloudflare_deployment_auto_match_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_history_id INTEGER,
  build_label TEXT,
  branch_name TEXT,
  commit_sha TEXT,
  manifest_hash TEXT,
  auto_match_status TEXT NOT NULL DEFAULT 'needs_review',
  match_score INTEGER NOT NULL DEFAULT 0,
  matched_by_user_id INTEGER,
  matched_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS promote_live_ui_gate_states (
  promote_live_ui_gate_state_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  promote_button_status TEXT NOT NULL DEFAULT 'disabled',
  readiness_score INTEGER NOT NULL DEFAULT 0,
  blocker_count INTEGER NOT NULL DEFAULT 0,
  gate_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS post_promotion_watcher_schedule_runs (
  post_promotion_watcher_schedule_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  schedule_kind TEXT NOT NULL DEFAULT 'manual',
  watch_window_minutes INTEGER NOT NULL DEFAULT 60,
  run_status TEXT NOT NULL DEFAULT 'queued',
  triggered_from_path TEXT DEFAULT '/admin/post-deploy-smoke-tests/',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_180_go_live_execution', 'database_build180_go_live_execution.sql', CURRENT_TIMESTAMP, 'Safe additive Build 180 schema for direct gated apply/download/send/visibility controls.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

-- Devil n Dove Build 181 — live ops follow-through, private evidence downloads, marketplace overrides, and SEO content refresh tracking
-- Safe additive D1 migration. Run after database_build180_go_live_execution.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS private_evidence_download_tokens (
  private_evidence_download_token_id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_key TEXT NOT NULL,
  bucket_label TEXT NOT NULL DEFAULT 'accounting_evidence',
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  max_download_count INTEGER NOT NULL DEFAULT 1,
  download_count INTEGER NOT NULL DEFAULT 0,
  token_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_downloaded_at TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_private_evidence_tokens_object ON private_evidence_download_tokens(object_key, bucket_label, token_status);
CREATE INDEX IF NOT EXISTS idx_private_evidence_tokens_expiry ON private_evidence_download_tokens(expires_at, token_status);

CREATE TABLE IF NOT EXISTS private_evidence_download_audit_events (
  private_evidence_download_audit_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_key TEXT,
  bucket_label TEXT,
  event_status TEXT NOT NULL DEFAULT 'attempted',
  http_status INTEGER,
  token_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_private_evidence_download_audit_object ON private_evidence_download_audit_events(object_key, created_at);

CREATE TABLE IF NOT EXISTS product_qa_blocker_preview_counts (
  product_qa_blocker_preview_count_id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_code TEXT NOT NULL,
  affected_products INTEGER NOT NULL DEFAULT 0,
  preview_item_count INTEGER NOT NULL DEFAULT 0,
  safe_apply_candidate_count INTEGER NOT NULL DEFAULT 0,
  manual_only_count INTEGER NOT NULL DEFAULT 0,
  latest_queue_id INTEGER,
  count_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_qa_blocker_preview_counts_code ON product_qa_blocker_preview_counts(blocker_code, created_at);

CREATE TABLE IF NOT EXISTS marketplace_export_gate_overrides (
  marketplace_export_gate_override_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  gate_key TEXT NOT NULL DEFAULT 'download_gate',
  override_status TEXT NOT NULL DEFAULT 'requested',
  reason TEXT,
  expires_at TEXT,
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_gate_overrides_channel ON marketplace_export_gate_overrides(channel, override_status, expires_at);

CREATE TABLE IF NOT EXISTS marketplace_gate_badge_snapshots (
  marketplace_gate_badge_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  badge_status TEXT NOT NULL DEFAULT 'unknown',
  hard_blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  badge_label TEXT,
  blocker_reason TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_gate_badges_channel ON marketplace_gate_badge_snapshots(channel, created_at);

CREATE TABLE IF NOT EXISTS recall_evidence_upload_requests (
  recall_evidence_upload_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  requested_file_kind TEXT NOT NULL DEFAULT 'signature_evidence',
  upload_widget_status TEXT NOT NULL DEFAULT 'needs_upload',
  r2_target_prefix TEXT,
  evidence_url TEXT,
  r2_object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_recall_upload_requests_batch ON recall_evidence_upload_requests(batch_number, upload_widget_status);

CREATE TABLE IF NOT EXISTS local_business_admin_export_runs (
  local_business_admin_export_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_table TEXT NOT NULL DEFAULT 'local_business_schema_settings',
  output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  row_count INTEGER NOT NULL DEFAULT 0,
  export_status TEXT NOT NULL DEFAULT 'prepared',
  export_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public_page_content_refreshes (
  public_page_content_refresh_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  target_phrase TEXT NOT NULL,
  placement_kind TEXT NOT NULL DEFAULT 'body_copy',
  refresh_status TEXT NOT NULL DEFAULT 'applied_static',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_public_content_refresh_page ON public_page_content_refreshes(page_path, target_phrase);

CREATE TABLE IF NOT EXISTS provider_webhook_crypto_test_vectors (
  provider_webhook_crypto_test_vector_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'hmac-sha256',
  header_name TEXT,
  test_status TEXT NOT NULL DEFAULT 'documented',
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manifest_drawer_saved_filters (
  manifest_drawer_saved_filter_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_label TEXT NOT NULL,
  path_prefix TEXT,
  diff_kind TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_notification_action_buttons (
  dashboard_notification_action_button_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_kind TEXT NOT NULL,
  source_row_id INTEGER,
  action_kind TEXT NOT NULL DEFAULT 'snooze',
  button_label TEXT,
  action_status TEXT NOT NULL DEFAULT 'available',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS post_promotion_watcher_execution_logs (
  post_promotion_watcher_execution_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_promotion_watcher_schedule_run_id INTEGER,
  build_label TEXT NOT NULL DEFAULT 'Build 181',
  execution_status TEXT NOT NULL DEFAULT 'queued',
  checked_url_count INTEGER NOT NULL DEFAULT 0,
  failed_url_count INTEGER NOT NULL DEFAULT 0,
  incident_count INTEGER NOT NULL DEFAULT 0,
  result_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Admin pages', 'admin/', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Admin pages');
INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Functions', 'functions/', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Functions');
INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Schema SQL', 'database_', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Schema SQL');
INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Local SEO data', 'data/site/', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Local SEO data');

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_181_live_ops_followthrough', 'database_build181_live_ops_followthrough.sql', CURRENT_TIMESTAMP, 'Safe additive Build 181 schema for private evidence signed downloads, recall upload requests, QA blocker counts, marketplace overrides, local SEO content refresh tracking, and live-ops follow-through rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

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



-- Build 183 schema additions

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

-- Devil n Dove Build 184 — Sanity Check Snapshot, Value Roadmap, SEO Risk Review, and Desktop/Mobile Value Planning
-- Safe additive D1 migration. Run after database_build183_visual_enrichment_studio.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS application_sanity_snapshots (
  application_sanity_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 184',
  snapshot_status TEXT NOT NULL DEFAULT 'review',
  score INTEGER NOT NULL DEFAULT 0,
  public_page_count INTEGER NOT NULL DEFAULT 0,
  admin_page_count INTEGER NOT NULL DEFAULT 0,
  function_count INTEGER NOT NULL DEFAULT 0,
  schema_table_count INTEGER NOT NULL DEFAULT 0,
  h1_issue_count INTEGER NOT NULL DEFAULT 0,
  css_issue_count INTEGER NOT NULL DEFAULT 0,
  json_issue_count INTEGER NOT NULL DEFAULT 0,
  js_issue_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_application_sanity_snapshots_build ON application_sanity_snapshots(build_label, created_at);

CREATE TABLE IF NOT EXISTS application_module_status_rows (
  application_module_status_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_key TEXT NOT NULL UNIQUE,
  module_label TEXT NOT NULL,
  module_status TEXT NOT NULL DEFAULT 'stable_foundation',
  value_summary TEXT,
  remaining_risk TEXT,
  next_best_action TEXT,
  desktop_status TEXT NOT NULL DEFAULT 'needs_live_review',
  mobile_status TEXT NOT NULL DEFAULT 'needs_live_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS value_added_modification_candidates (
  value_added_modification_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_key TEXT NOT NULL UNIQUE,
  candidate_title TEXT NOT NULL,
  value_area TEXT NOT NULL DEFAULT 'operations',
  expected_value TEXT,
  effort_level TEXT NOT NULL DEFAULT 'medium',
  risk_level TEXT NOT NULL DEFAULT 'low',
  priority_rank INTEGER NOT NULL DEFAULT 100,
  candidate_status TEXT NOT NULL DEFAULT 'recommended_next',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_value_added_candidates_priority ON value_added_modification_candidates(candidate_status, priority_rank);

CREATE TABLE IF NOT EXISTS seo_search_criteria_review_rows (
  seo_search_criteria_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  primary_phrase TEXT NOT NULL,
  supporting_phrases_json TEXT DEFAULT '[]',
  title_status TEXT NOT NULL DEFAULT 'needs_live_search_review',
  h1_status TEXT NOT NULL DEFAULT 'locked_one_h1',
  body_copy_status TEXT NOT NULL DEFAULT 'needs_refresh_review',
  image_alt_status TEXT NOT NULL DEFAULT 'needs_asset_review',
  local_relevance_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(page_path, primary_phrase)
);
CREATE INDEX IF NOT EXISTS idx_seo_search_criteria_review_page ON seo_search_criteria_review_rows(page_path, local_relevance_status);

CREATE TABLE IF NOT EXISTS desktop_mobile_value_checks (
  desktop_mobile_value_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  check_kind TEXT NOT NULL DEFAULT 'parity',
  desktop_value_status TEXT NOT NULL DEFAULT 'needs_live_review',
  mobile_value_status TEXT NOT NULL DEFAULT 'needs_live_review',
  issue_count INTEGER NOT NULL DEFAULT 0,
  recommended_fix TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(route_path, check_kind)
);

CREATE TABLE IF NOT EXISTS sanity_action_plan_rows (
  sanity_action_plan_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 184',
  action_rank INTEGER NOT NULL,
  action_title TEXT NOT NULL,
  action_status TEXT NOT NULL DEFAULT 'recommended_next',
  value_category TEXT NOT NULL DEFAULT 'value_added',
  owner_hint TEXT,
  depends_on TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(build_label, action_rank)
);

CREATE TABLE IF NOT EXISTS visual_value_enrichment_rows (
  visual_value_enrichment_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  enrichment_kind TEXT NOT NULL DEFAULT 'visual_effect_or_image',
  effect_status TEXT NOT NULL DEFAULT 'candidate',
  reduced_motion_safe INTEGER NOT NULL DEFAULT 1,
  h1_change_allowed INTEGER NOT NULL DEFAULT 0,
  professional_value TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(route_path, enrichment_kind)
);

INSERT INTO application_module_status_rows (module_key, module_label, module_status, value_summary, remaining_risk, next_best_action, desktop_status, mobile_status, notes)
VALUES
('storefront', 'Public storefront and product discovery', 'stable_foundation', 'Shop, product detail, collections, gallery, and local landing pages exist with one-H1 checks and LocalBusiness/Product/Breadcrumb structured-data work in progress.', 'Live product data quality, image role completeness, and conversion-path polish still need ongoing review.', 'Add conversion funnel measurement and product-card A/B review after live traffic begins.', 'prepared', 'prepared', 'Build 184 sanity seeded row.'),
('admin_ops', 'Admin operations and release controls', 'strong_but_large', 'Admin now has deployment preflight, release control, deploy readiness, promotion control, go-live execution, live ops, visual polish, and visual enrichment pages.', 'The admin surface is powerful but large; discoverability and role-based grouping should keep improving.', 'Add an Admin Command Center with saved views and common task shortcuts.', 'prepared', 'needs_phone_review', 'Build 184 sanity seeded row.'),
('data_schema', 'D1 schema and migration ledger', 'strong_guarded', 'Additive migrations are tracked from Build 173 through Build 184 with schema references and no destructive changes in this pass.', 'Repeated manual ALTER TABLE remains a risk if old migrations are rerun out of order.', 'Create a migration runner checklist page that shows applied/missing migrations before SQL is copied.', 'prepared', 'not_applicable', 'Build 184 sanity seeded row.'),
('seo_local', 'Local SEO and search criteria', 'good_foundation', 'Local service pages, title/meta checks, one-H1 validation, LocalBusiness JSON-LD, internal-link planning, and phrase history are present.', 'First-page local search still depends on real photos, GBP activity, reviews, backlinks, content freshness, and live ranking data.', 'Add monthly Local SEO scorecards with Search Console/GBP/manual ranking evidence.', 'prepared', 'prepared', 'Build 184 sanity seeded row.'),
('visual_brand', 'Visual polish and professional media', 'emerging_strength', 'Visual Polish and Visual Enrichment Studio prepare image slots, alt suggestions, media budgets, visual diffs, low-bandwidth mode, and seasonal campaign rows.', 'Actual approved images, screenshots, and live visual QA still need real uploads and review.', 'Add before/after gallery proof layouts and maker-process hero modules with reduced-motion-safe effects.', 'prepared', 'prepared', 'Build 184 sanity seeded row.'),
('accounting_recall', 'Accounting, gift card, recall, and compliance controls', 'guarded_foundation', 'Evidence bundles, gift-card send logs/history, recall approval gates, and release locks exist as guarded workflows.', 'Live R2/email/provider binding tests and legal/compliance language need final deployed verification.', 'Add a compliance review dashboard that groups accounting, recall, gift card, and privacy checks by risk.', 'prepared', 'needs_phone_review', 'Build 184 sanity seeded row.')
ON CONFLICT(module_key) DO UPDATE SET module_status=excluded.module_status, value_summary=excluded.value_summary, remaining_risk=excluded.remaining_risk, next_best_action=excluded.next_best_action, desktop_status=excluded.desktop_status, mobile_status=excluded.mobile_status, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO value_added_modification_candidates (candidate_key, candidate_title, value_area, expected_value, effort_level, risk_level, priority_rank, candidate_status, notes)
VALUES
('admin_command_center', 'Build one Admin Command Center with Today, Preflight, Visual, Product QA, Recall, and SEO cards', 'admin_usability', 'Reduces admin sprawl and makes daily use easier on desktop and phone.', 'medium', 'low', 1, 'recommended_next', 'Best next value step after many specialized admin pages.'),
('conversion_funnel_measurement', 'Add storefront conversion funnel tracking from landing page to product view to cart to checkout', 'sales', 'Shows which pages/products actually help sales and where customers drop off.', 'medium', 'medium', 2, 'recommended_next', 'Needs privacy-safe analytics rules.'),
('product_quality_scoreboard', 'Create a product readiness scoreboard with image roles, alt text, price, story, shipping, and marketplace status', 'product_ops', 'Makes publish readiness visible and actionable.', 'medium', 'low', 3, 'recommended_next', 'Build on Product QA rows already present.'),
('gbp_local_seo_scorecard', 'Add monthly Google Business Profile and Search Console scorecard import rows', 'local_seo', 'Moves local SEO from checklist to measured improvement.', 'medium', 'low', 4, 'recommended_next', 'Manual CSV import first, API later.'),
('visual_before_after_gallery', 'Add before/after and maker-process gallery templates', 'visual_brand', 'Adds professional proof and emotional value to handmade/custom work.', 'medium', 'low', 5, 'recommended_next', 'Use approved media only.'),
('customer_story_builder', 'Add customer story builder for consented custom orders and product proof', 'trust', 'Creates reusable trust blocks, product stories, and social snippets.', 'medium', 'low', 6, 'recommended_next', 'Must respect consent status.'),
('mobile_quick_add_product', 'Improve phone-first quick product add with image role prompts and autosave recovery', 'mobile_admin', 'Makes product entry easier from the workshop or phone.', 'medium', 'medium', 7, 'recommended_next', 'Focus on safety and drafts.'),
('inventory_job_costing', 'Connect tools/supplies inventory to product/job cost estimates', 'profitability', 'Shows material cost and pricing confidence.', 'high', 'medium', 8, 'recommended_next', 'Needs clean inventory ownership.'),
('customer_member_history', 'Unify customer/member order, gift card, recall, and custom request history', 'customer_ops', 'Improves customer service and repeat-sales targeting.', 'high', 'medium', 9, 'recommended_next', 'Keep privacy controls clear.'),
('public_performance_budget', 'Add page performance budgets for images, scripts, CSS, and low-bandwidth mode', 'performance', 'Keeps visual polish from slowing the site.', 'medium', 'low', 10, 'recommended_next', 'Pairs well with visual enrichment.'),
('structured_data_lab', 'Add structured-data lab with Product, LocalBusiness, Breadcrumb, FAQ, and Organization previews', 'seo_schema', 'Reduces schema errors and improves eligibility for rich search displays.', 'medium', 'low', 11, 'recommended_next', 'Use validator import rows.'),
('returns_and_policy_center', 'Add policy center for returns, custom work approvals, pickup, gift cards, and recalls', 'trust', 'Improves buyer confidence and reduces confusion.', 'medium', 'low', 12, 'recommended_next', 'Needs plain-language review.'),
('content_calendar', 'Create content calendar for seasonal campaigns, markets, product launches, and blog/social posts', 'marketing', 'Turns visual assets and SEO phrases into publishable content.', 'medium', 'low', 13, 'recommended_next', 'Start with manual calendar rows.'),
('abandoned_cart_followup', 'Add privacy-safe abandoned-cart and saved-cart follow-up planning', 'sales', 'Helps recover sales without being pushy.', 'medium', 'medium', 14, 'recommended_next', 'Requires email consent rules.'),
('maker_profile_pages', 'Add maker/process profile sections that explain therapy/workshop story without overcomplicating products', 'brand', 'Differentiates Devil n Dove from commodity gift shops.', 'low', 'low', 15, 'recommended_next', 'Keep wording concise and product-focused.'),
('error_recovery_center', 'Add visible error recovery center for failed API, upload, payment, and provider tasks', 'reliability', 'Makes fallback/error handling actionable.', 'medium', 'low', 16, 'recommended_next', 'Build on runtime incidents.'),
('marketplace_profit_preview', 'Add marketplace profit preview after fees, shipping, and materials', 'profitability', 'Prevents exports that look good but lose money.', 'medium', 'medium', 17, 'recommended_next', 'Requires accurate costs.'),
('photo_shot_list_mobile', 'Add mobile photo shot-list for product, trust proof, and local SEO images', 'visual_brand', 'Makes better imagery easier to capture consistently.', 'low', 'low', 18, 'recommended_next', 'Useful for workshop workflow.'),
('search_query_landing_refresh', 'Add periodic refresh queue for landing page titles, headings, alt text, and internal links', 'seo_local', 'Keeps local pages fresh without breaking one-H1 rules.', 'medium', 'low', 19, 'recommended_next', 'Use Search Console evidence when available.'),
('deployment_training_mode', 'Add training/simulation mode for deploy, rollback, recall, and gift-card provider actions', 'safety', 'Lets admin practice without touching live customers.', 'high', 'low', 20, 'recommended_next', 'Good safety feature before live scale.')
ON CONFLICT(candidate_key) DO UPDATE SET candidate_title=excluded.candidate_title, value_area=excluded.value_area, expected_value=excluded.expected_value, effort_level=excluded.effort_level, risk_level=excluded.risk_level, priority_rank=excluded.priority_rank, candidate_status=excluded.candidate_status, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO seo_search_criteria_review_rows (page_path, primary_phrase, supporting_phrases_json, notes)
VALUES
('/', 'handmade gifts Southern Ontario', '["Devil n Dove", "workshop made gifts", "custom handmade gifts"]', 'Homepage should keep clear brand + local gift wording without adding more than one H1.'),
('/shop/', 'handmade gifts Ontario shop', '["polymer clay earrings", "laser engraved gifts", "vintage finds"]', 'Shop page should connect product names, categories, alt text, and collection links.'),
('/custom-gifts-southern-ontario/', 'custom gifts Southern Ontario', '["personalized gifts", "custom order", "engraved gifts"]', 'High-value service page; add proof images and clear request path.'),
('/handmade-jewelry-ontario/', 'handmade jewelry Ontario', '["polymer clay earrings", "spoon rings", "wire wrapped jewelry"]', 'Needs strong product proof and internal links to matching categories.'),
('/laser-engraving-ontario/', 'laser engraving Ontario', '["custom engraved gifts", "personalized laser engraving", "workshop engraving"]', 'Good service target for local discovery; show materials and examples.'),
('/custom-candle-making-ontario/', 'custom candles Ontario', '["scented candles", "small batch candles", "custom candle gifts"]', 'Add safety, scent, and batch wording carefully.'),
('/custom-soap-making-ontario/', 'custom soap Ontario', '["small batch soap", "custom soap gifts", "Ontario handmade soap"]', 'Use ingredient/safety language and product proof photos.'),
('/vintage-finds-ontario/', 'vintage finds Ontario', '["collectibles", "vintage tools", "estate finds"]', 'Separate vintage from handmade so searchers and customers understand the difference.'),
('/workshop-made-gifts-ontario/', 'workshop made gifts Ontario', '["maker gifts", "CNC gifts", "3D printed gifts"]', 'Good umbrella page for the mixed-media workshop story.')
ON CONFLICT(page_path, primary_phrase) DO UPDATE SET supporting_phrases_json=excluded.supporting_phrases_json, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO desktop_mobile_value_checks (route_path, check_kind, recommended_fix, notes)
VALUES
('/admin/', 'daily_command_center', 'Group the many admin tools into role-based saved views and Today cards.', 'Large admin surface needs a calmer desktop/mobile home.'),
('/admin/visual-enrichment-studio/', 'phone_review', 'Keep cards short, add sticky action buttons, and preserve reduced-motion/low-bandwidth toggles.', 'Visual review must stay usable on phones.'),
('/shop/', 'conversion_path', 'Watch card size, thumbnail loading, quick-view clarity, and cart path on mobile.', 'Shop conversion depends on product-card clarity.'),
('/shop/product/', 'product_detail', 'Keep main image, thumbnails, price, story, shipping, and add-to-cart visible without scrolling too far.', 'Product pages should be visually sharp and easy to buy from.'),
('/custom-request/', 'custom_request_intake', 'Use step-by-step intake with autosave, image references, and fallback messages.', 'Custom request conversion depends on simple flow.'),
('/admin/go-live-execution/', 'release_safety', 'Keep blockers, gate states, smoke tests, and rollback links visible above the fold.', 'Go-live screen must be quick to understand.')
ON CONFLICT(route_path, check_kind) DO UPDATE SET recommended_fix=excluded.recommended_fix, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO visual_value_enrichment_rows (route_path, enrichment_kind, professional_value, notes)
VALUES
('/', 'subtle_story_strip', 'Adds polish to the homepage while keeping performance and accessibility safe.', 'Use approved images, no H1 changes, and reduced-motion-safe effects.'),
('/shop/', 'collection_badge_art', 'Makes product browsing feel more intentional and less plain.', 'Use compressed thumbnails and descriptive alt text.'),
('/gallery/', 'before_after_proof', 'Shows workshop progress and builds trust for custom orders.', 'Must tie to consent/public-use status.'),
('/custom-gifts-southern-ontario/', 'process_timeline_visual', 'Explains custom gift flow quickly and professionally.', 'Good candidate for icon strip plus real photos.'),
('/handmade-jewelry-ontario/', 'detail_macro_gallery', 'Improves perceived quality of jewelry and close-up work.', 'Needs sharp images and honest descriptions.'),
('/laser-engraving-ontario/', 'material_example_grid', 'Shows what can be engraved and helps buyers choose.', 'Keep material limitations clear.'),
('/custom-candle-making-ontario/', 'scent_colour_cards', 'Makes candle options more visual and giftable.', 'Avoid unsafe/medical claims.'),
('/custom-soap-making-ontario/', 'ingredient_visual_cards', 'Makes soap pages clearer and more professional.', 'Avoid medical claims and keep allergens clear.')
ON CONFLICT(route_path, enrichment_kind) DO UPDATE SET professional_value=excluded.professional_value, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO sanity_action_plan_rows (build_label, action_rank, action_title, value_category, owner_hint, depends_on, notes)
SELECT 'Build 184', priority_rank, candidate_title, value_area, 'Admin/owner review', 'Complete deployed sanity verification first.', expected_value
FROM value_added_modification_candidates
WHERE priority_rank BETWEEN 1 AND 20
ON CONFLICT(build_label, action_rank) DO UPDATE SET action_title=excluded.action_title, value_category=excluded.value_category, owner_hint=excluded.owner_hint, depends_on=excluded.depends_on, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_184_sanity_check_and_value_roadmap', 'database_build184_sanity_check_and_value_roadmap.sql', CURRENT_TIMESTAMP, 'Safe additive Build 184 sanity-check schema for application module status, value-added candidates, SEO criteria review, desktop/mobile value checks, visual enrichment rows, and action plan rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

-- Devil n Dove Build 185 — Admin Command Center and Value-Added Operating Dashboards
-- Safe additive D1 migration. Run after database_build184_sanity_check_and_value_roadmap.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS admin_command_center_daily_snapshots (
  admin_command_center_daily_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 185',
  snapshot_status TEXT NOT NULL DEFAULT 'review',
  total_products INTEGER NOT NULL DEFAULT 0,
  ready_products INTEGER NOT NULL DEFAULT 0,
  blocked_products INTEGER NOT NULL DEFAULT 0,
  open_orders INTEGER NOT NULL DEFAULT 0,
  open_recalls INTEGER NOT NULL DEFAULT 0,
  seo_pages_needing_review INTEGER NOT NULL DEFAULT 0,
  visual_items_needing_review INTEGER NOT NULL DEFAULT 0,
  marketplace_items_blocked INTEGER NOT NULL DEFAULT 0,
  performance_items_over_budget INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_command_center_snapshots_build ON admin_command_center_daily_snapshots(build_label, created_at);

CREATE TABLE IF NOT EXISTS admin_command_center_cards (
  admin_command_center_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_key TEXT NOT NULL UNIQUE,
  card_label TEXT NOT NULL,
  card_area TEXT NOT NULL DEFAULT 'daily_ops',
  card_status TEXT NOT NULL DEFAULT 'active',
  priority_rank INTEGER NOT NULL DEFAULT 100,
  desktop_status TEXT NOT NULL DEFAULT 'prepared',
  mobile_status TEXT NOT NULL DEFAULT 'prepared',
  primary_route TEXT,
  metric_label TEXT,
  metric_value INTEGER NOT NULL DEFAULT 0,
  action_label TEXT,
  action_route TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_command_center_cards_priority ON admin_command_center_cards(card_status, priority_rank);

CREATE TABLE IF NOT EXISTS product_readiness_scoreboard_snapshots (
  product_readiness_scoreboard_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 185',
  product_id INTEGER,
  product_name TEXT,
  product_slug TEXT,
  readiness_score INTEGER NOT NULL DEFAULT 0,
  missing_image_roles INTEGER NOT NULL DEFAULT 0,
  missing_alt_text INTEGER NOT NULL DEFAULT 0,
  missing_price INTEGER NOT NULL DEFAULT 0,
  missing_story INTEGER NOT NULL DEFAULT 0,
  missing_shipping INTEGER NOT NULL DEFAULT 0,
  marketplace_blockers INTEGER NOT NULL DEFAULT 0,
  inventory_blockers INTEGER NOT NULL DEFAULT 0,
  readiness_status TEXT NOT NULL DEFAULT 'needs_review',
  recommended_next_action TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_product_readiness_scoreboard_status ON product_readiness_scoreboard_snapshots(readiness_status, readiness_score);

CREATE TABLE IF NOT EXISTS conversion_funnel_scorecard_rows (
  conversion_funnel_scorecard_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  funnel_step TEXT NOT NULL UNIQUE,
  step_label TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 100,
  source_kind TEXT NOT NULL DEFAULT 'manual_or_analytics_import',
  event_count INTEGER NOT NULL DEFAULT 0,
  previous_step_count INTEGER NOT NULL DEFAULT 0,
  conversion_rate_percent REAL NOT NULL DEFAULT 0,
  dropoff_note TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_tracking',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_scorecard_order ON conversion_funnel_scorecard_rows(step_order, review_status);

CREATE TABLE IF NOT EXISTS local_seo_value_scorecard_rows (
  local_seo_value_scorecard_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  target_phrase TEXT NOT NULL,
  search_console_status TEXT NOT NULL DEFAULT 'needs_import',
  google_business_profile_status TEXT NOT NULL DEFAULT 'manual_review',
  ranking_check_status TEXT NOT NULL DEFAULT 'needs_manual_check',
  content_freshness_status TEXT NOT NULL DEFAULT 'needs_refresh_review',
  image_proof_status TEXT NOT NULL DEFAULT 'needs_approved_images',
  score INTEGER NOT NULL DEFAULT 0,
  next_best_action TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_local_seo_value_scorecard_score ON local_seo_value_scorecard_rows(score, page_path);

CREATE TABLE IF NOT EXISTS maker_gallery_value_rows (
  maker_gallery_value_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gallery_key TEXT NOT NULL UNIQUE,
  gallery_label TEXT NOT NULL,
  proof_kind TEXT NOT NULL DEFAULT 'before_after_or_process',
  source_route TEXT,
  public_use_status TEXT NOT NULL DEFAULT 'needs_approved_media',
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  before_image_url TEXT,
  after_image_url TEXT,
  story_note TEXT,
  professional_value TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS customer_story_builder_rows (
  customer_story_builder_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_key TEXT NOT NULL UNIQUE,
  story_label TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'product_story_or_order',
  source_record_id INTEGER,
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  trust_block_status TEXT NOT NULL DEFAULT 'candidate',
  social_snippet_status TEXT NOT NULL DEFAULT 'draft_needed',
  public_page_target TEXT,
  story_summary TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS mobile_quick_product_add_checks (
  mobile_quick_product_add_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_key TEXT NOT NULL UNIQUE,
  check_label TEXT NOT NULL,
  mobile_status TEXT NOT NULL DEFAULT 'needs_live_test',
  desktop_status TEXT NOT NULL DEFAULT 'prepared',
  failure_recovery_status TEXT NOT NULL DEFAULT 'fallback_needed',
  autosave_status TEXT NOT NULL DEFAULT 'needs_review',
  image_role_prompt_status TEXT NOT NULL DEFAULT 'needs_review',
  route_path TEXT NOT NULL DEFAULT '/admin/mobile-product/',
  next_best_action TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS inventory_job_costing_value_rows (
  inventory_job_costing_value_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  costing_key TEXT NOT NULL UNIQUE,
  costing_label TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'inventory_or_product',
  product_id INTEGER,
  inventory_item_id INTEGER,
  material_cost_cents INTEGER NOT NULL DEFAULT 0,
  labour_cost_cents INTEGER NOT NULL DEFAULT 0,
  packaging_cost_cents INTEGER NOT NULL DEFAULT 0,
  marketplace_fee_cents INTEGER NOT NULL DEFAULT 0,
  suggested_price_cents INTEGER NOT NULL DEFAULT 0,
  margin_status TEXT NOT NULL DEFAULT 'needs_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS unified_customer_member_history_rows (
  unified_customer_member_history_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_key TEXT NOT NULL UNIQUE,
  customer_label TEXT,
  email_hash TEXT,
  order_count INTEGER NOT NULL DEFAULT 0,
  gift_card_count INTEGER NOT NULL DEFAULT 0,
  custom_request_count INTEGER NOT NULL DEFAULT 0,
  recall_match_count INTEGER NOT NULL DEFAULT 0,
  proof_approval_count INTEGER NOT NULL DEFAULT 0,
  latest_activity_at TEXT,
  history_status TEXT NOT NULL DEFAULT 'needs_unified_view',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS performance_budget_value_rows (
  performance_budget_value_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL UNIQUE,
  target_total_kb INTEGER NOT NULL DEFAULT 900,
  target_image_kb INTEGER NOT NULL DEFAULT 650,
  target_js_kb INTEGER NOT NULL DEFAULT 250,
  current_total_kb INTEGER NOT NULL DEFAULT 0,
  current_image_kb INTEGER NOT NULL DEFAULT 0,
  current_js_kb INTEGER NOT NULL DEFAULT 0,
  budget_status TEXT NOT NULL DEFAULT 'needs_measurement',
  low_bandwidth_status TEXT NOT NULL DEFAULT 'supported',
  reduced_motion_status TEXT NOT NULL DEFAULT 'supported',
  next_best_action TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_performance_budget_value_status ON performance_budget_value_rows(budget_status, route_path);

INSERT INTO admin_command_center_cards (card_key, card_label, card_area, priority_rank, primary_route, metric_label, action_label, action_route, notes)
VALUES
('products_readiness', 'Product Readiness Scoreboard', 'products', 1, '/admin/readiness/', 'blocked products', 'Open product readiness', '/admin/readiness/', 'Shows image roles, alt text, price, story, shipping, inventory, marketplace status, and blockers.'),
('orders_today', 'Orders and Today Tasks', 'orders', 2, '/admin/orders/', 'open work', 'Open orders', '/admin/orders/', 'Daily order, custom request, and Today-task triage.'),
('local_seo_scorecard', 'Local SEO Scorecard', 'seo', 3, '/admin/local-seo-review/', 'pages needing proof', 'Open local SEO', '/admin/local-seo-review/', 'Search Console, Google Business Profile observations, ranking checks, content freshness, and image proof.'),
('visual_enrichment', 'Visual Enrichment and Maker Gallery', 'visuals', 4, '/admin/visual-enrichment-studio/', 'visual candidates', 'Open visual studio', '/admin/visual-enrichment-studio/', 'Approved workshop/process images, before/after proof, and reduced-motion-safe visual effects.'),
('customer_stories', 'Customer Story Builder', 'trust', 5, '/admin/public-proof-candidates/', 'story candidates', 'Open proof candidates', '/admin/public-proof-candidates/', 'Consented proof, product stories, trust blocks, and social snippets.'),
('mobile_quick_add', 'Mobile Quick Product Add', 'mobile', 6, '/admin/mobile-product/', 'mobile checks', 'Open phone capture', '/admin/mobile-product/', 'Phone-first upload, autosave, image-role prompts, and recovery from failures.'),
('inventory_costing', 'Inventory and Job Costing', 'accounting', 7, '/admin/inventory-operations/', 'costing rows', 'Open inventory ops', '/admin/inventory-operations/', 'Connect supplies/tools to pricing and marketplace profit previews.'),
('customer_history', 'Unified Customer/Member History', 'customers', 8, '/admin/members/', 'history rows', 'Open members', '/admin/members/', 'Orders, gift cards, recalls, custom requests, proof approvals, and notes.'),
('performance_budgets', 'Performance Budgets', 'performance', 9, '/admin/visual-polish/', 'over-budget routes', 'Open visual polish', '/admin/visual-polish/', 'Keep sharp visuals without making public pages slow.'),
('deploy_safety', 'Deploy, Accounting, and Recall Safety', 'release', 10, '/admin/go-live-execution/', 'live blockers', 'Open go-live execution', '/admin/go-live-execution/', 'Keeps D1/R2/email/recall/export gates visible before changes go live.')
ON CONFLICT(card_key) DO UPDATE SET card_label=excluded.card_label, card_area=excluded.card_area, priority_rank=excluded.priority_rank, primary_route=excluded.primary_route, metric_label=excluded.metric_label, action_label=excluded.action_label, action_route=excluded.action_route, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO conversion_funnel_scorecard_rows (funnel_step, step_label, step_order, dropoff_note, notes)
VALUES
('landing_page_view', 'Landing page view', 1, 'Start tracking local and collection landing traffic.', 'Privacy-safe analytics/import row.'),
('product_view', 'Product view', 2, 'Compare product views against landing traffic.', 'Use product detail views once live analytics are available.'),
('add_to_cart', 'Add to cart', 3, 'Shows whether product pages are convincing.', 'Track cart button events without personal data.'),
('checkout_start', 'Checkout start', 4, 'Shows checkout intent and possible payment friction.', 'Pair with payment provider checks.'),
('order_complete', 'Order complete', 5, 'Shows real conversion and revenue.', 'Tie to order table when available.')
ON CONFLICT(funnel_step) DO UPDATE SET step_label=excluded.step_label, step_order=excluded.step_order, dropoff_note=excluded.dropoff_note, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO local_seo_value_scorecard_rows (page_path, target_phrase, next_best_action, notes)
VALUES
('/', 'Devil n Dove handmade gifts Southern Ontario', 'Add fresh proof images and internal links to best handmade/vintage/custom pages.', 'Homepage should stay clear and locally relevant.'),
('/custom-gifts-southern-ontario/', 'custom gifts Southern Ontario', 'Add approved workshop proof and request-intake calls to action.', 'High-value local custom order page.'),
('/handmade-jewelry-ontario/', 'handmade jewelry Ontario', 'Add sharper close-up photos, product proof, and links to matching shop categories.', 'Jewelry page needs visual trust.'),
('/laser-engraving-ontario/', 'laser engraving Ontario', 'Add material examples and custom request pathway.', 'Strong local service phrase.'),
('/custom-candle-making-ontario/', 'custom candles Ontario', 'Add scent/colour proof with safety wording and batch notes.', 'Avoid medical claims.'),
('/custom-soap-making-ontario/', 'custom soap Ontario', 'Add ingredient/allergen clarity and approved product photos.', 'Avoid medical claims.'),
('/vintage-finds-ontario/', 'vintage finds Ontario', 'Add real finds and provenance-style notes where known.', 'Separate vintage/collectible from handmade.'),
('/workshop-made-gifts-ontario/', 'workshop made gifts Ontario', 'Use this as a mixed-media maker umbrella page with process proof.', 'Good brand story page.')
ON CONFLICT(page_path) DO UPDATE SET target_phrase=excluded.target_phrase, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO maker_gallery_value_rows (gallery_key, gallery_label, proof_kind, source_route, professional_value, story_note, notes)
VALUES
('before_after_custom_gifts', 'Before/after custom gifts', 'before_after', '/custom-gifts-southern-ontario/', 'Builds trust for custom work by showing the transformation.', 'Use only approved public-use media.', 'Needs real approved photos.'),
('workshop_process', 'Workshop process proof', 'process', '/workshop-made-gifts-ontario/', 'Shows handmade credibility without pretending every piece is perfect.', 'Good fit for therapy/workshop story.', 'Keep wording humble and honest.'),
('jewelry_macro_details', 'Jewelry macro detail gallery', 'detail', '/handmade-jewelry-ontario/', 'Close-ups improve perceived quality when images are sharp.', 'Use honest descriptions of handmade imperfections.', 'Needs compression budget review.'),
('laser_examples', 'Laser engraving material examples', 'example_grid', '/laser-engraving-ontario/', 'Helps customers choose material and request type.', 'Show limits and safety notes.', 'Good candidate for image-slot assignments.')
ON CONFLICT(gallery_key) DO UPDATE SET gallery_label=excluded.gallery_label, proof_kind=excluded.proof_kind, source_route=excluded.source_route, professional_value=excluded.professional_value, story_note=excluded.story_note, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO customer_story_builder_rows (story_key, story_label, source_kind, public_page_target, story_summary, notes)
VALUES
('product_story_to_social', 'Product story to social snippet', 'product_story_note', '/shop/', 'Turn approved product stories into short trust notes and captions.', 'Requires consent/public-use review.'),
('custom_request_to_trust', 'Custom request to trust block', 'custom_request', '/custom-gifts-southern-ontario/', 'Promote approved custom request proof into page-specific trust blocks.', 'Requires customer approval.'),
('maker_note_to_gallery', 'Maker note to gallery caption', 'maker_note', '/gallery/', 'Convert workshop notes into honest gallery captions.', 'Good for process-based trust.'),
('review_to_local_page', 'Review to local page proof', 'customer_review', '/', 'Map approved customer wording to the best local page.', 'Avoid overusing the same review everywhere.')
ON CONFLICT(story_key) DO UPDATE SET story_label=excluded.story_label, source_kind=excluded.source_kind, public_page_target=excluded.public_page_target, story_summary=excluded.story_summary, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO mobile_quick_product_add_checks (check_key, check_label, next_best_action, notes)
VALUES
('phone_image_upload_autosave', 'Phone image upload and autosave', 'Confirm drafts survive failed upload/network interruption.', 'High value for workshop phone capture.'),
('image_role_prompts', 'Image role prompts', 'Prompt for hero/detail/scale/context before publish review.', 'Reduces Product QA blockers.'),
('quick_price_story_fields', 'Quick price and story fields', 'Keep price, short story, material, and shipping fields easy to reach on phone.', 'Supports product readiness.'),
('offline_failure_recovery', 'Upload failure recovery', 'Show clear fallback message and preserve local draft text.', 'Important because upload failures are common.')
ON CONFLICT(check_key) DO UPDATE SET check_label=excluded.check_label, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO inventory_job_costing_value_rows (costing_key, costing_label, source_kind, notes)
VALUES
('materials_to_price', 'Material cost to product price', 'product', 'Connect supplies/tools to product margins before marketplace export.'),
('labour_packaging_margin', 'Labour and packaging margin preview', 'product', 'Keep pricing realistic without overcomplicating casual workshop products.'),
('marketplace_fee_preview', 'Marketplace fee preview', 'marketplace', 'Show expected Etsy/marketplace fee impact before export.'),
('tools_consumables_usage', 'Tools and consumables usage notes', 'inventory', 'Tie supplies/tools to repeat product types where helpful.')
ON CONFLICT(costing_key) DO UPDATE SET costing_label=excluded.costing_label, source_kind=excluded.source_kind, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO unified_customer_member_history_rows (customer_key, customer_label, notes)
VALUES
('customer_history_rollup_placeholder', 'Customer history rollup placeholder', 'Future rollup for orders, gift cards, custom requests, recalls, proof approvals, and notes.'),
('member_order_story_link', 'Member order/story link', 'Connect order history to approved story/proof rows.'),
('gift_card_customer_history', 'Gift card customer history', 'Show gift card sends, redemptions, and lockout notes inside customer/member views.'),
('recall_customer_history', 'Recall customer history', 'Show recall matches and notification status inside customer/member views.')
ON CONFLICT(customer_key) DO UPDATE SET customer_label=excluded.customer_label, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO performance_budget_value_rows (route_path, target_total_kb, target_image_kb, target_js_kb, next_best_action, notes)
VALUES
('/', 900, 650, 250, 'Measure homepage image weight after visual strip/image slots are approved.', 'Keep homepage polished but quick.'),
('/shop/', 1100, 800, 300, 'Review product-card thumbnails and lazy loading.', 'Shop can become image-heavy quickly.'),
('/shop/product/', 1200, 900, 300, 'Measure detail page galleries and thumbnail strips.', 'Product pages need sharp visuals but not oversized files.'),
('/gallery/', 1400, 1100, 300, 'Use approved thumbnails and low-bandwidth controls.', 'Gallery has the highest image risk.'),
('/custom-gifts-southern-ontario/', 1000, 750, 250, 'Keep process visuals compressed and reduced-motion safe.', 'Important landing page for conversion.')
ON CONFLICT(route_path) DO UPDATE SET target_total_kb=excluded.target_total_kb, target_image_kb=excluded.target_image_kb, target_js_kb=excluded.target_js_kb, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_185_admin_command_center_value_dashboards', 'database_build185_admin_command_center_value_dashboards.sql', CURRENT_TIMESTAMP, 'Safe additive Build 185 schema for Admin Command Center, product readiness scoreboard snapshots, conversion funnel, local SEO scorecard, maker gallery, customer stories, mobile quick product add checks, inventory costing, unified customer history, and performance budgets.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

-- Build 186 append: Markdown consolidation and visual placeholders
-- Devil n Dove Build 186 — Markdown consolidation, value backlog execution, and visual placeholder enrichment
-- Safe additive D1 migration. Run after database_build185_admin_command_center_value_dashboards.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS markdown_consolidation_runs (
  markdown_consolidation_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 186',
  run_status TEXT NOT NULL DEFAULT 'prepared',
  canonical_file_count INTEGER NOT NULL DEFAULT 2,
  supporting_file_count INTEGER NOT NULL DEFAULT 0,
  retired_reference_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS markdown_file_status_rows (
  markdown_file_status_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  file_role TEXT NOT NULL DEFAULT 'supporting_reference',
  keep_active INTEGER NOT NULL DEFAULT 1,
  canonical_replacement TEXT,
  owner_note TEXT,
  last_review_build TEXT NOT NULL DEFAULT 'Build 186',
  review_status TEXT NOT NULL DEFAULT 'reviewed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_markdown_file_status_role ON markdown_file_status_rows(file_role, keep_active);

CREATE TABLE IF NOT EXISTS value_enhancement_execution_rows (
  value_enhancement_execution_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  enhancement_key TEXT NOT NULL UNIQUE,
  enhancement_label TEXT NOT NULL,
  business_value TEXT,
  app_surface TEXT,
  desktop_status TEXT NOT NULL DEFAULT 'prepared',
  mobile_status TEXT NOT NULL DEFAULT 'prepared',
  seo_status TEXT NOT NULL DEFAULT 'aligned',
  data_owner TEXT NOT NULL DEFAULT 'D1_or_static_json_under_review',
  implementation_status TEXT NOT NULL DEFAULT 'active_tracking',
  priority_rank INTEGER NOT NULL DEFAULT 100,
  next_best_action TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_value_enhancement_execution_priority ON value_enhancement_execution_rows(priority_rank, implementation_status);

CREATE TABLE IF NOT EXISTS visual_graphic_placeholder_rows (
  visual_graphic_placeholder_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  placeholder_key TEXT NOT NULL UNIQUE,
  page_path TEXT NOT NULL,
  image_slot_label TEXT NOT NULL,
  placeholder_asset_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  desktop_status TEXT NOT NULL DEFAULT 'visible_placeholder',
  mobile_status TEXT NOT NULL DEFAULT 'visible_placeholder',
  replacement_status TEXT NOT NULL DEFAULT 'awaiting_approved_media',
  h1_change_allowed INTEGER NOT NULL DEFAULT 0,
  performance_budget_status TEXT NOT NULL DEFAULT 'lazy_loaded_svg',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_visual_placeholder_page ON visual_graphic_placeholder_rows(page_path, replacement_status);

CREATE TABLE IF NOT EXISTS desktop_mobile_surface_audit_rows (
  desktop_mobile_surface_audit_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  surface_key TEXT NOT NULL UNIQUE,
  route_path TEXT NOT NULL,
  surface_label TEXT NOT NULL,
  desktop_status TEXT NOT NULL DEFAULT 'prepared',
  mobile_status TEXT NOT NULL DEFAULT 'prepared',
  touch_target_status TEXT NOT NULL DEFAULT 'needs_live_device_check',
  overflow_status TEXT NOT NULL DEFAULT 'static_pass',
  fallback_status TEXT NOT NULL DEFAULT 'has_readable_fallback',
  next_best_action TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS css_drift_overlap_review_rows (
  css_drift_overlap_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_key TEXT NOT NULL UNIQUE,
  selector_or_area TEXT NOT NULL,
  review_kind TEXT NOT NULL DEFAULT 'css_drift',
  desktop_status TEXT NOT NULL DEFAULT 'static_pass',
  mobile_status TEXT NOT NULL DEFAULT 'static_pass',
  risk_level TEXT NOT NULL DEFAULT 'watch',
  recommended_fix TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS next_step_sanity_rows (
  next_step_sanity_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  step_key TEXT NOT NULL UNIQUE,
  step_label TEXT NOT NULL,
  step_group TEXT NOT NULL DEFAULT 'next_20',
  priority_rank INTEGER NOT NULL DEFAULT 100,
  expected_value TEXT,
  target_surface TEXT,
  current_status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO markdown_file_status_rows (file_path, file_role, keep_active, canonical_replacement, owner_note, review_status)
VALUES
('PROJECT_STATUS_AND_ROADMAP.md','primary_canonical',1,NULL,'Main human-readable project status, current value roadmap, SEO direction, and next 20 steps.','active'),
('AI_HANDOFF.md','primary_canonical',1,NULL,'Main new-chat handoff with D1 order, live checks, and where the app is heading.','active'),
('DEVELOPMENT_ROADMAP.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep detailed historical build trail but use the canonical project file first.','reviewed'),
('KNOWN_GAPS_AND_RISKS.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep as detailed risk log while the primary summary moves to canonical docs.','reviewed'),
('DATABASE_SCHEMA_REFERENCE.md','supporting_reference',1,'AI_HANDOFF.md','Keep schema details and D1 order, but summarize current order in AI handoff.','reviewed'),
('RELEASE_NOTES.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep chronological build notes.','reviewed'),
('SANITY_HEALTH_CHECK.md','supporting_reference',1,'AI_HANDOFF.md','Keep latest validation and post-deploy verification notes.','reviewed'),
('LOCAL_SEO_PLAYBOOK.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep detailed local SEO playbook.','reviewed'),
('IMAGES.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep visual/image workflow details.','reviewed'),
('NEW_CHAT_STATUS.md','handoff_reference',1,'AI_HANDOFF.md','Keep short compatibility handoff for old chats but prefer AI_HANDOFF.md.','reviewed'),
('AI_CONTEXT.md','handoff_reference',1,'AI_HANDOFF.md','Keep broad context but prefer AI_HANDOFF.md for the current build.','reviewed'),
('COMPETITIVE.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep competitor and market-direction notes.','reviewed'),
('README.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep repo overview and route notes.','reviewed'),
('REPO_BASE_GUIDE.md','supporting_reference',1,'AI_HANDOFF.md','Keep technical repository notes.','reviewed'),
('REPO_RULES.md','supporting_reference',1,'AI_HANDOFF.md','Keep working rules and guardrails.','reviewed'),
('AMAZON_MATCHING_NOTES.md','specialized_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep only for inventory/Amazon import matching.','reviewed')
ON CONFLICT(file_path) DO UPDATE SET file_role=excluded.file_role, keep_active=excluded.keep_active, canonical_replacement=excluded.canonical_replacement, owner_note=excluded.owner_note, last_review_build='Build 186', review_status=excluded.review_status, updated_at=CURRENT_TIMESTAMP;

INSERT INTO value_enhancement_execution_rows (enhancement_key, enhancement_label, business_value, app_surface, priority_rank, next_best_action, notes)
VALUES
('admin_command_center','Admin Command Center','Reduces admin overwhelm and makes daily work easier.','/admin/command-center/',1,'Add true live rollups from orders/products/SEO instead of mostly seeded rows.','Build 185 started this; Build 186 keeps it as primary daily entry.');
INSERT INTO value_enhancement_execution_rows (enhancement_key, enhancement_label, business_value, app_surface, priority_rank, next_best_action, notes) VALUES
('product_readiness_scoreboard','Product Readiness Scoreboard','Helps publish only complete, trustworthy products.','/admin/readiness/',2,'Add one-click safe fixes for approved low-risk blockers.',''),
('conversion_funnel_tracking','Conversion funnel tracking','Shows which pages and products turn visitors into orders.','/admin/command-center/',3,'Connect page view/cart/checkout/order analytics into funnel rows.',''),
('local_seo_scorecard','Local SEO scorecard','Keeps local discovery focused on relevance, distance, and prominence signals.','/admin/local-seo-review/',4,'Import Search Console and record manual Google Business Profile observations.',''),
('before_after_maker_gallery','Before/after maker gallery','Builds real workshop trust with process proof.','/admin/visual-enrichment-studio/',5,'Replace placeholders with approved before/after images and captions.',''),
('customer_story_builder','Customer story builder','Turns consented proof into product stories, trust blocks, and social snippets.','/admin/public-proof-candidates/',6,'Add story wizard that chooses page placement and social caption.',''),
('mobile_quick_product_add','Mobile quick product add','Captures products directly from the phone while work is fresh.','/admin/mobile-product/',7,'Add offline autosave and image role prompts.',''),
('inventory_job_costing','Inventory/job costing','Protects margins and makes marketplace pricing more realistic.','/admin/inventory-operations/',8,'Connect tool/supply cost rollups to product price suggestions.',''),
('unified_customer_history','Unified customer/member history','Shows orders, recalls, gift cards, stories, and proof approvals in one place.','/admin/members/',9,'Create customer timeline cards from existing tables.',''),
('performance_budgets','Performance budgets','Keeps visual polish sharp without slowing the site.','/admin/visual-polish/',10,'Measure route payloads after real image uploads.',''),
('markdown_consolidation','Markdown consolidation','Makes future AI/new-chat work safer and less confusing.','/admin/markdown-sanity/',11,'Use PROJECT_STATUS_AND_ROADMAP.md and AI_HANDOFF.md as the two main files.','')
ON CONFLICT(enhancement_key) DO UPDATE SET enhancement_label=excluded.enhancement_label, business_value=excluded.business_value, app_surface=excluded.app_surface, priority_rank=excluded.priority_rank, next_best_action=excluded.next_best_action, updated_at=CURRENT_TIMESTAMP;

INSERT INTO visual_graphic_placeholder_rows (placeholder_key, page_path, image_slot_label, placeholder_asset_url, alt_text, notes)
VALUES
('home_workshop_process','/','Workshop process hero support','/assets/visual-placeholders/workshop-process.svg','Placeholder for an approved Devil n Dove workshop process photo.','Homepage enrichment without changing the H1.'),
('shop_product_detail','/shop/','Product detail proof','/assets/visual-placeholders/product-detail.svg','Placeholder for approved product detail photography.','Shop enrichment and product trust.'),
('gallery_before_after','/gallery/','Before and after maker proof','/assets/visual-placeholders/before-after.svg','Placeholder for approved before and after workshop images.','Use only approved public-use media later.'),
('jewelry_macro','/handmade-jewelry-ontario/','Jewelry macro close-up','/assets/visual-placeholders/jewelry-macro.svg','Placeholder for approved handmade jewelry close-up image.','Supports handmade jewelry Ontario search intent.'),
('candle_colour','/custom-candle-making-ontario/','Candle colour and scent proof','/assets/visual-placeholders/candle-colour.svg','Placeholder for approved custom candle colour photo.','Supports custom candles Ontario page.'),
('soap_texture','/custom-soap-making-ontario/','Soap texture and ingredient clarity','/assets/visual-placeholders/soap-texture.svg','Placeholder for approved custom soap texture photo.','Avoid medical claims.'),
('engraving_proof','/laser-engraving-ontario/','Laser engraving material proof','/assets/visual-placeholders/engraving-proof.svg','Placeholder for approved laser engraving proof image.','Helps custom request confidence.'),
('vintage_condition','/vintage-finds-ontario/','Vintage condition proof','/assets/visual-placeholders/vintage-condition.svg','Placeholder for approved vintage condition detail image.','Keeps vintage separate from handmade.'),
('workshop_made_gifts','/workshop-made-gifts-ontario/','Workshop-made gifts process','/assets/visual-placeholders/workshop-process.svg','Placeholder for approved workshop-made gift process image.','Mixed-media gift umbrella page.')
ON CONFLICT(placeholder_key) DO UPDATE SET page_path=excluded.page_path, image_slot_label=excluded.image_slot_label, placeholder_asset_url=excluded.placeholder_asset_url, alt_text=excluded.alt_text, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO desktop_mobile_surface_audit_rows (surface_key, route_path, surface_label, next_best_action, notes)
VALUES
('public_home','/','Public homepage','Check hero/card spacing on phone and desktop after visual placeholder injection.','No extra H1 allowed.'),
('shop','/shop/','Shop landing page','Check placeholder and product grid spacing on phone.','Keep product cards readable.'),
('admin_command_center','/admin/command-center/','Admin Command Center','Keep as daily entry point and avoid another scattered page.','Mobile cards should stack.'),
('markdown_sanity','/admin/markdown-sanity/','Markdown Sanity','Use for doc cleanup and AI handoff clarity.','New Build 186 page.'),
('visual_enrichment','/admin/visual-enrichment-studio/','Visual Enrichment Studio','Keep media rows responsive and touch friendly.','Replace placeholders with approved media.')
ON CONFLICT(surface_key) DO UPDATE SET route_path=excluded.route_path, surface_label=excluded.surface_label, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO css_drift_overlap_review_rows (review_key, selector_or_area, review_kind, recommended_fix, notes)
VALUES
('visual_placeholder_grid','.visual-placeholder-gallery','responsive_grid','Use auto-fit cards on desktop and one-column flow on phone.','Build 186 CSS added.'),
('admin_table_overflow','.admin-table','overflow','Keep table-wrap around admin tables; never force wide tables on mobile.','Existing pattern reinforced.'),
('hero_visual_overlays','.hero::after and visual accents','motion_safety','Respect prefers-reduced-motion and low-bandwidth mode.','No required animation.'),
('nav_touch_targets','.nav a, .btn','mobile_tap_target','Keep min-height near 44px on small screens.','Build 182/183 rule retained.'),
('placeholder_images','.visual-placeholder-card img','image_budget','Use lazy-loaded SVG placeholders until approved compressed media exists.','Sharp placeholders, low byte cost.')
ON CONFLICT(review_key) DO UPDATE SET selector_or_area=excluded.selector_or_area, review_kind=excluded.review_kind, recommended_fix=excluded.recommended_fix, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO next_step_sanity_rows (step_key, step_label, step_group, priority_rank, expected_value, target_surface, notes)
VALUES
('live_rollups_command_center','Live rollups into Command Center','next_20',1,'Daily dashboard becomes truly operational.','/admin/command-center/','Connect products/orders/SEO/visuals/performance counts.'),
('product_readiness_apply_more','More safe Product QA applies','next_20',2,'Less manual catalog cleanup.','/admin/readiness/','Limit to low-risk fixes first.'),
('replace_visual_placeholders','Replace placeholders with approved media','next_20',3,'Public pages look sharper and more trustworthy.','/admin/visual-enrichment-studio/','Use consent/public-use checks.'),
('customer_story_wizard','Customer story wizard','next_20',4,'More trust blocks and social proof.','/admin/public-proof-candidates/','Consent required.'),
('mobile_product_autosave','Mobile product autosave','next_20',5,'Phone product capture becomes safer.','/admin/mobile-product/','Preserve drafts after network failures.'),
('conversion_event_pipeline','Conversion event pipeline','next_20',6,'Know which pages make sales.','/admin/analytics/','Landing → product → cart → checkout → order.'),
('local_seo_gbp_log','Google Business Profile observation log','next_20',7,'Track local prominence work.','/admin/local-seo-review/','Manual observations until API integration exists.'),
('customer_timeline_cards','Customer/member timeline cards','next_20',8,'Better service and recall visibility.','/admin/members/','Orders, gift cards, recalls, proof approvals.'),
('costing_margin_cards','Costing margin cards','next_20',9,'Protect profit on handmade/vintage listings.','/admin/inventory-operations/','Material/labour/fees/packaging.'),
('performance_measurement_import','Performance measurement import','next_20',10,'Prevent visual polish from becoming slow.','/admin/visual-polish/','Store route payload measurements.')
ON CONFLICT(step_key) DO UPDATE SET step_label=excluded.step_label, step_group=excluded.step_group, priority_rank=excluded.priority_rank, expected_value=excluded.expected_value, target_surface=excluded.target_surface, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO markdown_consolidation_runs (build_label, run_status, canonical_file_count, supporting_file_count, retired_reference_count, summary_json, notes)
VALUES ('Build 186','prepared',2,14,0,'{"canonical":["PROJECT_STATUS_AND_ROADMAP.md","AI_HANDOFF.md"],"approach":"Keep existing Markdown for compatibility, but make two files primary for future AI/new-chat handoff."}','Build 186 Markdown sanity pass. Existing files are not deleted; they are reclassified so future work starts from the two canonical files.');

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_186_markdown_consolidation_visual_placeholders', 'database_build186_markdown_consolidation_visual_placeholders.sql', CURRENT_TIMESTAMP, 'Safe additive Build 186 schema for Markdown consolidation, value enhancement execution rows, visual graphic placeholders, desktop/mobile audits, CSS drift/overlap review, and next-step sanity rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

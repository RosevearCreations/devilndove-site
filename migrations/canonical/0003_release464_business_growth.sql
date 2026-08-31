-- Release 464 Update 3 — Business Application Growth
-- Additive forward-only authority. Development first; exact same file to Production only during deliberate promotion.
-- Existing Product, Inventory, Accounting and CAIP tables remain their domain authorities.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS storefront_merchandising_rules (
  storefront_merchandising_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  storefront_collection_id INTEGER NOT NULL,
  rule_key TEXT NOT NULL,
  operator TEXT NOT NULL DEFAULT 'equals',
  rule_value TEXT NOT NULL,
  effect TEXT NOT NULL DEFAULT 'include',
  priority INTEGER NOT NULL DEFAULT 0,
  active_from TEXT,
  active_until TEXT,
  rule_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (storefront_collection_id)
    REFERENCES storefront_collections(storefront_collection_id)
    ON DELETE CASCADE,
  CHECK (rule_key IN ('merchandise_origin','product_category','product_type','sale_channel','primary_material','making_process','locality_label')),
  CHECK (operator IN ('equals','not_equals','contains','in')),
  CHECK (effect IN ('include','exclude')),
  CHECK (rule_status IN ('active','paused','archived')),
  CHECK (active_until IS NULL OR active_from IS NULL OR datetime(active_until) >= datetime(active_from))
);

CREATE INDEX IF NOT EXISTS idx_storefront_merch_rules_collection_status
  ON storefront_merchandising_rules(storefront_collection_id, rule_status, priority DESC, storefront_merchandising_rule_id);
CREATE INDEX IF NOT EXISTS idx_storefront_merch_rules_schedule
  ON storefront_merchandising_rules(rule_status, active_from, active_until);

CREATE TABLE IF NOT EXISTS creative_business_pipelines (
  creative_business_pipeline_id INTEGER PRIMARY KEY AUTOINCREMENT,
  pipeline_key TEXT NOT NULL UNIQUE,
  creative_project_id INTEGER,
  content_project_id INTEGER,
  product_id INTEGER,
  storefront_collection_id INTEGER,
  accounting_period_month TEXT,
  pipeline_status TEXT NOT NULL DEFAULT 'draft',
  social_handoff_status TEXT NOT NULL DEFAULT 'not_ready',
  finished_inventory_reference TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (pipeline_status IN ('draft','in_progress','review_ready','storefront_ready','complete','archived')),
  CHECK (social_handoff_status IN ('not_ready','review_ready','approved','held')),
  CHECK (accounting_period_month IS NULL OR accounting_period_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_creative_business_pipeline_product
  ON creative_business_pipelines(product_id)
  WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_creative_business_pipeline_creative
  ON creative_business_pipelines(creative_project_id)
  WHERE creative_project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_creative_business_pipeline_status
  ON creative_business_pipelines(pipeline_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS creative_business_pipeline_events (
  creative_business_pipeline_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_business_pipeline_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  details_json TEXT,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_business_pipeline_id)
    REFERENCES creative_business_pipelines(creative_business_pipeline_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creative_business_pipeline_events_pipeline
  ON creative_business_pipeline_events(creative_business_pipeline_id, created_at DESC, creative_business_pipeline_event_id DESC);

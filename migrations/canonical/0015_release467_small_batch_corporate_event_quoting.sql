-- Release 467 Build 215 — Small-Batch, Corporate & Event Quoting
-- Additive structured assumptions over the existing Custom Work quote draft/revision/line-item authority.
-- No quote drafts, quote terms, tiers, payments or orders are created by this migration.

CREATE TABLE IF NOT EXISTS custom_request_quote_batch_terms (
  custom_request_quote_batch_terms_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER NOT NULL UNIQUE,
  requested_quantity INTEGER CHECK(requested_quantity IS NULL OR requested_quantity >= 1),
  quote_quantity INTEGER NOT NULL DEFAULT 1 CHECK(quote_quantity >= 1),
  unit_assumption_mode TEXT NOT NULL DEFAULT 'single_unit'
    CHECK(unit_assumption_mode IN ('single_unit','tiered','mixed','manual')),
  setup_charge_cents INTEGER NOT NULL DEFAULT 0 CHECK(setup_charge_cents >= 0),
  prototype_sample_charge_cents INTEGER NOT NULL DEFAULT 0 CHECK(prototype_sample_charge_cents >= 0),
  packaging_choice TEXT,
  packaging_charge_cents INTEGER NOT NULL DEFAULT 0 CHECK(packaging_charge_cents >= 0),
  personalization_scope TEXT NOT NULL DEFAULT 'unknown'
    CHECK(personalization_scope IN ('none','fixed','variable','mixed','unknown')),
  personalization_notes TEXT,
  unit_assumption_note TEXT,
  lead_time_min_days INTEGER CHECK(lead_time_min_days IS NULL OR lead_time_min_days >= 0),
  lead_time_max_days INTEGER CHECK(lead_time_max_days IS NULL OR lead_time_max_days >= 0),
  lead_time_assumption TEXT,
  handoff_method TEXT NOT NULL DEFAULT 'tbd'
    CHECK(handoff_method IN ('tbd','pickup','shipping','event_handoff','corporate_delivery','other')),
  handoff_notes TEXT,
  corporate_event_context TEXT,
  expires_at TEXT,
  production_cost_state TEXT NOT NULL DEFAULT 'unknown'
    CHECK(production_cost_state IN ('unknown','partial','reviewed')),
  production_cost_note TEXT,
  revision_note TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(lead_time_min_days IS NULL OR lead_time_max_days IS NULL OR lead_time_max_days >= lead_time_min_days),
  FOREIGN KEY(custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY(quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_custom_quote_batch_terms_request
  ON custom_request_quote_batch_terms(custom_request_id, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_quote_quantity_tiers (
  custom_request_quote_quantity_tier_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_quote_batch_terms_id INTEGER NOT NULL,
  quote_draft_id INTEGER NOT NULL,
  tier_label TEXT NOT NULL,
  min_quantity INTEGER NOT NULL CHECK(min_quantity >= 1),
  max_quantity INTEGER CHECK(max_quantity IS NULL OR max_quantity >= min_quantity),
  unit_amount_cents INTEGER CHECK(unit_amount_cents IS NULL OR unit_amount_cents >= 0),
  is_selected INTEGER NOT NULL DEFAULT 0 CHECK(is_selected IN (0,1)),
  assumption_note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(custom_request_quote_batch_terms_id) REFERENCES custom_request_quote_batch_terms(custom_request_quote_batch_terms_id) ON DELETE CASCADE,
  FOREIGN KEY(quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_custom_quote_quantity_tiers_terms
  ON custom_request_quote_quantity_tiers(custom_request_quote_batch_terms_id, sort_order, min_quantity);

CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_quote_quantity_tiers_selected
  ON custom_request_quote_quantity_tiers(custom_request_quote_batch_terms_id)
  WHERE is_selected=1;

-- Migration creates no quote/business rows.
SELECT COUNT(*) AS build215_quote_extension_tables
FROM sqlite_master
WHERE type='table'
  AND name IN ('custom_request_quote_batch_terms','custom_request_quote_quantity_tiers');
PRAGMA foreign_key_check;

-- Release 461 Development D1 structural forward repair.
-- This file intentionally omits "release461" from its filename because it repairs
-- already-existing older tables/indexes with ALTER/DROP, rather than defining new
-- Release 461 objects. Apply only after the exact read-only drift checker passes.
-- Development only. No data deletion, table rebuild, historical replay, provider,
-- R2, Pages, or separate live Production mutation.

PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

ALTER TABLE accounting_fixed_assets ADD COLUMN location_note TEXT;

ALTER TABLE custom_requests ADD COLUMN visitor_token TEXT;
ALTER TABLE custom_requests ADD COLUMN browser_session_token TEXT;

ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN prompt_type TEXT NOT NULL DEFAULT 'review_photo_consent';
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN subject TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN body_text TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN consent_question_text TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN prompt_token TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN public_response_status TEXT NOT NULL DEFAULT 'not_sent';
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN public_use_scope TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN review_text TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN customer_response_note TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN responded_at TEXT;

ALTER TABLE custom_request_payment_links ADD COLUMN order_id INTEGER;
ALTER TABLE custom_request_payment_links ADD COLUMN payment_id INTEGER;
ALTER TABLE custom_request_payment_links ADD COLUMN external_share_status TEXT NOT NULL DEFAULT 'gate_pending';
ALTER TABLE custom_request_payment_links ADD COLUMN gate_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE custom_request_payment_links ADD COLUMN preferred_provider TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE custom_request_payment_links ADD COLUMN checkout_redirect_url TEXT;

DROP INDEX IF EXISTS idx_accounting_gifi_review_notes_year;
CREATE INDEX idx_accounting_gifi_review_notes_year
  ON accounting_gifi_review_notes(tax_year, review_status, gifi_code);

DROP INDEX IF EXISTS idx_accounting_journal_entries_source;
CREATE INDEX idx_accounting_journal_entries_source
  ON accounting_journal_entries(source_type, source_key);

DROP INDEX IF EXISTS idx_accounting_period_closures_period;
CREATE INDEX idx_accounting_period_closures_period
  ON accounting_period_closures(period_month DESC, lock_state);

DROP INDEX IF EXISTS idx_custom_candle_soap_specs_request;
CREATE INDEX idx_custom_candle_soap_specs_request
  ON custom_candle_soap_product_specs(custom_request_id, updated_at DESC);

COMMIT;
PRAGMA foreign_key_check;

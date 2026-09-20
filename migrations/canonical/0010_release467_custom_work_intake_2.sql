-- Release 467 Build 210 — Custom Work Intake 2.0
-- Enrich the existing custom_requests authority with structured manufacturing-intent fields.
-- Build 211 owns staff manufacturing-route proposals; this migration records customer requirements only.

ALTER TABLE custom_requests ADD COLUMN quantity INTEGER CHECK(quantity IS NULL OR quantity >= 1);
ALTER TABLE custom_requests ADD COLUMN project_intent TEXT CHECK(project_intent IS NULL OR project_intent IN ('one_off','prototype','repeat','batch','corporate_event','repair_remake','unknown'));
ALTER TABLE custom_requests ADD COLUMN intended_use TEXT;
ALTER TABLE custom_requests ADD COLUMN organization_name TEXT;
ALTER TABLE custom_requests ADD COLUMN event_context_structured TEXT;
ALTER TABLE custom_requests ADD COLUMN supplied_item INTEGER NOT NULL DEFAULT 0 CHECK(supplied_item IN (0,1));
ALTER TABLE custom_requests ADD COLUMN desired_material TEXT;
ALTER TABLE custom_requests ADD COLUMN desired_finish TEXT;
ALTER TABLE custom_requests ADD COLUMN personalization_text TEXT;
ALTER TABLE custom_requests ADD COLUMN requested_capability_key TEXT REFERENCES workshop_capability_profiles(capability_key) ON DELETE SET NULL;
ALTER TABLE custom_requests ADD COLUMN tolerance_size_notes TEXT;
ALTER TABLE custom_requests ADD COLUMN help_choose_method INTEGER NOT NULL DEFAULT 0 CHECK(help_choose_method IN (0,1));

CREATE INDEX IF NOT EXISTS idx_custom_requests_capability_created
  ON custom_requests(requested_capability_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_requests_project_intent_created
  ON custom_requests(project_intent, created_at DESC);

-- Evidence-only checks. Existing request/status/quote/order authority is preserved.
SELECT COUNT(*) AS build210_required_columns
FROM pragma_table_info('custom_requests')
WHERE name IN (
  'quantity','project_intent','intended_use','organization_name','event_context_structured',
  'supplied_item','desired_material','desired_finish','personalization_text',
  'requested_capability_key','tolerance_size_notes','help_choose_method'
);
PRAGMA foreign_key_check;

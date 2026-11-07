-- PROPOSED ONLY; NOT in canonical D1 migration stream. The original source
-- owner must verify backup, apply 0052–0062 first, approve this in Development,
-- then separately approve any Production migration before dependent enablement.
-- No SQL statement here activates Meta, enables publication, or changes OAuth.
CREATE TABLE IF NOT EXISTS dd628_original_meta_signed_decision_custody (
  custody_sha256 TEXT PRIMARY KEY CHECK(length(custody_sha256)=64),
  original_decision_sha256 TEXT NOT NULL UNIQUE CHECK(length(original_decision_sha256)=64),
  original_packet_sha256 TEXT NOT NULL CHECK(length(original_packet_sha256)=64),
  witness_sha256 TEXT NOT NULL REFERENCES dd624_meta_witness_acceptances(witness_sha256),
  receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64),
  page_id TEXT NOT NULL,
  primary_custody_ref TEXT NOT NULL,secondary_custody_ref TEXT NOT NULL,
  signed_original_decision_json TEXT NOT NULL,signed_custody_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='ORIGINAL_META_READONLY_DECISION_CUSTODY_OWNER_REVIEW_ONLY'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS dd628_custody_no_update
BEFORE UPDATE ON dd628_original_meta_signed_decision_custody
BEGIN SELECT RAISE(ABORT,'Original Meta signed custody is immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd628_custody_no_delete
BEFORE DELETE ON dd628_original_meta_signed_decision_custody
BEGIN SELECT RAISE(ABORT,'Original Meta signed custody cannot be erased'); END;

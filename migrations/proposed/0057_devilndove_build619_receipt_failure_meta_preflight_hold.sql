-- PROPOSED ONLY: NO AUTOMATIC D1 APPLY. Depends on reviewed 0052–0056.
-- Must be independently approved against witnessed backup/restore and exact manifest.
CREATE TABLE IF NOT EXISTS dd619_etsy_failure_custody (
  test_nonce TEXT PRIMARY KEY REFERENCES dd618_provider_test_attempts(test_nonce),
  grant_id TEXT NOT NULL REFERENCES dd618_original_test_grants(grant_id),
  failure_sha256 TEXT NOT NULL UNIQUE CHECK (length(failure_sha256)=64),
  failure_code TEXT NOT NULL CHECK (failure_code IN
    ('TIMEOUT','NETWORK_ERROR','UNVERIFIED_PROVIDER_RESPONSE','RECEIPT_PERSISTENCE_FAILED')),
  endpoint TEXT NOT NULL CHECK (endpoint='GET /v3/application/users/me'),
  status TEXT NOT NULL CHECK (status='SPENT_NONCE_NO_RETRY_PRESERVED'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd619_etsy_failure_dispositions (
  disposition_sha256 TEXT PRIMARY KEY CHECK (length(disposition_sha256)=64),
  test_nonce TEXT NOT NULL UNIQUE REFERENCES dd619_etsy_failure_custody(test_nonce),
  failure_sha256 TEXT NOT NULL REFERENCES dd619_etsy_failure_custody(failure_sha256),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status='WITNESSED_SPENT_NONCE_NO_RETRY'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS dd619_failure_no_update BEFORE UPDATE ON dd619_etsy_failure_custody
BEGIN SELECT RAISE(ABORT,'Spent GET failure custody immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd619_failure_no_delete BEFORE DELETE ON dd619_etsy_failure_custody
BEGIN SELECT RAISE(ABORT,'Spent GET failure custody cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd619_disposition_no_update BEFORE UPDATE ON dd619_etsy_failure_dispositions
BEGIN SELECT RAISE(ABORT,'Witnessed GET failure decision immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd619_disposition_no_delete BEFORE DELETE ON dd619_etsy_failure_dispositions
BEGIN SELECT RAISE(ABORT,'Witnessed GET failure decision cannot be erased'); END;

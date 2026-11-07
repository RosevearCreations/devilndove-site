-- PROPOSED ONLY. Never apply through source deployment/admin UI.
-- Requires independently approved 0052–0059, original custody, witnessed
-- backup/restore, separately verified external custodian and original owner approval.
CREATE TABLE IF NOT EXISTS dd622_archive_attempts (
  test_nonce TEXT PRIMARY KEY,
  manifest_sha256 TEXT NOT NULL REFERENCES dd621_etsy_history_checkpoints(manifest_sha256),
  archive_grant_sha256 TEXT NOT NULL UNIQUE CHECK(length(archive_grant_sha256)=64),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='SINGLE_ORIGINAL_ARCHIVE_GET_NONCE_SPENT'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd622_archive_readbacks (
  test_nonce TEXT PRIMARY KEY REFERENCES dd622_archive_attempts(test_nonce),
  manifest_sha256 TEXT NOT NULL REFERENCES dd621_etsy_history_checkpoints(manifest_sha256),
  archive_readback_sha256 TEXT NOT NULL CHECK(length(archive_readback_sha256)=64),
  status TEXT NOT NULL CHECK(status='EXTERNAL_ARCHIVE_GET_MATCHED_COMPLETE_HISTORY_NO_PROVIDER_AUTHORITY'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd622_archive_failures (
  test_nonce TEXT PRIMARY KEY REFERENCES dd622_archive_attempts(test_nonce),
  failure_sha256 TEXT NOT NULL UNIQUE CHECK(length(failure_sha256)=64),
  failure_code TEXT NOT NULL CHECK(failure_code IN
    ('TIMEOUT','NETWORK_ERROR','MISMATCHED_EXTERNAL_BYTES','RECEIPT_STORE_FAILED')),
  status TEXT NOT NULL CHECK(status='SPENT_ARCHIVE_NONCE_NO_RETRY'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd622_meta_test_closures (
  closure_sha256 TEXT PRIMARY KEY CHECK(length(closure_sha256)=64),
  test_nonce TEXT NOT NULL UNIQUE REFERENCES dd621_meta_get_witness_acceptances(test_nonce),
  witness_acceptance_sha256 TEXT NOT NULL REFERENCES dd621_meta_get_witness_acceptances(acceptance_sha256),
  archive_readback_sha256 TEXT NOT NULL CHECK(length(archive_readback_sha256)=64),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='ORIGINAL_META_SINGLE_GET_WITNESSED_READ_ONLY_NO_CONNECTION'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS dd622_attempt_no_update BEFORE UPDATE ON dd622_archive_attempts
BEGIN SELECT RAISE(ABORT,'Spent external readback nonce immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd622_attempt_no_delete BEFORE DELETE ON dd622_archive_attempts
BEGIN SELECT RAISE(ABORT,'Spent external readback nonce cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd622_archive_no_update BEFORE UPDATE ON dd622_archive_readbacks
BEGIN SELECT RAISE(ABORT,'Exact original archive response immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd622_archive_no_delete BEFORE DELETE ON dd622_archive_readbacks
BEGIN SELECT RAISE(ABORT,'Exact original archive response cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd622_failure_no_update BEFORE UPDATE ON dd622_archive_failures
BEGIN SELECT RAISE(ABORT,'Independent archive failure immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd622_failure_no_delete BEFORE DELETE ON dd622_archive_failures
BEGIN SELECT RAISE(ABORT,'Independent archive failure cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd622_closure_no_update BEFORE UPDATE ON dd622_meta_test_closures
BEGIN SELECT RAISE(ABORT,'Original Meta single GET closure immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd622_closure_no_delete BEFORE DELETE ON dd622_meta_test_closures
BEGIN SELECT RAISE(ABORT,'Original Meta single GET closure cannot be erased'); END;

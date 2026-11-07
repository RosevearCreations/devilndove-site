-- PROPOSED ONLY. Never auto-applied by the code deployment, CI or admin request.
-- Requires owner-approved backup/restore, verified proposed 0052–0061, and
-- independently authenticated original Meta issuer, witness, owner signatures.
CREATE TABLE IF NOT EXISTS dd624_meta_credential_enrollments (
  enrollment_sha256 TEXT PRIMARY KEY CHECK(length(enrollment_sha256)=64),
  window_sha256 TEXT NOT NULL REFERENCES dd623_meta_readonly_windows(window_sha256),
  original_completion_sha256 TEXT NOT NULL REFERENCES dd623_original_meta_completions(completion_sha256),
  page_id TEXT NOT NULL,scopes_sha256 TEXT NOT NULL CHECK(length(scopes_sha256)=64),
  encrypted_credential_sha256 TEXT NOT NULL CHECK(length(encrypted_credential_sha256)=64),
  owner_ledger_head_sha256 TEXT NOT NULL CHECK(length(owner_ledger_head_sha256)=64),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='ORIGINAL_META_EXISTING_ENCRYPTED_READ_CREDENTIAL_ATTESTED'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd624_meta_one_use_grants (
  authorization_id TEXT PRIMARY KEY,
  authorization_sha256 TEXT NOT NULL UNIQUE CHECK(length(authorization_sha256)=64),
  enrollment_sha256 TEXT NOT NULL REFERENCES dd624_meta_credential_enrollments(enrollment_sha256),
  window_sha256 TEXT NOT NULL REFERENCES dd623_meta_readonly_windows(window_sha256),
  test_nonce TEXT NOT NULL UNIQUE,
  page_id TEXT NOT NULL,expires_at TEXT NOT NULL,
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='ORIGINAL_META_ONE_USE_LIVE_PAGE_ID_RECHECK_APPROVED'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd624_meta_live_attempts (
  test_nonce TEXT PRIMARY KEY REFERENCES dd624_meta_one_use_grants(test_nonce),
  authorization_id TEXT NOT NULL REFERENCES dd624_meta_one_use_grants(authorization_id),
  status TEXT NOT NULL CHECK(status='CLAIMED_ONE_ORIGINAL_META_PAGE_ID_GET_NO_RETRY'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd624_meta_live_outcomes (
  test_nonce TEXT PRIMARY KEY REFERENCES dd624_meta_live_attempts(test_nonce),
  remote_page_id TEXT NOT NULL,receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64),
  status TEXT NOT NULL CHECK(status='GENUINE_META_PAGE_ID_GET_PENDING_INDEPENDENT_WITNESS'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd624_meta_live_failures (
  test_nonce TEXT PRIMARY KEY REFERENCES dd624_meta_live_attempts(test_nonce),
  failure_code TEXT NOT NULL CHECK(failure_code IN
    ('TIMEOUT','NETWORK_ERROR','PROVIDER_UNVERIFIED','RECEIPT_WRITE_FAILED')),
  status TEXT NOT NULL CHECK(status='SPENT_ORIGINAL_META_NONCE_NO_RETRY'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd624_meta_witness_acceptances (
  witness_sha256 TEXT PRIMARY KEY CHECK(length(witness_sha256)=64),
  authorization_id TEXT NOT NULL REFERENCES dd624_meta_one_use_grants(authorization_id),
  test_nonce TEXT NOT NULL UNIQUE REFERENCES dd624_meta_live_outcomes(test_nonce),
  enrollment_sha256 TEXT NOT NULL REFERENCES dd624_meta_credential_enrollments(enrollment_sha256),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='ORIGINAL_META_ONE_GENUINE_PAGE_GET_INDEPENDENTLY_WITNESSED'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- An expiry is derived at read time, rather than mutating immutable signatures.
-- Attempt claims always precede provider I/O; failures and successes are separate.
CREATE TRIGGER IF NOT EXISTS dd624_enroll_no_update BEFORE UPDATE ON dd624_meta_credential_enrollments
BEGIN SELECT RAISE(ABORT,'Original Meta credential enrollment immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd624_enroll_no_delete BEFORE DELETE ON dd624_meta_credential_enrollments
BEGIN SELECT RAISE(ABORT,'Original Meta credential enrollment cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd624_grant_no_update BEFORE UPDATE ON dd624_meta_one_use_grants
BEGIN SELECT RAISE(ABORT,'Original Meta single-use grant immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd624_grant_no_delete BEFORE DELETE ON dd624_meta_one_use_grants
BEGIN SELECT RAISE(ABORT,'Original Meta single-use grant cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd624_attempt_no_update BEFORE UPDATE ON dd624_meta_live_attempts
BEGIN SELECT RAISE(ABORT,'Original Meta single-use nonce immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd624_attempt_no_delete BEFORE DELETE ON dd624_meta_live_attempts
BEGIN SELECT RAISE(ABORT,'Original Meta single-use nonce cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd624_outcome_no_update BEFORE UPDATE ON dd624_meta_live_outcomes
BEGIN SELECT RAISE(ABORT,'Original Meta Page GET receipt immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd624_outcome_no_delete BEFORE DELETE ON dd624_meta_live_outcomes
BEGIN SELECT RAISE(ABORT,'Original Meta Page GET receipt cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd624_failure_no_update BEFORE UPDATE ON dd624_meta_live_failures
BEGIN SELECT RAISE(ABORT,'Original Meta failure nonce immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd624_failure_no_delete BEFORE DELETE ON dd624_meta_live_failures
BEGIN SELECT RAISE(ABORT,'Original Meta failure nonce cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd624_witness_no_update BEFORE UPDATE ON dd624_meta_witness_acceptances
BEGIN SELECT RAISE(ABORT,'Independent original Meta witness immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd624_witness_no_delete BEFORE DELETE ON dd624_meta_witness_acceptances
BEGIN SELECT RAISE(ABORT,'Independent original Meta witness cannot be erased'); END;

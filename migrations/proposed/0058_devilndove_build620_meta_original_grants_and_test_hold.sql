-- PROPOSED ONLY. NEVER APPLY VIA SOURCE DEPLOY OR UI.
-- Requires independently approved 0052–0057, original Meta issuer custody,
-- exact owner-signed read grant, witnessed backup and separate D1 migration authority.
CREATE TABLE IF NOT EXISTS dd620_meta_original_source_registrations (
  authority_id TEXT PRIMARY KEY REFERENCES dd614_authorities(authority_id),
  original_source_sha256 TEXT NOT NULL CHECK (length(original_source_sha256)=64),
  official_original_source_ref TEXT NOT NULL,
  external_review_sha256 TEXT NOT NULL CHECK (length(external_review_sha256)=64),
  status TEXT NOT NULL CHECK(status='INDEPENDENTLY_APPROVED_ORIGINAL_META_SOURCE'),
  approved_by TEXT NOT NULL,approved_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dd620_meta_read_grants (
  grant_id TEXT PRIMARY KEY,
  issuer_authority_id TEXT NOT NULL REFERENCES dd620_meta_original_source_registrations(authority_id),
  original_source_sha256 TEXT NOT NULL CHECK(length(original_source_sha256)=64),
  checkpoint_sha256 TEXT NOT NULL REFERENCES dd617_external_readbacks(checkpoint_sha256),
  expected_page_id TEXT NOT NULL,
  scopes_sha256 TEXT NOT NULL CHECK(length(scopes_sha256)=64),
  test_nonce TEXT NOT NULL UNIQUE,
  approval_sha256 TEXT NOT NULL UNIQUE CHECK(length(approval_sha256)=64),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ'),
  approved_by TEXT NOT NULL,approved_at TEXT NOT NULL
);
-- Only separate original custody operators can install a grant. No admin grant/approve API.
CREATE TABLE IF NOT EXISTS dd620_meta_test_attempts (
  test_nonce TEXT PRIMARY KEY REFERENCES dd620_meta_read_grants(test_nonce),
  grant_id TEXT NOT NULL REFERENCES dd620_meta_read_grants(grant_id),
  status TEXT NOT NULL CHECK(status='CLAIMED_EXACTLY_ONE_META_PAGE_GET'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd620_meta_test_outcomes (
  test_nonce TEXT PRIMARY KEY REFERENCES dd620_meta_test_attempts(test_nonce),
  remote_page_id TEXT NOT NULL,
  receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64),
  endpoint TEXT NOT NULL CHECK(endpoint='GET /v26.0/{page_id}?fields=id'),
  status TEXT NOT NULL CHECK(status='META_PAGE_ID_GET_RECEIPT_PENDING_INDEPENDENT_WITNESS'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd620_meta_test_failures (
  test_nonce TEXT PRIMARY KEY REFERENCES dd620_meta_test_attempts(test_nonce),
  grant_id TEXT NOT NULL REFERENCES dd620_meta_read_grants(grant_id),
  failure_sha256 TEXT NOT NULL UNIQUE CHECK(length(failure_sha256)=64),
  failure_code TEXT NOT NULL CHECK(failure_code IN
    ('TIMEOUT','NETWORK_ERROR','PROVIDER_UNVERIFIED','RECEIPT_WRITE_FAILED')),
  status TEXT NOT NULL CHECK(status='SPENT_META_NONCE_NO_RETRY'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS dd620_source_no_update BEFORE UPDATE ON dd620_meta_original_source_registrations
BEGIN SELECT RAISE(ABORT,'Original Meta source immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd620_source_no_delete BEFORE DELETE ON dd620_meta_original_source_registrations
BEGIN SELECT RAISE(ABORT,'Original Meta source cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd620_grant_no_update BEFORE UPDATE ON dd620_meta_read_grants
BEGIN SELECT RAISE(ABORT,'Original Meta owner grant immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd620_grant_no_delete BEFORE DELETE ON dd620_meta_read_grants
BEGIN SELECT RAISE(ABORT,'Original Meta owner grant cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd620_attempt_no_update BEFORE UPDATE ON dd620_meta_test_attempts
BEGIN SELECT RAISE(ABORT,'One-use Meta attempt immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd620_attempt_no_delete BEFORE DELETE ON dd620_meta_test_attempts
BEGIN SELECT RAISE(ABORT,'One-use Meta attempt cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd620_outcome_no_update BEFORE UPDATE ON dd620_meta_test_outcomes
BEGIN SELECT RAISE(ABORT,'Meta Page GET receipt immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd620_outcome_no_delete BEFORE DELETE ON dd620_meta_test_outcomes
BEGIN SELECT RAISE(ABORT,'Meta Page GET receipt cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd620_failure_no_update BEFORE UPDATE ON dd620_meta_test_failures
BEGIN SELECT RAISE(ABORT,'Meta Page GET failed nonce immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd620_failure_no_delete BEFORE DELETE ON dd620_meta_test_failures
BEGIN SELECT RAISE(ABORT,'Meta Page GET failed nonce cannot be erased'); END;

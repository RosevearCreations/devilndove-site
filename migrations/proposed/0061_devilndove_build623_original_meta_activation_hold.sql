-- PROPOSED ONLY: no CI/source deploy or normal admin request may apply this.
-- Requires independently approved proposed 0052–0060, restored backup,
-- original outside-the-app Ed25519 issuer/witness/owner keys and original custodian.
CREATE TABLE IF NOT EXISTS dd623_original_meta_completions (
  completion_sha256 TEXT PRIMARY KEY CHECK(length(completion_sha256)=64),
  grant_id TEXT NOT NULL REFERENCES dd620_meta_read_grants(grant_id),
  test_nonce TEXT NOT NULL UNIQUE REFERENCES dd622_meta_test_closures(test_nonce),
  issuer_authority_id TEXT NOT NULL REFERENCES dd620_meta_original_source_registrations(authority_id),
  meta_closure_sha256 TEXT NOT NULL REFERENCES dd622_meta_test_closures(closure_sha256),
  archive_readback_sha256 TEXT NOT NULL CHECK(length(archive_readback_sha256)=64),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='ORIGINAL_META_CUSTODY_SIGNED_PENDING_SEPARATE_ARCHIVE_CONTINUITY'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd623_archive_continuity_witnesses (
  continuity_sha256 TEXT PRIMARY KEY CHECK(length(continuity_sha256)=64),
  history_manifest_sha256 TEXT NOT NULL REFERENCES dd621_etsy_history_checkpoints(manifest_sha256),
  first_archive_nonce TEXT NOT NULL REFERENCES dd622_archive_readbacks(test_nonce),
  second_archive_nonce TEXT NOT NULL REFERENCES dd622_archive_readbacks(test_nonce),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='TWO_INDEPENDENT_ORIGINAL_ARCHIVE_READBACKS_SIGNED'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(first_archive_nonce<>second_archive_nonce)
);
CREATE TABLE IF NOT EXISTS dd623_meta_readonly_windows (
  window_sha256 TEXT PRIMARY KEY CHECK(length(window_sha256)=64),
  completion_sha256 TEXT NOT NULL REFERENCES dd623_original_meta_completions(completion_sha256),
  continuity_sha256 TEXT NOT NULL REFERENCES dd623_archive_continuity_witnesses(continuity_sha256),
  meta_closure_sha256 TEXT NOT NULL REFERENCES dd622_meta_test_closures(closure_sha256),
  grant_id TEXT NOT NULL REFERENCES dd620_meta_read_grants(grant_id),
  test_nonce TEXT NOT NULL REFERENCES dd622_meta_test_closures(test_nonce),
  decision_nonce TEXT NOT NULL UNIQUE,
  page_id TEXT NOT NULL,
  scopes_sha256 TEXT NOT NULL CHECK(length(scopes_sha256)=64),
  owner_ledger_head_sha256 TEXT NOT NULL CHECK(length(owner_ledger_head_sha256)=64),
  expires_at TEXT NOT NULL,
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='META_ORIGINAL_READ_ONLY_STORED_PAGE_ID_TEST_WINDOW'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- These rows never modify connection_status or issue a provider request. Short-lived
-- status is derived at read-time and fails closed on changed roots/owner/Page/scopes.
CREATE TRIGGER IF NOT EXISTS dd623_completion_no_update BEFORE UPDATE ON dd623_original_meta_completions
BEGIN SELECT RAISE(ABORT,'Original Meta owner completion evidence immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd623_completion_no_delete BEFORE DELETE ON dd623_original_meta_completions
BEGIN SELECT RAISE(ABORT,'Original Meta owner completion cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd623_continuity_no_update BEFORE UPDATE ON dd623_archive_continuity_witnesses
BEGIN SELECT RAISE(ABORT,'Independent archive continuity evidence immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd623_continuity_no_delete BEFORE DELETE ON dd623_archive_continuity_witnesses
BEGIN SELECT RAISE(ABORT,'Independent archive continuity cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd623_window_no_update BEFORE UPDATE ON dd623_meta_readonly_windows
BEGIN SELECT RAISE(ABORT,'Verified read-only test window immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd623_window_no_delete BEFORE DELETE ON dd623_meta_readonly_windows
BEGIN SELECT RAISE(ABORT,'Verified read-only test window cannot be erased'); END;

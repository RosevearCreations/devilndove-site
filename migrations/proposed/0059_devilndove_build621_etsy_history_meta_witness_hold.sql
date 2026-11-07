-- PROPOSED ONLY: no autonomous D1 application. Requires independently approved
-- 0052–0058, restored backup and original issuer/witness/owner trust enrollment.
-- Neither deployment nor a normal admin action may create an original authority.
CREATE TABLE IF NOT EXISTS dd621_etsy_history_checkpoints (
  manifest_sha256 TEXT PRIMARY KEY CHECK(length(manifest_sha256)=64),
  history_sha256 TEXT NOT NULL CHECK(length(history_sha256)=64),
  counts_sha256 TEXT NOT NULL CHECK(length(counts_sha256)=64),
  checkpoint_sha256 TEXT NOT NULL REFERENCES dd617_external_readbacks(checkpoint_sha256),
  original_source_sha256 TEXT NOT NULL CHECK(length(original_source_sha256)=64),
  external_receipt_sha256 TEXT NOT NULL CHECK(length(external_receipt_sha256)=64),
  external_custody_ref TEXT NOT NULL,
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='ORIGINAL_HISTORY_SIGNED_EXTERNAL_ARCHIVE_READBACK_PENDING'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- A signed digest of every immutable row is not proof that a third-party archive
-- has actually accepted the checkpoint: that separate readback remains on HOLD.
CREATE TABLE IF NOT EXISTS dd621_meta_get_witness_acceptances (
  acceptance_sha256 TEXT PRIMARY KEY CHECK(length(acceptance_sha256)=64),
  test_nonce TEXT NOT NULL UNIQUE REFERENCES dd620_meta_test_outcomes(test_nonce),
  grant_id TEXT NOT NULL REFERENCES dd620_meta_read_grants(grant_id),
  receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64),
  history_manifest_sha256 TEXT NOT NULL REFERENCES dd621_etsy_history_checkpoints(manifest_sha256),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='WITNESSED_ONE_META_PAGE_ID_GET_NO_CONNECTED_CLAIM'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS dd621_history_no_update BEFORE UPDATE ON dd621_etsy_history_checkpoints
BEGIN SELECT RAISE(ABORT,'Full-history signed checkpoint immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd621_history_no_delete BEFORE DELETE ON dd621_etsy_history_checkpoints
BEGIN SELECT RAISE(ABORT,'Full-history signed checkpoint cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd621_witness_no_update BEFORE UPDATE ON dd621_meta_get_witness_acceptances
BEGIN SELECT RAISE(ABORT,'Genuine Meta GET witness acceptance immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd621_witness_no_delete BEFORE DELETE ON dd621_meta_get_witness_acceptances
BEGIN SELECT RAISE(ABORT,'Genuine Meta GET witness acceptance cannot be erased'); END;

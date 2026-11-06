-- PROPOSED ONLY. NEVER AUTOMATICALLY APPLIED TO PRODUCTION OR DEVELOPMENT D1.
-- Requires approved 0052/0053/0054, independent original custody, witnessed backup,
-- separately authorized operator and explicit owner approval.
CREATE TABLE IF NOT EXISTS dd617_anchor_custodians (
  custodian_id TEXT PRIMARY KEY,
  origin TEXT NOT NULL UNIQUE CHECK (substr(origin,1,8)='https://'),
  approval_sha256 TEXT NOT NULL CHECK (length(approval_sha256)=64),
  status TEXT NOT NULL CHECK (status='INDEPENDENTLY_APPROVED'),
  independently_approved_by TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Application has NO write endpoint for approving a custodian. An original external
-- operator must approve and independently witness exact origin + public fingerprint.
CREATE TABLE IF NOT EXISTS dd617_external_readbacks (
  checkpoint_sha256 TEXT PRIMARY KEY REFERENCES dd616_checkpoint_receipts(checkpoint_sha256),
  readback_sha256 TEXT NOT NULL CHECK (length(readback_sha256)=64),
  ledger_head_sha256 TEXT NOT NULL CHECK (length(ledger_head_sha256)=64),
  ledger_sequence INTEGER NOT NULL CHECK (ledger_sequence>0),
  custodian_id TEXT NOT NULL REFERENCES dd617_anchor_custodians(custodian_id),
  original_issuer_source_sha256 TEXT NOT NULL CHECK (length(original_issuer_source_sha256)=64),
  signer_ids_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status='EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING'),
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd617_quarantine_recovery_packets (
  recovery_sha256 TEXT PRIMARY KEY CHECK (length(recovery_sha256)=64),
  quarantined_authority_id TEXT NOT NULL REFERENCES dd616_key_quarantines(authority_id),
  replacement_authority_id TEXT NOT NULL REFERENCES dd614_authorities(authority_id),
  checkpoint_sha256 TEXT NOT NULL REFERENCES dd617_external_readbacks(checkpoint_sha256),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status='PENDING_ORIGINAL_ISSUER_AND_OWNER_RECOVERY_APPROVAL'),
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd617_witnessed_test_preflights (
  preflight_sha256 TEXT PRIMARY KEY CHECK (length(preflight_sha256)=64),
  issuer_authority_id TEXT NOT NULL REFERENCES dd614_authorities(authority_id),
  checkpoint_sha256 TEXT NOT NULL REFERENCES dd617_external_readbacks(checkpoint_sha256),
  exact_scope_json TEXT NOT NULL,
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status='PENDING_FINAL_OWNER_SUPERVISED_TEST_APPROVAL'),
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS dd617_custodian_no_update BEFORE UPDATE ON dd617_anchor_custodians
BEGIN SELECT RAISE(ABORT,'Independent custodian approval is immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd617_custodian_no_delete BEFORE DELETE ON dd617_anchor_custodians
BEGIN SELECT RAISE(ABORT,'Independent custodian approval cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd617_readback_no_update BEFORE UPDATE ON dd617_external_readbacks
BEGIN SELECT RAISE(ABORT,'Externally verified receipt is immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd617_readback_no_delete BEFORE DELETE ON dd617_external_readbacks
BEGIN SELECT RAISE(ABORT,'Externally verified receipt cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd617_recovery_no_update BEFORE UPDATE ON dd617_quarantine_recovery_packets
BEGIN SELECT RAISE(ABORT,'Quarantine recovery evidence is immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd617_recovery_no_delete BEFORE DELETE ON dd617_quarantine_recovery_packets
BEGIN SELECT RAISE(ABORT,'Quarantine recovery evidence cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd617_test_no_update BEFORE UPDATE ON dd617_witnessed_test_preflights
BEGIN SELECT RAISE(ABORT,'Provider TEST preflight evidence is immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd617_test_no_delete BEFORE DELETE ON dd617_witnessed_test_preflights
BEGIN SELECT RAISE(ABORT,'Provider TEST preflight evidence cannot be erased'); END;

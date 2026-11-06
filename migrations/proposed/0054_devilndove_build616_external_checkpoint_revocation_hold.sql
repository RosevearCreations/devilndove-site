-- PROPOSED ONLY. NOT APPLIED TO PRODUCTION OR DEVELOPMENT D1.
-- Requires approved preceding 0052/0053, an independently witnessed D1 backup,
-- exact owner permission, and separate original issuer/witness verification.
CREATE TABLE IF NOT EXISTS dd616_key_quarantines (
  authority_id TEXT PRIMARY KEY REFERENCES dd614_authorities(authority_id),
  key_sha256 TEXT NOT NULL CHECK (length(key_sha256)=64),
  reason TEXT NOT NULL CHECK (reason IN
    ('KEY_COMPROMISE','OWNER_REVOKED','CUSTODY_DISPUTE','SIGNATURE_CONFLICT')),
  evidence_ref TEXT NOT NULL,
  evidence_sha256 TEXT NOT NULL CHECK (length(evidence_sha256)=64),
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dd616_quarantine_fingerprint ON dd616_key_quarantines(key_sha256);
CREATE TRIGGER IF NOT EXISTS dd616_quarantine_no_update BEFORE UPDATE ON dd616_key_quarantines
BEGIN SELECT RAISE(ABORT,'Quarantined keys cannot be reactivated by an application'); END;
CREATE TRIGGER IF NOT EXISTS dd616_quarantine_no_delete BEFORE DELETE ON dd616_key_quarantines
BEGIN SELECT RAISE(ABORT,'Quarantine requires an independent recovery authority'); END;
CREATE TABLE IF NOT EXISTS dd616_checkpoint_receipts (
  checkpoint_sha256 TEXT PRIMARY KEY CHECK (length(checkpoint_sha256)=64),
  ledger_head_sha256 TEXT NOT NULL CHECK (length(ledger_head_sha256)=64),
  ledger_sequence INTEGER NOT NULL CHECK (ledger_sequence>0),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status='SIGNED_PENDING_EXTERNAL_READBACK'),
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS dd616_checkpoint_no_update BEFORE UPDATE ON dd616_checkpoint_receipts
BEGIN SELECT RAISE(ABORT,'External checkpoint intake is immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd616_checkpoint_no_delete BEFORE DELETE ON dd616_checkpoint_receipts
BEGIN SELECT RAISE(ABORT,'External checkpoint intake cannot be erased'); END;
CREATE TABLE IF NOT EXISTS dd616_rotation_candidates (
  rotation_sha256 TEXT PRIMARY KEY CHECK (length(rotation_sha256)=64),
  old_authority_id TEXT NOT NULL REFERENCES dd614_authorities(authority_id),
  new_authority_id TEXT NOT NULL REFERENCES dd614_authorities(authority_id),
  original_source_sha256 TEXT NOT NULL CHECK (length(original_source_sha256)=64),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status='PENDING_INDEPENDENT_ROTATION_APPROVAL'),
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS dd616_rotation_no_update BEFORE UPDATE ON dd616_rotation_candidates
BEGIN SELECT RAISE(ABORT,'Pending rotation evidence is immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd616_rotation_no_delete BEFORE DELETE ON dd616_rotation_candidates
BEGIN SELECT RAISE(ABORT,'Pending rotation evidence cannot be erased'); END;

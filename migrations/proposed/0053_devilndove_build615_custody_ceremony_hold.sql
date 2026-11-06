-- PROPOSED ONLY: NOT AUTHORIZED FOR DEVELOPMENT OR PRODUCTION D1 APPLICATION.
-- Requires approved 0052, a recovery snapshot, independent original issuer/custody
-- verification, separate owner authority and a witnessed migration change review.
CREATE TABLE IF NOT EXISTS dd615_custody_readbacks (
  receipt_id TEXT PRIMARY KEY,
  authority_id TEXT NOT NULL REFERENCES dd614_authorities(authority_id),
  original_source_ref TEXT NOT NULL,
  original_source_sha256 TEXT NOT NULL CHECK (length(original_source_sha256)=64),
  original_receipt_sha256 TEXT NOT NULL CHECK (length(original_receipt_sha256)=64),
  witness_authority_id TEXT NOT NULL,
  owner_authority_id TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_EXTERNAL_AUTHENTICATION'
    CHECK (status IN ('PENDING_EXTERNAL_AUTHENTICATION','EXTERNALLY_AUTHENTICATED','DISPUTED','REVOKED')),
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- No application method authenticates a pending custody claim or mutates it.
-- A separate, independently witnessed privileged change would be required.
CREATE TRIGGER IF NOT EXISTS dd615_custody_no_update
BEFORE UPDATE ON dd615_custody_readbacks BEGIN SELECT RAISE(ABORT,'Original custody is immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd615_custody_no_delete
BEFORE DELETE ON dd615_custody_readbacks BEGIN SELECT RAISE(ABORT,'Original custody may not be erased'); END;
CREATE TABLE IF NOT EXISTS dd615_activation_ceremonies (
  ceremony_hash TEXT PRIMARY KEY CHECK (length(ceremony_hash)=64),
  authority_id TEXT NOT NULL REFERENCES dd614_authorities(authority_id),
  custody_receipt_id TEXT NOT NULL REFERENCES dd615_custody_readbacks(receipt_id),
  original_source_sha256 TEXT NOT NULL CHECK (length(original_source_sha256)=64),
  proof_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status='READY_FOR_SEPARATE_CONTROLLED_APPROVAL'),
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS dd615_ceremony_no_update
BEFORE UPDATE ON dd615_activation_ceremonies BEGIN SELECT RAISE(ABORT,'Ceremony receipt is immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd615_ceremony_no_delete
BEFORE DELETE ON dd615_activation_ceremonies BEGIN SELECT RAISE(ABORT,'Ceremony receipt may not be erased'); END;

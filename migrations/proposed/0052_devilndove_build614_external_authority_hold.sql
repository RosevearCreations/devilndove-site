-- PROPOSED ONLY. DO NOT APPLY TO LIVE D1 WITHOUT SEPARATE OWNER AUTHORIZATION,
-- independently verified original authorities and a planned backup/rollback.
-- Initial rows can only be PENDING; this migration enrolls NO trusted authority.
CREATE TABLE IF NOT EXISTS dd614_authorities (
  authority_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('ISSUER','WITNESS','OWNER')),
  public_key TEXT NOT NULL,
  key_sha256 TEXT NOT NULL UNIQUE CHECK (length(key_sha256)=64),
  original_source_ref TEXT NOT NULL,
  independent_review_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_EXTERNAL_VERIFICATION'
    CHECK (status IN ('PENDING_EXTERNAL_VERIFICATION','ACTIVE_EXTERNAL_VERIFIED','REVOKED')),
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ACTIVE_EXTERNAL_VERIFIED is allowed only through a separately witnessed,
-- out-of-band controlled migration AND a matching externally provisioned pin.
CREATE TRIGGER IF NOT EXISTS dd614_authority_no_delete
BEFORE DELETE ON dd614_authorities BEGIN SELECT RAISE(ABORT,'Authority deletion forbidden'); END;
CREATE TABLE IF NOT EXISTS dd614_owner_decisions (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  event_hash TEXT NOT NULL UNIQUE CHECK (length(event_hash)=64),
  previous_hash TEXT NOT NULL UNIQUE CHECK (length(previous_hash)=64),
  case_pin TEXT NOT NULL,
  channel TEXT NOT NULL,
  account_id TEXT NOT NULL,
  product_ref TEXT NOT NULL,
  exact_action TEXT NOT NULL,
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256)=64),
  owner_decision TEXT NOT NULL CHECK (owner_decision IN ('APPROVE','DECLINE','REVOKE')),
  owner_nonce TEXT NOT NULL UNIQUE,
  owner_expires_at TEXT NOT NULL,
  proof_summary_json TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS dd614_decisions_no_update
BEFORE UPDATE ON dd614_owner_decisions BEGIN SELECT RAISE(ABORT,'Decision ledger is append-only'); END;
CREATE TRIGGER IF NOT EXISTS dd614_decisions_no_delete
BEFORE DELETE ON dd614_owner_decisions BEGIN SELECT RAISE(ABORT,'Decision ledger is append-only'); END;

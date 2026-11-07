-- PROPOSED ONLY. Never auto-applied by release, CI or HTTP requests.
-- Original operator must independently approve source D1 0052–0063, backup,
-- Development-first migration and separately authorized Production rollout.
-- No Meta OAuth, connection or publishing tables are changed here.
CREATE TABLE IF NOT EXISTS dd629_original_meta_archive_readbacks (
  readback_sha256 TEXT PRIMARY KEY CHECK(length(readback_sha256)=64),
  custody_sha256 TEXT NOT NULL UNIQUE REFERENCES dd628_original_meta_signed_decision_custody(custody_sha256),
  original_packet_sha256 TEXT NOT NULL CHECK(length(original_packet_sha256)=64),
  primary_custody_ref TEXT NOT NULL,secondary_custody_ref TEXT NOT NULL,
  primary_sha256 TEXT NOT NULL CHECK(length(primary_sha256)=64),
  secondary_sha256 TEXT NOT NULL CHECK(length(secondary_sha256)=64),
  primary_bytes INTEGER NOT NULL CHECK(primary_bytes>0 AND primary_bytes<=16000),
  secondary_bytes INTEGER NOT NULL CHECK(secondary_bytes=primary_bytes),
  status TEXT NOT NULL CHECK(status='TWO_ORIGINAL_INDEPENDENT_HTTPS_ARCHIVES_BYTE_IDENTICAL'),
  verified_by INTEGER NOT NULL,verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd629_original_meta_go_live_decisions (
  decision_sha256 TEXT PRIMARY KEY CHECK(length(decision_sha256)=64),
  custody_sha256 TEXT NOT NULL REFERENCES dd628_original_meta_signed_decision_custody(custody_sha256),
  readback_sha256 TEXT NOT NULL REFERENCES dd629_original_meta_archive_readbacks(readback_sha256),
  original_decision_sha256 TEXT NOT NULL CHECK(length(original_decision_sha256)=64),
  owner_decision TEXT NOT NULL CHECK(owner_decision IN
    ('CERTIFY_ORIGINAL_META_READ_ONLY_CHANNEL_READINESS_NO_ACTIVATION',
     'HOLD_ORIGINAL_META_CHANNEL_READINESS')),
  expires_at TEXT NOT NULL,
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='SIGNED_ORIGINAL_OWNER_READINESS_DECISION_NO_CHANNEL'),
  recorded_by INTEGER NOT NULL,recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- An append-only audit trail: no expiry changes or evidence overwrites.
CREATE TRIGGER IF NOT EXISTS dd629_readback_no_update BEFORE UPDATE ON dd629_original_meta_archive_readbacks
BEGIN SELECT RAISE(ABORT,'Original archive byte readback immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd629_readback_no_delete BEFORE DELETE ON dd629_original_meta_archive_readbacks
BEGIN SELECT RAISE(ABORT,'Original archive byte readback cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd629_owner_decision_no_update BEFORE UPDATE ON dd629_original_meta_go_live_decisions
BEGIN SELECT RAISE(ABORT,'Original signed go-live review decision immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd629_owner_decision_no_delete BEFORE DELETE ON dd629_original_meta_go_live_decisions
BEGIN SELECT RAISE(ABORT,'Original signed go-live review decision cannot be erased'); END;

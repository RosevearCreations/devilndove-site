-- PROPOSED ONLY: NEVER APPLY AUTOMATICALLY TO DEVELOPMENT OR PRODUCTION D1.
-- Requires 0052–0055, independently witnessed backup/restoration, original provider
-- approval and explicit scoped owner TEST authority before any privileged migration.
CREATE TABLE IF NOT EXISTS dd618_original_source_registrations (
  authority_id TEXT PRIMARY KEY REFERENCES dd614_authorities(authority_id),
  provider TEXT NOT NULL CHECK (provider='ETSY'),
  original_source_sha256 TEXT NOT NULL CHECK (length(original_source_sha256)=64),
  original_provider_ref TEXT NOT NULL,
  independent_review_sha256 TEXT NOT NULL CHECK (length(independent_review_sha256)=64),
  status TEXT NOT NULL CHECK (status='INDEPENDENTLY_APPROVED_ORIGINAL_SOURCE'),
  approved_by TEXT NOT NULL,
  approved_at TEXT NOT NULL
);
-- Separate operator populates original source registry; no application approval API.
CREATE TABLE IF NOT EXISTS dd618_original_issuer_attestations (
  attestation_sha256 TEXT PRIMARY KEY CHECK (length(attestation_sha256)=64),
  authority_id TEXT NOT NULL REFERENCES dd614_authorities(authority_id),
  custody_receipt_id TEXT NOT NULL REFERENCES dd615_custody_readbacks(receipt_id),
  checkpoint_sha256 TEXT NOT NULL REFERENCES dd617_external_readbacks(checkpoint_sha256),
  original_source_sha256 TEXT NOT NULL CHECK (length(original_source_sha256)=64),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status='CRYPTO_ATTESTED_PENDING_SEPARATE_ORIGINAL_CUSTODY_DECISION'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd618_backup_witness_packets (
  backup_witness_sha256 TEXT PRIMARY KEY CHECK (length(backup_witness_sha256)=64),
  backup_id TEXT NOT NULL,
  backup_sha256 TEXT NOT NULL CHECK (length(backup_sha256)=64),
  migration_manifest_sha256 TEXT NOT NULL CHECK (length(migration_manifest_sha256)=64),
  checkpoint_sha256 TEXT NOT NULL REFERENCES dd617_external_readbacks(checkpoint_sha256),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status='SIGNED_BACKUP_PENDING_INDEPENDENT_RESTORE_REVIEW'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd618_original_custody_decisions (
  attestation_sha256 TEXT PRIMARY KEY REFERENCES dd618_original_issuer_attestations(attestation_sha256),
  original_decision_sha256 TEXT NOT NULL CHECK (length(original_decision_sha256)=64),
  status TEXT NOT NULL CHECK (status='INDEPENDENT_ORIGINAL_CUSTODY_APPROVED_FOR_ONE_TEST'),
  approved_by TEXT NOT NULL,approved_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dd618_backup_restore_verifications (
  backup_witness_sha256 TEXT PRIMARY KEY REFERENCES dd618_backup_witness_packets(backup_witness_sha256),
  restored_backup_sha256 TEXT NOT NULL CHECK (length(restored_backup_sha256)=64),
  status TEXT NOT NULL CHECK (status='INDEPENDENTLY_RESTORED_AND_WITNESSED'),
  approved_by TEXT NOT NULL,approved_at TEXT NOT NULL
);
-- Neither real original-custody decisions nor restored backup approvals can be
-- created by a normal admin API. Separate operator custody and owner consent required.
CREATE TABLE IF NOT EXISTS dd618_original_test_grants (
  grant_id TEXT PRIMARY KEY,
  preflight_sha256 TEXT NOT NULL REFERENCES dd617_witnessed_test_preflights(preflight_sha256),
  attestation_sha256 TEXT NOT NULL REFERENCES dd618_original_custody_decisions(attestation_sha256),
  backup_witness_sha256 TEXT NOT NULL REFERENCES dd618_backup_restore_verifications(backup_witness_sha256),
  checkpoint_sha256 TEXT NOT NULL REFERENCES dd617_external_readbacks(checkpoint_sha256),
  test_nonce TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK (provider='ETSY'),
  original_approval_sha256 TEXT NOT NULL CHECK (length(original_approval_sha256)=64),
  status TEXT NOT NULL CHECK (status='INDEPENDENTLY_APPROVED_SINGLE_READ_ONLY_GET'),
  approved_by TEXT NOT NULL,approved_at TEXT NOT NULL
);
-- No application endpoint can create a grant; separate original issuer + owner authority required.
CREATE TABLE IF NOT EXISTS dd618_provider_test_attempts (
  test_nonce TEXT PRIMARY KEY REFERENCES dd618_original_test_grants(test_nonce),
  grant_id TEXT NOT NULL REFERENCES dd618_original_test_grants(grant_id),
  status TEXT NOT NULL CHECK (status='CLAIMED_EXACTLY_ONE_GET'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd618_provider_test_outcomes (
  test_nonce TEXT PRIMARY KEY REFERENCES dd618_provider_test_attempts(test_nonce),
  provider_receipt_sha256 TEXT NOT NULL CHECK (length(provider_receipt_sha256)=64),
  remote_subject_id TEXT NOT NULL,
  endpoint TEXT NOT NULL CHECK (endpoint='GET /v3/application/users/me'),
  status TEXT NOT NULL CHECK (status='ETSY_IDENTITY_GET_VERIFIED_PENDING_WITNESS_ACCEPTANCE'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dd618_provider_test_acceptances (
  acceptance_sha256 TEXT PRIMARY KEY CHECK (length(acceptance_sha256)=64),
  test_nonce TEXT NOT NULL UNIQUE REFERENCES dd618_provider_test_outcomes(test_nonce),
  signed_bundle_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status='EXACT_GENUINE_ETSY_GET_WITNESSED_NO_PUBLICATION'),
  created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS dd618_source_no_update BEFORE UPDATE ON dd618_original_source_registrations
BEGIN SELECT RAISE(ABORT,'Original issuer source enrollment immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd618_source_no_delete BEFORE DELETE ON dd618_original_source_registrations
BEGIN SELECT RAISE(ABORT,'Original issuer source cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd618_attestation_no_update BEFORE UPDATE ON dd618_original_issuer_attestations
BEGIN SELECT RAISE(ABORT,'Signed issuer attestation immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd618_attestation_no_delete BEFORE DELETE ON dd618_original_issuer_attestations
BEGIN SELECT RAISE(ABORT,'Signed issuer attestation cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd618_backup_no_update BEFORE UPDATE ON dd618_backup_witness_packets
BEGIN SELECT RAISE(ABORT,'Witnessed backup packet immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd618_backup_no_delete BEFORE DELETE ON dd618_backup_witness_packets
BEGIN SELECT RAISE(ABORT,'Witnessed backup packet cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd618_original_decision_no_update BEFORE UPDATE ON dd618_original_custody_decisions
BEGIN SELECT RAISE(ABORT,'Original issuer custody decision immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd618_original_decision_no_delete BEFORE DELETE ON dd618_original_custody_decisions
BEGIN SELECT RAISE(ABORT,'Original issuer custody decision cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd618_restore_no_update BEFORE UPDATE ON dd618_backup_restore_verifications
BEGIN SELECT RAISE(ABORT,'Independently restored backup verification immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd618_restore_no_delete BEFORE DELETE ON dd618_backup_restore_verifications
BEGIN SELECT RAISE(ABORT,'Independently restored backup verification cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd618_grant_no_update BEFORE UPDATE ON dd618_original_test_grants
BEGIN SELECT RAISE(ABORT,'Original owner TEST grant immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd618_grant_no_delete BEFORE DELETE ON dd618_original_test_grants
BEGIN SELECT RAISE(ABORT,'Original owner TEST grant cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd618_attempt_no_update BEFORE UPDATE ON dd618_provider_test_attempts
BEGIN SELECT RAISE(ABORT,'Single-use TEST attempt immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd618_attempt_no_delete BEFORE DELETE ON dd618_provider_test_attempts
BEGIN SELECT RAISE(ABORT,'Single-use TEST attempt cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd618_outcome_no_update BEFORE UPDATE ON dd618_provider_test_outcomes
BEGIN SELECT RAISE(ABORT,'Provider TEST outcome immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd618_outcome_no_delete BEFORE DELETE ON dd618_provider_test_outcomes
BEGIN SELECT RAISE(ABORT,'Provider TEST outcome cannot be erased'); END;
CREATE TRIGGER IF NOT EXISTS dd618_accept_no_update BEFORE UPDATE ON dd618_provider_test_acceptances
BEGIN SELECT RAISE(ABORT,'Witnessed TEST acceptance immutable'); END;
CREATE TRIGGER IF NOT EXISTS dd618_accept_no_delete BEFORE DELETE ON dd618_provider_test_acceptances
BEGIN SELECT RAISE(ABORT,'Witnessed TEST acceptance cannot be erased'); END;

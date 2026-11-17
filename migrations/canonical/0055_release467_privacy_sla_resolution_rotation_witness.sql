-- Build 733: original-source, immutable SLA closure and independent ciphertext lineage witness.
-- No remote compliance or cryptographic plaintext verification is manufactured.
CREATE TABLE IF NOT EXISTS dnd_privacy_sla_reviews_733 (
 review_id TEXT PRIMARY KEY CHECK(length(review_id)=36),
 event_id TEXT NOT NULL REFERENCES dnd_withdrawal_outbox_728(event_id) ON DELETE RESTRICT,
 receipt_source TEXT NOT NULL CHECK(receipt_source IN ('ADMIN_SIGNED_728','WORKER_SIGNED_730')),
 signed_receipt_sha256 TEXT NOT NULL CHECK(length(signed_receipt_sha256)=64),
 requested_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 reason_code TEXT NOT NULL CHECK(length(reason_code) BETWEEN 4 AND 80),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS trg_dnd_sla_review_source_733 BEFORE INSERT ON dnd_privacy_sla_reviews_733
 WHEN NOT EXISTS (
 SELECT 1 FROM dnd_withdrawal_outbox_728 w
 JOIN media_consent_records m ON m.consent_record_id=w.consent_record_id
 WHERE w.event_id=NEW.event_id AND m.consent_status IN ('revoked','blocked') AND (
 (NEW.receipt_source='ADMIN_SIGNED_728' AND EXISTS (
 SELECT 1 FROM dnd_withdrawal_acks_728 a WHERE a.event_id=w.event_id
 AND a.peer_app=w.target_app AND a.peer_signature_verified=1
 AND a.observed_live_response=1 AND a.ack_envelope_sha256=NEW.signed_receipt_sha256))
 OR
 (NEW.receipt_source='WORKER_SIGNED_730' AND EXISTS (
 SELECT 1 FROM dnd_withdrawal_auto_acks_730 a WHERE a.event_id=w.event_id
 AND a.peer_app=w.target_app AND a.peer_signature_verified=1
 AND a.observed_live_response=1 AND a.ack_envelope_sha256=NEW.signed_receipt_sha256))
 ))
 BEGIN SELECT RAISE(ABORT,'original_signed_withdrawal_ack_required'); END;
CREATE TABLE IF NOT EXISTS dnd_privacy_sla_resolutions_733 (
 resolution_id TEXT PRIMARY KEY CHECK(length(resolution_id)=36),
 review_id TEXT NOT NULL UNIQUE REFERENCES dnd_privacy_sla_reviews_733(review_id) ON DELETE RESTRICT,
 event_id TEXT NOT NULL UNIQUE REFERENCES dnd_withdrawal_outbox_728(event_id) ON DELETE RESTRICT,
 approved_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 reason_code TEXT NOT NULL CHECK(length(reason_code) BETWEEN 4 AND 80),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS trg_dnd_sla_resolve_proof_733 BEFORE INSERT ON dnd_privacy_sla_resolutions_733
 WHEN NOT EXISTS (
 SELECT 1 FROM dnd_privacy_sla_reviews_733 r
 JOIN dnd_withdrawal_outbox_728 w ON w.event_id=r.event_id
 JOIN media_consent_records m ON m.consent_record_id=w.consent_record_id
 WHERE r.review_id=NEW.review_id AND r.event_id=NEW.event_id
 AND r.requested_by_user_id<>NEW.approved_by_user_id
 AND r.reason_code=NEW.reason_code AND m.consent_status IN ('revoked','blocked')
 AND (
 (r.receipt_source='ADMIN_SIGNED_728' AND EXISTS
 (SELECT 1 FROM dnd_withdrawal_acks_728 a WHERE a.event_id=w.event_id
  AND a.peer_app=w.target_app AND a.ack_envelope_sha256=r.signed_receipt_sha256
  AND a.peer_signature_verified=1 AND a.observed_live_response=1))
 OR
 (r.receipt_source='WORKER_SIGNED_730' AND EXISTS
 (SELECT 1 FROM dnd_withdrawal_auto_acks_730 a WHERE a.event_id=w.event_id
  AND a.peer_app=w.target_app AND a.ack_envelope_sha256=r.signed_receipt_sha256
  AND a.peer_signature_verified=1 AND a.observed_live_response=1))
 ))
 BEGIN SELECT RAISE(ABORT,'separate_admin_and_current_signed_ack_required'); END;
CREATE TABLE IF NOT EXISTS dnd_privacy_rotation_witnesses_733 (
 witness_id TEXT PRIMARY KEY CHECK(length(witness_id)=36),
 evidence_id TEXT NOT NULL REFERENCES dnd_evidence_vault_728(evidence_id) ON DELETE RESTRICT,
 source_version INTEGER NOT NULL CHECK(source_version BETWEEN 1 AND 998),
 target_version INTEGER NOT NULL CHECK(target_version BETWEEN 2 AND 999 AND target_version>source_version),
 source_ciphertext_sha256 TEXT NOT NULL CHECK(length(source_ciphertext_sha256)=64),
 target_ciphertext_sha256 TEXT NOT NULL CHECK(length(target_ciphertext_sha256)=64),
 requested_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 witnessed_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 reason_code TEXT NOT NULL CHECK(length(reason_code) BETWEEN 4 AND 80),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(evidence_id,target_version),
 CHECK(requested_by_user_id<>witnessed_by_user_id),
 CHECK(source_ciphertext_sha256<>target_ciphertext_sha256)
);
CREATE TRIGGER IF NOT EXISTS trg_dnd_rotation_lineage_733 BEFORE INSERT ON dnd_privacy_rotation_witnesses_733
 WHEN NOT EXISTS (
 SELECT 1 FROM dnd_evidence_versions_728 old
 JOIN dnd_evidence_versions_728 newer ON newer.evidence_id=old.evidence_id
 JOIN dnd_evidence_vault_728 v ON v.evidence_id=old.evidence_id
 WHERE old.evidence_id=NEW.evidence_id
 AND old.version=NEW.source_version AND newer.version=NEW.target_version
 AND newer.version=old.version+1
 AND old.ciphertext_sha256=NEW.source_ciphertext_sha256
 AND newer.ciphertext_sha256=NEW.target_ciphertext_sha256
 AND newer.previous_version_sha256=old.ciphertext_sha256
 AND newer.key_id<>old.key_id
 AND newer.version=(SELECT MAX(x.version) FROM dnd_evidence_versions_728 x
 WHERE x.evidence_id=old.evidence_id))
 BEGIN SELECT RAISE(ABORT,'original_ciphertext_rotation_lineage_required'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_sla_review_immutable_733 BEFORE UPDATE ON dnd_privacy_sla_reviews_733
 BEGIN SELECT RAISE(ABORT,'immutable_sla_review'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_sla_review_no_delete_733 BEFORE DELETE ON dnd_privacy_sla_reviews_733
 BEGIN SELECT RAISE(ABORT,'immutable_sla_review'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_sla_resolution_immutable_733 BEFORE UPDATE ON dnd_privacy_sla_resolutions_733
 BEGIN SELECT RAISE(ABORT,'immutable_sla_resolution'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_sla_resolution_no_delete_733 BEFORE DELETE ON dnd_privacy_sla_resolutions_733
 BEGIN SELECT RAISE(ABORT,'immutable_sla_resolution'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_rotation_witness_immutable_733 BEFORE UPDATE ON dnd_privacy_rotation_witnesses_733
 BEGIN SELECT RAISE(ABORT,'immutable_rotation_witness'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_rotation_witness_no_delete_733 BEFORE DELETE ON dnd_privacy_rotation_witnesses_733
 BEGIN SELECT RAISE(ABORT,'immutable_rotation_witness'); END;
CREATE INDEX IF NOT EXISTS idx_dnd_sla_reviews_event_733 ON dnd_privacy_sla_reviews_733(event_id,created_at);
CREATE INDEX IF NOT EXISTS idx_dnd_rotation_witness_event_733 ON dnd_privacy_rotation_witnesses_733(evidence_id,target_version);

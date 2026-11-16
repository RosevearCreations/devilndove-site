-- Build 728: production-owned private D1 evidence vault, source-only withdrawal outbox and supervised retention.
-- No plaintext, encryption keys, payment tokens or raw customer/media content in metadata or receiver queue.
CREATE TABLE IF NOT EXISTS dnd_evidence_vault_728 (
 evidence_id TEXT PRIMARY KEY CHECK(length(evidence_id)=36),
 tenant_scope_sha256 TEXT NOT NULL CHECK(length(tenant_scope_sha256)=64),
 purpose TEXT NOT NULL CHECK(purpose IN ('consent_withdrawal','security_evidence','retention_review')),
 retention_days INTEGER NOT NULL CHECK(retention_days BETWEEN 1 AND 3650),
 legal_hold INTEGER NOT NULL DEFAULT 0 CHECK(legal_hold IN (0,1)),
 request_key_sha256 TEXT NOT NULL UNIQUE CHECK(length(request_key_sha256)=64),
 created_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dnd_evidence_versions_728 (
 evidence_id TEXT NOT NULL REFERENCES dnd_evidence_vault_728(evidence_id) ON DELETE RESTRICT,
 version INTEGER NOT NULL CHECK(version BETWEEN 1 AND 999),
 key_id TEXT NOT NULL CHECK(length(key_id) BETWEEN 6 AND 64),
 iv_b64url TEXT NOT NULL CHECK(length(iv_b64url)=16),
 ciphertext_b64url TEXT NOT NULL CHECK(length(ciphertext_b64url) BETWEEN 24 AND 8192),
 ciphertext_sha256 TEXT NOT NULL CHECK(length(ciphertext_sha256)=64),
 previous_version_sha256 TEXT CHECK(previous_version_sha256 IS NULL OR length(previous_version_sha256)=64),
 created_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(evidence_id,version)
);
CREATE INDEX IF NOT EXISTS idx_dnd_evidence_versions_key_728 ON dnd_evidence_versions_728(key_id,evidence_id,version);
CREATE TRIGGER IF NOT EXISTS trg_dnd_evidence_vault_no_update_728 BEFORE UPDATE ON dnd_evidence_vault_728 BEGIN SELECT RAISE(ABORT,'immutable_evidence_identity'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_evidence_vault_no_delete_728 BEFORE DELETE ON dnd_evidence_vault_728 BEGIN SELECT RAISE(ABORT,'no_blind_evidence_delete'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_evidence_versions_no_update_728 BEFORE UPDATE ON dnd_evidence_versions_728 BEGIN SELECT RAISE(ABORT,'immutable_ciphertext_version'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_evidence_versions_no_delete_728 BEFORE DELETE ON dnd_evidence_versions_728
WHEN NOT EXISTS (SELECT 1 FROM dnd_evidence_purge_receipts_728 WHERE evidence_id=OLD.evidence_id)
 BEGIN SELECT RAISE(ABORT,'independent_purge_approval_required'); END;
CREATE TABLE IF NOT EXISTS dnd_withdrawal_outbox_728 (
 event_id TEXT PRIMARY KEY CHECK(length(event_id)=36),
 consent_record_id INTEGER NOT NULL REFERENCES media_consent_records(consent_record_id) ON DELETE RESTRICT,
 target_app TEXT NOT NULL CHECK(target_app IN ('ai-data-platform','rosevear-ai-hub','rosevear-comms-hub')),
 scope_hmac_sha256 TEXT NOT NULL CHECK(length(scope_hmac_sha256)=64),
 request_nonce TEXT NOT NULL UNIQUE CHECK(length(request_nonce)=32),
 created_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(consent_record_id,target_app)
);
CREATE TABLE IF NOT EXISTS dnd_withdrawal_acks_728 (
 event_id TEXT PRIMARY KEY REFERENCES dnd_withdrawal_outbox_728(event_id) ON DELETE RESTRICT,
 peer_app TEXT NOT NULL CHECK(peer_app IN ('ai-data-platform','rosevear-ai-hub','rosevear-comms-hub')),
 ack_envelope_sha256 TEXT NOT NULL CHECK(length(ack_envelope_sha256)=64),
 peer_signature_verified INTEGER NOT NULL CHECK(peer_signature_verified=1),
 observed_live_response INTEGER NOT NULL CHECK(observed_live_response=1),
 created_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS trg_dnd_withdrawal_outbox_no_update_728 BEFORE UPDATE ON dnd_withdrawal_outbox_728 BEGIN SELECT RAISE(ABORT,'immutable_withdrawal_event'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_withdrawal_outbox_no_delete_728 BEFORE DELETE ON dnd_withdrawal_outbox_728 BEGIN SELECT RAISE(ABORT,'immutable_withdrawal_event'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_withdrawal_ack_no_update_728 BEFORE UPDATE ON dnd_withdrawal_acks_728 BEGIN SELECT RAISE(ABORT,'immutable_verified_ack'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_withdrawal_ack_no_delete_728 BEFORE DELETE ON dnd_withdrawal_acks_728 BEGIN SELECT RAISE(ABORT,'immutable_verified_ack'); END;
CREATE TABLE IF NOT EXISTS dnd_evidence_retention_reviews_728 (
 review_id TEXT PRIMARY KEY CHECK(length(review_id)=36),
 evidence_id TEXT NOT NULL UNIQUE REFERENCES dnd_evidence_vault_728(evidence_id) ON DELETE RESTRICT,
 source_ciphertext_sha256 TEXT NOT NULL CHECK(length(source_ciphertext_sha256)=64),
 requested_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 approved_by_user_id INTEGER REFERENCES users(user_id) ON DELETE RESTRICT,
 review_state TEXT NOT NULL DEFAULT 'PENDING' CHECK(review_state IN ('PENDING','APPROVED')),
 requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 approved_at TEXT,
 CHECK((review_state='PENDING' AND approved_by_user_id IS NULL AND approved_at IS NULL)
 OR (review_state='APPROVED' AND approved_by_user_id IS NOT NULL AND approved_at IS NOT NULL AND approved_by_user_id<>requested_by_user_id))
);
CREATE TRIGGER IF NOT EXISTS trg_dnd_retention_no_rewrite_728 BEFORE UPDATE ON dnd_evidence_retention_reviews_728
WHEN OLD.review_state<>'PENDING' OR NEW.review_state<>'APPROVED' OR NEW.review_id<>OLD.review_id
 OR NEW.evidence_id<>OLD.evidence_id OR NEW.source_ciphertext_sha256<>OLD.source_ciphertext_sha256
 OR NEW.requested_by_user_id<>OLD.requested_by_user_id
 BEGIN SELECT RAISE(ABORT,'retention_review_is_not_rewritable'); END;
CREATE TABLE IF NOT EXISTS dnd_evidence_purge_receipts_728 (
 evidence_id TEXT PRIMARY KEY REFERENCES dnd_evidence_vault_728(evidence_id) ON DELETE RESTRICT,
 review_id TEXT NOT NULL UNIQUE REFERENCES dnd_evidence_retention_reviews_728(review_id) ON DELETE RESTRICT,
 deleted_ciphertext_sha256 TEXT NOT NULL CHECK(length(deleted_ciphertext_sha256)=64),
 executed_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS trg_dnd_purge_receipt_validation_728 BEFORE INSERT ON dnd_evidence_purge_receipts_728
WHEN NOT EXISTS (SELECT 1 FROM dnd_evidence_retention_reviews_728 r
 WHERE r.review_id=NEW.review_id AND r.evidence_id=NEW.evidence_id AND r.review_state='APPROVED'
 AND r.source_ciphertext_sha256=NEW.deleted_ciphertext_sha256
 AND r.requested_by_user_id<>r.approved_by_user_id AND r.approved_by_user_id<>NEW.executed_by_user_id)
 OR EXISTS (SELECT 1 FROM dnd_evidence_vault_728 v WHERE v.evidence_id=NEW.evidence_id
 AND (v.legal_hold=1 OR datetime(v.created_at,'+'||v.retention_days||' days')>datetime('now')))
 BEGIN SELECT RAISE(ABORT,'supervised_purge_evidence_or_retention_failed'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_purge_receipt_no_update_728 BEFORE UPDATE ON dnd_evidence_purge_receipts_728 BEGIN SELECT RAISE(ABORT,'immutable_purge_receipt'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_purge_receipt_no_delete_728 BEFORE DELETE ON dnd_evidence_purge_receipts_728 BEGIN SELECT RAISE(ABORT,'immutable_purge_receipt'); END;

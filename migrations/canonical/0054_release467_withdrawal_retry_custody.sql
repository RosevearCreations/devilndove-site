-- Build 730 forward-only, owner-scoped durable withdrawal retry custody.
-- Never equate an attempted delivery with an authenticated peer ACK.
CREATE TABLE IF NOT EXISTS dnd_withdrawal_retry_state_730 (
 event_id TEXT PRIMARY KEY REFERENCES dnd_withdrawal_outbox_728(event_id) ON DELETE RESTRICT,
 attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 6),
 retry_cycle INTEGER NOT NULL DEFAULT 0 CHECK(retry_cycle BETWEEN 0 AND 99),
 retry_after TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 lease_token TEXT CHECK(lease_token IS NULL OR length(lease_token)=36),
 lease_expires_at TEXT,
 state TEXT NOT NULL DEFAULT 'READY' CHECK(state IN ('READY','LEASED','DEAD_LETTER','ACKED','HOLD')),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK((state='LEASED' AND lease_token IS NOT NULL AND lease_expires_at IS NOT NULL)
 OR (state<>'LEASED' AND lease_token IS NULL AND lease_expires_at IS NULL)),
 CHECK(state<>'DEAD_LETTER' OR attempt_count=6)
);
CREATE INDEX IF NOT EXISTS idx_dnd_withdrawal_retry_due_730 ON dnd_withdrawal_retry_state_730(state,retry_after);
CREATE TABLE IF NOT EXISTS dnd_withdrawal_attempts_730 (
 attempt_id TEXT PRIMARY KEY CHECK(length(attempt_id)=36),
 event_id TEXT NOT NULL REFERENCES dnd_withdrawal_outbox_728(event_id) ON DELETE RESTRICT,
 lease_token TEXT NOT NULL CHECK(length(lease_token)=36),
 attempt_number INTEGER NOT NULL CHECK(attempt_number BETWEEN 1 AND 6),
 retry_cycle INTEGER NOT NULL DEFAULT 0 CHECK(retry_cycle BETWEEN 0 AND 99),
 outcome TEXT NOT NULL CHECK(outcome IN ('SIGNED_ACK_VERIFIED','UNAVAILABLE','INVALID_ACK','EXPIRED_PEER_PROOF','TRANSPORT_HOLD','SCHEMA_HOLD')),
 outcome_sha256 TEXT CHECK(outcome_sha256 IS NULL OR length(outcome_sha256)=64),
 recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(event_id,retry_cycle,attempt_number)
);
CREATE TRIGGER IF NOT EXISTS trg_dnd_withdrawal_attempt_lease_730 BEFORE INSERT ON dnd_withdrawal_attempts_730
 WHEN NOT EXISTS (SELECT 1 FROM dnd_withdrawal_retry_state_730 s
 WHERE s.event_id=NEW.event_id AND s.state='LEASED'
 AND s.lease_token=NEW.lease_token AND s.attempt_count+1=NEW.attempt_number
 AND s.retry_cycle=NEW.retry_cycle
 AND s.lease_expires_at>datetime('now'))
 BEGIN SELECT RAISE(ABORT,'current_live_retry_lease_required'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_withdrawal_attempts_no_update_730 BEFORE UPDATE ON dnd_withdrawal_attempts_730
 BEGIN SELECT RAISE(ABORT,'immutable_retry_attempt'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_withdrawal_attempts_no_delete_730 BEFORE DELETE ON dnd_withdrawal_attempts_730
 BEGIN SELECT RAISE(ABORT,'immutable_retry_attempt'); END;
CREATE TABLE IF NOT EXISTS dnd_dead_letter_recovery_730 (
 recovery_id TEXT PRIMARY KEY CHECK(length(recovery_id)=36),
 event_id TEXT NOT NULL REFERENCES dnd_withdrawal_outbox_728(event_id) ON DELETE RESTRICT,
 decision TEXT NOT NULL CHECK(decision IN ('REVIEW_HOLD','ESCALATED','REQUEUE_REQUESTED')),
 target_cycle INTEGER NOT NULL DEFAULT 0 CHECK(target_cycle BETWEEN 0 AND 99),
 original_review_id TEXT REFERENCES dnd_dead_letter_recovery_730(recovery_id) ON DELETE RESTRICT,
 requested_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 approved_by_user_id INTEGER REFERENCES users(user_id) ON DELETE RESTRICT,
 reason_code TEXT NOT NULL CHECK(length(reason_code) BETWEEN 4 AND 80),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(decision<>'REQUEUE_REQUESTED' OR
   (approved_by_user_id IS NOT NULL AND approved_by_user_id<>requested_by_user_id AND original_review_id IS NOT NULL))
);
CREATE TRIGGER IF NOT EXISTS trg_dnd_dead_letter_recovery_no_update_730 BEFORE UPDATE ON dnd_dead_letter_recovery_730
 BEGIN SELECT RAISE(ABORT,'immutable_dead_letter_recovery'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_dead_letter_recovery_no_delete_730 BEFORE DELETE ON dnd_dead_letter_recovery_730
 BEGIN SELECT RAISE(ABORT,'immutable_dead_letter_recovery'); END;
-- One reviewed recovery is specific to one cycle; original attempts never reset or disappear.
CREATE UNIQUE INDEX IF NOT EXISTS idx_dnd_one_requeue_per_cycle_730
 ON dnd_dead_letter_recovery_730(event_id,target_cycle) WHERE decision='REQUEUE_REQUESTED';
CREATE TRIGGER IF NOT EXISTS trg_dnd_retry_requeue_730 BEFORE UPDATE ON dnd_withdrawal_retry_state_730
 WHEN OLD.state='DEAD_LETTER' AND
  (NEW.state<>'READY' OR NEW.retry_cycle<>OLD.retry_cycle+1 OR NEW.attempt_count<>0 OR
   NOT EXISTS (SELECT 1 FROM dnd_dead_letter_recovery_730 d
     WHERE d.event_id=OLD.event_id AND d.target_cycle=NEW.retry_cycle
       AND d.decision='REQUEUE_REQUESTED' AND d.requested_by_user_id<>d.approved_by_user_id))
 BEGIN SELECT RAISE(ABORT,'independent_requeue_approval_required'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_dead_letter_provenance_730 BEFORE INSERT ON dnd_dead_letter_recovery_730
 WHEN NEW.decision='REQUEUE_REQUESTED' AND NOT EXISTS (
 SELECT 1 FROM dnd_dead_letter_recovery_730 original
 WHERE original.recovery_id=NEW.original_review_id
 AND original.event_id=NEW.event_id AND original.target_cycle=NEW.target_cycle
 AND original.decision='REVIEW_HOLD' AND original.requested_by_user_id=NEW.requested_by_user_id
 AND original.approved_by_user_id IS NULL)
 BEGIN SELECT RAISE(ABORT,'original_independent_recovery_review_required'); END;
-- Automated receipts are explicitly service-authored; never masquerade as an original Administrator.
CREATE TABLE IF NOT EXISTS dnd_withdrawal_auto_acks_730 (
 event_id TEXT PRIMARY KEY REFERENCES dnd_withdrawal_outbox_728(event_id) ON DELETE RESTRICT,
 peer_app TEXT NOT NULL CHECK(peer_app IN ('ai-data-platform','rosevear-ai-hub','rosevear-comms-hub')),
 ack_envelope_sha256 TEXT NOT NULL CHECK(length(ack_envelope_sha256)=64),
 peer_signature_verified INTEGER NOT NULL CHECK(peer_signature_verified=1),
 observed_live_response INTEGER NOT NULL CHECK(observed_live_response=1),
 service_id TEXT NOT NULL CHECK(length(service_id) BETWEEN 12 AND 80),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS trg_dnd_auto_ack_scope_730 BEFORE INSERT ON dnd_withdrawal_auto_acks_730
 WHEN NOT EXISTS(SELECT 1 FROM dnd_withdrawal_outbox_728 w WHERE w.event_id=NEW.event_id
 AND w.target_app=NEW.peer_app)
 BEGIN SELECT RAISE(ABORT,'automatic_signed_ack_receiver_mismatch'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_auto_ack_no_update_730 BEFORE UPDATE ON dnd_withdrawal_auto_acks_730
 BEGIN SELECT RAISE(ABORT,'immutable_automatic_signed_ack'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_auto_ack_no_delete_730 BEFORE DELETE ON dnd_withdrawal_auto_acks_730
 BEGIN SELECT RAISE(ABORT,'immutable_automatic_signed_ack'); END;
CREATE TABLE IF NOT EXISTS dnd_privacy_schedule_receipts_730 (
 tick_id TEXT PRIMARY KEY CHECK(length(tick_id)=36),
 service_id TEXT NOT NULL CHECK(length(service_id) BETWEEN 12 AND 80),
 tick_state TEXT NOT NULL CHECK(tick_state IN ('RUN','HOLD','ERROR')),
 considered_events INTEGER NOT NULL CHECK(considered_events BETWEEN 0 AND 100),
 signed_ack_count INTEGER NOT NULL CHECK(signed_ack_count BETWEEN 0 AND 100),
 held_events INTEGER NOT NULL CHECK(held_events BETWEEN 0 AND 100),
 rotation_backlog INTEGER NOT NULL CHECK(rotation_backlog BETWEEN 0 AND 1000000),
 reason_code TEXT NOT NULL CHECK(length(reason_code) BETWEEN 2 AND 80),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS trg_dnd_privacy_schedule_no_update_730 BEFORE UPDATE ON dnd_privacy_schedule_receipts_730
 BEGIN SELECT RAISE(ABORT,'immutable_scheduler_run_receipt'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_privacy_schedule_no_delete_730 BEFORE DELETE ON dnd_privacy_schedule_receipts_730
 BEGIN SELECT RAISE(ABORT,'immutable_scheduler_run_receipt'); END;

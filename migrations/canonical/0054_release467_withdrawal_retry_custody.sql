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
 requested_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 approved_by_user_id INTEGER REFERENCES users(user_id) ON DELETE RESTRICT,
 reason_code TEXT NOT NULL CHECK(length(reason_code) BETWEEN 4 AND 80),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(decision<>'REQUEUE_REQUESTED' OR
   (approved_by_user_id IS NOT NULL AND approved_by_user_id<>requested_by_user_id))
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

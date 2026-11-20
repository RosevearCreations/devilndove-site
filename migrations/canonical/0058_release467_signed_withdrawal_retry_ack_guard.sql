-- Build 741: forward-only atomic dead-letter requeue guards.
-- Requeue cannot proceed when a genuine original Admin OR signed Worker ACK already exists.
-- The insert trigger is evaluated inside original D1 db.batch transaction; any later conflict
-- rolls back the approval and prevents a phantom or duplicate approved recovery record.
CREATE TRIGGER IF NOT EXISTS trg_dnd_requeue_requires_no_ack_741
 BEFORE INSERT ON dnd_dead_letter_recovery_730
 WHEN NEW.decision='REQUEUE_REQUESTED' AND NOT EXISTS (
   SELECT 1 FROM dnd_withdrawal_retry_state_730 s
   JOIN dnd_withdrawal_outbox_728 w ON w.event_id=s.event_id
   JOIN media_consent_records m ON m.consent_record_id=w.consent_record_id
   WHERE s.event_id=NEW.event_id AND s.state='DEAD_LETTER' AND s.attempt_count=6
     AND s.retry_cycle+1=NEW.target_cycle AND m.consent_status IN ('revoked','blocked')
     AND NOT EXISTS (SELECT 1 FROM dnd_withdrawal_acks_728 a WHERE a.event_id=s.event_id)
     AND NOT EXISTS (SELECT 1 FROM dnd_withdrawal_auto_acks_730 a WHERE a.event_id=s.event_id)
 ) BEGIN SELECT RAISE(ABORT,'build741_ack_or_dead_letter_state_changed'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_retry_requeue_no_ack_741
 BEFORE UPDATE ON dnd_withdrawal_retry_state_730
 WHEN OLD.state='DEAD_LETTER' AND
  (NEW.state='READY' AND
   (EXISTS (SELECT 1 FROM dnd_withdrawal_acks_728 a WHERE a.event_id=OLD.event_id)
    OR EXISTS (SELECT 1 FROM dnd_withdrawal_auto_acks_730 a WHERE a.event_id=OLD.event_id)))
 BEGIN SELECT RAISE(ABORT,'build741_already_signed_ack_must_not_requeue'); END;

-- Build 736: owner-consented single-recipient Resend recovery inbox acceptance pilot.
-- Original D1 stores hashes only: never a reset bearer, plaintext code, email, Resend ID or secret.
CREATE TABLE IF NOT EXISTS dnd_recovery_inbox_pilots_736 (
 pilot_id TEXT PRIMARY KEY CHECK(length(pilot_id)=36),
 admin_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 recipient_sha256 TEXT NOT NULL CHECK(length(recipient_sha256)=64),
 code_sha256 TEXT NOT NULL UNIQUE CHECK(length(code_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 expires_at TEXT NOT NULL CHECK(expires_at>created_at),
 provider_accepted_at TEXT,
 provider_message_sha256 TEXT CHECK(provider_message_sha256 IS NULL OR length(provider_message_sha256)=64),
 inbox_confirmed_at TEXT,
 invalidated_at TEXT,
 failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK(failed_attempts BETWEEN 0 AND 5),
 CHECK((provider_accepted_at IS NULL AND provider_message_sha256 IS NULL) OR
       (provider_accepted_at IS NOT NULL AND provider_message_sha256 IS NOT NULL)),
 CHECK(inbox_confirmed_at IS NULL OR provider_accepted_at IS NOT NULL),
 CHECK(inbox_confirmed_at IS NULL OR invalidated_at IS NULL)
);
CREATE INDEX IF NOT EXISTS idx_dnd_recovery_pilots_admin_736
 ON dnd_recovery_inbox_pilots_736(admin_user_id,created_at);
CREATE TRIGGER IF NOT EXISTS trg_dnd_recovery_pilots_immutable_identity_736
 BEFORE UPDATE ON dnd_recovery_inbox_pilots_736
 WHEN NEW.pilot_id<>OLD.pilot_id OR NEW.admin_user_id<>OLD.admin_user_id OR
  NEW.recipient_sha256<>OLD.recipient_sha256 OR NEW.code_sha256<>OLD.code_sha256 OR
  NEW.created_at<>OLD.created_at OR NEW.expires_at<>OLD.expires_at OR
  (OLD.provider_accepted_at IS NOT NULL AND NEW.provider_accepted_at<>OLD.provider_accepted_at) OR
  (OLD.provider_message_sha256 IS NOT NULL AND NEW.provider_message_sha256<>OLD.provider_message_sha256) OR
  (OLD.inbox_confirmed_at IS NOT NULL AND NEW.inbox_confirmed_at<>OLD.inbox_confirmed_at) OR
  (OLD.invalidated_at IS NOT NULL AND NEW.invalidated_at<>OLD.invalidated_at) OR
  NEW.failed_attempts<OLD.failed_attempts
 BEGIN SELECT RAISE(ABORT,'immutable_original_recovery_inbox_custody'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_recovery_pilots_no_delete_736
 BEFORE DELETE ON dnd_recovery_inbox_pilots_736
 BEGIN SELECT RAISE(ABORT,'recovery_inbox_pilot_no_delete'); END;

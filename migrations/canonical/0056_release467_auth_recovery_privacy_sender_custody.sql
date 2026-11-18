-- Build 734: one-time password recovery tokens and non-PII D1 abuse receipts.
-- Raw bearer reset tokens are NEVER stored. Never send tokens to an alternate contact email.
CREATE TABLE IF NOT EXISTS dnd_password_reset_tokens_734 (
 reset_id TEXT PRIMARY KEY CHECK(length(reset_id)=36),
 user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 token_sha256 TEXT NOT NULL UNIQUE CHECK(length(token_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 expires_at TEXT NOT NULL CHECK(expires_at>created_at),
 sent_at TEXT,
 consumed_at TEXT,
 claim_id TEXT UNIQUE CHECK(claim_id IS NULL OR length(claim_id)=36),
 CHECK((consumed_at IS NULL AND claim_id IS NULL) OR
       (consumed_at IS NOT NULL AND claim_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_dnd_reset_user_734 ON dnd_password_reset_tokens_734(user_id,created_at);
CREATE TRIGGER IF NOT EXISTS trg_dnd_reset_no_delete_734 BEFORE DELETE ON dnd_password_reset_tokens_734
 BEGIN SELECT RAISE(ABORT,'reset_custody_no_delete'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_reset_no_rewrite_734 BEFORE UPDATE ON dnd_password_reset_tokens_734
 WHEN NEW.reset_id<>OLD.reset_id OR NEW.user_id<>OLD.user_id OR NEW.token_sha256<>OLD.token_sha256 OR
 NEW.created_at<>OLD.created_at OR NEW.expires_at<>OLD.expires_at OR
 (OLD.consumed_at IS NOT NULL AND (NEW.consumed_at<>OLD.consumed_at OR NEW.claim_id<>OLD.claim_id)) OR
 (OLD.sent_at IS NOT NULL AND NEW.sent_at<>OLD.sent_at)
 BEGIN SELECT RAISE(ABORT,'reset_secret_custody_immutable'); END;
CREATE TABLE IF NOT EXISTS dnd_auth_recovery_attempts_734 (
 attempt_id TEXT PRIMARY KEY CHECK(length(attempt_id)=36),
 action TEXT NOT NULL CHECK(action IN ('reset_request','account_reminder','reset_redeem')),
 identity_sha256 TEXT NOT NULL CHECK(length(identity_sha256)=64),
 ip_sha256 TEXT NOT NULL CHECK(length(ip_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dnd_auth_recovery_rate_identity_734 ON
 dnd_auth_recovery_attempts_734(action,identity_sha256,created_at);
CREATE INDEX IF NOT EXISTS idx_dnd_auth_recovery_rate_ip_734 ON
 dnd_auth_recovery_attempts_734(action,ip_sha256,created_at);
CREATE TRIGGER IF NOT EXISTS trg_dnd_auth_recovery_no_update_734 BEFORE UPDATE ON dnd_auth_recovery_attempts_734
 BEGIN SELECT RAISE(ABORT,'immutable_auth_recovery_attempt'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_auth_recovery_no_delete_734 BEFORE DELETE ON dnd_auth_recovery_attempts_734
 BEGIN SELECT RAISE(ABORT,'immutable_auth_recovery_attempt'); END;

-- Devil n Dove Release 460 — Development-only secure OAuth lifecycle authority.
-- Stores hashes/ciphertexts and safe metadata only. Raw OAuth state, authorization codes,
-- PKCE verifiers, access tokens and refresh tokens are forbidden from plaintext persistence.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS oauth_authorization_transactions (
  transaction_id TEXT PRIMARY KEY,
  provider_key TEXT NOT NULL,
  state_hash TEXT NOT NULL UNIQUE,
  pkce_verifier_ciphertext TEXT,
  redirect_uri TEXT NOT NULL,
  scopes_json TEXT NOT NULL DEFAULT '[]',
  return_to TEXT NOT NULL DEFAULT '/admin/it-integrations/',
  created_by_user_id INTEGER,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  completed_at TEXT,
  terminal_status TEXT NOT NULL DEFAULT 'pending' CHECK(terminal_status IN ('pending','consuming','complete','denied','failed','expired')),
  diagnostic_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_auth_tx_provider_status ON oauth_authorization_transactions(provider_key, terminal_status, expires_at);

CREATE TABLE IF NOT EXISTS oauth_provider_connections (
  provider_key TEXT PRIMARY KEY,
  remote_subject_id TEXT,
  access_token_ciphertext TEXT,
  refresh_token_ciphertext TEXT,
  id_token_ciphertext TEXT,
  token_type TEXT,
  scopes_json TEXT NOT NULL DEFAULT '[]',
  access_expires_at TEXT,
  refresh_expires_at TEXT,
  connection_status TEXT NOT NULL DEFAULT 'connected' CHECK(connection_status IN ('connected','refresh_required','disconnected','revocation_failed','error')),
  last_refresh_at TEXT,
  disconnected_at TEXT,
  remote_revoke_state TEXT,
  diagnostic_code TEXT,
  connected_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(connected_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS oauth_security_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_key TEXT,
  event_type TEXT NOT NULL,
  outcome TEXT NOT NULL,
  diagnostic_code TEXT,
  transaction_id TEXT,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_oauth_security_events_recent ON oauth_security_events(created_at DESC, provider_key);

-- Release 460 introduces two Cloudflare references. OAUTH_TOKEN_ENCRYPTION_KEY_V1 is a secret,
-- and OAUTH_PROVIDER_AUTHORIZATION_MODE remains unset/closed until controlled live authorization.
UPDATE it_provider_readiness_checks
SET correction_mechanics='Release 460 secure OAuth lifecycle is source-ready. Configure OAUTH_TOKEN_ENCRYPTION_KEY_V1 as a 32-byte base64url Cloudflare secret. Leave OAUTH_PROVIDER_AUTHORIZATION_MODE unset until explicit Development provider authorization acceptance is approved.',
    source_release=460,
    updated_at=CURRENT_TIMESTAMP
WHERE environment='development' AND check_key='connection-acceptance'
  AND provider_key IN ('etsy','pinterest','meta','x','tiktok','youtube');

SELECT COUNT(*) AS release460_auth_transaction_table FROM sqlite_master WHERE type='table' AND name='oauth_authorization_transactions';
SELECT COUNT(*) AS release460_connection_table FROM sqlite_master WHERE type='table' AND name='oauth_provider_connections';
SELECT COUNT(*) AS release460_event_table FROM sqlite_master WHERE type='table' AND name='oauth_security_events';
SELECT COUNT(*) AS release460_forbidden_plaintext_columns
FROM (
  SELECT name FROM pragma_table_info('oauth_authorization_transactions')
  UNION ALL SELECT name FROM pragma_table_info('oauth_provider_connections')
)
WHERE lower(name) IN ('state','code','code_verifier','access_token','refresh_token','id_token','client_secret','shared_secret','password');
PRAGMA foreign_key_check;

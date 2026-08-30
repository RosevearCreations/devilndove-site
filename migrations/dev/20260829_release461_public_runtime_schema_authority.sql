-- Devil n Dove Release 461 — Development-only public runtime schema authority.
-- Customer/public request handlers must never CREATE/ALTER schema.
-- This additive authority owns the current shapes used by checkout recovery and
-- custom-request consent. It does not replay any historical migration.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS checkout_recovery_leads (
  checkout_recovery_lead_id INTEGER PRIMARY KEY AUTOINCREMENT,
  browser_session_token TEXT,
  visitor_token TEXT,
  customer_email TEXT,
  customer_name TEXT,
  cart_count INTEGER NOT NULL DEFAULT 0,
  cart_value_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  checkout_path TEXT,
  checkout_state_json TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  last_recovery_email_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(browser_session_token, customer_email)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_recovery_session_email
  ON checkout_recovery_leads(browser_session_token, customer_email);

CREATE INDEX IF NOT EXISTS idx_checkout_recovery_status_updated
  ON checkout_recovery_leads(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS custom_request_fulfillment_prompts (
  custom_request_fulfillment_prompt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  order_id INTEGER,
  prompt_key TEXT NOT NULL UNIQUE,
  prompt_status TEXT NOT NULL DEFAULT 'draft',
  prompt_type TEXT NOT NULL DEFAULT 'review_photo_consent',
  customer_name TEXT,
  customer_email TEXT,
  subject TEXT,
  body_text TEXT,
  consent_question_text TEXT,
  created_by_user_id INTEGER,
  prompt_token TEXT,
  public_response_status TEXT NOT NULL DEFAULT 'not_sent',
  public_use_scope TEXT,
  review_text TEXT,
  customer_response_note TEXT,
  responded_at TEXT,
  expired_at TEXT,
  voided_at TEXT,
  resent_at TEXT,
  resend_count INTEGER NOT NULL DEFAULT 0,
  lifecycle_note TEXT,
  public_proof_candidate_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_custom_fulfillment_prompts_request
  ON custom_request_fulfillment_prompts(custom_request_id, prompt_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_custom_fulfillment_prompts_token
  ON custom_request_fulfillment_prompts(prompt_token);

-- Read-only evidence. Existing Development tables that are structurally older
-- must be repaired deliberately after drift proof; public requests are not a migration engine.
SELECT COUNT(*) AS release461_checkout_recovery_required_columns
FROM pragma_table_info('checkout_recovery_leads')
WHERE name IN (
  'checkout_recovery_lead_id','browser_session_token','visitor_token','customer_email',
  'customer_name','cart_count','cart_value_cents','currency','checkout_path',
  'checkout_state_json','status','last_recovery_email_at','created_at','updated_at'
);

SELECT COUNT(*) AS release461_custom_consent_required_columns
FROM pragma_table_info('custom_request_fulfillment_prompts')
WHERE name IN (
  'custom_request_fulfillment_prompt_id','custom_request_id','order_id','prompt_key',
  'prompt_status','prompt_type','customer_name','customer_email','subject','body_text',
  'consent_question_text','created_by_user_id','prompt_token','public_response_status',
  'public_use_scope','review_text','customer_response_note','responded_at','expired_at',
  'voided_at','public_proof_candidate_id','created_at','updated_at'
);

SELECT COUNT(*) AS release461_named_indexes
FROM sqlite_master
WHERE type='index'
  AND name IN (
    'idx_checkout_recovery_session_email',
    'idx_checkout_recovery_status_updated',
    'idx_custom_fulfillment_prompts_request',
    'idx_custom_fulfillment_prompts_token'
  );

PRAGMA foreign_key_check;

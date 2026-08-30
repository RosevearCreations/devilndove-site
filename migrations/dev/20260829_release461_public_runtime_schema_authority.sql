-- Devil n Dove Release 461 — Development-only public runtime schema authority.
-- Customer/public request handlers must never CREATE/ALTER schema.
-- This additive authority owns the current public checkout/custom-request shapes.
-- It does not replay any historical migration.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS checkout_recovery_leads (
  checkout_recovery_lead_id INTEGER PRIMARY KEY AUTOINCREMENT,
  browser_session_token TEXT, visitor_token TEXT, customer_email TEXT, customer_name TEXT,
  cart_count INTEGER NOT NULL DEFAULT 0, cart_value_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD', checkout_path TEXT, checkout_state_json TEXT,
  status TEXT NOT NULL DEFAULT 'open', last_recovery_email_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(browser_session_token, customer_email)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_recovery_session_email ON checkout_recovery_leads(browser_session_token, customer_email);
CREATE INDEX IF NOT EXISTS idx_checkout_recovery_status_updated ON checkout_recovery_leads(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS custom_requests (
  custom_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  request_type TEXT NOT NULL,
  product_interest TEXT,
  deadline_date TEXT,
  budget_cents INTEGER,
  message TEXT NOT NULL,
  attachment_urls_json TEXT DEFAULT '[]',
  consent_to_contact INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT,
  visitor_token TEXT, browser_session_token TEXT,
  upload_token TEXT,
  reference_upload_count INTEGER NOT NULL DEFAULT 0,
  scent_profile TEXT, wax_or_base TEXT, colour_notes TEXT, batch_number TEXT,
  ingredient_notes TEXT, allergen_safety_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_custom_requests_email ON custom_requests(email, created_at);
CREATE INDEX IF NOT EXISTS idx_custom_requests_utm ON custom_requests(utm_source, utm_medium, utm_campaign, created_at);

CREATE TABLE IF NOT EXISTS custom_candle_soap_product_specs (
  custom_candle_soap_product_spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER,
  product_id INTEGER,
  product_draft_id INTEGER,
  product_family TEXT NOT NULL DEFAULT 'candle',
  scent_profile TEXT,
  wax_or_base TEXT,
  colour_notes TEXT,
  batch_number TEXT,
  ingredient_notes TEXT,
  allergen_safety_notes TEXT,
  cure_ready_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_candle_soap_specs_request ON custom_candle_soap_product_specs(custom_request_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS custom_request_reference_uploads (
  custom_request_reference_upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  request_key TEXT NOT NULL,
  public_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  reference_use_status TEXT NOT NULL DEFAULT 'private_review_only',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_request_reference_uploads_request ON custom_request_reference_uploads(custom_request_id, created_at);

CREATE TABLE IF NOT EXISTS media_consent_records (
  consent_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  consent_key TEXT NOT NULL UNIQUE,
  subject_label TEXT,
  source_type TEXT DEFAULT 'general',
  source_id TEXT,
  media_url TEXT,
  consent_status TEXT NOT NULL DEFAULT 'unknown',
  consent_scope TEXT NOT NULL DEFAULT 'internal_only',
  public_use_allowed INTEGER NOT NULL DEFAULT 0,
  social_use_allowed INTEGER NOT NULL DEFAULT 0,
  privacy_notes TEXT,
  reviewed_by_user_id INTEGER,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_consent_records_source ON media_consent_records(source_type, source_id, updated_at);

CREATE TABLE IF NOT EXISTS product_interest_requests (
  product_interest_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  request_type TEXT NOT NULL,
  user_id INTEGER,
  email TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_interest_requests_lookup ON product_interest_requests(product_id, request_type, status, created_at DESC);

CREATE TABLE IF NOT EXISTS custom_request_fulfillment_prompts (
  custom_request_fulfillment_prompt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  order_id INTEGER,
  prompt_key TEXT NOT NULL UNIQUE,
  prompt_status TEXT NOT NULL DEFAULT 'draft',
  prompt_type TEXT NOT NULL DEFAULT 'review_photo_consent',
  customer_name TEXT, customer_email TEXT, subject TEXT, body_text TEXT, consent_question_text TEXT,
  created_by_user_id INTEGER,
  prompt_token TEXT,
  public_response_status TEXT NOT NULL DEFAULT 'not_sent',
  public_use_scope TEXT, review_text TEXT, customer_response_note TEXT, responded_at TEXT,
  expired_at TEXT, voided_at TEXT, resent_at TEXT,
  resend_count INTEGER NOT NULL DEFAULT 0,
  lifecycle_note TEXT,
  public_proof_candidate_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_fulfillment_prompts_request ON custom_request_fulfillment_prompts(custom_request_id, prompt_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_fulfillment_prompts_token ON custom_request_fulfillment_prompts(prompt_token);

-- Read-only evidence. Existing Development tables that are structurally older must be repaired
-- deliberately after drift proof; public requests are never a migration engine.
SELECT COUNT(*) AS release461_checkout_recovery_required_columns FROM pragma_table_info('checkout_recovery_leads') WHERE name IN ('checkout_recovery_lead_id','browser_session_token','visitor_token','customer_email','customer_name','cart_count','cart_value_cents','currency','checkout_path','checkout_state_json','status','last_recovery_email_at','created_at','updated_at');
SELECT COUNT(*) AS release461_custom_requests_required_columns FROM pragma_table_info('custom_requests') WHERE name IN ('custom_request_id','request_key','name','email','phone','request_type','product_interest','deadline_date','budget_cents','message','attachment_urls_json','consent_to_contact','status','admin_notes','utm_source','utm_medium','utm_campaign','utm_content','utm_term','visitor_token','browser_session_token','upload_token','reference_upload_count','scent_profile','wax_or_base','colour_notes','batch_number','ingredient_notes','allergen_safety_notes','created_at','updated_at');
SELECT COUNT(*) AS release461_custom_specs_required_columns FROM pragma_table_info('custom_candle_soap_product_specs') WHERE name IN ('custom_candle_soap_product_spec_id','custom_request_id','product_id','product_draft_id','product_family','scent_profile','wax_or_base','colour_notes','batch_number','ingredient_notes','allergen_safety_notes','cure_ready_date','created_at','updated_at');
SELECT COUNT(*) AS release461_reference_upload_required_columns FROM pragma_table_info('custom_request_reference_uploads') WHERE name IN ('custom_request_reference_upload_id','custom_request_id','request_key','public_url','object_key','original_filename','mime_type','file_size_bytes','reference_use_status','created_at');
SELECT COUNT(*) AS release461_media_consent_required_columns FROM pragma_table_info('media_consent_records') WHERE name IN ('consent_record_id','consent_key','subject_label','source_type','source_id','media_url','consent_status','consent_scope','public_use_allowed','social_use_allowed','privacy_notes','reviewed_by_user_id','expires_at','created_at','updated_at');
SELECT COUNT(*) AS release461_product_interest_required_columns FROM pragma_table_info('product_interest_requests') WHERE name IN ('product_interest_request_id','product_id','request_type','user_id','email','notes','status','created_at','updated_at');
SELECT COUNT(*) AS release461_custom_consent_required_columns FROM pragma_table_info('custom_request_fulfillment_prompts') WHERE name IN ('custom_request_fulfillment_prompt_id','custom_request_id','order_id','prompt_key','prompt_status','prompt_type','customer_name','customer_email','subject','body_text','consent_question_text','created_by_user_id','prompt_token','public_response_status','public_use_scope','review_text','customer_response_note','responded_at','expired_at','voided_at','public_proof_candidate_id','created_at','updated_at');
SELECT COUNT(*) AS release461_named_indexes FROM sqlite_master WHERE type='index' AND name IN ('idx_checkout_recovery_session_email','idx_checkout_recovery_status_updated','idx_custom_requests_status','idx_custom_requests_email','idx_custom_requests_utm','idx_custom_candle_soap_specs_request','idx_custom_request_reference_uploads_request','idx_media_consent_records_source','idx_product_interest_requests_lookup','idx_custom_fulfillment_prompts_request','idx_custom_fulfillment_prompts_token');
PRAGMA foreign_key_check;

-- Devil n Dove Release 449 — Development-only corporate / commerce convergence.
-- Additive only. Existing Accounting ledger/expense authorities remain authoritative.
-- Target authority: devilndove-dev. Do not replay Release 447/448 migrations here.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS provider_setup_authorities (
  provider_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('payment','marketplace','social','video','commerce')),
  setup_authority TEXT NOT NULL,
  setup_url TEXT,
  required_config_keys_json TEXT NOT NULL DEFAULT '[]',
  setup_status TEXT NOT NULL DEFAULT 'unconfigured' CHECK (setup_status IN ('unconfigured','partial','ready','error','disabled')),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0,1)),
  last_verified_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketplace_channels (
  channel_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0,1)),
  syndication_mode TEXT NOT NULL DEFAULT 'draft_only' CHECK (syndication_mode IN ('disabled','draft_only','review_required','publish_allowed')),
  publication_allowed INTEGER NOT NULL DEFAULT 0 CHECK (publication_allowed IN (0,1)),
  setup_status TEXT NOT NULL DEFAULT 'unconfigured' CHECK (setup_status IN ('unconfigured','partial','ready','error','disabled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_key) REFERENCES provider_setup_authorities(provider_key)
);

CREATE TABLE IF NOT EXISTS marketplace_syndication_drafts (
  id TEXT PRIMARY KEY,
  channel_key TEXT NOT NULL,
  product_id TEXT NOT NULL,
  draft_title TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','needs_review','approved','rejected','superseded')),
  publication_requested INTEGER NOT NULL DEFAULT 0 CHECK (publication_requested IN (0,1)),
  external_reference TEXT,
  last_validation_error TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_key) REFERENCES marketplace_channels(channel_key)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_syndication_product
  ON marketplace_syndication_drafts(channel_key, product_id, updated_at);

CREATE TABLE IF NOT EXISTS sales_invoices (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  currency TEXT NOT NULL DEFAULT 'CAD',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  invoice_status TEXT NOT NULL DEFAULT 'issued',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  provider_key TEXT,
  provider_reference TEXT,
  accounting_journal_entry_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_order ON sales_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(invoice_date);

CREATE TABLE IF NOT EXISTS sales_refunds (
  id TEXT PRIMARY KEY,
  invoice_id TEXT,
  order_id TEXT,
  refund_reference TEXT,
  refund_date TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CAD',
  subtotal_refunded_cents INTEGER NOT NULL DEFAULT 0,
  tax_refunded_cents INTEGER NOT NULL DEFAULT 0,
  shipping_refunded_cents INTEGER NOT NULL DEFAULT 0,
  provider_fee_refunded_cents INTEGER NOT NULL DEFAULT 0,
  marketplace_fee_refunded_cents INTEGER NOT NULL DEFAULT 0,
  total_refunded_cents INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  provider_key TEXT,
  accounting_journal_entry_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id)
);

CREATE INDEX IF NOT EXISTS idx_sales_refunds_invoice ON sales_refunds(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_refunds_order ON sales_refunds(order_id);

CREATE TABLE IF NOT EXISTS commerce_transaction_costs (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  invoice_id TEXT,
  refund_id TEXT,
  provider_key TEXT,
  marketplace_key TEXT,
  provider_reference TEXT,
  transaction_date TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CAD',
  gross_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  shipping_revenue_cents INTEGER NOT NULL DEFAULT 0,
  sales_tax_cents INTEGER NOT NULL DEFAULT 0,
  refund_cents INTEGER NOT NULL DEFAULT 0,
  provider_fee_cents INTEGER NOT NULL DEFAULT 0,
  marketplace_fee_cents INTEGER NOT NULL DEFAULT 0,
  currency_conversion_fee_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
  net_cents INTEGER NOT NULL DEFAULT 0,
  completeness_status TEXT NOT NULL DEFAULT 'incomplete' CHECK (completeness_status IN ('incomplete','review','complete')),
  source TEXT NOT NULL DEFAULT 'manual',
  accounting_journal_entry_id TEXT,
  ledger_posted INTEGER NOT NULL DEFAULT 0 CHECK (ledger_posted IN (0,1)),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id),
  FOREIGN KEY (refund_id) REFERENCES sales_refunds(id)
);

CREATE INDEX IF NOT EXISTS idx_commerce_costs_date ON commerce_transaction_costs(transaction_date);
CREATE INDEX IF NOT EXISTS idx_commerce_costs_order ON commerce_transaction_costs(order_id);
CREATE INDEX IF NOT EXISTS idx_commerce_costs_completeness ON commerce_transaction_costs(completeness_status, transaction_date);

CREATE TABLE IF NOT EXISTS gifi_reporting_snapshots (
  id TEXT PRIMARY KEY,
  fiscal_year INTEGER NOT NULL,
  period_key TEXT NOT NULL,
  statement_type TEXT NOT NULL CHECK (statement_type IN ('income_statement','balance_sheet','gifi_readiness','commerce_completeness')),
  payload_json TEXT NOT NULL,
  completeness_status TEXT NOT NULL DEFAULT 'draft' CHECK (completeness_status IN ('draft','needs_review','ready','finalized')),
  source_contract TEXT NOT NULL DEFAULT 'existing-accounting-ledger',
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(fiscal_year, period_key, statement_type)
);

INSERT OR IGNORE INTO provider_setup_authorities
  (provider_key, display_name, provider_type, setup_authority, setup_url, required_config_keys_json, setup_status, enabled)
VALUES
  ('stripe','Stripe','payment','I.T. / Cloudflare secrets','https://dashboard.stripe.com/','["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET"]','unconfigured',0),
  ('paypal','PayPal','payment','I.T. / Cloudflare secrets','https://developer.paypal.com/','["PAYPAL_CLIENT_ID","PAYPAL_CLIENT_SECRET"]','unconfigured',0),
  ('etsy','Etsy','marketplace','I.T. / Etsy developer application','https://www.etsy.com/developers/','["ETSY_CLIENT_ID","ETSY_CLIENT_SECRET","ETSY_REDIRECT_URI"]','unconfigured',0),
  ('pinterest','Pinterest','social','I.T. / Pinterest developer application','https://developers.pinterest.com/','["PINTEREST_APP_ID","PINTEREST_APP_SECRET"]','unconfigured',0),
  ('meta','Meta / Instagram','social','I.T. / Meta developer application','https://developers.facebook.com/','["META_APP_ID","META_APP_SECRET"]','unconfigured',0),
  ('tiktok','TikTok','social','I.T. / TikTok developer application','https://developers.tiktok.com/','["TIKTOK_CLIENT_KEY","TIKTOK_CLIENT_SECRET"]','unconfigured',0),
  ('youtube','YouTube','video','I.T. / Google Cloud OAuth','https://console.cloud.google.com/','["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET"]','unconfigured',0);

INSERT OR IGNORE INTO marketplace_channels
  (channel_key, display_name, provider_key, enabled, syndication_mode, publication_allowed, setup_status)
VALUES
  ('etsy','Etsy','etsy',0,'draft_only',0,'unconfigured');

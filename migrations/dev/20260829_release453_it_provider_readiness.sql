-- Devil n Dove Release 453 — Development-only I.T. provider readiness and acceptance authority.
-- Additive operational metadata only. Secret values, provider calls and Production targets are forbidden.
-- Canonical provider identity remains provider_setup_authorities from Release 449.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS it_provider_readiness_checks (
  it_provider_readiness_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_key TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'development',
  check_key TEXT NOT NULL,
  check_label TEXT NOT NULL,
  check_category TEXT NOT NULL DEFAULT 'configuration'
    CHECK (check_category IN ('credentials','configuration','callback','webhook','scope','business_account','domain_verification','catalog','sandbox','payment','media','consent','compliance','evidence','other')),
  required_for_activation INTEGER NOT NULL DEFAULT 1 CHECK (required_for_activation IN (0,1)),
  check_state TEXT NOT NULL DEFAULT 'blocked'
    CHECK (check_state IN ('blocked','pending','ready','passed','failed','deferred','not_applicable')),
  config_reference TEXT,
  correction_mechanics TEXT NOT NULL DEFAULT '',
  evidence_reference TEXT,
  last_safe_error TEXT,
  source_release INTEGER NOT NULL DEFAULT 453 CHECK (source_release >= 453),
  last_checked_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_key) REFERENCES provider_setup_authorities(provider_key) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE(provider_key, environment, check_key),
  CHECK (length(trim(check_key)) > 0),
  CHECK (length(trim(check_label)) > 0),
  CHECK (config_reference IS NULL OR (
    length(config_reference) <= 200 AND
    instr(lower(config_reference),'secret=') = 0 AND
    instr(lower(config_reference),'token=') = 0 AND
    instr(lower(config_reference),'password=') = 0 AND
    instr(lower(config_reference),'private_key=') = 0
  ))
);

CREATE INDEX IF NOT EXISTS idx_it_provider_readiness_provider_state
  ON it_provider_readiness_checks(provider_key, environment, check_state, required_for_activation, updated_at DESC);

CREATE TABLE IF NOT EXISTS it_provider_readiness_events (
  it_provider_readiness_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  it_provider_readiness_check_id INTEGER NOT NULL,
  provider_key TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'development',
  state_before TEXT NOT NULL
    CHECK (state_before IN ('blocked','pending','ready','passed','failed','deferred','not_applicable')),
  state_after TEXT NOT NULL
    CHECK (state_after IN ('blocked','pending','ready','passed','failed','deferred','not_applicable')),
  event_note TEXT,
  evidence_reference TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (it_provider_readiness_check_id) REFERENCES it_provider_readiness_checks(it_provider_readiness_check_id) ON DELETE CASCADE,
  FOREIGN KEY (provider_key) REFERENCES provider_setup_authorities(provider_key) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_it_provider_readiness_events_check
  ON it_provider_readiness_events(it_provider_readiness_check_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_it_provider_readiness_events_provider
  ON it_provider_readiness_events(provider_key, environment, created_at DESC);

-- Seed the current provider acceptance backlog. ON CONFLICT deliberately preserves check_state,
-- evidence and operator history while refreshing labels/correction mechanics for Release 453.
INSERT INTO it_provider_readiness_checks
  (provider_key,environment,check_key,check_label,check_category,required_for_activation,check_state,config_reference,correction_mechanics,source_release)
VALUES
  ('stripe','development','credentials','Development test credentials configured','credentials',1,'deferred','STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET','Add Stripe test-mode secret references in Cloudflare, never D1. Re-run the safe configuration check before checkout acceptance.',453),
  ('stripe','development','checkout','Test checkout completes without live charges','payment',1,'deferred',NULL,'Use Stripe test mode only. Complete one Development checkout and record safe evidence without card/token values.',453),
  ('stripe','development','webhook-signature','Signed webhook verification passes','webhook',1,'deferred','STRIPE_WEBHOOK_SECRET','Configure the Development webhook endpoint/signing-secret reference, send a Stripe test event, verify signature handling and record safe evidence.',453),
  ('stripe','development','reconciliation','Provider transaction reconciles to local commerce/accounting evidence','evidence',1,'deferred',NULL,'Compare the test transaction/provider reference against local invoice, commerce-cost and accounting evidence. Do not post duplicate ledger entries.',453),
  ('stripe','development','idempotent-replay','Webhook replay is idempotent','compliance',1,'deferred',NULL,'Replay the same signed test event and prove no duplicate order, payment, refund or accounting effect is created.',453),

  ('paypal','development','credentials','Sandbox credentials configured','credentials',1,'deferred','PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET','Add PayPal sandbox secret references in Cloudflare, never D1. Keep Production credentials unavailable.',453),
  ('paypal','development','approval-capture','Sandbox approval and capture completes','sandbox',1,'deferred',NULL,'Run approval/capture only against PayPal sandbox and record the safe provider reference.',453),
  ('paypal','development','webhook-verification','Verified sandbox webhook passes','webhook',1,'deferred',NULL,'Configure the sandbox webhook, verify authenticity using PayPal verification mechanics and record only safe evidence.',453),
  ('paypal','development','reconciliation','Sandbox transaction reconciles to local commerce/accounting evidence','evidence',1,'deferred',NULL,'Match the sandbox capture/provider reference to local invoice, commerce-cost and accounting evidence.',453),
  ('paypal','development','idempotent-replay','Webhook replay is idempotent','compliance',1,'deferred',NULL,'Replay the same sandbox event and prove duplicate financial/order effects are refused.',453),

  ('etsy','development','credentials','Etsy application credentials configured','credentials',1,'deferred','ETSY_API_KEYSTRING / ETSY_SHARED_SECRET','Add only Cloudflare secret references after Etsy issues the application credentials. Do not store values in D1.',453),
  ('etsy','development','oauth-shop','OAuth and shop access verified','scope',1,'deferred','ETSY_REDIRECT_URI / ETSY_SHOP_ID','Complete OAuth against the Development callback, confirm the intended shop, scopes and token storage boundary.',453),
  ('etsy','development','taxonomy-shipping','Taxonomy, shipping and return profiles verified','configuration',1,'deferred',NULL,'Resolve real Etsy taxonomy/shipping/return profile identifiers and compare them with local listing profiles before provider acceptance.',453),
  ('etsy','development','draft-listing','Draft listing acceptance passes','catalog',1,'deferred',NULL,'Create/validate a provider-side draft only after credentials arrive. Publication must remain disabled until deliberate promotion.',453),
  ('etsy','development','image-acceptance','Listing image upload/association passes','media',1,'deferred',NULL,'Verify selected Product images can be associated with the provider draft without changing canonical Product media authority.',453),

  ('pinterest','development','business-account','Pinterest business account confirmed','business_account',1,'deferred',NULL,'Confirm the intended Pinterest business account and document its safe account reference.',453),
  ('pinterest','development','domain-claim','Devil n Dove domain claim verified','domain_verification',1,'deferred',NULL,'Complete Pinterest domain claim for the intended public domain and record verification evidence.',453),
  ('pinterest','development','credentials-scopes','Application credentials and required scopes configured','scope',1,'deferred','PINTEREST_APP_ID / PINTEREST_APP_SECRET','Configure provider application secrets in Cloudflare and verify required catalog/publishing scopes without storing values in D1.',453),
  ('pinterest','development','pin-acceptance','Provider-side test Pin acceptance passes','catalog',1,'deferred',NULL,'Create a controlled provider test only after account/domain/scope checks pass. Keep general publication disabled.',453),

  ('meta','development','business-catalog','Meta business/commerce account and catalog confirmed','business_account',1,'deferred',NULL,'Confirm the intended Meta business, commerce account and catalog identifiers; record only safe references.',453),
  ('meta','development','credentials-scopes','Meta application credentials and scopes configured','scope',1,'deferred','META_APP_ID / META_APP_SECRET','Configure provider secrets in Cloudflare and review current catalog/content permissions before acceptance.',453),
  ('meta','development','domain-account-review','Domain/account review requirements satisfied','compliance',1,'deferred',NULL,'Complete any required Meta domain/business/app review steps and attach safe evidence references.',453),
  ('meta','development','catalog-acceptance','Catalog preparation acceptance passes','catalog',1,'deferred',NULL,'Validate prepared Product/catalog data against the intended Meta catalog while provider publication remains locked.',453),

  ('tiktok','development','credentials','TikTok application credentials configured','credentials',1,'deferred','TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET','Configure TikTok application secret references in Cloudflare after provider approval; do not store values in D1.',453),
  ('tiktok','development','creator-info','Creator information flow verified','configuration',1,'deferred',NULL,'Verify the current creator-info step renders provider-returned account/privacy choices before posting.',453),
  ('tiktok','development','media-domain','Media domain or URL prefix verified','domain_verification',1,'deferred',NULL,'Verify the provider-required media domain/URL prefix used by prepared CAIP media.',453),
  ('tiktok','development','consent-review','Explicit creator consent/review flow verified','consent',1,'deferred',NULL,'Verify the user sees and confirms the final post settings/content before any provider execution.',453),
  ('tiktok','development','content-acceptance','Controlled content-post acceptance passes','media',1,'deferred',NULL,'Run provider acceptance only after credentials, creator-info, media-domain and consent checks pass; keep general publication disabled.',453),

  ('youtube','development','oauth-credentials','Google/YouTube OAuth credentials configured','credentials',1,'deferred','GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET','Configure OAuth secret references in Cloudflare/approved secret storage and keep raw values out of D1/source.',453),
  ('youtube','development','channel-access','Intended YouTube channel access verified','business_account',1,'deferred',NULL,'Confirm OAuth resolves to the intended Devil n Dove channel and record only safe channel/account evidence.',453),
  ('youtube','development','upload-scope','Required upload scope/consent verified','scope',1,'deferred',NULL,'Verify the minimum required YouTube upload scope and consent flow before provider testing.',453),
  ('youtube','development','upload-acceptance','Controlled upload acceptance passes','media',1,'deferred',NULL,'Upload only an approved test asset after OAuth/channel/scope checks pass and record safe evidence; general publishing remains disabled.',453)
ON CONFLICT(provider_key,environment,check_key) DO UPDATE SET
  check_label=excluded.check_label,
  check_category=excluded.check_category,
  required_for_activation=excluded.required_for_activation,
  config_reference=excluded.config_reference,
  correction_mechanics=excluded.correction_mechanics,
  source_release=453,
  updated_at=CURRENT_TIMESTAMP;

SELECT provider_key, COUNT(*) AS readiness_check_count
FROM it_provider_readiness_checks
WHERE environment='development'
GROUP BY provider_key
ORDER BY provider_key;
PRAGMA foreign_key_check;

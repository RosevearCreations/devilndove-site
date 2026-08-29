-- Devil n Dove Release 450 — Development-only marketplace / SEO readiness convergence.
-- Additive operational metadata only. Product, Inventory, Accounting and media authorities remain canonical.
-- Target authority: devilndove-dev. Provider execution and Production mutation are forbidden.

PRAGMA foreign_keys = ON;

-- Move legacy marketplace schema ownership out of request handlers.
CREATE TABLE IF NOT EXISTS marketplace_export_image_selections (
  marketplace_export_image_selection_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  selected_image_urls_json TEXT NOT NULL DEFAULT '[]',
  selected_product_image_ids_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, product_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_export_image_selections_channel
  ON marketplace_export_image_selections(channel, product_id);

CREATE TABLE IF NOT EXISTS marketplace_export_history (
  marketplace_export_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  export_format TEXT NOT NULL DEFAULT 'csv',
  product_count INTEGER NOT NULL DEFAULT 0,
  ready_count INTEGER NOT NULL DEFAULT 0,
  blocked_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_marketplace_export_history_channel
  ON marketplace_export_history(channel, created_at);

CREATE TABLE IF NOT EXISTS marketplace_export_replay_events (
  marketplace_export_replay_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  source_history_id INTEGER,
  action_kind TEXT NOT NULL DEFAULT 'review',
  affected_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketplace_export_row_validation_results (
  marketplace_export_row_validation_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  product_id INTEGER,
  validation_status TEXT NOT NULL DEFAULT 'needs_review',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  missing_fields_json TEXT NOT NULL DEFAULT '[]',
  row_payload_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_validation_channel_product
  ON marketplace_export_row_validation_results(channel, product_id, created_at);

CREATE TABLE IF NOT EXISTS marketplace_export_download_gates (
  marketplace_export_download_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  export_history_id INTEGER,
  validation_run_id INTEGER,
  gate_status TEXT NOT NULL DEFAULT 'blocked_pending_validation',
  hard_blocker_count INTEGER NOT NULL DEFAULT 0,
  manual_override_required INTEGER NOT NULL DEFAULT 0 CHECK (manual_override_required IN (0,1)),
  override_by_user_id INTEGER,
  override_at TEXT,
  gate_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, export_history_id)
);

CREATE TABLE IF NOT EXISTS marketplace_download_block_events (
  marketplace_download_block_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  gate_status TEXT NOT NULL,
  hard_blocker_count INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 1 CHECK (blocked IN (0,1)),
  requested_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS marketplace_csv_mappings (
  marketplace_csv_mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL UNIQUE,
  mapping_json TEXT NOT NULL DEFAULT '[]',
  validation_json TEXT NOT NULL DEFAULT '{}',
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Release 450 channel capability and provider-execution policy.
CREATE TABLE IF NOT EXISTS marketplace_channel_policies (
  channel_key TEXT PRIMARY KEY,
  provider_key TEXT,
  display_name TEXT NOT NULL,
  integration_mode TEXT NOT NULL DEFAULT 'draft_only'
    CHECK (integration_mode IN ('disabled','draft_only','review_required','upload_only','provider_preview')),
  provider_execution_allowed INTEGER NOT NULL DEFAULT 0 CHECK (provider_execution_allowed IN (0,1)),
  max_images INTEGER NOT NULL DEFAULT 10,
  max_tags INTEGER NOT NULL DEFAULT 0,
  max_variations INTEGER NOT NULL DEFAULT 0,
  max_personalization_questions INTEGER NOT NULL DEFAULT 0,
  supports_personalization INTEGER NOT NULL DEFAULT 0 CHECK (supports_personalization IN (0,1)),
  supports_photo_post INTEGER NOT NULL DEFAULT 0 CHECK (supports_photo_post IN (0,1)),
  api_reference_url TEXT,
  current_api_notes TEXT,
  last_reviewed_on TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_key) REFERENCES provider_setup_authorities(provider_key)
);

CREATE TABLE IF NOT EXISTS marketplace_listing_profiles (
  marketplace_listing_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_key TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  title_override TEXT,
  description_override TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  materials_json TEXT NOT NULL DEFAULT '[]',
  style_terms_json TEXT NOT NULL DEFAULT '[]',
  quantity_override INTEGER,
  taxonomy_id TEXT,
  shipping_profile_reference TEXT,
  return_policy_reference TEXT,
  readiness_state_reference TEXT,
  who_made TEXT CHECK (who_made IS NULL OR who_made IN ('i_did','someone_else','collective')),
  when_made TEXT,
  is_supply INTEGER NOT NULL DEFAULT 0 CHECK (is_supply IN (0,1)),
  listing_type TEXT NOT NULL DEFAULT 'physical' CHECK (listing_type IN ('physical','download','both')),
  personalization_questions_json TEXT NOT NULL DEFAULT '[]',
  variation_properties_json TEXT NOT NULL DEFAULT '[]',
  production_partner_refs_json TEXT NOT NULL DEFAULT '[]',
  listing_state TEXT NOT NULL DEFAULT 'draft' CHECK (listing_state IN ('draft','needs_review','approved','rejected')),
  review_notes TEXT,
  created_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel_key, product_id),
  FOREIGN KEY (channel_key) REFERENCES marketplace_channel_policies(channel_key)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_listing_profiles_product
  ON marketplace_listing_profiles(product_id, channel_key, updated_at);

CREATE TABLE IF NOT EXISTS marketplace_listing_validation_snapshots (
  marketplace_listing_validation_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_key TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  validation_state TEXT NOT NULL DEFAULT 'blocked'
    CHECK (validation_state IN ('blocked','needs_review','draft_ready')),
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  blockers_json TEXT NOT NULL DEFAULT '[]',
  warnings_json TEXT NOT NULL DEFAULT '[]',
  payload_json TEXT NOT NULL DEFAULT '{}',
  source_contract TEXT NOT NULL DEFAULT 'release450-marketplace-readiness',
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_listing_validation_latest
  ON marketplace_listing_validation_snapshots(channel_key, product_id, created_at);

-- Current channel preparation remains fail-closed. No provider can publish from Release 450.
INSERT INTO marketplace_channel_policies
  (channel_key,provider_key,display_name,integration_mode,provider_execution_allowed,max_images,max_tags,max_variations,max_personalization_questions,supports_personalization,supports_photo_post,api_reference_url,current_api_notes,last_reviewed_on)
VALUES
  ('etsy','etsy','Etsy','draft_only',0,20,13,3,5,1,0,'https://developer.etsy.com/documentation/','Open API v3 draft preparation. Processing profiles and third variation remain provider-go-live sensitive; local preparation only.','2026-08-29'),
  ('facebook','meta','Facebook / Meta','review_required',0,10,0,0,0,0,1,'https://developers.facebook.com/','Local catalog/content preparation only; provider execution disabled.','2026-08-29'),
  ('pinterest','pinterest','Pinterest','review_required',0,5,20,0,0,0,0,'https://developers.pinterest.com/','Local catalog/pin preparation only; provider execution disabled.','2026-08-29'),
  ('tiktok','tiktok','TikTok','upload_only',0,35,0,0,0,0,1,'https://developers.tiktok.com/products/content-posting-api/','Photo/video preparation may target Content Posting API later; explicit consent/audit/provider execution not enabled here.','2026-08-29'),
  ('manual',NULL,'Manual export','draft_only',0,20,0,0,0,0,0,NULL,'Local export only.','2026-08-29')
ON CONFLICT(channel_key) DO UPDATE SET
  provider_key=excluded.provider_key,
  display_name=excluded.display_name,
  integration_mode=excluded.integration_mode,
  provider_execution_allowed=0,
  max_images=excluded.max_images,
  max_tags=excluded.max_tags,
  max_variations=excluded.max_variations,
  max_personalization_questions=excluded.max_personalization_questions,
  supports_personalization=excluded.supports_personalization,
  supports_photo_post=excluded.supports_photo_post,
  api_reference_url=excluded.api_reference_url,
  current_api_notes=excluded.current_api_notes,
  last_reviewed_on=excluded.last_reviewed_on,
  updated_at=CURRENT_TIMESTAMP;

-- Keep marketplace channel rows fail-closed while adding prepared channels.
INSERT OR IGNORE INTO marketplace_channels
  (channel_key,display_name,provider_key,enabled,syndication_mode,publication_allowed,setup_status)
VALUES
  ('facebook','Facebook / Meta','meta',0,'review_required',0,'unconfigured'),
  ('pinterest','Pinterest','pinterest',0,'review_required',0,'unconfigured'),
  ('tiktok','TikTok','tiktok',0,'review_required',0,'unconfigured');

UPDATE marketplace_channels
SET publication_allowed=0,
    syndication_mode=CASE WHEN channel_key='etsy' THEN 'draft_only' ELSE 'review_required' END,
    updated_at=CURRENT_TIMESTAMP
WHERE channel_key IN ('etsy','facebook','pinterest','tiktok');

-- Correct provider setup reference names without ever storing credential values.
UPDATE provider_setup_authorities
SET required_config_keys_json='["ETSY_API_KEYSTRING","ETSY_SHARED_SECRET","ETSY_REDIRECT_URI","ETSY_SHOP_ID"]',
    setup_authority='I.T. / Etsy developer application and Cloudflare secret references',
    updated_at=CURRENT_TIMESTAMP
WHERE provider_key='etsy';

INSERT OR IGNORE INTO marketplace_csv_mappings
  (channel,mapping_json,validation_json,created_at,updated_at)
VALUES
  ('etsy','["title","description","price","quantity","sku","taxonomy_id","who_made","when_made","is_supply","materials","tags","shipping_profile_reference","readiness_state_reference","return_policy_reference","image_1"]','{"required":["title","description","price","quantity","taxonomy_id","who_made","when_made","image_1"]}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('facebook','["title","description","price","category","condition","image_1","availability"]','{"required":["title","description","image_1"]}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('pinterest','["title","description","link","image_url","alt_text","board","tags"]','{"required":["title","link","image_url"]}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('tiktok','["title","description","media_type","photo_images","cover_index","privacy_level"]','{"required":["media_type"]}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('manual','["title","description","price","sku","image_1","notes"]','{"required":["title"]}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

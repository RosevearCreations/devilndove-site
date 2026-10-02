-- Release 467 Build 350 — Etsy Development OAuth shop identity authority.
-- Forward-only additive safe metadata. OAuth tokens remain encrypted in oauth_provider_connections.
-- No listing creation/update/publication is authorized by this migration.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS etsy_oauth_shop_connections (
  provider_key TEXT PRIMARY KEY CHECK(provider_key='etsy'),
  owner_user_id INTEGER NOT NULL,
  shop_id INTEGER NOT NULL UNIQUE,
  shop_name TEXT NOT NULL DEFAULT '',
  currency_code TEXT,
  listing_active_count INTEGER NOT NULL DEFAULT 0,
  acceptance_status TEXT NOT NULL DEFAULT 'connected_verified'
    CHECK(acceptance_status IN ('connected_verified','disconnected','error')),
  discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(provider_key) REFERENCES oauth_provider_connections(provider_key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_etsy_oauth_shop_owner
  ON etsy_oauth_shop_connections(owner_user_id, shop_id);

UPDATE provider_setup_authorities
SET required_config_keys_json='["ETSY_API_KEYSTRING","ETSY_SHARED_SECRET","ETSY_REDIRECT_URI"]',
    setup_authority='I.T. / Etsy Seller App OAuth; shop ID is discovered from the authenticated owner after OAuth',
    updated_at=CURRENT_TIMESTAMP
WHERE provider_key='etsy';

UPDATE it_provider_readiness_checks
SET config_reference='ETSY_API_KEYSTRING / ETSY_SHARED_SECRET / ETSY_REDIRECT_URI',
    correction_mechanics='Register the exact Development callback, keep the Etsy shop in normal mode, then use the Devil n Dove Connect Etsy action. The authenticated owner shop ID is discovered automatically; do not store OAuth token values in D1/source.',
    source_release=467,
    updated_at=CURRENT_TIMESTAMP
WHERE provider_key='etsy' AND environment='development' AND check_key='oauth-shop';

SELECT COUNT(*) AS etsy_oauth_shop_connection_table
FROM sqlite_master WHERE type='table' AND name='etsy_oauth_shop_connections';
SELECT required_config_keys_json AS etsy_required_cloudflare_references
FROM provider_setup_authorities WHERE provider_key='etsy';
PRAGMA foreign_key_check;

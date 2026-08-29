-- Devil n Dove Release 459 — Development-only provider setup authority convergence.
-- Safe metadata only: Cloudflare variable/secret reference names, readiness checklist text and provider identity.
-- No credential values, OAuth tokens, provider calls, publication flags, Product data or Production identifiers are written here.

PRAGMA foreign_keys = ON;

-- Add the X provider authority that already exists in the Social runtime callback surface.
INSERT INTO provider_setup_authorities
  (provider_key,display_name,provider_type,setup_authority,setup_url,required_config_keys_json,setup_status,enabled,updated_at)
VALUES
  ('x','X','social','I.T. / X developer application and Cloudflare secret references','https://developer.x.com/','["X_CLIENT_ID","X_CLIENT_SECRET","X_REDIRECT_URI"]','unconfigured',0,CURRENT_TIMESTAMP)
ON CONFLICT(provider_key) DO UPDATE SET
  display_name=excluded.display_name,
  provider_type=excluded.provider_type,
  setup_authority=excluded.setup_authority,
  setup_url=excluded.setup_url,
  required_config_keys_json=excluded.required_config_keys_json,
  updated_at=CURRENT_TIMESTAMP;

-- Converge safe reference-name metadata with the current runtime contracts.
UPDATE provider_setup_authorities
SET required_config_keys_json='["STRIPE_PUBLISHABLE_KEY","STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET"]',
    setup_authority='I.T. / Stripe test-mode configuration and Cloudflare secret references',
    updated_at=CURRENT_TIMESTAMP
WHERE provider_key='stripe';

UPDATE provider_setup_authorities
SET required_config_keys_json='["PAYPAL_CLIENT_ID","PAYPAL_CLIENT_SECRET","PAYPAL_WEBHOOK_ID"]',
    setup_authority='I.T. / PayPal sandbox configuration and Cloudflare secret references',
    updated_at=CURRENT_TIMESTAMP
WHERE provider_key='paypal';

UPDATE provider_setup_authorities
SET required_config_keys_json='["ETSY_API_KEYSTRING","ETSY_SHARED_SECRET","ETSY_REDIRECT_URI","ETSY_SHOP_ID"]',
    setup_authority='I.T. / Etsy developer application and Cloudflare secret references',
    updated_at=CURRENT_TIMESTAMP
WHERE provider_key='etsy';

UPDATE provider_setup_authorities
SET required_config_keys_json='["PINTEREST_APP_ID","PINTEREST_APP_SECRET","PINTEREST_REDIRECT_URI"]',
    setup_authority='I.T. / Pinterest developer application and Cloudflare secret references',
    updated_at=CURRENT_TIMESTAMP
WHERE provider_key='pinterest';

UPDATE provider_setup_authorities
SET required_config_keys_json='["META_APP_ID","META_APP_SECRET","META_REDIRECT_URI"]',
    setup_authority='I.T. / Meta developer application and Cloudflare secret references',
    updated_at=CURRENT_TIMESTAMP
WHERE provider_key='meta';

UPDATE provider_setup_authorities
SET required_config_keys_json='["TIKTOK_CLIENT_KEY","TIKTOK_CLIENT_SECRET","TIKTOK_REDIRECT_URI"]',
    setup_authority='I.T. / TikTok developer application and Cloudflare secret references',
    updated_at=CURRENT_TIMESTAMP
WHERE provider_key='tiktok';

UPDATE provider_setup_authorities
SET required_config_keys_json='["YOUTUBE_CLIENT_ID","YOUTUBE_CLIENT_SECRET","YOUTUBE_REDIRECT_URI"]',
    setup_authority='I.T. / Google Cloud YouTube OAuth and Cloudflare secret references',
    updated_at=CURRENT_TIMESTAMP
WHERE provider_key='youtube';

-- Refresh YouTube readiness references without changing operator state/evidence history.
UPDATE it_provider_readiness_checks
SET config_reference='YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REDIRECT_URI',
    correction_mechanics='Create a Web OAuth client for the Development callback, store only YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in Cloudflare, register YOUTUBE_REDIRECT_URI exactly, request the minimum YouTube scopes, and keep provider publication disabled until controlled acceptance.',
    source_release=459,
    updated_at=CURRENT_TIMESTAMP
WHERE provider_key='youtube' AND environment='development' AND check_key='oauth-credentials';

-- Add callback-specific checks to existing social/video providers. ON CONFLICT preserves check_state/evidence.
INSERT INTO it_provider_readiness_checks
  (provider_key,environment,check_key,check_label,check_category,required_for_activation,check_state,config_reference,correction_mechanics,source_release)
VALUES
  ('pinterest','development','oauth-callback','Exact Pinterest OAuth callback registered','callback',1,'deferred','PINTEREST_REDIRECT_URI','Register the exact Development HTTPS callback /api/social/oauth/pinterest/callback in the Pinterest app and store the matching redirect reference in Cloudflare. Do not store OAuth tokens in D1.',459),
  ('meta','development','oauth-callback','Meta Facebook/Instagram callback set registered','callback',1,'deferred','META_REDIRECT_URI','Register the exact Development callback routes required by the Meta app for Facebook/Instagram and confirm META_REDIRECT_URI matches the chosen connection flow. Provider permissions/app review remain separate acceptance items.',459),
  ('tiktok','development','oauth-callback','Exact TikTok OAuth callback registered','callback',1,'deferred','TIKTOK_REDIRECT_URI','Register the exact Development HTTPS callback /api/social/oauth/tiktok/callback in the TikTok developer app. Keep provider execution disabled until consent and posting acceptance are complete.',459),
  ('youtube','development','oauth-callback','Exact YouTube OAuth callback registered','callback',1,'deferred','YOUTUBE_REDIRECT_URI','Register the exact Development HTTPS callback /api/social/oauth/youtube/callback in the Google OAuth client and use the same YOUTUBE_REDIRECT_URI reference in Cloudflare.',459),
  ('x','development','credentials','X OAuth application credentials configured','credentials',1,'deferred','X_CLIENT_ID / X_CLIENT_SECRET','Create the X developer application, keep raw credentials in Cloudflare only, and record only these reference names in I.T.',459),
  ('x','development','oauth-callback','Exact X OAuth callback registered','callback',1,'deferred','X_REDIRECT_URI','Register the exact Development HTTPS callback /api/social/oauth/x/callback and keep the redirect URI identical between the provider console and Cloudflare reference.',459),
  ('x','development','scopes','X posting/read scopes and refresh consent verified','scope',1,'deferred',NULL,'Use OAuth 2 Authorization Code with PKCE. Verify only required scopes for approved publishing/readback and offline refresh before provider acceptance.',459),
  ('x','development','connection-acceptance','Controlled X account connection acceptance passes','consent',1,'deferred',NULL,'Complete account authorization only after state/PKCE, encrypted token storage, refresh/disconnect controls and intended-account review are enabled. General publication remains disabled.',459)
ON CONFLICT(provider_key,environment,check_key) DO UPDATE SET
  check_label=excluded.check_label,
  check_category=excluded.check_category,
  required_for_activation=excluded.required_for_activation,
  config_reference=excluded.config_reference,
  correction_mechanics=excluded.correction_mechanics,
  source_release=459,
  updated_at=CURRENT_TIMESTAMP;

-- Fail-closed assertions surfaced as migration output for workflow verification.
SELECT COUNT(*) AS release459_provider_count FROM provider_setup_authorities;
SELECT provider_key, required_config_keys_json FROM provider_setup_authorities
WHERE provider_key IN ('stripe','paypal','etsy','pinterest','meta','x','tiktok','youtube')
ORDER BY provider_key;
SELECT COUNT(*) AS release459_x_check_count FROM it_provider_readiness_checks
WHERE provider_key='x' AND environment='development';
SELECT COUNT(*) AS release459_secret_value_column_count
FROM pragma_table_info('provider_setup_authorities')
WHERE lower(name) IN ('secret','secret_value','api_key','access_token','refresh_token','client_secret','password','private_key');
PRAGMA foreign_key_check;

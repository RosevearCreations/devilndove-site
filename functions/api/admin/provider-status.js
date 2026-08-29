import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE = 449;
const PROVIDER_TABLE = 'provider_setup_authorities';
const CHANNEL_TABLE = 'marketplace_channels';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db, name) {
  const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first();
  return Boolean(row?.name);
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const providersReady = await tableExists(db, PROVIDER_TABLE);
  const channelsReady = await tableExists(db, CHANNEL_TABLE);
  if (!providersReady || !channelsReady) {
    return jsonResponse({
      ok: true,
      release: RELEASE,
      owner: 'it',
      mode: 'read-only-provider-setup-authority',
      request_time_schema_mutation: false,
      schema_ready: false,
      missing_tables: [!providersReady ? PROVIDER_TABLE : null, !channelsReady ? CHANNEL_TABLE : null].filter(Boolean),
      providers: [],
      marketplace_channels: [],
      notes: ['Provider setup metadata is intentionally separate from secret values. Secrets are never returned by this endpoint.'],
    });
  }

  const providers = await db.prepare(`
    SELECT provider_key, display_name, provider_type, setup_authority, setup_url,
           required_config_keys_json, setup_status, enabled, last_verified_at,
           last_error, updated_at
    FROM provider_setup_authorities
    ORDER BY provider_type, display_name
  `).all();
  const channels = await db.prepare(`
    SELECT channel_key, display_name, provider_key, enabled, syndication_mode,
           publication_allowed, setup_status, updated_at
    FROM marketplace_channels
    ORDER BY display_name
  `).all();

  return jsonResponse({
    ok: true,
    release: RELEASE,
    owner: 'it',
    mode: 'read-only-provider-setup-authority',
    request_time_schema_mutation: false,
    schema_ready: true,
    providers: rows(providers),
    marketplace_channels: rows(channels),
    secret_values_exposed: false,
    notes: [
      'This authority reports setup requirements/status only; provider credentials remain in Cloudflare secrets or the provider itself.',
      'Marketplace publication is fail-closed unless publication_allowed is explicitly enabled in Development authority.',
    ],
  });
}

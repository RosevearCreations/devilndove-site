// Devil n Dove Build 362 — non-mutating Membership tier-policy read authority.
// GET/read paths never create or seed schema. Missing/empty policy state is represented
// with in-memory defaults plus explicit readiness metadata; retained POST compatibility
// remains responsible for any legacy write-time ensure/seed behavior until separately extracted.

export const BUILD = 362;
export const OWNER = 'operations';
export const TABLE = 'membership_tier_policies';

function text(value) {
  return String(value ?? '').trim();
}

export const DEFAULT_TIER_POLICIES = Object.freeze([
  Object.freeze({
    policy_id: 0,
    tier_code: 'bronze',
    title: 'Bronze',
    short_description: 'Entry membership tier for basic perks and updates.',
    benefits: Object.freeze(['Member badge', 'News and updates', 'Occasional coupon access']),
    badge_color: '#8c6239',
    sort_order: 10,
    is_visible: true,
    created_at: null,
    updated_at: null,
  }),
  Object.freeze({
    policy_id: 0,
    tier_code: 'silver',
    title: 'Silver',
    short_description: 'Mid-tier membership with stronger savings and earlier access.',
    benefits: Object.freeze(['Everything in Bronze', 'Better member discounts', 'Early access to select releases']),
    badge_color: '#a7adb5',
    sort_order: 20,
    is_visible: true,
    created_at: null,
    updated_at: null,
  }),
  Object.freeze({
    policy_id: 0,
    tier_code: 'gold',
    title: 'Gold',
    short_description: 'Top starter tier with best discounts and premium extras.',
    benefits: Object.freeze(['Everything in Silver', 'Best member discounts', 'Priority early access', 'Premium bonus perks']),
    badge_color: '#c9a227',
    sort_order: 30,
    is_visible: true,
    created_at: null,
    updated_at: null,
  }),
]);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function benefits(value) {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    return Array.isArray(parsed) ? parsed.map(text).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function mapTierPolicyRow(row) {
  return Object.freeze({
    policy_id: Number(row?.policy_id || 0),
    tier_code: text(row?.tier_code).toLowerCase(),
    title: text(row?.title),
    short_description: text(row?.short_description),
    benefits: Object.freeze(benefits(row?.benefits_json)),
    badge_color: text(row?.badge_color),
    sort_order: Number(row?.sort_order || 0),
    is_visible: Number(row?.is_visible || 0) === 1,
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
  });
}

async function tableExists(db) {
  try {
    const row = await db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`)
      .bind(TABLE)
      .first();
    return Boolean(row);
  } catch {
    return false;
  }
}

export async function readMembershipTierPolicies(db) {
  const schemaReady = await tableExists(db);
  if (!schemaReady) {
    return Object.freeze({
      build: BUILD,
      owner: OWNER,
      schema_ready: false,
      missing_tables: Object.freeze([TABLE]),
      request_time_schema_mutation: false,
      defaults_materialized: false,
      source: 'in-memory-defaults-missing-schema',
      items: DEFAULT_TIER_POLICIES,
    });
  }

  const result = await db.prepare(`
    SELECT
      policy_id,
      tier_code,
      title,
      short_description,
      benefits_json,
      badge_color,
      sort_order,
      is_visible,
      created_at,
      updated_at
    FROM membership_tier_policies
    ORDER BY sort_order ASC, tier_code ASC
  `).all();

  const stored = rows(result).map(mapTierPolicyRow);
  return Object.freeze({
    build: BUILD,
    owner: OWNER,
    schema_ready: true,
    missing_tables: Object.freeze([]),
    request_time_schema_mutation: false,
    defaults_materialized: stored.length > 0,
    source: stored.length ? 'database' : 'in-memory-defaults-empty-table',
    items: Object.freeze(stored.length ? stored : [...DEFAULT_TIER_POLICIES]),
  });
}

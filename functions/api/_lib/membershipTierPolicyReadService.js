// Devil n Dove Build 362 contract / Build 365 implementation hardening — non-mutating Membership tier-policy read authority.
// GET/read paths never create or seed schema. Build 365 removes fixed-column/sqlite_master assumptions
// so older compatible table shapes cannot collapse the read into an opaque 500. Retained POST compatibility
// remains responsible for any legacy write-time ensure/seed behavior until separately extracted.

export const BUILD = 362;
export const IMPLEMENTATION_BUILD = 365;
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
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  try {
    const parsed = JSON.parse(String(value || '[]'));
    return Array.isArray(parsed) ? parsed.map(text).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function mapTierPolicyRow(row) {
  const benefitSource = row?.benefits_json ?? row?.benefits ?? '[]';
  return Object.freeze({
    policy_id: Number(row?.policy_id ?? row?.id ?? 0),
    tier_code: text(row?.tier_code ?? row?.code).toLowerCase(),
    title: text(row?.title ?? row?.name),
    short_description: text(row?.short_description ?? row?.description),
    benefits: Object.freeze(benefits(benefitSource)),
    badge_color: text(row?.badge_color ?? row?.badge_colour),
    sort_order: Number(row?.sort_order ?? 0),
    is_visible: Number(row?.is_visible ?? 1) === 1,
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
  });
}

function missingTableError(error) {
  const message = text(error?.message || error).toLowerCase();
  return message.includes('no such table') && message.includes(TABLE.toLowerCase());
}

async function readStoredRows(db) {
  try {
    // SELECT * is deliberate during the compatibility window: Build 362 originally named
    // optional legacy columns explicitly, which can throw before readiness metadata is returned.
    // Mapping is tolerant; the read remains bounded to one known table and performs no mutation.
    const result = await db.prepare(`SELECT * FROM membership_tier_policies`).all();
    return Object.freeze({ schema_ready: true, rows: Object.freeze(rows(result)) });
  } catch (error) {
    if (missingTableError(error)) {
      return Object.freeze({ schema_ready: false, rows: Object.freeze([]) });
    }
    throw error;
  }
}

function sortPolicies(items) {
  return [...items].sort((a, b) => {
    const order = Number(a?.sort_order || 0) - Number(b?.sort_order || 0);
    if (order) return order;
    return text(a?.tier_code).localeCompare(text(b?.tier_code));
  });
}

export async function readMembershipTierPolicies(db) {
  const storedResult = await readStoredRows(db);
  if (!storedResult.schema_ready) {
    return Object.freeze({
      build: BUILD,
      implementation_build: IMPLEMENTATION_BUILD,
      owner: OWNER,
      schema_ready: false,
      missing_tables: Object.freeze([TABLE]),
      request_time_schema_mutation: false,
      defaults_materialized: false,
      source: 'in-memory-defaults-missing-schema',
      items: DEFAULT_TIER_POLICIES,
    });
  }

  const stored = sortPolicies(storedResult.rows.map(mapTierPolicyRow));
  return Object.freeze({
    build: BUILD,
    implementation_build: IMPLEMENTATION_BUILD,
    owner: OWNER,
    schema_ready: true,
    missing_tables: Object.freeze([]),
    request_time_schema_mutation: false,
    defaults_materialized: stored.length > 0,
    source: stored.length ? 'database' : 'in-memory-defaults-empty-table',
    items: Object.freeze(stored.length ? stored : [...DEFAULT_TIER_POLICIES]),
  });
}

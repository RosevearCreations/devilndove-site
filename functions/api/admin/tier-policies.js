import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";
import {
  BUILD as MEMBERSHIP_TIER_POLICY_READ_BUILD,
  IMPLEMENTATION_BUILD as MEMBERSHIP_TIER_POLICY_READ_IMPLEMENTATION_BUILD,
  mapTierPolicyRow,
  readMembershipTierPolicies,
} from "../_lib/membershipTierPolicyReadService.js";

const MUTATION_BUILD = 395;
const MUTATION_OWNER = 'operations';
const MIGRATION_AUTHORITY = 'database_membership_tier_policy_runtime_parity.sql';

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeCode(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeBenefits(value) {
  if (Array.isArray(value)) {
    return value.map((v) => normalizeText(v)).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|,/)
    .map((v) => normalizeText(v))
    .filter(Boolean);
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) {
    return jsonResponse({ ok: false, error: "Database binding is not configured." }, 500);
  }

  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) {
    return jsonResponse({ ok: false, error: "Admin access required." }, 401);
  }

  try {
    const read = await readMembershipTierPolicies(db);
    return jsonResponse({
      ok: true,
      build: MEMBERSHIP_TIER_POLICY_READ_BUILD,
      implementation_build: MEMBERSHIP_TIER_POLICY_READ_IMPLEMENTATION_BUILD,
      owner: MUTATION_OWNER,
      schema_ready: read.schema_ready,
      missing_tables: read.missing_tables,
      request_time_schema_mutation: false,
      defaults_materialized: read.defaults_materialized,
      source: read.source,
      items: read.items,
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      build: MEMBERSHIP_TIER_POLICY_READ_BUILD,
      implementation_build: MEMBERSHIP_TIER_POLICY_READ_IMPLEMENTATION_BUILD,
      owner: MUTATION_OWNER,
      request_time_schema_mutation: false,
      error_code: "membership_tier_policy_read_failed",
      error: String(error?.message || error || "Membership tier policy read failed."),
    }, 500);
  }
}

export async function onRequestPost(context) {
  const db = getDb(context.env);
  if (!db) {
    return jsonResponse({ ok: false, build: MUTATION_BUILD, error: "Database binding is not configured." }, 500);
  }

  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) {
    return jsonResponse({ ok: false, build: MUTATION_BUILD, error: "Admin access required." }, 401);
  }

  const readiness = await readMembershipTierPolicies(db);
  if (!readiness.schema_ready) {
    return jsonResponse({
      ok: false,
      build: MUTATION_BUILD,
      owner: MUTATION_OWNER,
      error_code: 'membership_tier_policy_schema_not_ready',
      error: 'Membership tier-policy schema is not ready. Apply the migration authority before saving policy changes.',
      schema_ready: false,
      missing_tables: readiness.missing_tables,
      migration_authority: MIGRATION_AUTHORITY,
      request_time_schema_mutation: false,
      request_time_default_seeding: false,
    }, 503);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ ok: false, build: MUTATION_BUILD, error: "Invalid JSON body." }, 400);
  }

  const tierCode = normalizeCode(body?.tier_code);
  const title = normalizeText(body?.title);
  const shortDescription = normalizeText(body?.short_description);
  const benefits = normalizeBenefits(body?.benefits);
  const badgeColor = normalizeText(body?.badge_color);
  const sortOrder = Number(body?.sort_order || 0);
  const isVisible = body?.is_visible === false ? 0 : 1;

  if (!tierCode) {
    return jsonResponse({ ok: false, build: MUTATION_BUILD, error: "tier_code is required." }, 400);
  }

  if (!title) {
    return jsonResponse({ ok: false, build: MUTATION_BUILD, error: "title is required." }, 400);
  }

  await db
    .prepare(`
      INSERT INTO membership_tier_policies (
        tier_code,
        title,
        short_description,
        benefits_json,
        badge_color,
        sort_order,
        is_visible,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(tier_code) DO UPDATE SET
        title = excluded.title,
        short_description = excluded.short_description,
        benefits_json = excluded.benefits_json,
        badge_color = excluded.badge_color,
        sort_order = excluded.sort_order,
        is_visible = excluded.is_visible,
        updated_at = CURRENT_TIMESTAMP
    `)
    .bind(
      tierCode,
      title,
      shortDescription,
      JSON.stringify(benefits),
      badgeColor,
      sortOrder,
      isVisible
    )
    .run();

  const row = await db
    .prepare(`
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
      WHERE tier_code = ?
      LIMIT 1
    `)
    .bind(tierCode)
    .first();

  return jsonResponse({
    ok: true,
    build: MUTATION_BUILD,
    owner: MUTATION_OWNER,
    migration_authority: MIGRATION_AUTHORITY,
    request_time_schema_mutation: false,
    request_time_default_seeding: false,
    item: mapTierPolicyRow(row),
  });
}

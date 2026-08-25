import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";
import {
  BUILD as MEMBERSHIP_TIER_POLICY_READ_BUILD,
  DEFAULT_TIER_POLICIES,
  mapTierPolicyRow,
  readMembershipTierPolicies,
} from "../_lib/membershipTierPolicyReadService.js";

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

// Retained write-side compatibility only. Build 362 GET/read paths never call this.
async function ensureTierPolicyTable(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS membership_tier_policies (
      policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
      tier_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL DEFAULT '',
      short_description TEXT NOT NULL DEFAULT '',
      benefits_json TEXT NOT NULL DEFAULT '[]',
      badge_color TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Retained write-side compatibility only. Build 362 GET/read paths never call this.
async function seedDefaultPolicies(db) {
  for (const item of DEFAULT_TIER_POLICIES) {
    await db
      .prepare(`
        INSERT INTO membership_tier_policies (
          tier_code, title, short_description, benefits_json, badge_color, sort_order, is_visible
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(tier_code) DO NOTHING
      `)
      .bind(
        item.tier_code,
        item.title,
        item.short_description,
        JSON.stringify(item.benefits || []),
        item.badge_color,
        item.sort_order,
        item.is_visible ? 1 : 0
      )
      .run();
  }
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

  const read = await readMembershipTierPolicies(db);
  return jsonResponse({
    ok: true,
    build: MEMBERSHIP_TIER_POLICY_READ_BUILD,
    owner: "operations",
    schema_ready: read.schema_ready,
    missing_tables: read.missing_tables,
    request_time_schema_mutation: false,
    defaults_materialized: read.defaults_materialized,
    source: read.source,
    items: read.items,
  });
}

export async function onRequestPost(context) {
  const db = getDb(context.env);
  if (!db) {
    return jsonResponse({ ok: false, error: "Database binding is not configured." }, 500);
  }

  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) {
    return jsonResponse({ ok: false, error: "Admin access required." }, 401);
  }

  await ensureTierPolicyTable(db);
  await seedDefaultPolicies(db);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const tierCode = normalizeCode(body?.tier_code);
  const title = normalizeText(body?.title);
  const shortDescription = normalizeText(body?.short_description);
  const benefits = normalizeBenefits(body?.benefits);
  const badgeColor = normalizeText(body?.badge_color);
  const sortOrder = Number(body?.sort_order || 0);
  const isVisible = body?.is_visible === false ? 0 : 1;

  if (!tierCode) {
    return jsonResponse({ ok: false, error: "tier_code is required." }, 400);
  }

  if (!title) {
    return jsonResponse({ ok: false, error: "title is required." }, 400);
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
    item: mapTierPolicyRow(row),
  });
}

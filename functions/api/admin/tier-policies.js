// File: /functions/api/admin/tier-policies.js
// Brief description: Admin policy editor for Bronze/Silver/Gold membership tiers.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}

async function ensureTables(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS membership_tier_policies (
      membership_tier_policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
      access_tier_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      short_description TEXT,
      benefits_json TEXT,
      badge_color TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_membership_tier_policies_sort ON membership_tier_policies(sort_order ASC, access_tier_code ASC)`).run();

  const seeds = [
    {
      code: "bronze",
      title: "Bronze",
      description: "A starter member tier for community updates and small perks.",
      benefits: ["Member badge", "News and release updates", "Occasional member coupon"],
      color: "#9a6a3a",
      sort_order: 10
    },
    {
      code: "silver",
      title: "Silver",
      description: "A stronger tier with earlier access and better discounts.",
      benefits: ["Everything in Bronze", "Better member discount", "Early access to launches and restocks"],
      color: "#8a97a6",
      sort_order: 20
    },
    {
      code: "gold",
      title: "Gold",
      description: "Top member tier with the best access and premium extras.",
      benefits: ["Everything in Silver", "Best launch access", "Premium bonus offers and surprise perks"],
      color: "#c8a74e",
      sort_order: 30
    }
  ];

  for (const seed of seeds) {
    await db.prepare(`
      INSERT OR IGNORE INTO membership_tier_policies (
        access_tier_code, title, short_description, benefits_json, badge_color, sort_order, is_visible
      ) VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(
      seed.code,
      seed.title,
      seed.description,
      JSON.stringify(seed.benefits),
      seed.color,
      seed.sort_order
    ).run();
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = getDb(env);
  await ensureTables(db);

  const adminUser = await getAdminUserFromRequest(env, request);
  if (!adminUser?.ok) return json({ ok: false, error: "Admin authentication required." }, 401);

  if (request.method === "GET") {
    const rows = await db.prepare(`
      SELECT membership_tier_policy_id, access_tier_code, title, short_description, benefits_json, badge_color, sort_order, is_visible, created_at, updated_at
      FROM membership_tier_policies
      ORDER BY sort_order ASC, access_tier_code ASC
    `).all();
    return json({ ok: true, tier_policies: rows.results || [] });
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const access_tier_code = normalizeText(body.access_tier_code).toLowerCase();
  const title = normalizeText(body.title) || access_tier_code.toUpperCase();
  const short_description = normalizeText(body.short_description) || null;
  const benefits = Array.isArray(body.benefits)
    ? body.benefits.map((item) => normalizeText(item)).filter(Boolean)
    : String(body.benefits_text || "")
        .split(/\r?\n/)
        .map((item) => normalizeText(item))
        .filter(Boolean);
  const benefits_json = JSON.stringify(benefits);
  const badge_color = normalizeText(body.badge_color) || null;
  const sort_order = Number(body.sort_order || 0);
  const is_visible = Number(body.is_visible === false ? 0 : body.is_visible || 1) ? 1 : 0;

  if (!access_tier_code) {
    return json({ ok: false, error: "access_tier_code is required." }, 400);
  }

  await db.prepare(`
    INSERT INTO membership_tier_policies (
      access_tier_code, title, short_description, benefits_json, badge_color, sort_order, is_visible, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(access_tier_code) DO UPDATE SET
      title = excluded.title,
      short_description = excluded.short_description,
      benefits_json = excluded.benefits_json,
      badge_color = excluded.badge_color,
      sort_order = excluded.sort_order,
      is_visible = excluded.is_visible,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    access_tier_code,
    title,
    short_description,
    benefits_json,
    badge_color,
    sort_order,
    is_visible
  ).run();

  await auditAdminAction(env, request, adminUser, {
    action_type: "membership_tier_policy_upserted",
    action_summary: `Updated membership tier policy ${access_tier_code}.`,
    action_details: { access_tier_code, title, benefit_count: benefits.length }
  });

  const row = await db.prepare(`SELECT * FROM membership_tier_policies WHERE access_tier_code = ? LIMIT 1`).bind(access_tier_code).first();
  return json({ ok: true, tier_policy: row });
}

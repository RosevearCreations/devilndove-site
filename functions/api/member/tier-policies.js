// File: /functions/api/member/tier-policies.js
// Brief description: Returns visible membership tier policies and highlights the member's active tiers.

import { getDb, jsonResponse } from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
}

async function getMemberUserFromRequest(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(`
    SELECT s.user_id, u.role, u.is_active
    FROM sessions s JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?) AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token, token).first();
  if (!session || Number(session.is_active||0)!==1) return null;
  if (!["member","admin"].includes(String(session.role||'').toLowerCase())) return null;
  return { user_id:Number(session.user_id||0) };
}

async function ensureTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS membership_tier_policies (
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
  )`).run();
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  await ensureTables(db);
  const user = await getMemberUserFromRequest(request, env);
  if (!user) return json({ ok:false, error:'Unauthorized.'}, 401);
  const activeRows = await db.prepare(`
    SELECT lower(at.code) AS code
    FROM user_access_tiers uat
    JOIN access_tiers at ON at.access_tier_id = uat.access_tier_id
    WHERE uat.user_id = ?
  `).bind(user.user_id).all();
  const active = new Set((activeRows.results||[]).map(r=>String(r.code||'').toLowerCase()));
  const rows = await db.prepare(`
    SELECT access_tier_code, title, short_description, benefits_json, badge_color, sort_order, is_visible
    FROM membership_tier_policies
    WHERE is_visible = 1
    ORDER BY sort_order ASC, access_tier_code ASC
  `).all();
  const tier_policies = (rows.results||[]).map(r=>({
    ...r,
    benefits: (()=>{ try { const arr=JSON.parse(r.benefits_json||'[]'); return Array.isArray(arr)?arr:[]; } catch { return []; } })(),
    is_active: active.has(String(r.access_tier_code||'').toLowerCase())
  }));
  return json({ ok:true, tier_policies });
}

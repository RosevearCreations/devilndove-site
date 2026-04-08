import { getAdminUserFromRequest, getDb, jsonResponse, auditAdminAction, normalizeText } from "../_lib/adminAudit.js";

const DEFAULT_POLICIES = [
  { code: 'bronze', name: 'Bronze', display_title: 'Bronze Member', short_description: 'A simple starter tier with member updates and occasional offers.', benefits: ['Member badge', 'Store news and updates', 'Occasional starter offer'], badge_color: '#8b6b3f', is_visible: 1 },
  { code: 'silver', name: 'Silver', display_title: 'Silver Member', short_description: 'A stronger member tier with better savings and earlier access.', benefits: ['Everything in Bronze', 'Better member savings', 'Earlier access to selected launches'], badge_color: '#8d98a7', is_visible: 1 },
  { code: 'gold', name: 'Gold', display_title: 'Gold Member', short_description: 'The most supportive starter tier with strongest early access and premium perks.', benefits: ['Everything in Silver', 'Best early access', 'Premium member extras when available'], badge_color: '#c8a84d', is_visible: 1 }
];

function normalizeResults(result){ return Array.isArray(result?.results) ? result.results : []; }
function normalizeBenefits(value){ if (Array.isArray(value)) return value.map((v) => normalizeText(v)).filter(Boolean); return String(value || '').split(/
+/).map((v) => normalizeText(v)).filter(Boolean); }

async function ensureTable(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS membership_tier_policies (
    membership_tier_policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    display_title TEXT,
    short_description TEXT,
    benefits_json TEXT,
    badge_color TEXT,
    is_visible INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  for (let index = 0; index < DEFAULT_POLICIES.length; index += 1) {
    const row = DEFAULT_POLICIES[index];
    await db.prepare(`INSERT INTO membership_tier_policies (code,name,display_title,short_description,benefits_json,badge_color,is_visible,sort_order,updated_at)
      VALUES (?,?,?,?,?,?,?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(code) DO NOTHING`).bind(row.code,row.name,row.display_title,row.short_description,JSON.stringify(row.benefits),row.badge_color,row.is_visible,index+1).run();
  }
}

export async function onRequestGet(context){
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok:false, error:'Admin access required.' }, 401);
  const db = getDb(context.env); if (!db) return jsonResponse({ ok:false, error:'Database binding is not configured.' }, 500);
  await ensureTable(db);
  const result = await db.prepare(`SELECT membership_tier_policy_id, code, name, display_title, short_description, benefits_json, badge_color, is_visible, sort_order, created_at, updated_at FROM membership_tier_policies ORDER BY sort_order ASC, code ASC`).all();
  return jsonResponse({ ok:true, policies: normalizeResults(result).map((row) => ({ ...row, benefits: JSON.parse(row.benefits_json || '[]') })) });
}

export async function onRequestPost(context){
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok:false, error:'Admin access required.' }, 401);
  const db = getDb(context.env); if (!db) return jsonResponse({ ok:false, error:'Database binding is not configured.' }, 500);
  await ensureTable(db);
  let body={}; try { body = await context.request.json(); } catch {}
  const code = normalizeText(body.code).toLowerCase();
  const defaults = DEFAULT_POLICIES.find((row) => row.code === code);
  if (!defaults) return jsonResponse({ ok:false, error:'A valid tier code is required.' }, 400);
  const display_title = normalizeText(body.display_title) || defaults.display_title;
  const short_description = normalizeText(body.short_description) || defaults.short_description;
  const benefits = normalizeBenefits(body.benefits).length ? normalizeBenefits(body.benefits) : defaults.benefits;
  const badge_color = normalizeText(body.badge_color) || defaults.badge_color;
  const is_visible = body.is_visible === false || body.is_visible === 0 ? 0 : 1;
  await db.prepare(`UPDATE membership_tier_policies SET display_title=?, short_description=?, benefits_json=?, badge_color=?, is_visible=?, updated_at=CURRENT_TIMESTAMP WHERE code=?`).bind(display_title, short_description, JSON.stringify(benefits), badge_color, is_visible, code).run();
  await auditAdminAction(context.env, context.request, adminUser, { action_type:'save_tier_policy', target_type:'membership_tier_policy', target_key:code, details:{ display_title, is_visible } });
  return jsonResponse({ ok:true });
}

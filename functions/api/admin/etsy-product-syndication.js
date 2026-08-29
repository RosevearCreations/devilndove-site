import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE = 449;
const TABLE = 'marketplace_syndication_drafts';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db) {
  const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(TABLE).first();
  return Boolean(row?.name);
}

async function requireAdmin(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { response: jsonResponse({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { response: jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

export async function onRequestGet(context) {
  const auth = await requireAdmin(context);
  if (auth.response) return auth.response;
  if (!(await tableExists(auth.db))) {
    return jsonResponse({ ok: true, release: RELEASE, owner: 'storefront', schema_ready: false, drafts: [], request_time_schema_mutation: false });
  }
  const result = await auth.db.prepare(`
    SELECT id, channel_key, product_id, draft_title, status, external_reference,
           last_validation_error, created_at, updated_at
    FROM marketplace_syndication_drafts
    WHERE channel_key='etsy'
    ORDER BY updated_at DESC
    LIMIT 200
  `).all();
  return jsonResponse({
    ok: true,
    release: RELEASE,
    owner: 'storefront',
    mode: 'draft-first-etsy-syndication',
    schema_ready: true,
    publication_performed: false,
    drafts: rows(result),
  });
}

export async function onRequestPost(context) {
  const auth = await requireAdmin(context);
  if (auth.response) return auth.response;
  if (!(await tableExists(auth.db))) {
    return jsonResponse({ ok: false, release: RELEASE, schema_ready: false, error: 'Release 449 Development schema is not ready; no draft was created.' }, 409);
  }

  let body = {};
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'Valid JSON body required.' }, 400); }
  const productId = String(body?.product_id || '').trim();
  const draftTitle = String(body?.title || body?.draft_title || '').trim();
  if (!productId) return jsonResponse({ ok: false, error: 'product_id is required.' }, 400);
  if (!draftTitle) return jsonResponse({ ok: false, error: 'title is required for an Etsy draft.' }, 400);

  const id = crypto.randomUUID();
  const payload = {
    title: draftTitle,
    description: String(body?.description || ''),
    tags: Array.isArray(body?.tags) ? body.tags.map((value) => String(value).trim()).filter(Boolean).slice(0, 13) : [],
    price: body?.price == null ? null : Number(body.price),
    quantity: body?.quantity == null ? null : Math.max(0, Math.trunc(Number(body.quantity) || 0)),
    image_keys: Array.isArray(body?.image_keys) ? body.image_keys.map((value) => String(value).trim()).filter(Boolean) : [],
  };

  await auth.db.prepare(`
    INSERT INTO marketplace_syndication_drafts
      (id, channel_key, product_id, draft_title, payload_json, status, publication_requested, created_by, created_at, updated_at)
    VALUES (?, 'etsy', ?, ?, ?, 'draft', 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(id, productId, draftTitle, JSON.stringify(payload), String(auth.adminUser?.email || auth.adminUser?.id || 'admin')).run();

  return jsonResponse({
    ok: true,
    release: RELEASE,
    owner: 'storefront',
    mode: 'draft-first-etsy-syndication',
    draft: { id, channel_key: 'etsy', product_id: productId, title: draftTitle, status: 'draft' },
    publication_requested: false,
    publication_performed: false,
    note: 'Release 449 creates a local reviewed Etsy draft only. It does not call Etsy or publish a listing.',
  }, 201);
}

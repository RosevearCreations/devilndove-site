// File: /functions/api/admin/product-story-notes.js
// Brief description: Admin-only editor API for approved public product story notes.
// Stories are review-first so product pages can show maker/process/local-trust copy without
// requiring raw SQL edits or exposing private drafting notes.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data, status = 200) {
  return jsonResponse(data, status);
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function toId(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function trimTo(value, limit) {
  const clean = normalizeText(value);
  if (!clean) return '';
  return clean.length > limit ? clean.slice(0, limit).trim() : clean;
}

function normalizeStatus(value) {
  const clean = normalizeText(value).toLowerCase();
  if (['draft', 'review', 'approved', 'published', 'archived'].includes(clean)) return clean;
  return 'draft';
}

function normalizePrivacyStatus(value) {
  const clean = normalizeText(value).toLowerCase();
  if (['safe', 'needs_review', 'private_detail_removed', 'blocked'].includes(clean)) return clean;
  return 'needs_review';
}

async function getColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_story_public_notes (
    product_story_public_note_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    story_heading TEXT,
    story_summary TEXT,
    story_body TEXT,
    process_notes TEXT,
    care_notes TEXT,
    local_pickup_note TEXT,
    display_status TEXT NOT NULL DEFAULT 'draft',
    created_by_user_id INTEGER,
    updated_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
  )`).run();

  const cols = await getColumnSet(db, 'product_story_public_notes');
  const optional = [
    ['story_source', 'ALTER TABLE product_story_public_notes ADD COLUMN story_source TEXT'],
    ['privacy_status', "ALTER TABLE product_story_public_notes ADD COLUMN privacy_status TEXT DEFAULT 'needs_review'"],
    ['review_notes', 'ALTER TABLE product_story_public_notes ADD COLUMN review_notes TEXT'],
    ['internal_notes', 'ALTER TABLE product_story_public_notes ADD COLUMN internal_notes TEXT']
  ];

  for (const [name, sql] of optional) {
    if (!cols.has(name)) await db.prepare(sql).run().catch(() => null);
  }

  await db.prepare('CREATE INDEX IF NOT EXISTS idx_product_story_public_notes_product ON product_story_public_notes(product_id, display_status, updated_at)').run().catch(() => null);
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_product_story_public_notes_status ON product_story_public_notes(display_status, privacy_status, updated_at)').run().catch(() => null);
}

function storyFromProduct(product = {}) {
  const name = normalizeText(product.name) || 'this piece';
  const origin = normalizeText(product.merchandise_origin);
  const era = normalizeText(product.era_label);
  const condition = normalizeText(product.condition_summary);
  const shortDescription = normalizeText(product.short_description);
  const sourcing = normalizeText(product.sourcing_notes);
  const category = normalizeText(product.product_category || product.product_type);

  const heading = `The story behind ${name}`;
  const summary = shortDescription || [origin, category, era].filter(Boolean).join(' · ') || 'A Devil n Dove workshop piece prepared for the storefront.';
  const bodyParts = [];

  if (shortDescription) bodyParts.push(shortDescription);
  if (sourcing) bodyParts.push(`Background: ${sourcing}`);
  if (origin || era || condition) {
    bodyParts.push([origin ? `Origin: ${origin}` : '', era ? `Era/period: ${era}` : '', condition ? `Condition: ${condition}` : ''].filter(Boolean).join(' · '));
  }
  if (!bodyParts.length) bodyParts.push('Add a short public-safe note about how this product was made, found, finished, cleaned, photographed, or prepared for the shop.');

  return {
    story_heading: heading,
    story_summary: summary,
    story_body: bodyParts.join('\n\n'),
    process_notes: '',
    care_notes: '',
    local_pickup_note: 'Made, gathered, or prepared by Devil n Dove in Southern Ontario. Local pickup or shipping details can be confirmed before checkout.'
  };
}

async function listPayload(db) {
  await ensureSchema(db);

  const products = rows(await db.prepare(`
    SELECT product_id, name, slug, sku, status, product_type, product_category, merchandise_origin,
           short_description, sourcing_notes, condition_summary, era_label, featured_image_url, updated_at
    FROM products
    ORDER BY datetime(COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)) DESC, product_id DESC
    LIMIT 250
  `).all().catch(() => ({ results: [] })));

  const notes = rows(await db.prepare(`
    SELECT n.*, p.name AS product_name, p.slug AS product_slug, p.sku AS product_sku, p.featured_image_url
    FROM product_story_public_notes n
    LEFT JOIN products p ON p.product_id = n.product_id
    ORDER BY datetime(COALESCE(n.updated_at, n.created_at, CURRENT_TIMESTAMP)) DESC, n.product_story_public_note_id DESC
    LIMIT 250
  `).all().catch(() => ({ results: [] })));

  const open_reviews = notes.filter((row) => ['draft', 'review'].includes(String(row.display_status || 'draft').toLowerCase())).length;
  const approved = notes.filter((row) => ['approved', 'published'].includes(String(row.display_status || '').toLowerCase())).length;
  const blocked = notes.filter((row) => String(row.privacy_status || '').toLowerCase() === 'blocked').length;

  return { ok: true, products, notes, summary: { products: products.length, notes: notes.length, open_reviews, approved, blocked } };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function saveNote(db, body, adminUser) {
  await ensureSchema(db);

  const noteId = toId(body.product_story_public_note_id || body.note_id);
  const productId = toId(body.product_id);
  if (!productId) return { ok: false, error: 'Choose a product before saving a story note.', status: 400 };

  const product = await db.prepare('SELECT product_id, name FROM products WHERE product_id = ? LIMIT 1').bind(productId).first().catch(() => null);
  if (!product) return { ok: false, error: 'Product was not found.', status: 404 };

  const displayStatus = normalizeStatus(body.display_status);
  const privacyStatus = normalizePrivacyStatus(body.privacy_status);

  const values = {
    product_id: productId,
    story_heading: trimTo(body.story_heading, 180),
    story_summary: trimTo(body.story_summary, 500),
    story_body: trimTo(body.story_body, 5000),
    process_notes: trimTo(body.process_notes, 2000),
    care_notes: trimTo(body.care_notes, 1200),
    local_pickup_note: trimTo(body.local_pickup_note, 800),
    display_status: displayStatus,
    story_source: trimTo(body.story_source || 'admin_editor', 80),
    privacy_status: privacyStatus,
    review_notes: trimTo(body.review_notes, 1200),
    internal_notes: trimTo(body.internal_notes, 1200),
    updated_by_user_id: Number(adminUser.user_id || 0) || null
  };

  if (!values.story_heading && !values.story_summary && !values.story_body) {
    return { ok: false, error: 'Add at least a heading, summary, or story body before saving.', status: 400 };
  }

  if (['approved', 'published'].includes(displayStatus) && privacyStatus === 'blocked') {
    return { ok: false, error: 'Blocked story notes cannot be approved or published.', status: 400 };
  }

  if (noteId) {
    await db.prepare(`
      UPDATE product_story_public_notes
      SET product_id = ?, story_heading = ?, story_summary = ?, story_body = ?, process_notes = ?, care_notes = ?,
          local_pickup_note = ?, display_status = ?, story_source = ?, privacy_status = ?, review_notes = ?,
          internal_notes = ?, updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE product_story_public_note_id = ?
    `).bind(
      values.product_id, values.story_heading || null, values.story_summary || null, values.story_body || null,
      values.process_notes || null, values.care_notes || null, values.local_pickup_note || null,
      values.display_status, values.story_source || null, values.privacy_status, values.review_notes || null,
      values.internal_notes || null, values.updated_by_user_id, noteId
    ).run();
  } else {
    const insert = await db.prepare(`
      INSERT INTO product_story_public_notes (
        product_id, story_heading, story_summary, story_body, process_notes, care_notes, local_pickup_note,
        display_status, story_source, privacy_status, review_notes, internal_notes, created_by_user_id,
        updated_by_user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      values.product_id, values.story_heading || null, values.story_summary || null, values.story_body || null,
      values.process_notes || null, values.care_notes || null, values.local_pickup_note || null,
      values.display_status, values.story_source || null, values.privacy_status, values.review_notes || null,
      values.internal_notes || null, Number(adminUser.user_id || 0) || null, values.updated_by_user_id
    ).run();
    values.product_story_public_note_id = Number(insert?.meta?.last_row_id || 0) || null;
  }

  return { ok: true, message: 'Product story note saved.', note: values };
}

async function seedFromProduct(db, body, adminUser) {
  await ensureSchema(db);
  const productId = toId(body.product_id);
  if (!productId) return { ok: false, error: 'Choose a product first.', status: 400 };

  const product = await db.prepare(`
    SELECT product_id, name, slug, sku, product_type, product_category, merchandise_origin,
           short_description, sourcing_notes, condition_summary, era_label
    FROM products
    WHERE product_id = ?
    LIMIT 1
  `).bind(productId).first().catch(() => null);

  if (!product) return { ok: false, error: 'Product was not found.', status: 404 };

  const story = storyFromProduct(product);
  const insert = await db.prepare(`
    INSERT INTO product_story_public_notes (
      product_id, story_heading, story_summary, story_body, process_notes, care_notes, local_pickup_note,
      display_status, story_source, privacy_status, review_notes, created_by_user_id, updated_by_user_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', 'product_seed', 'needs_review', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    productId, story.story_heading, story.story_summary, story.story_body, story.process_notes || null,
    story.care_notes || null, story.local_pickup_note || null,
    'Seeded from existing product fields. Review for privacy and wording before publishing.',
    Number(adminUser.user_id || 0) || null, Number(adminUser.user_id || 0) || null
  ).run();

  return { ok: true, message: 'Draft story note seeded from product fields.', note_id: Number(insert?.meta?.last_row_id || 0) || null };
}

async function updateStatus(db, body, adminUser) {
  await ensureSchema(db);
  const noteId = toId(body.product_story_public_note_id || body.note_id);
  if (!noteId) return { ok: false, error: 'Choose a story note first.', status: 400 };

  const displayStatus = normalizeStatus(body.display_status);
  const privacyStatus = body.privacy_status ? normalizePrivacyStatus(body.privacy_status) : null;
  const reviewNotes = trimTo(body.review_notes, 1200);

  const existing = await db.prepare('SELECT * FROM product_story_public_notes WHERE product_story_public_note_id = ? LIMIT 1').bind(noteId).first().catch(() => null);
  if (!existing) return { ok: false, error: 'Story note was not found.', status: 404 };

  const finalPrivacy = privacyStatus || normalizePrivacyStatus(existing.privacy_status || 'needs_review');
  if (['approved', 'published'].includes(displayStatus) && finalPrivacy === 'blocked') {
    return { ok: false, error: 'Blocked story notes cannot be approved or published.', status: 400 };
  }

  await db.prepare(`
    UPDATE product_story_public_notes
    SET display_status = ?, privacy_status = ?, review_notes = COALESCE(NULLIF(?, ''), review_notes),
        updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE product_story_public_note_id = ?
  `).bind(displayStatus, finalPrivacy, reviewNotes || '', Number(adminUser.user_id || 0) || null, noteId).run();

  return { ok: true, message: `Story note marked ${displayStatus}.` };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  try {
    return json(await listPayload(db));
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'admin_products',
      incident_code: 'product_story_notes_list_failed',
      severity: 'error',
      message: 'Product story notes list failed.',
      details: { error: error?.message || String(error || 'Unknown error') }
    }).catch(() => null);
    return json({ ok: false, error: error?.message || 'Could not load product story notes.' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  try {
    const body = await readJson(request);
    const action = normalizeText(body.action || 'save').toLowerCase();
    let result;

    if (action === 'list') result = await listPayload(db);
    else if (action === 'seed_from_product') result = await seedFromProduct(db, body, adminUser);
    else if (action === 'status') result = await updateStatus(db, body, adminUser);
    else result = await saveNote(db, body, adminUser);

    if (!result.ok) return json({ ok: false, error: result.error || 'Story note action failed.' }, result.status || 400);

    await auditAdminAction(env, request, adminUser, {
      action_type: `product_story_${action}`,
      target_type: 'product_story_public_notes',
      target_id: toId(body.product_story_public_note_id || body.note_id) || result.note_id || result.note?.product_story_public_note_id || null,
      details: { action, product_id: toId(body.product_id), display_status: body.display_status || null, privacy_status: body.privacy_status || null }
    }).catch(() => null);

    return json(result);
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'admin_products',
      incident_code: 'product_story_notes_save_failed',
      severity: 'error',
      message: 'Product story note save failed.',
      details: { error: error?.message || String(error || 'Unknown error') }
    }).catch(() => null);
    return json({ ok: false, error: error?.message || 'Could not save product story note.' }, 500);
  }
}

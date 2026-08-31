// File: /functions/api/admin/product-images.js
// Brief description: Gets and updates ordered product images so product media, annotations,
// image roles, public-use status, consent links, product_image_role_reference, and storefront rendering can be managed
// together from the admin interface.

import { createSchemaSafeD1 } from '../_lib/schemaSafeD1.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function normalizeText(value) {
  return String(value || '').trim();
}

function getDb(env) {
  return createSchemaSafeD1(env.DB || env.DD_DB || null);
}

function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
}

async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;
  const db = getDb(env);
  if (!db) return null;

  const session = await db.prepare(`
    SELECT s.session_id, s.user_id, u.user_id AS resolved_user_id, u.email, u.display_name, u.role, u.is_active
    FROM sessions s
    INNER JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?)
      AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token, token).first().catch(() => null);

  if (!session) return null;
  if (Number(session.is_active || 0) !== 1) return null;
  if (String(session.role || '').toLowerCase() !== 'admin') return null;
  return {
    user_id: Number(session.resolved_user_id || session.user_id || 0),
    email: session.email || '',
    display_name: session.display_name || ''
  };
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(normalizeResults(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function ensureColumn(db, tableName, columnName, alterSql, columnSet = null) {
  const existing = columnSet || await getTableColumnSet(db, tableName);
  if (existing.has(columnName)) return existing;
  await db.prepare(alterSql).run().catch(() => null);
  return await getTableColumnSet(db, tableName);
}

async function ensureProductImageTables(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS product_images (
      product_image_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      alt_text TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run().catch(() => null);

  // Some early databases used a display-order field or had no order field at all.
  // Give the media editor one stable order column before it reads or updates rows.
  let imageCols = await getTableColumnSet(db, 'product_images');
  if (!imageCols.has('sort_order')) {
    imageCols = await ensureColumn(db, 'product_images', 'sort_order', 'ALTER TABLE product_images ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0', imageCols);
    if (imageCols.has('display_order')) {
      await db.prepare('UPDATE product_images SET sort_order = COALESCE(display_order, sort_order, 0) WHERE sort_order IS NULL OR sort_order = 0').run().catch(() => null);
    }
  }

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS product_image_annotations (
      product_image_annotation_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_image_id INTEGER,
      image_url TEXT,
      alt_text TEXT,
      image_title TEXT,
      caption TEXT,
      focal_point_x REAL,
      focal_point_y REAL,
      annotation_notes TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run().catch(() => null);
}

async function ensureAnnotationColumns(db) {
  await ensureProductImageTables(db);
  let annotationCols = await getTableColumnSet(db, 'product_image_annotations');
  const statements = [
    ['width_px', 'ALTER TABLE product_image_annotations ADD COLUMN width_px INTEGER'],
    ['height_px', 'ALTER TABLE product_image_annotations ADD COLUMN height_px INTEGER'],
    ['image_orientation', 'ALTER TABLE product_image_annotations ADD COLUMN image_orientation TEXT'],
    ['crop_x', 'ALTER TABLE product_image_annotations ADD COLUMN crop_x REAL'],
    ['crop_y', 'ALTER TABLE product_image_annotations ADD COLUMN crop_y REAL'],
    ['crop_width', 'ALTER TABLE product_image_annotations ADD COLUMN crop_width REAL'],
    ['crop_height', 'ALTER TABLE product_image_annotations ADD COLUMN crop_height REAL'],
    ['first_image_score', 'ALTER TABLE product_image_annotations ADD COLUMN first_image_score INTEGER'],
    ['background_consistency_score', 'ALTER TABLE product_image_annotations ADD COLUMN background_consistency_score INTEGER'],
    ['subject_fill_score', 'ALTER TABLE product_image_annotations ADD COLUMN subject_fill_score INTEGER'],
    ['sharpness_score', 'ALTER TABLE product_image_annotations ADD COLUMN sharpness_score INTEGER'],
    ['brightness_score', 'ALTER TABLE product_image_annotations ADD COLUMN brightness_score INTEGER'],
    ['contrast_score', 'ALTER TABLE product_image_annotations ADD COLUMN contrast_score INTEGER'],
    ['angle_group', 'ALTER TABLE product_image_annotations ADD COLUMN angle_group TEXT'],
    ['shot_style', 'ALTER TABLE product_image_annotations ADD COLUMN shot_style TEXT'],
    ['merchandising_score', 'ALTER TABLE product_image_annotations ADD COLUMN merchandising_score INTEGER'],
    ['merchandising_override_reason', 'ALTER TABLE product_image_annotations ADD COLUMN merchandising_override_reason TEXT'],
    ['merchandising_override_note', 'ALTER TABLE product_image_annotations ADD COLUMN merchandising_override_note TEXT'],
    ['image_role', 'ALTER TABLE product_image_annotations ADD COLUMN image_role TEXT'],
    ['public_use_status', "ALTER TABLE product_image_annotations ADD COLUMN public_use_status TEXT DEFAULT 'internal_review'"],
    ['consent_record_id', 'ALTER TABLE product_image_annotations ADD COLUMN consent_record_id INTEGER'],
    ['role_review_notes', 'ALTER TABLE product_image_annotations ADD COLUMN role_review_notes TEXT']
  ];

  for (const [name, sql] of statements) {
    annotationCols = await ensureColumn(db, 'product_image_annotations', name, sql, annotationCols);
  }
  return annotationCols;
}

async function ensureMediaScoreHistoryTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS product_media_score_history (
      product_media_score_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      actor_user_id INTEGER,
      image_count INTEGER NOT NULL DEFAULT 0,
      lead_image_score INTEGER,
      gallery_merchandising_score INTEGER,
      weak_image_count INTEGER NOT NULL DEFAULT 0,
      weak_unapproved_image_count INTEGER NOT NULL DEFAULT 0,
      overridden_image_count INTEGER NOT NULL DEFAULT 0,
      override_reasons_json TEXT,
      source TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_product_media_score_history_product_id_created_at ON product_media_score_history(product_id, created_at DESC)`).run().catch(() => null);
}

function parseOptionalNumber(value) {
  if (value == null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseOptionalPercent(value) {
  const numeric = parseOptionalNumber(value);
  if (numeric == null) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeRole(value, index = 0) {
  const clean = normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const allowed = new Set(['hero_front', 'detail_texture', 'scale_context', 'back_side', 'process_story', 'packaging_pickup', 'material_tool_proof', 'gallery_support']);
  if (allowed.has(clean)) return clean;
  return index === 0 ? 'hero_front' : 'gallery_support';
}

function normalizePublicUseStatus(value) {
  const clean = normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const allowed = new Set(['internal_review', 'product_page_ok', 'social_ok', 'all_public_ok', 'consent_needed', 'blocked']);
  return allowed.has(clean) ? clean : 'internal_review';
}

function scoreForRow(row = {}) {
  const score = parseOptionalPercent(row.merchandising_score ?? row.first_image_score);
  return score == null ? 0 : score;
}

function hasOverrideReason(row = {}) {
  return normalizeText(row.merchandising_override_reason).length > 0;
}

function summarizeRows(rows = []) {
  const leadRow = rows[0] || null;
  const leadImageScore = leadRow ? scoreForRow(leadRow) : 0;
  const imageCount = rows.length;
  const galleryMerchandisingScore = imageCount
    ? Math.round(rows.reduce((sum, row) => sum + scoreForRow(row), 0) / imageCount)
    : 0;
  const weakRows = rows.filter((row) => scoreForRow(row) < 64);
  const overriddenRows = rows.filter((row) => hasOverrideReason(row));
  const weakUnapprovedRows = rows.filter((row, index) => {
    if (index === 0) return scoreForRow(row) < 72;
    return scoreForRow(row) < 64 && !hasOverrideReason(row);
  });
  const overrideReasonCounts = {};
  const roleCounts = {};
  for (const row of rows) {
    const role = normalizeRole(row.image_role, rows.indexOf(row));
    roleCounts[role] = Number(roleCounts[role] || 0) + 1;
  }
  for (const row of overriddenRows) {
    const key = normalizeText(row.merchandising_override_reason).toLowerCase() || 'other';
    overrideReasonCounts[key] = Number(overrideReasonCounts[key] || 0) + 1;
  }
  return {
    image_count: imageCount,
    lead_image_score: leadImageScore,
    gallery_merchandising_score: galleryMerchandisingScore,
    weak_image_count: weakRows.length,
    weak_unapproved_image_count: weakUnapprovedRows.length,
    overridden_image_count: overriddenRows.length,
    override_reasons: overrideReasonCounts,
    role_counts: roleCounts,
    missing_role_count: rows.filter((row, index) => !normalizeText(row.image_role) && index > 0).length,
    consent_needed_count: rows.filter((row) => normalizePublicUseStatus(row.public_use_status) === 'consent_needed').length,
    blocked_public_use_count: rows.filter((row) => normalizePublicUseStatus(row.public_use_status) === 'blocked').length
  };
}

function selectAnnotationColumn(annotationCols, columnName, fallbackSql) {
  return annotationCols.has(columnName) ? `pia.${columnName}` : `${fallbackSql} AS ${columnName}`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  // Build 245: schema is migration-owned; GET never creates/alters tables or runs PRAGMA.
  const annotationCols = new Set(['width_px','height_px','image_orientation','crop_x','crop_y','crop_width','crop_height','first_image_score','background_consistency_score','subject_fill_score','sharpness_score','brightness_score','contrast_score','angle_group','shot_style','merchandising_score','merchandising_override_reason','merchandising_override_note','image_role','public_use_status','consent_record_id','role_review_notes']);

  const product_id = Number(new URL(request.url).searchParams.get('product_id'));
  if (!Number.isInteger(product_id) || product_id <= 0) return json({ ok: false, error: 'A valid product_id is required.' }, 400);

  const rawImages = normalizeResults(await db.prepare(`
    SELECT pi.product_image_id, pi.product_id, pi.image_url, pi.alt_text, pi.sort_order, pi.created_at,
           pia.image_title, pia.caption, pia.focal_point_x, pia.focal_point_y, pia.annotation_notes,
           ${selectAnnotationColumn(annotationCols, 'width_px', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'height_px', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'image_orientation', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'crop_x', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'crop_y', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'crop_width', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'crop_height', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'first_image_score', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'background_consistency_score', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'subject_fill_score', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'sharpness_score', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'brightness_score', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'contrast_score', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'angle_group', "''")},
           ${selectAnnotationColumn(annotationCols, 'shot_style', "''")},
           ${selectAnnotationColumn(annotationCols, 'merchandising_score', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'merchandising_override_reason', "''")},
           ${selectAnnotationColumn(annotationCols, 'merchandising_override_note', "''")},
           ${selectAnnotationColumn(annotationCols, 'image_role', "''")},
           ${selectAnnotationColumn(annotationCols, 'public_use_status', "'internal_review'")},
           ${selectAnnotationColumn(annotationCols, 'consent_record_id', 'NULL')},
           ${selectAnnotationColumn(annotationCols, 'role_review_notes', "''")}
    FROM product_images pi
    LEFT JOIN product_image_annotations pia ON pia.product_image_id = pi.product_image_id
    WHERE pi.product_id = ?
    ORDER BY pi.sort_order ASC, pi.product_image_id ASC
  `).bind(product_id).all());

  const images = rawImages.map((row, index) => ({
    product_image_id: Number(row.product_image_id || 0),
    product_id: Number(row.product_id || 0),
    image_url: row.image_url || '',
    alt_text: row.alt_text || '',
    sort_order: Number(row.sort_order ?? index),
    created_at: row.created_at || null,
    image_title: row.image_title || '',
    caption: row.caption || '',
    focal_point_x: row.focal_point_x ?? null,
    focal_point_y: row.focal_point_y ?? null,
    annotation_notes: row.annotation_notes || '',
    width_px: row.width_px == null ? null : Number(row.width_px || 0),
    height_px: row.height_px == null ? null : Number(row.height_px || 0),
    image_orientation: row.image_orientation || '',
    crop_x: row.crop_x == null ? null : Number(row.crop_x || 0),
    crop_y: row.crop_y == null ? null : Number(row.crop_y || 0),
    crop_width: row.crop_width == null ? null : Number(row.crop_width || 0),
    crop_height: row.crop_height == null ? null : Number(row.crop_height || 0),
    first_image_score: row.first_image_score == null ? null : Number(row.first_image_score || 0),
    background_consistency_score: row.background_consistency_score == null ? null : Number(row.background_consistency_score || 0),
    subject_fill_score: row.subject_fill_score == null ? null : Number(row.subject_fill_score || 0),
    sharpness_score: row.sharpness_score == null ? null : Number(row.sharpness_score || 0),
    brightness_score: row.brightness_score == null ? null : Number(row.brightness_score || 0),
    contrast_score: row.contrast_score == null ? null : Number(row.contrast_score || 0),
    angle_group: row.angle_group || '',
    shot_style: row.shot_style || '',
    merchandising_score: row.merchandising_score == null ? null : Number(row.merchandising_score || 0),
    merchandising_override_reason: row.merchandising_override_reason || '',
    merchandising_override_note: row.merchandising_override_note || '',
    image_role: normalizeRole(row.image_role, index),
    public_use_status: normalizePublicUseStatus(row.public_use_status),
    consent_record_id: row.consent_record_id == null ? null : Number(row.consent_record_id || 0),
    role_review_notes: row.role_review_notes || ''
  }));

  const scoreHistory = normalizeResults(await db.prepare(`
    SELECT product_media_score_history_id, product_id, actor_user_id, image_count, lead_image_score,
           gallery_merchandising_score, weak_image_count, weak_unapproved_image_count, overridden_image_count,
           override_reasons_json, source, created_at
    FROM product_media_score_history
    WHERE product_id = ?
    ORDER BY created_at DESC, product_media_score_history_id DESC
    LIMIT 6
  `).bind(product_id).all().catch(() => ({ results: [] }))).map((row) => ({
    product_media_score_history_id: Number(row.product_media_score_history_id || 0),
    product_id: Number(row.product_id || 0),
    actor_user_id: row.actor_user_id == null ? null : Number(row.actor_user_id || 0),
    image_count: Number(row.image_count || 0),
    lead_image_score: row.lead_image_score == null ? null : Number(row.lead_image_score || 0),
    gallery_merchandising_score: row.gallery_merchandising_score == null ? null : Number(row.gallery_merchandising_score || 0),
    weak_image_count: Number(row.weak_image_count || 0),
    weak_unapproved_image_count: Number(row.weak_unapproved_image_count || 0),
    overridden_image_count: Number(row.overridden_image_count || 0),
    override_reasons: (() => { try { return JSON.parse(row.override_reasons_json || '{}') || {}; } catch { return {}; } })(),
    source: row.source || '',
    created_at: row.created_at || null
  }));

  return json({
    ok: true,
    images,
    current_summary: summarizeRows(images),
    score_history: scoreHistory
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  // Build 245: schema is migration-owned; writes fail explicitly if the current migration is missing.

  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const product_id = Number(body.product_id);
  const images = Array.isArray(body.images) ? body.images.slice(0, 20) : [];
  if (!Number.isInteger(product_id) || product_id <= 0) return json({ ok: false, error: 'A valid product_id is required.' }, 400);

  const product = await db.prepare(`SELECT product_id, name, featured_image_url FROM products WHERE product_id = ? LIMIT 1`).bind(product_id).first().catch(() => null);
  if (!product) return json({ ok: false, error: 'Product not found.' }, 404);

  const requestedRemovedIds = Array.isArray(body.removed_image_ids)
    ? [...new Set(body.removed_image_ids.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))]
    : [];
  const allowExplicitRemoval = String(body.media_sync_mode || '').toLowerCase() === 'explicit_remove';

  const existingResult = await db.prepare(`
    SELECT product_image_id, product_id, image_url, alt_text, sort_order
    FROM product_images
    WHERE product_id = ?
    ORDER BY sort_order ASC, product_image_id ASC
  `).bind(product_id).all().catch(() => ({ results: [] }));
  const existingRows = normalizeResults(existingResult);
  const existingById = new Map(existingRows.map((row) => [Number(row.product_image_id || 0), row]));
  const existingByUrl = new Map();
  existingRows.forEach((row) => {
    const key = normalizeText(row.image_url).toLowerCase();
    if (key && !existingByUrl.has(key)) existingByUrl.set(key, row);
  });

  // Destructive work is deliberately opt-in. A regular save updates rows/adds new rows,
  // but leaves any media that is not shown in the current editor intact.
  const removedIds = allowExplicitRemoval
    ? requestedRemovedIds.filter((imageId) => existingById.has(imageId))
    : [];
  if (removedIds.length) {
    const placeholders = removedIds.map(() => '?').join(', ');
    await db.prepare(`DELETE FROM product_image_annotations WHERE product_id = ? AND product_image_id IN (${placeholders})`).bind(product_id, ...removedIds).run();
    await db.prepare(`DELETE FROM product_images WHERE product_id = ? AND product_image_id IN (${placeholders})`).bind(product_id, ...removedIds).run();
    for (const imageId of removedIds) {
      const removed = existingRows.find((row) => Number(row.product_image_id || 0) === imageId);
      await db.prepare(`
        INSERT INTO product_media_change_audit (
          product_id, product_image_id, action_key, media_kind, media_url, details_json, created_by_user_id, created_at
        ) VALUES (?, ?, ?, 'image', ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        product_id,
        imageId,
        'explicit_media_remove',
        normalizeText(removed?.image_url) || null,
        JSON.stringify({ source: 'admin_product_images', media_sync_mode: 'explicit_remove' }),
        Number(adminUser.user_id || 0) || null
      ).run().catch(() => null);
    }
    removedIds.forEach((imageId) => existingById.delete(imageId));
  }

  const touchedIds = new Set();
  const savedRows = [];
  for (let i = 0; i < images.length; i += 1) {
    const row = images[i] || {};
    const imageUrl = normalizeText(row.image_url);
    if (!imageUrl) continue;
    const altText = normalizeText(row.alt_text) || product.name || null;
    const sortOrder = Number.isInteger(Number(row.sort_order)) ? Number(row.sort_order) : i;
    const merchandisingScore = parseOptionalPercent(row.merchandising_score ?? row.first_image_score);
    const merchandisingOverrideReason = normalizeText(row.merchandising_override_reason);
    const merchandisingOverrideNote = normalizeText(row.merchandising_override_note);
    const imageRole = normalizeRole(row.image_role, i);
    const publicUseStatus = normalizePublicUseStatus(row.public_use_status);
    const consentRecordId = parseOptionalNumber(row.consent_record_id);
    const roleReviewNotes = normalizeText(row.role_review_notes);

    const requestedId = Number(row.product_image_id || 0);
    const matched = existingById.get(requestedId) || existingByUrl.get(imageUrl.toLowerCase()) || null;
    let productImageId = Number(matched?.product_image_id || 0);

    if (productImageId) {
      await db.prepare(`
        UPDATE product_images
        SET image_url = ?, alt_text = ?, sort_order = ?
        WHERE product_id = ? AND product_image_id = ?
      `).bind(imageUrl, altText, sortOrder, product_id, productImageId).run();
    } else {
      const insert = await db.prepare(`
        INSERT INTO product_images (product_id, image_url, alt_text, sort_order, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(product_id, imageUrl, altText, sortOrder).run();
      productImageId = Number(insert?.meta?.last_row_id || 0);
    }
    if (!productImageId) continue;
    touchedIds.add(productImageId);

    // Annotation metadata is scoped to one retained media row, never the whole product.
    await db.prepare(`DELETE FROM product_image_annotations WHERE product_id = ? AND product_image_id = ?`).bind(product_id, productImageId).run();
    await db.prepare(`
      INSERT INTO product_image_annotations (
        product_id, product_image_id, image_url, alt_text, image_title, caption,
        focal_point_x, focal_point_y, annotation_notes,
        width_px, height_px, image_orientation,
        crop_x, crop_y, crop_width, crop_height,
        first_image_score,
        background_consistency_score, subject_fill_score, sharpness_score, brightness_score, contrast_score,
        angle_group, shot_style, merchandising_score,
        merchandising_override_reason, merchandising_override_note,
        image_role, public_use_status, consent_record_id, role_review_notes,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      product_id,
      productImageId,
      imageUrl,
      altText,
      normalizeText(row.image_title) || null,
      normalizeText(row.caption) || null,
      row.focal_point_x == null ? null : Number(row.focal_point_x),
      row.focal_point_y == null ? null : Number(row.focal_point_y),
      normalizeText(row.annotation_notes) || null,
      parseOptionalNumber(row.width_px),
      parseOptionalNumber(row.height_px),
      normalizeText(row.image_orientation) || null,
      parseOptionalNumber(row.crop_x),
      parseOptionalNumber(row.crop_y),
      parseOptionalNumber(row.crop_width),
      parseOptionalNumber(row.crop_height),
      merchandisingScore,
      parseOptionalPercent(row.background_consistency_score),
      parseOptionalPercent(row.subject_fill_score),
      parseOptionalPercent(row.sharpness_score),
      parseOptionalPercent(row.brightness_score),
      parseOptionalPercent(row.contrast_score),
      normalizeText(row.angle_group) || null,
      normalizeText(row.shot_style) || null,
      merchandisingScore,
      merchandisingOverrideReason || null,
      merchandisingOverrideNote || null,
      imageRole,
      publicUseStatus,
      consentRecordId,
      roleReviewNotes || null
    ).run();

    savedRows.push({
      ...row,
      product_image_id: productImageId,
      sort_order: sortOrder,
      image_url: imageUrl,
      alt_text: altText,
      merchandising_score: merchandisingScore,
      merchandising_override_reason: merchandisingOverrideReason,
      merchandising_override_note: merchandisingOverrideNote,
      image_role: imageRole,
      public_use_status: publicUseStatus,
      consent_record_id: consentRecordId,
      role_review_notes: roleReviewNotes
    });
  }

  const remainingRows = normalizeResults(await db.prepare(`
    SELECT product_image_id, image_url, alt_text, sort_order
    FROM product_images
    WHERE product_id = ?
    ORDER BY sort_order ASC, product_image_id ASC
  `).bind(product_id).all().catch(() => ({ results: [] })));
  const featuredImageUrl = normalizeText(remainingRows[0]?.image_url) || null;
  await db.prepare(`
    UPDATE products
    SET featured_image_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE product_id = ?
  `).bind(featuredImageUrl || null, product_id).run().catch(() => null);

  const orderedSavedRows = savedRows.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const summary = summarizeRows(orderedSavedRows);
  await db.prepare(`
    INSERT INTO product_media_change_audit (
      product_id, action_key, media_kind, media_url, details_json, created_by_user_id, created_at
    ) VALUES (?, ?, 'image', ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    product_id,
    'product_media_save',
    featuredImageUrl || null,
    JSON.stringify({ media_sync_mode: allowExplicitRemoval ? 'explicit_remove' : 'preserve_existing', saved_rows: savedRows.length, removed_rows: removedIds.length, remaining_rows: remainingRows.length }),
    Number(adminUser.user_id || 0) || null
  ).run().catch(() => null);
  await db.prepare(`
    INSERT INTO product_media_score_history (
      product_id, actor_user_id, image_count, lead_image_score, gallery_merchandising_score,
      weak_image_count, weak_unapproved_image_count, overridden_image_count, override_reasons_json, source, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    product_id,
    Number(adminUser.user_id || 0) || null,
    summary.image_count,
    summary.lead_image_score,
    summary.gallery_merchandising_score,
    summary.weak_image_count,
    summary.weak_unapproved_image_count,
    summary.overridden_image_count,
    JSON.stringify({ ...(summary.override_reasons || {}), image_roles: summary.role_counts || {} }),
    'admin_product_images_save'
  ).run().catch(() => null);

  return json({
    ok: true,
    message: 'Product images saved.',
    media_notice: removedIds.length
      ? `${removedIds.length} selected image${removedIds.length === 1 ? '' : 's'} removed. All other product media was preserved.`
      : 'Product media saved. Existing photos and videos were preserved unless explicitly removed.',
    featured_image_url: featuredImageUrl || product.featured_image_url || null,
    current_summary: summary
  });
}

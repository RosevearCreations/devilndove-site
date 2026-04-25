// File: /functions/api/admin/product-images.js
// Brief description: Gets and updates ordered product images so product media, annotations,
// and storefront rendering can be managed together from the admin interface.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeText(value) {
  return String(value || '').trim();
}

function getDb(env) {
  return env.DB || env.DD_DB || null;
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
  `).bind(token, token).first();

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

async function ensureAnnotationColumns(db) {
  const annotationCols = await getTableColumnSet(db, 'product_image_annotations');
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
    ['merchandising_override_note', 'ALTER TABLE product_image_annotations ADD COLUMN merchandising_override_note TEXT']
  ];
  for (const [name, sql] of statements) {
    if (!annotationCols.has(name)) await db.prepare(sql).run().catch(() => null);
  }
  return await getTableColumnSet(db, 'product_image_annotations');
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
      record_image_count INTEGER NOT NULL DEFAULT 0,
      context_image_count INTEGER NOT NULL DEFAULT 0,
      duplicate_angle_group_count INTEGER NOT NULL DEFAULT 0,
      duplicate_image_count INTEGER NOT NULL DEFAULT 0,
      override_reasons_json TEXT,
      shot_mix_json TEXT,
      angle_mix_json TEXT,
      source TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
      FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
    )
  `).run().catch(() => null);
  const historyCols = await getTableColumnSet(db, 'product_media_score_history');
  const statements = [
    ['record_image_count', 'ALTER TABLE product_media_score_history ADD COLUMN record_image_count INTEGER NOT NULL DEFAULT 0'],
    ['context_image_count', 'ALTER TABLE product_media_score_history ADD COLUMN context_image_count INTEGER NOT NULL DEFAULT 0'],
    ['duplicate_angle_group_count', 'ALTER TABLE product_media_score_history ADD COLUMN duplicate_angle_group_count INTEGER NOT NULL DEFAULT 0'],
    ['duplicate_image_count', 'ALTER TABLE product_media_score_history ADD COLUMN duplicate_image_count INTEGER NOT NULL DEFAULT 0'],
    ['shot_mix_json', 'ALTER TABLE product_media_score_history ADD COLUMN shot_mix_json TEXT'],
    ['angle_mix_json', 'ALTER TABLE product_media_score_history ADD COLUMN angle_mix_json TEXT']
  ];
  for (const [name, sql] of statements) {
    if (!historyCols.has(name)) await db.prepare(sql).run().catch(() => null);
  }
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_product_media_score_history_product_id_created_at ON product_media_score_history(product_id, created_at DESC)`).run().catch(() => null);
  return await getTableColumnSet(db, 'product_media_score_history');
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

function scoreForRow(row = {}) {
  const score = parseOptionalPercent(row.merchandising_score ?? row.first_image_score);
  return score == null ? 0 : score;
}

function hasOverrideReason(row = {}) {
  return normalizeText(row.merchandising_override_reason).length > 0;
}

function normalizeShotStyle(style) {
  const value = normalizeText(style).toLowerCase();
  return value || 'record';
}

function isContextShotStyle(style) {
  return ['lifestyle', 'process', 'packaging', 'scale_reference'].includes(normalizeShotStyle(style));
}

function summarizeRows(rows = []) {
  const orderedRows = Array.isArray(rows) ? rows : [];
  const leadRow = orderedRows[0] || null;
  const leadImageScore = leadRow ? scoreForRow(leadRow) : 0;
  const imageCount = orderedRows.length;
  const galleryMerchandisingScore = imageCount
    ? Math.round(orderedRows.reduce((sum, row) => sum + scoreForRow(row), 0) / imageCount)
    : 0;
  const weakRows = orderedRows.filter((row) => scoreForRow(row) < 64);
  const overriddenRows = orderedRows.filter((row) => hasOverrideReason(row));
  const weakUnapprovedRows = orderedRows.filter((row, index) => {
    if (index === 0) return scoreForRow(row) < 72;
    return scoreForRow(row) < 64 && !hasOverrideReason(row);
  });
  const overrideReasonCounts = {};
  const shotMix = {};
  const angleMix = {};
  let recordImageCount = 0;
  let contextImageCount = 0;
  for (const row of orderedRows) {
    const shotStyle = normalizeShotStyle(row.shot_style);
    shotMix[shotStyle] = Number(shotMix[shotStyle] || 0) + 1;
    if (isContextShotStyle(shotStyle)) contextImageCount += 1;
    else recordImageCount += 1;

    const angleGroup = normalizeText(row.angle_group).toLowerCase();
    if (angleGroup) angleMix[angleGroup] = Number(angleMix[angleGroup] || 0) + 1;

    if (hasOverrideReason(row)) {
      const key = normalizeText(row.merchandising_override_reason).toLowerCase() || 'other';
      overrideReasonCounts[key] = Number(overrideReasonCounts[key] || 0) + 1;
    }
  }
  const duplicateGroups = Object.entries(angleMix).filter(([, count]) => Number(count || 0) > 1);
  const duplicateAngleGroupCount = duplicateGroups.length;
  const duplicateImageCount = duplicateGroups.reduce((sum, [, count]) => sum + Math.max(0, Number(count || 0) - 1), 0);
  const topDuplicateAngles = duplicateGroups
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0) || String(a[0]).localeCompare(String(b[0])))
    .slice(0, 3)
    .map(([group, count]) => ({ group, count: Number(count || 0) }));

  const guidance = [];
  if (imageCount < 3) guidance.push('Add at least three images for stronger storefront coverage.');
  if (leadImageScore < 72 && leadRow) guidance.push('Improve the first image before publish by tightening crop, sharpness, or background cleanup.');
  if (recordImageCount === 0 && imageCount > 0) guidance.push('Keep at least one clean record-style product shot for the storefront lead image.');
  if (contextImageCount === 0 && imageCount >= 3) guidance.push('Consider one process or lifestyle shot to support trust and storytelling.');
  if (contextImageCount > Math.max(1, Math.floor(imageCount / 2))) guidance.push('The gallery is context-heavy; keep the majority of shots product-focused.');
  if (duplicateAngleGroupCount > 0) guidance.push(`Trim repeated angles. ${duplicateImageCount} image(s) repeat ${duplicateAngleGroupCount} angle group(s).`);
  if (weakUnapprovedRows.length > 0) guidance.push(`${weakUnapprovedRows.length} low-scoring image(s) still need replacement or a documented override.`);

  return {
    image_count: imageCount,
    lead_image_score: leadImageScore,
    gallery_merchandising_score: galleryMerchandisingScore,
    weak_image_count: weakRows.length,
    weak_unapproved_image_count: weakUnapprovedRows.length,
    overridden_image_count: overriddenRows.length,
    record_image_count: recordImageCount,
    context_image_count: contextImageCount,
    duplicate_angle_group_count: duplicateAngleGroupCount,
    duplicate_image_count: duplicateImageCount,
    top_duplicate_angles: topDuplicateAngles,
    override_reasons: overrideReasonCounts,
    shot_mix: shotMix,
    angle_mix: angleMix,
    guidance
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const annotationCols = await ensureAnnotationColumns(db);
  const historyCols = await ensureMediaScoreHistoryTable(db);

  const product_id = Number(new URL(request.url).searchParams.get('product_id'));
  if (!Number.isInteger(product_id) || product_id <= 0) return json({ ok: false, error: 'A valid product_id is required.' }, 400);

  const rawImages = normalizeResults(await db.prepare(`
    SELECT pi.product_image_id, pi.product_id, pi.image_url, pi.alt_text, pi.sort_order, pi.created_at,
           pia.image_title, pia.caption, pia.focal_point_x, pia.focal_point_y, pia.annotation_notes,
           ${annotationCols.has('width_px') ? 'pia.width_px' : 'NULL AS width_px'},
           ${annotationCols.has('height_px') ? 'pia.height_px' : 'NULL AS height_px'},
           ${annotationCols.has('image_orientation') ? 'pia.image_orientation' : 'NULL AS image_orientation'},
           ${annotationCols.has('crop_x') ? 'pia.crop_x' : 'NULL AS crop_x'},
           ${annotationCols.has('crop_y') ? 'pia.crop_y' : 'NULL AS crop_y'},
           ${annotationCols.has('crop_width') ? 'pia.crop_width' : 'NULL AS crop_width'},
           ${annotationCols.has('crop_height') ? 'pia.crop_height' : 'NULL AS crop_height'},
           ${annotationCols.has('first_image_score') ? 'pia.first_image_score' : 'NULL AS first_image_score'},
           ${annotationCols.has('background_consistency_score') ? 'pia.background_consistency_score' : 'NULL AS background_consistency_score'},
           ${annotationCols.has('subject_fill_score') ? 'pia.subject_fill_score' : 'NULL AS subject_fill_score'},
           ${annotationCols.has('sharpness_score') ? 'pia.sharpness_score' : 'NULL AS sharpness_score'},
           ${annotationCols.has('brightness_score') ? 'pia.brightness_score' : 'NULL AS brightness_score'},
           ${annotationCols.has('contrast_score') ? 'pia.contrast_score' : 'NULL AS contrast_score'},
           ${annotationCols.has('angle_group') ? 'pia.angle_group' : 'NULL AS angle_group'},
           ${annotationCols.has('shot_style') ? 'pia.shot_style' : 'NULL AS shot_style'},
           ${annotationCols.has('merchandising_score') ? 'pia.merchandising_score' : 'NULL AS merchandising_score'},
           ${annotationCols.has('merchandising_override_reason') ? 'pia.merchandising_override_reason' : 'NULL AS merchandising_override_reason'},
           ${annotationCols.has('merchandising_override_note') ? 'pia.merchandising_override_note' : 'NULL AS merchandising_override_note'}
    FROM product_images pi
    LEFT JOIN product_image_annotations pia ON pia.product_image_id = pi.product_image_id
    WHERE pi.product_id = ?
    ORDER BY pi.sort_order ASC, pi.product_image_id ASC
  `).bind(product_id).all());

  const images = rawImages.map((row) => ({
    product_image_id: Number(row.product_image_id || 0),
    product_id: Number(row.product_id || 0),
    image_url: row.image_url || '',
    alt_text: row.alt_text || '',
    sort_order: Number(row.sort_order || 0),
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
    merchandising_override_note: row.merchandising_override_note || ''
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
    record_image_count: Number(row.record_image_count || 0),
    context_image_count: Number(row.context_image_count || 0),
    duplicate_angle_group_count: Number(row.duplicate_angle_group_count || 0),
    duplicate_image_count: Number(row.duplicate_image_count || 0),
    override_reasons: (() => { try { return JSON.parse(row.override_reasons_json || '{}') || {}; } catch { return {}; } })(),
    shot_mix: (() => { try { return JSON.parse(row.shot_mix_json || '{}') || {}; } catch { return {}; } })(),
    angle_mix: (() => { try { return JSON.parse(row.angle_mix_json || '{}') || {}; } catch { return {}; } })(),
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

  await ensureAnnotationColumns(db);
  await ensureMediaScoreHistoryTable(db);

  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const product_id = Number(body.product_id);
  const images = Array.isArray(body.images) ? body.images.slice(0, 20) : [];
  if (!Number.isInteger(product_id) || product_id <= 0) return json({ ok: false, error: 'A valid product_id is required.' }, 400);

  const product = await db.prepare(`SELECT product_id, name, featured_image_url FROM products WHERE product_id = ? LIMIT 1`).bind(product_id).first();
  if (!product) return json({ ok: false, error: 'Product not found.' }, 404);

  await db.prepare(`DELETE FROM product_image_annotations WHERE product_id = ?`).bind(product_id).run();
  await db.prepare(`DELETE FROM product_images WHERE product_id = ?`).bind(product_id).run();

  let featuredImageUrl = null;
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

    const insert = await db.prepare(`
      INSERT INTO product_images (product_id, image_url, alt_text, sort_order, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(product_id, imageUrl, altText, sortOrder).run();

    const productImageId = Number(insert?.meta?.last_row_id || 0);
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
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      product_id,
      productImageId || null,
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
      merchandisingOverrideNote || null
    ).run();

    savedRows.push({
      ...row,
      sort_order: sortOrder,
      image_url: imageUrl,
      alt_text: altText,
      merchandising_score: merchandisingScore,
      merchandising_override_reason: merchandisingOverrideReason,
      merchandising_override_note: merchandisingOverrideNote
    });

    if (featuredImageUrl == null || Number(sortOrder) === 0) {
      featuredImageUrl = imageUrl;
    }
  }

  if (featuredImageUrl) {
    await db.prepare(`
      UPDATE products
      SET featured_image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?
    `).bind(featuredImageUrl, product_id).run();
  }

  const summary = summarizeRows(savedRows.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)));
  await db.prepare(`
    INSERT INTO product_media_score_history (
      product_id, actor_user_id, image_count, lead_image_score, gallery_merchandising_score,
      weak_image_count, weak_unapproved_image_count, overridden_image_count,
      record_image_count, context_image_count, duplicate_angle_group_count, duplicate_image_count,
      override_reasons_json, shot_mix_json, angle_mix_json, source, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    product_id,
    Number(adminUser.user_id || 0) || null,
    summary.image_count,
    summary.lead_image_score,
    summary.gallery_merchandising_score,
    summary.weak_image_count,
    summary.weak_unapproved_image_count,
    summary.overridden_image_count,
    summary.record_image_count,
    summary.context_image_count,
    summary.duplicate_angle_group_count,
    summary.duplicate_image_count,
    JSON.stringify(summary.override_reasons || {}),
    JSON.stringify(summary.shot_mix || {}),
    JSON.stringify(summary.angle_mix || {}),
    'admin_product_images_save'
  ).run().catch(() => null);

  return json({
    ok: true,
    message: 'Product images saved.',
    featured_image_url: featuredImageUrl || product.featured_image_url || null,
    current_summary: summary
  });
}

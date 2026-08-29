// Devil n Dove Release 448 — Product photography quality persistence and catalog work queue.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE = 448;
const json = (data, status = 200) => jsonResponse({ release: RELEASE, ...data }, status, { 'Cache-Control': 'no-store' });
const text = (value) => String(value == null ? '' : value).trim();
const clamp = (value, max) => Math.max(0, Math.min(max, Number(value) || 0));
const imageKey = (value) => text(value).toLowerCase().replace(/[?#].*$/, '').replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '').slice(0, 1200);

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name=?").bind(tableName).first();
    return Number(row?.c || 0) === 1;
  } catch {
    return false;
  }
}

async function schemaReady(db) {
  return tableExists(db, 'product_image_quality_assessments');
}

async function catalogSummary(db, limit) {
  const hasProductImages = await tableExists(db, 'product_images');
  const hasMediaAssets = await tableExists(db, 'media_assets');
  const hasRoleAssignments = await tableExists(db, 'product_media_role_assignments');
  const imageCountParts = [];
  if (hasProductImages) imageCountParts.push("(SELECT COUNT(*) FROM product_images pi WHERE pi.product_id=p.product_id AND TRIM(COALESCE(pi.image_url,''))<>'')");
  if (hasMediaAssets) imageCountParts.push("(SELECT COUNT(*) FROM media_assets ma WHERE ma.product_id=p.product_id AND ma.deleted_at IS NULL AND TRIM(COALESCE(ma.public_url,''))<>'')");
  if (hasRoleAssignments) imageCountParts.push("(SELECT COUNT(*) FROM product_media_role_assignments pra WHERE pra.product_id=p.product_id AND COALESCE(pra.assignment_status,'assigned')<>'removed' AND TRIM(COALESCE(pra.image_url,''))<>'')");
  const imageCountSql = imageCountParts.length ? imageCountParts.join(' + ') : '0';
  const result = await db.prepare(`
    SELECT
      p.product_id,
      COALESCE(NULLIF(TRIM(p.name),''), 'Product ' || p.product_id) AS product_name,
      ${imageCountSql} AS source_image_references,
      COALESCE(a.assessment_count,0) AS assessment_count,
      a.average_score,
      a.best_score,
      a.lowest_score,
      COALESCE(a.excellent_count,0) AS excellent_count,
      COALESCE(a.good_count,0) AS good_count,
      COALESCE(a.improve_count,0) AS improve_count,
      COALESCE(a.reshoot_count,0) AS reshoot_count,
      a.latest_scored_at
    FROM products p
    LEFT JOIN (
      SELECT
        product_id,
        COUNT(DISTINCT image_key) AS assessment_count,
        ROUND(AVG(total_score),1) AS average_score,
        MAX(total_score) AS best_score,
        MIN(total_score) AS lowest_score,
        SUM(CASE WHEN total_score>=85 THEN 1 ELSE 0 END) AS excellent_count,
        SUM(CASE WHEN total_score>=70 AND total_score<85 THEN 1 ELSE 0 END) AS good_count,
        SUM(CASE WHEN total_score>=55 AND total_score<70 THEN 1 ELSE 0 END) AS improve_count,
        SUM(CASE WHEN total_score<55 THEN 1 ELSE 0 END) AS reshoot_count,
        MAX(scored_at) AS latest_scored_at
      FROM product_image_quality_assessments
      WHERE scorer_kind='browser_deterministic'
      GROUP BY product_id
    ) a ON a.product_id=p.product_id
    ORDER BY
      CASE WHEN COALESCE(a.assessment_count,0)=0 THEN 0 ELSE 1 END ASC,
      COALESCE(a.average_score,-1) ASC,
      LOWER(COALESCE(p.name,'')) ASC,
      p.product_id ASC
    LIMIT ?
  `).bind(limit).all();
  return Array.isArray(result?.results) ? result.results : [];
}

export async function onRequestGet({ request, env }) {
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, error: 'Unauthorized.' }, 401);
  if (!await schemaReady(db)) return json({ ok: true, schema_ready: false, assessments: [], catalog: [] });

  const url = new URL(request.url);
  if (['1', 'true', 'yes'].includes(text(url.searchParams.get('summary')).toLowerCase())) {
    const limit = Math.max(1, Math.min(2000, Number(url.searchParams.get('limit') || 1000) || 1000));
    try {
      return json({ ok: true, schema_ready: true, catalog: await catalogSummary(db, limit) });
    } catch (error) {
      return json({ ok: false, error: error?.message || 'Could not load the photography catalog queue.' }, 500);
    }
  }

  const productId = Number(url.searchParams.get('product_id') || 0);
  if (!Number.isInteger(productId) || productId <= 0) return json({ ok: false, error: 'A valid product_id is required.' }, 400);
  try {
    const result = await db.prepare(`
      SELECT
        product_image_quality_assessment_id,product_id,image_url,image_key,scorer_kind,scorer_version,
        total_score,lighting_score,clarity_score,background_score,framing_score,resolution_score,
        color_balance_score,artifact_score,consistency_score,width_px,height_px,evidence_json,status,
        review_notes,scored_at,reviewed_at,updated_at
      FROM product_image_quality_assessments
      WHERE product_id=?
      ORDER BY updated_at DESC,product_image_quality_assessment_id DESC
    `).bind(productId).all();
    return json({ ok: true, schema_ready: true, assessments: Array.isArray(result?.results) ? result.results : [] });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Could not load image-quality assessments.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, error: 'Unauthorized.' }, 401);
  if (!await schemaReady(db)) return json({ ok: false, error: 'Release 448 image-quality schema is not applied yet.', code: 'schema_not_ready' }, 409);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Valid JSON is required.' }, 400);
  }

  const action = text(body?.action).toLowerCase();
  const productId = Number(body?.product_id || 0);
  if (!Number.isInteger(productId) || productId <= 0) return json({ ok: false, error: 'A valid product_id is required.' }, 400);

  if (action === 'review') {
    const assessmentId = Number(body?.assessment_id || 0);
    const status = text(body?.status).toLowerCase();
    if (!Number.isInteger(assessmentId) || assessmentId <= 0) return json({ ok: false, error: 'assessment_id is required for review.' }, 400);
    if (!['reviewed', 'approved', 'rejected'].includes(status)) return json({ ok: false, error: 'Review status must be reviewed, approved or rejected.' }, 400);
    try {
      const result = await db.prepare(`
        UPDATE product_image_quality_assessments
        SET status=?,review_notes=?,reviewed_by_user_id=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
        WHERE product_image_quality_assessment_id=? AND product_id=?
      `).bind(status, text(body?.review_notes) || null, admin.user_id || null, assessmentId, productId).run();
      if (!Number(result?.meta?.changes || 0)) return json({ ok: false, error: 'Image assessment was not found.' }, 404);
      return json({ ok: true, action: 'review', assessment_id: assessmentId, status });
    } catch (error) {
      return json({ ok: false, error: error?.message || 'Could not review this image assessment.' }, 500);
    }
  }

  const imageUrl = text(body?.image_url);
  const key = imageKey(body?.image_key || imageUrl);
  if (!imageUrl || !key) return json({ ok: false, error: 'image_url is required.' }, 400);

  const components = {
    lighting: clamp(body?.lighting_score, 20),
    clarity: clamp(body?.clarity_score, 20),
    background: clamp(body?.background_score, 15),
    framing: clamp(body?.framing_score, 15),
    resolution: clamp(body?.resolution_score, 10),
    color: clamp(body?.color_balance_score, 10),
    artifacts: clamp(body?.artifact_score, 5),
    consistency: clamp(body?.consistency_score, 5),
  };
  const total = Math.round(Object.values(components).reduce((sum, value) => sum + value, 0) * 10) / 10;
  const scorerKind = ['browser_deterministic', 'vision_assisted', 'manual'].includes(text(body?.scorer_kind)) ? text(body.scorer_kind) : 'browser_deterministic';
  const scorerVersion = text(body?.scorer_version) || 'r448-browser-v1';
  const status = ['unverified', 'machine_scored', 'reviewed', 'approved', 'rejected'].includes(text(body?.status)) ? text(body.status) : 'machine_scored';
  const evidence = typeof body?.evidence === 'object' && body.evidence ? body.evidence : {};

  try {
    if (!await db.prepare('SELECT product_id FROM products WHERE product_id=? LIMIT 1').bind(productId).first()) return json({ ok: false, error: 'Product not found.' }, 404);
    await db.prepare(`
      INSERT INTO product_image_quality_assessments (
        product_id,image_url,image_key,scorer_kind,scorer_version,total_score,lighting_score,clarity_score,
        background_score,framing_score,resolution_score,color_balance_score,artifact_score,consistency_score,
        width_px,height_px,evidence_json,status,review_notes,scored_at,reviewed_by_user_id,reviewed_at,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?,CASE WHEN ? IN ('reviewed','approved','rejected') THEN CURRENT_TIMESTAMP ELSE NULL END,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(product_id,image_key,scorer_kind,scorer_version) DO UPDATE SET
        image_url=excluded.image_url,total_score=excluded.total_score,lighting_score=excluded.lighting_score,
        clarity_score=excluded.clarity_score,background_score=excluded.background_score,framing_score=excluded.framing_score,
        resolution_score=excluded.resolution_score,color_balance_score=excluded.color_balance_score,
        artifact_score=excluded.artifact_score,consistency_score=excluded.consistency_score,width_px=excluded.width_px,
        height_px=excluded.height_px,evidence_json=excluded.evidence_json,status=excluded.status,review_notes=excluded.review_notes,
        scored_at=CURRENT_TIMESTAMP,reviewed_by_user_id=excluded.reviewed_by_user_id,
        reviewed_at=CASE WHEN excluded.status IN ('reviewed','approved','rejected') THEN CURRENT_TIMESTAMP ELSE product_image_quality_assessments.reviewed_at END,
        updated_at=CURRENT_TIMESTAMP
    `).bind(
      productId,imageUrl,key,scorerKind,scorerVersion,total,components.lighting,components.clarity,components.background,
      components.framing,components.resolution,components.color,components.artifacts,components.consistency,
      Number(body?.width_px) || null,Number(body?.height_px) || null,JSON.stringify(evidence),status,text(body?.review_notes) || null,
      admin.user_id || null,status
    ).run();
    return json({ ok: true, total_score: total, status, image_key: key });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Could not save image-quality assessment.' }, 500);
  }
}

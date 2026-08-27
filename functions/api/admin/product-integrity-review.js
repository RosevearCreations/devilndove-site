// Devil n Dove Build 440 — Product ingredient/media integrity review queue.
// Read-only, Admin-authenticated, bounded, and migration-owned. No request-time DDL.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = 440;
const MAX_LIMIT = 80;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function safeQueue(value) {
  const q = normalizeText(value).toLowerCase();
  return ['all', 'ingredient', 'media'].includes(q) ? q : 'all';
}

function mediaIssues(row = {}) {
  const issues = [];
  const galleryCount = n(row.gallery_count);
  const uniqueGalleryCount = n(row.unique_gallery_count);
  const recoverableCount = n(row.recoverable_unique_image_count);
  const snapshotGalleryCount = n(row.snapshot_product_image_count);
  if (recoverableCount > snapshotGalleryCount) issues.push({ code: 'recoverable_gap', label: `${recoverableCount - snapshotGalleryCount} recoverable image(s) not represented in the latest gallery snapshot` });
  if (galleryCount > 7) issues.push({ code: 'gallery_over_limit', label: `${galleryCount} gallery rows; review the seven-image product limit` });
  if (galleryCount > uniqueGalleryCount) issues.push({ code: 'duplicate_gallery_url', label: `${galleryCount - uniqueGalleryCount} duplicate gallery URL row(s)` });
  if (!normalizeText(row.featured_image_url) && galleryCount > 0) issues.push({ code: 'featured_missing', label: 'Gallery exists but featured image is blank' });
  return issues;
}

async function ingredientSummary(db) {
  const row = await db.prepare(`
    SELECT
      COUNT(*) AS review_rows,
      COUNT(DISTINCT prl.product_id) AS review_products,
      SUM(CASE WHEN TRIM(COALESCE(prip.inci_name,''))='' THEN 1 ELSE 0 END) AS missing_inci,
      SUM(CASE WHEN TRIM(COALESCE(prip.ingredient_name_en,''))='' THEN 1 ELSE 0 END) AS missing_english_name,
      SUM(CASE WHEN COALESCE(prip.translation_review_status,'needs_review')<>'approved' THEN 1 ELSE 0 END) AS translation_review_due
    FROM product_resource_links prl
    JOIN products p ON p.product_id=prl.product_id
    JOIN product_resource_ingredient_profiles prip ON prip.product_resource_link_id=prl.product_resource_link_id
    WHERE LOWER(TRIM(COALESCE(prl.resource_kind,'')))='supply'
      AND COALESCE(prip.is_label_ingredient,0)=1
      AND (
        TRIM(COALESCE(prip.inci_name,''))=''
        OR TRIM(COALESCE(prip.ingredient_name_en,''))=''
        OR COALESCE(prip.translation_review_status,'needs_review')<>'approved'
      )
  `).first();
  return {
    review_rows: n(row?.review_rows),
    review_products: n(row?.review_products),
    missing_inci: n(row?.missing_inci),
    missing_english_name: n(row?.missing_english_name),
    translation_review_due: n(row?.translation_review_due),
  };
}

async function loadIngredientQueue(db, { q = '', limit = 40, offset = 0 } = {}) {
  const like = `%${normalizeText(q).toLowerCase()}%`;
  const result = await db.prepare(`
    SELECT
      p.product_id,p.name AS product_name,p.status AS product_status,
      prl.product_resource_link_id,prl.source_key,
      COALESCE(NULLIF(TRIM(sii.item_name),''),NULLIF(TRIM(ci.name),''),prl.source_key) AS supply_name,
      COALESCE(prip.ingredient_name_en,'') AS ingredient_name_en,
      COALESCE(prip.ingredient_name_fr,'') AS ingredient_name_fr,
      COALESCE(prip.inci_name,'') AS inci_name,
      COALESCE(prip.translation_review_status,'needs_review') AS translation_review_status,
      COALESCE(prip.updated_at,prl.updated_at,p.updated_at) AS updated_at
    FROM product_resource_links prl
    JOIN products p ON p.product_id=prl.product_id
    JOIN product_resource_ingredient_profiles prip ON prip.product_resource_link_id=prl.product_resource_link_id
    LEFT JOIN site_item_inventory sii
      ON sii.site_item_inventory_id=(
        SELECT sii2.site_item_inventory_id
        FROM site_item_inventory sii2
        WHERE COALESCE(sii2.is_active,1)=1
          AND LOWER(TRIM(COALESCE(sii2.source_type,'')))='supply'
          AND LOWER(TRIM(COALESCE(sii2.external_key,'')))=LOWER(TRIM(COALESCE(prl.source_key,'')))
        ORDER BY sii2.site_item_inventory_id DESC
        LIMIT 1
      )
    LEFT JOIN catalog_items ci
      ON ci.catalog_item_id=(
        SELECT ci2.catalog_item_id
        FROM catalog_items ci2
        WHERE LOWER(TRIM(COALESCE(ci2.item_kind,'')))='supply'
          AND LOWER(TRIM(COALESCE(ci2.source_key,'')))=LOWER(TRIM(COALESCE(prl.source_key,'')))
        ORDER BY ci2.catalog_item_id DESC
        LIMIT 1
      )
    WHERE LOWER(TRIM(COALESCE(prl.resource_kind,'')))='supply'
      AND COALESCE(prip.is_label_ingredient,0)=1
      AND (
        TRIM(COALESCE(prip.inci_name,''))=''
        OR TRIM(COALESCE(prip.ingredient_name_en,''))=''
        OR COALESCE(prip.translation_review_status,'needs_review')<>'approved'
      )
      AND (
        ?=''
        OR LOWER(COALESCE(p.name,'')) LIKE ?
        OR LOWER(COALESCE(prl.source_key,'')) LIKE ?
        OR LOWER(COALESCE(sii.item_name,ci.name,'')) LIKE ?
        OR LOWER(COALESCE(prip.inci_name,'')) LIKE ?
      )
    ORDER BY LOWER(COALESCE(p.name,'')) ASC,prl.product_resource_link_id ASC
    LIMIT ? OFFSET ?
  `).bind(normalizeText(q).toLowerCase(), like, like, like, like, limit, offset).all();

  return rows(result).map((row) => {
    const issues = [];
    if (!normalizeText(row.inci_name)) issues.push({ code: 'missing_inci', label: 'INCI name missing' });
    if (!normalizeText(row.ingredient_name_en)) issues.push({ code: 'missing_english_name', label: 'English ingredient name missing' });
    if (normalizeText(row.translation_review_status).toLowerCase() !== 'approved') issues.push({ code: 'translation_review_due', label: 'Ingredient translation/review not approved' });
    return {
      product_id: n(row.product_id),
      product_name: row.product_name || '',
      product_status: row.product_status || '',
      product_resource_link_id: n(row.product_resource_link_id),
      source_key: row.source_key || '',
      supply_name: row.supply_name || row.source_key || '',
      ingredient_name_en: row.ingredient_name_en || '',
      ingredient_name_fr: row.ingredient_name_fr || '',
      inci_name: row.inci_name || '',
      translation_review_status: row.translation_review_status || 'needs_review',
      issues,
      owner_url: `/admin/catalog/?product_id=${n(row.product_id)}#product-resources`,
      updated_at: row.updated_at || null,
    };
  });
}

async function mediaSummary(db) {
  const row = await db.prepare(`
    WITH gallery AS (
      SELECT product_id,
             COUNT(*) AS gallery_count,
             COUNT(DISTINCT LOWER(TRIM(image_url))) AS unique_gallery_count
      FROM product_images
      WHERE TRIM(COALESCE(image_url,''))<>''
      GROUP BY product_id
    ), latest_snapshot AS (
      SELECT s.*
      FROM product_media_integrity_snapshots s
      WHERE s.product_media_integrity_snapshot_id=(
        SELECT s2.product_media_integrity_snapshot_id
        FROM product_media_integrity_snapshots s2
        WHERE s2.product_id=s.product_id
        ORDER BY s2.created_at DESC,s2.product_media_integrity_snapshot_id DESC
        LIMIT 1
      )
    )
    SELECT
      SUM(CASE WHEN COALESCE(s.recoverable_unique_image_count,0)>COALESCE(s.product_image_count,0) THEN 1 ELSE 0 END) AS recoverable_gap,
      SUM(CASE WHEN COALESCE(g.gallery_count,0)>7 THEN 1 ELSE 0 END) AS gallery_over_limit,
      SUM(CASE WHEN COALESCE(g.gallery_count,0)>COALESCE(g.unique_gallery_count,0) THEN 1 ELSE 0 END) AS duplicate_gallery_url,
      SUM(CASE WHEN TRIM(COALESCE(p.featured_image_url,''))='' AND COALESCE(g.gallery_count,0)>0 THEN 1 ELSE 0 END) AS featured_missing,
      SUM(CASE WHEN
        COALESCE(s.recoverable_unique_image_count,0)>COALESCE(s.product_image_count,0)
        OR COALESCE(g.gallery_count,0)>7
        OR COALESCE(g.gallery_count,0)>COALESCE(g.unique_gallery_count,0)
        OR (TRIM(COALESCE(p.featured_image_url,''))='' AND COALESCE(g.gallery_count,0)>0)
        THEN 1 ELSE 0 END) AS review_products
    FROM products p
    LEFT JOIN gallery g ON g.product_id=p.product_id
    LEFT JOIN latest_snapshot s ON s.product_id=p.product_id
  `).first();
  return {
    review_products: n(row?.review_products),
    recoverable_gap: n(row?.recoverable_gap),
    gallery_over_limit: n(row?.gallery_over_limit),
    duplicate_gallery_url: n(row?.duplicate_gallery_url),
    featured_missing: n(row?.featured_missing),
  };
}

async function loadMediaQueue(db, { q = '', limit = 40, offset = 0 } = {}) {
  const like = `%${normalizeText(q).toLowerCase()}%`;
  const result = await db.prepare(`
    WITH gallery AS (
      SELECT product_id,
             COUNT(*) AS gallery_count,
             COUNT(DISTINCT LOWER(TRIM(image_url))) AS unique_gallery_count
      FROM product_images
      WHERE TRIM(COALESCE(image_url,''))<>''
      GROUP BY product_id
    ), latest_snapshot AS (
      SELECT s.*
      FROM product_media_integrity_snapshots s
      WHERE s.product_media_integrity_snapshot_id=(
        SELECT s2.product_media_integrity_snapshot_id
        FROM product_media_integrity_snapshots s2
        WHERE s2.product_id=s.product_id
        ORDER BY s2.created_at DESC,s2.product_media_integrity_snapshot_id DESC
        LIMIT 1
      )
    )
    SELECT p.product_id,p.name AS product_name,p.status AS product_status,p.featured_image_url,
           COALESCE(g.gallery_count,0) AS gallery_count,
           COALESCE(g.unique_gallery_count,0) AS unique_gallery_count,
           COALESCE(s.product_image_count,0) AS snapshot_product_image_count,
           COALESCE(s.media_asset_count,0) AS media_asset_count,
           COALESCE(s.role_assignment_image_count,0) AS role_assignment_image_count,
           COALESCE(s.annotation_image_count,0) AS annotation_image_count,
           COALESCE(s.recoverable_unique_image_count,0) AS recoverable_unique_image_count,
           s.created_at AS snapshot_created_at
    FROM products p
    LEFT JOIN gallery g ON g.product_id=p.product_id
    LEFT JOIN latest_snapshot s ON s.product_id=p.product_id
    WHERE (
      COALESCE(s.recoverable_unique_image_count,0)>COALESCE(s.product_image_count,0)
      OR COALESCE(g.gallery_count,0)>7
      OR COALESCE(g.gallery_count,0)>COALESCE(g.unique_gallery_count,0)
      OR (TRIM(COALESCE(p.featured_image_url,''))='' AND COALESCE(g.gallery_count,0)>0)
    )
      AND (?='' OR LOWER(COALESCE(p.name,'')) LIKE ? OR CAST(p.product_id AS TEXT) LIKE ?)
    ORDER BY LOWER(COALESCE(p.name,'')) ASC,p.product_id ASC
    LIMIT ? OFFSET ?
  `).bind(normalizeText(q).toLowerCase(), like, like, limit, offset).all();

  return rows(result).map((row) => ({
    product_id: n(row.product_id),
    product_name: row.product_name || '',
    product_status: row.product_status || '',
    featured_image_url: row.featured_image_url || '',
    gallery_count: n(row.gallery_count),
    unique_gallery_count: n(row.unique_gallery_count),
    snapshot_product_image_count: n(row.snapshot_product_image_count),
    media_asset_count: n(row.media_asset_count),
    role_assignment_image_count: n(row.role_assignment_image_count),
    annotation_image_count: n(row.annotation_image_count),
    recoverable_unique_image_count: n(row.recoverable_unique_image_count),
    snapshot_created_at: row.snapshot_created_at || null,
    issues: mediaIssues(row),
    owner_url: `/admin/catalog-media/?product_id=${n(row.product_id)}#product-media-workflow`,
  }));
}

export async function onRequestGet({ request, env }) {
  const db = getDb(env);
  if (!db) return json({ ok: false, build: BUILD, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, build: BUILD, error: 'Unauthorized.' }, 401);

  const url = new URL(request.url);
  const queue = safeQueue(url.searchParams.get('queue'));
  const q = normalizeText(url.searchParams.get('q')).slice(0, 120);
  const limit = Math.max(10, Math.min(MAX_LIMIT, Math.trunc(n(url.searchParams.get('limit'), 40)) || 40));
  const offset = Math.max(0, Math.trunc(n(url.searchParams.get('offset'), 0)) || 0);

  try {
    const [ingredient, media, ingredient_summary, media_summary] = await Promise.all([
      queue === 'media' ? Promise.resolve([]) : loadIngredientQueue(db, { q, limit, offset }),
      queue === 'ingredient' ? Promise.resolve([]) : loadMediaQueue(db, { q, limit, offset }),
      ingredientSummary(db),
      mediaSummary(db),
    ]);
    return json({
      ok: true,
      build: BUILD,
      mode: 'product-integrity-review',
      mutation_capability: 'none',
      queue,
      q,
      limit,
      offset,
      ingredient,
      media,
      summary: { ingredient: ingredient_summary, media: media_summary },
      owner_workspaces: { ingredient: '/admin/catalog/', media: '/admin/catalog-media/' },
    });
  } catch (error) {
    return json({
      ok: false,
      build: BUILD,
      code: 'product_integrity_review_failed',
      error: normalizeText(error?.message) || 'Product integrity review could not be loaded.',
      mutation_capability: 'none',
    }, 500);
  }
}

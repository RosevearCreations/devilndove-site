// File: /functions/api/admin/product-image-health.js
// Brief description: Admin-only product image and media coverage health report.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function safeIdentifier(value) { const clean = normalizeText(value); return /^[A-Za-z_][A-Za-z0-9_]*$/.test(clean) ? clean : ''; }
async function tableExists(db, tableName) { try { return !!(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first()); } catch { return false; } }
async function tableColumns(db, tableName) { const safeTable = safeIdentifier(tableName); if (!safeTable) return new Set(); try { return new Set(rows(await db.prepare(`PRAGMA table_info(${safeTable})`).all()).map((row) => normalizeText(row.name).toLowerCase()).filter(Boolean)); } catch { return new Set(); } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }

function productFilterSql(productCols) {
  if (productCols.has('status')) return "COALESCE(p.status,'draft') != 'archived'";
  return '1=1';
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  if (!(await tableExists(db, 'products'))) return jsonResponse({ ok: true, summary: { status: 'warning', warning: 'products table is missing.' }, checks: [] });

  const productCols = await tableColumns(db, 'products');
  const hasProductImages = await tableExists(db, 'product_images');
  const hasMediaAssets = await tableExists(db, 'media_assets');
  const featuredExpression = productCols.has('featured_image_url') ? "COALESCE(p.featured_image_url,'') <> ''" : '0';
  const statusExpression = productFilterSql(productCols);
  const activeProducts = await safeFirst(db, `SELECT COUNT(*) AS total FROM products p WHERE ${statusExpression}`, [], { total: 0 });
  const featuredProducts = await safeFirst(db, `SELECT COUNT(*) AS total FROM products p WHERE ${statusExpression} AND ${featuredExpression}`, [], { total: 0 });

  const imageCounts = hasProductImages ? await safeFirst(db, `
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN COALESCE(image_url,'') = '' THEN 1 ELSE 0 END) AS missing_url,
           SUM(CASE WHEN COALESCE(alt_text,'') = '' THEN 1 ELSE 0 END) AS missing_alt
    FROM product_images
  `, [], { total: 0, missing_url: 0, missing_alt: 0 }) : { total: 0, missing_url: 0, missing_alt: 0 };

  const mediaCounts = hasMediaAssets ? await safeFirst(db, `
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN COALESCE(public_url,'') = '' THEN 1 ELSE 0 END) AS missing_public_url,
           SUM(CASE WHEN COALESCE(object_key,'') = '' THEN 1 ELSE 0 END) AS missing_object_key
    FROM media_assets
  `, [], { total: 0, missing_public_url: 0, missing_object_key: 0 }) : { total: 0, missing_public_url: 0, missing_object_key: 0 };

  const noImageRows = hasProductImages ? await safeAll(db, `
    SELECT p.product_id, ${productCols.has('name') ? 'p.name' : "'' AS name"}, ${productCols.has('slug') ? 'p.slug' : "'' AS slug"}, ${productCols.has('status') ? 'p.status' : "'' AS status"}, COUNT(pi.product_image_id) AS image_count
    FROM products p
    LEFT JOIN product_images pi ON pi.product_id = p.product_id AND COALESCE(pi.image_url,'') <> ''
    WHERE ${statusExpression}
    GROUP BY p.product_id
    HAVING image_count = 0 AND NOT (${featuredExpression})
    ORDER BY p.product_id DESC
    LIMIT 25
  `) : await safeAll(db, `
    SELECT p.product_id, ${productCols.has('name') ? 'p.name' : "'' AS name"}, ${productCols.has('slug') ? 'p.slug' : "'' AS slug"}, ${productCols.has('status') ? 'p.status' : "'' AS status"}
    FROM products p
    WHERE ${statusExpression} AND NOT (${featuredExpression})
    ORDER BY p.product_id DESC LIMIT 25
  `);

  const lowAltRows = hasProductImages ? await safeAll(db, `
    SELECT pi.product_image_id, pi.product_id, ${productCols.has('name') ? 'p.name' : "'' AS name"}, pi.image_url, COALESCE(pi.alt_text,'') AS alt_text
    FROM product_images pi
    LEFT JOIN products p ON p.product_id = pi.product_id
    WHERE COALESCE(pi.image_url,'') <> '' AND LENGTH(TRIM(COALESCE(pi.alt_text,''))) < 5
    ORDER BY pi.product_image_id DESC
    LIMIT 25
  `) : [];

  const checks = [
    {
      status: Number(activeProducts.total || 0) === 0 ? 'warn' : 'pass',
      label: 'Products present',
      detail: `${Number(activeProducts.total || 0)} non-archived product row(s) found.`,
      action: Number(activeProducts.total || 0) ? '' : 'Create or import products before judging storefront image coverage.'
    },
    {
      status: Number(featuredProducts.total || 0) >= Number(activeProducts.total || 0) || Number(activeProducts.total || 0) === 0 ? 'pass' : 'warn',
      label: 'Featured image coverage',
      detail: `${Number(featuredProducts.total || 0)} of ${Number(activeProducts.total || 0)} non-archived product(s) have a featured image URL.`,
      action: 'Use Product editor image upload or image library picker for missing draft images.'
    },
    {
      status: Number(imageCounts.missing_alt || 0) === 0 ? 'pass' : 'warn',
      label: 'Image alt text coverage',
      detail: `${Number(imageCounts.missing_alt || 0)} product image row(s) have short or missing alt text.`,
      action: 'Fill product image alt text before publishing.'
    },
    {
      status: Number(mediaCounts.missing_public_url || 0) === 0 ? 'pass' : 'warn',
      label: 'Uploaded media public URLs',
      detail: `${Number(mediaCounts.missing_public_url || 0)} uploaded media row(s) are missing public_url.`,
      action: 'Run Media/R2 Diagnostics and confirm the public base URL setting or fallback.'
    }
  ];

  const warnCount = checks.filter((row) => row.status === 'warn').length;
  const failCount = checks.filter((row) => row.status === 'fail').length;
  return jsonResponse({
    ok: true,
    generated_at: new Date().toISOString(),
    summary: {
      status: failCount ? 'fail' : (warnCount ? 'warning' : 'ok'),
      active_products: Number(activeProducts.total || 0),
      products_with_featured_image: Number(featuredProducts.total || 0),
      product_images_total: Number(imageCounts.total || 0),
      media_assets_total: Number(mediaCounts.total || 0),
      warning_count: warnCount,
      fail_count: failCount,
    },
    checks,
    counts: { active_products: activeProducts, featured_products: featuredProducts, image_counts: imageCounts, media_counts: mediaCounts },
    missing_image_products: noImageRows,
    low_alt_images: lowAltRows,
  }, 200, { 'Cache-Control': 'no-store' });
}

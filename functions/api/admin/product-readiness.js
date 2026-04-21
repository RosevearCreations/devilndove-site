import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) { return jsonResponse(data, status); }
function nr(result) { return Array.isArray(result?.results) ? result.results : []; }
async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(nr(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch { return new Set(); }
}

function buildChecks(row = {}, imageHistory = []) {
  const imageCount = Number(row.image_count || 0);
  const altCoverage = Number(row.alt_coverage_count || 0);
  const firstImage = imageHistory[0] || null;
  const firstOrientation = String(firstImage?.image_orientation || '').toLowerCase();
  const firstWidth = Number(firstImage?.width_px || 0);
  const firstHeight = Number(firstImage?.height_px || 0);
  const firstImageScore = Number(firstImage?.first_image_score || 0);
  const hasCropHistory = firstImage && firstImage.crop_x != null && firstImage.crop_y != null && firstImage.crop_width != null && firstImage.crop_height != null;
  const knowsFirstDimensions = firstWidth > 0 && firstHeight > 0;
  const checks = [];
  checks.push({ key: 'name', ok: normalizeText(row.name).length > 0, label: 'Product name present', weight: 10 });
  checks.push({ key: 'slug', ok: normalizeText(row.slug).length > 0, label: 'Slug present', weight: 8 });
  checks.push({ key: 'price', ok: Number(row.price_cents || 0) > 0, label: 'Price set', weight: 12 });
  checks.push({ key: 'featured_image', ok: normalizeText(row.featured_image_url).length > 0, label: 'Featured image present', weight: 12 });
  checks.push({ key: 'image_count', ok: imageCount >= 3, label: 'At least 3 product photos', weight: 12 });
  checks.push({ key: 'image_alt', ok: imageCount > 0 && altCoverage >= Math.min(3, imageCount), label: 'Alt text filled on first product photos', weight: 8 });
  checks.push({ key: 'short_description', ok: normalizeText(row.short_description).length >= 40, label: 'Short description present', weight: 10 });
  checks.push({ key: 'description', ok: normalizeText(row.description).length >= 120, label: 'Full description has enough detail', weight: 8 });
  checks.push({ key: 'seo_title', ok: normalizeText(row.meta_title).length >= 10, label: 'SEO title present', weight: 8 });
  checks.push({ key: 'seo_description', ok: normalizeText(row.meta_description).length >= 50, label: 'SEO description present', weight: 8 });
  checks.push({ key: 'category', ok: normalizeText(row.product_category).length > 0, label: 'Category present', weight: 4 });
  checks.push({ key: 'first_image_shape', ok: !knowsFirstDimensions || ['square', 'landscape'].includes(firstOrientation), label: 'First image is square or landscape', weight: 6 });
  checks.push({ key: 'first_image_size', ok: !knowsFirstDimensions || (firstWidth >= 800 && firstHeight >= 800), label: 'First image is at least 800×800', weight: 6 });
  checks.push({ key: 'first_image_crop_history', ok: !normalizeText(row.featured_image_url) || hasCropHistory, label: 'First image crop history saved', weight: 4 });
  checks.push({ key: 'first_image_score', ok: !normalizeText(row.featured_image_url) || firstImageScore >= 70, label: 'First image quality score is strong enough', weight: 4 });

  const totalWeight = checks.reduce((sum, item) => sum + item.weight, 0);
  const earnedWeight = checks.reduce((sum, item) => sum + (item.ok ? item.weight : 0), 0);
  const failed = checks.filter((item) => !item.ok);
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const imageQualityBase = [
    normalizeText(row.featured_image_url).length > 0 ? 1 : 0,
    Math.min(imageCount, 5) / 5,
    imageCount > 0 ? Math.min(altCoverage / imageCount, 1) : 0,
    !knowsFirstDimensions ? 0.75 : ((['square', 'landscape'].includes(firstOrientation) && firstWidth >= 800 && firstHeight >= 800) ? 1 : 0.35)
  ];
  const imageQualityScore = Math.round((imageQualityBase.reduce((sum, value) => sum + value, 0) / imageQualityBase.length) * 100);

  return {
    checks,
    publish_readiness_score: score,
    image_quality_score: imageQualityScore,
    media_completeness_score: Math.round((((imageCount >= 3 ? 1 : imageCount / 3) + (imageCount > 0 ? Math.min(altCoverage / Math.max(imageCount, 1), 1) : 0) + (knowsFirstDimensions ? 1 : 0.5) + (hasCropHistory ? 1 : 0.4)) / 4) * 100),
    is_ready_for_storefront: failed.length === 0 ? 1 : 0,
    ready_check_notes: failed.map((item) => item.label).join('; '),
    photo_completeness_warning: imageCount >= 3 ? '' : 'Add more product photos before publishing.',
    first_image_warning: normalizeText(row.featured_image_url).length > 0
      ? (knowsFirstDimensions && !['square', 'landscape'].includes(firstOrientation) ? 'The first image is portrait. Use a square or landscape first image for stronger listing quality.' : (!hasCropHistory ? 'Save crop history on the first image for stronger merchandising control.' : (firstImageScore < 70 ? 'Improve the first image quality score before publishing.' : '')))
      : 'Choose a first image before publishing.'
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const productId = Number(new URL(request.url).searchParams.get('product_id') || 0);
  if (!productId) return json({ ok: false, error: 'product_id is required.' }, 400);

  const annotationCols = await getTableColumnSet(db, 'product_image_annotations');
  const hasDims = annotationCols.has('width_px') && annotationCols.has('height_px');
  const row = await db.prepare(`
    SELECT p.*, ps.meta_title, ps.meta_description,
           COUNT(DISTINCT pi.product_image_id) AS image_count,
           SUM(CASE WHEN LENGTH(TRIM(COALESCE(pi.alt_text,''))) >= 5 THEN 1 ELSE 0 END) AS alt_coverage_count
    FROM products p
    LEFT JOIN product_seo ps ON ps.product_id = p.product_id
    LEFT JOIN product_images pi ON pi.product_id = p.product_id
    WHERE p.product_id = ?
    GROUP BY p.product_id
    LIMIT 1
  `).bind(productId).first();
  if (!row) return json({ ok: false, error: 'Product not found.' }, 404);

  const imageHistory = nr(await db.prepare(`
    SELECT pi.product_image_id, pi.image_url, pi.alt_text, pi.sort_order,
           ${annotationCols.has('width_px') ? 'pia.width_px' : 'NULL AS width_px'},
           ${annotationCols.has('height_px') ? 'pia.height_px' : 'NULL AS height_px'},
           ${annotationCols.has('image_orientation') ? 'pia.image_orientation' : 'NULL AS image_orientation'},
           ${annotationCols.has('annotation_notes') ? 'pia.annotation_notes' : 'NULL AS annotation_notes'},
           ${annotationCols.has('crop_x') ? 'pia.crop_x' : 'NULL AS crop_x'},
           ${annotationCols.has('crop_y') ? 'pia.crop_y' : 'NULL AS crop_y'},
           ${annotationCols.has('crop_width') ? 'pia.crop_width' : 'NULL AS crop_width'},
           ${annotationCols.has('crop_height') ? 'pia.crop_height' : 'NULL AS crop_height'},
           ${annotationCols.has('first_image_score') ? 'pia.first_image_score' : 'NULL AS first_image_score'}
    FROM product_images pi
    LEFT JOIN product_image_annotations pia ON pia.product_image_id = pi.product_image_id
    WHERE pi.product_id = ?
    ORDER BY pi.sort_order ASC, pi.product_image_id ASC
    LIMIT 10
  `).bind(productId).all().catch(() => ({ results: [] }))).map((row) => ({
    product_image_id: Number(row.product_image_id || 0),
    image_url: row.image_url || '',
    alt_text: row.alt_text || '',
    sort_order: Number(row.sort_order || 0),
    width_px: row.width_px == null ? null : Number(row.width_px || 0),
    height_px: row.height_px == null ? null : Number(row.height_px || 0),
    image_orientation: row.image_orientation || '',
    annotation_notes: row.annotation_notes || '',
    crop_x: row.crop_x == null ? null : Number(row.crop_x || 0),
    crop_y: row.crop_y == null ? null : Number(row.crop_y || 0),
    crop_width: row.crop_width == null ? null : Number(row.crop_width || 0),
    crop_height: row.crop_height == null ? null : Number(row.crop_height || 0),
    first_image_score: row.first_image_score == null ? null : Number(row.first_image_score || 0)
  }));

  const readiness = buildChecks(row, imageHistory);
  return json({ ok: true, product_id: productId, image_dimension_history_available: hasDims, image_dimension_history: imageHistory, ...readiness });
}

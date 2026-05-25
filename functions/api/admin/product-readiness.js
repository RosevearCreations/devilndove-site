import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) { return jsonResponse(data, status); }
function nr(result) { return Array.isArray(result?.results) ? result.results : []; }
async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(nr(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch { return new Set(); }
}

function metricOrDefault(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function hasOverrideReason(row = {}) {
  return normalizeText(row.merchandising_override_reason).length > 0;
}

function buildChecks(row = {}, imageHistory = []) {
  const imageCount = Number(row.image_count || 0);
  const altCoverage = Number(row.alt_coverage_count || 0);
  const firstImage = imageHistory[0] || null;
  const firstOrientation = String(firstImage?.image_orientation || '').toLowerCase();
  const firstWidth = Number(firstImage?.width_px || 0);
  const firstHeight = Number(firstImage?.height_px || 0);
  const firstImageScore = Number(firstImage?.merchandising_score ?? firstImage?.first_image_score ?? 0);
  const averageMerchandisingScore = imageHistory.length
    ? Math.round(imageHistory.reduce((sum, item) => sum + Number(item?.merchandising_score ?? item?.first_image_score ?? 0), 0) / imageHistory.length)
    : 0;
  const effectiveGalleryMerchandisingScore = imageHistory.length
    ? Math.round(imageHistory.reduce((sum, item, index) => {
        const score = Number(item?.merchandising_score ?? item?.first_image_score ?? 0);
        if (index > 0 && score < 64 && hasOverrideReason(item)) return sum + 64;
        return sum + score;
      }, 0) / imageHistory.length)
    : 0;
  const overriddenGalleryImageCount = imageHistory.filter((item, index) => index > 0 && hasOverrideReason(item)).length;
  const weakUnapprovedGalleryImageCount = imageHistory.filter((item, index) => index > 0 && Number(item?.merchandising_score ?? item?.first_image_score ?? 0) < 64 && !hasOverrideReason(item)).length;
  const hasCropHistory = firstImage && firstImage.crop_x != null && firstImage.crop_y != null && firstImage.crop_width != null && firstImage.crop_height != null;
  const contextualShotCount = imageHistory.filter((item) => ['detail','lifestyle','process','packaging','scale_reference'].includes(String(item?.shot_style || '').toLowerCase())).length;
  const missingImageRoleCount = imageHistory.filter((item) => !normalizeText(item?.image_role)).length;
  const hasHeroRole = imageHistory.some((item, index) => (normalizeText(item?.image_role).toLowerCase() || (index === 0 ? 'hero_front' : '')) === 'hero_front');
  const publicBlockedCount = imageHistory.filter((item) => ['consent_needed','blocked'].includes(normalizeText(item?.public_use_status).toLowerCase())).length;
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
  checks.push({ key: 'first_image_score', ok: !normalizeText(row.featured_image_url) || firstImageScore >= 72, label: 'First image merchandising score is strong enough', weight: 6 });
  checks.push({ key: 'gallery_score', ok: imageCount === 0 || (effectiveGalleryMerchandisingScore >= 64 && weakUnapprovedGalleryImageCount === 0), label: 'Gallery merchandising score is strong enough', weight: 4 });
  checks.push({ key: 'shot_mix', ok: imageCount < 4 || contextualShotCount >= 1, label: 'Gallery includes at least one detail, lifestyle, process, packaging, or scale shot', weight: 4 });
  checks.push({ key: 'image_roles_documented', ok: imageCount === 0 || missingImageRoleCount === 0, label: 'Every product image has a storefront role', weight: 8 });
  checks.push({ key: 'hero_role_present', ok: imageCount === 0 || hasHeroRole, label: 'One image is marked as the hero/front role', weight: 6 });
  checks.push({ key: 'public_use_allowed', ok: publicBlockedCount === 0, label: 'No storefront image is blocked or waiting for consent', weight: 8 });

  const totalWeight = checks.reduce((sum, item) => sum + item.weight, 0);
  const earnedWeight = checks.reduce((sum, item) => sum + (item.ok ? item.weight : 0), 0);
  const failed = checks.filter((item) => !item.ok);
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const imageQualityBase = [
    normalizeText(row.featured_image_url).length > 0 ? 1 : 0,
    Math.min(imageCount, 5) / 5,
    imageCount > 0 ? Math.min(altCoverage / imageCount, 1) : 0,
    firstImageScore / 100,
    effectiveGalleryMerchandisingScore / 100
  ];
  const imageQualityScore = Math.round((imageQualityBase.reduce((sum, value) => sum + value, 0) / imageQualityBase.length) * 100);

  const leadWarnings = [];
  if (!normalizeText(row.featured_image_url)) leadWarnings.push('Choose a first image before publishing.');
  else {
    if (knowsFirstDimensions && !['square', 'landscape'].includes(firstOrientation)) leadWarnings.push('The first image is portrait. Use a square or landscape first image for stronger listing quality.');
    if (!hasCropHistory) leadWarnings.push('Save crop history on the first image for stronger merchandising control.');
    if (firstImageScore < 72) leadWarnings.push('Improve the first image merchandising score before publishing.');
  }
  if (overriddenGalleryImageCount > 0) leadWarnings.push(`${overriddenGalleryImageCount} gallery image(s) are being kept by documented override reason.`);
  if (weakUnapprovedGalleryImageCount > 0) leadWarnings.push(`${weakUnapprovedGalleryImageCount} gallery image(s) are still weak without an override reason.`);
  if (imageCount >= 4 && contextualShotCount < 1) leadWarnings.push('Add at least one detail, lifestyle, process, packaging, or scale-reference image to improve the gallery mix.');
  if (missingImageRoleCount > 0) leadWarnings.push(`${missingImageRoleCount} image(s) still need a storefront role before approval.`);
  if (imageCount > 0 && !hasHeroRole) leadWarnings.push('Mark one image as Hero/front before approval.');
  if (publicBlockedCount > 0) leadWarnings.push(`${publicBlockedCount} image(s) are blocked or waiting for consent.`);

  return {
    checks,
    publish_readiness_score: score,
    image_quality_score: imageQualityScore,
    merchandising_score: averageMerchandisingScore,
    effective_gallery_merchandising_score: effectiveGalleryMerchandisingScore,
    lead_image_merchandising_score: firstImageScore,
    overridden_gallery_image_count: overriddenGalleryImageCount,
    weak_unapproved_gallery_image_count: weakUnapprovedGalleryImageCount,
    contextual_shot_count: contextualShotCount,
    missing_image_role_count: missingImageRoleCount,
    hero_image_role_present: hasHeroRole ? 1 : 0,
    public_blocked_image_count: publicBlockedCount,
    media_completeness_score: Math.round((((imageCount >= 3 ? 1 : imageCount / 3) + (imageCount > 0 ? Math.min(altCoverage / Math.max(imageCount, 1), 1) : 0) + (knowsFirstDimensions ? 1 : 0.5) + (hasCropHistory ? 1 : 0.4)) / 4) * 100),
    is_ready_for_storefront: failed.length === 0 ? 1 : 0,
    ready_check_notes: failed.map((item) => item.label).join('; '),
    photo_completeness_warning: imageCount >= 3 ? '' : 'Add more product photos before publishing.',
    first_image_warning: leadWarnings.join(' ')
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
           ${annotationCols.has('image_role') ? 'pia.image_role' : 'NULL AS image_role'},
           ${annotationCols.has('public_use_status') ? 'pia.public_use_status' : 'NULL AS public_use_status'},
           ${annotationCols.has('consent_record_id') ? 'pia.consent_record_id' : 'NULL AS consent_record_id'},
           ${annotationCols.has('crop_x') ? 'pia.crop_x' : 'NULL AS crop_x'},
           ${annotationCols.has('crop_y') ? 'pia.crop_y' : 'NULL AS crop_y'},
           ${annotationCols.has('crop_width') ? 'pia.crop_width' : 'NULL AS crop_width'},
           ${annotationCols.has('crop_height') ? 'pia.crop_height' : 'NULL AS crop_height'},
           ${annotationCols.has('first_image_score') ? 'pia.first_image_score' : 'NULL AS first_image_score'},
           ${annotationCols.has('merchandising_score') ? 'pia.merchandising_score' : 'NULL AS merchandising_score'},
           ${annotationCols.has('background_consistency_score') ? 'pia.background_consistency_score' : 'NULL AS background_consistency_score'},
           ${annotationCols.has('subject_fill_score') ? 'pia.subject_fill_score' : 'NULL AS subject_fill_score'},
           ${annotationCols.has('sharpness_score') ? 'pia.sharpness_score' : 'NULL AS sharpness_score'},
           ${annotationCols.has('brightness_score') ? 'pia.brightness_score' : 'NULL AS brightness_score'},
           ${annotationCols.has('contrast_score') ? 'pia.contrast_score' : 'NULL AS contrast_score'},
           ${annotationCols.has('angle_group') ? 'pia.angle_group' : 'NULL AS angle_group'},
           ${annotationCols.has('shot_style') ? 'pia.shot_style' : 'NULL AS shot_style'},
           ${annotationCols.has('merchandising_override_reason') ? 'pia.merchandising_override_reason' : 'NULL AS merchandising_override_reason'},
           ${annotationCols.has('merchandising_override_note') ? 'pia.merchandising_override_note' : 'NULL AS merchandising_override_note'}
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
    image_role: row.image_role || '',
    public_use_status: row.public_use_status || '',
    consent_record_id: row.consent_record_id == null ? null : Number(row.consent_record_id || 0),
    crop_x: row.crop_x == null ? null : Number(row.crop_x || 0),
    crop_y: row.crop_y == null ? null : Number(row.crop_y || 0),
    crop_width: row.crop_width == null ? null : Number(row.crop_width || 0),
    crop_height: row.crop_height == null ? null : Number(row.crop_height || 0),
    first_image_score: row.first_image_score == null ? null : Number(row.first_image_score || 0),
    merchandising_score: row.merchandising_score == null ? null : Number(row.merchandising_score || 0),
    background_consistency_score: row.background_consistency_score == null ? null : Number(row.background_consistency_score || 0),
    subject_fill_score: row.subject_fill_score == null ? null : Number(row.subject_fill_score || 0),
    sharpness_score: row.sharpness_score == null ? null : Number(row.sharpness_score || 0),
    brightness_score: row.brightness_score == null ? null : Number(row.brightness_score || 0),
    contrast_score: row.contrast_score == null ? null : Number(row.contrast_score || 0),
    angle_group: row.angle_group || '',
    shot_style: row.shot_style || '',
    merchandising_override_reason: row.merchandising_override_reason || '',
    merchandising_override_note: row.merchandising_override_note || ''
  }));

  const readiness = buildChecks(row, imageHistory);
  return json({ ok: true, product_id: productId, image_dimension_history_available: hasDims, image_dimension_history: imageHistory, ...readiness });
}

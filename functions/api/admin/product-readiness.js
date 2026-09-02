// File: /functions/api/admin/product-readiness.js
// Release 467 Build 14: migration-owned product readiness plus non-mutating image/marketplace quality guidance.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
const json=(data,status=200)=>jsonResponse(data,status,{"Cache-Control":"no-store"});
const rows=(result)=>Array.isArray(result?.results)?result.results:[];

function roleCount(row, key) { return Number(row?.[key] || 0); }

function buildImageRecommendations(row = {}) {
  const imageCount = Number(row.image_count || 0);
  const categoryText = `${normalizeText(row.product_category)} ${normalizeText(row.name)}`.toLowerCase();
  const recommendations = [];
  const add = (role, label, reason) => {
    if (!recommendations.some((item) => item.role === role)) recommendations.push({ role, label, reason });
  };

  if (roleCount(row, 'hero_image_role_count') === 0) add('hero_front', 'Hero/front', 'Add a clean primary view that can carry the product card and listing lead image.');
  if (roleCount(row, 'detail_image_role_count') === 0) add('detail_texture', 'Detail/texture', 'Show workmanship, finish, engraving, surface, clasp, texture, or another buyer-relevant detail.');
  if (roleCount(row, 'scale_image_role_count') === 0) add('scale_context', 'Scale/context', 'Show real-world scale or the product in a useful context so buyers can judge size.');

  if (/soap|candle|wax|bath|body/.test(categoryText) && roleCount(row, 'packaging_pickup_role_count') === 0) {
    add('packaging_pickup', 'Packaging/label', 'Show the finished label or packaging so ingredients, identity, gifting, and pickup presentation are easier to understand.');
  }
  if (/soap|candle|wax|resin|clay|ring|jewel|engrave|laser|wood|metal|cnc|printed|3d/.test(categoryText) && roleCount(row, 'process_story_role_count') === 0) {
    add('process_story', 'Process/story', 'Add a real making/process image when available; it is stronger proof than generic decorative media.');
  }
  if (/ring|jewel|earring|bracelet|necklace|pendant|coin/.test(categoryText) && roleCount(row, 'back_side_role_count') === 0) {
    add('back_side', 'Back/side', 'Show the back, side, clasp, setting, band, or attachment details a buyer cannot see from the hero angle.');
  }
  if (/engrave|laser|wood|metal|cnc|resin|clay|soap|candle|ring|jewel/.test(categoryText) && roleCount(row, 'material_tool_proof_role_count') === 0) {
    add('material_tool_proof', 'Material/tool proof', 'When useful, show the real material or tool/process evidence supporting the product story.');
  }
  if (imageCount < 5) add('gallery_support', 'Supporting gallery view', `The current set has ${imageCount} image${imageCount === 1 ? '' : 's'}; add another distinct buyer-useful angle when real media exists.`);

  return recommendations.slice(0, 6);
}

function buildMarketplaceImageReadiness(row = {}) {
  const imageCount = Number(row.image_count || 0);
  const altCoverage = Number(row.alt_coverage_count || 0);
  const blockedPublicUseCount = Number(row.blocked_public_use_count || 0);
  const duplicateImageUrlCount = Number(row.duplicate_image_url_count || 0);
  const firstWidth = Number(row.first_width_px || 0);
  const firstHeight = Number(row.first_height_px || 0);
  const firstOrientation = String(row.first_image_orientation || '').toLowerCase();
  const firstScore = Number(row.first_merchandising_score || 0);
  const knowsLeadSize = firstWidth > 0 && firstHeight > 0;
  const blockers = [];
  const warnings = [];

  if (imageCount === 0) blockers.push('No product images are available for marketplace preparation.');
  if (imageCount > 0 && altCoverage < Math.min(3, imageCount)) blockers.push('The first marketplace-ready images need useful alt text.');
  if (blockedPublicUseCount > 0) blockers.push(`${blockedPublicUseCount} image(s) still require consent/public-use review.`);
  if (duplicateImageUrlCount > 0) blockers.push(`${duplicateImageUrlCount} duplicate image URL(s) should be removed from the product set.`);
  if (knowsLeadSize && (firstWidth < 800 || firstHeight < 800)) blockers.push('Lead image is under the 800×800 minimum marketplace safety target.');

  if (imageCount > 0 && imageCount < 3) warnings.push('Only one or two product images are available; three or more distinct buyer-useful views are preferred.');
  if (knowsLeadSize && (firstWidth < 1200 || firstHeight < 1200)) warnings.push('Lead image is below the preferred 1200×1200 target.');
  if (firstOrientation === 'portrait') warnings.push('Lead image is portrait; a square or landscape lead is usually easier to reuse across marketplace cards.');
  if (firstScore > 0 && firstScore < 70) warnings.push('Lead image merchandising score is below 70%.');

  return {
    ready: blockers.length === 0,
    blocker_count: blockers.length,
    warning_count: warnings.length,
    blockers,
    warnings,
    duplicate_image_url_count: duplicateImageUrlCount,
    lead_width_px: firstWidth,
    lead_height_px: firstHeight,
    lead_orientation: firstOrientation || 'unknown',
    lead_merchandising_score: firstScore,
  };
}

function buildReadiness(row = {}) {
  const imageCount = Number(row.image_count || 0);
  const altCoverage = Number(row.alt_coverage_count || 0);
  const missingImageRoleCount = Number(row.missing_image_role_count || 0);
  const heroImageRoleCount = Number(row.hero_image_role_count || 0);
  const detailImageRoleCount = Number(row.detail_image_role_count || 0);
  const scaleImageRoleCount = Number(row.scale_image_role_count || 0);
  const blockedPublicUseCount = Number(row.blocked_public_use_count || 0);
  const firstOrientation = String(row.first_image_orientation || "").toLowerCase();
  const firstWidth = Number(row.first_width_px || 0);
  const firstHeight = Number(row.first_height_px || 0);
  const knowsLeadSize = firstWidth > 0 && firstHeight > 0;
  const firstScore = Number(row.first_merchandising_score || 0);
  const averageScore = Number(row.average_merchandising_score || 0);

  const checks = [
    ["Product name", normalizeText(row.name).length > 0, "Add a clear product name."],
    ["Slug", normalizeText(row.slug).length > 0, "Add a slug for the product page URL."],
    ["Price", Number(row.price_cents || 0) > 0, "Set a price greater than $0."],
    ["Featured image", normalizeText(row.featured_image_url).length > 0, "Choose a featured image."],
    ["Image count", imageCount >= 3, "Add at least 3 product images."],
    ["Alt text", imageCount > 0 && altCoverage >= Math.min(3, imageCount), "Add useful alt text to the first 3 images."],
    ["Short description", normalizeText(row.short_description).length >= 40, "Write a short description of at least 40 characters."],
    ["SEO title", normalizeText(row.meta_title).length >= 10, "Add an SEO title."],
    ["SEO meta description", normalizeText(row.meta_description).length >= 50, "Add an SEO meta description of at least 50 characters."],
    ["Category", normalizeText(row.product_category).length > 0, "Choose a product category."],
    ["Hero/front role", imageCount > 0 && heroImageRoleCount > 0, "Mark one image as Hero/front."],
    ["Detail image role", imageCount < 2 || detailImageRoleCount > 0, "Mark one image as Detail/texture when multiple images exist."],
    ["Scale/context role", imageCount < 3 || scaleImageRoleCount > 0, "Mark one image as Scale/context when three or more images exist."],
    ["Image roles", imageCount > 0 && missingImageRoleCount === 0, "Choose an image role for every image row."],
    ["Public-use clearance", blockedPublicUseCount === 0, "Clear or remove images marked Consent needed or Blocked."],
    ["Lead image shape", !knowsLeadSize || ["square", "landscape"].includes(firstOrientation), "Make the lead image square or landscape."],
    ["Lead image size", !knowsLeadSize || (firstWidth >= 800 && firstHeight >= 800), "Use a lead image at least 800×800; 1200×1200 is preferred."],
    ["Lead image score", !normalizeText(row.featured_image_url) || firstScore === 0 || firstScore >= 70, "Improve or override the lead image merchandising score."],
    ["Gallery score", imageCount === 0 || averageScore === 0 || averageScore >= 60, "Improve low-score gallery images or add notes explaining why to keep them."],
    ["Onsite URL fit", ["onsite", "hybrid", "external_only", ""].includes(String(row.sale_channel || "").toLowerCase()), "Review sale channel and external listing URL."],
  ];

  const blockers = checks.filter(([, ok]) => !ok).map(([label, , help]) => ({ label, help }));
  const score = Math.round(((checks.length - blockers.length) / checks.length) * 100);
  const marketplaceImageReadiness = buildMarketplaceImageReadiness(row);

  return {
    ready: blockers.length === 0,
    score,
    blockers,
    image: {
      image_count: imageCount,
      alt_coverage_count: altCoverage,
      missing_image_role_count: missingImageRoleCount,
      hero_image_role_count: heroImageRoleCount,
      detail_image_role_count: detailImageRoleCount,
      scale_image_role_count: scaleImageRoleCount,
      process_story_role_count: Number(row.process_story_role_count || 0),
      packaging_pickup_role_count: Number(row.packaging_pickup_role_count || 0),
      material_tool_proof_role_count: Number(row.material_tool_proof_role_count || 0),
      back_side_role_count: Number(row.back_side_role_count || 0),
      blocked_public_use_count: blockedPublicUseCount,
      duplicate_image_url_count: Number(row.duplicate_image_url_count || 0),
      first_width_px: firstWidth,
      first_height_px: firstHeight,
      first_image_orientation: firstOrientation || "unknown",
      first_merchandising_score: firstScore,
      average_merchandising_score: averageScore
    },
    marketplace_image_readiness: marketplaceImageReadiness,
    image_recommendations: buildImageRecommendations(row),
  };
}

function summarizeProducts(products) {
  const summary = {
    total_products: products.length,
    ready_products: 0,
    blocked_products: 0,
    missing_featured_image: 0,
    missing_required_roles: 0,
    missing_alt_text: 0,
    blocked_public_use: 0,
    missing_seo: 0,
    missing_price: 0,
    needs_three_images: 0,
    marketplace_image_blocked: 0,
    duplicate_image_sets: 0,
    average_score: 0
  };

  for (const product of products) {
    const readiness = product.readiness || {};
    if (readiness.ready) summary.ready_products += 1;
    else summary.blocked_products += 1;
    const labels = new Set((readiness.blockers || []).map((row) => row.label));
    if (labels.has("Featured image")) summary.missing_featured_image += 1;
    if (labels.has("Hero/front role") || labels.has("Detail image role") || labels.has("Scale/context role") || labels.has("Image roles")) summary.missing_required_roles += 1;
    if (labels.has("Alt text")) summary.missing_alt_text += 1;
    if (labels.has("Public-use clearance")) summary.blocked_public_use += 1;
    if (labels.has("SEO title") || labels.has("SEO meta description")) summary.missing_seo += 1;
    if (labels.has("Price")) summary.missing_price += 1;
    if (labels.has("Image count")) summary.needs_three_images += 1;
    if (!readiness.marketplace_image_readiness?.ready) summary.marketplace_image_blocked += 1;
    if (Number(readiness.image?.duplicate_image_url_count || 0) > 0) summary.duplicate_image_sets += 1;
    summary.average_score += Number(readiness.score || 0);
  }

  summary.average_score = products.length ? Math.round(summary.average_score / products.length) : 0;
  return summary;
}

export async function onRequestGet({ request, env }) {
  const db = getDb(env);
  if (!db) return json({ ok:false, error:'Database binding is missing.' },500);
  const adminUser = await getAdminUserFromRequest(request,env);
  if (!adminUser) return json({ ok:false, error:'Unauthorized.' },401);
  const url=new URL(request.url);
  const productId=Number(url.searchParams.get('product_id')||0);
  const limit=Math.max(1,Math.min(300,Number(url.searchParams.get('limit')||160)));
  const showReady=String(url.searchParams.get('show_ready')||'0')==='1';
  try {
    const sql=`
      WITH image_stats AS (
        SELECT pi.product_id,
               COUNT(DISTINCT pi.product_image_id) AS image_count,
               COUNT(DISTINCT CASE WHEN LENGTH(TRIM(COALESCE(pi.alt_text,'')))>=5 THEN pi.product_image_id END) AS alt_coverage_count,
               COUNT(DISTINCT pi.product_image_id)-COUNT(DISTINCT CASE WHEN LENGTH(TRIM(COALESCE(pi.image_url,'')))>0 THEN LOWER(TRIM(pi.image_url)) END) AS duplicate_image_url_count,
               SUM(CASE WHEN COALESCE(NULLIF(TRIM(pia.image_role),''),'')='' THEN 1 ELSE 0 END) AS missing_image_role_count,
               SUM(CASE WHEN LOWER(COALESCE(pia.image_role,''))='hero_front' THEN 1 ELSE 0 END) AS hero_image_role_count,
               SUM(CASE WHEN LOWER(COALESCE(pia.image_role,''))='detail_texture' THEN 1 ELSE 0 END) AS detail_image_role_count,
               SUM(CASE WHEN LOWER(COALESCE(pia.image_role,''))='scale_context' THEN 1 ELSE 0 END) AS scale_image_role_count,
               SUM(CASE WHEN LOWER(COALESCE(pia.image_role,''))='process_story' THEN 1 ELSE 0 END) AS process_story_role_count,
               SUM(CASE WHEN LOWER(COALESCE(pia.image_role,''))='packaging_pickup' THEN 1 ELSE 0 END) AS packaging_pickup_role_count,
               SUM(CASE WHEN LOWER(COALESCE(pia.image_role,''))='material_tool_proof' THEN 1 ELSE 0 END) AS material_tool_proof_role_count,
               SUM(CASE WHEN LOWER(COALESCE(pia.image_role,''))='back_side' THEN 1 ELSE 0 END) AS back_side_role_count,
               SUM(CASE WHEN LOWER(COALESCE(pia.public_use_status,'')) IN ('consent_needed','blocked') THEN 1 ELSE 0 END) AS blocked_public_use_count,
               MAX(CASE WHEN pi.sort_order=0 THEN COALESCE(pia.image_orientation,'') END) AS first_image_orientation,
               MAX(CASE WHEN pi.sort_order=0 THEN COALESCE(pia.width_px,0) END) AS first_width_px,
               MAX(CASE WHEN pi.sort_order=0 THEN COALESCE(pia.height_px,0) END) AS first_height_px,
               MAX(CASE WHEN pi.sort_order=0 THEN COALESCE(pia.merchandising_score,pia.first_image_score,0) END) AS first_merchandising_score,
               AVG(COALESCE(pia.merchandising_score,pia.first_image_score,0)) AS average_merchandising_score
        FROM product_images pi
        LEFT JOIN product_image_annotations pia ON pia.product_image_id=pi.product_image_id
        GROUP BY pi.product_id
      )
      SELECT p.product_id,p.name,p.slug,p.sku,p.status,p.review_status,p.price_cents,p.short_description,
             p.featured_image_url,p.product_category,p.sale_channel,p.updated_at,p.created_at,
             ps.meta_title,ps.meta_description,
             COALESCE(i.image_count,0) AS image_count,COALESCE(i.alt_coverage_count,0) AS alt_coverage_count,
             COALESCE(i.duplicate_image_url_count,0) AS duplicate_image_url_count,
             COALESCE(i.missing_image_role_count,0) AS missing_image_role_count,COALESCE(i.hero_image_role_count,0) AS hero_image_role_count,
             COALESCE(i.detail_image_role_count,0) AS detail_image_role_count,COALESCE(i.scale_image_role_count,0) AS scale_image_role_count,
             COALESCE(i.process_story_role_count,0) AS process_story_role_count,COALESCE(i.packaging_pickup_role_count,0) AS packaging_pickup_role_count,
             COALESCE(i.material_tool_proof_role_count,0) AS material_tool_proof_role_count,COALESCE(i.back_side_role_count,0) AS back_side_role_count,
             COALESCE(i.blocked_public_use_count,0) AS blocked_public_use_count,COALESCE(i.first_image_orientation,'') AS first_image_orientation,
             COALESCE(i.first_width_px,0) AS first_width_px,COALESCE(i.first_height_px,0) AS first_height_px,
             COALESCE(i.first_merchandising_score,0) AS first_merchandising_score,COALESCE(i.average_merchandising_score,0) AS average_merchandising_score
      FROM products p
      LEFT JOIN product_seo ps ON ps.product_id=p.product_id
      LEFT JOIN image_stats i ON i.product_id=p.product_id
      ${productId>0?'WHERE p.product_id=?':''}
      ORDER BY datetime(COALESCE(p.updated_at,p.created_at,'1970-01-01')) DESC,p.product_id DESC
      LIMIT ?`;
    const stmt=db.prepare(sql);
    const result=productId>0?await stmt.bind(productId,limit).all():await stmt.bind(limit).all();
    const products=rows(result).map((row)=>({
      product_id:Number(row.product_id||0),name:normalizeText(row.name),slug:normalizeText(row.slug),sku:normalizeText(row.sku),
      status:normalizeText(row.status),review_status:normalizeText(row.review_status),price_cents:Number(row.price_cents||0),
      short_description:normalizeText(row.short_description),featured_image_url:normalizeText(row.featured_image_url),product_category:normalizeText(row.product_category),
      sale_channel:normalizeText(row.sale_channel),readiness:buildReadiness(row)
    }));
    return json({ok:true,release:467,build:14,contract:'release467-build14-product-release-quality',read_only:true,request_time_schema_mutation:false,products:showReady?products:products.filter((p)=>!p.readiness.ready),summary:summarizeProducts(products),generated_at:new Date().toISOString(),requested_by:{user_id:adminUser.user_id,email:adminUser.email}});
  } catch(error) {
    return json({ok:false,error:error?.message||'Failed to load product readiness preview.',code:'product_readiness_failed',hint:'Apply the current canonical D1 migration and retry. Readiness never creates schema during a live request.',request_time_schema_mutation:false},500);
  }
}

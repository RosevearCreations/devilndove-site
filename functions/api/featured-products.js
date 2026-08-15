// File: /functions/api/featured-products.js
// Brief description: Small public storefront endpoint for a safe, curated featured-products section.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value) { return String(value || '').trim(); }
function positiveInt(value, fallback, max) { const num = Number(value); return Number.isInteger(num) && num > 0 ? Math.min(num, max) : fallback; }
async function tableExists(db, tableName) { return Boolean(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first().catch(() => null)); }
async function tableColumns(db, tableName) { try { const result = await db.prepare(`PRAGMA table_info(${tableName})`).all(); return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean)); } catch { return new Set(); } }

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB || env.DD_DB;
  if (!db) return json({ ok: true, products: [], warning: 'Store data is temporarily unavailable.' }, 200);
  const url = new URL(request.url);
  const limit = positiveInt(url.searchParams.get('limit'), 6, 12);
  try {
    const hasDisplayPriority = await tableExists(db, 'public_display_priorities');
    const productRows = rows(await db.prepare(hasDisplayPriority ? `
      SELECT p.product_id, p.slug, p.name, p.product_category, p.short_description, p.price_cents, p.currency,
             p.featured_image_url, p.merchandise_origin, p.sale_channel, p.inventory_tracking, p.inventory_quantity,
             p.requires_shipping, p.created_at, p.updated_at
      FROM products p
      LEFT JOIN public_display_priorities d
        ON d.surface_key='home_featured' AND d.record_type='product' AND d.record_id=p.product_id
      WHERE COALESCE(p.status,'active') = 'active'
        AND COALESCE(p.review_status,'published') IN ('approved','published','')
      ORDER BY COALESCE(d.is_pinned,0) DESC, COALESCE(d.priority_rank,9999) ASC,
               COALESCE(p.sort_order, 999999) ASC,
               datetime(COALESCE(p.updated_at, p.created_at, CURRENT_TIMESTAMP)) DESC, p.product_id DESC
      LIMIT ?
    ` : `
      SELECT product_id, slug, name, product_category, short_description, price_cents, currency,
             featured_image_url, merchandise_origin, sale_channel, inventory_tracking, inventory_quantity,
             requires_shipping, created_at, updated_at
      FROM products
      WHERE COALESCE(status,'active') = 'active'
        AND COALESCE(review_status,'published') IN ('approved','published','')
      ORDER BY COALESCE(sort_order, 999999) ASC,
               datetime(COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)) DESC, product_id DESC
      LIMIT ?
    `).bind(limit).all());
    const ids = productRows.map((row) => Number(row.product_id || 0)).filter(Boolean);
    // Build 207: never use an image that the product-media review has explicitly
    // blocked or marked consent-needed. A linked consent record must authorize public use.
    const [hasAnnotations, hasConsent] = await Promise.all([tableExists(db, 'product_image_annotations'), tableExists(db, 'media_consent_records')]);
    const annotationColumns = hasAnnotations ? await tableColumns(db, 'product_image_annotations') : new Set();
    const consentColumns = hasConsent ? await tableColumns(db, 'media_consent_records') : new Set();
    const canJoinAnnotations = annotationColumns.has('product_image_id');
    const canJoinConsent = canJoinAnnotations && annotationColumns.has('consent_record_id') && consentColumns.has('consent_record_id');
    const annotationStatus = canJoinAnnotations && annotationColumns.has('public_use_status') ? "COALESCE(pia.public_use_status,'internal_review')" : "'internal_review'";
    const consentAllowed = canJoinConsent && consentColumns.has('public_use_allowed') ? 'COALESCE(mcr.public_use_allowed,0)=1' : '0=1';
    const consentGranted = canJoinConsent && consentColumns.has('consent_status') && consentColumns.has('consent_scope')
      ? "(LOWER(COALESCE(mcr.consent_status,'')) IN ('granted','not_required') AND LOWER(COALESCE(mcr.consent_scope,'')) IN ('product_page','website_gallery','all_public'))"
      : '0=1';
    const annotationConsentId = canJoinAnnotations && annotationColumns.has('consent_record_id') ? 'COALESCE(pia.consent_record_id,0)' : '0';
    const imageSafetyClause = canJoinAnnotations
      ? `AND LOWER(${annotationStatus}) NOT IN ('blocked','consent_needed') AND (${annotationConsentId}=0 OR ${consentAllowed} OR ${consentGranted})`
      : '';
    const images = ids.length ? rows(await db.prepare(`
      SELECT pi.product_id, pi.image_url,
             ${canJoinAnnotations && annotationColumns.has('alt_text') ? "COALESCE(pia.alt_text, pi.alt_text, '')" : "COALESCE(pi.alt_text, '')"} AS alt_text,
             pi.sort_order
      FROM product_images pi
      ${canJoinAnnotations ? 'LEFT JOIN product_image_annotations pia ON pia.product_image_id=pi.product_image_id' : ''}
      ${canJoinConsent ? 'LEFT JOIN media_consent_records mcr ON mcr.consent_record_id=pia.consent_record_id' : ''}
      WHERE pi.product_id IN (${ids.map(() => '?').join(',')})
        AND COALESCE(pi.image_url,'') <> ''
        ${imageSafetyClause}
      ORDER BY pi.product_id ASC, COALESCE(pi.sort_order,0) ASC, pi.product_image_id ASC
    `).bind(...ids).all().catch(() => ({ results: [] }))) : [];
    // A product can still carry a legacy featured_image_url. If it points to a
    // reviewed gallery image that is blocked or lacks a required public-use consent,
    // never let that legacy field bypass the image gate.
    const unsafeImageRows = ids.length && canJoinAnnotations ? rows(await db.prepare(`
      SELECT pi.product_id, pi.image_url
      FROM product_images pi
      LEFT JOIN product_image_annotations pia ON pia.product_image_id=pi.product_image_id
      ${canJoinConsent ? 'LEFT JOIN media_consent_records mcr ON mcr.consent_record_id=pia.consent_record_id' : ''}
      WHERE pi.product_id IN (${ids.map(() => '?').join(',')})
        AND COALESCE(pi.image_url,'') <> ''
        AND (
          LOWER(${annotationStatus}) IN ('blocked','consent_needed')
          OR (${annotationConsentId}<>0 AND NOT (${consentAllowed} OR ${consentGranted}))
        )
    `).bind(...ids).all().catch(() => ({ results: [] }))) : [];
    const stories = ids.length ? rows(await db.prepare(`
      SELECT product_id, story_heading, story_summary
      FROM product_story_public_notes
      WHERE product_id IN (${ids.map(() => '?').join(',')})
        AND COALESCE(display_status,'draft') IN ('approved','published')
        AND COALESCE(privacy_status,'needs_review') IN ('safe','private_detail_removed')
      ORDER BY datetime(COALESCE(updated_at,created_at,CURRENT_TIMESTAMP)) DESC
    `).bind(...ids).all().catch(() => ({ results: [] }))) : [];
    const firstImageByProduct = new Map();
    images.forEach((row) => { if (!firstImageByProduct.has(Number(row.product_id || 0))) firstImageByProduct.set(Number(row.product_id || 0), row); });
    const unsafeUrlsByProduct = new Map();
    unsafeImageRows.forEach((row) => {
      const productId = Number(row.product_id || 0);
      const imageUrl = clean(row.image_url).toLowerCase();
      if (!productId || !imageUrl) return;
      if (!unsafeUrlsByProduct.has(productId)) unsafeUrlsByProduct.set(productId, new Set());
      unsafeUrlsByProduct.get(productId).add(imageUrl);
    });
    const firstStoryByProduct = new Map();
    stories.forEach((row) => { if (!firstStoryByProduct.has(Number(row.product_id || 0))) firstStoryByProduct.set(Number(row.product_id || 0), row); });
    const products = productRows.map((row) => {
      const productId = Number(row.product_id || 0);
      const image = firstImageByProduct.get(productId) || {};
      const story = firstStoryByProduct.get(productId) || {};
      const storedFeatured = clean(row.featured_image_url);
      const storedFeaturedIsUnsafe = Boolean(storedFeatured && unsafeUrlsByProduct.get(productId)?.has(storedFeatured.toLowerCase()));
      return {
        product_id: productId,
        slug: clean(row.slug),
        name: clean(row.name) || 'Untitled product',
        product_category: clean(row.product_category),
        short_description: clean(row.short_description),
        price_cents: Number(row.price_cents || 0),
        currency: clean(row.currency) || 'CAD',
        image_url: clean(image.image_url) || (storedFeaturedIsUnsafe ? '' : storedFeatured),
        alt_text: clean(image.alt_text) || clean(row.name) || 'Devil n Dove product',
        merchandise_origin: clean(row.merchandise_origin) || 'handmade',
        sale_channel: clean(row.sale_channel) || 'onsite',
        in_stock: Number(row.inventory_tracking || 0) !== 1 || Number(row.inventory_quantity || 0) > 0,
        requires_shipping: Number(row.requires_shipping || 0) === 1,
        story_heading: clean(story.story_heading),
        story_summary: clean(story.story_summary)
      };
    });
    return json({ ok: true, products, generated_at: new Date().toISOString() });
  } catch (error) {
    return json({ ok: true, products: [], warning: 'Featured creations are temporarily unavailable.' }, 200);
  }
}

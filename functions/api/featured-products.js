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

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB || env.DD_DB;
  if (!db) return json({ ok: true, products: [], warning: 'Store data is temporarily unavailable.' }, 200);
  const url = new URL(request.url);
  const limit = positiveInt(url.searchParams.get('limit'), 6, 12);
  try {
    const productRows = rows(await db.prepare(`
      SELECT product_id, slug, name, product_category, short_description, price_cents, currency,
             featured_image_url, merchandise_origin, sale_channel, inventory_tracking, inventory_quantity,
             requires_shipping, created_at, updated_at
      FROM products
      WHERE COALESCE(status,'active') = 'active'
        AND COALESCE(review_status,'published') IN ('approved','published','')
      ORDER BY COALESCE(sort_order, 999999) ASC,
               datetime(COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)) DESC,
               product_id DESC
      LIMIT ?
    `).bind(limit).all());
    const ids = productRows.map((row) => Number(row.product_id || 0)).filter(Boolean);
    const images = ids.length ? rows(await db.prepare(`
      SELECT product_id, image_url, alt_text, sort_order
      FROM product_images
      WHERE product_id IN (${ids.map(() => '?').join(',')})
        AND COALESCE(image_url,'') <> ''
      ORDER BY product_id ASC, COALESCE(sort_order,0) ASC, product_image_id ASC
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
    const firstStoryByProduct = new Map();
    stories.forEach((row) => { if (!firstStoryByProduct.has(Number(row.product_id || 0))) firstStoryByProduct.set(Number(row.product_id || 0), row); });
    const products = productRows.map((row) => {
      const productId = Number(row.product_id || 0);
      const image = firstImageByProduct.get(productId) || {};
      const story = firstStoryByProduct.get(productId) || {};
      return {
        product_id: productId,
        slug: clean(row.slug),
        name: clean(row.name) || 'Untitled product',
        product_category: clean(row.product_category),
        short_description: clean(row.short_description),
        price_cents: Number(row.price_cents || 0),
        currency: clean(row.currency) || 'CAD',
        image_url: clean(row.featured_image_url) || clean(image.image_url),
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

// File: /functions/api/product-detail.js
// Brief description: Returns one active storefront product with images, SEO fields,
// and merged annotation data so product media and search detail stay aligned.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = String(url.searchParams.get('slug') || '').trim().toLowerCase();

  if (!slug) return json({ ok: false, error: 'A valid slug is required.' }, 400);

  const product = await env.DB.prepare(`
    SELECT
      p.product_id, p.slug, p.sku, p.name, p.short_description, p.description, p.product_type, p.status,
      p.price_cents, p.compare_at_price_cents, p.currency, p.taxable, p.tax_class_id, p.requires_shipping,
      p.weight_grams, p.inventory_tracking, COALESCE(p.inventory_quantity, p.on_hand_quantity, 0) AS inventory_quantity,
      p.digital_file_url, p.featured_image_url, p.sort_order, p.created_at, p.updated_at,
      tc.code AS tax_class_code, tc.name AS tax_class_name, COALESCE(tc.rate_percent, tc.tax_rate, 0) AS tax_rate,
      ps.meta_title, ps.meta_description, ps.keywords, ps.h1_override, ps.canonical_url, ps.schema_type,
      ps.og_title, ps.og_description, ps.og_image_url
    FROM products p
    LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id
    LEFT JOIN product_seo ps ON ps.product_id = p.product_id
    WHERE p.slug = ? AND p.status = 'active'
    LIMIT 1
  `).bind(slug).first();

  if (!product) return json({ ok: false, error: 'Product not found.' }, 404);

  const images = normalizeResults(await env.DB.prepare(`
    SELECT pi.product_image_id, pi.product_id, pi.image_url,
           COALESCE(pia.alt_text, pi.alt_text, p.name) AS alt_text,
           pi.sort_order, pi.created_at,
           pia.image_title, pia.caption, pia.focal_point_x, pia.focal_point_y, pia.annotation_notes
    FROM product_images pi
    LEFT JOIN product_image_annotations pia ON pia.product_image_id = pi.product_image_id
    LEFT JOIN products p ON p.product_id = pi.product_id
    WHERE pi.product_id = ?
    ORDER BY pi.sort_order ASC, pi.product_image_id ASC
    LIMIT 20
  `).bind(product.product_id).all());

  const image_annotations = normalizeResults(await env.DB.prepare(`
    SELECT product_image_annotation_id, product_id, product_image_id, image_url, alt_text, image_title, caption,
           focal_point_x, focal_point_y, annotation_notes, updated_at
    FROM product_image_annotations
    WHERE product_id = ?
    ORDER BY product_image_annotation_id ASC
  `).bind(product.product_id).all());

  return json({ ok: true, product, images, image_annotations });
}

// File: /functions/api/product-detail.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const slug = String(url.searchParams.get("slug") || "").trim().toLowerCase();

  if (!slug) {
    return json({ ok: false, error: "A valid slug is required." }, 400);
  }

  const product = await env.DB.prepare(`
    SELECT
      p.product_id,
      p.slug,
      p.sku,
      p.name,
      p.short_description,
      p.description,
      p.product_type,
      p.status,
      p.price_cents,
      p.compare_at_price_cents,
      p.currency,
      p.taxable,
      p.tax_class_id,
      p.requires_shipping,
      p.weight_grams,
      p.inventory_tracking,
      p.inventory_quantity,
      p.digital_file_url,
      p.featured_image_url,
      p.sort_order,
      p.created_at,
      p.updated_at,
      tc.code AS tax_class_code,
      tc.name AS tax_class_name,
      tc.tax_rate AS tax_rate
    FROM products p
    LEFT JOIN tax_classes tc
      ON p.tax_class_id = tc.tax_class_id
    WHERE p.slug = ?
      AND p.status = 'active'
    LIMIT 1
  `)
    .bind(slug)
    .first();

  if (!product) {
    return json({ ok: false, error: "Product not found." }, 404);
  }

  const imagesResult = await env.DB.prepare(`
    SELECT
      product_image_id,
      product_id,
      image_url,
      alt_text,
      sort_order,
      created_at
    FROM product_images
    WHERE product_id = ?
    ORDER BY sort_order ASC, product_image_id ASC
    LIMIT 5
  `)
    .bind(product.product_id)
    .all();

  return json({
    ok: true,
    product,
    images: imagesResult.results || []
  });
}

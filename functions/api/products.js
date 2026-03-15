// File: /functions/api/products.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  const result = await env.DB.prepare(`
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
    WHERE p.status = 'active'
    ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC
  `).all();

  return json({
    ok: true,
    products: result.results || []
  });
}

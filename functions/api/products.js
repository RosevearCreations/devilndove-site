function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

async function runProductQuery(env, sql, bindings = []) {
  const stmt = env.DB.prepare(sql);
  const result = bindings.length ? await stmt.bind(...bindings).all() : await stmt.all();
  return Array.isArray(result?.results) ? result.results : [];
}

function shapeProducts(rows) {
  return rows.map((row) => ({ ...row, seo_h1: row.h1_override || row.name || "" }));
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const product_type = normalizeText(url.searchParams.get('product_type')).toLowerCase();
  const min_price_cents = Number.isInteger(Number(url.searchParams.get('min_price_cents'))) ? Number(url.searchParams.get('min_price_cents')) : null;
  const max_price_cents = Number.isInteger(Number(url.searchParams.get('max_price_cents'))) ? Number(url.searchParams.get('max_price_cents')) : null;
  const requires_shipping = normalizeText(url.searchParams.get('requires_shipping'));

  const clauses = [`p.status = 'active'`];
  const bindings = [];
  if (q) {
    clauses.push(`(
      LOWER(COALESCE(p.name, '')) LIKE ? OR
      LOWER(COALESCE(p.short_description, '')) LIKE ? OR
      LOWER(COALESCE(p.description, '')) LIKE ? OR
      LOWER(COALESCE(p.sku, '')) LIKE ? OR
      LOWER(COALESCE(p.product_category, '')) LIKE ? OR
      LOWER(COALESCE(p.color_name, '')) LIKE ? OR
      LOWER(COALESCE(ps.keywords, '')) LIKE ?
    )`);
    const like = `%${q}%`;
    bindings.push(like, like, like, like, like, like, like);
  }
  if (['physical', 'digital'].includes(product_type)) {
    clauses.push(`p.product_type = ?`);
    bindings.push(product_type);
  }
  if (min_price_cents != null) { clauses.push(`p.price_cents >= ?`); bindings.push(min_price_cents); }
  if (max_price_cents != null) { clauses.push(`p.price_cents <= ?`); bindings.push(max_price_cents); }
  if (requires_shipping === '1' || requires_shipping === '0') { clauses.push(`p.requires_shipping = ?`); bindings.push(Number(requires_shipping)); }

  const primarySql = `
    SELECT
      p.product_id, p.product_number, p.slug, p.sku, p.name, p.product_category, p.color_name, p.shipping_code, p.review_status, p.short_description, p.description, p.product_type, p.status,
      p.price_cents, p.compare_at_price_cents, p.currency, p.taxable, p.tax_class_id, p.requires_shipping,
      p.weight_grams, p.inventory_tracking, COALESCE(p.inventory_quantity, 0) AS inventory_quantity, p.digital_file_url, p.featured_image_url,
      p.sort_order, p.created_at, p.updated_at,
      tc.code AS tax_class_code, tc.name AS tax_class_name, COALESCE(tc.rate_percent, tc.tax_rate, 0) AS tax_rate,
      ps.meta_title, ps.meta_description, ps.keywords, ps.h1_override, ps.canonical_url, ps.og_title,
      ps.og_description, ps.og_image_url
    FROM products p
    LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id
    LEFT JOIN product_seo ps ON ps.product_id = p.product_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC
  `;

  const fallbackSql = `
    SELECT
      p.product_id, p.product_number, p.slug, p.sku, p.name, p.product_category, p.color_name, p.shipping_code, p.review_status, p.short_description, p.description, p.product_type, p.status,
      p.price_cents, p.compare_at_price_cents, p.currency, p.taxable, p.tax_class_id, p.requires_shipping,
      p.weight_grams, p.inventory_tracking, COALESCE(p.inventory_quantity, 0) AS inventory_quantity, p.digital_file_url, p.featured_image_url,
      p.sort_order, p.created_at, p.updated_at,
      '' AS tax_class_code, '' AS tax_class_name, 0 AS tax_rate,
      '' AS meta_title, '' AS meta_description, '' AS keywords, '' AS h1_override, '' AS canonical_url, '' AS og_title,
      '' AS og_description, '' AS og_image_url
    FROM products p
    WHERE ${clauses.filter((c) => !c.includes('ps.keywords')).map((c) => c.replace(/ OR\s*LOWER\(COALESCE\(ps\.keywords, ''\)\) LIKE \?/,'')).join(' AND ')}
    ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC
  `;

  try {
    const rows = await runProductQuery(env, primarySql, bindings);
    return json({ ok: true, products: shapeProducts(rows) });
  } catch (primaryError) {
    try {
      const fbBindings = q ? [ `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%` ] : [];
      if (['physical', 'digital'].includes(product_type)) fbBindings.push(product_type);
      if (min_price_cents != null) fbBindings.push(min_price_cents);
      if (max_price_cents != null) fbBindings.push(max_price_cents);
      if (requires_shipping === '1' || requires_shipping === '0') fbBindings.push(Number(requires_shipping));
      const rows = await runProductQuery(env, fallbackSql, fbBindings);
      return json({ ok: true, products: shapeProducts(rows), warning: 'Fallback product query used.' });
    } catch (fallbackError) {
      return json({ ok: true, products: [], warning: 'Products endpoint fallback returned no records.', error_detail: String(fallbackError?.message || primaryError?.message || 'Unknown error') });
    }
  }
}

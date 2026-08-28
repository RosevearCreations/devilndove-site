// Release 447 — public Storefront new-item feed for opt-in installed-app notifications.
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=180',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function clean(value) { return String(value || '').trim(); }
function limitValue(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? Math.min(number, 10) : 5;
}

export async function onRequestGet({ request, env }) {
  const db = env.DB || env.DD_DB;
  if (!db) return json({ ok: true, items: [], warning: 'Store data is temporarily unavailable.' });
  const limit = limitValue(new URL(request.url).searchParams.get('limit'));
  try {
    const result = await db.prepare(`
      SELECT product_id, slug, name, created_at, updated_at
      FROM products
      WHERE COALESCE(status,'active')='active'
        AND COALESCE(review_status,'published') IN ('approved','published','')
      ORDER BY datetime(COALESCE(created_at,updated_at,CURRENT_TIMESTAMP)) DESC, product_id DESC
      LIMIT ?
    `).bind(limit).all();
    const items = (result?.results || []).map((row) => ({
      product_id: Number(row.product_id || 0),
      slug: clean(row.slug),
      name: clean(row.name) || 'New Devil n Dove creation',
      published_at: row.created_at || row.updated_at || null,
      href: `/shop/?q=${encodeURIComponent(clean(row.name) || clean(row.slug))}&focus=products`,
    })).filter((row) => row.product_id > 0);
    return json({ ok: true, items, generated_at: new Date().toISOString() });
  } catch {
    return json({ ok: true, items: [], warning: 'New-item feed is temporarily unavailable.' });
  }
}

// Devil n Dove Build 443 — public, fail-safe Home carousel read surface.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}

function clean(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function safeLocalUrl(value) {
  const url = clean(value);
  return url.startsWith('/') && !url.startsWith('//') && !/[\r\n]/.test(url) ? url : '';
}

function fallback(reason) {
  return json({
    ok: true,
    build: 443,
    slides: [],
    fallback: 'static_hero',
    reason,
    generated_at: new Date().toISOString(),
  });
}

export async function onRequestGet(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return fallback('database_binding_unavailable');

  try {
    const exists = await db.prepare(
      "SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='home_carousel_slides' LIMIT 1"
    ).first();
    if (!exists) return fallback('carousel_schema_not_ready');

    const result = await db.prepare(`
      SELECT slide_id,title,body_text,image_url,alt_text,cta_label,cta_url,
             sort_order,auto_advance_seconds
      FROM home_carousel_slides
      WHERE status='published'
        AND (starts_at IS NULL OR datetime(starts_at) <= datetime('now'))
        AND (ends_at IS NULL OR datetime(ends_at) > datetime('now'))
      ORDER BY sort_order ASC, slide_id ASC
      LIMIT 12
    `).all();

    const slides = (Array.isArray(result?.results) ? result.results : []).map((row) => ({
      slide_id: Number(row.slide_id || 0),
      title: clean(row.title, 120),
      body_text: clean(row.body_text, 320),
      image_url: safeLocalUrl(row.image_url),
      alt_text: clean(row.alt_text, 220),
      cta_label: clean(row.cta_label, 80),
      cta_url: safeLocalUrl(row.cta_url),
      sort_order: Number(row.sort_order || 100),
      auto_advance_seconds: Math.max(5, Math.min(20, Number(row.auto_advance_seconds || 7))),
    })).filter((slide) => slide.slide_id && slide.title && slide.image_url && slide.alt_text)
      .map((slide) => ({
        ...slide,
        cta_label: slide.cta_url ? slide.cta_label : '',
        cta_url: slide.cta_label ? slide.cta_url : '',
      }));

    if (!slides.length) return fallback('no_active_published_slides');
    return json({ ok: true, build: 443, slides, fallback: null, generated_at: new Date().toISOString() });
  } catch {
    return fallback('carousel_read_unavailable');
  }
}

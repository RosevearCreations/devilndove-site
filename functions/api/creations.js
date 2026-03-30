// File: /functions/api/creations.js
// Brief description: Public read endpoint for finished creations. It centralizes the
// items-for-sale JSON path so the creations page and site search can share one source
// of truth while the project continues its staged migration away from duplicated JSON reads.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120'
    }
  });
}

function normalizeText(value) {
  return String(value || '').trim();
}

function getBaseUrl(request, env) {
  return normalizeText(env.PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
}

function scoreText(query, ...parts) {
  const haystack = parts.join(' ').toLowerCase();
  if (!haystack || !query) return 0;
  let score = 0;
  if (haystack.includes(query)) score += 10;
  for (const token of query.split(/\s+/).filter(Boolean)) {
    if (haystack.includes(token)) score += 3;
  }
  return score;
}

function shapeItems(payload, query) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.map((item, index) => {
    const title = item?.title || item?.name || `Creation ${index + 1}`;
    const searchScore = scoreText(query, title, item?.type, item?.subcategory, item?.description, item?.notes, ...(Array.isArray(item?.materials) ? item.materials : []), ...(Array.isArray(item?.tags) ? item.tags : []));
    return {
      id: normalizeText(item?.id || item?.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
      title,
      type: normalizeText(item?.type),
      subcategory: normalizeText(item?.subcategory),
      materials: Array.isArray(item?.materials) ? item.materials.filter(Boolean) : [],
      tags: Array.isArray(item?.tags) ? item.tags.filter(Boolean) : [],
      image_file: normalizeText(item?.image_file),
      r2_object_key: normalizeText(item?.r2_object_key),
      alt: normalizeText(item?.alt),
      status: normalizeText(item?.status),
      shop_url: normalizeText(item?.shop_url),
      description: normalizeText(item?.description),
      notes: normalizeText(item?.notes),
      search_score: searchScore
    };
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const query = normalizeText(url.searchParams.get('q')).toLowerCase();
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 250), 1), 500);
  const dataUrl = `${getBaseUrl(request, env)}/data/itemsforsale/itemsforsale_items_master.json`;

  try {
    const response = await fetch(dataUrl, { headers: { 'Cache-Control': 'no-cache' } });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) return json({ ok: false, error: 'Creations data could not be loaded.' }, 502);

    const allItems = shapeItems(payload, query);
    const filtered = query
      ? allItems.filter((item) => Number(item.search_score || 0) > 0)
      : allItems;

    return json({
      ok: true,
      items: filtered.slice(0, limit),
      summary: {
        total_items: allItems.length,
        visible_items: filtered.length,
        query
      },
      asset_origin: payload?.asset_origin || 'https://assets.devilndove.com',
      asset_prefix: payload?.asset_prefix || 'itemsforsale',
      video: payload?.video || null
    });
  } catch (error) {
    return json({ ok: false, error: String(error?.message || 'Unable to load creations data.') }, 500);
  }
}

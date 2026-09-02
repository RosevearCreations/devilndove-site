// Release 467 Build 15 — approved buyer-facing product facts for Shop/Product parity.
// Read-only by design. No schema creation/repair occurs during a public request.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' } });
}
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const text = (value) => String(value == null ? '' : value).trim();

function parseIds(url) {
  const ids = String(url.searchParams.get('ids') || '')
    .split(',').map((value) => Number(value)).filter((id) => Number.isInteger(id) && id > 0);
  return [...new Set(ids)].slice(0, 100);
}

export async function onRequestGet({ request, env }) {
  const db = env.DB || env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(request.url);
  const ids = parseIds(url);
  if (!ids.length) return json({ ok: true, release: 467, build: 15, products: {}, read_only: true, request_time_schema_mutation: false });
  const placeholders = ids.map(() => '?').join(',');
  const productRows = rows(await db.prepare(`
    SELECT *
    FROM products
    WHERE product_id IN (${placeholders}) AND LOWER(COALESCE(status,'active'))='active'
  `).bind(...ids).all());

  let profileRows = [];
  let storyRows = [];
  const warnings = [];
  try {
    profileRows = rows(await db.prepare(`
      SELECT product_id, best_for_text, materials_text, finish_text, dimensions_text, care_summary,
             handmade_variation_note, availability_note, shipping_pickup_note, product_video_url,
             profile_status, updated_at
      FROM product_listing_profiles
      WHERE product_id IN (${placeholders}) AND LOWER(COALESCE(profile_status,'draft')) IN ('approved','published')
      ORDER BY datetime(COALESCE(updated_at,created_at,'1970-01-01')) DESC
    `).bind(...ids).all());
  } catch { warnings.push('approved_listing_profiles_unavailable'); }
  try {
    storyRows = rows(await db.prepare(`
      SELECT product_id, process_notes, care_notes, local_pickup_note, display_status, privacy_status, updated_at
      FROM product_story_public_notes
      WHERE product_id IN (${placeholders})
        AND LOWER(COALESCE(display_status,'approved')) IN ('approved','published')
        AND LOWER(COALESCE(privacy_status,'safe')) IN ('safe','private_detail_removed')
      ORDER BY datetime(COALESCE(updated_at,'1970-01-01')) DESC
    `).bind(...ids).all());
  } catch { warnings.push('approved_story_notes_unavailable'); }

  const profiles = new Map();
  for (const row of profileRows) if (!profiles.has(Number(row.product_id))) profiles.set(Number(row.product_id), row);
  const stories = new Map();
  for (const row of storyRows) if (!stories.has(Number(row.product_id))) stories.set(Number(row.product_id), row);
  const products = {};
  for (const product of productRows) {
    const id = Number(product.product_id || 0);
    products[id] = {
      product: {
        product_id: id,
        name: text(product.name),
        slug: text(product.slug),
        product_category: text(product.product_category || product.category),
        product_type: text(product.product_type || 'physical'),
        merchandise_origin: text(product.merchandise_origin || 'handmade'),
        condition_summary: text(product.condition_summary),
        requires_shipping: Number(product.requires_shipping || 0),
        inventory_tracking: Number(product.inventory_tracking || 0),
        inventory_quantity: Number(product.inventory_quantity || product.on_hand_quantity || 0),
        weight_grams: Number(product.weight_grams || 0),
        proof_material: text(product.material_tags || product.materials_json || product.primary_material || product.material || product.product_category),
        proof_process: text(product.making_process || product.process_notes || product.process_tags),
        local_pickup_note: text(product.local_pickup_note || product.sourcing_notes)
      },
      listing_profile: profiles.get(id) || null,
      story_notes: stories.get(id) || null
    };
  }
  return json({ ok: true, release: 467, build: 15, contract: 'storefront-buyer-fact-parity', read_only: true, request_time_schema_mutation: false, products, warnings });
}

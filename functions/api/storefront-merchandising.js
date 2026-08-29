// Devil n Dove Release 448 — public Storefront Collections / Collages projection.
// Products and public Product images remain authoritative in /api/products. This endpoint only groups that safe projection.
const RELEASE = 448;
const text = (value) => String(value == null ? '' : value).trim();
const json = (data, status = 200) => new Response(JSON.stringify({ release: RELEASE, ...data }), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=120',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
});

const FALLBACK_COLLECTIONS = [
  { slug:'handmade', name:'Handmade creations', short_description:'Workshop-made Devil n Dove pieces and finished creative work.', collection_kind:'origin', rule_key:'merchandise_origin', rule_value:'handmade', sort_order:10 },
  { slug:'vintage-antique', name:'Vintage & antique finds', short_description:'Older pieces and finds where condition, age and provenance should remain visible.', collection_kind:'origin', rule_key:'merchandise_origin', rule_value:'vintage|antique', sort_order:20 },
  { slug:'collectibles-oddities', name:'Collectibles & oddities', short_description:'Curious, collectible and unusual stock that is not represented as newly handmade work.', collection_kind:'origin', rule_key:'merchandise_origin', rule_value:'collectible|oddity', sort_order:30 },
  { slug:'prebuilt-found', name:'Pre-built & found items', short_description:'Finished outside goods and found stock carried without claiming in-house manufacture.', collection_kind:'origin', rule_key:'merchandise_origin', rule_value:'prebuilt', sort_order:40 },
];
const FALLBACK_COLLAGES = [
  { slug:'shop-discovery', name:'Shop discovery collage', layout_kind:'mosaic', max_items:6, heading:'Explore the shop visually', body_text:'A visual sampling of currently public Product images.', sort_order:10, storefront_collection_id:null },
];

async function tableExists(db, name) {
  if (!db) return false;
  try {
    const row = await db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name=?").bind(name).first();
    return Number(row?.c || 0) === 1;
  } catch {
    return false;
  }
}

async function loadPublicProducts(request) {
  try {
    const url = new URL('/api/products', request.url);
    const response = await fetch(url.toString(), { headers:{ Accept:'application/json' }, cf:{ cacheTtl:60, cacheEverything:false } });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok || !Array.isArray(payload.products)) return { products:[], warning:'public_products_unavailable' };
    return { products:payload.products, warning:text(payload.warning) };
  } catch {
    return { products:[], warning:'public_products_unavailable' };
  }
}

async function loadCollections(db) {
  if (!await tableExists(db, 'storefront_collections')) return FALLBACK_COLLECTIONS.map((row, index) => ({ storefront_collection_id:-(index + 1), status:'published', ...row }));
  try {
    const result = await db.prepare(`
      SELECT storefront_collection_id,slug,name,short_description,public_heading,public_body,hero_image_url,
             collection_kind,rule_key,rule_value,sort_order,seo_title,seo_description
      FROM storefront_collections
      WHERE status='published'
      ORDER BY sort_order ASC, LOWER(name) ASC, storefront_collection_id ASC
    `).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return rows.length ? rows : FALLBACK_COLLECTIONS.map((row, index) => ({ storefront_collection_id:-(index + 1), status:'published', ...row }));
  } catch {
    return FALLBACK_COLLECTIONS.map((row, index) => ({ storefront_collection_id:-(index + 1), status:'published', ...row }));
  }
}

async function loadMemberships(db, ids) {
  if (!ids.length || !await tableExists(db, 'storefront_collection_products')) return [];
  try {
    const result = await db.prepare(`
      SELECT storefront_collection_id,product_id,membership_status,sort_order
      FROM storefront_collection_products
      WHERE storefront_collection_id IN (${ids.map(() => '?').join(',')})
      ORDER BY storefront_collection_id ASC,sort_order ASC,product_id ASC
    `).bind(...ids).all();
    return Array.isArray(result?.results) ? result.results : [];
  } catch {
    return [];
  }
}

async function loadCollages(db) {
  if (!await tableExists(db, 'storefront_collage_presets')) return FALLBACK_COLLAGES;
  try {
    const result = await db.prepare(`
      SELECT storefront_collage_preset_id,slug,name,storefront_collection_id,layout_kind,max_items,heading,body_text,sort_order
      FROM storefront_collage_presets
      WHERE status='published'
      ORDER BY sort_order ASC,LOWER(name) ASC,storefront_collage_preset_id ASC
    `).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return rows.length ? rows : FALLBACK_COLLAGES;
  } catch {
    return FALLBACK_COLLAGES;
  }
}

function wantedValues(value) {
  return text(value).toLowerCase().split(/[|,;]/).map((entry) => entry.trim()).filter(Boolean);
}
function productMatchesRule(product, collection) {
  const key = text(collection.rule_key);
  const values = wantedValues(collection.rule_value);
  if (!key || !values.length) return false;
  const productValue = text(product?.[key]).toLowerCase();
  return values.includes(productValue);
}
function productImage(product) {
  const candidates = [product?.featured_image_url, product?.hero_image_url, product?.display_image_url, product?.media_url];
  if (Array.isArray(product?.images)) candidates.push(...product.images.map((row) => row?.image_url));
  if (Array.isArray(product?.image_urls)) candidates.push(...product.image_urls);
  return candidates.map(text).find(Boolean) || '';
}
function productHref(product) {
  const slug = text(product?.slug);
  if (slug) return `/products/${encodeURIComponent(slug)}/`;
  const id = Number(product?.product_id || 0);
  return id > 0 ? `/product/?id=${id}` : '/shop/';
}
function publicProduct(product) {
  return {
    product_id:Number(product?.product_id || 0),
    slug:text(product?.slug),
    name:text(product?.name) || 'Product',
    short_description:text(product?.short_description || product?.meta_description),
    merchandise_origin:text(product?.merchandise_origin),
    product_category:text(product?.product_category),
    product_type:text(product?.product_type),
    sale_channel:text(product?.sale_channel),
    price_cents:Number(product?.price_cents || 0),
    currency:text(product?.currency) || 'CAD',
    image_url:productImage(product),
    href:productHref(product),
  };
}

function buildCollectionProjection(collections, memberships, products) {
  const byCollection = new Map();
  memberships.forEach((row) => {
    const id = Number(row.storefront_collection_id || 0);
    if (!byCollection.has(id)) byCollection.set(id, []);
    byCollection.get(id).push(row);
  });
  const byProductId = new Map(products.map((product) => [Number(product.product_id || 0), product]));

  return collections.map((collection) => {
    const explicit = byCollection.get(Number(collection.storefront_collection_id || 0)) || [];
    const excluded = new Set(explicit.filter((row) => row.membership_status === 'excluded').map((row) => Number(row.product_id || 0)));
    const included = explicit.filter((row) => row.membership_status === 'included');
    const selected = [];
    const seen = new Set();
    included.forEach((row) => {
      const product = byProductId.get(Number(row.product_id || 0));
      if (!product || seen.has(Number(product.product_id || 0))) return;
      seen.add(Number(product.product_id || 0));
      selected.push({ product, explicit_sort:Number(row.sort_order || 0) });
    });
    products.forEach((product) => {
      const id = Number(product.product_id || 0);
      if (!id || seen.has(id) || excluded.has(id) || !productMatchesRule(product, collection)) return;
      seen.add(id);
      selected.push({ product, explicit_sort:999999 });
    });
    selected.sort((a, b) => a.explicit_sort - b.explicit_sort || Number(a.product.sort_order || 0) - Number(b.product.sort_order || 0) || text(a.product.name).localeCompare(text(b.product.name)));
    const publicProducts = selected.map(({ product }) => publicProduct(product));
    const images = publicProducts.filter((product) => product.image_url).slice(0, 4).map((product) => ({ image_url:product.image_url, alt_text:product.name, product_id:product.product_id, href:product.href }));
    return {
      storefront_collection_id:Number(collection.storefront_collection_id || 0),
      slug:text(collection.slug),
      name:text(collection.name),
      short_description:text(collection.short_description),
      public_heading:text(collection.public_heading) || text(collection.name),
      public_body:text(collection.public_body || collection.short_description),
      hero_image_url:text(collection.hero_image_url) || images[0]?.image_url || '',
      collection_kind:text(collection.collection_kind) || 'curated',
      sort_order:Number(collection.sort_order || 0),
      seo_title:text(collection.seo_title),
      seo_description:text(collection.seo_description),
      product_count:publicProducts.length,
      images,
      products:publicProducts.slice(0, 12),
      href:`/collections/?collection=${encodeURIComponent(text(collection.slug))}`,
    };
  });
}

function buildCollageProjection(collages, collections, products) {
  const collectionById = new Map(collections.map((collection) => [Number(collection.storefront_collection_id || 0), collection]));
  const allProducts = products.map(publicProduct);
  return collages.map((preset) => {
    const collection = collectionById.get(Number(preset.storefront_collection_id || 0)) || null;
    const source = collection ? collection.products : allProducts;
    const seenImages = new Set();
    const items = [];
    for (const product of source) {
      const image = text(product.image_url);
      if (!image || seenImages.has(image.toLowerCase())) continue;
      seenImages.add(image.toLowerCase());
      items.push({ product_id:product.product_id, name:product.name, image_url:image, href:product.href, alt_text:product.name });
      if (items.length >= Math.max(3, Math.min(12, Number(preset.max_items || 6)))) break;
    }
    return {
      storefront_collage_preset_id:Number(preset.storefront_collage_preset_id || 0),
      slug:text(preset.slug),
      name:text(preset.name),
      layout_kind:text(preset.layout_kind) || 'mosaic',
      max_items:Math.max(3, Math.min(12, Number(preset.max_items || 6))),
      heading:text(preset.heading || preset.name),
      body_text:text(preset.body_text),
      collection_slug:collection?.slug || '',
      collection_name:collection?.name || '',
      items,
    };
  });
}

export async function onRequestGet({ request, env }) {
  const db = env.DB || env.DD_DB;
  const { products, warning } = await loadPublicProducts(request);
  const collections = await loadCollections(db);
  const realIds = collections.map((row) => Number(row.storefront_collection_id || 0)).filter((id) => id > 0);
  const memberships = await loadMemberships(db, realIds);
  const collectionProjection = buildCollectionProjection(collections, memberships, products);
  const collages = buildCollageProjection(await loadCollages(db), collectionProjection, products);
  const url = new URL(request.url);
  const requestedCollection = text(url.searchParams.get('collection')).toLowerCase();
  const requestedCollage = text(url.searchParams.get('collage')).toLowerCase();
  return json({
    ok:true,
    authority:'public_products_plus_storefront_merchandising',
    schema_ready:Boolean(db && await tableExists(db, 'storefront_collections') && await tableExists(db, 'storefront_collection_products') && await tableExists(db, 'storefront_collage_presets')),
    warning:warning || '',
    collections:requestedCollection ? collectionProjection.filter((row) => row.slug.toLowerCase() === requestedCollection) : collectionProjection,
    collages:requestedCollage ? collages.filter((row) => row.slug.toLowerCase() === requestedCollage) : collages,
  });
}

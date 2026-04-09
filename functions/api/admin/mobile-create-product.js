function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
function normalizeText(value) { return String(value || '').trim(); }
function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function parseCookies(request) {
  const raw = request.headers.get('Cookie') || '';
  return raw.split(/;\s*/).reduce((acc, part) => {
    const eq = part.indexOf('=');
    if (eq === -1) return acc;
    acc[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
    return acc;
  }, {});
}
function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (match) return String(match[1] || '').trim();
  const cookies = parseCookies(request);
  return normalizeText(cookies.dd_auth_token);
}
async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(`
    SELECT s.user_id, u.user_id AS resolved_user_id, u.email, u.display_name, u.role, u.is_active
    FROM sessions s
    INNER JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?)
      AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token, token).first();
  if (!session || Number(session.is_active || 0) !== 1 || String(session.role || '').toLowerCase() !== 'admin') return null;
  return { user_id: Number(session.resolved_user_id || session.user_id || 0), email: session.email || '', display_name: session.display_name || '' };
}
function sanitizeFilename(filename) {
  const cleaned = String(filename || 'upload').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
  return cleaned || 'upload';
}
function inferExtension(filename, mimeType) {
  const fromName = String(filename || '').match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif' };
  return map[String(mimeType || '').toLowerCase()] || 'bin';
}
function buildPublicUrl(env, objectKey) {
  const base = normalizeText(env.PRODUCT_MEDIA_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL || env.PUBLIC_R2_BASE_URL);
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/${String(objectKey || '').replace(/^\/+/, '')}`;
}
async function getNextProductNumber(env) {
  const row = await env.DB.prepare(`SELECT COALESCE(MAX(product_number), 0) + 1 AS next_product_number FROM products`).first().catch(() => ({ next_product_number: 1 }));
  return Number(row?.next_product_number || 1);
}
async function upsertProductSeo(env, payload) {
  await env.DB.prepare(`
    INSERT INTO product_seo (
      product_id, meta_title, meta_description, keywords, h1_override, canonical_url, schema_type, og_title, og_description, og_image_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'Product', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(product_id) DO UPDATE SET
      meta_title = excluded.meta_title,
      meta_description = excluded.meta_description,
      keywords = excluded.keywords,
      h1_override = excluded.h1_override,
      canonical_url = excluded.canonical_url,
      og_title = excluded.og_title,
      og_description = excluded.og_description,
      og_image_url = excluded.og_image_url,
      updated_at = CURRENT_TIMESTAMP
  `).bind(payload.product_id, payload.meta_title, payload.meta_description, payload.keywords, payload.h1_override, payload.canonical_url, payload.og_title, payload.og_description, payload.og_image_url).run();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  let form;
  try { form = await request.formData(); } catch { return json({ ok: false, error: 'Expected multipart/form-data upload.' }, 400); }

  const productId = Number(form.get('product_id') || 0) || 0;
  const name = normalizeText(form.get('name'));
  const captureReference = normalizeText(form.get('capture_reference'));
  const productCategory = normalizeText(form.get('product_category'));
  const colorName = normalizeText(form.get('color_name'));
  const shortDescription = normalizeText(form.get('short_description'));
  const description = normalizeText(form.get('description'));
  const metaTitle = normalizeText(form.get('meta_title'));
  const metaDescription = normalizeText(form.get('meta_description'));
  const keywords = normalizeText(form.get('keywords'));
  const shippingCode = normalizeText(form.get('shipping_code'));
  const currency = normalizeText(form.get('currency') || 'CAD').toUpperCase() || 'CAD';
  const skuOverride = normalizeText(form.get('sku'));
  const taxClassIdRaw = normalizeText(form.get('tax_class_id'));
  const taxClassId = taxClassIdRaw ? Number(taxClassIdRaw) : null;
  const priceCents = Number(form.get('price_cents') || 0);
  const compareAtPriceRaw = normalizeText(form.get('compare_at_price_cents'));
  const compareAtPriceCents = compareAtPriceRaw ? Number(compareAtPriceRaw) : null;
  const inventoryQuantity = Math.max(0, Number(form.get('inventory_quantity') || 1) || 1);
  const requiresShipping = Number(form.get('requires_shipping') || 1) === 1 ? 1 : 0;
  const taxable = Number(form.get('taxable') || 1) === 1 ? 1 : 0;
  const weightGramsRaw = normalizeText(form.get('weight_grams'));
  const weightGrams = weightGramsRaw ? Number(weightGramsRaw) : null;
  const resourceLinksRaw = normalizeText(form.get('resource_links_json'));

  if (!Number.isInteger(priceCents) || priceCents < 0) return json({ ok: false, error: 'price_cents must be a valid whole number.' }, 400);
  if (compareAtPriceCents !== null && (!Number.isInteger(compareAtPriceCents) || compareAtPriceCents < 0)) return json({ ok: false, error: 'compare_at_price_cents must be a valid whole number.' }, 400);
  if (weightGrams !== null && (!Number.isInteger(weightGrams) || weightGrams < 0)) return json({ ok: false, error: 'weight_grams must be a valid whole number.' }, 400);
  if (taxClassId !== null && (!Number.isInteger(taxClassId) || taxClassId <= 0)) return json({ ok: false, error: 'tax_class_id must be a valid id.' }, 400);

  const files = form.getAll('images').filter((file) => file && typeof file.arrayBuffer === 'function');
  if (!name && !captureReference && !files.length) return json({ ok: false, error: 'Add at least a name, a reference, or a photo before saving.' }, 400);

  const productNumber = await getNextProductNumber(env);
  const resolvedName = name || captureReference || `Draft product ${productNumber}`;
  const slug = slugify(`${resolvedName}-${productNumber}`) || `product-${productNumber}`;
  const sku = skuOverride || `DND-${String(productNumber).padStart(5, '0')}`;
  const readyNotes = [captureReference ? `Capture reference: ${captureReference}` : '', !name ? 'Partial draft saved without final product name.' : '', !productCategory ? 'Category still needed.' : '', priceCents === 0 ? 'Price still needed.' : ''].filter(Boolean).join(' ');

  const insertResult = await env.DB.prepare(`
    INSERT INTO products (
      product_number, slug, sku, name, capture_reference, product_category, color_name, shipping_code, review_status,
      is_ready_for_storefront, ready_check_notes, short_description, description, product_type, status, price_cents, compare_at_price_cents,
      currency, taxable, tax_class_id, requires_shipping, weight_grams, inventory_tracking,
      inventory_quantity, featured_image_url, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', ?, ?, ?, ?, 'physical', 'draft', ?, ?, ?, ?, ?, ?, ?, 1, ?, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(productNumber, slug, sku, resolvedName, captureReference || null, productCategory || null, colorName || null, shippingCode || null, 0, readyNotes || null, shortDescription || null, description || null, priceCents, compareAtPriceCents, currency, taxable, taxClassId, requiresShipping, weightGrams, inventoryQuantity).run();

  const productId = Number(insertResult?.meta?.last_row_id || 0);
  if (!productId) return json({ ok: false, error: 'Product could not be created.' }, 500);

  const bucket = env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA;
  const uploaded = [];

  if (bucket && typeof bucket.put === 'function') {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const mimeType = normalizeText(file.type || 'application/octet-stream').toLowerCase();
      if (!mimeType.startsWith('image/')) continue;
      const buffer = await file.arrayBuffer();
      if (!buffer || Number(file.size || 0) <= 0) continue;
      const originalName = sanitizeFilename(file.name || `image-${index + 1}`);
      const extension = inferExtension(originalName, mimeType);
      const objectKey = ['products', String(productId), `${Date.now()}-${index + 1}-${crypto.randomUUID()}.${extension}`].join('/');
      await bucket.put(objectKey, buffer, {
        httpMetadata: { contentType: mimeType, cacheControl: 'public, max-age=31536000, immutable' },
        customMetadata: { original_name: originalName, product_id: String(productId), uploaded_by_user_id: String(adminUser.user_id || '') }
      });
      const publicUrl = buildPublicUrl(env, objectKey);
      uploaded.push({ object_key: objectKey, public_url: publicUrl || '', original_filename: originalName });
      await env.DB.prepare(`INSERT INTO product_images (product_id, image_url, alt_text, sort_order, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(productId, publicUrl || objectKey, `${resolvedName} photo ${index + 1}`, index).run();
      try {
        await env.DB.prepare(`INSERT INTO media_assets (product_id, storage_provider, bucket_name, object_key, public_url, original_filename, mime_type, file_size_bytes, created_by_user_id, created_at, updated_at) VALUES (?, 'r2', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(productId, normalizeText(env.PRODUCT_MEDIA_BUCKET_NAME || env.R2_BUCKET_NAME || 'product-media'), objectKey, publicUrl || null, originalName, mimeType, Number(file.size || 0), adminUser.user_id).run();
      } catch {}
    }
  }

  const featuredImageUrl = uploaded[0]?.public_url || null;
  if (featuredImageUrl) {
    await env.DB.prepare(`UPDATE products SET featured_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?`).bind(featuredImageUrl, productId).run();
  }

  try {
    const seoTitle = metaTitle || `${resolvedName}${productCategory ? ` ${productCategory}` : ''}${colorName ? ` ${colorName}` : ''} | Devil n Dove`;
    const seoDescription = metaDescription || shortDescription || description || captureReference || `Draft ${productCategory || 'creation'} by Devil n Dove.`;
    await upsertProductSeo(env, {
      product_id: productId,
      meta_title: seoTitle,
      meta_description: seoDescription,
      keywords: keywords || [resolvedName, captureReference, productCategory, colorName, 'handmade', 'Devil n Dove', 'Ontario'].filter(Boolean).join(', '),
      h1_override: resolvedName,
      canonical_url: `/shop/product/?slug=${slug}`,
      og_title: seoTitle,
      og_description: seoDescription,
      og_image_url: featuredImageUrl || null
    });
  } catch {}

  try {
    const parsedLinks = JSON.parse(resourceLinksRaw || '[]');
    const links = Array.isArray(parsedLinks) ? parsedLinks : [];
    for (let index = 0; index < links.length; index += 1) {
      const row = links[index] || {};
      const resourceKind = normalizeText(row.resource_kind).toLowerCase();
      const sourceKey = normalizeText(row.source_key);
      if (!['tool', 'supply'].includes(resourceKind) || !sourceKey) continue;
      await env.DB.prepare(`INSERT INTO product_resource_links (product_id, resource_kind, source_key, quantity_used, usage_notes, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(productId, resourceKind, sourceKey, Math.max(1, Number(row.quantity_used || 1) || 1), normalizeText(row.usage_notes) || null, index).run();
    }
  } catch {}

  const createdProduct = await env.DB.prepare(`SELECT * FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first();
  return json({ ok: true, message: 'Draft product saved. You can come back later to finish the details.', product: createdProduct, uploaded_images: uploaded, next_product_number: productNumber + 1 }, 201);
}

// Release 450 local marketplace listing profile editor and validator.
// No marketplace/provider network calls are made by this endpoint.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  MARKETPLACE_RELEASE,
  MARKETPLACE_CONTRACT,
  marketplaceSchemaStatus,
  readChannelPolicy,
  validateListingDraft,
  jsonArray,
  cleanList,
} from '../_lib/marketplaceReadiness.js';

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function clean(value, limit = 4000) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
function asBool(value) { return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true' ? 1 : 0; }

async function productRow(db, productId) {
  return db.prepare(`
    SELECT p.product_id,p.name,p.slug,p.sku,p.status,p.review_status,p.price_cents,p.currency,
           p.product_category,p.short_description,p.description,ps.keywords
    FROM products p
    LEFT JOIN product_seo ps ON ps.product_id=p.product_id
    WHERE p.product_id=? LIMIT 1
  `).bind(productId).first().catch(() => null);
}

async function selectedImages(db, channel, productId) {
  const row = await db.prepare(`SELECT selected_image_urls_json FROM marketplace_export_image_selections WHERE channel=? AND product_id=? LIMIT 1`)
    .bind(channel, productId).first().catch(() => null);
  return cleanList(jsonArray(row?.selected_image_urls_json || '[]', 40), 1200, 40);
}

async function profileRow(db, channel, productId) {
  return db.prepare(`SELECT * FROM marketplace_listing_profiles WHERE channel_key=? AND product_id=? LIMIT 1`)
    .bind(channel, productId).first().catch(() => null);
}

async function buildResult(db, channel, productId) {
  const product = await productRow(db, productId);
  if (!product) return { error: 'Product was not found.', status: 404 };
  const policy = await readChannelPolicy(db, channel);
  if (!policy) return { error: 'Marketplace channel policy was not found.', status: 404 };
  const profile = await profileRow(db, channel, productId) || { channel_key: channel, product_id: productId, listing_type: 'physical' };
  const images = await selectedImages(db, channel, productId);
  const validation = validateListingDraft({ channel, product, profile, selectedImages: images, policy });
  return { product, policy, profile, selected_images: images, validation };
}

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return json({ ok: false, release: MARKETPLACE_RELEASE, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, release: MARKETPLACE_RELEASE, error: 'Database binding is not configured.' }, 500);
  const schema = await marketplaceSchemaStatus(db);
  if (!schema.ready) return json({ ok: false, release: MARKETPLACE_RELEASE, contract: MARKETPLACE_CONTRACT, schema_ready: false, missing_tables: schema.missing_tables, request_time_schema_mutation: false, error: 'Release 450 marketplace schema is not active.' }, 503);

  const url = new URL(context.request.url);
  const channel = clean(url.searchParams.get('channel') || 'etsy', 40).toLowerCase();
  const productId = Number(url.searchParams.get('product_id') || 0);
  if (productId > 0) {
    const result = await buildResult(db, channel, productId);
    if (result.error) return json({ ok: false, release: MARKETPLACE_RELEASE, error: result.error }, result.status || 400);
    return json({ ok: true, release: MARKETPLACE_RELEASE, contract: MARKETPLACE_CONTRACT, mode: 'local-draft-readiness', provider_execution: false, publication_allowed: false, ...result });
  }

  const rows = await db.prepare(`
    SELECT mp.*, p.name, p.sku, p.slug
    FROM marketplace_listing_profiles mp
    LEFT JOIN products p ON p.product_id=mp.product_id
    WHERE mp.channel_key=?
    ORDER BY datetime(mp.updated_at) DESC, mp.marketplace_listing_profile_id DESC
    LIMIT 150
  `).bind(channel).all().catch(() => ({ results: [] }));
  return json({ ok: true, release: MARKETPLACE_RELEASE, contract: MARKETPLACE_CONTRACT, channel, profiles: rows?.results || [], provider_execution: false, publication_allowed: false });
}

export async function onRequestPost(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return json({ ok: false, release: MARKETPLACE_RELEASE, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, release: MARKETPLACE_RELEASE, error: 'Database binding is not configured.' }, 500);
  const schema = await marketplaceSchemaStatus(db);
  if (!schema.ready) return json({ ok: false, release: MARKETPLACE_RELEASE, schema_ready: false, missing_tables: schema.missing_tables, request_time_schema_mutation: false, error: 'Release 450 marketplace schema is not active.' }, 503);

  let body = {};
  try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const channel = clean(body.channel || 'etsy', 40).toLowerCase();
  const productId = Number(body.product_id || 0);
  if (!productId) return json({ ok: false, error: 'product_id is required.' }, 400);
  const policy = await readChannelPolicy(db, channel);
  if (!policy) return json({ ok: false, error: 'Unsupported marketplace channel.' }, 400);
  if (Number(policy.provider_execution_allowed || 0) !== 0 || Number(policy.publication_allowed || 0) !== 0) {
    return json({ ok: false, error: 'Release 450 refuses marketplace profile writes while provider publication is enabled.' }, 409);
  }
  const product = await productRow(db, productId);
  if (!product) return json({ ok: false, error: 'Product was not found.' }, 404);

  const tags = cleanList(Array.isArray(body.tags) ? body.tags : [], 80, 50);
  const materials = cleanList(Array.isArray(body.materials) ? body.materials : [], 80, 50);
  const styles = cleanList(Array.isArray(body.styles) ? body.styles : [], 45, 2);
  const personalization = jsonArray(body.personalization_questions || [], 10);
  const variations = jsonArray(body.variation_properties || [], 10);
  const partners = cleanList(Array.isArray(body.production_partner_refs) ? body.production_partner_refs : [], 120, 20);
  const listingType = ['physical','download','both'].includes(clean(body.listing_type, 20)) ? clean(body.listing_type, 20) : 'physical';
  const listingState = ['draft','needs_review','approved','rejected'].includes(clean(body.listing_state, 20)) ? clean(body.listing_state, 20) : 'draft';

  await db.prepare(`
    INSERT INTO marketplace_listing_profiles (
      channel_key,product_id,title_override,description_override,tags_json,materials_json,style_terms_json,
      quantity_override,taxonomy_id,shipping_profile_reference,return_policy_reference,readiness_state_reference,
      who_made,when_made,is_supply,listing_type,personalization_questions_json,variation_properties_json,
      production_partner_refs_json,listing_state,review_notes,created_by_user_id,reviewed_by_user_id,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(channel_key,product_id) DO UPDATE SET
      title_override=excluded.title_override, description_override=excluded.description_override,
      tags_json=excluded.tags_json, materials_json=excluded.materials_json, style_terms_json=excluded.style_terms_json,
      quantity_override=excluded.quantity_override, taxonomy_id=excluded.taxonomy_id,
      shipping_profile_reference=excluded.shipping_profile_reference, return_policy_reference=excluded.return_policy_reference,
      readiness_state_reference=excluded.readiness_state_reference, who_made=excluded.who_made, when_made=excluded.when_made,
      is_supply=excluded.is_supply, listing_type=excluded.listing_type,
      personalization_questions_json=excluded.personalization_questions_json,
      variation_properties_json=excluded.variation_properties_json,
      production_partner_refs_json=excluded.production_partner_refs_json,
      listing_state=excluded.listing_state, review_notes=excluded.review_notes,
      reviewed_by_user_id=excluded.reviewed_by_user_id, updated_at=CURRENT_TIMESTAMP
  `).bind(
    channel, productId, clean(body.title_override, 140) || null, clean(body.description_override, 12000) || null,
    JSON.stringify(tags), JSON.stringify(materials), JSON.stringify(styles),
    Number(body.quantity_override || 0) > 0 ? Math.trunc(Number(body.quantity_override)) : null,
    clean(body.taxonomy_id, 80) || null, clean(body.shipping_profile_reference, 160) || null,
    clean(body.return_policy_reference, 160) || null, clean(body.readiness_state_reference, 160) || null,
    clean(body.who_made, 40) || null, clean(body.when_made, 40) || null, asBool(body.is_supply), listingType,
    JSON.stringify(personalization), JSON.stringify(variations), JSON.stringify(partners), listingState,
    clean(body.review_notes, 2000) || null, Number(user.user_id || 0) || null,
    listingState === 'approved' || listingState === 'rejected' ? Number(user.user_id || 0) || null : null
  ).run();

  const result = await buildResult(db, channel, productId);
  const validation = result.validation;
  await db.prepare(`
    INSERT INTO marketplace_listing_validation_snapshots
      (channel_key,product_id,validation_state,blocker_count,warning_count,blockers_json,warnings_json,payload_json,source_contract,created_by_user_id,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
  `).bind(channel, productId, validation.validation_state, validation.blocker_count, validation.warning_count,
    JSON.stringify(validation.blockers), JSON.stringify(validation.warnings), JSON.stringify(validation.payload),
    MARKETPLACE_CONTRACT, Number(user.user_id || 0) || null).run();

  const draftId = `${channel}:${productId}`;
  const draftStatus = validation.blocker_count ? 'needs_review' : 'draft';
  await db.prepare(`
    INSERT INTO marketplace_syndication_drafts
      (id,channel_key,product_id,draft_title,payload_json,status,publication_requested,created_by,created_at,updated_at)
    VALUES (?,?,?,?,?,?,0,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET draft_title=excluded.draft_title,payload_json=excluded.payload_json,
      status=excluded.status,publication_requested=0,updated_at=CURRENT_TIMESTAMP
  `).bind(draftId, channel, String(productId), validation.payload.title || product.name || `Product ${productId}`,
    JSON.stringify({ profile: result.profile, validation }), draftStatus, String(user.email || user.user_id || 'admin')).run();

  return json({
    ok: true,
    release: MARKETPLACE_RELEASE,
    contract: MARKETPLACE_CONTRACT,
    message: `${channel} local listing profile saved.`,
    provider_execution: false,
    publication_allowed: false,
    syndication_draft_id: draftId,
    syndication_status: draftStatus,
    ...result,
  });
}

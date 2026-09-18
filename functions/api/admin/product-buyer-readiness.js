// Release 467 Build 182 — bounded, read-only Product facts & buyer-readiness projection.
// One Product-table read only. No Product mutation, image/R2 read, Inventory scan, provider execution,
// publication, payment/refund action, accounting posting, request-time DDL, timer, or retry loop.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { buildReadBudgetHeaders } from '../_lib/d1ReadBudget.js';

const BUILD = 182;
const MAX_SOURCE_ROWS = 240;
const MAX_ISSUE_ROWS = 40;
const json = (data, status = 200) => jsonResponse({ release: 467, build: BUILD, read_only: true, ...data }, status, {
  'Cache-Control': 'no-store',
  ...buildReadBudgetHeaders('admin_product_buyer_readiness_v182', { limit: MAX_SOURCE_ROWS }),
});
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const text = (value) => normalizeText(value);
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

function fix(tab, field, label) {
  return { tab, field, label, href_template: `/admin/product-editor/?product_id={product_id}&tab=${tab}&focus=${field}` };
}
function issue(code, severity, label, help, target) {
  return { code, severity, label, help, fix: target };
}
function analyze(product = {}) {
  const issues = [];
  const productType = text(product.product_type).toLowerCase() || 'physical';
  const origin = text(product.merchandise_origin).toLowerCase() || 'handmade';
  const saleChannel = text(product.sale_channel).toLowerCase() || 'onsite';
  const status = text(product.status).toLowerCase() || 'draft';
  const review = text(product.review_status).toLowerCase() || 'pending_review';
  const requiresShipping = num(product.requires_shipping) === 1;
  const tracking = num(product.inventory_tracking) === 1;

  if (!text(product.name)) issues.push(issue('name','blocker','Product name','Add a clear buyer-facing Product name.',fix('basics','name','Fix name')));
  if (!text(product.slug)) issues.push(issue('slug','blocker','Product slug','Add a stable public Product slug.',fix('basics','slug','Fix slug')));
  if (!text(product.sku)) issues.push(issue('sku','attention','SKU','Add an internal SKU so Product identity stays traceable.',fix('basics','sku','Add SKU')));
  if (!text(product.product_category)) issues.push(issue('category','blocker','Category','Assign the correct Product category.',fix('basics','product_category','Fix category')));
  if (!['physical','digital'].includes(productType)) issues.push(issue('product_type','blocker','Product type','Choose physical or digital.',fix('basics','product_type','Fix type')));

  if (text(product.short_description).length < 40) issues.push(issue('short_description','attention','Short description','Write at least 40 useful characters for cards/search previews.',fix('description','short_description','Improve short description')));
  if (text(product.description).length < 120) issues.push(issue('description','attention','Long description','Write at least 120 useful characters covering what the buyer receives.',fix('description','description','Improve description')));

  if (num(product.price_cents) <= 0) issues.push(issue('price','blocker','Selling price','Set a positive selling price.',fix('pricing','price','Fix price')));
  if (!text(product.currency)) issues.push(issue('currency','blocker','Currency','Set the selling currency.',fix('pricing','currency','Fix currency')));
  if (num(product.compare_at_price_cents) > 0 && num(product.compare_at_price_cents) < num(product.price_cents)) {
    issues.push(issue('compare_at_price','attention','Compare-at price','Compare-at price is lower than the current selling price.',fix('pricing','compare_at_price','Review compare-at price')));
  }

  if (productType === 'physical') {
    if (requiresShipping && num(product.weight_grams) <= 0) issues.push(issue('weight','blocker','Shipping weight','Add a positive weight for a shippable physical Product.',fix('pricing','weight_grams','Add weight')));
    if (requiresShipping && !text(product.shipping_code)) issues.push(issue('shipping_code','blocker','Shipping code','Assign the shipping code used by fulfilment.',fix('pricing','shipping_code','Add shipping code')));
  }
  if (productType === 'digital' && !text(product.digital_file_url)) issues.push(issue('digital_file','blocker','Digital file','Add the digital-file URL before buyer delivery.',fix('pricing','digital_file_url','Add digital file')));
  if (productType === 'digital' && requiresShipping) issues.push(issue('digital_shipping','attention','Digital shipping setting','Digital Products normally should not require physical shipping.',fix('pricing','requires_shipping','Review shipping')));

  if (!['handmade','vintage','collectible','antique','oddity','prebuilt'].includes(origin)) issues.push(issue('origin','attention','Merchandise origin','Choose the appropriate merchandise origin.',fix('description','merchandise_origin','Fix origin')));
  if (['vintage','collectible','antique','oddity','prebuilt'].includes(origin) && !text(product.condition_summary)) {
    issues.push(issue('condition','attention','Condition summary','Describe condition clearly for non-handmade / found / vintage inventory.',fix('description','condition_summary','Add condition')));
  }
  if (['vintage','antique'].includes(origin) && !text(product.era_label)) {
    issues.push(issue('era','attention','Era / period','Add an era or period when known; use a cautious estimate when appropriate.',fix('description','era_label','Add era / period')));
  }
  if (['hybrid','external_only'].includes(saleChannel) && !text(product.external_listing_url)) {
    issues.push(issue('external_listing','blocker','External listing URL','Hybrid/external-only sale channels require a working external listing URL.',fix('description','external_listing_url','Add external listing')));
  }

  if (tracking && num(product.inventory_quantity) <= 0) issues.push(issue('stock','attention','Tracked finished stock','Finished-product inventory tracking is enabled but quantity is zero.',fix('pricing','inventory_quantity','Review stock')));
  if (status === 'active' && !['approved','published'].includes(review)) {
    issues.push(issue('review_status','blocker','Review status','Active buyer-facing Products should be approved or published.',fix('basics','review_status','Fix review status')));
  }

  const blockerCount = issues.filter((row) => row.severity === 'blocker').length;
  const attentionCount = issues.filter((row) => row.severity === 'attention').length;
  const totalChecks = 18;
  const penalty = Math.min(totalChecks, blockerCount * 2 + attentionCount);
  const score = Math.max(0, Math.round(((totalChecks - penalty) / totalChecks) * 100));
  return {
    issues,
    blocker_count: blockerCount,
    attention_count: attentionCount,
    score,
    ready_for_buyer_review: blockerCount === 0,
  };
}

export async function onRequestGet({ request, env }) {
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(request.url);
  const q = text(url.searchParams.get('q')).toLowerCase().slice(0, 100);
  const requestedLimit = Number(url.searchParams.get('limit') || MAX_ISSUE_ROWS);
  const issueLimit = Math.max(1, Math.min(MAX_ISSUE_ROWS, Number.isFinite(requestedLimit) ? requestedLimit : MAX_ISSUE_ROWS));
  try {
    const result = await db.prepare(`
      SELECT product_id,product_number,name,slug,sku,product_category,product_type,status,review_status,
             short_description,description,price_cents,compare_at_price_cents,currency,
             requires_shipping,shipping_code,weight_grams,inventory_tracking,inventory_quantity,
             digital_file_url,merchandise_origin,sale_channel,external_listing_url,external_listing_label,
             condition_summary,era_label,updated_at
      FROM products
      WHERE LOWER(TRIM(COALESCE(status,'draft'))) NOT IN ('archived','deleted')
      ORDER BY updated_at DESC,product_id DESC
      LIMIT ${MAX_SOURCE_ROWS}
    `).all();
    const source = rows(result);
    const analyzed = source.map((product) => ({ ...product, buyer_readiness: analyze(product) }));
    const searched = q ? analyzed.filter((product) => [
      product.name, product.slug, product.sku, product.product_category, product.product_number, product.product_id
    ].some((value) => String(value ?? '').toLowerCase().includes(q))) : analyzed;
    const issues = searched.filter((product) => product.buyer_readiness.issues.length > 0)
      .sort((a,b) => b.buyer_readiness.blocker_count - a.buyer_readiness.blocker_count
        || b.buyer_readiness.attention_count - a.buyer_readiness.attention_count
        || a.buyer_readiness.score - b.buyer_readiness.score
        || String(a.name || '').localeCompare(String(b.name || '')))
      .slice(0, issueLimit);

    const countIssue = (code) => analyzed.filter((product) => product.buyer_readiness.issues.some((row) => row.code === code)).length;
    const summary = {
      products_reviewed: analyzed.length,
      ready_for_buyer_review: analyzed.filter((product) => product.buyer_readiness.ready_for_buyer_review).length,
      products_with_blockers: analyzed.filter((product) => product.buyer_readiness.blocker_count > 0).length,
      products_with_attention: analyzed.filter((product) => product.buyer_readiness.attention_count > 0).length,
      missing_category: countIssue('category'),
      description_attention: analyzed.filter((product) => product.buyer_readiness.issues.some((row) => ['short_description','description'].includes(row.code))).length,
      pricing_blockers: countIssue('price'),
      shipping_blockers: analyzed.filter((product) => product.buyer_readiness.issues.some((row) => ['weight','shipping_code','digital_file'].includes(row.code))).length,
      condition_attention: countIssue('condition'),
      external_listing_blockers: countIssue('external_listing'),
      tracked_zero_stock: countIssue('stock'),
      source_limit: MAX_SOURCE_ROWS,
      issue_limit: issueLimit,
      source_truncated: source.length >= MAX_SOURCE_ROWS,
    };

    return json({
      ok: true,
      delivery: 'product-buyer-readiness-v182',
      authority: 'live_d1_products',
      mutation_capability: 'none',
      automatic_publish: false,
      automatic_save: false,
      requested_by: { user_id: admin.user_id, email: admin.email },
      query: q,
      summary,
      products: issues,
    });
  } catch (error) {
    return json({
      ok: false,
      delivery: 'product-buyer-readiness-v182',
      mutation_capability: 'none',
      error: 'Product buyer readiness could not be loaded.',
      detail: text(error?.message || error),
    }, 503);
  }
}

export { analyze };

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const oauth = read('functions/api/admin/etsy-oauth-acceptance.js');
const callback = read('functions/api/social/oauth/_callback.js');
const priceReview = read('functions/api/admin/product-zero-price-review.js');
const productSave = read('functions/api/admin/product-editor-save.js');
const provider = read('functions/api/_lib/oauthProviders.js');
const acceptance = read('docs/operations/RELEASE_467_BUILD_393_ETSY_LIVE_CALLBACK_PRICE_ACCEPTANCE.md');

test('Etsy success requires the connection AND the independently verified shop', () => {
  assert.match(oauth,/conn\.connection_status==='connected'&&shop&&shop\.acceptance_status==='connected_verified'/);
  assert.match(oauth,/getAdminUserFromRequest\(request,env\)/);
  assert.match(oauth,/if\(!admin\)return json\(\{ok:false,error:'Unauthorized\.'/);
  assert.match(oauth,/provider_listing_writes_allowed:false/);
  assert.match(oauth,/provider_publication_allowed:false/);
});
test('OAuth never treats a consumed grant as a repeatable success', () => {
  assert.match(callback,/state_replayed_expired_or_consumed/);
  assert.match(provider,/oauth_provider_redirect_blocked/);
  assert.doesNotMatch(provider,/redirect\s*:\s*['"]error['"]/);
});
test('Historical zero price review is operator-approved, bounded and GET-only', () => {
  assert.match(priceReview,/export async function onRequestGet/);
  assert.doesNotMatch(priceReview,/export async function onRequestPost/);
  assert.match(priceReview,/ORDER BY product_id DESC LIMIT 26/);
  assert.match(priceReview,/no_automatic_price_repair:true/);
  assert.match(priceReview,/evidence_required:true/);
  assert.match(priceReview,/historical_price_inferred:false/);
});
test('Product writes reject guessed, malformed, or unconfirmed zero prices', () => {
  assert.match(productSave,/Number\.isSafeInteger\(submitted\)/);
  assert.match(productSave,/body\.confirm_zero_price!==true/);
  assert.match(productSave,/code:'invalid_price_cents'/);
  assert.match(productSave,/code:'zero_price_not_confirmed'/);
});
test('Successful Product response only follows canonical persisted-CAD-cents readback', () => {
  assert.match(productSave,/SELECT price_cents,compare_at_price_cents,currency FROM products WHERE product_id=\? LIMIT 1/);
  assert.match(productSave,/Number\(saved\.price_cents\)===submitted/);
  assert.match(productSave,/code:'product_price_readback_unconfirmed',retry_automatically:false/);
  assert.match(productSave,/price_cents_confirmed:true/);
});
test('Operator confirmation is tracked without inventing independent acceptance proof', () => {
  assert.match(acceptance,/USER VALIDATED/);
  assert.match(acceptance,/independent evidence not attached/);
  assert.match(acceptance,/Source-backed Product price review/);
  assert.match(acceptance,/Production deployment\/integrity at exact SHA/);
  assert.doesNotMatch(acceptance,/Status: \*\*PRODUCTION_GREEN\*\*/);
});

import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/api/product-media.js';

const bytes = new TextEncoder().encode('fake-jpeg-bytes');
const reads = [];
const available = new Set([
  'products/50/example.jpg',
  'Itemsforsale/DD215-216B.jpeg'
]);
const bucket = {
  async get(key) {
    reads.push(key);
    if (!available.has(key)) return null;
    return {
      body: bytes,
      httpEtag: '"build60-test"',
      writeHttpMetadata(headers) { headers.set('Content-Type', 'image/jpeg'); }
    };
  }
};

async function get(url, env = { PRODUCT_MEDIA_BUCKET: bucket }) {
  return onRequestGet({ request: new Request(url), env });
}

const product = await get('https://dev.devilndove-site.pages.dev/api/product-media?key=products%2F50%2Fexample.jpg');
assert.equal(product.status, 200);
assert.equal(product.headers.get('content-type'), 'image/jpeg');
assert.match(product.headers.get('cache-control') || '', /max-age=86400/);
assert.equal(new TextDecoder().decode(await product.arrayBuffer()), 'fake-jpeg-bytes');

const legacyExact = await get('https://dev.devilndove-site.pages.dev/api/product-media?key=Itemsforsale%2FDD215-216B.jpeg');
assert.equal(legacyExact.status, 200);
assert.equal(legacyExact.headers.get('x-dd-media-key'), 'Itemsforsale/DD215-216B.jpeg');

const legacyLower = await get('https://dev.devilndove-site.pages.dev/api/product-media?key=itemsforsale%2FDD215-216B.jpeg');
assert.equal(legacyLower.status, 200);
assert.equal(legacyLower.headers.get('x-dd-media-key'), 'Itemsforsale/DD215-216B.jpeg');

const viaSrc = await get('https://dev.devilndove-site.pages.dev/api/product-media?src=https%3A%2F%2Fassets.devilndove.com%2Fitemsforsale%2FDD215-216B.jpeg');
assert.equal(viaSrc.status, 200);
assert.equal(viaSrc.headers.get('x-dd-media-key'), 'Itemsforsale/DD215-216B.jpeg');

const beforeInvalid = reads.length;
for (const url of [
  'https://dev.devilndove-site.pages.dev/api/product-media?key=inventory%2Fsecret.jpg',
  'https://dev.devilndove-site.pages.dev/api/product-media?key=products%2F..%2Fsecret.jpg',
  'https://dev.devilndove-site.pages.dev/api/product-media?src=https%3A%2F%2Fevil.example%2Fproducts%2F50%2Fexample.jpg'
]) {
  const response = await get(url);
  assert.equal(response.status, 400);
}
assert.equal(reads.length, beforeInvalid, 'invalid requests must not reach R2');

const missing = await get(
  'https://dev.devilndove-site.pages.dev/api/product-media?key=products%2F50%2Fmissing.jpg',
  { PRODUCT_MEDIA_BUCKET: { async get(){ return null; } } }
);
assert.equal(missing.status, 404);
const missingJson = await missing.json();
assert.equal(missingJson.code, 'PRODUCT_MEDIA_NOT_FOUND');

console.log('CURRENT STOREFRONT MEDIA RECOVERY TEST: PASS');
console.log('R2 access: GET ONLY / approved public prefixes / legacy case compatibility / unsafe paths rejected');

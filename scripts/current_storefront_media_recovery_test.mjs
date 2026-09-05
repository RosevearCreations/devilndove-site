import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/api/product-media.js';

const bytes = new TextEncoder().encode('fake-jpeg-bytes');
let reads = 0;
const bucket = {
  async get(key) {
    reads += 1;
    assert.equal(key, 'products/50/example.jpg');
    return {
      body: bytes,
      httpEtag: '"build59-test"',
      writeHttpMetadata(headers) { headers.set('Content-Type', 'image/jpeg'); }
    };
  }
};

const ok = await onRequestGet({
  request: new Request('https://dev.devilndove-site.pages.dev/api/product-media?key=products%2F50%2Fexample.jpg'),
  env: { PRODUCT_MEDIA_BUCKET: bucket }
});
assert.equal(ok.status, 200);
assert.equal(ok.headers.get('content-type'), 'image/jpeg');
assert.match(ok.headers.get('cache-control') || '', /max-age=86400/);
assert.equal(new TextDecoder().decode(await ok.arrayBuffer()), 'fake-jpeg-bytes');
assert.equal(reads, 1);

const viaSrc = await onRequestGet({
  request: new Request('https://dev.devilndove-site.pages.dev/api/product-media?src=https%3A%2F%2Fassets.devilndove.com%2Fproducts%2F50%2Fexample.jpg'),
  env: { PRODUCT_MEDIA_BUCKET: bucket }
});
assert.equal(viaSrc.status, 200);
assert.equal(reads, 2);

for (const url of [
  'https://dev.devilndove-site.pages.dev/api/product-media?key=inventory%2Fsecret.jpg',
  'https://dev.devilndove-site.pages.dev/api/product-media?key=products%2F..%2Fsecret.jpg',
  'https://dev.devilndove-site.pages.dev/api/product-media?src=https%3A%2F%2Fevil.example%2Fproducts%2F50%2Fexample.jpg'
]) {
  const response = await onRequestGet({ request: new Request(url), env: { PRODUCT_MEDIA_BUCKET: bucket } });
  assert.equal(response.status, 400);
}
assert.equal(reads, 2, 'invalid requests must not reach R2');

const missing = await onRequestGet({
  request: new Request('https://dev.devilndove-site.pages.dev/api/product-media?key=products%2F50%2Fexample.jpg'),
  env: { PRODUCT_MEDIA_BUCKET: { async get(){ return null; } } }
});
assert.equal(missing.status, 404);
const missingJson = await missing.json();
assert.equal(missingJson.code, 'PRODUCT_MEDIA_NOT_FOUND');

console.log('CURRENT STOREFRONT MEDIA RECOVERY TEST: PASS');
console.log('R2 access: GET ONLY / products/* ONLY / unsafe paths rejected');

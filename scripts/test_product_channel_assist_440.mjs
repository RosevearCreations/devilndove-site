import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../admin/product-editor/index.html', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../public/js/admin-product-channel-assist-v440.js', import.meta.url), 'utf8');
const etsy = readFileSync(new URL('../public/js/admin-product-marketplace-drafts-v438.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../admin/product-editor/channel-assist-440.css', import.meta.url), 'utf8');

test('independent orange Etsy and blue Meta sections retain all existing provider controls', () => {
  for (const id of ['dd438EtsyTest', 'dd438EtsyCreate', 'dd439EtsyShipping', 'dd439EtsyReadiness',
    'dd439EtsyCanadaConfirm', 'dd438EtsyConfirm', 'dd438MetaTest']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /dd-etsy-tab/);
  assert.match(html, /dd-meta-tab/);
  assert.match(css, /dd-editor-tab\.dd-etsy-tab/);
  assert.match(css, /dd-editor-tab\.dd-meta-tab/);
  assert.match(html, /dd440EtsyShippingStep/);
  assert.match(html, /dd-channel-required--etsy/);
  assert.doesNotMatch(html, /Build 390: Save Product verifies the stored dollar amount; \$0\.00/);
});

test('optional legacy controls appear in their appropriate tabs without automatic provider calls', () => {
  assert.match(layout, /panel\('basics'\)\.append\(channelIntent\)/);
  assert.match(layout, /panel\('media'\)\.append\(galleryReview\)/);
  assert.match(layout, /panel\('advanced'\)\.append\(disclosure\)/);
  assert.doesNotMatch(layout, /apiFetch|fetch\(|XMLHttpRequest|setInterval|setTimeout/);
  for (const id of ['productChannel405', 'productDistribution406', 'listingSync408']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('shipping must still verify Canada-only before any Etsy draft can be created', () => {
  assert.match(etsy, /state\.verifiedShippingId===Number\(\$\('dd439EtsyShipping'\)\?\.value\)/);
  assert.match(etsy, /Boolean\(\$\('dd439EtsyCanadaConfirm'\)\?\.checked\)/);
  assert.match(etsy, /Boolean\(\$\('dd438EtsyConfirm'\)\?\.checked\)/);
  assert.match(etsy, /action:'create_draft'/);
  assert.match(html, /No live listing, photo upload, or shipping-policy change is performed/);
});

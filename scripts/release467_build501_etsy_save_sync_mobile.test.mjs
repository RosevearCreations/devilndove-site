import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const file=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const html=file('admin/product-editor/index.html');
const css=file('admin/product-editor/etsy-package-500.css');
const editor=file('public/js/admin-product-editor-v163.js');
const packageScript=file('public/js/admin-product-etsy-package-v500.mjs');
const intent=file('public/js/admin-product-channel-intent-v405.js');

test('Etsy checkbox has a fixed intrinsic width, no forced 100%-wide consent box',()=>{
  assert.match(css,/input\[type="checkbox"\]\{width:18px!important;min-width:18px!important;max-width:18px!important;height:18px!important/);
  assert.match(css,/\.dd500-package\{display:grid;grid-template-columns:minmax\(0,1fr\);grid-auto-rows:max-content/);
  assert.match(css,/\.dd500-consent>span/);
  assert.match(html,/<label class="dd500-consent"><input type="checkbox" id="dd500Consent"><span>/);
  assert.match(html,/<label><input type="checkbox" id="dd500LinkConsent"><span>/);
  assert.match(html,/<link rel="stylesheet" href="\/admin\/product-editor\/etsy-package-500\.css\?v=5\d\d"\/>/);
  assert.ok(/etsy-package-500\.css\?v=5\d\d/.test(html.slice(0,html.indexOf('</head>'))),'CSS must load in head before layout');
  assert.doesNotMatch(html.slice(html.indexOf('<body')),/etsy-package-500\.css/);
});
test('Product save stays local and Etsy needs a deliberate Create/Update authorization',()=>{
  assert.match(html,/id="productChannel405Etsy"> Etsy — create or update draft/);
  assert.match(html,/<details id="dd501ChannelRecovery"><summary>Destination recovery/);
  assert.match(html,/id="dd501SaveState"/);
  assert.match(html,/id="dd523EtsyPost" disabled>Create Etsy draft/);
  assert.match(editor,/etsyPreferenceSaved=Boolean\(destinationsSaved&&!newerEdits/);
  assert.match(editor,/etsy_preference_saved:etsyPreferenceSaved,destinations_confirmed:destinationsSaved/);
  assert.doesNotMatch(editor,/sync-after-create:501/);
  assert.doesNotMatch(packageScript,/sync-after-create:501/);
  assert.match(packageScript,/window\.DDEtsyDraftFlow523=\{/);
  assert.match(packageScript,/void refresh\(\);\n  \}\);\n  document\.addEventListener\('dd:product-loaded'/);
  assert.doesNotMatch(packageScript,/await refresh\(\);await syncAfterSave\('product'\)/);
  assert.match(intent,/afterProductSave:async\(id,choice\)=>saveFor\(Number\(id\),choice\)/);
});

test('existing Etsy ID is updated; uncertain result and Product #53 prevent duplicates',()=>{
  assert.match(packageScript,/const existing=Boolean\(state\.linked\),mode=existing\?'existing':'new'/);
  assert.match(packageScript,/action:'update_saved_fields'/);
  assert.match(packageScript,/action:'create_draft'/);
  assert.match(packageScript,/if\(candidate\)\{/);
  assert.match(packageScript,/!\$\('dd500ListingId'\)\.value\.trim\(\)\)\$\('dd500NewSettings'\)\.open=true/);
  assert.match(packageScript,/Verify and link existing Etsy draft/);
  assert.match(packageScript,/state\.holdAfterWrite=true/);
  assert.match(packageScript,/if\(state\.syncing\)/);
  assert.match(packageScript,/if\(state\.holdAfterWrite\)/);
  assert.match(packageScript,/await sendImages\(listingId\)/);
  assert.match(packageScript,/await acceptance\(listingId\)/);
  assert.match(packageScript,/document\.addEventListener\('dd:media-inline-updated'/);
  assert.doesNotMatch(packageScript, /\$\('dd500Legacy'\)\.open=true/);
});

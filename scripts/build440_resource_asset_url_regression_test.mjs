import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const moduleUrl = url.pathToFileURL(path.join(root, 'functions/api/admin/product-resource-search.js')).href + `?build440=${Date.now()}`;
const { browserSafeResourceImageUrl } = await import(moduleUrl);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

let checks = 0;
const check = (condition, message) => {
  checks += 1;
  assert(condition, message);
};

const problematic = "https://assets.devilndove.com/Supplies/144Pcs 1# 2# 3# 4# 5# 6# 10, 20, 30, 40, 50, 60 Jeweler's Saw Blades Set with Storage Box (12pcs of Each Size), Gold,Silver.jpg";
const safe = browserSafeResourceImageUrl(problematic);

check(safe.startsWith('https://assets.devilndove.com/Supplies/'), 'Asset origin or path changed unexpectedly.');
check(!safe.includes(' '), 'Resource image URL still contains literal spaces.');
check(!safe.includes('#'), 'Resource image URL still contains a literal fragment marker.');
check((safe.match(/%23/g) || []).length === 6, 'All six literal # characters must remain encoded as R2 object-key characters.');
check(safe.includes('144Pcs%201%23%202%23%203%23%204%23%205%23%206%23'), 'Problematic object-key prefix was not encoded deterministically.');
check(safe.includes('Saw%20Blades%20Set'), 'Spaces in the object path were not normalized for browser transport.');

const alreadyEncoded = 'https://assets.devilndove.com/Supplies/Size%201%23%20blade.jpg';
const stable = browserSafeResourceImageUrl(alreadyEncoded);
check(stable.includes('Size%201%23%20blade.jpg'), 'Already encoded object URL was double-encoded.');
check(!stable.includes('%2523'), 'Existing %23 was incorrectly double-encoded.');

check(browserSafeResourceImageUrl('') === '', 'Blank image URL should remain blank.');
check(browserSafeResourceImageUrl('data:image/png;base64,AAAA') === 'data:image/png;base64,AAAA', 'Data URL should remain untouched.');

const adminSafety = fs.readFileSync(path.join(root, 'public/js/admin-asset-url-safety.js'), 'utf8');
const transportGuard = fs.readFileSync(path.join(root, 'public/js/admin-inventory-asset-transport-guard.js'), 'utf8');
const inventoryPage = fs.readFileSync(path.join(root, 'admin/inventory-operations/index.html'), 'utf8');
const inventoryUi = fs.readFileSync(path.join(root, 'public/js/admin-site-item-inventory.js'), 'utf8');

check(adminSafety.includes("raw.replace(/#/g, '%23')") && adminSafety.includes("PUBLIC_ASSET_HOST = 'assets.devilndove.com'"), 'Inventory Admin safety layer must encode literal # before URL parsing.');
check(adminSafety.includes('normalizePayload') && adminSafety.includes('DDAuth.readApiJson') && adminSafety.includes('DDAuth.apiJson'), 'Inventory Admin safety layer must normalize both direct and cached/shared API JSON payloads.');
check(!adminSafety.includes('fetch(') && !adminSafety.includes('setInterval(') && !adminSafety.includes('setTimeout('), 'Inventory Admin safety layer must not add network calls or polling.');

check(transportGuard.includes("raw.replace(/#/g, '%23')") && transportGuard.includes("const HOST = 'assets.devilndove.com'"), 'Inventory transport guard must encode literal # before URL parsing.');
check(transportGuard.includes('normalizePayload') && transportGuard.includes('DDAuth.readApiJson') && transportGuard.includes('DDAuth.apiJson'), 'Inventory transport guard must normalize API payloads independently of the older safety layer.');
check(transportGuard.includes("Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')") && transportGuard.includes('sanitizeGeneratedHtml(value)'), 'Inventory transport guard must sanitize generated HTML before the browser parses image/link attributes.');
check(transportGuard.includes('insertAdjacentHTML') && transportGuard.includes('sanitizeGeneratedHtml(html)'), 'Inventory transport guard must also cover insertAdjacentHTML transport.');
check(transportGuard.includes("HTMLImageElement?.prototype, 'src'") && transportGuard.includes("HTMLAnchorElement?.prototype, 'href'"), 'Inventory transport guard must cover direct src/href property assignment.');
check(transportGuard.includes("window.location.pathname.startsWith('/admin/inventory-operations')"), 'Inventory transport guard must remain narrowly page-scoped.');
check(transportGuard.includes('HTML_ENTITY_RE') && transportGuard.includes('safeGeneratedAssetUrl'), 'Generated-HTML transport must distinguish HTML entities from R2 object-key fragment characters.');
check(!transportGuard.includes('fetch(') && !transportGuard.includes('setInterval(') && !transportGuard.includes('setTimeout('), 'Inventory transport guard must add no network calls or polling.');

// Execute the real browser guard in a small mock window so the exact saw-blade
// filename is proven through the generated-HTML sanitizer rather than only by
// static source inspection. This protects the apostrophe entity (&#039;) while
// encoding the six real object-key # characters.
class MockElement {}
const sandbox = {
  window: {
    location: { pathname: '/admin/inventory-operations/', origin: 'https://devilndove-site-dev.pages.dev' },
    DDAuth: {
      readApiJson: async (value) => value,
      apiJson: async () => ({ ok: true }),
    },
    Element: MockElement,
  },
  Element: MockElement,
  URL,
  Symbol,
  Object,
  WeakSet,
  Array,
  String,
  Number,
};
vm.runInNewContext(transportGuard, sandbox, { filename: 'admin-inventory-asset-transport-guard.js' });
const runtimeGuard = sandbox.window.DDInventoryAssetTransportGuard;
check(runtimeGuard?.installed === true, 'Inventory transport guard did not install in the browser-contract harness.');

const escapedProblematic = problematic
  .replaceAll('&', '&amp;')
  .replaceAll("'", '&#039;');
const generatedHtml = `<a href="${escapedProblematic}"><img src="${escapedProblematic}" alt="Saw blades"></a>`;
const sanitizedHtml = runtimeGuard.sanitizeGeneratedHtml(generatedHtml);
check((sanitizedHtml.match(/%23/g) || []).length === 12, 'Generated HTML must encode all six object-key # characters in both href and src.');
check((sanitizedHtml.match(/&#039;/g) || []).length === 2, 'Generated HTML must preserve the apostrophe HTML entity in both href and src.');
check(!sanitizedHtml.includes('&%23039;') && !sanitizedHtml.includes('&%2339;'), 'Generated HTML must never corrupt the apostrophe entity into the transport path.');
check(sanitizedHtml.includes('Jeweler&#039;s%20Saw%20Blades%20Set'), 'Apostrophe entity and following path must survive generated-HTML normalization.');
const decodedAttributeUrl = sanitizedHtml.match(/src="([^"]+)"/)?.[1]?.replaceAll('&#039;', "'").replaceAll('&amp;', '&') || '';
const decodedUrl = new URL(decodedAttributeUrl);
check(decodedUrl.hash === '', 'Sanitized generated image URL must not leave a browser fragment.');
check((decodedUrl.pathname.match(/%23/g) || []).length === 6, 'Sanitized generated image URL must preserve all six object-key # characters in the request path.');

// Keep the regression anchored to the exact UI path that exposed the live browser
// failure: the Inventory row thumbnail still renders the API-provided image_url
// directly into an <img src>. The transport guard must therefore remain loaded
// before this renderer rather than allowing the test to pass on helper coverage alone.
check(
  inventoryUi.includes('site-inventory-list-thumb') &&
  inventoryUi.includes('${x.image_url ?') &&
  inventoryUi.includes('<img src="${escapeHtml(x.image_url)}"'),
  'Regression must continue covering the direct Inventory thumbnail renderer that exposed the browser defect.'
);

const safetyIndex = inventoryPage.indexOf('/public/js/admin-asset-url-safety.js?v=440.2');
const transportIndex = inventoryPage.indexOf('/public/js/admin-inventory-asset-transport-guard.js?v=440.4');
check(safetyIndex > 0, 'Inventory Operations page does not load the Admin asset URL safety layer with the new cache-busting version.');
check(transportIndex > safetyIndex, 'Inventory Operations page must load the transport guard after the shared safety layer.');
for (const script of [
  '/public/js/admin-inventory-integrity-review.js?v=440',
  '/public/js/admin-tool-lifecycle-review.js?v=440',
  '/public/js/admin-product-resources.js?v=440',
  '/public/js/admin-site-item-inventory.js?v=440.3',
]) {
  check(inventoryPage.indexOf(script) > transportIndex, `Inventory transport guard must load before ${script}.`);
}

console.log(`BUILD 440 RESOURCE ASSET URL REGRESSION: PASS (${checks}/${checks})`);
console.log('Literal # object-key characters: %23 / PRESERVED');
console.log('Inventory Admin API payload boundary: NORMALIZED BEFORE RENDER');
console.log('Inventory generated-HTML boundary: NORMALIZED BEFORE HTML PARSE');
console.log('Generated-HTML entities: PRESERVED / APOSTROPHE SAFE');
console.log('Direct Inventory src/href assignment: GUARDED');
console.log('Cached/shared Admin API payloads: COVERED');
console.log('Literal path spaces: PERCENT-ENCODED');
console.log('D1/R2 mutation: NONE');
console.log('PRODUCTION PROMOTION: CLOSED');

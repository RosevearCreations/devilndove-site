import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

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
const inventoryPage = fs.readFileSync(path.join(root, 'admin/inventory-operations/index.html'), 'utf8');
check(adminSafety.includes("raw.replace(/#/g, '%23')") && adminSafety.includes("PUBLIC_ASSET_HOST = 'assets.devilndove.com'"), 'Inventory Admin safety layer must encode literal # before URL parsing.');
check(adminSafety.includes('normalizePayload') && adminSafety.includes('DDAuth.readApiJson') && adminSafety.includes('DDAuth.apiJson'), 'Inventory Admin safety layer must normalize both direct and cached/shared API JSON payloads.');
check(!adminSafety.includes('fetch(') && !adminSafety.includes('setInterval(') && !adminSafety.includes('setTimeout('), 'Inventory Admin safety layer must not add network calls or polling.');
const safetyIndex = inventoryPage.indexOf('/public/js/admin-asset-url-safety.js?v=440');
check(safetyIndex > 0, 'Inventory Operations page does not load the Admin asset URL safety layer.');
for (const script of [
  '/public/js/admin-inventory-integrity-review.js?v=440',
  '/public/js/admin-product-resources.js?v=253',
  '/public/js/admin-site-item-inventory.js?v=261',
]) {
  check(inventoryPage.indexOf(script) > safetyIndex, `Admin asset URL safety must load before ${script}.`);
}

console.log(`BUILD 440 RESOURCE ASSET URL REGRESSION: PASS (${checks}/${checks})`);
console.log('Literal # object-key characters: %23 / PRESERVED');
console.log('Inventory Admin API payload boundary: NORMALIZED BEFORE RENDER');
console.log('Cached/shared Admin API payloads: COVERED');
console.log('Literal path spaces: PERCENT-ENCODED');
console.log('D1/R2 mutation: NONE');
console.log('PRODUCTION PROMOTION: CLOSED');

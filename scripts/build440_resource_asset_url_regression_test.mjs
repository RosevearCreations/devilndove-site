import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const moduleUrl = url.pathToFileURL(path.join(root, 'functions/api/admin/product-resource-search.js')).href + `?build440=${Date.now()}`;
const { browserSafeResourceImageUrl } = await import(moduleUrl);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const problematic = "https://assets.devilndove.com/Supplies/144Pcs 1# 2# 3# 4# 5# 6# 10, 20, 30, 40, 50, 60 Jeweler's Saw Blades Set with Storage Box (12pcs of Each Size), Gold,Silver.jpg";
const safe = browserSafeResourceImageUrl(problematic);

assert(safe.startsWith('https://assets.devilndove.com/Supplies/'), 'Asset origin or path changed unexpectedly.');
assert(!safe.includes(' '), 'Resource image URL still contains literal spaces.');
assert(!safe.includes('#'), 'Resource image URL still contains a literal fragment marker.');
assert((safe.match(/%23/g) || []).length === 6, 'All six literal # characters must remain encoded as R2 object-key characters.');
assert(safe.includes('144Pcs%201%23%202%23%203%23%204%23%205%23%206%23'), 'Problematic object-key prefix was not encoded deterministically.');
assert(safe.includes('Saw%20Blades%20Set'), 'Spaces in the object path were not normalized for browser transport.');

const alreadyEncoded = 'https://assets.devilndove.com/Supplies/Size%201%23%20blade.jpg';
const stable = browserSafeResourceImageUrl(alreadyEncoded);
assert(stable.includes('Size%201%23%20blade.jpg'), 'Already encoded object URL was double-encoded.');
assert(!stable.includes('%2523'), 'Existing %23 was incorrectly double-encoded.');

assert(browserSafeResourceImageUrl('') === '', 'Blank image URL should remain blank.');
assert(browserSafeResourceImageUrl('data:image/png;base64,AAAA') === 'data:image/png;base64,AAAA', 'Data URL should remain untouched.');

console.log('BUILD 440 RESOURCE ASSET URL REGRESSION: PASS (8/8)');
console.log('Literal # object-key characters: %23 / PRESERVED');
console.log('Literal path spaces: PERCENT-ENCODED');
console.log('R2 mutation: NONE');
console.log('PRODUCTION PROMOTION: CLOSED');

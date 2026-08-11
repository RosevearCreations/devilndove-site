from pathlib import Path
import sqlite3, tempfile
root=Path(__file__).resolve().parents[1]
checks=[]
def ok(name, cond):
    checks.append((name,bool(cond)))
edit=(root/'public/js/admin-edit-product.js').read_text()
resources=(root/'public/js/admin-product-resources.js').read_text()
api=(root/'functions/api/admin/product-resources.js').read_text()
html=(root/'admin/products/index.html').read_text()
# Product image reset must happen before resolution, never after it.
start=edit.index('async function fillForm')
block=edit[start:edit.index('async function loadProduct',start)]
reset=block.find('resetImageUrlFields();')
resolve=block.find('const resolvedFeaturedImageUrl')
ok('featured image reset occurs before resolution', reset >= 0 and resolve >= 0 and reset < resolve)
ok('no second reset after featured image resolution', block.find('resetImageUrlFields();', resolve) == -1)
ok('featured image field receives resolved image', 'setField("featured_image_url", resolvedFeaturedImageUrl);' in block)
ok('gallery fallback remains available', 'product.featured_image_url || uniqueLoadedImages[0]?.image_url' in block)
# Usage defaults/persistence.
ok('new resource links default to one use', 'quantity_used: defaultQuantityUsed(item)' in resources and 'return 1;' in resources)
ok('save synchronizes visible editor before POST', 'syncVisibleLinkEditorToState();' in resources)
ok('fractional usage minimum remains supported', 'Math.max(0.001' in resources)
ok('server reads links back after save', 'const persistedLinks = await loadProductLinks(db, productId);' in api)
ok('server returns persisted links', 'links: persistedLinks' in api)
ok('client accepts verified persisted links', 'Array.isArray(data.links)' in resources)
ok('cache version bumped for edit product', 'admin-edit-product.js?v=250' in html)
ok('cache version bumped for product resources', 'admin-product-resources.js?v=250' in html)
# Migration behavior and idempotence.
sql=(root/'database_build250_product_media_resource_usage_reliability.sql').read_text()
with tempfile.NamedTemporaryFile(suffix='.sqlite') as f:
    db=sqlite3.connect(f.name)
    db.executescript('CREATE TABLE product_resource_links(product_resource_link_id INTEGER PRIMARY KEY, quantity_used REAL, updated_at TEXT); INSERT INTO product_resource_links VALUES(1,0,NULL),(2,-1,NULL),(3,0.25,NULL),(4,100,NULL);')
    db.executescript(sql); db.executescript(sql)
    vals=[r[0] for r in db.execute('SELECT quantity_used FROM product_resource_links ORDER BY product_resource_link_id')]
    ok('migration normalizes missing/nonpositive use to one', vals[:2]==[1.0,1.0])
    ok('migration preserves fractional and explicit values', vals[2:]==[0.25,100.0])
failed=[n for n,v in checks if not v]
for n,v in checks: print(('PASS' if v else 'FAIL')+': '+n)
print(f'{sum(v for _,v in checks)}/{len(checks)} checks passed')
raise SystemExit(1 if failed else 0)

from pathlib import Path
root=Path(__file__).resolve().parents[1]
checks=[]
def ok(name, cond): checks.append((name,bool(cond)))
create=(root/'public/js/admin-create-product.js').read_text()
edit=(root/'public/js/admin-edit-product.js').read_text()
api=(root/'functions/api/admin/product-detail.js').read_text()
products=(root/'admin/products/index.html').read_text()
catalog=(root/'admin/catalog/index.html').read_text()
helper=create.find('function normalizeImageKey(url)')
render=create.find('function renderDraftImageManager()')
ok('image normalizer exists before image manager', helper >= 0 and render >= 0 and helper < render)
ok('image manager normalizes SEO image', 'const seoKey = normalizeImageKey(seoImageUrl);' in create)
ok('image cards normalize each URL', 'normalizeImageKey(row.url) === seoKey' in create)
ok('product page cache busts corrected bundle', 'admin-create-product.js?v=251' in products)
ok('catalog page cache busts corrected bundle', 'admin-create-product.js?v=251' in catalog)
ok('edit loader resolves featured or gallery fallback', 'product.featured_image_url || uniqueLoadedImages[0]?.image_url' in edit)
ok('edit loader dispatches image fields updated', "dd:product-image-fields-updated" in edit)
ok('detail api recovers linked image URLs', 'recoverable_image_urls' in api and 'recoverable_linked_image_count' in api)
ok('detail api returns editor images', 'return json({ok:true,product,images' in api)
failed=[n for n,v in checks if not v]
for n,v in checks: print(('PASS' if v else 'FAIL')+': '+n)
print(f'{sum(v for _,v in checks)}/{len(checks)} checks passed')
raise SystemExit(1 if failed else 0)

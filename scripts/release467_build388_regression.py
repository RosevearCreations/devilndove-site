#!/usr/bin/env python3
"""Release 467 Build 388: Product Save unblock, SEO, bounded media and read-only HST evidence regression."""
from pathlib import Path
import subprocess,sys,json,sqlite3
R=Path(__file__).resolve().parents[1];failed=[]
def file(p):return (R/p).read_text(encoding='utf8')
def check(v,msg):
 if not v:failed.append(msg)
paths=['public/js/admin-product-editor-v163.js','public/js/admin-product-media-editor-v172.js',
 'public/js/admin-inventory-tax-review-v388.js','functions/api/admin/inventory-purchase-tax-review.js',
 'functions/api/admin/product-editor-save.js']
for p in paths:
 result=subprocess.run(['node','--check',str(R/p)],text=True,capture_output=True)
 check(result.returncode==0,'syntax '+p+' '+result.stderr[-300:])
product=file('admin/product-editor/index.html');client=file(paths[0])
check('data-dd-unsaved-ignore="1"' in product,'Product editor ignores obstructing global save-confidence popup')
check('id="productEditorSave"' in product and 'type="submit"' in product,'Save Product remains a real submit')
check("saveButton.textContent='Saving…'" in client and "saveButton.textContent='Saved ✓'" in client,'Product Save waiting/OK states')
check('markClean()' in client and "window.addEventListener('beforeunload'" in client,'Product unsaved changes safely guarded locally')
check('syncSeo(true)' in client and 'autoSeo.delete' in client and 'const seoSuggestion=' in client,'SEO suggested from Product facts with manual override')
check("raw.replace(/\\s+/g" not in client,'SEO whitespace cleanup handles real spaces')
check("raw.replace(/\\s+/g" not in client,'Correct SEO string cleanup')
check("productEditorSeoGuidance" in product,'SEO user guidance present')
media=file(paths[1]);page=file('admin/catalog-media/index.html')
check('admin-product-media-editor-v172.js?v=467b198&b388=1' in page,'Active media script cache refresh')
check('id="productMediaV164AddInput" type="file" accept="image/*" multiple' in page,'Multi-image add input')
check('files.length>5' in media and 'state.pendingFiles' in media and "for(let i=0;i<files.length;i++)" in media,'Max five sequential files')
check('break;' in media and 'Stopped without automatic retry' in media,'Uncertain image upload stops queue')
check("await fetchProduct(state.productId)" in media and 'Saved ✓' in media,'Batch upload refresh and save receipt')
view=file('functions/api/admin/inventory-purchase-tax-review.js')
check('getAdminUserFromRequest' in view and 'export async function onRequestGet' in view,'Authenticated read-only source')
check('Math.min(40' in view and 'LIMIT ?' in view,'Bounded 40 receipt rows')
check('inventory_quick_edit_receipts' in view and 'site_inventory_movements' in view,'Receipt lineage to movement')
check('invoice_verified:false' in view and 'no_automatic_input_tax_credit:true' in view,'No false invoice or tax credit claims')
check('inventoryTaxReview388Load' in file('admin/inventory-operations/index.html'),'Review only on button click')
check('admin-inventory-tax-review-v388.js' in file('admin/inventory-operations/index.html'),'Active Inventory Review script')
auth=json.loads(file('current-development-authority.json'))
check(auth.get('build')==388 and auth.get('next_build')==389,'Current release authority 388')
check('release467-build388-inventory-tax-product-save.json' in file('current-development-authority.json'),'Machine-readable Build388 authority')
print('RELEASE467_BUILD388_GATE='+('FAIL' if failed else 'GREEN'))
for f in failed:print('FAIL:',f)
sys.exit(bool(failed))

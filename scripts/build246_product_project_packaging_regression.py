#!/usr/bin/env python3
from pathlib import Path
import sqlite3, sys, re
ROOT=Path(__file__).resolve().parents[1]
fail=[]
def check(ok,msg):
    if not ok: fail.append(msg)
def txt(rel): return (ROOT/rel).read_text(encoding='utf-8')

mig=txt('database_build246_product_project_production_packaging.sql')
upg=txt('database_upgrade_current_pass.sql')
check(mig==upg,'current-pass migration must be byte-identical to Build 246 migration')
check('CREATE TEMP' not in mig.upper(),'Build 246 migration must not use TEMP tables')
check('DROP TABLE' not in mig.upper(),'Build 246 migration must not DROP tables')
for needle in ['creative_project_deletion_audit','product_resource_ingredient_profiles','product_production_runs','product_production_run_materials','packaging_translation_reviews','build246_product_project_production_packaging']:
    check(needle in mig,f'migration missing {needle}')

edit=txt('public/js/admin-edit-product.js')
check('editingProductId = productId' in edit,'query-focused product editor does not persist editingProductId')
check('form.dataset.productId || window.DDCurrentProductEditorId' in edit,'Update Product lacks defensive product-id recovery')
update=txt('functions/api/admin/update-product.js')
check('existingSeo?.og_image_url' in update,'product update does not preserve existing SEO/social image')
create=txt('public/js/admin-create-product.js')
for needle in ['setSeoFromSlot','Use for SEO/social','dd-product-image-seo-badge','is-seo-image']:
    check(needle in create,f'product image manager missing {needle}')

prod_delete=txt('functions/api/admin/delete-product.js')
for needle in ['discoverManagedProductProjectShells','AUTO_CLEAN_GENERATED_SHELL','generated_project_shells','product_production_runs.product_id']:
    check(needle in prod_delete,f'product deletion generated-shell/history policy missing {needle}')
creative=txt('functions/api/admin/creative-automation.js')
for needle in ['projectInventoryReturnPlan','returnUnreversedProjectInventory','creative_project_inventory_reversals','creative_project_deletion_audit','DELETE AND RETURN','unreversed project consumption returned to raw inventory']:
    check(needle in creative,f'Creative Project deletion/inventory return missing {needle}')

production=txt('functions/api/admin/product-production-release.js')
for needle in ['idempotency_key','product_production_runs','ingredient_snapshot_json','stock_quantity_consumed','Inventory changed while the production release was posting']:
    check(needle in production,f'finished-production release missing {needle}')
prod_ui=txt('public/js/admin-product-resources.js')
for needle in ['Finished Product Production Release','previewProductionRelease','postProductionRelease','is_label_ingredient','inci_name']:
    check(needle in prod_ui,f'product-resource/production UI missing {needle}')

caip=txt('functions/api/_lib/caipMediaIntake.js')
for needle in ['skipped_duplicate','duplicate_scope','same_project','duplicates_skipped']:
    check(needle in caip,f'CAIP same-project duplicate protection missing {needle}')

pack_api=txt('functions/api/admin/packaging-studio.js')
for needle in ['soap_reference_v2','record_translation_draft','packaging_translation_reviews','INCI name for each required ingredient row','product_resource_ingredient_profiles']:
    check(needle in pack_api,f'Packaging API missing {needle}')
pack_ui=txt('public/js/admin-packaging-studio.js')
for needle in ['Generate French draft','curatedFrenchDraft','DRAFT NOT FOR PRINT','soap_reference_v2','INCI ingredient names remain the ingredient-list authority']:
    check(needle in pack_ui,f'Packaging UI missing {needle}')
check('Aloe Soap Base – SLS/SLES free' not in pack_ui,'rough placeholder ingredient claims remain in soap renderer')
check("{ claim_en: 'Natural Ingredients'" not in pack_ui,'soap renderer still invents default marketing claims')
check("data.packagingNetQuantity || 'NET WT. APPROX. 4.5 OZ / 127 G'" not in pack_ui,'soap renderer still invents an unverified net quantity')
check('VERIFIED NET QUANTITY REQUIRED — DRAFT NOT FOR PRINT' in pack_ui,'soap renderer lacks explicit missing-net-quantity draft warning')

# SQL aggregate integrity and repeat-application behavior.
con=sqlite3.connect(':memory:')
try:
    con.executescript(txt('database_full_schema.sql'))
    for name in ['creative_project_deletion_audit','product_resource_ingredient_profiles','product_production_runs','product_production_run_materials','packaging_translation_reviews']:
        check(con.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?",(name,)).fetchone()[0]==1,f'aggregate schema missing {name}')
    con.executescript(mig)
    con.executescript(mig)
    check(con.execute("SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key='build246_product_project_production_packaging'").fetchone()[0]==1,'Build246 ledger should contain one migration key')
except Exception as e:
    fail.append(f'SQLite Build246 execution failed: {e}')

# Controlled database object identifiers remain lower-case.
for rel in ['database_schema.sql','database_full_schema.sql','database_store_schema.sql','database_build246_product_project_production_packaging.sql']:
    content=txt(rel)
    for m in re.finditer(r'(?im)^\s*CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX|VIEW|TRIGGER)\s+(?:IF\s+NOT\s+EXISTS\s+)?["`\[]?([A-Za-z0-9_]+)',content):
        name=m.group(1); check(name==name.lower(),f'{rel} has mixed-case database object {name}')

if fail:
    print('Build 246 product/project/packaging regression: FAIL')
    for x in fail: print(' -',x)
    sys.exit(1)
print('Build 246 product/project/packaging regression: PASS')
print('Product edit identity + SEO image persistence: present')
print('Generated shell cleanup + Creative Project inventory return: present')
print('Finished-production material/ingredient snapshot: present')
print('CAIP same-project duplicate skip: present')
print('Approved soap renderer + curated French draft: present')
print('TEMP/DROP migration operations: 0')

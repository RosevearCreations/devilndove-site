#!/usr/bin/env python3
from pathlib import Path
import sqlite3, sys, re
ROOT=Path(__file__).resolve().parents[1]
fail=[]
def check(ok,msg):
    if not ok: fail.append(msg)

def txt(rel): return (ROOT/rel).read_text(encoding='utf-8')

mig=txt('database_build245_admin_media_resilience.sql'); upg=txt('database_upgrade_current_pass.sql')
check(mig==upg,'current-pass migration must be byte-identical to Build 245 migration')
check('CREATE TEMP' not in mig.upper(),'Build 245 migration must not use TEMP tables')
check('DROP TABLE' not in mig.upper(),'Build 245 migration must not DROP tables')
for needle in ['build244_inventory_authority_fractional_usage','build245_admin_media_resilience','product_media_integrity_snapshots','linked_media_recovery_v245','lightweight_reference_bootstrap_v245']:
    check(needle in mig,f'migration missing {needle}')

auth=txt('public/js/site-auth-ui.js')
for needle in ['queueMicrotask','dd:auth-rejected','dd:auth-degraded','force: true','DDAuthUiState']:
    check(needle in auth,f'auth UI missing {needle}')
protect=txt('public/js/admin-self-protect.js')
for needle in ['DDWhenAdminReady','DDAdminAccessState','dd:auth-rejected','Admin session retained']:
    check(needle in protect,f'admin protector missing {needle}')
check('1200' not in protect,'admin protector should not use the old 1.2-second false-denial timer')

for rel in ['public/js/admin-today-tasks.js','public/js/admin-dashboard-summary.js','public/js/admin-dashboard-smoke-badges.js','public/js/admin-dashboard-preflight-badge.js']:
    t=txt(rel); check('DDWhenAdminReady' in t or 'dd:admin-access-granted' in t,f'{rel} must wait for admin access')
    check('apiJson' in t,f'{rel} must use shared safe JSON handling')

boot=txt('functions/api/admin/inventory-bootstrap.js')
check(not re.search(r'\b(?:CREATE|ALTER|DROP)\s+TABLE\b|PRAGMA',boot,re.I),'inventory bootstrap must not run schema DDL/PRAGMA')
inv=txt('functions/api/admin/site-item-inventory.js')
check('pageSize = 80' in inv and 'pagination:' in inv,'inventory endpoint pagination missing')
check(not re.search(r'\b(?:CREATE|ALTER|DROP)\s+TABLE\b|PRAGMA',inv,re.I),'inventory hot path must not run schema DDL/PRAGMA')
client=txt('public/js/admin-site-item-inventory.js')
for needle in ['/api/admin/inventory-bootstrap','siteInventoryPreviousPage','stock_unit_label','usage_units_per_stock_unit','usage_tracking_mode']:
    check(needle in client,f'inventory UI missing {needle}')

pd=txt('functions/api/admin/product-detail.js')
for needle in ['product_media_role_assignments','product_image_annotations','media_integrity','slice(0,7)','recoverable_linked_image_count']:
    check(needle.replace('slice(0,7)','slice(0,7)') in pd.replace(' ','' ) if needle=='slice(0,7)' else needle in pd,f'product detail recovery missing {needle}')
edit=txt('public/js/admin-edit-product.js')
check('mediaIntegrity' in edit and 'recovered from media/history' in edit,'product editor recovery hint missing')
ready=txt('public/js/admin-product-readiness.js')
check('basic_catalog_blockers' in ready and 'productReadinessRetryInline' in ready,'readiness exact drilldown/fallback missing')
check("/admin/readiness/?filter=basic_catalog_blockers" in txt('functions/api/admin/today-tasks.js'),'Today readiness link must drill into exact blocker filter')
for rel in ['functions/api/admin/product-readiness.js','functions/api/admin/product-images.js']:
    t=txt(rel)
    # helper definitions may remain in product-images, but live request functions must no longer call them.
    if rel.endswith('product-readiness.js'):
        code='\n'.join(line for line in t.splitlines() if not line.lstrip().startswith('//')); check(not re.search(r'CREATE TABLE|ALTER TABLE|PRAGMA',code,re.I),f'{rel} still has request-time schema work')
    else:
        live=t[t.find('export async function onRequestGet'):]
        check('ensureAnnotationColumns(db)' not in live and 'ensureMediaScoreHistoryTable(db)' not in live,f'{rel} live handlers still call schema repair')

# Aggregate + repeated-current migration integrity and product-media recovery behavior.
con=sqlite3.connect(':memory:')
try:
    con.executescript(txt('database_full_schema.sql'))
    # Add a product with linked supporting media but no product_images; current migration should recover them.
    cur=con.execute("INSERT INTO products(slug,name,product_type,status,price_cents,short_description) VALUES('build245-media-test','Build 245 media test','physical','draft',1000,'A sufficiently descriptive Build 245 media test product for regression checks.')")
    pid=cur.lastrowid
    con.execute("INSERT INTO media_assets(product_id,object_key,public_url,sort_order) VALUES(?,?,?,?)",(pid,'tests/245-a.jpg','https://assets.example/245-a.jpg',0))
    con.execute("INSERT INTO product_media_role_assignments(product_id,role_key,image_url,assignment_status) VALUES(?,?,?,'assigned')",(pid,'detail_texture','https://assets.example/245-b.jpg'))
    con.execute("INSERT INTO product_image_annotations(product_id,image_url,alt_text,image_role) VALUES(?,?,?,?)",(pid,'https://assets.example/245-c.jpg','Third media image','scale_context'))
    con.commit()
    con.executescript(mig)
    recovered=con.execute('SELECT image_url FROM product_images WHERE product_id=? ORDER BY sort_order,product_image_id',(pid,)).fetchall()
    check(len(recovered)==3,f'expected 3 recovered linked images, found {len(recovered)}')
    check(con.execute('SELECT featured_image_url FROM products WHERE product_id=?',(pid,)).fetchone()[0]=='https://assets.example/245-a.jpg','blank featured image was not recovered from canonical gallery')
    con.executescript(mig)
    check(con.execute('SELECT COUNT(*) FROM product_images WHERE product_id=?',(pid,)).fetchone()[0]==3,'repeat migration duplicated recovered product images')
    check(con.execute("SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key='build245_admin_media_resilience'").fetchone()[0]==1,'Build245 ledger should have one key')
except Exception as e:
    fail.append(f'SQLite Build245 execution failed: {e}')

if fail:
    print('Build 245 admin/media resilience regression: FAIL')
    for x in fail: print(' -',x)
    sys.exit(1)
print('Build 245 admin/media resilience regression: PASS')
print('Auth degraded-state retention: present')
print('Admin startup staggering: present')
print('Inventory bootstrap/pagination: present')
print('Product linked-media recovery: present and idempotent')
print('TEMP/DROP migration operations: 0')

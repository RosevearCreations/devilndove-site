from pathlib import Path
import json
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
checks = []
release_doc = json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'))
release = int(release_doc.get('release') or 0)
FEATURE_BUILD = 253

def check(label, condition):
    ok = bool(condition)
    checks.append(ok)
    print(('PASS' if ok else 'FAIL') + ': ' + label)

def has_accepted_asset(html, asset_name):
    """Accept a cache major that contains this feature and is not from the future."""
    match = re.search(rf"{re.escape(asset_name)}\?v=(\d+)(?:\.\d+)?(?![\d.])", html)
    if not match:
        return False
    major = int(match.group(1))
    return FEATURE_BUILD <= major <= release

resources_js = (ROOT/'public/js/admin-product-resources.js').read_text()
inventory_js = (ROOT/'public/js/admin-site-item-inventory.js').read_text()
data_js = (ROOT/'functions/api/admin/_productResourcesData.js').read_text()
inv_html = (ROOT/'admin/inventory-operations/index.html').read_text()
products_html = (ROOT/'admin/products/index.html').read_text()
mobile_html = (ROOT/'admin/mobile-inventory/index.html').read_text()
css = (ROOT/'css/styles.css').read_text()

check('canonical Development release is available', release >= FEATURE_BUILD)
check('saved product-resource links resolve a server-side resource name', 'AS resource_name' in data_js and 'sii.item_name' in data_js and 'ci.name' in data_js)
check('linked inventory lookup is bounded to one authoritative row', 'sii.site_item_inventory_id = (' in data_js and 'LIMIT 1' in data_js)
check('linked resource response exposes resolved name', 'name: row.resource_name || row.source_key ||' in data_js)
check('linked resource response carries usage metadata', 'usage_units_per_stock_unit' in data_js and 'resource: linkedResource' in data_js)
check('browser preserves server-linked resource outside current search', '|| x.resource || {}' in resources_js)
check('browser preserves server-provided linked name before external key fallback', 'resource.name || x.name || x.source_key' in resources_js)
check('linked-item dropdown displays name before source key fallback', 'link.name || link.source_key' in resources_js)
check('Inventory Operations loads an accepted Product-resource bundle', has_accepted_asset(inv_html, 'admin-product-resources.js'))
check('Products loads an accepted Product-resource bundle', has_accepted_asset(products_html, 'admin-product-resources.js'))
check('Inventory Operations loads an accepted Inventory bundle', has_accepted_asset(inv_html, 'admin-site-item-inventory.js'))
check('Mobile Inventory loads an accepted Inventory bundle', has_accepted_asset(mobile_html, 'admin-site-item-inventory.js'))
check('inventory form exposes Start New Item', 'id="siteInventoryResetButton">Start New Item</button>' in inventory_js)
check('inventory form exposes separate Clear / Reset Fields action', 'id="siteInventoryClearFieldsButton">Clear / Reset Fields</button>' in inventory_js)
check('clear action has its own handler', "siteInventoryClearFieldsButton')?.addEventListener('click', clearInventoryWorkspaceFields)" in inventory_js)
check('full clear also removes helper search/import fields', "setInputValue('siteInventorySeedSearch', '')" in inventory_js and "setInputValue('siteInventoryAmazonImportUrl', '')" in inventory_js)
check('form actions remain mobile-safe with stacked buttons', '.site-inventory-form-actions .btn' in css and 'width:100%' in css)

# Execute the exact SELECT used by loadProductLinks against the aggregate schema.
con = sqlite3.connect(':memory:')
con.executescript((ROOT/'database_full_schema.sql').read_text())
con.execute("INSERT INTO products(slug,name,product_type,status) VALUES ('fixture-product','Fixture Product','physical','draft')")
pid = con.execute('SELECT product_id FROM products WHERE slug=?', ('fixture-product',)).fetchone()[0]
con.execute("INSERT INTO site_item_inventory(source_type,external_key,item_name,category,on_hand_quantity,unit_cost_cents,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,is_active) VALUES ('tool','tool-100','Precision Tool','tools',1,5000,'each','use',100,1)")
iid = con.execute("SELECT site_item_inventory_id FROM site_item_inventory WHERE external_key='tool-100'").fetchone()[0]
con.execute("INSERT INTO site_inventory_usage_profiles(site_item_inventory_id,usage_tracking_mode,minimum_usage_increment) VALUES (?, 'reusable', 1)", (iid,))
con.execute("INSERT INTO catalog_items(item_kind,source_key,name,category,status) VALUES ('supply','wax-key','Soy Candle Wax','wax','active')")
con.execute("INSERT INTO product_resource_links(product_id,resource_kind,source_key,quantity_used,sort_order) VALUES (?,?,?,?,?)", (pid,'tool','tool-100',1,0))
con.execute("INSERT INTO product_resource_links(product_id,resource_kind,source_key,quantity_used,sort_order) VALUES (?,?,?,?,?)", (pid,'supply','wax-key',0.5,1))
con.commit()

m = re.search(r"export async function loadProductLinks\(db, productId\) \{.*?const result = await db\.prepare\(`(.*?)`\)\.bind\(Number\(productId\)\)\.all\(\);", data_js, re.S)
query_ok = False
if m:
    query = m.group(1)
    rows = con.execute(query, (pid,)).fetchall()
    cols = [d[0] for d in con.execute(query, (pid,)).description]
    shaped = [dict(zip(cols, row)) for row in rows]
    query_ok = (
        len(shaped) == 2
        and shaped[0]['resource_name'] == 'Precision Tool'
        and float(shaped[0]['resource_usage_units_per_stock_unit']) == 100
        and shaped[1]['resource_name'] == 'Soy Candle Wax'
    )
check('exact loadProductLinks SQL returns human names and tool usage metadata', query_ok)
check('aggregate schema foreign keys remain clean', con.execute('PRAGMA foreign_key_check').fetchall() == [])

passed = sum(checks)
print(f"\nBuild {release} retained linked-item/reset compatibility regression: {passed}/{len(checks)} passed")
print(f"Feature provenance floor: Build {FEATURE_BUILD}; active release ceiling: Build {release}")
print(f"Runtime release authority: development-release.json / Build {release}")
raise SystemExit(0 if passed == len(checks) else 1)

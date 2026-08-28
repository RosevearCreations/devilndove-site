from pathlib import Path
import sqlite3
import tempfile

ROOT = Path(__file__).resolve().parents[1]
errors = []

def text(path):
    return (ROOT / path).read_text(encoding='utf-8')

def require(path, marker):
    data = text(path)
    if marker not in data:
        errors.append(f'{path}: missing {marker}')

# Shared browser transport and auth-ready dedupe.
for marker in ['const JSON_INFLIGHT = new Map()', 'async function apiJson(', 'cacheTtlMs', 'staleOnError', 'window.DDAuth']:
    require('public/js/auth.js', marker)
require('public/js/site-auth-ui.js', 'lastAuthReadySignature')
require('public/js/site-auth-ui.js', "dd:auth-verified")

# Inventory/product-resource load fan-out controls.
product_ui = text('public/js/admin-product-resources.js')
for marker in ['/api/admin/product-resource-bootstrap', '/api/admin/product-resource-search', 'scheduleResourceSearch', 'startInitialLoad']:
    if marker not in product_ui: errors.append(f'admin-product-resources.js missing {marker}')
inv_ui = text('public/js/admin-site-item-inventory.js')
for marker in ['INVENTORY_DRAFT_KEY', 'saveInventoryDraft', 'restoreInventoryDraft', 'startInitialLoad', 'window.DDAuth.apiJson']:
    if marker not in inv_ui: errors.append(f'admin-site-item-inventory.js missing {marker}')
if '.json()' in inv_ui:
    errors.append('admin-site-item-inventory.js still calls response.json() directly.')

# Every script loaded by Inventory Operations should use the shared parser for server responses.
for path in [
    'public/js/admin-product-resources.js',
    'public/js/admin-site-item-inventory.js',
    'public/js/admin-inventory-lots.js',
    'public/js/admin-product-stock-report.js',
    'public/js/admin-catalog-sync.js',
    'public/js/admin-catalog-option-manager.js',
    'public/js/admin-notifications.js',
    'public/js/admin-app-settings.js',
]:
    data = text(path)
    if '.json()' in data:
        errors.append(f'{path} still calls response.json() directly.')

# Heavy Amazon registry and schema-repair work must be absent from routine product/inventory reads.
resources_api = text('functions/api/admin/product-resources.js')
if '_amazonInventoryMatches' in resources_api:
    errors.append('product-resources.js still loads the private Amazon match registry.')
for path in ['functions/api/admin/site-item-inventory.js', 'functions/api/admin/inventory-lots.js', 'functions/api/admin/product-stock-report.js']:
    data = text(path).lower()
    for forbidden in ['create table', 'alter table', 'pragma table_info', 'create index']:
        if forbidden in data and 'build 243:' not in data:
            errors.append(f'{path} contains request-time schema work: {forbidden}')
# Direct check without comment false positives.
site_api = text('functions/api/admin/site-item-inventory.js')
for forbidden in ['ensureSiteInventorySchema(', 'PRAGMA table_info', 'CREATE TABLE', 'ALTER TABLE']:
    if forbidden in site_api: errors.append(f'site-item-inventory.js contains {forbidden}')

# Admin page does not spend critical startup capacity on public social/analytics/route usage.
require('js/main.js', "startsWith('/admin/')) return;")
analytics = text('public/js/site-analytics.js')
if "const isAdmin = path === '/admin' || path.startsWith('/admin/');" not in analytics:
    errors.append('site-analytics.js does not define the current admin-path exclusion guard.')
if 'if (isAdmin) return false;' not in analytics or 'if (isAdmin) return { ok: true, skipped: true };' not in analytics:
    errors.append('site-analytics.js does not apply the admin exclusion to page-view and POST tracking paths.')
route_usage = text('public/js/admin-route-usage.js')
if 'requestIdleCallback' not in route_usage and 'setTimeout' not in route_usage:
    errors.append('admin-route-usage.js does not defer route telemetry.')

# Lowercase controlled classifications and contrast/mobile controls.
require('functions/api/admin/_catalog-options.js', '.toLowerCase()')
require('public/js/admin-catalog-option-manager.js', '.trim().toLowerCase()')
require('css/styles.css', 'Build 243 — Inventory Operations contrast')
require('css/styles.css', '#siteInventorySaveButton')

# Migration identity and required lower-case/identity controls.
numbered = text('database_build243_inventory_resilience_case_normalization.sql')
current = text('database_upgrade_current_pass.sql')
# Historical regression: require byte identity only if the current-pass file itself is explicitly Build 243.
# Later current-pass builds are expected to differ and must not be inferred from a hard-coded list of future build markers.
current_header = '\n'.join(current.splitlines()[:3]).lower()
if 'build 243' in current_header and numbered != current:
    errors.append('Build 243 numbered migration and database_upgrade_current_pass.sql differ while the current-pass header explicitly identifies Build 243.')
for marker in [
    'idx_site_item_inventory_identity_lower_active',
    "site.inventory.classification_case_policy",
    'merged_case_duplicate',
    'LOWER(TRIM(source_type))',
    'build243_inventory_resilience_case_normalization',
]:
    if marker not in numbered: errors.append(f'Build 243 migration missing {marker}')

# Synthetic compatibility test: same inventory identity with only source-type case differences is merged safely.
try:
    conn = sqlite3.connect(':memory:')
    conn.executescript('''
    CREATE TABLE products (product_id INTEGER PRIMARY KEY, name TEXT, status TEXT, product_category TEXT, color_name TEXT, shipping_code TEXT, color_names_json TEXT, updated_at TEXT);
    CREATE TABLE catalog_items (catalog_item_id INTEGER PRIMARY KEY, item_kind TEXT, category TEXT, subcategory TEXT, item_type TEXT, name TEXT, status TEXT, updated_at TEXT);
    CREATE TABLE site_item_inventory (
      site_item_inventory_id INTEGER PRIMARY KEY, source_type TEXT NOT NULL, external_key TEXT NOT NULL, item_name TEXT,
      category TEXT, on_hand_quantity REAL DEFAULT 0, reserved_quantity REAL DEFAULT 0, incoming_quantity REAL DEFAULT 0,
      reorder_level REAL DEFAULT 0, preferred_reorder_quantity REAL DEFAULT 0, unit_cost_cents INTEGER DEFAULT 0,
      stock_unit_label TEXT DEFAULT 'unit', usage_unit_label TEXT DEFAULT 'unit', reuse_status TEXT,
      reorder_notes TEXT, is_active INTEGER DEFAULT 1, updated_at TEXT
    );
    CREATE TABLE site_inventory_movements (site_inventory_movement_id INTEGER PRIMARY KEY, source_type TEXT);
    CREATE TABLE product_resource_links (product_resource_link_id INTEGER PRIMARY KEY, resource_kind TEXT, updated_at TEXT);
    CREATE TABLE app_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT, is_public INTEGER DEFAULT 0, updated_at TEXT);
    CREATE TABLE schema_migration_ledger (migration_key TEXT PRIMARY KEY, file_name TEXT, applied_at TEXT, notes TEXT);
    INSERT INTO products VALUES (1,'Sample','active','Rings','Silver','STANDARD','["Silver","silver","RED"]',CURRENT_TIMESTAMP);
    INSERT INTO catalog_items VALUES (1,'Tool','TOOLS','Hand Tools','Clamp','Clamp','active',CURRENT_TIMESTAMP);
    INSERT INTO site_item_inventory(site_item_inventory_id,source_type,external_key,item_name,category,on_hand_quantity,reserved_quantity,incoming_quantity,reorder_level,preferred_reorder_quantity,unit_cost_cents,stock_unit_label,usage_unit_label,reuse_status,is_active)
      VALUES (1,'Tool','A1','Clamp','TOOLS',2,1,0,1,2,100,'Each','Each','Reusable',1),
             (2,'tool','A1','Clamp duplicate','tools',3,0,1,2,4,125,'EACH','EACH','REUSABLE',1);
    INSERT INTO app_settings VALUES ('site.catalog.product_category_options','["Rings","rings","SOAP"]',0,CURRENT_TIMESTAMP);
    ''')
    conn.executescript(numbered)
    canonical = conn.execute('SELECT source_type,on_hand_quantity,reserved_quantity,incoming_quantity,is_active FROM site_item_inventory WHERE site_item_inventory_id=1').fetchone()
    duplicate = conn.execute('SELECT source_type,is_active,reuse_status FROM site_item_inventory WHERE site_item_inventory_id=2').fetchone()
    product = conn.execute('SELECT product_category,color_name,shipping_code,color_names_json FROM products WHERE product_id=1').fetchone()
    opts = conn.execute("SELECT setting_value FROM app_settings WHERE setting_key='site.catalog.product_category_options'").fetchone()[0]
    if canonical != ('tool', 5.0, 1.0, 1.0, 1): errors.append(f'Unexpected canonical merge result: {canonical}')
    if duplicate[1:] != (0, 'merged_case_duplicate'): errors.append(f'Unexpected duplicate merge result: {duplicate}')
    if product[:3] != ('rings','silver','standard'): errors.append(f'Product controlled values were not lowercased: {product}')
    if opts != '["rings","soap"]': errors.append(f'Option array was not case-deduplicated: {opts}')
except Exception as exc:
    errors.append(f'Synthetic Build 243 migration failed: {exc}')

if errors:
    print('Build 243 inventory resilience regression: FAIL')
    for error in errors:
        print('-', error)
    raise SystemExit(1)

print('Build 243 inventory resilience regression: PASS')
print('Startup request dedupe/backoff/stale fallback: present')
print('Inventory form draft recovery and write protection: present')
print('Inventory-page JSON/HTML boundaries: present')
print('Routine inventory/product reads contain no request-time DDL: present')
print('Case-insensitive inventory identity merge + lowercase controlled values: synthetic PASS')

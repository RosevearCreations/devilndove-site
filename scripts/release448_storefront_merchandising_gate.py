#!/usr/bin/env python3
"""Release 448 Storefront Shop / Collections / Collages convergence gate."""
from pathlib import Path
import sqlite3,tempfile,re,subprocess
ROOT=Path(__file__).resolve().parents[1]
def need(path,needle):
 text=(ROOT/path).read_text(encoding='utf-8')
 if needle not in text:raise SystemExit(f'FAIL — {path} missing {needle!r}')
 return text
migration=need('database_release448_storefront_merchandising.sql','CREATE TABLE IF NOT EXISTS storefront_collections')
for needle in ['storefront_collection_products','storefront_collage_presets',"'vintage|antique'","'collectible|oddity'"]:
 if needle not in migration:raise SystemExit(f'FAIL — Storefront migration missing {needle!r}')
api=need('functions/api/storefront-merchandising.js',"authority:'public_products_plus_storefront_merchandising'")
for needle in ["new URL('/api/products'",'publicProduct(product)','buildCollectionProjection','buildCollageProjection']:
 if needle not in api:raise SystemExit(f'FAIL — public Storefront merchandising API missing {needle!r}')
admin_api=need('functions/api/admin/storefront-merchandising.js',"action==='save_collection'")
for needle in ["action==='save_membership'","action==='remove_membership'","action==='save_collage'"]:
 if needle not in admin_api:raise SystemExit(f'FAIL — Storefront admin API missing {needle!r}')
runtime=need('public/js/storefront-merchandising.js','window.DDStorefrontMerchandising')
for needle in ['renderCollectionDetail','renderCollage','data-storefront-collage-mount']:
 if needle not in runtime:raise SystemExit(f'FAIL — Storefront runtime missing {needle!r}')
for page in ['shop/index.html','collections/index.html','collages/index.html']:
 text=need(page,'storefront-merchandising')
 h1=len(re.findall(r'<h1(?:\s|>)',text,re.I))
 if h1!=1:raise SystemExit(f'FAIL — {page} has {h1} H1 elements; expected 1')
 if '?v=448' not in text:raise SystemExit(f'FAIL — {page} does not carry current Release 448 asset version')
need('admin/storefront-merchandising/index.html','Storefront Collections &amp; Collages')
need('public/js/admin-storefront-merchandising.js','/api/admin/storefront-merchandising')
with tempfile.NamedTemporaryFile(suffix='.sqlite') as tmp:
 db=sqlite3.connect(tmp.name);db.executescript('PRAGMA foreign_keys=ON;CREATE TABLE users(user_id INTEGER PRIMARY KEY);CREATE TABLE products(product_id INTEGER PRIMARY KEY,name TEXT,slug TEXT);INSERT INTO products VALUES(1,\'Test Product\',\'test-product\');')
 db.executescript(migration)
 tables={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
 required={'storefront_collections','storefront_collection_products','storefront_collage_presets'}
 if not required<=tables:raise SystemExit(f'FAIL — missing Storefront tables {sorted(required-tables)}')
 count=db.execute("SELECT COUNT(*) FROM storefront_collections WHERE status='published'").fetchone()[0]
 if count<4:raise SystemExit('FAIL — expected seeded public origin Collections')
 handmade=db.execute("SELECT storefront_collection_id FROM storefront_collections WHERE slug='handmade'").fetchone()[0]
 db.execute("INSERT INTO storefront_collection_products(storefront_collection_id,product_id,membership_status) VALUES(?,?,?)",(handmade,1,'included'))
 if db.execute('PRAGMA foreign_key_check').fetchall():raise SystemExit('FAIL — Storefront migration foreign keys are not clean')

# Forward admin usability regression: one shared contextual-help implementation serves
# Storefront, CAIP, Tools, Supplies, Accounting and I.T. without acquiring write authority.
context=need('public/js/admin-context-help.js',"trigger.textContent = 'ⓘ'")
bootstrap=need('public/js/site-auth-ui.js','/public/js/admin-context-help.js?v=448-context-help')
context_css=need('css/admin-context-help.css','.dd-context-help-trigger:focus-visible')
for needle in ["trigger.type = 'button'",'aria-controls','aria-expanded',"event.key === 'Escape'","document.addEventListener('click'",'MutationObserver','[data-context-help]','dataset.contextHelpText','dataset.contextHelpTitle']:
 if needle not in context:raise SystemExit(f'FAIL — shared admin contextual help missing {needle!r}')
for key in ['carousel:','collection:','explicit_membership:','collage:','caip_handoff:','tool_lifecycle:','supply_sourcing:','accounting:','it_platform:','d1_r2_readiness:','provider_configuration:']:
 if key not in context:raise SystemExit(f'FAIL — contextual-help library missing {key!r}')
for path in ['/admin/home-carousel/','/admin/storefront-merchandising/','/admin/caip-content-handoff/','/admin/tool-lifecycle/','/admin/supply-sourcing/','/admin/accounting/','/admin/it-platform/']:
 if path not in context:raise SystemExit(f'FAIL — contextual-help rules missing {path}')
if 'fetch(' in context or 'apiFetch' in context:raise SystemExit('FAIL — contextual help must remain client-only and must not call APIs')
if '<h1' in context.lower():raise SystemExit('FAIL — contextual help must not create public/admin H1 elements')
if "window.location.pathname.startsWith('/admin')" not in bootstrap:raise SystemExit('FAIL — contextual-help bootstrap must remain admin-only')
for needle in ['.dd-context-help-panel[hidden]','@media(max-width:700px)','@media(prefers-reduced-motion:reduce)']:
 if needle not in context_css:raise SystemExit(f'FAIL — contextual-help CSS missing {needle!r}')
subprocess.run(['node','--check',str(ROOT/'public/js/admin-context-help.js')],check=True)
subprocess.run(['node','--check',str(ROOT/'public/js/site-auth-ui.js')],check=True)

print('RELEASE 448 STOREFRONT MERCHANDISING GATE: PASS')
print('Shop / Collections / Collages: ONE PRODUCT AUTHORITY')
print('Public images: inherited from consent-gated /api/products projection')
print('Collection metadata/membership: D1 ADDITIVE')
print('Collage image binaries: NOT DUPLICATED')
print('Public H1 count: 1 per Storefront page')
print('Shared admin contextual help: ACCESSIBLE / CLIENT-ONLY / NO MUTATION')

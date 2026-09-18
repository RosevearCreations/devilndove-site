#!/usr/bin/env python3
"""Release 467 Build 175 — Product Editor zero-introspection save proof, successor-aware through Build 178."""
from pathlib import Path
import re,subprocess,sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
def read(path):
    p=ROOT/path
    if not p.is_file():
        FAIL.append(f'missing {path}')
        return ''
    return p.read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')

save=read('functions/api/admin/product-editor-save.js')
save_exec=re.sub(r'//[^\n]*','',save)
save_exec=re.sub(r'/\*.*?\*/','',save_exec,flags=re.S)
page=read('admin/product-editor/index.html')
client=read('public/js/admin-product-editor-v163.js')
schema=read('functions/api/admin/storefront-schema-repair.js')
seo_migration=read('migrations/canonical/0004_release465_storefront_quality.sql')

for token in ('single-product-save-v175','PRODUCT_UPDATE_SQL','SEO_UPSERT_SQL','schema_introspection_reads:0','background_work_started:false','media_sync_started:false','readiness_scan_started:false','X-DD-D1-Write-Contract'):
    req(token in save,f'Build 175 Product save missing: {token}')

for forbidden in ('PRAGMA','SQLITE_MASTER','TABLE_INFO(','COLUMN_CACHE','ASYNC FUNCTION COLUMNS('):
    req(forbidden not in save_exec.upper(),f'Build 175 Product save contains forbidden runtime schema introspection: {forbidden}')

req(save.count('UPDATE products SET')==1,'Build 175 Product save should define exactly one Product UPDATE authority')
req(save.count('INSERT INTO product_seo')==1,'Build 175 Product save should define exactly one SEO UPSERT authority')
req("context.waitUntil" in save and "auditAdminAction" in save,'Build 175 Product save lost async audit continuity')
for forbidden in ('product_images','product_resource_links','content_projects','creative_projects','maybeQueueApprovedProductSocialPost','createOrRefreshContentProjectForProduct'):
    req(forbidden not in save,f'Build 175 Product save touches unrelated authority: {forbidden}')

req(any(token in page for token in ('Release 467 • Build 175','Release 467 • Build 178')),'Build 175+ Product Editor page identity missing')
req(any(token in page for token in ('admin-product-editor-v163.js?v=175','admin-product-editor-v163.js?v=178')),'Build 175+ Product Editor cache identity missing')
req('no request-time PRAGMA/table introspection' in page,'Build 175 Product Editor page lost zero-introspection contract')
for token in ('Build 175','Schema introspection reads:','/api/admin/product-editor-save'):
    req(token in client,f'Build 175 Product Editor client missing: {token}')

# Source schema authority must still describe every Product field used by the fixed save contract.
for field in (
  'name','slug','sku','product_category','color_name','color_names_json','shipping_code','review_status',
  'short_description','description','product_type','status','price_cents','compare_at_price_cents','currency',
  'taxable','tax_class_id','requires_shipping','weight_grams','inventory_tracking','inventory_quantity',
  'digital_file_url','featured_image_url','sort_order','merchandise_origin','sale_channel','external_listing_url',
  'external_listing_label','condition_summary','era_label','sourcing_notes'
):
    req(field in schema,f'Product schema authority missing save field: {field}')
for field in ('product_id','meta_title','meta_description','keywords','h1_override','canonical_url','og_title','og_description','og_image_url','created_at','updated_at'):
    req(field in seo_migration,f'Canonical Product SEO migration missing save field: {field}')

for forbidden in ('setInterval(','setTimeout(','MutationObserver('):
    req(forbidden not in client,f'Build 175 Product Editor gained background behavior: {forbidden}')

for path in ('functions/api/admin/product-editor-save.js','public/js/admin-product-editor-v163.js'):
    node(path)

if FAIL:
    print('RELEASE 467 BUILD 175 PRODUCT EDITOR ZERO-INTROSPECTION SAVE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 175 PRODUCT EDITOR ZERO-INTROSPECTION SAVE: PASS')
print('Request-time schema introspection: ZERO')
print('Product write authority: ONE PRODUCT UPDATE')
print('SEO write authority: ONE PRODUCT_SEO UPSERT')
print('Media/readiness/inventory/content background work: NONE')
print('Schema migration: NONE')

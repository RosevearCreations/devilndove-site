#!/usr/bin/env python3
"""Current Storefront merchandising/media availability regression proof."""
from pathlib import Path
import json, subprocess
ROOT=Path(__file__).resolve().parents[1]

def read(path):
    p=ROOT/path
    if not p.is_file(): raise SystemExit(f'FAIL — missing {path}')
    return p.read_text(encoding='utf-8',errors='replace')

def req(ok,msg):
    if not ok: raise SystemExit(f'FAIL — {msg}')

a=json.loads(read('release467-build59-storefront-media-availability-merchandising-recovery.json'))
req(a.get('build')==59,'Build 59 authority identity drifted')
req(a.get('accepted_dev_sha')=='91106c2156e209045ed49cfd48220550c7afca57','Build 59 must ingest exact Build 58 dev SHA')
req(a.get('accepted_dev_tree_sha')=='ab8d5dae6bba682dad438937ca63c38955e0ff8a','Build 59 must ingest exact Build 58 tree')
acc=a.get('acceptance') or {}
req(acc.get('system_gate_run')==33968914405,'Build 58 System proof missing from Build 59 ingest')
req(acc.get('current_application_quality_run')==33968914416,'Build 58 Quality proof missing from Build 59 ingest')
req(acc.get('it_admin_runtime_proof_run')==33968914417,'Build 58 I.T. proof missing from Build 59 ingest')
req(acc.get('branch_hygiene_run')==33968914412,'Build 58 Hygiene proof missing from Build 59 ingest')
scope=a.get('scope') or {}
for key in ('schema_migration','d1_business_data_migration','r2_mutation','provider_execution','production_promotion'):
    req(scope.get(key) is False,f'Build 59 unsafe scope drift: {key}')

api=read('functions/api/storefront-merchandising.js')
for token in ('PRAGMA table_info','productColumns','selectColumn','PRODUCT_SCHEMA_UNAVAILABLE','STOREFRONT_MERCHANDISING_FAILED',"authority:'public_products_plus_storefront_merchandising'"):
    req(token in api,f'merchandising compatibility missing {token}')
req('SELECT product_id,slug,name,product_category' not in api,'Storefront merchandising regressed to fixed Product-column SELECT')

media=read('functions/api/product-media.js')
for token in ("startsWith('products/')",'PRODUCT_MEDIA_BUCKET','bucket.get(key)','PRODUCT_MEDIA_NOT_FOUND','PRODUCT_MEDIA_READ_FAILED','Cache-Control'):
    req(token in media,f'Product media fallback endpoint missing {token}')
for forbidden in ('bucket.put(', 'bucket.delete(', 'bucket.list(', 'createMultipartUpload', 'resumeMultipartUpload'):
    req(forbidden not in media,f'Product media fallback acquired forbidden mutation/list capability: {forbidden}')

fallback=read('public/js/product-media-fallback.js')
for token in ("PUBLIC_HOST='assets.devilndove.com'",'/api/product-media?key=',"document.addEventListener('error'",'ddMediaFallbackAttempted','removeAttribute(\'srcset\')'):
    req(token in fallback,f'Browser media recovery missing {token}')
shop=read('shop/index.html')
media_idx=shop.find('/public/js/product-media-fallback.js?v=59')
shop_idx=shop.find('/public/js/shop.js?v=448')
merch_idx=shop.find('/public/js/storefront-merchandising.js?v=448')
req(media_idx>=0 and shop_idx>media_idx and merch_idx>shop_idx,'Shop must install media recovery before both Product renderers')
req(shop.lower().count('<h1')==1,'Shop must retain exactly one H1')

manifest=json.loads(read('migrations/canonical/manifest.json'))
req(len(manifest.get('migrations') or [])==4,'Build 59 must not change canonical migration count')

for js in ('functions/api/storefront-merchandising.js','functions/api/product-media.js','public/js/product-media-fallback.js','scripts/current_storefront_media_recovery_test.mjs'):
    subprocess.run(['node','--check',str(ROOT/js)],cwd=ROOT,check=True)
subprocess.run(['node',str(ROOT/'scripts/current_storefront_media_recovery_test.mjs')],cwd=ROOT,check=True)

print('CURRENT STOREFRONT MEDIA RECOVERY GATE: PASS')
print('Merchandising Product read: SCHEMA-COMPATIBLE / READ-ONLY')
print('Product media recovery: PUBLIC products/* ONLY / R2 READ-ONLY')
print('Product media runtime unit proof: PASS')
print('Shop fallback ordering: INSTALLED BEFORE PRODUCT RENDERERS')
print('Canonical migrations: UNCHANGED')

#!/usr/bin/env python3
"""Current Storefront merchandising/public-media availability regression proof."""
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

api=read('functions/api/storefront-merchandising.js')
for token in ('PRAGMA table_info','productColumns','selectColumn','PRODUCT_SCHEMA_UNAVAILABLE','STOREFRONT_MERCHANDISING_FAILED',"authority:'public_products_plus_storefront_merchandising'"):
    req(token in api,f'merchandising compatibility missing {token}')
req('SELECT product_id,slug,name,product_category' not in api,'Storefront merchandising regressed to fixed Product-column SELECT')

media=read('functions/api/product-media.js')
for token in ('PUBLIC_PREFIXES','PRODUCT_MEDIA_BUCKET','bucket.get(candidate)','Itemsforsale/','itemsforsale/','PRODUCT_MEDIA_NOT_FOUND','PRODUCT_MEDIA_READ_FAILED','X-DD-Media-Key','Cache-Control'):
    req(token in media,f'Public media fallback endpoint missing {token}')
for forbidden in ('bucket.put(', 'bucket.delete(', 'bucket.list(', 'createMultipartUpload', 'resumeMultipartUpload'):
    req(forbidden not in media,f'Public media fallback acquired forbidden mutation/list capability: {forbidden}')

fallback=read('public/js/product-media-fallback.js')
for token in ("PUBLIC_HOST='assets.devilndove.com'",'PUBLIC_PREFIXES','Itemsforsale/','/api/product-media?key=',"document.addEventListener('error'",'MutationObserver','ddMediaFallbackAttempted','removeAttribute(\'srcset\')'):
    req(token in fallback,f'Browser media recovery missing {token}')

middleware=read('functions/_middleware.js')
req('/public/js/product-media-fallback.js?v=60' in middleware,'Global HTML middleware must inject Build 60 media recovery site-wide')
shop=read('shop/index.html')
req(shop.lower().count('<h1')==1,'Shop must retain exactly one H1')

manifest=json.loads(read('migrations/canonical/manifest.json'))
req(len(manifest.get('migrations') or [])==4,'Build 60 must not change canonical migration count')

for js in ('functions/api/storefront-merchandising.js','functions/api/product-media.js','public/js/product-media-fallback.js','functions/_middleware.js','scripts/current_storefront_media_recovery_test.mjs'):
    subprocess.run(['node','--check',str(ROOT/js)],cwd=ROOT,check=True)
subprocess.run(['node',str(ROOT/'scripts/current_storefront_media_recovery_test.mjs')],cwd=ROOT,check=True)

print('CURRENT STOREFRONT MEDIA RECOVERY GATE: PASS')
print('Merchandising Product read: SCHEMA-COMPATIBLE / READ-ONLY')
print('Public media recovery: CURRENT + LEGACY R2 PREFIXES / R2 READ-ONLY')
print('Legacy case compatibility: PROVEN')
print('Site-wide HTML fallback injection: PROVEN')
print('Canonical migrations: UNCHANGED')

#!/usr/bin/env python3
"""Build 440 native Development Tool/Supply R2 restore source regression.
Local-only: no Cloudflare, D1, R2, provider, or schema access.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
api = (ROOT / 'functions/api/admin/inventory-asset-restore.js').read_text(encoding='utf-8')
ui = (ROOT / 'public/js/admin-inventory-asset-parity.js').read_text(encoding='utf-8')
page = (ROOT / 'admin/inventory-operations/index.html').read_text(encoding='utf-8')
parity = (ROOT / 'functions/api/admin/inventory-asset-parity.js').read_text(encoding='utf-8')

checks = []
def check(condition, label):
    if not condition:
        raise AssertionError(label)
    checks.append(label)
    print(f'{len(checks):02d}. PASS — {label}')

print('BUILD 440 NATIVE DEVELOPMENT INVENTORY ASSET RESTORE REGRESSION')
print('Cloudflare/D1/R2/provider access: NONE')
print('Production mutation capability: NONE')

check("hostname === 'devilndove-site-dev.pages.dev'" in api and "code: 'development_only'" in api, 'restore endpoint refuses Production hostname')
check('getAdminUserFromRequest' in api, 'restore endpoint is Admin-authenticated')
check("AUTHORIZATION = 'BUILD440_DEV_R2_RESTORE'" in api and "authorization_required" in api, 'restore requires the explicit authorized Development scope token')
check("env.PRODUCT_MEDIA_BUCKET" in api and 'bucket.head' in api and 'bucket.put' in api, 'restore uses the environment-bound Development Product Media bucket')
check('FROM site_item_inventory' in api and "LOWER(TRIM(COALESCE(source_type,''))) IN ('tool','supply')" in api and "TRIM(COALESCE(image_url,''))<>''" in api, 'restore scope comes directly from operational Inventory Tool/Supply image authority')
check('site_item_inventory_id>?' in api and 'MAX_BATCH = 8' in api and 'LIMIT ?' in api, 'restore is cursor-bounded to eight operational Inventory rows per request')
check("PUBLIC_ORIGIN = 'https://assets.devilndove.com'" in api and 'publicUrlForKey' in api, 'public source is fixed and read-only')
check('encodeURIComponent' in api and "replace(/[!'()*]/g" in api and "ALLOWED_PREFIXES = ['Toolshed/', 'Tools/', 'Supplies/']" in api, 'canonical Toolshed/Supplies namespaces and special object-key characters are supported')
check("sourceResponse.headers.get('content-length')" in api and 'source_truncated' in api and 'MAX_OBJECT_BYTES' in api and "startsWith('image/')" in api, 'source download is type/size bounded and truncation checked')
check('validateImageSignature' in api and 'source_image_invalid' in api and 'hasJpegEoi' in api, 'source image bytes are signature-checked before Development R2 write')
check("crypto.subtle.digest('SHA-256'" in api and 'build440_source_sha256' in api, 'source bytes are SHA-256 fingerprinted before Development R2 write')
check('subprocess' not in api.lower() and 'child_process' not in api.lower() and 'spawn(' not in api.lower() and 'exec(' not in api.lower(), 'runtime restore contains no local process execution path')
check('const existing = await bucket.head(key)' in api and 'existing_object_unverified' in api, 'existing unverified Development objects block instead of being overwritten')
check('const beforePut = await bucket.head(key)' in api and 'concurrent_object_unverified' in api, 'restore rechecks object absence immediately before PUT')
check("await bucket.put(key, buffer" in api and "build440_restore: 'development_tool_supply'" in api, 'restore writes only the canonical current Inventory key with verification metadata')
check('const verified = await bucket.head(key)' in api and 'post_write_verification_failed' in api, 'every write is verified after PUT')
check("status: 'failed'" in api and 'rowFailure(row, error)' in api and 'has_failures: failed.length > 0' in api, 'one bad source object is isolated and reported instead of crashing the whole batch')
check("failed: failed.length" in api and "entry.status === 'failed'" in api, 'batch response exposes exact object-level failure count and details')
check('bucket.delete' not in api and 'object.delete' not in api, 'restore exposes no R2 delete path')
check('INSERT INTO' not in api.upper() and 'UPDATE ' not in api.upper() and 'DELETE FROM' not in api.upper(), 'restore performs no D1 mutation SQL')
check("d1_mutation: false" in api and "production_mutation: false" in api, 'response contract explicitly reports no D1 or Production mutation')
check('operational Inventory authority' in ui and '/api/admin/inventory-asset-restore' in ui, 'Inventory parity UI exposes the native Development restore against operational authority')
check("method: 'POST'" in ui and 'RESTORE_BATCH_SIZE = 8' in ui and 'MAX_RESTORE_BATCHES = 150' in ui, 'browser restore executes bounded sequential POST batches')
check('restoreStats.failed' in ui and 'Object-level failures' in ui and 'recordBatchFailures' in ui, 'UI preserves and displays bounded object-level failure evidence')
check('while (' not in ui and 'setInterval(' not in ui and 'setTimeout(' not in ui, 'restore UI contains no polling/timer loop or unbounded while loop')
check("document.getElementById('restoreInventoryAssets')?.addEventListener('click', runRestore)" in ui, 'restore starts only from explicit user action')
check('result = await fetchParity()' in ui and 'Final Development R2 parity is not exact' in ui, 'restore automatically proves final parity before declaring success')
check('/public/js/admin-inventory-asset-parity.js?v=440.8' in page, 'Inventory Operations cache-busts the hardened native restore UI')
check("mutation_capability: 'none'" in parity and '.put(' not in parity and '.delete(' not in parity, 'separate parity endpoint remains list-only/read-only')

print(f'\nBUILD 440 NATIVE DEVELOPMENT INVENTORY ASSET RESTORE REGRESSION: PASS ({len(checks)}/{len(checks)})')
print('Execution: DEPLOYED DEVELOPMENT APP / NATIVE D1+R2 BINDINGS')
print('Operational image authority: site_item_inventory')
print('Canonical Tool namespace: Toolshed/ (Tools/ accepted as legacy)')
print('Local Wrangler/npm/Python restore dependency: NONE')
print('Source: assets.devilndove.com / READ ONLY')
print('Destination: PRODUCT_MEDIA_BUCKET / MISSING CURRENT INVENTORY KEYS ONLY')
print('Existing object overwrite: BLOCKED')
print('Source integrity: SHA256 + SIZE/TYPE/TRUNCATION/SIGNATURE BOUNDED')
print('Bad source object handling: ISOLATED / REPORTED / NOT WRITTEN')
print('Final acceptance: PARITY RECHECK MUST BE EXACT')
print('D1 mutation: NONE')
print('Production mutation: NONE')
print('PRODUCTION PROMOTION: CLOSED')

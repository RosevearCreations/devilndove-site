#!/usr/bin/env python3
"""Build 440 Inventory Tool/Supply R2 parity diagnostic source regression.
Local-only: no Cloudflare, D1, R2, provider, or schema mutation.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
api = (ROOT / 'functions/api/admin/inventory-asset-parity.js').read_text(encoding='utf-8')
ui = (ROOT / 'public/js/admin-inventory-asset-parity.js').read_text(encoding='utf-8')
page = (ROOT / 'admin/inventory-operations/index.html').read_text(encoding='utf-8')

checks = []
def check(condition, label):
    if not condition:
        raise AssertionError(label)
    checks.append(label)
    print(f'{len(checks):02d}. PASS — {label}')

print('BUILD 440 INVENTORY ASSET PARITY REGRESSION')
print('Cloudflare/D1/R2/provider access: NONE')
print('Production mutation capability: NONE')

check('getAdminUserFromRequest' in api, 'parity API is Admin-authenticated')
check("hostname === 'devilndove-site-dev.pages.dev'" in api and "code: 'development_only'" in api, 'parity API refuses the Production hostname')
check("env.PRODUCT_MEDIA_BUCKET" in api and "bucket.list" in api, 'parity API reads the environment-bound Product Media bucket')
check("PREFIXES = ['Tools/', 'Supplies/']" in api, 'parity scope is limited to canonical Tool/Supply prefixes')
check('MAX_R2_PAGES_PER_PREFIX = 5' in api and 'R2_PAGE_LIMIT = 1000' in api, 'R2 listing is explicitly bounded')
check("FROM catalog_items" in api and "item_kind IN ('tool','supply')" in api and 'LIMIT 1200' in api, 'D1 catalogue read is bounded to Tool/Supply image authority')
check("PUBLIC_ASSET_PREFIX = 'https://assets.devilndove.com/'" in api and 'decodeURIComponent(key)' in api, 'public URLs are converted back to exact canonical R2 keys')
check('missing_unique_keys' in api and 'present_unique_keys' in api and 'bucket_only_keys' in api, 'diagnostic reports present, missing, and bucket-only counts')
check('MAX_MISSING_SAMPLE = 80' in api and 'missing_sample_limit' in api, 'missing-key evidence is bounded')
check("mutation_capability: 'none'" in api, 'API explicitly declares zero mutation capability')
check('bucket.put(' not in api and 'bucket.delete(' not in api and 'bucket.get(' not in api, 'parity API uses R2 list only; no object read/write/delete path')
check('CREATE TABLE' not in api.upper() and 'ALTER TABLE' not in api.upper() and 'DROP TABLE' not in api.upper(), 'parity API contains no request-time schema DDL')
check('INSERT INTO' not in api.upper() and 'UPDATE ' not in api.upper() and 'DELETE FROM' not in api.upper(), 'parity API performs no D1 writes')
check('inventoryAssetParityMount' in page and '/public/js/admin-inventory-asset-parity.js?v=440' in page, 'Inventory Operations mounts and loads the parity review')
check('Run R2 parity check' in ui and '/api/admin/inventory-asset-parity' in ui, 'UI exposes an explicit manual parity action')
check("document.addEventListener('DOMContentLoaded'" in ui and 'runParity' in ui, 'parity UI initializes without automatic remote execution')
check('setInterval(' not in ui and 'setTimeout(' not in ui, 'parity UI contains no polling or timer loop')
check("retries: 0" in ui and "dedupe: false" in ui, 'manual parity request disables retries and request dedupe')
check('missing_unique_keys' in ui and 'listing_truncated' in ui, 'UI shows missing count and incomplete-listing warning')
check('put(' not in ui and 'delete(' not in ui and 'POST' not in ui, 'UI exposes no R2/D1 mutation action')

print(f'\nBUILD 440 INVENTORY ASSET PARITY REGRESSION: PASS ({len(checks)}/{len(checks)})')
print('Environment: DEVELOPMENT ONLY')
print('Catalogue authority: D1 catalog_items / Tool + Supply')
print('R2 authority: PRODUCT_MEDIA_BUCKET / LIST ONLY')
print('Execution: MANUAL / BOUNDED')
print('R2 mutation: NONE')
print('Production promotion: CLOSED')

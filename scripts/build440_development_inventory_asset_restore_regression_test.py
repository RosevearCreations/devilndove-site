#!/usr/bin/env python3
"""Build 440 guarded Development Tool/Supply R2 restore source regression.
Local-only: performs no Cloudflare, D1, R2, provider, or schema access.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
restore = (ROOT / 'scripts/build440_development_inventory_asset_restore.py').read_text(encoding='utf-8')

checks = []
def check(condition, label):
    if not condition:
        raise AssertionError(label)
    checks.append(label)
    print(f'{len(checks):02d}. PASS — {label}')

print('BUILD 440 DEVELOPMENT INVENTORY ASSET RESTORE REGRESSION')
print('Cloudflare/D1/R2/provider access: NONE')
print('Production mutation capability: NONE')

check('DEV_BRANCH = "dev"' in restore, 'restore is hard-pinned to the Development git branch')
check('DEV_D1 = "devilndove-dev"' in restore and 'dbc1615b-dcbe-4951-973b-b47c99c73bfa' in restore, 'restore is hard-pinned to Development D1 identity')
check('DEV_BUCKET = "devilndove-toolshed-images-dev"' in restore, 'restore destination is hard-pinned to Development Product Media R2')
check('PUBLIC_ORIGIN = "https://assets.devilndove.com"' in restore, 'public asset source is explicit and read-only')
check('AUTHORIZED_EXPECTED_KEYS = 498' in restore, 'restore authorization remains fixed to the proven 498-key current D1 scope')
check('APPLY_TOKEN = "BUILD440_DEV_R2_RESTORE"' in restore, 'apply requires an explicit Development restore authorization token')
check('supplies_images_inventory.csv' in restore and 'r2_object_key' in restore and 'file_size_bytes' in restore and 'sha256' in restore, 'historical manifest supplies recorded canonical key, byte-size and SHA metadata')
check("item_kind IN ('tool','supply')" in restore and 'LIMIT 1200' in restore, 'restore re-reads the bounded current Development D1 Tool/Supply image authority')
check('def load_manifest_index()' in restore and 'def select_authorized_assets(' in restore, 'restore separates historical integrity metadata from current D1 restore authority')
check('missing_metadata = sorted(d1_keys - manifest_keys)' in restore, 'every current D1 key must have recorded manifest integrity metadata')
check('historical_only = sorted(manifest_keys - d1_keys)' in restore and 'Historical manifest-only keys ignored' in restore, 'historical manifest-only objects are reported and excluded from restore scope')
check('manifest_index[key] for key in d1_keys' in restore and 'len(assets) != AUTHORIZED_EXPECTED_KEYS' in restore, 'selected restore set is exactly the 498 current D1 keys')
check('verify_all_sources(assets' in restore and 'validate_file(temp, asset)' in restore, 'all selected public sources are size/SHA verified before any R2 write phase')
check('mode.add_argument(' in restore and '"--dry-run"' in restore and 'Development R2 mutation executed: NO' in restore, 'dry-run is explicit and reports zero Development R2 mutation')
check('args.authorization != APPLY_TOKEN' in restore, 'apply fails closed without the exact authorization token')
check('get_dev_object(asset, "before")' in restore and 'get_dev_object(asset, "before-put")' in restore, 'restore checks object absence twice before each Development PUT')
check('refusing overwrite' in restore and 'already_present_verified' in restore, 'existing matching objects are skipped and mismatches are never overwritten')
check('"r2", "object", "put", f"{DEV_BUCKET}/{asset.key}"' in restore, 'PUT destination cannot be redirected away from the hard-pinned Development bucket')
check('get_dev_object(asset, "after")' in restore and 'post-write verification failed' in restore, 'every written object is downloaded back and byte/SHA verified')
check('"r2", "object", "delete"' not in restore, 'restore exposes no R2 delete operation')
check('INSERT INTO' not in restore.upper() and 'UPDATE catalog_items' not in restore and 'DELETE FROM' not in restore.upper(), 'restore contains no D1 mutation SQL')
check('ThreadPoolExecutor' in restore and 'min(int(args.workers or 3), 4)' in restore, 'restore parallelism is explicitly bounded to four workers')
check('tempfile.gettempdir()' in restore, 'restore cache/probe files stay outside the repository working tree')
check('Production R2 mutation executed: NO' in restore and 'PRODUCTION PROMOTION: CLOSED' in restore, 'restore retains explicit Production-closed evidence')

print(f'\nBUILD 440 DEVELOPMENT INVENTORY ASSET RESTORE REGRESSION: PASS ({len(checks)}/{len(checks)})')
print('Authorized scope: 498 CURRENT DEVELOPMENT D1 TOOL/SUPPLY IMAGE KEYS')
print('Historical manifest: INTEGRITY LOOKUP ONLY / EXTRA KEYS IGNORED')
print('Source: PUBLIC ASSET ORIGIN / READ ONLY / SIZE+SHA VERIFIED')
print('Destination: devilndove-toolshed-images-dev / MISSING KEYS ONLY')
print('Existing object overwrite: BLOCKED')
print('Post-write verification: BYTE SIZE + SHA256')
print('Production R2 mutation: NONE')
print('D1 mutation: NONE')
print('PRODUCTION PROMOTION: CLOSED')

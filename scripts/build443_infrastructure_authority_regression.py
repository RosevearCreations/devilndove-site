from __future__ import annotations

import json
import pathlib
import tomllib

ROOT = pathlib.Path(__file__).resolve().parents[1]
WRANGLER = ROOT / 'wrangler.toml'
RELEASE = ROOT / 'development-release.json'
ENDPOINT = ROOT / 'functions' / 'api' / 'admin' / 'infrastructure-readiness.js'
IT_JS = ROOT / 'public' / 'js' / 'admin-it-platform.js'

EXPECTED_PROJECT = 'devilndove-site-dev'
EXPECTED_D1 = {
    'binding': 'DB',
    'database_name': 'devilndove-dev',
    'database_id': 'dbc1615b-dcbe-4951-973b-b47c99c73bfa',
}
EXPECTED_R2 = {
    'PRODUCT_MEDIA_BUCKET': 'devilndove-toolshed-images-dev',
    'CAIP_PRIVATE_MEDIA_BUCKET': 'devilndove-caip-media-dev',
}


def fail(message: str) -> None:
    raise SystemExit(f'BUILD 443 INFRASTRUCTURE AUTHORITY: FAIL — {message}')


def main() -> None:
    if not WRANGLER.exists():
        fail('wrangler.toml is missing')
    data = tomllib.loads(WRANGLER.read_text(encoding='utf-8'))
    if data.get('name') != EXPECTED_PROJECT:
        fail(f"Pages project must be {EXPECTED_PROJECT!r}, got {data.get('name')!r}")

    d1 = data.get('d1_databases') or []
    if len(d1) != 1 or any(d1[0].get(k) != v for k, v in EXPECTED_D1.items()):
        fail(f'D1 binding authority drifted: {d1!r}')

    actual_r2 = {row.get('binding'): row.get('bucket_name') for row in (data.get('r2_buckets') or [])}
    if actual_r2 != EXPECTED_R2:
        fail(f'R2 binding authority drifted: {actual_r2!r}')
    for row in data.get('r2_buckets') or []:
        if row.get('preview_bucket_name') != row.get('bucket_name'):
            fail(f"R2 preview bucket must match Development bucket for {row.get('binding')}")

    if not RELEASE.exists():
        fail('development-release.json is missing')
    release = json.loads(RELEASE.read_text(encoding='utf-8'))
    release_text = json.dumps(release).lower()
    if '443' not in release_text:
        fail('development-release.json no longer identifies Build 443 while this gate is active')
    if 'devilndove-site-dev' not in release_text:
        fail('development-release.json does not identify the Development Pages project')

    endpoint = ENDPOINT.read_text(encoding='utf-8') if ENDPOINT.exists() else ''
    for token in ['DB', 'PRODUCT_MEDIA_BUCKET', 'CAIP_PRIVATE_MEDIA_BUCKET', 'SELECT 1 AS ok', 'sqlite_master', '.list({ limit: 1 })']:
        if token not in endpoint:
            fail(f'infrastructure readiness endpoint is missing contract token {token!r}')

    it_js = IT_JS.read_text(encoding='utf-8') if IT_JS.exists() else ''
    for token in ['/api/admin/infrastructure-readiness', 'configured', 'reachable', 'schema_ready', 'storage_ready']:
        if token not in it_js:
            fail(f'I.T. runtime bridge is missing contract token {token!r}')

    print('BUILD 443 INFRASTRUCTURE AUTHORITY: PASS')
    print(f'Pages: {EXPECTED_PROJECT}')
    print(f"D1: {EXPECTED_D1['binding']} -> {EXPECTED_D1['database_name']} ({EXPECTED_D1['database_id']})")
    for binding, bucket in EXPECTED_R2.items():
        print(f'R2: {binding} -> {bucket}')
    print('Static configuration is verified. Live reachability/storage readiness is verified only by the authenticated I.T. runtime probe.')


if __name__ == '__main__':
    main()

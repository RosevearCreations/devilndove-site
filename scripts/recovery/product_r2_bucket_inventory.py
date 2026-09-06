import argparse
import hashlib
import json
import pathlib
import secrets
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path('/tmp/product-r2-bucket-inventory')
BRIDGE = ROOT / 'bridge'
PROOF = ROOT / 'proof'
TOKEN_FILE = ROOT / 'inventory-token'


def log(*args):
    print(*args, flush=True)


def reset():
    import shutil
    if ROOT.exists():
        shutil.rmtree(ROOT)
    (BRIDGE / 'functions' / 'api').mkdir(parents=True, exist_ok=True)
    PROOF.mkdir(parents=True, exist_ok=True)


def prepare():
    reset()
    token = secrets.token_hex(32)
    token_sha = hashlib.sha256(token.encode('utf-8')).hexdigest()
    template = pathlib.Path('scripts/recovery/product-r2-inventory-bridge-template.js').read_text(encoding='utf-8')
    assert '__TOKEN_SHA256__' in template
    (BRIDGE / 'functions' / 'api' / 'inventory.js').write_text(template.replace('__TOKEN_SHA256__', token_sha), encoding='utf-8')
    (BRIDGE / 'index.html').write_text('<!doctype html><title>Product R2 inventory</title><p>Temporary read-only inventory.</p>\n', encoding='utf-8')
    (BRIDGE / 'wrangler.toml').write_text(
        'name = "devilndove-product-r2-inventory"\n'
        'compatibility_date = "2026-09-05"\n'
        'pages_build_output_dir = "."\n\n'
        '[[r2_buckets]]\n'
        'binding = "PRODUCT_SOURCE_BUCKET"\n'
        'bucket_name = "devilndove-toolshed-images-dev"\n'
        'preview_bucket_name = "devilndove-toolshed-images-dev"\n\n'
        '[[r2_buckets]]\n'
        'binding = "PRODUCT_DESTINATION_BUCKET"\n'
        'bucket_name = "devilndove-toolshed-images"\n'
        'preview_bucket_name = "devilndove-toolshed-images"\n',
        encoding='utf-8',
    )
    TOKEN_FILE.write_text(token, encoding='utf-8')
    TOKEN_FILE.chmod(0o600)
    (PROOF / 'authority.json').write_text(json.dumps({
        'source_bucket': 'devilndove-toolshed-images-dev',
        'destination_bucket': 'devilndove-toolshed-images',
        'prefix': 'products/',
        'read_only': True,
        'token_sha256': token_sha,
        'token_plaintext_in_proof': False,
    }, indent=2), encoding='utf-8')
    log('PRODUCT_R2_INVENTORY_PREPARE=PASS')


def post(url, token, payload, timeout=60):
    request = urllib.request.Request(
        url,
        method='POST',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'x-product-inventory-token': token,
            'User-Agent': 'dnd-product-r2-inventory/1.0',
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return int(response.status), json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode('utf-8', 'replace')
        try:
            payload = json.loads(raw)
        except Exception:
            payload = {'raw': raw[:1000]}
        return int(exc.code), payload


def wait_for_guard(url):
    for _ in range(40):
        status, _ = post(url, 'deliberately-wrong-token', {'target': 'source', 'limit': 1}, timeout=30)
        if status == 403:
            return
        time.sleep(3)
    raise RuntimeError('Read-only inventory bridge did not become ready.')


def collect_target(url, token, target):
    cursor = ''
    objects = []
    pages = 0
    while True:
        status, data = post(url, token, {'target': target, 'limit': 500, **({'cursor': cursor} if cursor else {})})
        if status != 200 or not data.get('ok') or data.get('target') != target or data.get('mutation') is not False:
            raise RuntimeError(f'Inventory failed for {target}: HTTP {status} {json.dumps(data)[:1200]}')
        batch = data.get('results') or []
        objects.extend(batch)
        pages += 1
        log(target, 'page', pages, 'batch', len(batch), 'total', len(objects))
        if data.get('done'):
            break
        cursor = str(data.get('next_cursor') or '').strip()
        if not cursor:
            raise RuntimeError(f'Truncated {target} inventory returned no cursor.')
        if pages > 100:
            raise RuntimeError(f'{target} pagination safety limit exceeded.')
    objects.sort(key=lambda row: str(row.get('key') or ''))
    (PROOF / f'{target}.json').write_text(json.dumps(objects, indent=2), encoding='utf-8')
    return objects, pages


def collect(base_url):
    assert TOKEN_FILE.is_file(), 'Prepare phase token is missing.'
    token = TOKEN_FILE.read_text(encoding='utf-8').strip()
    url = base_url.rstrip('/') + '/api/inventory'
    wait_for_guard(url)
    source, source_pages = collect_target(url, token, 'source')
    destination, destination_pages = collect_target(url, token, 'destination')
    source_keys = {str(row.get('key') or '') for row in source}
    destination_keys = {str(row.get('key') or '') for row in destination}
    source_only = sorted(source_keys - destination_keys)
    destination_only = sorted(destination_keys - source_keys)
    shared = sorted(source_keys & destination_keys)
    summary = {
        'source_objects': len(source),
        'destination_objects': len(destination),
        'source_only_objects': len(source_only),
        'destination_only_objects': len(destination_only),
        'shared_keys': len(shared),
        'source_pages': source_pages,
        'destination_pages': destination_pages,
        'read_only': True,
        'r2_mutation': False,
        'd1_mutation': False,
    }
    (PROOF / 'source-only-keys.txt').write_text(''.join(k + '\n' for k in source_only), encoding='utf-8')
    (PROOF / 'destination-only-keys.txt').write_text(''.join(k + '\n' for k in destination_only), encoding='utf-8')
    (PROOF / 'summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
    TOKEN_FILE.unlink(missing_ok=True)
    log(json.dumps(summary, indent=2))
    log('PRODUCT_R2_BUCKET_INVENTORY=PASS')


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('prepare')
    collect_parser = sub.add_parser('collect')
    collect_parser.add_argument('--base-url', required=True)
    args = parser.parse_args()
    if args.command == 'prepare':
        prepare()
    else:
        collect(args.base_url)


if __name__ == '__main__':
    main()

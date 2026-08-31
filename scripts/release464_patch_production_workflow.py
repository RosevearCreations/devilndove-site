#!/usr/bin/env python3
from pathlib import Path

path = Path('.github/workflows/production-pages-deploy.yml')
text = path.read_text(encoding='utf-8')
original = text

replacements = [
    ("permissions:\n  contents: read\n", "permissions:\n  contents: read\n  actions: read\n"),
    ("          fetch-depth: 1\n", "          fetch-depth: 0\n"),
    ("          assert ready.get('ok') is True and ready.get('release')==463,(base,ready)\n", "          assert ready.get('ok') is True and ready.get('release')==464,(base,ready)\n"),
    ("            'release':463,'status':'PASS','source_sha':expected_sha,\n", "            'release':464,'status':'PASS','source_sha':expected_sha,\n"),
    ("--commit-message=\"${{ github.event.head_commit.message || 'Release 463 Production deployment' }}\"", "--commit-message=\"${{ github.event.head_commit.message || 'Release 464 Production deployment' }}\""),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f'missing expected production workflow marker: {old!r}')
    text = text.replace(old, new, 1)

setup = """      - uses: actions/setup-python@v7\n        with:\n          python-version: '3.12'\n\n"""
insert = """      - uses: actions/setup-python@v7\n        with:\n          python-version: '3.12'\n\n      - name: Prove exact green Development tree before Production work\n        env:\n          GITHUB_TOKEN: ${{ github.token }}\n        run: python scripts/main_promotion_gate.py\n\n"""
if setup not in text:
    raise SystemExit('setup-python insertion marker missing')
text = text.replace(setup, insert, 1)

predeploy = """      - name: Prove isolated Production D1 before deployment\n"""
migration = """      - name: Apply and prove canonical Production D1 migrations before dependent code\n        env:\n          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}\n        run: python scripts/d1_migrate.py --target production --apply --production-ack LIVE_SCHEMA_CHANGE --source-sha \"${GITHUB_SHA}\"\n\n      - name: Prove isolated Production D1 before deployment\n"""
if predeploy not in text:
    raise SystemExit('production predeploy insertion marker missing')
text = text.replace(predeploy, migration, 1)

for required in (
    'python scripts/main_promotion_gate.py',
    'python scripts/d1_migrate.py --target production --apply --production-ack LIVE_SCHEMA_CHANGE',
    'actions: read',
    'fetch-depth: 0',
    "ready.get('release')==464",
):
    if required not in text:
        raise SystemExit(f'patched workflow missing required marker: {required}')

if text == original:
    raise SystemExit('production workflow did not change')
path.write_text(text, encoding='utf-8')
print('RELEASE 464 PRODUCTION WORKFLOW PATCH: PASS')

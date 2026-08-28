#!/usr/bin/env python3
"""Canonical repository and current-release forward-sanity authority."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


release = json.loads((ROOT / 'development-release.json').read_text(encoding='utf-8'))
require(release.get('environment') == 'development', 'current release must target Development')
require(release.get('release') == 447, 'current Development release must be Release 447')
require(release.get('label') == 'Platform Convergence', 'current release label must be Platform Convergence')
require(release.get('release_track') == 'single-current-release', 'single current release track is required')
require(release.get('pages_project') == 'devilndove-site-dev', 'Development Pages project authority drifted')

module_keys = [row.get('key') for row in release.get('canonical_modules', [])]
require(
    module_keys == ['storefront', 'creators', 'socials', 'financials', 'it-platform'],
    f'canonical module authority drifted: {module_keys}',
)
client_keys = [row.get('key') for row in release.get('clients', [])]
require(client_keys == ['web', 'phone', 'desktop'], f'canonical client authority drifted: {client_keys}')
policy = release.get('release_policy', {})
require(policy.get('one_current_release') is True, 'one-current-release policy must remain enabled')
require(policy.get('legacy_build_numbers_are_provenance_only') is True, 'legacy build numbers must be provenance only')
require(policy.get('historical_build_gates_allowed') is False, 'historical build-number gates must remain retired')
require(policy.get('production_promotion') == 'closed', 'Production promotion must remain closed during Release 447')

infra_release = release.get('development_infrastructure', {})
require(infra_release.get('cloudflare_account_id') == 'c0d5bc25df16ae5b7d47c985c4b7b787', 'Development Cloudflare account authority drifted')
require(infra_release.get('local_access_preflight') == 'python scripts/cloudflare_development_access.py --auth-only', 'Development Cloudflare access preflight authority drifted')

acceptance = release.get('acceptance', {})
runtime_acceptance = acceptance.get('runtime', {})
require(runtime_acceptance.get('authority') == 'scripts/development_runtime_acceptance.py', 'runtime acceptance authority drifted')
require(runtime_acceptance.get('runbook') == 'LIVE_TESTING_GUIDE.md', 'runtime acceptance runbook drifted')
require(runtime_acceptance.get('mode') == 'authenticated-development-read-only', 'runtime acceptance must remain authenticated Development read-only')
require(runtime_acceptance.get('production_allowed') is False, 'runtime acceptance may never allow Production')
require(runtime_acceptance.get('provider_mutation') is False, 'runtime acceptance may never mutate providers')
require(acceptance.get('stripe', {}).get('provider_acceptance') == 'hold', 'Stripe must remain HOLD until real provider evidence exists')
require(acceptance.get('paypal', {}).get('provider_acceptance') == 'hold', 'PayPal must remain HOLD until real provider evidence exists')
require(acceptance.get('caip_private_media', {}).get('acceptance') == 'hold', 'CAIP private media must remain HOLD until real evidence exists')

next_release = release.get('next_release_preparation', {})
require(next_release.get('release') == 448, 'Release 448 preparation authority missing')
require(next_release.get('state') == 'scope_ready_not_open', 'Release 448 must remain prepared but unopened')
require(next_release.get('database_migration_allowed') is False, 'Release 448 preparation may not mutate Development D1 while 447 is open')
workstream_keys = [row.get('key') for row in next_release.get('workstreams', [])]
for key in (
    'product-material-lineage',
    'product-tool-lineage',
    'manufacturer-provenance-reviews',
    'it-integration-registry',
    'carousel-movie-reuse',
    'movie-data-convergence',
    'unverified-process-states',
):
    require(key in workstream_keys, f'Release 448 preparation workstream missing: {key}')

require(not list(ROOT.glob('BUILD*.md')), 'historical BUILD*.md files must not exist in repository root')
require(not (ROOT / 'docs/archive').exists(), 'docs/archive must not ship; Git history is the archive')
require(not (ROOT / 'docs/releases').exists(), 'docs/releases must not ship; current release belongs in development-release.json')
require(not (ROOT / 'tmp').exists(), 'tmp must not ship in the repository')
for junk in ('testfile', 'java.md', 'updated.md'):
    require(not (ROOT / junk).exists(), f'junk placeholder remains: {junk}')
require((ROOT / 'database_full_schema.sql').exists(), 'database_full_schema.sql aggregate authority missing')
require((ROOT / 'scripts/cloudflare_development_access.py').exists(), 'durable Development Cloudflare access preflight is missing')
require((ROOT / 'scripts/apply_development_platform_convergence.py').exists(), 'canonical Development D1 convergence runner is missing')
require((ROOT / 'scripts/development_runtime_acceptance.py').exists(), 'release-independent Development runtime acceptance authority is missing')
require((ROOT / 'LIVE_TESTING_GUIDE.md').exists(), 'current Development runtime acceptance runbook is missing')

workflow_dir = ROOT / '.github/workflows'
require((workflow_dir / 'system-gate.yml').exists(), 'canonical .github/workflows/system-gate.yml is missing')
require(not list(workflow_dir.glob('build*-system-gate.yml')), 'historical build-numbered system gates must not be active')
if (workflow_dir / 'system-gate.yml').exists():
    workflow = (workflow_dir / 'system-gate.yml').read_text(encoding='utf-8')
    require(not re.search(r'build\d+', workflow, flags=re.IGNORECASE), 'canonical system gate must not depend on historical build-numbered scripts')
    require('python scripts/development_runtime_acceptance.py --self-check' in workflow, 'System Gate must validate runtime acceptance safety/manifest')

runbook = (ROOT / 'LIVE_TESTING_GUIDE.md').read_text(encoding='utf-8')
require(not re.search(r'Build\s+\d+', runbook, flags=re.IGNORECASE), 'active live-testing runbook must not carry numbered Build instructions')
for marker in (
    'https://devilndove-site-dev.pages.dev',
    'DND_DEV_SESSION_COOKIE',
    'Production mutation is forbidden',
    'Provider readiness never implies provider acceptance',
):
    require(marker in runbook, f'active runtime runbook missing safeguard: {marker}')

runtime_script = (ROOT / 'scripts/development_runtime_acceptance.py').read_text(encoding='utf-8')
for marker in (
    'ALLOWED_HOSTS = {"devilndove-site-dev.pages.dev"}',
    'SESSION_ENV = "DND_DEV_SESSION_COOKIE"',
    'method="GET"',
    'Production, custom-domain and arbitrary targets are forbidden',
    'provider_transaction_acceptance',
    'caip_private_media_acceptance',
):
    require(marker in runtime_script, f'Development runtime acceptance missing safeguard: {marker}')
require('--password' not in runtime_script and '--token' not in runtime_script and '--cookie' not in runtime_script, 'runtime acceptance must not accept credentials through CLI flags')

wrangler = (ROOT / 'wrangler.toml').read_text(encoding='utf-8')
for marker in (
    'name = "devilndove-site-dev"',
    'binding = "DB"',
    'database_name = "devilndove-dev"',
    'binding = "PRODUCT_MEDIA_BUCKET"',
    'bucket_name = "devilndove-toolshed-images-dev"',
    'binding = "CAIP_PRIVATE_MEDIA_BUCKET"',
    'bucket_name = "devilndove-caip-media-dev"',
):
    require(marker in wrangler, f'Development infrastructure authority missing: {marker}')
require('account_id =' not in wrangler, 'Pages wrangler.toml must not carry account_id; local tooling pins CLOUDFLARE_ACCOUNT_ID instead')

access_script = (ROOT / 'scripts/cloudflare_development_access.py').read_text(encoding='utf-8')
for marker in (
    "EXPECTED_ACCOUNT_ID = 'c0d5bc25df16ae5b7d47c985c4b7b787'",
    "EXPECTED_DATABASE_NAME = 'devilndove-dev'",
    "EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'",
    "'devilndove-toolshed-images-dev'",
    "'devilndove-caip-media-dev'",
    "env['CLOUDFLARE_ACCOUNT_ID'] = EXPECTED_ACCOUNT_ID",
    "--auth-mode",
    "CLOUDFLARE_API_TOKEN",
    "Credentials printed: NEVER",
):
    require(marker in access_script, f'Development Cloudflare access preflight missing safeguard: {marker}')

infra = (ROOT / 'functions/api/admin/infrastructure-readiness.js').read_text(encoding='utf-8')
for marker in ('SELECT 1 AS ok', 'sqlite_master', 'bucket.list({ limit: 1 })', 'd1_write: false', 'r2_write: false', 'provider_write: false'):
    require(marker in infra, f'read-only infrastructure contract missing: {marker}')
require('captureRuntimeIncident' not in infra, 'read-only infrastructure readiness must not write incident rows')

for relative in (
    'functions/api/admin/contracts/catalog-read.js',
    'functions/api/admin/contracts/content-media.js',
    'functions/api/admin/contracts/accounting-read.js',
):
    text = (ROOT / relative).read_text(encoding='utf-8')
    require(not re.search(r'Build\s+\d+', text, flags=re.IGNORECASE), f'active contract carries stale numbered Build identity: {relative}')
    require('currentReleaseMetadata' in text, f'active contract must expose current release authority: {relative}')
    require(not re.search(r'\bbuild\s*:', text, flags=re.IGNORECASE), f'active contract exposes stale build field: {relative}')

version_pattern = re.compile(r'([?&]v=)(\d+)(?:[.-][\w-]+)?(?=["\'&#\s)]|$)')
runtime = (
    list(ROOT.glob('*.html'))
    + list((ROOT / 'admin').rglob('*.html'))
    + list((ROOT / 'js').rglob('*.js'))
    + list((ROOT / 'public/js').rglob('*.js'))
    + list((ROOT / 'css').rglob('*.css'))
)
future_versions: list[str] = []
for path in sorted(set(runtime)):
    text = path.read_text(encoding='utf-8')
    for match in version_pattern.finditer(text):
        if int(match.group(2)) > int(release['release']):
            future_versions.append(f'{path.relative_to(ROOT)}:{match.group(2)}')
require(not future_versions, f'future cache majors found: {future_versions[:12]}')

print('PLATFORM FORWARD SANITY')
print(f"Current release: {release['release']} — {release['label']}")
print(f"Canonical modules: {', '.join(module_keys)}")
print(f"Canonical clients: {', '.join(client_keys)}")
print('Development runtime acceptance: RELEASE-INDEPENDENT / GET-ONLY')
print('Release 448: SCOPE READY / NOT OPEN')
print('Development Cloudflare account: PINNED BY LOCAL TOOLING')
print('Pages wrangler account_id: FORBIDDEN')
print('Historical build numbers: PROVENANCE ONLY')
print('Production mutation capability: NONE')
if failures:
    for i, failure in enumerate(failures, 1):
        print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('PLATFORM FORWARD SANITY: PASS')

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

require(not list(ROOT.glob('BUILD*.md')), 'historical BUILD*.md files must not exist in repository root')
require(not (ROOT / 'docs/archive').exists(), 'docs/archive must not ship; Git history is the archive')
require(not (ROOT / 'docs/releases').exists(), 'docs/releases must not ship; current release belongs in development-release.json')
require(not (ROOT / 'tmp').exists(), 'tmp must not ship in the repository')
for junk in ('testfile', 'java.md', 'updated.md'):
    require(not (ROOT / junk).exists(), f'junk placeholder remains: {junk}')
require((ROOT / 'database_full_schema.sql').exists(), 'database_full_schema.sql aggregate authority missing')

workflow_dir = ROOT / '.github/workflows'
require((workflow_dir / 'system-gate.yml').exists(), 'canonical .github/workflows/system-gate.yml is missing')
require(not list(workflow_dir.glob('build*-system-gate.yml')), 'historical build-numbered system gates must not be active')
if (workflow_dir / 'system-gate.yml').exists():
    workflow = (workflow_dir / 'system-gate.yml').read_text(encoding='utf-8')
    require(not re.search(r'build\d+', workflow, flags=re.IGNORECASE), 'canonical system gate must not depend on historical build-numbered scripts')

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

infra = (ROOT / 'functions/api/admin/infrastructure-readiness.js').read_text(encoding='utf-8')
for marker in ('SELECT 1 AS ok', 'sqlite_master', 'bucket.list({ limit: 1 })', 'd1_write: false', 'r2_write: false', 'provider_write: false'):
    require(marker in infra, f'read-only infrastructure contract missing: {marker}')
require('captureRuntimeIncident' not in infra, 'read-only infrastructure readiness must not write incident rows')

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
print('Historical build numbers: PROVENANCE ONLY')
print('Production mutation capability: NONE')
if failures:
    for i, failure in enumerate(failures, 1):
        print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('PLATFORM FORWARD SANITY: PASS')

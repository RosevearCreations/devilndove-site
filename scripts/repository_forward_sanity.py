#!/usr/bin/env python3
"""Canonical repository-retirement and forward-sanity authority (Build 446+)."""
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
require(release == {'environment': 'development', 'release': 446, 'label': 'Build 446'}, 'development-release.json is not exact Build 446 Development authority')
require(not list(ROOT.glob('BUILD*.md')), 'historical BUILD*.md files must not exist in repository root')
require(not (ROOT / 'docs/archive').exists(), 'docs/archive must not ship; Git history is the archive')
require(not (ROOT / 'docs/releases').exists(), 'docs/releases must not ship; current release state belongs in authority documents')
require(not (ROOT / 'tmp').exists(), 'tmp must not ship in the repository')
for junk in ('testfile', 'java.md', 'updated.md'):
    require(not (ROOT / junk).exists(), f'junk placeholder remains: {junk}')

allowed_build_sql = {
    'BUILD440_D1_STRICT_VERIFICATION.sql', 'BUILD440_D1_VERIFICATION.sql',
    'BUILD440_LOT_PROVENANCE_D1_STRICT_VERIFICATION.sql', 'BUILD440_LOT_PROVENANCE_D1_VERIFICATION.sql',
    'BUILD440_RECEIVING_D1_STRICT_VERIFICATION.sql', 'BUILD440_RECEIVING_D1_VERIFICATION.sql',
    'BUILD442_IT_PLATFORM_D1_VERIFICATION.sql', 'BUILD443_HOME_CAROUSEL_D1_VERIFICATION.sql',
}
root_build_sql = {p.name for p in ROOT.glob('BUILD*.sql')}
require(root_build_sql == allowed_build_sql, f'root BUILD SQL differs from current guarded recovery set: {sorted(root_build_sql ^ allowed_build_sql)}')

allowed_incrementals = {
    'database_build440_inventory_receiving_reversal.sql',
    'database_build440_inventory_receiving_source_provenance.sql',
    'database_build440_product_inventory_lot_provenance.sql',
    'database_build440_product_inventory_lot_provenance_d1_trigger_compat.sql',
    'database_build440_product_inventory_lot_provenance_hardening.sql',
    'database_build440_tool_lifecycle_history.sql',
    'database_build442_it_platform_user_access.sql',
    'database_build443_home_carousel.sql',
}
root_incrementals = {p.name for p in ROOT.glob('database_build*.sql')}
require(root_incrementals == allowed_incrementals, f'incremental migration set differs from guarded recovery set: {sorted(root_incrementals ^ allowed_incrementals)}')
require((ROOT / 'database_full_schema.sql').exists(), 'database_full_schema.sql aggregate authority missing')

allowed_scripts = {
    'bake_approved_seo_overrides.py', 'bake_localbusiness_from_d1_export.py', 'bake_localbusiness_jsonld.py',
    'build253_inventory_link_labels_reset_regression.py',
    'build440_apply_development_d1.py', 'build440_cross_mutation_responsive_acceptance_test.py',
    'build440_development_d1_resume_regression_test.py', 'build440_development_d1_runner_regression_test.py',
    'build440_development_inventory_asset_restore.py', 'build440_development_inventory_asset_restore_windows.py',
    'build440_development_tool_lifecycle.py', 'build440_final_verifier_regression_test.py',
    'build440_finished_production_reversal_regression_test.py', 'build440_inventory_asset_parity_regression_test.py',
    'build440_inventory_asset_server_restore_regression_test.py', 'build440_inventory_integrity_review_regression_test.py',
    'build440_inventory_kit_component_depletion_regression_test.mjs', 'build440_inventory_kit_runtime_contract_test.mjs',
    'build440_inventory_receiving_regression_test.py', 'build440_inventory_source_provenance_review_regression_test.py',
    'build440_product_cost_schema_ownership_regression_test.py', 'build440_product_integrity_review_regression_test.py',
    'build440_product_inventory_lot_provenance_regression_test.py', 'build440_product_reference_inspector_regression_test.py',
    'build440_product_resource_persistence_regression_test.mjs', 'build440_public_inventory_authority_regression.py',
    'build440_resource_asset_url_regression_test.mjs', 'build440_resume_development_d1.py',
    'build440_sync_development_release.py', 'build440_sync_full_schema.py', 'build440_sync_lot_provenance_full_schema.py',
    'build440_sync_receiving_full_schema.py', 'build440_tool_lifecycle_regression_test.py',
    'build440_verify_development_d1_final.py', 'build442_apply_development_it_platform.py',
    'build442_cross_mutation_responsive_acceptance_test.py', 'build442_it_platform_migration_regression.py',
    'build443_apply_development_home_carousel.py', 'build443_home_carousel_regression.py',
    'product_inventory_tools_source_gate.py', 'repository_forward_sanity.py',
}
actual_scripts = {p.name for p in (ROOT / 'scripts').iterdir() if p.is_file()}
require(actual_scripts == allowed_scripts, f'scripts directory differs from current executable set: {sorted(actual_scripts ^ allowed_scripts)[:20]}')

active_workflows = sorted(p.name for p in (ROOT / '.github/workflows').glob('build*-system-gate.yml'))
require(active_workflows == ['build446-system-gate.yml'], f'exactly one current system gate is allowed, got {active_workflows}')
require(not list(ROOT.glob('database_build446*.sql')), 'Build 446 must not add a D1 migration')
require(not list(ROOT.glob('BUILD446*.sql')), 'Build 446 must not add D1 verification SQL')

wrangler = (ROOT / 'wrangler.toml').read_text(encoding='utf-8')
for marker in ('name = "devilndove-site-dev"', 'binding = "DB"', 'database_name = "devilndove-dev"', 'binding = "PRODUCT_MEDIA_BUCKET"', 'bucket_name = "devilndove-toolshed-images-dev"', 'binding = "CAIP_PRIVATE_MEDIA_BUCKET"', 'bucket_name = "devilndove-caip-media-dev"'):
    require(marker in wrangler, f'Development infrastructure authority missing: {marker}')
infra = (ROOT / 'functions/api/admin/infrastructure-readiness.js').read_text(encoding='utf-8')
for marker in ('SELECT 1 AS ok', 'sqlite_master', 'bucket.list({ limit: 1 })', 'd1_write: false', 'r2_write: false', 'provider_write: false'):
    require(marker in infra, f'read-only infrastructure contract missing: {marker}')
require('captureRuntimeIncident' not in infra, 'read-only infrastructure readiness must not write incident rows')

version_pattern = re.compile(r'([?&]v=)(\d+)(?:[.-][\w-]+)?(?=["\'&#\s)]|$)')
runtime = list(ROOT.glob('*.html')) + list((ROOT / 'admin').rglob('*.html')) + list((ROOT / 'js').rglob('*.js')) + list((ROOT / 'public/js').rglob('*.js')) + list((ROOT / 'css').rglob('*.css'))
future_versions: list[str] = []
for path in sorted(set(runtime)):
    text = path.read_text(encoding='utf-8')
    for match in version_pattern.finditer(text):
        if int(match.group(2)) > 446:
            future_versions.append(f'{path.relative_to(ROOT)}:{match.group(2)}')
require(not future_versions, f'future cache majors found: {future_versions[:12]}')

print('BUILD 446 DEEP REPOSITORY RETIREMENT / FORWARD SANITY')
print(f'Retained executable scripts: {len(actual_scripts)}')
print(f'Retained guarded incremental migrations: {len(root_incrementals)}')
print(f'Retained guarded verification SQL: {len(root_build_sql)}')
print('Historical documentation archive: GIT HISTORY ONLY')
print('Build 446 new D1 SQL migration: NONE')
print('Production mutation capability: NONE')
if failures:
    for i, failure in enumerate(failures, 1):
        print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('BUILD 446 DEEP REPOSITORY RETIREMENT / FORWARD SANITY: PASS')

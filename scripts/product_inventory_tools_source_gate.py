#!/usr/bin/env python3
"""Canonical local-only Product / Inventory / Tools source gate for the current release.

Historical regression filenames are retained as implementation provenance only. Their
old numeric names do not define current release authority and successful child output is
suppressed so normal System Gate evidence stays release-independent. If a retained
regression fails, its captured output is emitted for diagnosis.

This gate never contacts Cloudflare, D1, R2 or providers.
"""
from __future__ import annotations
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable

STEPS = (
    ('Product material/tool lineage policy', [PYTHON, 'scripts/product_lineage_gate.py']),
    ('linked human-readable Inventory labels', [PYTHON, 'scripts/build253_inventory_link_labels_reset_regression.py']),
    ('Product Resource persistence and normalization', ['node', 'scripts/build440_product_resource_persistence_regression_test.mjs']),
    ('Product Cost schema ownership', [PYTHON, 'scripts/build440_product_cost_schema_ownership_regression_test.py']),
    ('Public Tool Supply Inventory authority', [PYTHON, 'scripts/build440_public_inventory_authority_regression.py']),
    ('Product Delete Reference Inspector', [PYTHON, 'scripts/build440_product_reference_inspector_regression_test.py']),
    ('Resource asset URL safety', ['node', 'scripts/build440_resource_asset_url_regression_test.mjs']),
    ('Inventory asset parity', [PYTHON, 'scripts/build440_inventory_asset_parity_regression_test.py']),
    ('Development Inventory native asset restore', [PYTHON, 'scripts/build440_inventory_asset_server_restore_regression_test.py']),
    ('Product Inventory lot provenance', [PYTHON, 'scripts/build440_product_inventory_lot_provenance_regression_test.py']),
    ('Inventory receiving source provenance', [PYTHON, 'scripts/build440_inventory_receiving_regression_test.py']),
    ('Inventory source provenance review', [PYTHON, 'scripts/build440_inventory_source_provenance_review_regression_test.py']),
    ('Inventory kit component depletion', ['node', 'scripts/build440_inventory_kit_component_depletion_regression_test.mjs']),
    ('Inventory kit D1 runtime contract', ['node', 'scripts/build440_inventory_kit_runtime_contract_test.mjs']),
    ('Finished production reversal', [PYTHON, 'scripts/build440_finished_production_reversal_regression_test.py']),
    ('Inventory integrity review', [PYTHON, 'scripts/build440_inventory_integrity_review_regression_test.py']),
    ('Product integrity review', [PYTHON, 'scripts/build440_product_integrity_review_regression_test.py']),
    ('Tool lifecycle', [PYTHON, 'scripts/build440_tool_lifecycle_regression_test.py']),
)

JS_FILES = (
    'functions/api/_middleware.js',
    'functions/api/admin/_middleware.js',
    'functions/api/_lib/productLineage.js',
    'functions/api/admin/product-lineage.js',
    'public/js/admin-product-lineage.js',
    'functions/api/admin/product-resources.js',
    'functions/api/admin/_productResourcesData.js',
    'functions/api/admin/product-costs.js',
    'functions/api/_lib/inventoryReceiving.js',
    'functions/api/_lib/inventoryReceivingReversal.js',
    'functions/api/_lib/inventoryKitService.js',
    'functions/api/admin/inventory-receiving.js',
    'functions/api/admin/inventory-source-provenance-review.js',
    'functions/api/admin/inventory-kits.js',
    'functions/api/admin/inventory-kit-component-usage.js',
    'functions/api/admin/purchase-orders.js',
    'public/js/admin-inventory-receiving.js',
    'public/js/admin-inventory-receiving-reversal.js',
    'public/js/admin-inventory-source-provenance-review.js',
    'public/js/admin-inventory-kits.js',
    'public/js/admin-inventory-kit-component-usage.js',
    'public/js/admin-delete-product.js',
    'public/js/admin-product-cleanup.js',
    'functions/api/admin/product-resource-search.js',
    'public/js/admin-asset-url-safety.js',
    'public/js/admin-inventory-asset-transport-guard.js',
    'functions/api/admin/inventory-asset-parity.js',
    'functions/api/admin/inventory-asset-restore.js',
    'public/js/admin-inventory-asset-parity.js',
    'functions/api/_lib/productLotProvenance.js',
    'functions/api/admin/product-production-release.js',
    'functions/api/admin/product-production-reversal.js',
    'public/js/admin-product-production-reversal.js',
    'functions/api/admin/inventory-integrity-review.js',
    'public/js/admin-inventory-integrity-review.js',
    'functions/api/admin/product-integrity-review.js',
    'public/js/admin-product-integrity-review.js',
    'functions/api/admin/tool-lifecycle-review.js',
    'public/js/admin-tool-lifecycle-review.js',
    'public/js/admin.js',
    'functions/api/tools.js',
    'functions/api/supplies.js',
)

def run(label: str, args: list[str]) -> None:
    print('\n' + '=' * 60)
    print(label.upper())
    print('=' * 60)
    result = subprocess.run(
        args,
        cwd=ROOT,
        env={**os.environ, 'NO_COLOR': '1', 'FORCE_COLOR': '0'},
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if result.returncode:
        if result.stdout:
            print(result.stdout.rstrip())
        raise SystemExit(f'STOP: {label} failed with exit code {result.returncode}.')
    print('PASS')

def main() -> int:
    print('PRODUCT / INVENTORY / TOOLS CURRENT SOURCE GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE')
    print('Historical regression filenames: PROVENANCE ONLY')
    for label, args in STEPS:
        run(label, list(args))
    for rel in JS_FILES:
        run(f'JavaScript syntax — {rel}', ['node', '--check', rel])
    print('\nPRODUCT / INVENTORY / TOOLS CURRENT SOURCE GATE: PASS')
    print('D1/R2/provider mutation executed by source gate: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())

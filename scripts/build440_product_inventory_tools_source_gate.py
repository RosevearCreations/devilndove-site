#!/usr/bin/env python3
"""Build 440 local-only Product / Inventory / Tools source gate.

Initial Build 440 gate preserves proven Product removal and fractional Inventory authority,
adds the Product Delete Reference Inspector regression, and syntax-checks the touched UI.
It never contacts Cloudflare, D1, R2, or providers.
"""
from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable

STEPS = (
    ('Build 232 product removal baseline', ['node', 'scripts/build232_product_removal_test.mjs']),
    ('Build 244 Inventory fractional authority baseline', [PYTHON, 'scripts/build244_inventory_authority_fractional_usage_regression.py']),
    ('Build 440 Product Delete Reference Inspector regression', [PYTHON, 'scripts/build440_product_reference_inspector_regression_test.py']),
    ('Build 440 delete-product UI JavaScript syntax', ['node', '--check', 'public/js/admin-delete-product.js']),
    ('Build 440 cleanup-centre UI JavaScript syntax', ['node', '--check', 'public/js/admin-product-cleanup.js']),
    ('Tools public API JavaScript syntax baseline', ['node', '--check', 'functions/api/tools.js']),
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
    )
    if result.returncode != 0:
        print(f'STOP: {label} failed with exit code {result.returncode}.', file=sys.stderr)
        raise SystemExit(result.returncode)


def main() -> int:
    print('BUILD 440 PRODUCT / INVENTORY / TOOLS SOURCE GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE')
    print('Schema mutation: NONE in this slice')

    for label, args in STEPS:
        run(label, list(args))

    print('\n' + '=' * 60)
    print('BUILD 440 PRODUCT / INVENTORY / TOOLS SOURCE GATE: PASS')
    print('=' * 60)
    print('Product removal safety baseline: PASS')
    print('Inventory fractional authority baseline: PASS')
    print('Product Delete Reference Inspector: PASS / SOURCE READY')
    print('Protected history deletion authority: UNCHANGED')
    print('Schema migration required for this slice: NO')
    print('Development D1 mutation executed: NO')
    print('Production D1 mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    print('\nNext local review: git diff --check && git status --short')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

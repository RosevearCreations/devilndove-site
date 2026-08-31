#!/usr/bin/env python3
"""Apply/prove the two intentionally narrow raw-D1 guard edits for Release 464.

This script refuses broad reconstruction: it transforms exact known snippets only and
proves the Accounting helper differs from origin/dev solely by the firewall import/getDb
wrapper. It exists to keep business logic byte-for-byte unchanged.
"""
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ACCOUNTING = ROOT / "functions/api/_lib/accounting.js"
PRODUCT_IMAGES = ROOT / "functions/api/admin/product-images.js"

ACCOUNTING_IMPORT = "import { createSchemaSafeD1 } from './schemaSafeD1.js';\n\n"
ACCOUNTING_OLD_GETDB = "export function getDb(env) {\n  return env.DB || env.DD_DB;\n}"
ACCOUNTING_NEW_GETDB = "export function getDb(env) {\n  return createSchemaSafeD1(env.DB || env.DD_DB);\n}"
PRODUCT_IMPORT = "import { createSchemaSafeD1 } from '../_lib/schemaSafeD1.js';\n\n"
PRODUCT_OLD_GETDB = "function getDb(env) {\n  return env.DB || env.DD_DB || null;\n}"
PRODUCT_NEW_GETDB = "function getDb(env) {\n  return createSchemaSafeD1(env.DB || env.DD_DB || null);\n}"


def git_show(ref_path: str) -> str:
    result = subprocess.run(
        ['git', 'show', ref_path], cwd=ROOT, text=True,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False,
    )
    if result.returncode:
        raise SystemExit(f"STOP: cannot read {ref_path}: {result.stderr.strip()}")
    return result.stdout


def accounting_expected() -> str:
    base = git_show('origin/dev:functions/api/_lib/accounting.js')
    if ACCOUNTING_OLD_GETDB not in base:
        raise SystemExit('STOP: origin/dev Accounting getDb contract changed; review manually.')
    return ACCOUNTING_IMPORT + base.replace(ACCOUNTING_OLD_GETDB, ACCOUNTING_NEW_GETDB, 1)


def product_expected(current_or_base: str) -> str:
    text = current_or_base
    if "createSchemaSafeD1" not in text:
        marker = "// together from the admin interface.\n\n"
        if marker not in text:
            raise SystemExit('STOP: product-images header marker changed; review manually.')
        text = text.replace(marker, marker + PRODUCT_IMPORT, 1)
    if PRODUCT_OLD_GETDB in text:
        text = text.replace(PRODUCT_OLD_GETDB, PRODUCT_NEW_GETDB, 1)
    if PRODUCT_NEW_GETDB not in text:
        raise SystemExit('STOP: product-images getDb contract changed; review manually.')
    return text


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()

    expected_accounting = accounting_expected()
    current_accounting = ACCOUNTING.read_text(encoding='utf-8')
    if args.apply and current_accounting != expected_accounting:
        ACCOUNTING.write_text(expected_accounting, encoding='utf-8')
        current_accounting = expected_accounting
    if current_accounting != expected_accounting:
        raise SystemExit('FAIL: Accounting helper contains changes beyond the two approved D1-firewall edits.')

    current_product = PRODUCT_IMAGES.read_text(encoding='utf-8')
    expected_product = product_expected(current_product)
    if args.apply and current_product != expected_product:
        PRODUCT_IMAGES.write_text(expected_product, encoding='utf-8')
        current_product = expected_product
    if current_product != expected_product:
        raise SystemExit('FAIL: product-images still needs the narrow schema-safe D1 wrapper edit.')

    print('RELEASE 464 NARROW DB GUARD: PASS')
    print('Accounting business logic vs origin/dev: UNCHANGED')
    print('Accounting D1 acquisition: GUARDED')
    print('Product images D1 acquisition: GUARDED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

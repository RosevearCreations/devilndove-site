#!/usr/bin/env python3
"""Build 439 local-only source validation and deterministic full-schema sync gate.

Runs the Build 439 CAIP regression, provider fail-closed rerun regression, the
read-only storage-diagnostic regression, synchronizes database_full_schema.sql
deterministically, checks the synchronized aggregate, and reruns the main
regression. This script never contacts Cloudflare, D1, R2 or an external provider.
"""
from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable

STEPS = (
    ('Build 439 CAIP regression', [PYTHON, 'scripts/build439_caip_temporal_evidence_review_test.py']),
    ('Build 439 provider fail-closed rerun regression', [PYTHON, 'scripts/build439_provider_fail_closed_rerun_test.py']),
    ('Build 439 storage diagnostic regression', [PYTHON, 'scripts/build439_storage_diagnostic_regression_test.py']),
    ('Build 439 deterministic full-schema sync', [PYTHON, 'scripts/build439_sync_full_schema.py', '--sync']),
    ('Build 439 deterministic full-schema check', [PYTHON, 'scripts/build439_sync_full_schema.py', '--check']),
    ('Build 439 CAIP regression after full-schema sync', [PYTHON, 'scripts/build439_caip_temporal_evidence_review_test.py']),
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
    print('BUILD 439 SOURCE GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE')
    print('Full-schema mutation scope: local database_full_schema.sql only')

    for label, args in STEPS:
        run(label, list(args))

    print('\n' + '=' * 60)
    print('BUILD 439 SOURCE GATE: PASS')
    print('=' * 60)
    print('Focused migration regression: PASS')
    print('Provider fail-closed rerun regression: PASS')
    print('Storage diagnostic regression: PASS / READ-ONLY')
    print('database_full_schema.sql: SYNCHRONIZED / CHECKED')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Development D1 mutation executed: NO')
    print('Production D1 mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    print('\nNext local review: git diff --check && git status --short && git diff -- database_full_schema.sql')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

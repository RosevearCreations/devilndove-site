#!/usr/bin/env python3
"""Build 412 Development release-candidate local gate.

Runs the durable Commerce checkpoints without contacting Cloudflare.
Production promotion remains fail-closed until explicit Development D1/browser/live
parity gates are supplied separately.
"""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CHECKS = [
    ('scripts/build383_392_commerce_operations_batch_test.py', 'BUILDS 383-392 COMMERCE OPERATIONS BATCH: PASS'),
    ('scripts/build393_402_modularity_parity_batch_test.py', 'BUILDS 393-402 MODULARITY + PARITY BATCH: PASS'),
    ('scripts/build403_410_commerce_modularity_test.py', 'BUILDS 403-410 COMMERCE MODULARITY: PASS'),
]


def run(args):
    return subprocess.run(
        args, cwd=ROOT, text=True, encoding='utf-8', errors='replace',
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False,
    )


def main() -> int:
    branch = run(['git', 'branch', '--show-current'])
    if branch.returncode != 0 or branch.stdout.strip() != 'dev':
        print('BUILD 412 RC GATE: FAIL — current branch must be dev.')
        return 1

    config = (ROOT / 'wrangler.toml').read_text(encoding='utf-8')
    if 'name = "devilndove-site-dev"' not in config or 'database_name = "devilndove-dev"' not in config:
        print('BUILD 412 RC GATE: FAIL — wrangler.toml is not pinned to Development.')
        return 1

    for script, expected in CHECKS:
        print(f'\n=== {script} ===')
        result = run([sys.executable, str(ROOT / script)])
        print(result.stdout, end='' if result.stdout.endswith('\n') else '\n')
        if result.returncode != 0 or expected not in result.stdout:
            print(f'BUILD 412 RC GATE: FAIL — {script}')
            return result.returncode or 1

    required = [
        'database_today_task_actions_runtime_parity.sql',
        'database_membership_tier_policy_runtime_parity.sql',
        'database_customer_documents_runtime_parity.sql',
        'database_accounting_runtime_parity.sql',
        'database_notification_runtime_parity.sql',
        'scripts/build410_apply_development_parity_overlays.py',
        'BUILD393_402_VALIDATION.md',
        'BUILD403_412_VALIDATION.md',
    ]
    missing = [path for path in required if not (ROOT / path).exists()]
    if missing:
        print('BUILD 412 RC GATE: FAIL — missing release artifacts:', ', '.join(missing))
        return 1

    print('\nBUILD 412 DEVELOPMENT RC LOCAL GATE: PASS')
    print('No Cloudflare resource was contacted.')
    print('PRODUCTION PROMOTION: CLOSED — Development D1/browser/live parity gates are still required.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

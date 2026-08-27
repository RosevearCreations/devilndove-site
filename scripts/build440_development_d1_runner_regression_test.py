#!/usr/bin/env python3
"""Build 440 source-only regression for the guarded Development D1 runner."""
from __future__ import annotations

import importlib.util
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / 'scripts/build440_apply_development_d1.py'


def load_runner():
    spec = importlib.util.spec_from_file_location('build440_apply_development_d1', RUNNER)
    if spec is None or spec.loader is None:
        raise RuntimeError('Unable to load guarded Development D1 runner.')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    text = RUNNER.read_text(encoding='utf-8') if RUNNER.exists() else ''
    runner = load_runner() if text else None

    comment_sql = '-- Devil n Dove Build 440 migration\nPRAGMA foreign_keys = ON;'
    command_arg_ok = False
    no_standalone_command_option = False
    if runner is not None:
        with patch.object(runner, 'npx_executable', return_value='npx.cmd'):
            args = runner.build_wrangler_query_args(comment_sql)
        command_args = [arg for arg in args if arg.startswith('--command=')]
        command_arg_ok = len(command_args) == 1 and command_args[0] == f'--command={comment_sql}'
        no_standalone_command_option = '--command' not in args

    checks = [
        ('runner exists', bool(text)),
        ('runner hard-codes Development database', 'DATABASE_NAME = "devilndove-dev"' in text),
        ('runner hard-codes exact Development D1 id', 'dbc1615b-dcbe-4951-973b-b47c99c73bfa' in text),
        ('runner refuses Production targets', 'Production target detected' in text and 'Production mutation capability: NONE' in text),
        ('runner uses Wrangler query command transport', 'f"--command={sql}"' in text and 'D1 query API' in text),
        ('runner binds SQL to --command option so leading SQL comments cannot become CLI options', command_arg_ok and no_standalone_command_option),
        ('runner does not invoke bulk file import', '"--file"' not in text),
        ('runner performs read-only auth probe before mutations', 'build440_development_query_auth_probe' in text and 'auth_probe()' in text),
        ('runner uses SQLite completeness parser for trigger-safe splitting', 'sqlite3.complete_statement' in text),
        ('runner has no automatic retry loop', 'Automatic retries: NONE' in text and 'for attempt' not in text and 'while True' not in text),
        ('runner applies all four lot/receiving migrations', all(name in text for name in (
            'database_build440_product_inventory_lot_provenance.sql',
            'database_build440_product_inventory_lot_provenance_hardening.sql',
            'database_build440_inventory_receiving_source_provenance.sql',
            'database_build440_inventory_receiving_reversal.sql',
        ))),
        ('runner executes all four read-only verification files', all(name in text for name in (
            'BUILD440_LOT_PROVENANCE_D1_VERIFICATION.sql',
            'BUILD440_LOT_PROVENANCE_D1_STRICT_VERIFICATION.sql',
            'BUILD440_RECEIVING_D1_VERIFICATION.sql',
            'BUILD440_RECEIVING_D1_STRICT_VERIFICATION.sql',
        ))),
        ('runner exposes auth-only and verify-only safe modes', '--auth-only' in text and '--verify-only' in text),
    ]
    failures = []
    print('BUILD 440 DEVELOPMENT D1 GUARDED RUNNER REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE\n')
    for index, (label, ok) in enumerate(checks, 1):
        print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
        if not ok:
            failures.append(label)
    if failures:
        print(f'\nFAIL ({len(failures)}/{len(checks)} failed)')
        for failure in failures:
            print(' -', failure)
        return 1
    print(f'\nPASS ({len(checks)}/{len(checks)})')
    print('Remote execution transport: QUERY / --command=<SQL> / NO BULK IMPORT')
    print('Leading SQL comment argument ambiguity: REGRESSED / BLOCKED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

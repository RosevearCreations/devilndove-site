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

    command_arg_ok = False
    no_standalone_command_option = False
    leading_comment_stripped = False
    pragma_skipped = False
    interior_double_dash_preserved = False
    all_files_preflight = False
    migration_pragma_skip_count = False
    trigger_uppercase_guard = False
    smoke_shape_ok = False
    smoke_before_real_migrations = False

    if runner is not None:
        normalized, reason = runner.normalize_remote_statement(
            '-- Build 440 comment\n-- second comment\nCREATE TABLE IF NOT EXISTS x(id INTEGER);'
        )
        leading_comment_stripped = normalized == 'CREATE TABLE IF NOT EXISTS x(id INTEGER);' and reason is None

        pragma_sql, pragma_reason = runner.normalize_remote_statement(
            '-- Build 440 comment\nPRAGMA foreign_keys = ON;'
        )
        pragma_skipped = pragma_sql is None and pragma_reason == 'D1 already enforces foreign keys'

        string_sql = "INSERT INTO x(id) SELECT 1 WHERE '-- preserved inside string' <> '';"
        normalized_string, _ = runner.normalize_remote_statement(string_sql)
        interior_double_dash_preserved = normalized_string == string_sql

        with patch.object(runner, 'npx_executable', return_value='npx.cmd'):
            args = runner.build_wrangler_query_args('CREATE TABLE IF NOT EXISTS x(id INTEGER);')
        command_args = [arg for arg in args if arg.startswith('--command=')]
        command_arg_ok = len(command_args) == 1 and command_args[0] == '--command=CREATE TABLE IF NOT EXISTS x(id INTEGER);'
        no_standalone_command_option = '--command' not in args

        try:
            skip_count = 0
            trigger_ok = True
            for filename in (*runner.MIGRATIONS, *runner.VERIFICATIONS):
                prepared, skipped = runner.prepared_remote_statements(filename)
                if not prepared:
                    raise AssertionError(f'no prepared statements for {filename}')
                if filename in runner.MIGRATIONS:
                    skip_count += sum('D1 already enforces foreign keys' in item for item in skipped)
                for statement in prepared:
                    if statement.lstrip().upper().startswith('CREATE TRIGGER'):
                        trigger_ok = trigger_ok and ('BEGIN' in statement) and ('END;' in statement)
            all_files_preflight = True
            migration_pragma_skip_count = skip_count == 4
            trigger_uppercase_guard = trigger_ok
        except SystemExit:
            all_files_preflight = False

        smoke_calls = []
        def capture_query(sql, label):
            smoke_calls.append((sql, label))
        with patch.object(runner, 'run_query', side_effect=capture_query):
            runner.transport_smoke_probe()
        smoke_sql = [sql for sql, _ in smoke_calls]
        smoke_shape_ok = (
            len(smoke_sql) == 8
            and smoke_sql[0] == f'DROP TRIGGER IF EXISTS {runner.SMOKE_TRIGGER};'
            and smoke_sql[1] == f'DROP TABLE IF EXISTS {runner.SMOKE_TABLE};'
            and smoke_sql[2].startswith(f'CREATE TABLE {runner.SMOKE_TABLE}')
            and smoke_sql[3].startswith(f'CREATE TRIGGER {runner.SMOKE_TRIGGER}')
            and ' BEGIN ' in smoke_sql[3]
            and smoke_sql[4].startswith(f'INSERT INTO {runner.SMOKE_TABLE}')
            and 'build440_query_transport_smoke' in smoke_sql[5]
            and smoke_sql[6] == f'DROP TRIGGER IF EXISTS {runner.SMOKE_TRIGGER};'
            and smoke_sql[7] == f'DROP TABLE IF EXISTS {runner.SMOKE_TABLE};'
        )

        main_source = text[text.find('def main()'):]
        smoke_before_real_migrations = (
            main_source.find('transport_smoke_probe()') >= 0
            and main_source.find('for filename in MIGRATIONS') >= 0
            and main_source.find('transport_smoke_probe()') < main_source.find('for filename in MIGRATIONS')
        )

    checks = [
        ('runner exists', bool(text)),
        ('runner hard-codes Development database', 'DATABASE_NAME = "devilndove-dev"' in text),
        ('runner hard-codes exact Development D1 id', 'dbc1615b-dcbe-4951-973b-b47c99c73bfa' in text),
        ('runner refuses Production targets', 'Production target detected' in text and 'Production mutation capability: NONE' in text),
        ('runner uses Wrangler query command transport', 'f"--command={sql}"' in text and 'D1 query API' in text),
        ('runner binds SQL to --command option', command_arg_ok and no_standalone_command_option),
        ('runner strips leading SQL comments before remote transport', leading_comment_stripped),
        ('runner skips redundant PRAGMA foreign_keys = ON for D1', pragma_skipped),
        ('runner preserves -- text inside SQL string bodies', interior_double_dash_preserved),
        ('all migration and verification files preflight under D1 remote normalization', all_files_preflight),
        ('exactly four migration foreign-key pragmas are deliberately skipped', migration_pragma_skip_count),
        ('remote trigger statements pass uppercase BEGIN/END guard', trigger_uppercase_guard),
        ('runner blocks explicit transaction control', 'Refusing explicit transaction-control statement' in text),
        ('runner guards Windows command length', 'WINDOWS_SAFE_COMMAND_LIMIT' in text),
        ('runner performs disposable DDL + trigger transport smoke', smoke_shape_ok),
        ('remote transport smoke runs before first real migration', smoke_before_real_migrations),
        ('runner exposes transport-smoke-only safe mode', '--transport-smoke-only' in text),
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
    print('Remote execution transport: QUERY / NORMALIZED SQL / --command=<SQL> / NO BULK IMPORT')
    print('Leading SQL comments: STRIPPED')
    print('PRAGMA foreign_keys = ON: SKIPPED / D1 DEFAULT ENFORCEMENT')
    print('Remote DDL + trigger transport: DISPOSABLE SMOKE REQUIRED BEFORE MIGRATIONS')
    print('Remote trigger casing: GUARDED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

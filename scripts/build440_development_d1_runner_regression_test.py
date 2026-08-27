#!/usr/bin/env python3
"""Build 440 source-only regression for the guarded Development D1 runner."""
from __future__ import annotations

import importlib.util
import sqlite3
import subprocess
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

    multiline_flattened = False
    quoted_comment_preserved = False
    pragma_skipped = False
    all_files_final_transport_safe = False
    migration_pragma_skip_count = False
    trigger_uppercase_guard = False
    exact_first_statement_guard = False
    exact_first_cli_safe = False
    command_ceiling_guard = False
    smoke_shape_ok = False
    smoke_before_real_migrations = False
    multiline_literal_rejected = False

    if runner is not None:
        raw_multiline = '''
        -- Build 440 comment
        CREATE TABLE IF NOT EXISTS x (
          id INTEGER PRIMARY KEY,
          note TEXT NOT NULL DEFAULT '-- preserved string text'
        );
        '''
        normalized, reason = runner.normalize_remote_statement(raw_multiline)
        multiline_flattened = (
            reason is None
            and normalized == "CREATE TABLE IF NOT EXISTS x ( id INTEGER PRIMARY KEY, note TEXT NOT NULL DEFAULT '-- preserved string text' );"
            and '\n' not in normalized
            and '\r' not in normalized
            and sqlite3.complete_statement(normalized)
        )
        quoted_comment_preserved = normalized is not None and "'-- preserved string text'" in normalized

        pragma_sql, pragma_reason = runner.normalize_remote_statement(
            '-- Build 440 comment\nPRAGMA foreign_keys = ON;'
        )
        pragma_skipped = pragma_sql is None and pragma_reason == 'D1 already enforces foreign keys'

        try:
            runner.normalize_remote_statement("INSERT INTO x(note) VALUES('line one\nline two');")
        except SystemExit:
            multiline_literal_rejected = True

        try:
            skip_count = 0
            trigger_ok = True
            final_safe = True
            first_statement = None
            for filename in (*runner.MIGRATIONS, *runner.VERIFICATIONS):
                prepared, skipped = runner.prepared_remote_statements(filename)
                if not prepared:
                    raise AssertionError(f'no prepared statements for {filename}')
                if filename in runner.MIGRATIONS:
                    skip_count += sum('D1 already enforces foreign keys' in item for item in skipped)
                if filename == runner.MIGRATIONS[0]:
                    first_statement = prepared[0]
                for statement in prepared:
                    final_safe = final_safe and '\n' not in statement and '\r' not in statement
                    final_safe = final_safe and sqlite3.complete_statement(statement)
                    with patch.object(runner, 'npx_executable', return_value='npx.cmd'):
                        args = runner.build_wrangler_query_args(statement)
                    command_arg = next((arg for arg in args if arg.startswith('--command=')), '')
                    final_safe = final_safe and command_arg == f'--command={statement}'
                    final_safe = final_safe and '\n' not in command_arg and '\r' not in command_arg
                    final_safe = final_safe and len(subprocess.list2cmdline(args)) <= runner.WINDOWS_SAFE_COMMAND_LINE_LIMIT
                    if statement.lstrip().upper().startswith('CREATE TRIGGER'):
                        trigger_ok = trigger_ok and ('BEGIN' in statement) and ('END;' in statement)
            all_files_final_transport_safe = final_safe
            migration_pragma_skip_count = skip_count == 4
            trigger_uppercase_guard = trigger_ok
            exact_first_statement_guard = bool(first_statement) and (
                first_statement.startswith('CREATE TABLE IF NOT EXISTS product_production_run_material_lots (')
                and first_statement.endswith(');')
                and 'FOREIGN KEY(site_item_inventory_id)' in first_statement
                and sqlite3.complete_statement(first_statement)
                and '\n' not in first_statement
            )
            if first_statement:
                with patch.object(runner, 'npx_executable', return_value='npx.cmd'):
                    first_args = runner.build_wrangler_query_args(first_statement)
                first_command = next((arg for arg in first_args if arg.startswith('--command=')), '')
                exact_first_cli_safe = (
                    first_command == f'--command={first_statement}'
                    and '\n' not in first_command
                    and '\r' not in first_command
                    and len(subprocess.list2cmdline(first_args)) <= runner.WINDOWS_SAFE_COMMAND_LINE_LIMIT
                )
        except SystemExit:
            all_files_final_transport_safe = False

        try:
            with patch.object(runner, 'npx_executable', return_value='npx.cmd'):
                runner.build_wrangler_query_args('SELECT 1;' + ('x' * runner.WINDOWS_SAFE_COMMAND_LINE_LIMIT))
        except SystemExit:
            command_ceiling_guard = True

        smoke_calls = []
        def capture_query(sql, label):
            smoke_calls.append((sql, label))
        with patch.object(runner, 'run_query', side_effect=capture_query):
            runner.transport_smoke_probe()
        smoke_sql = [sql for sql, _ in smoke_calls]
        smoke_shape_ok = (
            len(smoke_sql) == 12
            and all('\n' not in sql and '\r' not in sql and sqlite3.complete_statement(sql) for sql in smoke_sql)
            and smoke_sql[0] == f'DROP TRIGGER IF EXISTS {runner.SMOKE_TRIGGER};'
            and smoke_sql[1] == f'DROP TABLE IF EXISTS {runner.SMOKE_TABLE};'
            and smoke_sql[2] == f'DROP TABLE IF EXISTS {runner.SMOKE_PARENT_TABLE};'
            and smoke_sql[3].startswith(f'CREATE TABLE {runner.SMOKE_PARENT_TABLE} (')
            and smoke_sql[4].startswith(f'CREATE TABLE {runner.SMOKE_TABLE} (')
            and 'FOREIGN KEY(parent_id)' in smoke_sql[4]
            and "'-- preserved string text'" in smoke_sql[4]
            and smoke_sql[5].startswith(f'CREATE TRIGGER {runner.SMOKE_TRIGGER}')
            and ' BEGIN ' in smoke_sql[5]
            and 'build440_query_transport_smoke' in smoke_sql[8]
            and smoke_sql[-2] == f'DROP TABLE IF EXISTS {runner.SMOKE_TABLE};'
            and smoke_sql[-1] == f'DROP TABLE IF EXISTS {runner.SMOKE_PARENT_TABLE};'
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
        ('multiline SQL is flattened to one complete physical command line', multiline_flattened),
        ('SQL comment markers inside quoted string data are preserved', quoted_comment_preserved),
        ('multiline quoted literals are refused at the batch transport boundary', multiline_literal_rejected),
        ('redundant PRAGMA foreign_keys = ON is skipped for D1', pragma_skipped),
        ('all migration and verification statements are final-transport complete and single-line', all_files_final_transport_safe),
        ('exactly four migration foreign-key pragmas are deliberately skipped', migration_pragma_skip_count),
        ('remote trigger statements pass uppercase BEGIN/END guard', trigger_uppercase_guard),
        ('exact first lot-provenance statement is the complete expected table definition', exact_first_statement_guard),
        ('exact first lot-provenance Wrangler argument is newline-free and within Windows limit', exact_first_cli_safe),
        ('runner enforces full Windows batch-wrapper command-line ceiling', command_ceiling_guard),
        ('representative multiline DDL/FK/trigger smoke is normalized through same path', smoke_shape_ok),
        ('remote transport smoke runs before first real migration', smoke_before_real_migrations),
        ('runner blocks explicit transaction control', 'Refusing explicit transaction-control statement' in text),
        ('runner exposes transport-smoke-only safe mode', '--transport-smoke-only' in text),
        ('runner does not invoke bulk file import', '"--file"' not in text),
        ('runner performs read-only auth probe before mutations', 'build440_development_query_auth_probe' in text and 'auth_probe()' in text),
        ('runner uses SQLite completeness parser before and after normalization', text.count('sqlite3.complete_statement') >= 3),
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
    print('BUILD 440 DEVELOPMENT D1 FINAL TRANSPORT REGRESSION')
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
    print('Remote execution transport: QUERY / SINGLE-LINE SQL / NO BULK IMPORT')
    print('Windows npx.cmd multiline argument exposure: BLOCKED')
    print('Exact first migration statement: REGRESSED / COMPLETE')
    print('Remote DDL + FK + trigger transport: REPRESENTATIVE DISPOSABLE SMOKE REQUIRED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

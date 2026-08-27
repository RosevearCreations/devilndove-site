#!/usr/bin/env python3
"""Source-only regression for the Build 440 Development final D1 verifier."""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERIFIER_PATH = ROOT / 'scripts/build440_verify_development_d1_final.py'


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f'Unable to load {path}.')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    text = VERIFIER_PATH.read_text(encoding='utf-8') if VERIFIER_PATH.exists() else ''
    verifier = load_module(VERIFIER_PATH, 'build440_verify_development_d1_final') if text else None
    checks = []

    def check(condition: bool, label: str) -> None:
        checks.append((label, bool(condition)))

    check(bool(text), 'final verifier exists')
    check('Schema/data mutation: NONE' in text, 'final verifier declares no D1 schema/data mutation')
    check('Production mutation capability: NONE' in text, 'final verifier is Development-only')
    check('LIKE/GLOB verification patterns: BLOCKED' in text, 'LIKE/GLOB verification is explicitly blocked')
    check('Percent-pattern Windows transport: BLOCKED' in text, 'percent-pattern Windows transport is explicitly blocked')
    check('Database migrations replayed: NONE' in text, 'final verifier never replays migrations')
    check('INSERT INTO ' not in text.upper() and 'UPDATE ' not in text.upper() and 'DELETE FROM ' not in text.upper() and 'CREATE TABLE ' not in text.upper() and 'DROP TABLE ' not in text.upper(), 'final verifier source contains no mutation SQL')

    if verifier is not None:
        all_pattern_free = True
        total = 0
        for filename in verifier.VERIFICATIONS:
            statements, skipped = verifier.runner.prepared_remote_statements(filename)
            all_pattern_free = all_pattern_free and not skipped
            for statement in statements:
                total += 1
                all_pattern_free = all_pattern_free and '%' not in statement
                all_pattern_free = all_pattern_free and re.search(r'\b(?:LIKE|GLOB)\b', statement, flags=re.I) is None
        check(all_pattern_free and total > 0, 'all final remote verification statements are LIKE/GLOB/percent-pattern free')
        snapshot_parts = []
        original_run_query = verifier.runner.run_query
        try:
            verifier.runner.run_query = lambda sql, label: snapshot_parts.append((sql, label))
            verifier.state_snapshot()
        finally:
            verifier.runner.run_query = original_run_query
        snapshot_ok = (
            len(snapshot_parts) == 1
            and '%' not in snapshot_parts[0][0]
            and re.search(r'\b(?:LIKE|GLOB)\b', snapshot_parts[0][0], flags=re.I) is None
            and "build440_tables" in snapshot_parts[0][0]
            and "build440_ledgers" in snapshot_parts[0][0]
        )
        check(snapshot_ok, 'final state snapshot is read-only and pattern-free')
    else:
        check(False, 'all final remote verification statements are LIKE/GLOB/percent-pattern free')
        check(False, 'final state snapshot is read-only and pattern-free')

    failures = [label for label, ok in checks if not ok]
    print('BUILD 440 FINAL DEVELOPMENT D1 VERIFIER REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE\n')
    for index, (label, ok) in enumerate(checks, 1):
        print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
    if failures:
        print(f'\nFAIL ({len(failures)}/{len(checks)} failed)')
        for failure in failures:
            print(' -', failure)
        return 1
    print(f'\nPASS ({len(checks)}/{len(checks)})')
    print('Migration replay: NONE')
    print('Remote verification patterns: INSTR/EXACT ONLY')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

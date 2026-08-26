#!/usr/bin/env python3
"""Local-only regression for Build 438 Development helper console/query safety."""
from __future__ import annotations

import importlib.util
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'scripts' / 'build438_development_module_activation.py'
STRICT_VERIFY = ROOT / 'BUILD438_D1_STRICT_VERIFICATION.sql'

spec = importlib.util.spec_from_file_location('build438_dev_helper', HELPER)
if spec is None or spec.loader is None:
    raise SystemExit('FAIL: could not load Build 438 Development helper')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
source = HELPER.read_text(encoding='utf-8')
strict_sql = STRICT_VERIFY.read_text(encoding='utf-8') if STRICT_VERIFY.exists() else ''


class Cp1252Probe:
    encoding = 'cp1252'

    def __init__(self) -> None:
        self.parts: list[str] = []

    def write(self, value: str) -> int:
        value.encode(self.encoding, errors='strict')
        self.parts.append(value)
        return len(value)

    def flush(self) -> None:
        return None


probe = Cp1252Probe()
module.emit_output('Wrangler ✓ — authenticated 😀', stream=probe)
rendered = ''.join(probe.parts)

conn = sqlite3.connect(':memory:')
try:
    conn.executescript('''
      CREATE TABLE app_modules (
        module_key TEXT PRIMARY KEY,
        is_enabled INTEGER NOT NULL,
        background_activity_enabled INTEGER NOT NULL
      );
      CREATE TABLE app_module_role_access (
        module_key TEXT NOT NULL,
        role_code TEXT NOT NULL,
        PRIMARY KEY (module_key, role_code)
      );
      CREATE INDEX idx_app_modules_enabled_priority ON app_modules(is_enabled, module_key);
      CREATE INDEX idx_app_module_role_access_role ON app_module_role_access(role_code, module_key);
      INSERT INTO app_modules(module_key,is_enabled,background_activity_enabled) VALUES
        ('business-administration',1,0),
        ('commerce-operations',1,0),
        ('creative-production',1,0);
      INSERT INTO app_module_role_access(module_key,role_code) VALUES
        ('business-administration','admin'),
        ('business-administration','member'),
        ('commerce-operations','admin'),
        ('commerce-operations','member'),
        ('creative-production','admin'),
        ('creative-production','member');
    ''')
    strict_row = conn.execute(strict_sql).fetchone()
    conn.execute("UPDATE app_modules SET is_enabled=0 WHERE module_key='creative-production'")
    strict_mismatch_failed = False
    try:
        conn.execute(strict_sql).fetchone()
    except sqlite3.DatabaseError:
        strict_mismatch_failed = True
finally:
    conn.close()

file_args = module.file_command(module.STRICT_VERIFY)
upper_sql = strict_sql.upper()
checks = [
    ('emit_output helper exists', callable(getattr(module, 'emit_output', None))),
    ('CP1252 probe received output', bool(rendered)),
    ('unsupported Unicode was replaced safely', '?' in rendered),
    ('captured subprocess path remains UTF-8 decoded', "encoding='utf-8'" in source),
    ('subprocess decoding uses replacement protection', "errors='replace'" in source),
    ('strict verification uses file transport and no command-line SQL', '--file' in file_args and '--command' not in source),
    ('strict SQL is read-only', not any(token in upper_sql for token in ('INSERT INTO', 'UPDATE ', 'DELETE FROM', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE'))),
    ('strict SQL self-assertion passes exact module state locally', strict_row == (1,)),
    ('strict SQL self-assertion fails a mismatched module state locally', strict_mismatch_failed),
    ('bare D1 code 7500 is not classified as authorization', "'7500' in lower" not in source and "'sqlite_error' in lower" in source),
]

failures = []
for index, (label, ok) in enumerate(checks, 1):
    print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
    if not ok:
        failures.append(label)

print()
if failures:
    print(f'BUILD 438 DEVELOPMENT HELPER CONSOLE/STRICT QUERY TEST: FAIL ({len(failures)}/{len(checks)} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 438 DEVELOPMENT HELPER CONSOLE/STRICT QUERY TEST: PASS ({len(checks)}/{len(checks)})')
print('Windows CP1252 UnicodeEncodeError path: PREVENTED')
print('Windows npx.cmd --command SQL transport: REMOVED')
print('Strict D1 verification transport: FILE-BASED / SELF-ASSERTING')
print('Strict mismatch behavior: FAILS CLOSED')
print('D1 7500 SQLite error misclassification: PREVENTED')
print('Cloudflare/D1 access: NONE')

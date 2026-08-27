#!/usr/bin/env python3
"""Source/local SQLite regression for Build 440 Development D1 partial-apply resume."""
from __future__ import annotations

import importlib.util
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNNER_PATH = ROOT / 'scripts/build440_apply_development_d1.py'
RESUME_PATH = ROOT / 'scripts/build440_resume_development_d1.py'
COMPAT_PATH = ROOT / 'database_build440_product_inventory_lot_provenance_d1_trigger_compat.sql'


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f'Unable to load {path.name}')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    runner = load_module('build440_apply_development_d1', RUNNER_PATH)
    resume = load_module('build440_resume_development_d1', RESUME_PATH)
    compat_sql = COMPAT_PATH.read_text(encoding='utf-8')

    checks: list[str] = []
    def check(condition: bool, label: str) -> None:
        if not condition:
            raise AssertionError(label)
        checks.append(label)
        print(f'{len(checks):02d}. PASS — {label}')

    print('BUILD 440 DEVELOPMENT D1 PARTIAL-APPLY RESUME REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE\n')

    base, _ = runner.prepared_remote_statements(resume.BASE)
    hardening, _ = runner.prepared_remote_statements(resume.HARDENING)
    compat, compat_skipped = runner.prepared_remote_statements(resume.COMPAT)

    base_superseded = [s for s in base if resume.is_superseded_trigger_statement(s)]
    hardening_superseded = [s for s in hardening if resume.is_superseded_trigger_statement(s)]
    compat_creates = [s for s in compat if s.upper().startswith('CREATE TRIGGER ')]

    check(len(base_superseded) == 6, 'resume bypasses all six legacy base DROP/CREATE trigger statements')
    check(len(hardening_superseded) == 8, 'resume bypasses all eight hardening DROP/CREATE trigger statements')
    check(len(compat_creates) == 4, 'compatibility migration creates exactly four final commitment triggers')
    check(all('SELECT CASE' not in s.upper() for s in compat_creates), 'final trigger bodies contain no ambiguous SELECT CASE / inner END form')
    check(all('SELECT RAISE' in s.upper() for s in compat_creates), 'final commitment guards preserve explicit SQLite RAISE enforcement')
    check(any('D1 already enforces foreign keys' in item for item in compat_skipped), 'compatibility migration PRAGMA is deliberately skipped remotely')
    check('Production mutation capability: NONE' in RESUME_PATH.read_text(encoding='utf-8'), 'resume runner remains Development-only')
    check('Automatic retries: NONE' in RESUME_PATH.read_text(encoding='utf-8'), 'resume runner has no automatic retry behavior')

    # Execute the compatibility migration against a minimal SQLite fixture and exercise the
    # same oversell guard semantics expected in Development D1.
    conn = sqlite3.connect(':memory:')
    conn.execute('PRAGMA foreign_keys=ON')
    conn.executescript('''
    CREATE TABLE app_settings(setting_key TEXT PRIMARY KEY,setting_value TEXT,is_public INTEGER DEFAULT 0);
    CREATE TABLE schema_migration_ledger(
      migration_key TEXT PRIMARY KEY,file_name TEXT,checksum TEXT,status TEXT,destructive INTEGER,
      applied_at TEXT,notes TEXT,created_at TEXT,updated_at TEXT
    );
    CREATE TABLE products(
      product_id INTEGER PRIMARY KEY,inventory_tracking INTEGER DEFAULT 0,inventory_quantity REAL DEFAULT 0
    );
    CREATE TABLE orders(
      order_id INTEGER PRIMARY KEY,order_status TEXT,created_at TEXT,updated_at TEXT
    );
    CREATE TABLE order_items(
      order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER NOT NULL,product_id INTEGER,quantity INTEGER NOT NULL
    );
    CREATE TABLE order_status_history(
      order_status_history_id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER,old_status TEXT,new_status TEXT,
      changed_by_user_id INTEGER,note TEXT,created_at TEXT
    );
    CREATE VIEW product_inventory_active_commitments AS
    SELECT oi.product_id,COALESCE(SUM(oi.quantity),0) AS committed_quantity
    FROM order_items oi INNER JOIN orders o ON o.order_id=oi.order_id
    WHERE LOWER(COALESCE(o.order_status,'pending')) IN ('pending','paid','fulfilled','refunded')
    GROUP BY oi.product_id;
    ''')
    conn.execute("INSERT INTO app_settings(setting_key,setting_value,is_public) VALUES('site.product.finished_lot_provenance_cutover_at','2000-01-01',0)")
    conn.executescript(compat_sql)

    trigger_rows = conn.execute(
        "SELECT name,sql FROM sqlite_master WHERE type='trigger' AND name LIKE '%build440_inventory_commit_guard%' ORDER BY name"
    ).fetchall()
    check(len(trigger_rows) == 4, 'compatibility migration installs all four triggers in SQLite')
    check(all('SELECT CASE' not in (row[1] or '').upper() for row in trigger_rows), 'installed trigger SQL contains no inner CASE/END splitter ambiguity')

    conn.execute("INSERT INTO products(product_id,inventory_tracking,inventory_quantity) VALUES(1,1,1)")
    conn.execute("INSERT INTO orders(order_id,order_status,created_at,updated_at) VALUES(1,'pending','2099-01-01','2099-01-01')")
    blocked = False
    try:
        conn.execute("INSERT INTO order_items(order_id,product_id,quantity) VALUES(1,1,2)")
    except sqlite3.IntegrityError as exc:
        blocked = 'build440_finished_inventory_commitment_exceeds_available' in str(exc)
    check(blocked, 'D1-compatible insert trigger still blocks finished-inventory oversell')
    check(conn.execute("SELECT order_status FROM orders WHERE order_id=1").fetchone()[0] == 'cancelled', 'oversell still leaves parent order safely cancelled')
    check(conn.execute("SELECT COUNT(*) FROM order_status_history WHERE order_id=1 AND new_status='cancelled'").fetchone()[0] == 1, 'oversell cancellation still leaves status-history evidence')

    source = RESUME_PATH.read_text(encoding='utf-8')
    hardening_pos = source.find('apply_file(HARDENING, skip_superseded_triggers=True)')
    compat_pos = source.find('apply_file(COMPAT)')
    receiving_pos = source.find('for filename in RECEIVING')
    check(0 <= hardening_pos < compat_pos < receiving_pos, 'resume installs final compatible triggers after hardening and before receiving')

    print(f'\nBUILD 440 DEVELOPMENT D1 PARTIAL-APPLY RESUME REGRESSION: PASS ({len(checks)}/{len(checks)})')
    print('Legacy CASE/END remote trigger transport: BYPASSED')
    print('Final D1 trigger authority: COMPATIBILITY MIGRATION')
    print('Development database target: GUARDED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

#!/usr/bin/env python3
"""Release 463 D1 clone transport shim.

The base controller safely clones schema/data/views/indexes through the D1 Query API.
Cloudflare's Query API rejects the exported trigger batch with `incomplete input` even
though the same trigger definitions validate in SQLite. Route only trigger DDL through
Wrangler's proven `d1 execute --file` transport, retaining the base controller's
Time Travel rollback and parity checks.
"""
from __future__ import annotations

import pathlib
import subprocess

import release463_d1_api_clone as base

_original_execute_chunked = base.execute_chunked


def execute_chunked(database_id: str, label: str, statements: list[str]):
    if label != "triggers":
        return _original_execute_chunked(database_id, label, statements)

    if database_id != base.TARGET_ID:
        raise AssertionError(f"Trigger transport refused unexpected database id: {database_id}")
    if not statements:
        return 0

    sql_path = pathlib.Path("/tmp/release463-triggers.sql")
    config_path = pathlib.Path("/tmp/release463-target-wrangler.toml")
    sql_path.write_text(
        "\n\n".join(statement.rstrip().rstrip(";") + ";" for statement in statements) + "\n",
        encoding="utf-8",
    )
    config_path.write_text(
        "\n".join([
            'name = "release463-d1-clone"',
            'compatibility_date = "2026-04-08"',
            'pages_build_output_dir = "."',
            '',
            '[[d1_databases]]',
            'binding = "DB"',
            f'database_name = "{base.TARGET_DB}"',
            f'database_id = "{base.TARGET_ID}"',
            '',
        ]),
        encoding="utf-8",
    )

    subprocess.run(
        [
            "npx", "--yes", "wrangler@4", "d1", "execute", base.TARGET_DB,
            "--remote", "--config", str(config_path), "--file", str(sql_path),
        ],
        check=True,
    )
    print(f"triggers: Wrangler file transport PASS statements={len(statements)}", flush=True)
    return 1


base.execute_chunked = execute_chunked

if __name__ == "__main__":
    base.main()

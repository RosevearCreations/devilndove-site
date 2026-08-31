#!/usr/bin/env python3
"""Fail if Cloudflare runtime source contains executable SQL DDL strings.

Schema is repository migration-owned. A Functions request handler/library may inspect
schema with sqlite_master/PRAGMA, but it may not carry CREATE/ALTER/DROP/VACUUM/REINDEX
statements that could mutate schema at request time.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FUNCTIONS = ROOT / "functions"
FAIL: list[tuple[str, int, str]] = []

# Match SQL schema mutation appearing inside a JS quoted/template string. The prefix
# must be a string delimiter so documentation comments and identifier names do not count.
DDL = re.compile(
    r"(?P<quote>[`\"'])\s*(?P<sql>(?:CREATE\s+(?:TABLE|INDEX|TRIGGER|VIEW)|ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW)|VACUUM\b|REINDEX\b))",
    re.IGNORECASE | re.MULTILINE,
)

# Dynamic template strings sometimes begin with a comment/newline before the DDL.
DDL_AFTER_NEWLINE = re.compile(
    r"`(?:\s|--[^\n]*\n|/\*.*?\*/)*(?P<sql>(?:CREATE\s+(?:TABLE|INDEX|TRIGGER|VIEW)|ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW)|VACUUM\b|REINDEX\b))",
    re.IGNORECASE | re.MULTILINE | re.DOTALL,
)

for path in sorted(FUNCTIONS.rglob("*.js")):
    text = path.read_text(encoding="utf-8", errors="replace")
    matches = list(DDL.finditer(text)) + list(DDL_AFTER_NEWLINE.finditer(text))
    seen: set[tuple[int, str]] = set()
    for match in matches:
        sql = re.sub(r"\s+", " ", match.group("sql")).strip().upper()
        line = text.count("\n", 0, match.start()) + 1
        key = (line, sql)
        if key in seen:
            continue
        seen.add(key)
        FAIL.append((path.relative_to(ROOT).as_posix(), line, sql))

print("RUNTIME SCHEMA MUTATION GATE")
print(f"Runtime JS files scanned: {sum(1 for _ in FUNCTIONS.rglob('*.js'))}")
if FAIL:
    print("RUNTIME SCHEMA MUTATION GATE: FAIL")
    for index, (path, line, sql) in enumerate(FAIL, 1):
        print(f"{index:03d}. {path}:{line} — {sql}")
    raise SystemExit(1)

print("RUNTIME SCHEMA MUTATION GATE: PASS")
print("Request-time CREATE/ALTER/DROP/VACUUM/REINDEX: ZERO")
print("Schema inspection with PRAGMA/sqlite_master: ALLOWED READ-ONLY")
print("Schema change authority: migrations/canonical + scripts/d1_migrate.py")

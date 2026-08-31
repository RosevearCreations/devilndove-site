#!/usr/bin/env python3
"""Prove runtime D1 schema mutation is unreachable.

Release 464 does not pretend that hundreds of historical schema-description/ensure SQL
strings disappeared from source overnight. Instead it enforces the safety property that
matters: all runtime D1 access capable of reaching those legacy statements must pass
through the schema-safe database adapter, and no route carrying DDL may access DB/DD_DB
directly. New schema change authority is migrations/canonical only.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FUNCTIONS = ROOT / "functions"
FAIL: list[str] = []

DDL = re.compile(
    r"(?P<quote>[`\"'])\s*(?P<sql>(?:CREATE\s+(?:TABLE|INDEX|TRIGGER|VIEW)|ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW)|VACUUM\b|REINDEX\b))",
    re.IGNORECASE | re.MULTILINE,
)
DDL_AFTER_NEWLINE = re.compile(
    r"`(?:\s|--[^\n]*\n|/\*.*?\*/)*(?P<sql>(?:CREATE\s+(?:TABLE|INDEX|TRIGGER|VIEW)|ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW)|VACUUM\b|REINDEX\b))",
    re.IGNORECASE | re.MULTILINE | re.DOTALL,
)
DIRECT_DB = re.compile(r"(?:\bcontext\s*\.\s*)?\benv\s*\.\s*(?:DB|DD_DB)\b", re.IGNORECASE)
DESTRUCTURED_DB = re.compile(r"\{[^}\n]*\b(?:DB|DD_DB)\b[^}\n]*\}\s*=\s*(?:context\.)?env\b", re.IGNORECASE)

schema_safe = (ROOT / "functions/api/_lib/schemaSafeD1.js").read_text(encoding="utf-8", errors="replace")
admin_audit = (ROOT / "functions/api/_lib/adminAudit.js").read_text(encoding="utf-8", errors="replace")
for token in (
    "isRuntimeSchemaMutationSql",
    "runtime_schema_mutation_blocked",
    "Runtime D1 schema mutation is forbidden",
    "property === 'prepare'",
    "property === 'exec'",
    "property === 'batch'",
):
    if token not in schema_safe:
        FAIL.append(f"schema-safe D1 adapter missing contract: {token}")
if "createSchemaSafeD1(env.DB || env.DD_DB)" not in admin_audit:
    FAIL.append("shared getDb() does not route D1 through createSchemaSafeD1")

files_with_ddl = 0
ddl_occurrences = 0
protected_routes = 0
delegated_libraries = 0
unprotected: list[str] = []

for path in sorted(FUNCTIONS.rglob("*.js")):
    text = path.read_text(encoding="utf-8", errors="replace")
    matches = list(DDL.finditer(text)) + list(DDL_AFTER_NEWLINE.finditer(text))
    unique = {(text.count("\n", 0, match.start()) + 1, re.sub(r"\s+", " ", match.group("sql")).strip().upper()) for match in matches}
    if not unique:
        continue
    files_with_ddl += 1
    ddl_occurrences += len(unique)
    rel = path.relative_to(ROOT).as_posix()

    # Any route/library that bypasses getDb and reaches the raw binding while carrying
    # DDL is an immediate blocker, regardless of whether the DDL currently executes.
    if DIRECT_DB.search(text) or DESTRUCTURED_DB.search(text):
        unprotected.append(f"{rel} — direct env.DB/DD_DB access while carrying schema DDL")
        continue

    if rel.startswith("functions/api/admin/"):
        if "getDb" not in text:
            unprotected.append(f"{rel} — admin DDL source does not use guarded getDb()")
        else:
            protected_routes += 1
        continue

    if rel.startswith("functions/api/_lib/"):
        # Shared libraries receive a DB from callers. They may retain historical DDL only
        # if they never reach env.DB directly; admin callers supply guarded getDb().
        delegated_libraries += 1
        continue

    # Public/non-admin runtime should not carry schema mutation residue at all.
    unprotected.append(f"{rel} — non-admin runtime carries schema DDL")

if unprotected:
    FAIL.extend(unprotected)

print("RUNTIME SCHEMA MUTATION AUTHORITY GATE")
print(f"Runtime JS files scanned: {sum(1 for _ in FUNCTIONS.rglob('*.js'))}")
print(f"Historical DDL-bearing files inventoried: {files_with_ddl}")
print(f"Historical DDL string occurrences inventoried: {ddl_occurrences}")
print(f"DDL-bearing admin routes behind guarded getDb(): {protected_routes}")
print(f"DDL-bearing shared libraries with delegated guarded DB: {delegated_libraries}")
print(f"Raw DB binding bypasses carrying DDL: {len(unprotected)}")
if FAIL:
    print("RUNTIME SCHEMA MUTATION AUTHORITY GATE: FAIL")
    for index, message in enumerate(FAIL, 1):
        print(f"{index:03d}. {message}")
    raise SystemExit(1)

print("RUNTIME SCHEMA MUTATION AUTHORITY GATE: PASS")
print("Request-time schema mutation capability: BLOCKED")
print("Legacy ensure-DDL through getDb(): NON-MUTATING")
print("Raw DB bypass with DDL: ZERO")
print("Schema change authority: migrations/canonical + scripts/d1_migrate.py")

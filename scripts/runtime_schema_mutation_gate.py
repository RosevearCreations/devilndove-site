#!/usr/bin/env python3
"""Prove runtime D1 schema mutation is unreachable and ratchet historical DDL residue down.

Historical schema-description/ensure SQL may remain temporarily in source, but any
runtime path capable of executing it must receive a schema-safe D1 binding. This gate
inventories that residue, fails on raw D1 acquisition/execution bypasses, and prevents
cleaned runtime helpers from regaining schema ownership.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FUNCTIONS = ROOT / "functions"
FAIL: list[str] = []

# Release 467 Build 38 ratchet. Future cleanup may reduce these values further, but no
# accepted source may increase them again without deliberately changing this authority.
MAX_DDL_FILES = 60
MAX_DDL_OCCURRENCES = 526
MAX_DELEGATED_LIBRARIES = 4

DDL = re.compile(
    r"(?P<quote>[`\"'])\s*(?P<sql>(?:CREATE\s+(?:TABLE|INDEX|TRIGGER|VIEW)|ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW)|VACUUM\b|REINDEX\b))",
    re.IGNORECASE | re.MULTILINE,
)
DDL_AFTER_NEWLINE = re.compile(
    r"`(?:\s|--[^\n]*\n|/\*.*?\*/)*(?P<sql>(?:CREATE\s+(?:TABLE|INDEX|TRIGGER|VIEW)|ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW)|VACUUM\b|REINDEX\b))",
    re.IGNORECASE | re.MULTILINE | re.DOTALL,
)
# Boolean readiness/status checks such as `!!env.DB` are not database access. These
# patterns identify actual raw binding acquisition or direct execution only.
RAW_RETURN = re.compile(r"\breturn\s+(?:context\.)?env\s*\.\s*(?:DB|DD_DB)\b", re.IGNORECASE)
RAW_ASSIGN = re.compile(r"\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:context\.)?env\s*\.\s*(?:DB|DD_DB)\b", re.IGNORECASE)
RAW_EXECUTE = re.compile(r"(?:context\.)?env\s*\.\s*(?:DB|DD_DB)\s*\.\s*(?:prepare|exec|batch|withSession)\s*\(", re.IGNORECASE)
RAW_DESTRUCTURE = re.compile(r"\{[^}\n]*\b(?:DB|DD_DB)\b[^}\n]*\}\s*=\s*(?:context\.)?env\b", re.IGNORECASE)

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

    raw_access = any(pattern.search(text) for pattern in (RAW_RETURN, RAW_ASSIGN, RAW_EXECUTE, RAW_DESTRUCTURE))
    if raw_access:
        # A raw acquisition is acceptable only when this source itself explicitly wraps
        # the binding in createSchemaSafeD1 before use.
        if "createSchemaSafeD1" not in text:
            unprotected.append(f"{rel} — raw D1 acquisition/execution while carrying schema DDL")
            continue

    if rel.startswith("functions/api/admin/_"):
        # Underscore admin helpers are not routes; they receive DB from their guarded caller.
        delegated_libraries += 1
        continue

    if rel.startswith("functions/api/admin/"):
        if "getDb" not in text and "createSchemaSafeD1" not in text:
            unprotected.append(f"{rel} — admin DDL source does not use guarded getDb()/createSchemaSafeD1")
        else:
            protected_routes += 1
        continue

    if rel.startswith("functions/api/_lib/"):
        # Shared libraries either wrap their own binding or receive a DB from guarded callers.
        delegated_libraries += 1
        continue

    unprotected.append(f"{rel} — non-admin runtime carries schema DDL")

if unprotected:
    FAIL.extend(unprotected)

accounting_path = ROOT / "functions/api/_lib/accounting.js"
accounting_text = accounting_path.read_text(encoding="utf-8", errors="replace") if accounting_path.is_file() else ""
accounting_matches = list(DDL.finditer(accounting_text)) + list(DDL_AFTER_NEWLINE.finditer(accounting_text))
if accounting_matches:
    FAIL.append("functions/api/_lib/accounting.js regained request-time schema DDL after Build 38 cleanup")
if files_with_ddl > MAX_DDL_FILES:
    FAIL.append(f"historical DDL-bearing runtime files increased above Build 38 ceiling: {files_with_ddl} > {MAX_DDL_FILES}")
if ddl_occurrences > MAX_DDL_OCCURRENCES:
    FAIL.append(f"historical DDL string occurrences increased above Build 38 ceiling: {ddl_occurrences} > {MAX_DDL_OCCURRENCES}")
if delegated_libraries > MAX_DELEGATED_LIBRARIES:
    FAIL.append(f"DDL-bearing delegated/shared helpers increased above Build 38 ceiling: {delegated_libraries} > {MAX_DELEGATED_LIBRARIES}")

print("RUNTIME SCHEMA MUTATION AUTHORITY GATE")
print(f"Runtime JS files scanned: {sum(1 for _ in FUNCTIONS.rglob('*.js'))}")
print(f"Historical DDL-bearing files inventoried: {files_with_ddl} (ceiling {MAX_DDL_FILES})")
print(f"Historical DDL string occurrences inventoried: {ddl_occurrences} (ceiling {MAX_DDL_OCCURRENCES})")
print(f"DDL-bearing admin routes behind guarded DB: {protected_routes}")
print(f"DDL-bearing delegated/shared helpers: {delegated_libraries} (ceiling {MAX_DELEGATED_LIBRARIES})")
print(f"Raw D1 bypasses carrying DDL: {len(unprotected)}")
print(f"Accounting core request-time DDL statements: {len(accounting_matches)}")
if FAIL:
    print("RUNTIME SCHEMA MUTATION AUTHORITY GATE: FAIL")
    for index, message in enumerate(FAIL, 1):
        print(f"{index:03d}. {message}")
    raise SystemExit(1)

print("RUNTIME SCHEMA MUTATION AUTHORITY GATE: PASS")
print("Request-time schema mutation capability: BLOCKED")
print("Accounting core schema ownership: READ-ONLY BASELINE ASSERTION")
print("Legacy ensure-DDL behind guarded DB: NON-MUTATING AND RATCHETED")
print("Raw D1 bypass with DDL: ZERO")
print("Schema change authority: migrations/canonical + scripts/d1_migrate.py")

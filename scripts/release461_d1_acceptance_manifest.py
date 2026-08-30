#!/usr/bin/env python3
"""Release 461 Development D1 acceptance manifest and drift checker.

This utility is deliberately read-only with respect to D1. It inventories every
Development migration whose filename contains ``release461`` and derives the
minimum schema contract that must be present after those migrations converge.

Safety model:
- Release 461 migration files may be forward/additive only: no ALTER/DROP.
- If a table is defined by more than one Release 461 migration, the earliest
  definition must already contain the union of required columns/constraints;
  otherwise CREATE TABLE IF NOT EXISTS cannot converge a fresh database.
- Existing D1 tables may contain extra columns/constraints, but may not be
  missing a Release 461-required column, PK, UNIQUE constraint, or FK relation.
- Existing named indexes must match the Release 461 target table/signature.
- Missing objects are safe during preflight; ``--require-converged`` requires
  every Release 461-owned object to already exist.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MIGRATION_DIR = ROOT / "migrations" / "dev"
MIGRATION_GLOB = "*release461*.sql"

FORBIDDEN_DDL = re.compile(r"\b(?:ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW))\b", re.I)
CREATE_TABLE = re.compile(
    r"\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?P<name>(?:[`\"\[]?[A-Za-z_][A-Za-z0-9_]*[`\"\]]?)(?:\.(?:[`\"\[]?[A-Za-z_][A-Za-z0-9_]*[`\"\]]?))?)\s*\(",
    re.I,
)
CREATE_INDEX = re.compile(
    r"\bCREATE\s+(?P<unique>UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(?P<name>[`\"\[]?[A-Za-z_][A-Za-z0-9_]*[`\"\]]?)\s+ON\s+(?P<table>[`\"\[]?[A-Za-z_][A-Za-z0-9_]*[`\"\]]?)\s*\(",
    re.I,
)
IDENT = re.compile(r"^[`\"\[]?([A-Za-z_][A-Za-z0-9_]*)[`\"\]]?")
CONSTRAINT_START = {"constraint", "primary", "unique", "foreign", "check"}


def strip_comments(sql: str) -> str:
    sql = re.sub(r"/\*.*?\*/", " ", sql, flags=re.S)
    return re.sub(r"--[^\n]*", " ", sql)


def clean_identifier(value: str) -> str:
    value = str(value or "").strip().split(".")[-1].strip()
    if len(value) >= 2 and ((value[0] == '"' and value[-1] == '"') or (value[0] == '`' and value[-1] == '`') or (value[0] == '[' and value[-1] == ']')):
        value = value[1:-1]
    return value.strip().lower()


def normalize_expr(value: str) -> str:
    value = re.sub(r"\s+", " ", str(value or "").strip().lower())
    value = re.sub(r"\s*,\s*", ",", value)
    value = re.sub(r"\(\s+", "(", value)
    value = re.sub(r"\s+\)", ")", value)
    return value


def matching_paren(text: str, open_index: int) -> int:
    depth = 0
    quote = ""
    i = open_index
    while i < len(text):
        ch = text[i]
        if quote:
            if ch == quote:
                if i + 1 < len(text) and text[i + 1] == quote:
                    i += 2
                    continue
                quote = ""
            i += 1
            continue
        if ch in ("'", '"', '`'):
            quote = ch
        elif ch == '[':
            quote = ']'
        elif ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise ValueError(f"Unmatched parenthesis at offset {open_index}")


def split_top_level(text: str) -> list[str]:
    parts: list[str] = []
    start = 0
    depth = 0
    quote = ""
    i = 0
    while i < len(text):
        ch = text[i]
        if quote:
            if ch == quote:
                if i + 1 < len(text) and text[i + 1] == quote:
                    i += 2
                    continue
                quote = ""
            i += 1
            continue
        if ch in ("'", '"', '`'):
            quote = ch
        elif ch == '[':
            quote = ']'
        elif ch == '(':
            depth += 1
        elif ch == ')':
            depth = max(0, depth - 1)
        elif ch == ',' and depth == 0:
            parts.append(text[start:i].strip())
            start = i + 1
        i += 1
    tail = text[start:].strip()
    if tail:
        parts.append(tail)
    return parts


def parse_column_list(value: str) -> tuple[str, ...]:
    return tuple(clean_identifier(x.strip().split()[0]) for x in split_top_level(value) if x.strip())


def parse_table_body(name: str, body: str) -> dict[str, Any]:
    columns: list[str] = []
    pk: tuple[str, ...] = ()
    uniques: set[tuple[str, ...]] = set()
    foreign_keys: set[tuple[tuple[str, ...], str, tuple[str, ...]]] = set()

    for raw in split_top_level(body):
        part = re.sub(r"\s+", " ", raw.strip())
        if not part:
            continue
        lower = part.lower()
        first = lower.split(" ", 1)[0].strip('`"[]')
        if first == "constraint":
            tokens = part.split(None, 2)
            part = tokens[2] if len(tokens) >= 3 else ""
            lower = part.lower()
            first = lower.split(" ", 1)[0] if lower else ""

        if first in CONSTRAINT_START:
            m = re.search(r"\bPRIMARY\s+KEY\s*\((.*?)\)", part, re.I | re.S)
            if m:
                pk = parse_column_list(m.group(1))
            m = re.search(r"\bUNIQUE\s*\((.*?)\)", part, re.I | re.S)
            if m:
                uniques.add(parse_column_list(m.group(1)))
            m = re.search(r"\bFOREIGN\s+KEY\s*\((.*?)\)\s+REFERENCES\s+([`\"\[]?[A-Za-z_][A-Za-z0-9_]*[`\"\]]?)\s*\((.*?)\)", part, re.I | re.S)
            if m:
                foreign_keys.add((parse_column_list(m.group(1)), clean_identifier(m.group(2)), parse_column_list(m.group(3))))
            continue

        ident = IDENT.match(part)
        if not ident:
            continue
        column = clean_identifier(ident.group(1))
        columns.append(column)
        if re.search(r"\bPRIMARY\s+KEY\b", part, re.I):
            pk = (column,)
        if re.search(r"\bUNIQUE\b", part, re.I):
            uniques.add((column,))
        ref = re.search(r"\bREFERENCES\s+([`\"\[]?[A-Za-z_][A-Za-z0-9_]*[`\"\]]?)\s*\((.*?)\)", part, re.I | re.S)
        if ref:
            foreign_keys.add(((column,), clean_identifier(ref.group(1)), parse_column_list(ref.group(2))))

    return {
        "name": clean_identifier(name),
        "columns": sorted(set(columns)),
        "primary_key": list(pk),
        "unique_sets": [list(x) for x in sorted(uniques)],
        "foreign_keys": [
            {"columns": list(local), "ref_table": table, "ref_columns": list(remote)}
            for local, table, remote in sorted(foreign_keys)
        ],
    }


def parse_tables(sql: str) -> list[dict[str, Any]]:
    clean = strip_comments(sql)
    out: list[dict[str, Any]] = []
    for match in CREATE_TABLE.finditer(clean):
        open_index = clean.find('(', match.start(), match.end() + 1)
        close_index = matching_paren(clean, open_index)
        out.append(parse_table_body(match.group('name'), clean[open_index + 1:close_index]))
    return out


def parse_indexes(sql: str) -> list[dict[str, Any]]:
    clean = strip_comments(sql)
    out: list[dict[str, Any]] = []
    for match in CREATE_INDEX.finditer(clean):
        open_index = clean.find('(', match.start(), match.end() + 1)
        close_index = matching_paren(clean, open_index)
        expressions = [normalize_expr(x) for x in split_top_level(clean[open_index + 1:close_index])]
        out.append({
            "name": clean_identifier(match.group('name')),
            "table": clean_identifier(match.group('table')),
            "unique": bool(match.group('unique')),
            "expressions": expressions,
        })
    return out


def fk_key(item: dict[str, Any]) -> tuple[Any, ...]:
    return (tuple(item["columns"]), item["ref_table"], tuple(item["ref_columns"]))


def build_manifest() -> dict[str, Any]:
    paths = sorted(MIGRATION_DIR.glob(MIGRATION_GLOB))
    if not paths:
        raise SystemExit("No Release 461 Development migrations found.")

    definitions: dict[str, list[tuple[str, dict[str, Any]]]] = {}
    indexes: dict[str, dict[str, Any]] = {}
    migration_rows: list[dict[str, Any]] = []

    for path in paths:
        text = path.read_text(encoding="utf-8")
        forbidden = FORBIDDEN_DDL.search(strip_comments(text))
        if forbidden:
            raise SystemExit(f"STOP: Release 461 migration is not forward/additive: {path.relative_to(ROOT)} contains {forbidden.group(0)!r}")
        tables = parse_tables(text)
        parsed_indexes = parse_indexes(text)
        migration_rows.append({
            "path": str(path.relative_to(ROOT)).replace('\\', '/'),
            "tables": [row["name"] for row in tables],
            "indexes": [row["name"] for row in parsed_indexes],
        })
        for table in tables:
            definitions.setdefault(table["name"], []).append((migration_rows[-1]["path"], table))
        for index in parsed_indexes:
            current = indexes.get(index["name"])
            if current and current != index:
                raise SystemExit(f"STOP: conflicting Release 461 index definitions for {index['name']}: {current} != {index}")
            indexes[index["name"]] = index

    tables: dict[str, dict[str, Any]] = {}
    for name, defs in sorted(definitions.items()):
        union_columns: set[str] = set()
        union_unique: set[tuple[str, ...]] = set()
        union_fk: set[tuple[Any, ...]] = set()
        pk_values: set[tuple[str, ...]] = set()
        for _, table in defs:
            union_columns.update(table["columns"])
            union_unique.update(tuple(x) for x in table["unique_sets"])
            union_fk.update(fk_key(x) for x in table["foreign_keys"])
            if table["primary_key"]:
                pk_values.add(tuple(table["primary_key"]))
        if len(pk_values) > 1:
            raise SystemExit(f"STOP: conflicting Release 461 primary-key definitions for {name}: {sorted(pk_values)}")
        earliest_path, earliest = defs[0]
        missing_from_earliest = union_columns.difference(earliest["columns"])
        if missing_from_earliest:
            raise SystemExit(
                f"STOP: Release 461 migration-order drift for {name}: earliest definition {earliest_path} "
                f"cannot create later-required columns {sorted(missing_from_earliest)}. Add a dedicated forward migration rather than relying on CREATE TABLE IF NOT EXISTS."
            )
        earliest_uniques = {tuple(x) for x in earliest["unique_sets"]}
        if not union_unique.issubset(earliest_uniques):
            raise SystemExit(f"STOP: Release 461 migration-order drift for {name}: earliest definition omits later UNIQUE constraints.")
        earliest_fk = {fk_key(x) for x in earliest["foreign_keys"]}
        if not union_fk.issubset(earliest_fk):
            raise SystemExit(f"STOP: Release 461 migration-order drift for {name}: earliest definition omits later FOREIGN KEY constraints.")

        tables[name] = {
            "columns": sorted(union_columns),
            "primary_key": list(next(iter(pk_values), ())),
            "unique_sets": [list(x) for x in sorted(union_unique)],
            "foreign_keys": [
                {"columns": list(local), "ref_table": ref_table, "ref_columns": list(remote)}
                for local, ref_table, remote in sorted(union_fk)
            ],
            "definitions": [path for path, _ in defs],
        }

    for index in indexes.values():
        table = index["table"]
        if table in tables:
            expected_columns = set(tables[table]["columns"])
            simple_columns = {clean_identifier(re.sub(r"\s+(?:asc|desc)\b", "", expr, flags=re.I)) for expr in index["expressions"] if re.fullmatch(r"[`\"\[]?[A-Za-z_][A-Za-z0-9_]*[`\"\]]?(?:\s+(?:ASC|DESC))?", expr, re.I)}
            unknown = simple_columns.difference(expected_columns)
            if unknown:
                raise SystemExit(f"STOP: index {index['name']} references columns not present in Release 461 table {table}: {sorted(unknown)}")

    return {
        "release": 461,
        "migration_glob": f"migrations/dev/{MIGRATION_GLOB}",
        "migration_count": len(migration_rows),
        "migrations": migration_rows,
        "table_count": len(tables),
        "tables": tables,
        "index_count": len(indexes),
        "indexes": dict(sorted(indexes.items())),
        "rules": {
            "historical_replay": "forbidden",
            "runtime_schema_mutation": "forbidden",
            "existing_structural_drift": "hard_stop",
            "missing_release461_object": "safe_to_create_after_explicit_apply",
        },
    }


def walk(value: Any):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def sqlite_master_rows(data: Any) -> dict[tuple[str, str], dict[str, Any]]:
    out: dict[tuple[str, str], dict[str, Any]] = {}
    for item in walk(data):
        if not isinstance(item, dict):
            continue
        kind = str(item.get("type") or "").lower()
        name = clean_identifier(item.get("name") or "")
        if kind not in {"table", "index"} or not name:
            continue
        if "sql" not in item and "tbl_name" not in item:
            continue
        out[(kind, name)] = item
    return out


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def check_schema(manifest: dict[str, Any], schema_json: Any, require_converged: bool = False) -> dict[str, Any]:
    master = sqlite_master_rows(schema_json)
    drift: list[str] = []
    missing_tables: list[str] = []
    missing_indexes: list[str] = []

    for name, expected in manifest["tables"].items():
        row = master.get(("table", name))
        if not row:
            missing_tables.append(name)
            continue
        sql = str(row.get("sql") or "")
        parsed = parse_tables(sql)
        if not parsed:
            drift.append(f"{name}: existing table SQL could not be parsed")
            continue
        actual = parsed[0]
        actual_columns = set(actual["columns"])
        required_columns = set(expected["columns"])
        missing = sorted(required_columns.difference(actual_columns))
        if missing:
            drift.append(f"{name}: missing required columns {missing}")
        expected_pk = tuple(expected["primary_key"])
        actual_pk = tuple(actual["primary_key"])
        if expected_pk and actual_pk != expected_pk:
            drift.append(f"{name}: primary key {actual_pk or 'NONE'} does not match required {expected_pk}")
        actual_unique = {tuple(x) for x in actual["unique_sets"]}
        for unique_set in (tuple(x) for x in expected["unique_sets"]):
            if unique_set not in actual_unique:
                drift.append(f"{name}: missing required UNIQUE{unique_set}")
        actual_fk = {fk_key(x) for x in actual["foreign_keys"]}
        for fk in expected["foreign_keys"]:
            key = fk_key(fk)
            if key not in actual_fk:
                drift.append(f"{name}: missing required FK {key}")

    for name, expected in manifest["indexes"].items():
        row = master.get(("index", name))
        if not row:
            target = expected["table"]
            if target not in manifest["tables"] and ("table", target) not in master:
                drift.append(f"{name}: target table {target} is absent and is not created by a Release 461 migration")
            else:
                missing_indexes.append(name)
            continue
        sql = str(row.get("sql") or "")
        parsed = parse_indexes(sql)
        if not parsed:
            drift.append(f"{name}: existing named index SQL could not be parsed")
            continue
        actual = parsed[0]
        if actual["table"] != expected["table"] or actual["unique"] != expected["unique"] or actual["expressions"] != expected["expressions"]:
            drift.append(f"{name}: existing signature {actual} does not match required {expected}")

    converged = not missing_tables and not missing_indexes and not drift
    report = {
        "release": 461,
        "safe": not drift,
        "converged": converged,
        "drift": drift,
        "missing_tables": sorted(missing_tables),
        "missing_indexes": sorted(missing_indexes),
        "missing_object_count": len(missing_tables) + len(missing_indexes),
        "required_table_count": manifest["table_count"],
        "required_index_count": manifest["index_count"],
    }
    if drift:
        raise RuntimeError("Release 461 D1 structural drift requires a dedicated forward repair:\n- " + "\n- ".join(drift))
    if require_converged and not converged:
        raise RuntimeError(
            "Release 461 D1 is not converged after apply. Missing tables: "
            f"{missing_tables}; missing indexes: {missing_indexes}"
        )
    return report


def write_json(data: Any, output: str | None) -> None:
    text = json.dumps(data, indent=2, sort_keys=True) + "\n"
    if output:
        Path(output).write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    p_manifest = sub.add_parser("manifest")
    p_manifest.add_argument("--output")

    p_list = sub.add_parser("list")

    p_check = sub.add_parser("check")
    p_check.add_argument("--manifest", required=True)
    p_check.add_argument("--schema-json", required=True)
    p_check.add_argument("--output")
    p_check.add_argument("--require-converged", action="store_true")

    args = parser.parse_args()
    if args.command == "manifest":
        manifest = build_manifest()
        write_json(manifest, args.output)
        print(f"RELEASE 461 D1 ACCEPTANCE MANIFEST: PASS ({manifest['migration_count']} migrations, {manifest['table_count']} tables, {manifest['index_count']} indexes)", file=sys.stderr)
        return 0
    if args.command == "list":
        manifest = build_manifest()
        for migration in manifest["migrations"]:
            print(migration["path"])
        return 0
    if args.command == "check":
        manifest = load_json(Path(args.manifest))
        schema = load_json(Path(args.schema_json))
        try:
            report = check_schema(manifest, schema, require_converged=args.require_converged)
        except RuntimeError as exc:
            print(f"STOP: {exc}", file=sys.stderr)
            return 2
        write_json(report, args.output)
        print(
            f"RELEASE 461 D1 STRUCTURAL CHECK: PASS (safe={report['safe']}, converged={report['converged']}, missing={report['missing_object_count']})",
            file=sys.stderr,
        )
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

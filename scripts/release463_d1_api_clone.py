#!/usr/bin/env python3
"""Release 463: clone the proven Development D1 into an isolated Production D1.

This controller avoids Wrangler's bulk-import chunking. It:
- exports the proven source once;
- validates the dump locally with foreign keys enforced;
- records a Time Travel bookmark for the empty target;
- creates all tables first;
- loads data by foreign-key dependency components;
- loads cyclic/self-referencing components in one deferred-FK D1 API batch;
- creates views/indexes/triggers only after data is complete;
- proves every user table row count and foreign-key integrity;
- restores the target to its starting bookmark if any mutation-stage check fails.
"""
from __future__ import annotations

import collections
import hashlib
import json
import os
import pathlib
import re
import sqlite3
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ACCOUNT_ID = os.environ["CLOUDFLARE_ACCOUNT_ID"].strip()
TOKEN = os.environ["CLOUDFLARE_API_TOKEN"].strip()
SOURCE_DB = os.environ.get("SOURCE_DB", "devilndove-dev").strip()
SOURCE_ID = os.environ.get("SOURCE_ID", "dbc1615b-dcbe-4951-973b-b47c99c73bfa").strip()
TARGET_DB = os.environ.get("TARGET_DB", "devilndove-prod-r462").strip()
TARGET_ID = os.environ.get("TARGET_ID", "f34a741b-0000-45b0-9a96-6be08754d563").strip()
API = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database"
SOURCE_SQL = pathlib.Path("/tmp/release463-source.sql")
PROOF_JSON = pathlib.Path("/tmp/release463-d1-api-proof.json")
MAX_BATCH_STATEMENTS = 40
MAX_BATCH_JSON_BYTES = 650_000
MAX_CYCLE_JSON_BYTES = 2_000_000


def cf_request(method: str, url: str, payload=None, retries: int = 7):
    data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    last = None
    for attempt in range(retries):
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                raw = response.read().decode("utf-8", "replace")
                body = json.loads(raw) if raw.strip() else {}
            if isinstance(body, dict) and body.get("success") is False:
                raise RuntimeError(f"Cloudflare API failure: {body}")
            return body
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", "replace")
            last = RuntimeError(f"HTTP {exc.code}: {raw[:2000]}")
            if exc.code not in (408, 409, 429, 500, 502, 503, 504) or attempt == retries - 1:
                raise last
            time.sleep(min(2 ** attempt, 12))
        except (urllib.error.URLError, TimeoutError) as exc:
            last = exc
            if attempt == retries - 1:
                raise
            time.sleep(min(2 ** attempt, 12))
    raise last or RuntimeError("Cloudflare request failed")


def query(database_id: str, statements: list[str]):
    if not statements:
        return []
    payload = {"batch": [{"sql": statement} for statement in statements]}
    encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    if len(encoded) > MAX_CYCLE_JSON_BYTES:
        raise ValueError(f"Query batch too large: {len(encoded)} bytes")
    body = cf_request("POST", f"{API}/{database_id}/query", payload)
    results = body.get("result") if isinstance(body, dict) else None
    if not isinstance(results, list):
        raise RuntimeError(f"Unexpected D1 query response: {body}")
    failures = [item for item in results if not isinstance(item, dict) or item.get("success") is not True]
    if failures:
        raise RuntimeError(f"D1 query batch failure: {failures[:3]}")
    return results


def scalar(database_id: str, sql: str):
    results = query(database_id, [sql])
    rows = (results[0].get("results") or []) if results else []
    if not rows or not isinstance(rows[0], dict):
        raise RuntimeError(f"No scalar row for {sql!r}: {results}")
    return next(iter(rows[0].values()))


def chunks_for(statements: list[str]):
    chunk: list[str] = []
    size = len('{"batch":[]}')
    for statement in statements:
        item_size = len(json.dumps({"sql": statement}, ensure_ascii=False).encode("utf-8")) + 2
        if chunk and (len(chunk) >= MAX_BATCH_STATEMENTS or size + item_size > MAX_BATCH_JSON_BYTES):
            yield chunk
            chunk = []
            size = len('{"batch":[]}')
        chunk.append(statement)
        size += item_size
    if chunk:
        yield chunk


def execute_chunked(database_id: str, label: str, statements: list[str]):
    batches = list(chunks_for(statements))
    for index, batch in enumerate(batches, 1):
        query(database_id, batch)
        if index == 1 or index == len(batches) or index % 20 == 0:
            print(f"{label}: batch {index}/{len(batches)} statements={len(batch)}", flush=True)
    return len(batches)


def split_statements(text: str):
    statements: list[str] = []
    buffer = ""
    for line in text.splitlines(True):
        buffer += line
        if sqlite3.complete_statement(buffer):
            value = buffer.strip()
            if value:
                statements.append(value.rstrip(";"))
            buffer = ""
    if buffer.strip():
        statements.append(buffer.strip().rstrip(";"))
    return statements


def insert_target(statement: str):
    match = re.match(
        r'^\s*(?:INSERT(?:\s+OR\s+\w+)?|REPLACE)\s+INTO\s+(?:"((?:[^"]|"")+)"|`([^`]+)`|\[([^\]]+)\]|([^\s(]+))',
        statement,
        re.I | re.S,
    )
    if not match:
        return None
    value = next((part for part in match.groups() if part is not None), "")
    return value.replace('""', '"')


def classify(statements: list[str]):
    tables, views, indexes, triggers = [], [], [], []
    inserts: dict[str, list[str]] = collections.defaultdict(list)
    sequence, unsupported = [], []
    for statement in statements:
        upper = statement.lstrip().upper()
        if upper.startswith("BEGIN TRANSACTION") or upper == "BEGIN" or upper.startswith("COMMIT") or upper.startswith("PRAGMA "):
            continue
        if upper.startswith("CREATE TABLE") or upper.startswith("CREATE VIRTUAL TABLE"):
            tables.append(statement)
        elif upper.startswith("CREATE VIEW"):
            views.append(statement)
        elif upper.startswith("CREATE UNIQUE INDEX") or upper.startswith("CREATE INDEX"):
            indexes.append(statement)
        elif upper.startswith("CREATE TRIGGER"):
            triggers.append(statement)
        elif upper.startswith("INSERT") or upper.startswith("REPLACE"):
            target = insert_target(statement)
            if not target:
                unsupported.append(statement)
            elif target == "sqlite_sequence":
                sequence.append(statement)
            else:
                inserts[target].append(statement)
        elif re.match(r'^\s*DELETE\s+FROM\s+["`\[]?sqlite_sequence', statement, re.I):
            sequence.append(statement)
        else:
            unsupported.append(statement)
    if unsupported:
        raise AssertionError(f"Unsupported export statements: {unsupported[:5]}")
    return tables, inserts, sequence, views, indexes, triggers


def build_local(tables, inserts, sequence, views, indexes, triggers):
    path = "/tmp/release463-local-proof.sqlite"
    try:
        os.remove(path)
    except FileNotFoundError:
        pass
    con = sqlite3.connect(path)
    try:
        con.execute("PRAGMA foreign_keys=ON")
        con.execute("BEGIN")
        con.execute("PRAGMA defer_foreign_keys=ON")
        for statement in tables:
            con.execute(statement)
        for statements in inserts.values():
            for statement in statements:
                con.execute(statement)
        for statement in sequence:
            con.execute(statement)
        for statement in views + indexes + triggers:
            con.execute(statement)
        con.commit()
        foreign_keys = list(con.execute("PRAGMA foreign_key_check"))
        if foreign_keys:
            raise AssertionError(f"Local FK violations: {foreign_keys[:10]}")
        table_rows = {
            name: int(con.execute(f'SELECT count(*) FROM "{name.replace(chr(34), chr(34)*2)}"').fetchone()[0])
            for (name,) in con.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        }
        objects = [(row[0], row[1]) for row in con.execute(
            "SELECT type,name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name"
        )]
        return table_rows, objects
    finally:
        con.close()


def dependency_components(tables: list[str], inserts: dict[str, list[str]]):
    con = sqlite3.connect(":memory:")
    try:
        for statement in tables:
            con.execute(statement)
        names = [row[0] for row in con.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
        name_set = set(names)
        deps = {name: set() for name in names}
        self_refs = set()
        for child in names:
            escaped = child.replace('"', '""')
            for row in con.execute(f'PRAGMA foreign_key_list("{escaped}")'):
                parent = str(row[2])
                if parent == child:
                    self_refs.add(child)
                elif parent in name_set:
                    deps[child].add(parent)
    finally:
        con.close()

    index = 0
    stack: list[str] = []
    on_stack: set[str] = set()
    indices: dict[str, int] = {}
    low: dict[str, int] = {}
    components: list[list[str]] = []

    def strongconnect(node: str):
        nonlocal index
        indices[node] = low[node] = index
        index += 1
        stack.append(node)
        on_stack.add(node)
        for parent in deps[node]:
            if parent not in indices:
                strongconnect(parent)
                low[node] = min(low[node], low[parent])
            elif parent in on_stack:
                low[node] = min(low[node], indices[parent])
        if low[node] == indices[node]:
            component = []
            while True:
                value = stack.pop()
                on_stack.remove(value)
                component.append(value)
                if value == node:
                    break
            components.append(component)

    for name in names:
        if name not in indices:
            strongconnect(name)

    component_of = {name: idx for idx, component in enumerate(components) for name in component}
    component_deps = {idx: set() for idx in range(len(components))}
    for child, parents in deps.items():
        child_component = component_of[child]
        for parent in parents:
            parent_component = component_of[parent]
            if child_component != parent_component:
                component_deps[child_component].add(parent_component)

    remaining = set(range(len(components)))
    ordered_components: list[list[str]] = []
    processed = set()
    while remaining:
        ready = sorted(idx for idx in remaining if component_deps[idx].issubset(processed))
        if not ready:
            raise AssertionError(f"Component dependency ordering failed: {remaining}")
        for idx in ready:
            ordered_components.append(sorted(components[idx]))
            processed.add(idx)
            remaining.remove(idx)

    cyclic = []
    for component in ordered_components:
        has_cycle = len(component) > 1 or any(name in self_refs for name in component)
        if has_cycle:
            statements = [statement for name in component for statement in inserts.get(name, [])]
            payload = {"batch": [{"sql": "PRAGMA defer_foreign_keys=ON"}] + [{"sql": statement} for statement in statements]}
            payload_size = len(json.dumps(payload, ensure_ascii=False).encode("utf-8"))
            if payload_size > MAX_CYCLE_JSON_BYTES:
                raise AssertionError(f"Cyclic FK component too large for one transaction: {component} bytes={payload_size}")
            cyclic.append({"tables": component, "statements": len(statements), "bytes": payload_size})
    return ordered_components, self_refs, cyclic


def get_bookmark():
    body = cf_request("GET", f"{API}/{TARGET_ID}/time_travel/bookmark")
    bookmark = str(((body.get("result") or {}).get("bookmark") or "")).strip()
    if not bookmark:
        raise RuntimeError(f"Target Time Travel bookmark unavailable: {body}")
    return bookmark


def restore(bookmark: str):
    print("RESTORING TARGET TO PRE-MUTATION BOOKMARK", bookmark, flush=True)
    url = f"{API}/{TARGET_ID}/time_travel/restore?bookmark={urllib.parse.quote(bookmark, safe='')}"
    body = cf_request("POST", url)
    print("RESTORE RESPONSE", json.dumps(body.get("result") or {}, sort_keys=True), flush=True)
    for attempt in range(30):
        try:
            count = int(scalar(TARGET_ID, "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name <> '_cf_KV'"))
            if count == 0:
                print("TARGET RESTORE VERIFIED EMPTY", flush=True)
                return
        except Exception as exc:
            if attempt == 29:
                raise
            print("restore verification retry", attempt + 1, repr(exc), flush=True)
        time.sleep(2)
    raise RuntimeError("Target did not return to empty state after restore")


def remote_table_counts(database_id: str, names: list[str]):
    output = {}
    statements = [f'SELECT {json.dumps(name)} AS table_name, count(*) AS row_count FROM "{name.replace(chr(34), chr(34)*2)}"' for name in names]
    for batch in chunks_for(statements):
        results = query(database_id, batch)
        for result in results:
            rows = result.get("results") or []
            if len(rows) != 1:
                raise AssertionError(f"Unexpected count result: {result}")
            output[str(rows[0]["table_name"])] = int(rows[0]["row_count"])
    return output


def main():
    if not ACCOUNT_ID or not TOKEN:
        raise SystemExit("Cloudflare account/token are required")

    listed = subprocess.run(
        ["npx", "--yes", "wrangler@4", "d1", "list", "--json"],
        check=True, capture_output=True, text=True,
    )
    identities = {row.get("name"): str(row.get("uuid") or row.get("id") or "") for row in json.loads(listed.stdout)}
    assert identities.get(SOURCE_DB) == SOURCE_ID, identities
    assert identities.get(TARGET_DB) == TARGET_ID, identities
    assert int(scalar(TARGET_ID, "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name <> '_cf_KV'")) == 0
    print("EXACT SOURCE + EMPTY TARGET: PASS", flush=True)

    subprocess.run(
        ["npx", "--yes", "wrangler@4", "d1", "export", SOURCE_DB, "--remote", "--skip-confirmation", f"--output={SOURCE_SQL}"],
        check=True,
    )
    raw = SOURCE_SQL.read_bytes()
    source_sha = hashlib.sha256(raw).hexdigest()
    statements = split_statements(raw.decode("utf-8"))
    tables, inserts, sequence, views, indexes, triggers = classify(statements)
    expected_rows, expected_objects = build_local(tables, inserts, sequence, views, indexes, triggers)
    components, self_refs, cyclic = dependency_components(tables, inserts)

    print(
        f"PRE-MUTATION PROOF source_sha={source_sha} tables={len(tables)} data_statements={sum(map(len,inserts.values()))} "
        f"views={len(views)} indexes={len(indexes)} triggers={len(triggers)} components={len(components)} cycles={len(cyclic)}",
        flush=True,
    )
    for item in cyclic:
        print("CYCLIC_COMPONENT", json.dumps(item, sort_keys=True), flush=True)
    assert len(tables) == 574, len(tables)
    assert len(indexes) == 607, len(indexes)
    assert expected_rows.get("users") == 1
    assert expected_rows.get("products") == 45
    assert expected_rows.get("site_item_inventory") == 1041
    assert expected_rows.get("app_modules") == 5

    bookmark = get_bookmark()
    print("TARGET PRE-MUTATION BOOKMARK", bookmark, flush=True)
    mutation_started = False
    stats = {"schema_batches": 0, "data_batches": 0, "cycle_batches": 0, "post_batches": 0}
    try:
        mutation_started = True
        stats["schema_batches"] = execute_chunked(TARGET_ID, "schema", tables)

        for component_number, component in enumerate(components, 1):
            component_statements = [statement for name in component for statement in inserts.get(name, [])]
            if not component_statements:
                continue
            cycle = len(component) > 1 or any(name in self_refs for name in component)
            if cycle:
                query(TARGET_ID, ["PRAGMA defer_foreign_keys=ON"] + component_statements)
                stats["cycle_batches"] += 1
                print(f"data component {component_number}/{len(components)} CYCLE tables={component} statements={len(component_statements)}", flush=True)
            else:
                stats["data_batches"] += execute_chunked(TARGET_ID, f"data:{component[0]}", component_statements)

        if sequence:
            stats["data_batches"] += execute_chunked(TARGET_ID, "sqlite_sequence", sequence)
        stats["post_batches"] += execute_chunked(TARGET_ID, "views", views)
        stats["post_batches"] += execute_chunked(TARGET_ID, "indexes", indexes)
        stats["post_batches"] += execute_chunked(TARGET_ID, "triggers", triggers)

        target_rows = remote_table_counts(TARGET_ID, sorted(expected_rows))
        if target_rows != expected_rows:
            mismatches = {
                name: {"source": expected_rows.get(name), "target": target_rows.get(name)}
                for name in sorted(set(expected_rows) | set(target_rows))
                if expected_rows.get(name) != target_rows.get(name)
            }
            raise AssertionError(f"Row-count parity failed: {json.dumps(mismatches, sort_keys=True)[:10000]}")

        fk_results = query(TARGET_ID, ["PRAGMA foreign_key_check"])[0].get("results") or []
        if fk_results:
            raise AssertionError(f"Remote FK violations: {fk_results[:20]}")

        object_results = query(TARGET_ID, ["SELECT type,name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name <> '_cf_KV' ORDER BY type,name"])[0].get("results") or []
        target_objects = [(str(row["type"]), str(row["name"])) for row in object_results]
        expected_filtered = [(kind, name) for kind, name in expected_objects if name != "_cf_KV"]
        if target_objects != expected_filtered:
            raise AssertionError(f"Object identity parity failed source={len(expected_filtered)} target={len(target_objects)}")

        proof = {
            "release": 463,
            "source_database": SOURCE_DB,
            "source_id": SOURCE_ID,
            "target_database": TARGET_DB,
            "target_id": TARGET_ID,
            "source_export_sha256": source_sha,
            "tables": len(tables),
            "indexes": len(indexes),
            "views": len(views),
            "triggers": len(triggers),
            "table_row_counts": expected_rows,
            "foreign_key_violations": 0,
            "cyclic_components": cyclic,
            "batches": stats,
            "pre_mutation_bookmark": bookmark,
            "status": "PASS",
        }
        PROOF_JSON.write_text(json.dumps(proof, indent=2, sort_keys=True), encoding="utf-8")
        pathlib.Path("/tmp/release463-source.sha256").write_text(source_sha + "  release463-source.sql\n", encoding="utf-8")
        print("RELEASE 463 D1 API CLONE: PASS", json.dumps(stats, sort_keys=True), flush=True)
    except Exception:
        if mutation_started:
            restore(bookmark)
        raise


if __name__ == "__main__":
    main()

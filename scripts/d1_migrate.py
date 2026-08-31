#!/usr/bin/env python3
"""Canonical Devil n Dove D1 migration applicator.

Future schema changes flow through one forward-only migration stream:
Development apply/proof -> approved source promotion -> Production apply/proof -> app deploy.

Cloudflare's native d1_migrations table is the applied-migration authority. The
app_schema_migration_proofs table supplements it with immutable SHA-256 identity,
source provenance and recovery-note identity. Historical migrations are never replayed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = ROOT / "migrations" / "canonical"
MANIFEST_PATH = MIGRATIONS_DIR / "manifest.json"
ENVIRONMENT_PATH = ROOT / "release463-environment.json"
WRANGLER_VERSION = "4"
PROOF_TABLE = "app_schema_migration_proofs"
NATIVE_LEDGER = "d1_migrations"


class Stop(RuntimeError):
    pass


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise Stop(f"Cannot read JSON authority {path.relative_to(ROOT)}: {exc}") from exc
    if not isinstance(data, dict):
        raise Stop(f"JSON authority must be an object: {path.relative_to(ROOT)}")
    return data


def git_value(*args: str) -> str:
    result = subprocess.run(
        ["git", *args], cwd=ROOT, text=True, stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL, check=False,
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def current_source_sha(explicit: str = "") -> str:
    value = str(explicit or os.environ.get("GITHUB_SHA") or git_value("rev-parse", "HEAD")).strip()
    if not re.fullmatch(r"[0-9a-fA-F]{7,40}", value):
        raise Stop("A valid source SHA is required for migration proof provenance.")
    return value.lower()


def current_branch() -> str:
    return str(os.environ.get("GITHUB_REF_NAME") or git_value("branch", "--show-current") or "").strip()


def canonical_manifest() -> tuple[dict[str, Any], list[dict[str, Any]], str]:
    manifest = read_json(MANIFEST_PATH)
    if manifest.get("stream") != "devilndove-canonical-forward":
        raise Stop("Canonical migration stream identifier drifted.")
    rules = manifest.get("rules") or {}
    if rules.get("native_ledger") != NATIVE_LEDGER or rules.get("proof_table") != PROOF_TABLE:
        raise Stop("Canonical migration ledger/proof authority drifted.")
    items = manifest.get("migrations")
    if not isinstance(items, list) or not items:
        raise Stop("Canonical migration manifest must contain at least one migration.")

    normalized: list[dict[str, Any]] = []
    expected_version = 1
    seen_files: set[str] = set()
    for raw in items:
        if not isinstance(raw, dict):
            raise Stop("Every canonical migration manifest entry must be an object.")
        version = int(raw.get("version") or 0)
        filename = str(raw.get("file") or "").strip()
        recovery = str(raw.get("recovery") or "").strip()
        description = str(raw.get("description") or "").strip()
        if version != expected_version:
            raise Stop(f"Migration versions must be contiguous; expected {expected_version}, found {version}.")
        if not re.fullmatch(rf"{version:04d}_[a-z0-9][a-z0-9_\-]*\.sql", filename):
            raise Stop(f"Migration filename does not match version {version:04d}: {filename}")
        if filename in seen_files:
            raise Stop(f"Duplicate migration file in manifest: {filename}")
        if len(recovery) < 24:
            raise Stop(f"Migration {filename} needs a concrete recovery note.")
        if len(description) < 12:
            raise Stop(f"Migration {filename} needs a useful description.")
        path = MIGRATIONS_DIR / filename
        if not path.is_file():
            raise Stop(f"Canonical migration file is missing: {filename}")
        body = path.read_bytes()
        if not body.strip():
            raise Stop(f"Canonical migration file is empty: {filename}")
        normalized.append({
            **raw,
            "version": version,
            "file": filename,
            "sha256": sha256_bytes(body),
            "recovery_sha256": sha256_text(recovery),
        })
        seen_files.add(filename)
        expected_version += 1

    manifest_hash = sha256_bytes(MANIFEST_PATH.read_bytes())
    return manifest, normalized, manifest_hash


def environment_authority(target: str) -> dict[str, str]:
    authority = read_json(ENVIRONMENT_PATH)
    section = authority.get("development" if target == "development" else "production") or {}
    d1 = section.get("d1") or {}
    name = str(d1.get("name") or "").strip()
    database_id = str(d1.get("id") or "").strip()
    expected = {
        "development": ("devilndove-dev", "dbc1615b-dcbe-4951-973b-b47c99c73bfa"),
        "production": ("devilndove-prod-r462", "f34a741b-0000-45b0-9a96-6be08754d563"),
    }[target]
    if (name, database_id) != expected:
        raise Stop(f"{target.title()} D1 authority does not match the Release 463 environment boundary.")
    return {"name": name, "id": database_id}


def npx_executable() -> str:
    value = shutil.which("npx.cmd") or shutil.which("npx")
    if not value:
        raise Stop("npx is required to run the canonical D1 migration applicator.")
    return value


def make_config(target: str, d1: dict[str, str]) -> Path:
    fd, name = tempfile.mkstemp(prefix=f"dnd-{target}-d1-", suffix=".toml", dir=ROOT)
    os.close(fd)
    path = Path(name)
    path.write_text(
        "\n".join([
            'name = "devilndove-site"',
            'compatibility_date = "2026-04-08"',
            'pages_build_output_dir = "."',
            "",
            "[vars]",
            f'DND_ENVIRONMENT = "{target}"',
            'DND_PAGES_PROJECT = "devilndove-site"',
            "",
            "[[d1_databases]]",
            'binding = "DB"',
            f'database_name = "{d1["name"]}"',
            f'database_id = "{d1["id"]}"',
            f'migrations_dir = "{MIGRATIONS_DIR.relative_to(ROOT).as_posix()}"',
            "",
        ]),
        encoding="utf-8",
    )
    return path


def run(args: list[str], *, capture: bool = False) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        args, cwd=ROOT, text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        check=False,
    )
    if result.returncode:
        detail = ""
        if capture:
            detail = (result.stderr or result.stdout or "").strip()
        raise Stop(f"Command failed ({result.returncode}): {' '.join(args[:6])}{': ' + detail[-1500:] if detail else ''}")
    return result


def wrangler_args(config: Path, *parts: str) -> list[str]:
    return [npx_executable(), "--yes", f"wrangler@{WRANGLER_VERSION}", *parts, "--config", str(config)]


def execute_json(config: Path, sql: str) -> Any:
    result = run(
        wrangler_args(config, "d1", "execute", "DB", "--remote", "--json", "--command", sql),
        capture=True,
    )
    try:
        return json.loads(result.stdout or "[]")
    except json.JSONDecodeError as exc:
        raise Stop(f"Wrangler did not return JSON for a D1 verification query: {exc}") from exc


def result_rows(value: Any) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    def walk(node: Any) -> None:
        if isinstance(node, dict):
            results = node.get("results")
            if isinstance(results, list):
                for row in results:
                    if isinstance(row, dict):
                        found.append(row)
            for child in node.values():
                walk(child)
        elif isinstance(node, list):
            for child in node:
                walk(child)
    walk(value)
    return found


def table_exists(config: Path, table: str) -> bool:
    safe = table.replace("'", "''")
    rows = result_rows(execute_json(config, f"SELECT name FROM sqlite_master WHERE type='table' AND name='{safe}';"))
    return any(str(row.get("name") or "") == table for row in rows)


def native_migrations(config: Path) -> dict[str, dict[str, Any]]:
    if not table_exists(config, NATIVE_LEDGER):
        return {}
    rows = result_rows(execute_json(config, f"SELECT id, name, applied_at FROM {NATIVE_LEDGER} ORDER BY id;"))
    return {str(row.get("name") or ""): row for row in rows if str(row.get("name") or "")}


def proof_rows(config: Path) -> dict[str, dict[str, Any]]:
    if not table_exists(config, PROOF_TABLE):
        return {}
    rows = result_rows(execute_json(config, f"SELECT migration_name, migration_sha256, manifest_sha256, source_sha, environment, recovery_note_sha256, applied_at, verified_at FROM {PROOF_TABLE} ORDER BY schema_migration_proof_id;"))
    return {str(row.get("migration_name") or ""): row for row in rows if str(row.get("migration_name") or "")}


def sql_string(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def record_proof(config: Path, target: str, item: dict[str, Any], manifest_hash: str, source_sha: str) -> None:
    existing = proof_rows(config).get(item["file"])
    if existing:
        if str(existing.get("migration_sha256") or "") != item["sha256"]:
            raise Stop(f"IMMUTABILITY FAILURE: {item['file']} checksum differs from its existing {target} proof.")
        if str(existing.get("recovery_note_sha256") or "") != item["recovery_sha256"]:
            raise Stop(f"IMMUTABILITY FAILURE: {item['file']} recovery note differs from its existing {target} proof.")
        return
    sql = (
        f"INSERT INTO {PROOF_TABLE} (migration_name, migration_sha256, manifest_sha256, source_sha, environment, recovery_note_sha256, applied_at, verified_at) VALUES ("
        f"{sql_string(item['file'])}, {sql_string(item['sha256'])}, {sql_string(manifest_hash)}, {sql_string(source_sha)}, "
        f"{sql_string(target)}, {sql_string(item['recovery_sha256'])}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
    )
    execute_json(config, sql)


def verify_canonical_state(config: Path, target: str, items: list[dict[str, Any]], manifest_hash: str) -> dict[str, Any]:
    ledger = native_migrations(config)
    missing = [item["file"] for item in items if item["file"] not in ledger]
    if missing:
        raise Stop(f"{target.title()} canonical D1 migrations are missing from {NATIVE_LEDGER}: {', '.join(missing)}")
    proofs = proof_rows(config)
    for item in items:
        proof = proofs.get(item["file"])
        if not proof:
            raise Stop(f"{target.title()} migration proof is missing for {item['file']}.")
        if str(proof.get("migration_sha256") or "") != item["sha256"]:
            raise Stop(f"{target.title()} checksum proof mismatch for {item['file']}.")
        if str(proof.get("recovery_note_sha256") or "") != item["recovery_sha256"]:
            raise Stop(f"{target.title()} recovery-note proof mismatch for {item['file']}.")
        if str(proof.get("environment") or "") != target:
            raise Stop(f"{target.title()} proof environment mismatch for {item['file']}.")
    fk = result_rows(execute_json(config, "PRAGMA foreign_key_check;"))
    if fk:
        raise Stop(f"{target.title()} foreign_key_check returned {len(fk)} violation row(s).")
    return {
        "target": target,
        "canonical_migrations": len(items),
        "native_ledger_rows": len(ledger),
        "proof_rows": len(proofs),
        "manifest_sha256": manifest_hash,
        "foreign_key_violations": 0,
    }


def verify_development_before_production(items: list[dict[str, Any]], manifest_hash: str) -> None:
    dev = environment_authority("development")
    config = make_config("development", dev)
    try:
        state = verify_canonical_state(config, "development", items, manifest_hash)
        print("DEVELOPMENT-FIRST MIGRATION PROOF: PASS", json.dumps(state, sort_keys=True))
    finally:
        config.unlink(missing_ok=True)


def apply_native(config: Path, target: str) -> None:
    print(f"Applying pending canonical migrations to {target} via Cloudflare D1 native migrations...")
    # Wrangler 4 automatically skips the confirmation prompt in CI. `--yes` is an
    # npx package-install flag only and is intentionally not forwarded to this command.
    run(wrangler_args(config, "d1", "migrations", "apply", "DB", "--remote"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply/verify canonical forward D1 migrations.")
    parser.add_argument("--target", choices=("development", "production"), required=True)
    parser.add_argument("--apply", action="store_true", help="Apply pending canonical migrations before verification.")
    parser.add_argument("--source-sha", default="", help="Source SHA recorded with any newly applied proof rows.")
    parser.add_argument("--production-ack", default="", help="Production requires the literal LIVE_SCHEMA_CHANGE.")
    args = parser.parse_args()

    target = args.target
    _, items, manifest_hash = canonical_manifest()
    source_sha = current_source_sha(args.source_sha)

    if target == "production":
        if args.apply and args.production_ack != "LIVE_SCHEMA_CHANGE":
            raise Stop("Production apply requires --production-ack LIVE_SCHEMA_CHANGE.")
        branch = current_branch()
        if args.apply and branch and branch != "main":
            raise Stop(f"Production migration apply is refused outside main (current branch: {branch}).")
        verify_development_before_production(items, manifest_hash)

    authority = environment_authority(target)
    config = make_config(target, authority)
    try:
        before = native_migrations(config)
        if args.apply:
            # Existing proof rows are checked before mutation so an edited migration cannot
            # silently progress after it has already been proven in this environment.
            existing_proofs = proof_rows(config)
            for item in items:
                proof = existing_proofs.get(item["file"])
                if proof and str(proof.get("migration_sha256") or "") != item["sha256"]:
                    raise Stop(f"IMMUTABILITY FAILURE before apply: {item['file']} changed after {target} proof.")
                if proof and str(proof.get("recovery_note_sha256") or "") != item["recovery_sha256"]:
                    raise Stop(f"IMMUTABILITY FAILURE before apply: recovery note changed for {item['file']}.")
            apply_native(config, target)

        after = native_migrations(config)
        newly_visible = [item for item in items if item["file"] in after and item["file"] not in before]
        already_visible = [item for item in items if item["file"] in after and item["file"] in before]
        for item in [*already_visible, *newly_visible]:
            record_proof(config, target, item, manifest_hash, source_sha)

        state = verify_canonical_state(config, target, items, manifest_hash)
        state.update({
            "database_name": authority["name"],
            "database_id": authority["id"],
            "source_sha": source_sha,
            "newly_applied": [item["file"] for item in newly_visible],
            "mode": "apply-and-verify" if args.apply else "verify-only",
        })
        print("CANONICAL D1 MIGRATION AUTHORITY: PASS")
        print(json.dumps(state, indent=2, sort_keys=True))
        return 0
    finally:
        config.unlink(missing_ok=True)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Stop as exc:
        print(f"CANONICAL D1 MIGRATION AUTHORITY: STOP — {exc}", file=sys.stderr)
        raise SystemExit(2)

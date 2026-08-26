#!/usr/bin/env python3
"""Build 440 — guarded Development Tool/Supply R2 restore.

Authorized scope:
- READ current Development D1 Tool/Supply image authority.
- READ public https://assets.devilndove.com source objects.
- WRITE only the 498 current canonical D1 objects to devilndove-toolshed-images-dev.
- NEVER write/delete/rename Production R2, mutate D1, or overwrite an existing Dev object.

Important authority rule:
The historical source inventory may contain more objects than the current Development
catalogue. Current Development D1 is the restore authority. The historical manifest is
used only as an integrity-metadata lookup for those current D1 keys. Historical
manifest-only objects are reported and ignored; they are never restored automatically.

Two phases:
  --dry-run  validates the exact current D1 key set, resolves recorded byte size +
             SHA-256 metadata for every authorized key, and verifies every public
             source. No R2 writes.
  --apply    repeats those checks, verifies/skips any already-present Dev object,
             writes only missing objects, then downloads each written object back and
             verifies byte size + SHA-256.

Temporary files live outside the repository so normal git status stays clean.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from urllib.parse import quote, unquote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DEV_BRANCH = "dev"
DEV_D1 = "devilndove-dev"
DEV_D1_ID = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"
DEV_BUCKET = "devilndove-toolshed-images-dev"
PUBLIC_ORIGIN = "https://assets.devilndove.com"
AUTHORIZED_EXPECTED_KEYS = 498
WRANGLER_VERSION = "4.126.0"
APPLY_TOKEN = "BUILD440_DEV_R2_RESTORE"
MANIFEST_PATH = ROOT / "data" / "supplies" / "supplies_images_inventory.csv"
CACHE_ROOT = Path(tempfile.gettempdir()) / "devilndove-build440-r2-restore"
CACHE_SOURCE = CACHE_ROOT / "source"
CACHE_PROBE = CACHE_ROOT / "probe"
HEX64 = re.compile(r"^[0-9a-f]{64}$", re.I)
PRINT_LOCK = threading.Lock()


@dataclass(frozen=True)
class Asset:
    key: str
    size: int
    sha256: str

    @property
    def source_url(self) -> str:
        return f"{PUBLIC_ORIGIN}/{quote(self.key, safe='/')}"

    @property
    def cache_path(self) -> Path:
        suffix = Path(self.key).suffix or ".bin"
        token = hashlib.sha256(self.key.encode("utf-8")).hexdigest()
        return CACHE_SOURCE / f"{token}{suffix}"


def log(message: str) -> None:
    with PRINT_LOCK:
        print(message, flush=True)


def fail(message: str, code: int = 2) -> "NoReturn":
    print(f"STOP: {message}", file=sys.stderr, flush=True)
    raise SystemExit(code)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_file(path: Path, asset: Asset) -> tuple[bool, str]:
    if not path.exists():
        return False, "missing"
    actual_size = path.stat().st_size
    if actual_size != asset.size:
        return False, f"size {actual_size} != {asset.size}"
    actual_sha = sha256_file(path)
    if actual_sha.lower() != asset.sha256.lower():
        return False, f"sha256 {actual_sha} != {asset.sha256}"
    return True, "verified"


def current_branch() -> str:
    result = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def validate_environment() -> None:
    if current_branch() != DEV_BRANCH:
        fail(f"Restore must run from branch {DEV_BRANCH!r}.")

    wrangler_toml = (ROOT / "wrangler.toml").read_text(encoding="utf-8")
    required = [
        f'database_name = "{DEV_D1}"',
        f'database_id = "{DEV_D1_ID}"',
        'binding = "PRODUCT_MEDIA_BUCKET"',
        f'bucket_name = "{DEV_BUCKET}"',
    ]
    missing = [value for value in required if value not in wrangler_toml]
    if missing:
        fail(f"Development binding guard failed; wrangler.toml is missing: {missing}")

    # The destination constant itself is fixed above; this additional check ensures
    # the checked-in Development binding still names that same bucket.
    if f'bucket_name = "{DEV_BUCKET}"' not in wrangler_toml:
        fail("Development Product Media bucket is not selected; refusing restore.")


def load_manifest_index() -> dict[str, Asset]:
    """Load all historical source integrity metadata without making it authority."""
    if not MANIFEST_PATH.exists():
        fail(f"Source manifest not found: {MANIFEST_PATH}")

    by_key: dict[str, Asset] = {}
    with MANIFEST_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"r2_object_key", "file_size_bytes", "sha256"}
        if not required.issubset(set(reader.fieldnames or [])):
            fail(f"Source manifest is missing required columns: {sorted(required)}")

        for row in reader:
            key = str(row.get("r2_object_key") or "").strip()
            if not key:
                continue
            if not (key.startswith("Supplies/") or key.startswith("Tools/")):
                fail(f"Unsupported R2 key outside Tool/Supply scope: {key}")

            try:
                size = int(str(row.get("file_size_bytes") or "0").strip())
            except ValueError:
                fail(f"Invalid file_size_bytes for {key}")

            digest = str(row.get("sha256") or "").strip().lower()
            if size <= 0 or not HEX64.fullmatch(digest):
                fail(f"Missing/invalid integrity metadata for {key}")

            asset = Asset(key=key, size=size, sha256=digest)
            previous = by_key.get(key)
            if previous and previous != asset:
                fail(f"Conflicting manifest metadata for duplicate key {key}")
            by_key[key] = asset

    if len(by_key) < AUTHORIZED_EXPECTED_KEYS:
        fail(
            f"Historical manifest contains only {len(by_key)} unique keys, fewer than "
            f"the authorized current D1 set of {AUTHORIZED_EXPECTED_KEYS}."
        )
    return by_key


def npx_executable() -> str:
    candidate = shutil.which("npx.cmd") if os.name == "nt" else None
    return candidate or shutil.which("npx") or "npx"


def wrangler(args: list[str], *, timeout: int = 180) -> subprocess.CompletedProcess[str]:
    cmd = [npx_executable(), "--yes", f"wrangler@{WRANGLER_VERSION}", *args]
    return subprocess.run(
        cmd,
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
        timeout=timeout,
        env={**os.environ, "NO_COLOR": "1", "FORCE_COLOR": "0"},
    )


def parse_json_stdout(text: str):
    raw = text.strip()
    for marker in ("[", "{"):
        pos = raw.find(marker)
        if pos >= 0:
            try:
                return json.loads(raw[pos:])
            except json.JSONDecodeError:
                pass
    fail(f"Wrangler did not return parseable JSON. First output: {raw[:300]!r}")


def canonical_key(value: str) -> str:
    raw = str(value or "").strip()
    public_prefix = PUBLIC_ORIGIN + "/"
    if raw.lower().startswith(public_prefix.lower()):
        key = raw[len(public_prefix):]
    elif raw.startswith("Tools/") or raw.startswith("Supplies/"):
        key = raw
    else:
        return ""

    try:
        return unquote(key)
    except Exception:
        return key


def load_d1_expected_keys() -> set[str]:
    """Read the current Development D1 authority. This defines restore scope."""
    sql = """
SELECT catalog_item_id,item_kind,image_url
FROM catalog_items
WHERE item_kind IN ('tool','supply')
  AND COALESCE(status,'active')='active'
  AND TRIM(COALESCE(image_url,''))<>''
ORDER BY item_kind ASC,catalog_item_id ASC
LIMIT 1200;
""".strip()

    result = wrangler([
        "d1", "execute", DEV_D1,
        "--remote", "--json", "--command", sql,
    ], timeout=240)
    if result.returncode != 0:
        fail(f"Development D1 read failed: {(result.stderr or result.stdout)[-1200:]}")

    payload = parse_json_stdout(result.stdout)
    rows: list[dict] = []
    blocks = payload if isinstance(payload, list) else [payload]
    for block in blocks:
        if isinstance(block, dict) and isinstance(block.get("results"), list):
            rows.extend(block["results"])

    keys: set[str] = set()
    unsupported: list[str] = []
    for row in rows:
        raw = str(row.get("image_url") or "").strip()
        key = canonical_key(raw)
        if key:
            if not (key.startswith("Supplies/") or key.startswith("Tools/")):
                unsupported.append(raw)
            else:
                keys.add(key)
        else:
            unsupported.append(raw)

    if unsupported:
        fail(f"Development D1 contains unsupported Tool/Supply image URLs: {unsupported[:8]}")
    if len(keys) != AUTHORIZED_EXPECTED_KEYS:
        fail(
            f"Development D1 expected-key count changed from authorized "
            f"{AUTHORIZED_EXPECTED_KEYS} to {len(keys)}. Re-run parity before restore."
        )
    return keys


def select_authorized_assets(manifest_index: dict[str, Asset]) -> list[Asset]:
    """Select exactly the current D1 keys from the larger historical manifest."""
    d1_keys = load_d1_expected_keys()
    manifest_keys = set(manifest_index)
    missing_metadata = sorted(d1_keys - manifest_keys)
    historical_only = sorted(manifest_keys - d1_keys)

    log(f"Historical manifest keys available: {len(manifest_keys)}")
    log(f"Current Development D1 authorized keys: {len(d1_keys)}")
    log(f"Historical manifest-only keys ignored: {len(historical_only)}")
    log(f"Current D1 keys missing integrity metadata: {len(missing_metadata)}")

    if missing_metadata:
        fail(
            "Current D1 restore authority contains key(s) without recorded source "
            f"size/SHA metadata: {missing_metadata[:8]}"
        )

    assets = sorted(
        (manifest_index[key] for key in d1_keys),
        key=lambda item: item.key.casefold(),
    )
    if len(assets) != AUTHORIZED_EXPECTED_KEYS:
        fail(
            f"Authorized asset selection produced {len(assets)} objects; expected "
            f"exactly {AUTHORIZED_EXPECTED_KEYS}."
        )

    log(
        f"Current D1 / source-manifest coverage: PASS "
        f"({len(assets)}/{len(d1_keys)} current keys; {len(historical_only)} historical-only ignored)"
    )
    return assets


def verify_public_source(asset: Asset) -> tuple[Asset, str]:
    CACHE_SOURCE.mkdir(parents=True, exist_ok=True)
    path = asset.cache_path
    okay, _ = validate_file(path, asset)
    if okay:
        return asset, "cached"

    temp = path.with_suffix(path.suffix + ".part")
    temp.unlink(missing_ok=True)
    request = Request(
        asset.source_url,
        headers={"User-Agent": "DevilNDove-Build440-Dev-R2-Restore/1.1"},
    )
    try:
        with urlopen(request, timeout=60) as response, temp.open("wb") as handle:
            status = int(getattr(response, "status", 200) or 200)
            if status != 200:
                raise RuntimeError(f"HTTP {status}")
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                handle.write(chunk)
    except Exception as exc:
        temp.unlink(missing_ok=True)
        raise RuntimeError(f"source download failed for {asset.key}: {exc}") from exc

    okay, reason = validate_file(temp, asset)
    if not okay:
        temp.unlink(missing_ok=True)
        raise RuntimeError(f"source integrity failed for {asset.key}: {reason}")
    temp.replace(path)
    return asset, "downloaded"


def verify_all_sources(assets: list[Asset], workers: int) -> int:
    log(f"Verifying {len(assets)} public source objects before any R2 write...")
    total_bytes = 0
    completed = 0

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(verify_public_source, asset): asset for asset in assets}
        try:
            for future in as_completed(futures):
                asset, mode = future.result()
                total_bytes += asset.size
                completed += 1
                if completed % 25 == 0 or completed == len(assets):
                    log(f"  source verified: {completed}/{len(assets)} ({mode})")
        except Exception as exc:
            for pending in futures:
                pending.cancel()
            fail(str(exc))

    log(f"Public source integrity: PASS ({len(assets)}/{len(assets)}, {total_bytes} bytes)")
    return total_bytes


def probe_path(asset: Asset, stage: str) -> Path:
    CACHE_PROBE.mkdir(parents=True, exist_ok=True)
    token = hashlib.sha256((stage + "\0" + asset.key).encode("utf-8")).hexdigest()
    return CACHE_PROBE / f"{token}.bin"


def get_dev_object(asset: Asset, stage: str) -> tuple[str, str]:
    target = probe_path(asset, stage)
    target.unlink(missing_ok=True)
    result = wrangler([
        "r2", "object", "get", f"{DEV_BUCKET}/{asset.key}",
        "--remote", "--file", str(target),
    ], timeout=180)
    combined = f"{result.stdout}\n{result.stderr}".lower()

    if result.returncode != 0:
        target.unlink(missing_ok=True)
        if "specified key does not exist" in combined or "key does not exist" in combined:
            return "missing", ""
        return "error", (result.stderr or result.stdout)[-1200:]

    okay, reason = validate_file(target, asset)
    target.unlink(missing_ok=True)
    if not okay:
        return "mismatch", reason
    return "present_verified", ""


def content_type_for(asset: Asset) -> str:
    suffix = Path(asset.key).suffix.lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".avif": "image/avif",
        ".svg": "image/svg+xml",
    }.get(suffix, "application/octet-stream")


def restore_one(asset: Asset) -> tuple[str, str]:
    status, detail = get_dev_object(asset, "before")
    if status == "present_verified":
        return "already_present_verified", asset.key
    if status == "mismatch":
        raise RuntimeError(
            f"existing Dev object differs from authorized source; refusing overwrite: "
            f"{asset.key} ({detail})"
        )
    if status == "error":
        raise RuntimeError(f"Dev R2 preflight failed for {asset.key}: {detail}")

    # Re-check immediately before PUT so resumptions/concurrent restores cannot
    # silently overwrite an object that appeared after the first probe.
    status, detail = get_dev_object(asset, "before-put")
    if status == "present_verified":
        return "already_present_verified", asset.key
    if status == "mismatch":
        raise RuntimeError(
            f"Dev object appeared with different bytes; refusing overwrite: {asset.key} ({detail})"
        )
    if status == "error":
        raise RuntimeError(f"Dev R2 second preflight failed for {asset.key}: {detail}")

    source_path = asset.cache_path
    okay, reason = validate_file(source_path, asset)
    if not okay:
        raise RuntimeError(f"validated source cache changed before upload: {asset.key} ({reason})")

    result = wrangler([
        "r2", "object", "put", f"{DEV_BUCKET}/{asset.key}",
        "--remote", "--file", str(source_path),
        "--content-type", content_type_for(asset),
    ], timeout=240)
    if result.returncode != 0:
        raise RuntimeError(
            f"Dev R2 PUT failed for {asset.key}: {(result.stderr or result.stdout)[-1200:]}"
        )

    status, detail = get_dev_object(asset, "after")
    if status != "present_verified":
        raise RuntimeError(
            f"Dev R2 post-write verification failed for {asset.key}: {status} {detail}"
        )
    return "restored_verified", asset.key


def apply_restore(assets: list[Asset], workers: int) -> None:
    log("=== BUILD 440 DEVELOPMENT TOOL/SUPPLY R2 RESTORE APPLY ===")
    log(f"Destination bucket: {DEV_BUCKET}")
    log("Production R2 mutation capability: NONE")
    log("D1 mutation capability: NONE")
    log("Existing Dev object overwrite capability: NONE")

    restored = 0
    already = 0
    failures: list[str] = []
    stop = threading.Event()

    def work(asset: Asset):
        if stop.is_set():
            return "not_started", asset.key
        try:
            return restore_one(asset)
        except Exception as exc:
            stop.set()
            raise exc

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(work, asset): asset for asset in assets}
        for future in as_completed(futures):
            asset = futures[future]
            try:
                outcome, _key = future.result()
            except Exception as exc:
                failures.append(str(exc))
                log(f"  FAIL — {asset.key}: {exc}")
                continue

            if outcome == "restored_verified":
                restored += 1
            elif outcome == "already_present_verified":
                already += 1

            done = restored + already
            if done and (done % 20 == 0 or done == len(assets)):
                log(
                    f"  Dev R2 verified: {done}/{len(assets)} "
                    f"(restored {restored}, already present {already})"
                )

    if failures:
        fail(
            f"Restore stopped with {len(failures)} failure(s). No existing Dev object was "
            f"overwritten. First failure: {failures[0]}"
        )

    if restored + already != len(assets):
        fail(
            f"Restore did not process the full authorized set: restored={restored}, "
            f"already={already}, expected={len(assets)}. Re-run --apply to resume safely."
        )

    log("BUILD 440 DEVELOPMENT TOOL/SUPPLY R2 RESTORE: PASS / EXACT")
    log(f"Authorized expected keys: {len(assets)}")
    log(f"Restored + verified this run: {restored}")
    log(f"Already present + byte-verified: {already}")
    log(f"Verified Dev R2 total: {restored + already}")
    log("Production R2 mutation executed: NO")
    log("D1 mutation executed: NO")
    log("PRODUCTION PROMOTION: CLOSED")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build 440 guarded Development Tool/Supply R2 restore"
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--dry-run",
        action="store_true",
        help="Verify current D1 scope + manifest metadata + sources; no R2 writes",
    )
    mode.add_argument(
        "--apply",
        action="store_true",
        help="Restore only missing current Development D1 R2 objects",
    )
    parser.add_argument(
        "--authorization",
        default="",
        help=f"Required with --apply; must equal {APPLY_TOKEN}",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=3,
        help="Bounded parallelism, 1-4 (default 3)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    workers = max(1, min(int(args.workers or 3), 4))

    validate_environment()
    manifest_index = load_manifest_index()
    assets = select_authorized_assets(manifest_index)
    verify_all_sources(assets, workers=max(workers, 3))

    if args.dry_run:
        print("BUILD 440 DEVELOPMENT TOOL/SUPPLY R2 RESTORE DRY RUN: PASS / EXACT")
        print(f"Authorized expected keys: {len(assets)}")
        print(f"Historical manifest keys available: {len(manifest_index)}")
        print(f"Historical manifest-only keys ignored: {len(manifest_index) - len(assets)}")
        print("Public sources: ALL SIZE/SHA VERIFIED")
        print(f"Destination: {DEV_BUCKET}")
        print("Development R2 mutation executed: NO")
        print("Production R2 mutation executed: NO")
        print("D1 mutation executed: NO")
        print("Next authorized action: --apply --authorization BUILD440_DEV_R2_RESTORE")
        return 0

    if args.authorization != APPLY_TOKEN:
        fail(f"--apply requires --authorization {APPLY_TOKEN}")

    apply_restore(assets, workers=workers)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

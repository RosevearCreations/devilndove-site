#!/usr/bin/env python3
"""Restore the final eight Movie covers from validated historical Google Drive copies.

Safety boundary:
- exact eight catalog keys only
- exact SHA-256 authority from the locally validated Drive rescue bundle
- temporary token + temporary Pages project
- conditional no-overwrite R2 writes
- exact R2 read-back + public GET verification
- no D1 mutation and no R2 deletes
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import secrets
import shutil
import time
import urllib.error
import urllib.request
import zipfile

import movie_r2_live_restore as base

PROJECT = "devilndove-movie-r2-recovery"
BUCKET = "devilndove-toolshed-images"
FIRESTORAGE_API = "https://api.firestorage.ai/dev/file"
FIRESTORAGE_SHARE = "nAAQqbMMStNL"
ZIP_NAME = "movie-drive-rescue-8.zip"
ZIP_SIZE = 131539
ZIP_SHA256 = "0bb578ff724a15fe3bee90e932d97cfeed7eae3b69d8a56ff998f96f70732716"
PUBLIC_BASE = "https://pub-f8137eb938da486a9f24410ccf49087c.r2.dev"
ROOT = pathlib.Path("/tmp/movie-drive-rescue-8")
PAYLOAD = ROOT / "payload"
PROOF = ROOT / "proof"
BRIDGE = ROOT / "bridge"
TOKEN_FILE = ROOT / "recovery-token"
ZIP_FILE = ROOT / ZIP_NAME
TRANSIENT_HTTP = {429, 500, 502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527, 530}
MAX_ATTEMPTS = 10

EXPECTED = {
    "movies/027616858627b.jpg": {"size": 11952, "sha256": "1a37c76f1de8f86a49e9883e35657cb377a0dd64f5b1e745f46ac9d86ea92d30"},
    "movies/027616911636.3f.jpg": {"size": 10574, "sha256": "07208a8c62329bb934dc68911989897342e7007f0932212f2e4e4820d8ba2992"},
    "movies/043396078208f.jpg": {"size": 15319, "sha256": "f5d66fb67b80a504557a919b17794ad58c49e536f3ee6fe9124dbe7edc7de008"},
    "movies/057373200193.3f.jpg": {"size": 12095, "sha256": "e50ebc49ed99a6de0cee353c2579fee1059d6a533a9866279dc97d99e885a5a9"},
    "movies/074644906196f.jpg": {"size": 10755, "sha256": "0297006db39d085353be542e0a5402b106703a0ecadf53b90e41db234b8fa98a"},
    "movies/097363368960.3f.jpg": {"size": 43259, "sha256": "11adde3ec2f4d921a98e106e4bcf336c56e9c07d747e42f297a59423f792b3aa"},
    "movies/717951000248b.jpg": {"size": 13033, "sha256": "cde8a69ce425a283968bb1605d66281cb4652c1daa9c7d1edd77459d4146e9d9"},
    "movies/786936238679.3f.jpg": {"size": 11370, "sha256": "4d8c5d42fb79f977250dd583afb77eca05c7f1e3fc6919d59e93122e7cf60ed2"},
}


def log(*args):
    print(*args, flush=True)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def request_bytes(url, *, method="GET", headers=None, data=None, timeout=60):
    req = urllib.request.Request(url, method=method, headers=headers or {}, data=data)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return int(resp.status), resp.headers, resp.read()


def request_json(url, *, method="GET", timeout=60):
    status, headers, body = request_bytes(url, method=method, timeout=timeout)
    return status, headers, json.loads(body.decode("utf-8"))


def reset_dirs():
    if ROOT.exists():
        shutil.rmtree(ROOT)
    for path in (PAYLOAD, PROOF, BRIDGE):
        path.mkdir(parents=True, exist_ok=True)


def download_bundle():
    _, _, listing = request_json(
        f"{FIRESTORAGE_API}/shares/{FIRESTORAGE_SHARE}/files?maxResults=100",
        timeout=60,
    )
    item = next(
        (
            row for row in (listing.get("files") or [])
            if (row.get("fileName") or row.get("name")) == ZIP_NAME
        ),
        None,
    )
    assert item, f"Missing rescue bundle {ZIP_NAME}"
    actual_size = int(item.get("sizeBytes") if item.get("sizeBytes") is not None else item.get("size") or 0)
    assert actual_size == ZIP_SIZE, (actual_size, ZIP_SIZE)
    file_id = item.get("fileId") or item.get("id")
    assert file_id
    _, _, meta = request_json(
        f"{FIRESTORAGE_API}/shares/{FIRESTORAGE_SHARE}/files/{file_id}/download",
        method="POST",
        timeout=60,
    )
    _, _, body = request_bytes(meta["downloadUrl"], timeout=120)
    assert len(body) == ZIP_SIZE, (len(body), ZIP_SIZE)
    assert sha256_bytes(body) == ZIP_SHA256
    ZIP_FILE.write_bytes(body)
    (PROOF / "bundle-verification.json").write_text(
        json.dumps({"name": ZIP_NAME, "size": ZIP_SIZE, "sha256": ZIP_SHA256}, indent=2),
        encoding="utf-8",
    )
    log("DRIVE_RESCUE_BUNDLE=PASS", ZIP_SIZE, ZIP_SHA256)


def validate_payload():
    catalog_path, catalog_keys = base.expected_catalog_keys()
    assert set(EXPECTED) <= catalog_keys
    with zipfile.ZipFile(ZIP_FILE) as archive:
        manifest = json.loads(archive.read("manifest.json"))
        assert int(manifest.get("count") or 0) == 8
        listed = {str(row["key"]): row for row in manifest.get("items") or []}
        assert set(listed) == set(EXPECTED)
        rows = []
        for key in sorted(EXPECTED):
            authority = EXPECTED[key]
            item = listed[key]
            filename = pathlib.Path(key).name
            body = archive.read(filename)
            assert int(item["bytes"]) == authority["size"] == len(body), key
            assert str(item["sha256"]) == authority["sha256"], key
            assert sha256_bytes(body) == authority["sha256"], key
            assert body[:3] == b"\xff\xd8\xff", key
            assert body[-2:] == b"\xff\xd9", key
            dest = PAYLOAD / filename
            dest.write_bytes(body)
            rows.append({
                "key": key,
                "size": authority["size"],
                "sha256": authority["sha256"],
                "local_file": str(dest),
            })
    (PROOF / "restore-manifest.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    (PROOF / "catalog-authority.json").write_text(
        json.dumps({
            "catalog": str(catalog_path),
            "authorized_keys": len(rows),
            "source": "Google Drive historical exact-name copies",
            "d1_mutation": False,
            "r2_delete": False,
            "overwrite_allowed": False,
        }, indent=2),
        encoding="utf-8",
    )
    log("DRIVE_RESCUE_PAYLOAD=PASS keys=8")
    return rows


def build_bridge(rows):
    token = secrets.token_hex(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    expected = {row["key"]: row["sha256"] for row in rows}
    template = pathlib.Path("scripts/recovery/movie-r2-bridge-template.js").read_text(encoding="utf-8")
    assert "__EXPECTED_JSON__" in template and "__TOKEN_SHA256__" in template
    source = template.replace(
        "__EXPECTED_JSON__", json.dumps(expected, separators=(",", ":"))
    ).replace("__TOKEN_SHA256__", token_hash)
    functions = BRIDGE / "functions" / "api"
    functions.mkdir(parents=True, exist_ok=True)
    (functions / "recovery.js").write_text(source, encoding="utf-8")
    (BRIDGE / "index.html").write_text(
        "<!doctype html><title>Movie Drive rescue</title><p>Temporary recovery bridge.</p>\n",
        encoding="utf-8",
    )
    (BRIDGE / "wrangler.toml").write_text(
        'name = "devilndove-movie-r2-recovery"\n'
        'compatibility_date = "2026-09-05"\n'
        'pages_build_output_dir = "."\n\n'
        '[[r2_buckets]]\n'
        'binding = "MOVIE_PROD_BUCKET"\n'
        f'bucket_name = "{BUCKET}"\n'
        f'preview_bucket_name = "{BUCKET}"\n',
        encoding="utf-8",
    )
    TOKEN_FILE.write_text(token, encoding="utf-8")
    TOKEN_FILE.chmod(0o600)
    (PROOF / "bridge-authority.json").write_text(
        json.dumps({
            "project": PROJECT,
            "bucket": BUCKET,
            "authorized_keys": 8,
            "token_sha256": token_hash,
            "token_plaintext_persisted_in_proof": False,
            "conditional_no_overwrite": True,
        }, indent=2),
        encoding="utf-8",
    )
    log("BRIDGE_PREPARE=PASS authorized_keys=8")


def prepare():
    reset_dirs()
    download_bundle()
    rows = validate_payload()
    build_bridge(rows)
    log("MOVIE_DRIVE_RESCUE_PREPARE=PASS")


def deterministic_guard(url, token, rows):
    for _ in range(40):
        status, _ = base.post_bridge(url, "wrong-token", "movies/not-authorized.jpg", b"blocked", timeout=30)
        if status == 403:
            break
        time.sleep(3)
    else:
        raise RuntimeError("Recovery bridge did not become ready")
    status, _ = base.post_bridge(url, token, "movies/not-authorized.jpg", b"blocked", timeout=30)
    assert status == 403, status

    key = rows[0]["key"]
    req = urllib.request.Request(
        url,
        data=b"deliberately-wrong-body",
        method="POST",
        headers={
            "Content-Type": "image/jpeg",
            "Cache-Control": "no-store",
            "x-movie-recovery-token": token,
            "x-recovery-key": key,
            "x-recovery-probe": "hash-lock",
            "User-Agent": "dnd-movie-drive-rescue/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            status = int(resp.status)
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        status = int(exc.code)
        raw = exc.read().decode("utf-8", "replace")
        try:
            payload = json.loads(raw)
        except Exception:
            payload = {"raw": raw[:1000]}
    assert status == 422, (status, payload)
    assert payload.get("probe") is True, payload
    log("HASH_LOCK_GUARD=PASS write_free_probe=true")


def restore(rows, url, token):
    results = []
    for row in rows:
        body = pathlib.Path(row["local_file"]).read_bytes()
        history = []
        result = None
        for attempt in range(MAX_ATTEMPTS):
            try:
                status, payload = base.post_bridge(url, token, row["key"], body)
            except Exception as exc:
                status, payload = 0, {"error": repr(exc)}
            if status in TRANSIENT_HTTP or status == 0:
                history.append({"attempt": attempt + 1, "http_status": status, "error": payload.get("error") or payload.get("raw") or "transient"})
                if attempt < MAX_ATTEMPTS - 1:
                    time.sleep(min(30, 1.5 * (2 ** min(attempt, 5))))
                    continue
            result = {"key": row["key"], "http_status": status, **payload, "attempts": attempt + 1, "retry_history": history}
            break
        assert result is not None
        results.append(result)
        (PROOF / "write-results.partial.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
        if result.get("http_status") != 200 or not result.get("ok") or result.get("state") not in ("restored", "already_exact"):
            (PROOF / "write-results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
            raise RuntimeError("Drive rescue failed closed: " + json.dumps(result)[:1400])
        log("rescued", row["key"], result.get("state"))

    results.sort(key=lambda row: row["key"])
    (PROOF / "write-results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    summary = {
        "total": len(results),
        "restored": sum(row.get("state") == "restored" for row in results),
        "already_exact": sum(row.get("state") == "already_exact" for row in results),
        "conflicts": sum(row.get("state") == "conflict" for row in results),
        "retried_objects": sum(bool(row.get("retry_history")) for row in results),
        "d1_mutation": False,
        "r2_delete": False,
        "overwrite_allowed": False,
    }
    (PROOF / "restore-summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log(json.dumps(summary, indent=2))


def verify_public(rows):
    results = []
    for row in rows:
        url = f"{PUBLIC_BASE}/{row['key']}?drive_rescue_verify={time.time_ns()}"
        verified = False
        for attempt in range(8):
            try:
                req = urllib.request.Request(url, headers={
                    "Accept": "image/*",
                    "Cache-Control": "no-store",
                    "User-Agent": "dnd-movie-drive-rescue/1.0",
                })
                with urllib.request.urlopen(req, timeout=30) as resp:
                    body = resp.read()
                got = sha256_bytes(body)
                assert got == row["sha256"], (row["key"], got, row["sha256"])
                results.append({"key": row["key"], "size": len(body), "sha256": got, "state": "exact"})
                verified = True
                log("public exact", row["key"])
                break
            except urllib.error.HTTPError as exc:
                if exc.code in TRANSIENT_HTTP and attempt < 7:
                    time.sleep(min(30, 2 ** attempt))
                    continue
                raise
        assert verified, row["key"]
        time.sleep(0.5)
    (PROOF / "public-verification.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    assert len(results) == 8
    log("PUBLIC_VERIFY=PASS keys=8")


def upload(base_url):
    rows = json.loads((PROOF / "restore-manifest.json").read_text(encoding="utf-8"))
    assert len(rows) == 8 and TOKEN_FILE.is_file()
    token = TOKEN_FILE.read_text(encoding="utf-8").strip()
    url = base_url.rstrip("/") + "/api/recovery"
    deterministic_guard(url, token, rows)
    restore(rows, url, token)
    verify_public(rows)
    TOKEN_FILE.unlink(missing_ok=True)
    log("MOVIE_DRIVE_RESCUE=PASS")


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("prepare")
    upload_parser = sub.add_parser("upload")
    upload_parser.add_argument("--base-url", required=True)
    args = parser.parse_args()
    if args.command == "prepare":
        prepare()
    else:
        upload(args.base_url)


if __name__ == "__main__":
    main()

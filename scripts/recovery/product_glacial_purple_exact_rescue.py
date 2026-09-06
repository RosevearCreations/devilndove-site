#!/usr/bin/env python3
"""Restore one exact historical Glacial Purple Product image to Production R2.

Safety boundary:
- one exact current Product key only
- exact historical Google Drive filename, byte size and SHA-256
- source ZIP itself pinned by exact size and SHA-256
- temporary Pages project and ephemeral token
- body-hash lock before any write
- conditional If-None-Match:* write; differing existing object is a conflict
- exact R2 read-back and live same-origin Product-media verification
- no D1 mutation, no R2 delete, no overwrite
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
import urllib.parse
import urllib.request
import zipfile

PROJECT = "devilndove-product-r2-exact-recovery"
BUCKET = "devilndove-toolshed-images"
FIRESTORAGE_API = "https://api.firestorage.ai/dev/file"
FIRESTORAGE_SHARE = "sfiW3E8WeBDb"
ZIP_NAME = "product-glacial-purple-rescue-1.zip"
ZIP_SIZE = 1745349
ZIP_SHA256 = "df4384bd62a08219049c0bb6762f612a48773192a676a932fce0ae7c6361deea"
TARGET_KEY = "products/39/1784317274362-20260714_122742.jpg"
PRODUCT_ID = 39
PRODUCT_NAME = "Glacial Purple"
ORIGINAL_FILENAME = "20260714_122742.jpg"
EXPECTED_SIZE = 1775354
EXPECTED_SHA256 = "74e036275fd21d4d360e7006912648666c15aed342949c211124bde9f9e78c14"
PUBLIC_ENDPOINT = "https://devilndove.com/api/product-media"
ROOT = pathlib.Path("/tmp/product-glacial-purple-exact-rescue")
PAYLOAD = ROOT / "payload"
PROOF = ROOT / "proof"
BRIDGE = ROOT / "bridge"
TOKEN_FILE = ROOT / "recovery-token"
ZIP_FILE = ROOT / ZIP_NAME
IMAGE_FILE = PAYLOAD / ORIGINAL_FILENAME
TRANSIENT_HTTP = {429, 500, 502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527, 530}
MAX_ATTEMPTS = 10


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
    _, _, body = request_bytes(meta["downloadUrl"], timeout=180)
    assert len(body) == ZIP_SIZE, (len(body), ZIP_SIZE)
    assert sha256_bytes(body) == ZIP_SHA256
    ZIP_FILE.write_bytes(body)
    (PROOF / "bundle-verification.json").write_text(
        json.dumps({"name": ZIP_NAME, "size": ZIP_SIZE, "sha256": ZIP_SHA256}, indent=2),
        encoding="utf-8",
    )
    log("PRODUCT_RESCUE_BUNDLE=PASS", ZIP_SIZE, ZIP_SHA256)


def validate_payload():
    with zipfile.ZipFile(ZIP_FILE) as archive:
        manifest = json.loads(archive.read("manifest.json"))
        assert int(manifest.get("product_id") or 0) == PRODUCT_ID, manifest
        assert str(manifest.get("product_name") or "") == PRODUCT_NAME, manifest
        assert str(manifest.get("target_key") or "") == TARGET_KEY, manifest
        assert str(manifest.get("original_filename") or "") == ORIGINAL_FILENAME, manifest
        assert int(manifest.get("size") or 0) == EXPECTED_SIZE, manifest
        assert str(manifest.get("sha256") or "") == EXPECTED_SHA256, manifest
        assert manifest.get("safety", {}).get("overwrite_allowed") is False, manifest
        assert manifest.get("safety", {}).get("d1_mutation") is False, manifest
        assert manifest.get("safety", {}).get("r2_delete") is False, manifest
        body = archive.read(ORIGINAL_FILENAME)

    assert len(body) == EXPECTED_SIZE, (len(body), EXPECTED_SIZE)
    assert sha256_bytes(body) == EXPECTED_SHA256
    assert body[:3] == b"\xff\xd8\xff", body[:8]
    assert body[-2:] == b"\xff\xd9", body[-8:]
    IMAGE_FILE.write_bytes(body)

    authority = {
        "product_id": PRODUCT_ID,
        "product_name": PRODUCT_NAME,
        "key": TARGET_KEY,
        "original_filename": ORIGINAL_FILENAME,
        "size": EXPECTED_SIZE,
        "sha256": EXPECTED_SHA256,
        "source": "Google Drive historical exact-name copy",
        "evidence": [
            "exact original filename retained by Production media_assets",
            "exact stored byte size retained by Production media_assets",
            "visual content matches Glacial Purple soap",
        ],
        "d1_mutation": False,
        "r2_delete": False,
        "overwrite_allowed": False,
    }
    (PROOF / "restore-authority.json").write_text(json.dumps(authority, indent=2), encoding="utf-8")
    log("PRODUCT_RESCUE_PAYLOAD=PASS", TARGET_KEY, EXPECTED_SIZE, EXPECTED_SHA256)


def build_bridge():
    token = secrets.token_hex(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    template = pathlib.Path("scripts/recovery/product-r2-exact-bridge-template.js").read_text(encoding="utf-8")
    assert "__EXPECTED_JSON__" in template and "__TOKEN_SHA256__" in template
    source = template.replace(
        "__EXPECTED_JSON__", json.dumps({TARGET_KEY: EXPECTED_SHA256}, separators=(",", ":"))
    ).replace("__TOKEN_SHA256__", token_hash)
    functions = BRIDGE / "functions" / "api"
    functions.mkdir(parents=True, exist_ok=True)
    (functions / "recovery.js").write_text(source, encoding="utf-8")
    (BRIDGE / "index.html").write_text(
        "<!doctype html><title>Product exact recovery</title><p>Temporary recovery bridge.</p>\n",
        encoding="utf-8",
    )
    (BRIDGE / "wrangler.toml").write_text(
        f'name = "{PROJECT}"\n'
        'compatibility_date = "2026-09-05"\n'
        'pages_build_output_dir = "."\n\n'
        '[[r2_buckets]]\n'
        'binding = "PRODUCT_PROD_BUCKET"\n'
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
            "authorized_keys": [TARGET_KEY],
            "token_sha256": token_hash,
            "token_plaintext_persisted_in_proof": False,
            "conditional_no_overwrite": True,
            "d1_binding_present": False,
            "delete_route_present": False,
        }, indent=2),
        encoding="utf-8",
    )
    log("PRODUCT_BRIDGE_PREPARE=PASS authorized_keys=1")


def prepare():
    reset_dirs()
    download_bundle()
    validate_payload()
    build_bridge()
    log("PRODUCT_GLACIAL_PURPLE_PREPARE=PASS")


def bridge_post(url, token, key, body, *, probe=False, timeout=45):
    headers = {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "x-product-recovery-token": token,
        "x-recovery-key": key,
        "User-Agent": "dnd-product-exact-rescue/1.0",
    }
    if probe:
        headers["x-recovery-probe"] = "hash-lock"
    req = urllib.request.Request(url, data=body, method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", "replace")
            return int(resp.status), json.loads(raw)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", "replace")
        try:
            payload = json.loads(raw)
        except Exception:
            payload = {"raw": raw[:1200]}
        return int(exc.code), payload


def retry_expected(label, operation, expected_status, *, expected_probe=None):
    history = []
    for attempt in range(MAX_ATTEMPTS):
        try:
            status, payload = operation()
        except Exception as exc:
            status, payload = 0, {"error": repr(exc)}
        history.append({"attempt": attempt + 1, "http_status": status, "payload": payload})
        if status == expected_status and (expected_probe is None or payload.get("probe") is expected_probe):
            log(label, "PASS", "attempt", attempt + 1)
            return status, payload, history
        if (status in TRANSIENT_HTTP or status == 0) and attempt < MAX_ATTEMPTS - 1:
            time.sleep(min(30, 1.5 * (2 ** min(attempt, 5))))
            continue
        raise RuntimeError(f"{label} failed closed: status={status} payload={json.dumps(payload)[:1200]}")
    raise RuntimeError(f"{label} retry budget exhausted")


def live_preflight():
    url = PUBLIC_ENDPOINT + "?" + urllib.parse.urlencode({
        "key": TARGET_KEY,
        "exact_rescue_preflight": str(time.time_ns()),
    })
    req = urllib.request.Request(url, headers={
        "Accept": "image/*",
        "Cache-Control": "no-store",
        "User-Agent": "dnd-product-exact-rescue/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read(20 * 1024 * 1024)
        got = sha256_bytes(body)
        if len(body) == EXPECTED_SIZE and got == EXPECTED_SHA256:
            state = "already_exact"
        else:
            raise RuntimeError(
                f"LIVE_CONFLICT before recovery: size={len(body)} sha256={got}"
            )
    except urllib.error.HTTPError as exc:
        if exc.code != 404:
            raise
        state = "missing"
    (PROOF / "live-preflight.json").write_text(
        json.dumps({"key": TARGET_KEY, "state": state, "d1_mutation": False, "r2_mutation": False}, indent=2),
        encoding="utf-8",
    )
    log("LIVE_PREFLIGHT=PASS", state)
    return state


def deterministic_guard(url, token):
    wrong_token = retry_expected(
        "WRONG_TOKEN_GUARD",
        lambda: bridge_post(url, "wrong-token", "products/999/not-authorized.jpg", b"blocked"),
        403,
    )
    unauthorized = retry_expected(
        "UNAUTHORIZED_KEY_GUARD",
        lambda: bridge_post(url, token, "products/999/not-authorized.jpg", b"blocked"),
        403,
    )
    hash_lock = retry_expected(
        "HASH_LOCK_GUARD",
        lambda: bridge_post(url, token, TARGET_KEY, b"deliberately-wrong-body", probe=True),
        422,
        expected_probe=True,
    )
    (PROOF / "guard-results.json").write_text(
        json.dumps({
            "wrong_token": wrong_token[2],
            "unauthorized_key": unauthorized[2],
            "hash_lock": hash_lock[2],
            "write_free": True,
        }, indent=2),
        encoding="utf-8",
    )


def restore(url, token, preflight_state):
    body = IMAGE_FILE.read_bytes()
    history = []
    result = None
    for attempt in range(MAX_ATTEMPTS):
        try:
            status, payload = bridge_post(url, token, TARGET_KEY, body, timeout=60)
        except Exception as exc:
            status, payload = 0, {"error": repr(exc)}
        history.append({"attempt": attempt + 1, "http_status": status, "payload": payload})
        if status == 200 and payload.get("ok") is True and payload.get("state") in ("restored", "already_exact"):
            result = {"http_status": status, **payload, "attempts": attempt + 1}
            break
        if (status in TRANSIENT_HTTP or status == 0) and attempt < MAX_ATTEMPTS - 1:
            time.sleep(min(30, 1.5 * (2 ** min(attempt, 5))))
            continue
        raise RuntimeError(
            "PRODUCT_RESTORE failed closed: " + json.dumps({"status": status, "payload": payload})[:1600]
        )
    assert result is not None
    assert result.get("size") == EXPECTED_SIZE, result
    assert result.get("sha256") == EXPECTED_SHA256, result
    evidence = {
        "preflight_state": preflight_state,
        "result": result,
        "history": history,
        "d1_mutation": False,
        "r2_delete": False,
        "overwrite_allowed": False,
    }
    (PROOF / "restore-result.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    log("PRODUCT_RESTORE=PASS", TARGET_KEY, result.get("state"))


def verify_public():
    results = []
    for attempt in range(MAX_ATTEMPTS):
        url = PUBLIC_ENDPOINT + "?" + urllib.parse.urlencode({
            "key": TARGET_KEY,
            "exact_rescue_verify": str(time.time_ns()),
        })
        req = urllib.request.Request(url, headers={
            "Accept": "image/*",
            "Cache-Control": "no-store",
            "User-Agent": "dnd-product-exact-rescue/1.0",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                status = int(resp.status)
                ctype = str(resp.headers.get("Content-Type") or "").lower()
                body = resp.read(20 * 1024 * 1024)
            got = sha256_bytes(body)
            row = {
                "attempt": attempt + 1,
                "http_status": status,
                "content_type": ctype,
                "size": len(body),
                "sha256": got,
            }
            results.append(row)
            if status == 200 and ctype.startswith("image/") and len(body) == EXPECTED_SIZE and got == EXPECTED_SHA256:
                (PROOF / "public-verification.json").write_text(
                    json.dumps({"key": TARGET_KEY, "state": "exact", "attempts": results}, indent=2),
                    encoding="utf-8",
                )
                log("PUBLIC_VERIFY=PASS", TARGET_KEY, len(body), got)
                return
            raise RuntimeError(f"public verification mismatch: {row}")
        except urllib.error.HTTPError as exc:
            results.append({"attempt": attempt + 1, "http_status": int(exc.code)})
            if (exc.code == 404 or exc.code in TRANSIENT_HTTP) and attempt < MAX_ATTEMPTS - 1:
                time.sleep(min(30, 2 ** min(attempt, 5)))
                continue
            raise
        except Exception:
            if attempt < MAX_ATTEMPTS - 1:
                time.sleep(min(30, 2 ** min(attempt, 5)))
                continue
            raise
    raise RuntimeError("PUBLIC_VERIFY retry budget exhausted")


def upload(base_url):
    assert IMAGE_FILE.exists() and TOKEN_FILE.exists(), "prepare output missing"
    token = TOKEN_FILE.read_text(encoding="utf-8").strip()
    url = base_url.rstrip("/") + "/api/recovery"
    preflight_state = live_preflight()
    deterministic_guard(url, token)
    restore(url, token, preflight_state)
    verify_public()
    summary = {
        "product_id": PRODUCT_ID,
        "product_name": PRODUCT_NAME,
        "key": TARGET_KEY,
        "size": EXPECTED_SIZE,
        "sha256": EXPECTED_SHA256,
        "public_exact": True,
        "d1_mutation": False,
        "r2_delete": False,
        "overwrite_allowed": False,
    }
    (PROOF / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log(json.dumps(summary, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("prepare", "upload"))
    parser.add_argument("--base-url", default="")
    args = parser.parse_args()
    if args.command == "prepare":
        prepare()
    else:
        if not args.base_url:
            raise SystemExit("--base-url is required for upload")
        upload(args.base_url)


if __name__ == "__main__":
    main()

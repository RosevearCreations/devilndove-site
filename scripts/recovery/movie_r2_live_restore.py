import argparse
import concurrent.futures
import hashlib
import json
import pathlib
import re
import secrets
import shutil
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

PROJECT = "devilndove-movie-r2-recovery"
BUCKET = "devilndove-toolshed-images"
FIRESTORAGE_API = "https://api.firestorage.ai/dev/file"
FIRESTORAGE_SHARE = "tMLKzijYYWeR"
R2_HOST = "pub-f8137eb938da486a9f24410ccf49087c.r2.dev"
PUBLIC_BASE = f"https://{R2_HOST}"
TRANSPORTS = {
    "movie-r2-recovery.transport-01.zip": (25181721, "f26cb76f8d38672af3724c482bd318e449943a27b5c6a4b41894c02b0bdc3ce5"),
    "movie-r2-recovery.transport-02.zip": (25247956, "b1dae6c4e17cb16b628fe85a556ef5e80943023d9325262ee7b3b027d35e919c"),
    "movie-r2-recovery.transport-03.zip": (25137487, "6f63ec0bc1af9c560fd2d05b0e3cc6fe8f8606c837bba09e351add7b348617fc"),
    "movie-r2-recovery.transport-04.zip": (25245383, "b3b5d59a232d59b30d439eb5f1deb471892f6537b00fe1c548d67a0411ac9829"),
    "movie-r2-recovery.transport-05.zip": (25102674, "1283c10e2dde35aa8257c25848d6864d3739cdd966afdfaefd24f79450725765"),
    "movie-r2-recovery.transport-06.zip": (25239436, "d722d2592c0cc5ea471de1fb95c11a4419418273a69d168ca33a0120997a45c1"),
    "movie-r2-recovery.transport-07.zip": (25253863, "d26f1969087914a277841479dbb1194e3701f8539c7b4030f6d90eb915974e84"),
    "movie-r2-recovery.transport-08.zip": (25223442, "bf9c2805141581326ec8688a005c1b1b59d1f072348c437ee689dbb5ea22f9e3"),
    "movie-r2-recovery.transport-09.zip": (25248450, "8535ad20915a016e29ecbc0af040188b01de0ca4cd293b093e7befed753b70da"),
    "movie-r2-recovery.transport-10.zip": (25216452, "593ab58a4448fc95d36b5b1c35623685c15fba04c1268d1723c05a36873ea174"),
    "movie-r2-recovery.transport-11.zip": (14294103, "7f11898bfb974c162d106d35932ddb435ba1f3c9c21c7ec162f086c5bfc21048"),
    "master-manifest.json": (2855, "ba0638be16de0c7554a1546f5f47ce37afb0af308a0113703f29ace04e5cc82d"),
}

ROOT = pathlib.Path("/tmp/movie-recovery-v2")
TRANSPORT_DIR = ROOT / "transports"
PAYLOAD = ROOT / "payload"
PROOF = ROOT / "proof"
BRIDGE = ROOT / "bridge"
TOKEN_FILE = ROOT / "recovery-token"


def log(*args):
    print(*args, flush=True)


def text(value):
    return str(value or "").strip()


def sha256_bytes(data):
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
    for path in (TRANSPORT_DIR, PAYLOAD, PROOF, BRIDGE):
        path.mkdir(parents=True, exist_ok=True)


def catalog_key(value):
    value = text(value)
    if not value:
        return ""
    parsed = urllib.parse.urlparse(value)
    if parsed.hostname and parsed.hostname.lower() == R2_HOST:
        path = urllib.parse.unquote(parsed.path.lstrip("/"))
        if path.startswith("movies/") and path.lower().endswith(".jpg"):
            return path
    if value.startswith("movies/") and value.lower().endswith(".jpg"):
        return value
    return ""


def expected_catalog_keys():
    paths = [
        pathlib.Path("data/movies/movie_catalog_enriched.v2.json"),
        pathlib.Path("data/movies/movie_catalog_enriched.json"),
        pathlib.Path("data/catalog.json"),
    ]
    for path in paths:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8-sig"))
        except Exception:
            continue
        rows = data if isinstance(data, list) else (
            data.get("items") or data.get("movies") or data.get("titles") or []
        ) if isinstance(data, dict) else []
        if not isinstance(rows, list) or not rows:
            continue
        keys = set()
        for row in rows:
            if not isinstance(row, dict) or text(row.get("status")).lower() == "archived":
                continue
            upc = text(row.get("upc") or row.get("UPC") or row.get("barcode") or row.get("code"))
            front = text(row.get("front_image_url") or row.get("front_image") or row.get("image_front") or row.get("cover_front") or row.get("frontImageUrl"))
            back = text(row.get("back_image_url") or row.get("back_image") or row.get("image_back") or row.get("cover_back") or row.get("backImageUrl"))
            if not front and upc:
                front = f"{PUBLIC_BASE}/movies/{upc}f.jpg"
            if not back and upc:
                back = f"{PUBLIC_BASE}/movies/{upc}b.jpg"
            for url in (front, back):
                key = catalog_key(url)
                if key:
                    keys.add(key)
        if keys:
            return path, keys
    raise RuntimeError("No current movie catalog authority could be resolved.")


def firestorage_listing():
    _, _, data = request_json(
        f"{FIRESTORAGE_API}/shares/{FIRESTORAGE_SHARE}/files?maxResults=1000",
        timeout=60,
    )
    return {
        (item.get("fileName") or item.get("name") or ""): item
        for item in data.get("files") or []
    }


def download_transports():
    listing = firestorage_listing()
    evidence = []
    for name, (expected_size, expected_sha) in TRANSPORTS.items():
        item = listing.get(name)
        assert item, f"Missing transport in share: {name}"
        actual_size = int(item.get("sizeBytes") if item.get("sizeBytes") is not None else item.get("size") or 0)
        assert actual_size == expected_size, (name, actual_size, expected_size)
        file_id = item.get("fileId") or item.get("id")
        assert file_id
        _, _, meta = request_json(
            f"{FIRESTORAGE_API}/shares/{FIRESTORAGE_SHARE}/files/{file_id}/download",
            method="POST",
            timeout=60,
        )
        _, _, body = request_bytes(meta["downloadUrl"], timeout=300)
        assert len(body) == expected_size, (name, len(body), expected_size)
        actual_sha = sha256_bytes(body)
        assert actual_sha == expected_sha, (name, actual_sha, expected_sha)
        out = TRANSPORT_DIR / name
        out.write_bytes(body)
        evidence.append({"name": name, "size": expected_size, "sha256": expected_sha})
        log("transport exact:", name)
    (PROOF / "transport-verification.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")


def reconstruct_payload():
    catalog_path, expected = expected_catalog_keys()
    assert len(expected) == 2616, (catalog_path, len(expected))
    master = json.loads((TRANSPORT_DIR / "master-manifest.json").read_text(encoding="utf-8"))
    assert master.get("expected_catalog_keys") == 2616, master
    assert master.get("valid_recoverable_keys") == 2608, master
    quarantine = set(master.get("quarantined_invalid_keys") or [])
    assert len(quarantine) == 8, quarantine

    manifest = {}
    source = {}
    for zp in sorted(TRANSPORT_DIR.glob("movie-r2-recovery.transport-*.zip")):
        with zipfile.ZipFile(zp) as archive:
            rows = json.loads(archive.read("movie-r2-recovery/part-manifest.json"))
            for row in rows:
                key = str(row["key"])
                member = "movie-r2-recovery/" + str(row["file"])
                assert re.fullmatch(r"movies/[A-Za-z0-9._-]+\.jpg", key), key
                assert key not in manifest, key
                body = archive.read(member)
                assert len(body) == int(row["size"]), key
                assert sha256_bytes(body) == row["sha256"], key
                assert body[:2] == b"\xff\xd8", key
                manifest[key] = dict(row)
                source[key] = (zp, member)

    assert len(manifest) == 2608
    assert set(manifest) <= expected
    assert expected - set(manifest) == quarantine
    rows = []
    for key in sorted(manifest):
        row = dict(manifest[key])
        zp, member = source[key]
        with zipfile.ZipFile(zp) as archive:
            body = archive.read(member)
        dest = PAYLOAD / pathlib.Path(key).name
        dest.write_bytes(body)
        row["local_file"] = str(dest)
        rows.append(row)

    authority = {
        "catalog": str(catalog_path),
        "expected_keys": len(expected),
        "valid_recoverable_keys": len(rows),
        "quarantined_invalid_keys": sorted(quarantine),
        "d1_mutation": False,
        "r2_delete": False,
        "overwrite_allowed": False,
    }
    (PROOF / "catalog-authority.json").write_text(json.dumps(authority, indent=2), encoding="utf-8")
    (PROOF / "restore-manifest.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    (PROOF / "quarantined-invalid.json").write_text(json.dumps(sorted(quarantine), indent=2), encoding="utf-8")
    log("BACKUP_PAYLOAD=PASS valid=2608 quarantined=8")
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
        "<!doctype html><title>Movie image recovery</title><p>Temporary recovery bridge.</p>\n",
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
            "authorized_keys": len(expected),
            "token_sha256": token_hash,
            "token_plaintext_persisted_in_proof": False,
            "conditional_no_overwrite": True,
        }, indent=2),
        encoding="utf-8",
    )
    log("BRIDGE_PREPARE=PASS authorized_keys=2608")


def prepare():
    reset_dirs()
    download_transports()
    rows = reconstruct_payload()
    build_bridge(rows)
    log("MOVIE_R2_PREPARE=PASS")


def post_bridge(url, token, key, body, timeout=90):
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "x-movie-recovery-token": token,
        "x-recovery-key": key,
        "User-Agent": "dnd-movie-r2-recovery/2.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return int(resp.status), json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", "replace")
        try:
            payload = json.loads(raw)
        except Exception:
            payload = {"raw": raw[:1000]}
        return int(exc.code), payload


def prove_guard(url, token, rows):
    for _ in range(40):
        status, _ = post_bridge(url, "wrong-token", "movies/not-authorized.jpg", b"blocked", timeout=30)
        if status == 403:
            break
        time.sleep(3)
    else:
        raise RuntimeError("Recovery bridge did not become ready")
    status, _ = post_bridge(url, token, "movies/not-authorized.jpg", b"blocked", timeout=30)
    assert status == 403, status
    status, _ = post_bridge(url, token, rows[0]["key"], b"deliberately-wrong-body", timeout=30)
    assert status == 422, status
    log("HASH_LOCK_GUARD=PASS")


def restore(rows, url, token):
    def one(row):
        body = pathlib.Path(row["local_file"]).read_bytes()
        for attempt in range(7):
            try:
                status, payload = post_bridge(url, token, row["key"], body)
            except Exception as exc:
                if attempt < 6:
                    time.sleep(min(30, 2 ** attempt))
                    continue
                return {"key": row["key"], "http_status": 0, "error": repr(exc)}
            if status in (429, 500, 502, 503, 504) and attempt < 6:
                time.sleep(min(30, 2 ** attempt))
                continue
            return {"key": row["key"], "http_status": status, **payload}

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(one, row) for row in rows]
        for index, future in enumerate(concurrent.futures.as_completed(futures), 1):
            result = future.result()
            results.append(result)
            if result.get("http_status") != 200 or not result.get("ok") or result.get("state") not in ("restored", "already_exact"):
                (PROOF / "write-results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
                raise RuntimeError("Recovery failed closed: " + json.dumps(result)[:1200])
            if index % 100 == 0 or index == len(rows):
                log(
                    "processed", index, "/", len(rows),
                    "restored=", sum(x.get("state") == "restored" for x in results),
                    "already_exact=", sum(x.get("state") == "already_exact" for x in results),
                )
                (PROOF / "write-results.partial.json").write_text(json.dumps(results, indent=2), encoding="utf-8")

    results.sort(key=lambda x: x["key"])
    (PROOF / "write-results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    summary = {
        "total": len(results),
        "restored": sum(x.get("state") == "restored" for x in results),
        "already_exact": sum(x.get("state") == "already_exact" for x in results),
        "conflicts": sum(x.get("state") == "conflict" for x in results),
        "quarantined_invalid": 8,
        "d1_mutation": False,
        "r2_delete": False,
        "overwrite_allowed": False,
    }
    (PROOF / "restore-summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log(json.dumps(summary, indent=2))


def verify_public(rows):
    indexes = [0, 1, 100, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2607]
    results = []
    for index in indexes:
        row = rows[index]
        url = f"{PUBLIC_BASE}/{urllib.parse.quote(row['key'], safe='/._-')}?movie_recovery_verify={time.time_ns()}"
        verified = False
        for attempt in range(8):
            try:
                req = urllib.request.Request(url, headers={
                    "Accept": "image/*",
                    "Cache-Control": "no-store",
                    "User-Agent": "dnd-movie-r2-recovery/2.0",
                })
                with urllib.request.urlopen(req, timeout=30) as resp:
                    body = resp.read()
                got = sha256_bytes(body)
                assert got == row["sha256"], (row["key"], got, row["sha256"])
                results.append({"key": row["key"], "size": len(body), "sha256": got, "state": "exact"})
                log("public exact", row["key"])
                verified = True
                break
            except urllib.error.HTTPError as exc:
                if exc.code == 429 and attempt < 7:
                    time.sleep(min(30, 2 ** attempt))
                    continue
                raise
        assert verified, row["key"]
        time.sleep(1)
    (PROOF / "public-sample.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    log("PUBLIC_SAMPLE=PASS keys=", len(results))


def upload(base_url):
    manifest_path = PROOF / "restore-manifest.json"
    assert manifest_path.is_file() and TOKEN_FILE.is_file(), "Prepare phase evidence is missing."
    rows = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert len(rows) == 2608
    token = TOKEN_FILE.read_text(encoding="utf-8").strip()
    url = base_url.rstrip("/") + "/api/recovery"
    prove_guard(url, token, rows)
    restore(rows, url, token)
    verify_public(rows)
    TOKEN_FILE.unlink(missing_ok=True)
    log("MOVIE_R2_RECOVERY=PASS")


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

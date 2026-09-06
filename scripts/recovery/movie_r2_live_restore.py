import concurrent.futures
import hashlib
import json
import os
import pathlib
import re
import secrets
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

ACCOUNT_ID = "c0d5bc25df16ae5b7d47c985c4b7b787"
PROJECT = "devilndove-movie-r2-recovery"
BUCKET = "devilndove-toolshed-images"
FIRESTORAGE_API = "https://api.firestorage.ai/dev/file"
FIRESTORAGE_SHARE = "tMLKzijYYWeR"
PREFLIGHT_ARTIFACT_ID = 9980876243
PREFLIGHT_MISSING_SHA256 = "76a4f602784d5240d464d0925a1b910f6fb38607f08ead79b7ef947380001c69"
PUBLIC_BASE = "https://pub-f8137eb938da486a9f24410ccf49087c.r2.dev"
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

ROOT = pathlib.Path(os.environ.get("MOVIE_RECOVERY_ROOT", "/tmp/movie-recovery-v2"))
PREFLIGHT = ROOT / "preflight"
TRANSPORT_DIR = ROOT / "transports"
PAYLOAD = ROOT / "payload"
PROOF = ROOT / "proof"
BRIDGE = ROOT / "bridge"


def log(*args):
    print(*args, flush=True)


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def request_bytes(url, *, method="GET", headers=None, data=None, timeout=60):
    req = urllib.request.Request(url, method=method, headers=headers or {}, data=data)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return int(resp.status), resp.headers, resp.read()


def request_json(url, *, method="GET", headers=None, data=None, timeout=60):
    if data is not None and not isinstance(data, (bytes, bytearray)):
        data = json.dumps(data).encode("utf-8")
        headers = {**(headers or {}), "Content-Type": "application/json"}
    status, response_headers, body = request_bytes(url, method=method, headers=headers, data=data, timeout=timeout)
    return status, response_headers, json.loads(body.decode("utf-8"))


def ensure_dirs():
    for p in (PREFLIGHT, TRANSPORT_DIR, PAYLOAD, PROOF, BRIDGE):
        p.mkdir(parents=True, exist_ok=True)


def download_preflight():
    token = os.environ["GITHUB_TOKEN"]
    repo = os.environ["GITHUB_REPOSITORY"]
    url = f"https://api.github.com/repos/{repo}/actions/artifacts/{PREFLIGHT_ARTIFACT_ID}/zip"
    _, _, body = request_bytes(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "dnd-movie-r2-recovery/2.0",
    }, timeout=90)
    zip_path = ROOT / "preflight.zip"
    zip_path.write_bytes(body)
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(PREFLIGHT)
    missing_txt = PREFLIGHT / "missing-keys.txt"
    assert sha256_file(missing_txt) == PREFLIGHT_MISSING_SHA256
    summary = json.loads((PREFLIGHT / "summary.json").read_text(encoding="utf-8"))
    missing = json.loads((PREFLIGHT / "missing.json").read_text(encoding="utf-8"))
    assert summary.get("expected_keys") == 2616, summary
    assert summary.get("missing_keys") == 2616, summary
    assert summary.get("present_keys") == 0, summary
    assert summary.get("issue_keys") == 0, summary
    assert summary.get("production_api_rows") == 1308, summary
    assert len(missing) == 2616
    assert all(x.get("state") == "missing" and int(x.get("http_status") or 0) == 404 for x in missing)
    (PROOF / "preflight-summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log("PREFLIGHT_PROOF=PASS expected=2616 missing=2616")


def firestorage_files():
    _, _, data = request_json(f"{FIRESTORAGE_API}/shares/{FIRESTORAGE_SHARE}/files?maxResults=1000", timeout=60)
    out = {}
    for item in data.get("files") or []:
        name = item.get("fileName") or item.get("name") or ""
        out[name] = item
    return out


def download_transports():
    listing = firestorage_files()
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
        out = TRANSPORT_DIR / name
        out.write_bytes(body)
        assert len(body) == expected_size, (name, len(body), expected_size)
        actual_sha = sha256_bytes(body)
        assert actual_sha == expected_sha, (name, actual_sha, expected_sha)
        evidence.append({"name": name, "size": expected_size, "sha256": expected_sha})
        log("transport exact:", name)
    (PROOF / "transport-verification.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")


def reconstruct_payload():
    master = json.loads((TRANSPORT_DIR / "master-manifest.json").read_text(encoding="utf-8"))
    assert master.get("expected_catalog_keys") == 2616, master
    assert master.get("valid_recoverable_keys") == 2608, master
    quarantine = set(master.get("quarantined_invalid_keys") or [])
    assert len(quarantine) == 8, quarantine
    missing = {x.strip() for x in (PREFLIGHT / "missing-keys.txt").read_text(encoding="utf-8").splitlines() if x.strip()}
    assert len(missing) == 2616
    manifest = {}
    source = {}
    for zp in sorted(TRANSPORT_DIR.glob("movie-r2-recovery.transport-*.zip")):
        with zipfile.ZipFile(zp) as z:
            rows = json.loads(z.read("movie-r2-recovery/part-manifest.json"))
            for row in rows:
                key = str(row["key"])
                member = "movie-r2-recovery/" + str(row["file"])
                assert re.fullmatch(r"movies/[A-Za-z0-9._-]+\.jpg", key), key
                assert key not in manifest, key
                body = z.read(member)
                assert len(body) == int(row["size"]), key
                assert sha256_bytes(body) == row["sha256"], key
                assert body[:2] == b"\xff\xd8", key
                manifest[key] = dict(row)
                source[key] = (zp, member)
    assert len(manifest) == 2608
    assert set(manifest) <= missing
    assert missing - set(manifest) == quarantine
    rows = []
    for key in sorted(manifest):
        row = dict(manifest[key])
        zp, member = source[key]
        with zipfile.ZipFile(zp) as z:
            body = z.read(member)
        dest = PAYLOAD / pathlib.Path(key).name
        dest.write_bytes(body)
        row["local_file"] = str(dest)
        rows.append(row)
    (PROOF / "restore-manifest.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    (PROOF / "quarantined-invalid.json").write_text(json.dumps(sorted(quarantine), indent=2), encoding="utf-8")
    log("BACKUP_PAYLOAD=PASS valid=2608 quarantined=8")
    return rows


def cf_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json", "User-Agent": "dnd-movie-r2-recovery/2.0"}


def create_project(cf_token):
    base = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects"
    req = urllib.request.Request(f"{base}/{PROJECT}", headers=cf_headers(cf_token))
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            if resp.status == 200:
                raise RuntimeError(f"Refusing to reuse existing recovery project {PROJECT}")
    except urllib.error.HTTPError as exc:
        if exc.code != 404:
            raise
    _, _, data = request_json(base, method="POST", headers=cf_headers(cf_token), data={
        "name": PROJECT,
        "production_branch": "main",
    }, timeout=45)
    assert data.get("success") is True, data
    log("TEMP_PROJECT_CREATE=PASS")


def delete_project(cf_token):
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT}"
    try:
        _, _, data = request_json(url, method="DELETE", headers=cf_headers(cf_token), timeout=45)
        assert data.get("success") is True, data
        log("TEMP_PROJECT_DELETE=PASS")
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            log("TEMP_PROJECT_DELETE=ALREADY_ABSENT")
        else:
            raise


def build_bridge(rows):
    token = secrets.token_hex(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    expected = {x["key"]: x["sha256"] for x in rows}
    template = pathlib.Path("scripts/recovery/movie-r2-bridge-template.js").read_text(encoding="utf-8")
    assert "__EXPECTED_JSON__" in template and "__TOKEN_SHA256__" in template
    source = template.replace("__EXPECTED_JSON__", json.dumps(expected, separators=(",", ":"))).replace("__TOKEN_SHA256__", token_hash)
    functions = BRIDGE / "functions" / "api"
    functions.mkdir(parents=True, exist_ok=True)
    (functions / "recovery.js").write_text(source, encoding="utf-8")
    (BRIDGE / "index.html").write_text("<!doctype html><title>Movie image recovery</title><p>Temporary recovery bridge.</p>\n", encoding="utf-8")
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
    return token


def deploy_bridge(cf_token):
    env = os.environ.copy()
    env["CLOUDFLARE_API_TOKEN"] = cf_token
    env["CLOUDFLARE_ACCOUNT_ID"] = ACCOUNT_ID
    cmd = [
        "npx", "--yes", "wrangler@4.129.0", "pages", "deploy", ".",
        f"--project-name={PROJECT}", "--branch=main",
        f"--commit-hash={os.environ['GITHUB_SHA']}",
        "--commit-message=Temporary verified movie image recovery",
    ]
    proc = subprocess.run(cmd, cwd=BRIDGE, env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    (PROOF / "deploy.log").write_text(proc.stdout, encoding="utf-8")
    print(proc.stdout, flush=True)
    if proc.returncode != 0:
        raise RuntimeError(f"Wrangler deployment failed with exit {proc.returncode}")
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT}"
    _, _, data = request_json(url, headers=cf_headers(cf_token), timeout=45)
    assert data.get("success") is True, data
    cfg = ((data.get("result") or {}).get("deployment_configs") or {}).get("production") or {}
    r2 = cfg.get("r2_buckets") or {}
    assert (r2.get("MOVIE_PROD_BUCKET") or {}).get("name") == BUCKET, r2
    (PROOF / "project.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    log("PRODUCTION_R2_BINDING=PASS")
    return f"https://{PROJECT}.pages.dev/api/recovery"


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
        data = pathlib.Path(row["local_file"]).read_bytes()
        for attempt in range(7):
            try:
                status, payload = post_bridge(url, token, row["key"], data)
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
                log("processed", index, "/", len(rows), "restored=", sum(x.get("state") == "restored" for x in results), "already_exact=", sum(x.get("state") == "already_exact" for x in results))
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


def main():
    ensure_dirs()
    cf_token = os.environ["CLOUDFLARE_API_TOKEN_EDIT"]
    created = False
    try:
        download_preflight()
        download_transports()
        rows = reconstruct_payload()
        create_project(cf_token)
        created = True
        token = build_bridge(rows)
        url = deploy_bridge(cf_token)
        prove_guard(url, token, rows)
        restore(rows, url, token)
        verify_public(rows)
        log("MOVIE_R2_RECOVERY=PASS")
    finally:
        if created:
            try:
                delete_project(cf_token)
            except Exception as exc:
                (PROOF / "cleanup-error.txt").write_text(repr(exc), encoding="utf-8")
                log("WARNING cleanup failed:", repr(exc))


if __name__ == "__main__":
    main()

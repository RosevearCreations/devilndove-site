#!/usr/bin/env python3
"""Release 463: mirror Development R2 into isolated Production R2.

Cloudflare Access intentionally protects the Pages Preview surface, so this one-time
cutover uses Cloudflare's authenticated R2 object inventory plus Wrangler's remote
object transport. It never weakens Access and preserves standard HTTP metadata and
storage class. Custom metadata fails closed rather than being silently discarded.
"""
from __future__ import annotations

import hashlib
import json
import os
import pathlib
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

ACCOUNT_ID = os.environ["CLOUDFLARE_ACCOUNT_ID"].strip()
TOKEN = os.environ["CLOUDFLARE_API_TOKEN"].strip()
API = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2/buckets"
PROOF = pathlib.Path("/tmp/release463-r2-proof.json")

PAIRS = (
    ("product", "devilndove-toolshed-images-dev", "devilndove-toolshed-images"),
    ("caip", "devilndove-caip-media-dev", "devilndove-caip-media"),
)


def request_json(url: str, retries: int = 7):
    headers = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/json"}
    last = None
    for attempt in range(retries):
        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                body = json.loads(response.read().decode("utf-8", "replace"))
            if not isinstance(body, dict) or body.get("success") is not True:
                raise RuntimeError(f"Cloudflare R2 API failure: {body}")
            return body
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", "replace")
            last = RuntimeError(f"HTTP {exc.code}: {raw[:2000]}")
            if exc.code not in (408, 409, 429, 500, 502, 503, 504) or attempt == retries - 1:
                raise last
        except (urllib.error.URLError, TimeoutError) as exc:
            last = exc
            if attempt == retries - 1:
                raise
        time.sleep(min(2 ** attempt, 12))
    raise last or RuntimeError("Cloudflare R2 API request failed")


def list_bucket(bucket: str):
    result = {}
    cursor = ""
    while True:
        query = {"per_page": "1000"}
        if cursor:
            query["cursor"] = cursor
        url = f"{API}/{urllib.parse.quote(bucket, safe='')}/objects?{urllib.parse.urlencode(query)}"
        body = request_json(url)
        for item in body.get("result") or []:
            key = str(item.get("key") or "")
            if not key:
                raise AssertionError((bucket, "object missing key", item))
            result[key] = item
        info = body.get("result_info") or {}
        if not info.get("is_truncated"):
            break
        next_cursor = str(info.get("cursor") or "").strip()
        if not next_cursor or next_cursor == cursor:
            raise AssertionError((bucket, "pagination cursor stalled", info))
        cursor = next_cursor
    return result


def canonical_meta(item: dict):
    http = item.get("http_metadata") or {}
    custom = item.get("custom_metadata") or {}
    return {
        "size": int(item.get("size") or 0),
        "http_metadata": {
            "contentType": http.get("contentType"),
            "contentDisposition": http.get("contentDisposition"),
            "contentEncoding": http.get("contentEncoding"),
            "contentLanguage": http.get("contentLanguage"),
            "cacheControl": http.get("cacheControl"),
            "cacheExpiry": http.get("cacheExpiry"),
        },
        "custom_metadata": custom,
        "storage_class": item.get("storage_class") or "Standard",
    }


def wrangler(*args: str):
    command = ["npx", "--yes", "wrangler@4", *args]
    subprocess.run(command, check=True)


def download(bucket: str, key: str, path: pathlib.Path):
    wrangler("r2", "object", "get", f"{bucket}/{key}", "--remote", f"--file={path}")


def upload(bucket: str, key: str, path: pathlib.Path, source: dict):
    custom = source.get("custom_metadata") or {}
    if custom:
        raise AssertionError(
            f"Refusing to copy {key!r}: Wrangler object transport has no custom-metadata flag; source metadata={custom!r}"
        )
    http = source.get("http_metadata") or {}
    command = ["r2", "object", "put", f"{bucket}/{key}", "--remote", "--force", f"--file={path}"]
    flags = {
        "contentType": "--content-type",
        "contentDisposition": "--content-disposition",
        "contentEncoding": "--content-encoding",
        "contentLanguage": "--content-language",
        "cacheControl": "--cache-control",
        "cacheExpiry": "--expires",
    }
    for field, flag in flags.items():
        value = http.get(field)
        if value not in (None, ""):
            command.extend([flag, str(value)])
    storage_class = str(source.get("storage_class") or "Standard")
    command.extend(["--storage-class", storage_class])
    wrangler(*command)


def delete(bucket: str, key: str):
    wrangler("r2", "object", "delete", f"{bucket}/{key}", "--remote", "--force")


def sha256_file(path: pathlib.Path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_download_pair(source_bucket: str, target_bucket: str, key: str, workdir: pathlib.Path):
    suffix = hashlib.sha256(key.encode("utf-8")).hexdigest()[:20]
    source_path = workdir / f"source-{suffix}.bin"
    target_path = workdir / f"target-{suffix}.bin"
    download(source_bucket, key, source_path)
    download(target_bucket, key, target_path)
    source_hash = sha256_file(source_path)
    target_hash = sha256_file(target_path)
    source_path.unlink(missing_ok=True)
    target_path.unlink(missing_ok=True)
    if source_hash != target_hash:
        raise AssertionError((key, "content hash mismatch", source_hash, target_hash))
    return source_hash


def sync_pair(label: str, source_bucket: str, target_bucket: str):
    source = list_bucket(source_bucket)
    target = list_bucket(target_bucket)
    source_keys = set(source)
    target_keys = set(target)

    unsupported = {
        key: source[key].get("custom_metadata")
        for key in sorted(source_keys)
        if source[key].get("custom_metadata")
    }
    if unsupported:
        raise AssertionError(f"{label}: custom metadata requires a lossless transport before mutation: {json.dumps(unsupported)[:4000]}")

    to_copy = []
    for key in sorted(source_keys):
        src = source[key]
        dst = target.get(key)
        if dst is None:
            to_copy.append(key)
            continue
        same_etag = str(src.get("etag") or "") == str(dst.get("etag") or "")
        same_meta = canonical_meta(src) == canonical_meta(dst)
        if not (same_etag and same_meta):
            to_copy.append(key)
    to_delete = sorted(target_keys - source_keys)

    print(
        f"R2 INVENTORY {label}: source={len(source)} target={len(target)} copy={len(to_copy)} prune={len(to_delete)}",
        flush=True,
    )

    copied_hashes = {}
    with tempfile.TemporaryDirectory(prefix=f"release463-{label}-") as temp:
        workdir = pathlib.Path(temp)
        for index, key in enumerate(to_copy, 1):
            path = workdir / "object.bin"
            download(source_bucket, key, path)
            source_hash = sha256_file(path)
            upload(target_bucket, key, path, source[key])
            path.unlink(missing_ok=True)
            copied_hashes[key] = source_hash
            if index == 1 or index == len(to_copy) or index % 25 == 0:
                print(f"R2 COPY {label}: {index}/{len(to_copy)} {key}", flush=True)

        for index, key in enumerate(to_delete, 1):
            delete(target_bucket, key)
            if index == 1 or index == len(to_delete) or index % 25 == 0:
                print(f"R2 PRUNE {label}: {index}/{len(to_delete)} {key}", flush=True)

        final_target = list_bucket(target_bucket)
        if set(final_target) != source_keys:
            missing = sorted(source_keys - set(final_target))[:50]
            extra = sorted(set(final_target) - source_keys)[:50]
            raise AssertionError((label, "key parity failed", missing, extra))

        metadata_mismatches = []
        for key in sorted(source_keys):
            if canonical_meta(source[key]) != canonical_meta(final_target[key]):
                metadata_mismatches.append(key)
        if metadata_mismatches:
            raise AssertionError((label, "metadata parity failed", metadata_mismatches[:50]))

        # Full content proof: equal single-part ETags are accepted as content identity;
        # changed/multipart objects are byte-hashed from both buckets.
        hashed = 0
        for index, key in enumerate(sorted(source_keys), 1):
            src_etag = str(source[key].get("etag") or "")
            dst_etag = str(final_target[key].get("etag") or "")
            requires_hash = key in copied_hashes or not src_etag or not dst_etag or "-" in src_etag or src_etag != dst_etag
            if requires_hash:
                target_hash = verify_download_pair(source_bucket, target_bucket, key, workdir)
                expected = copied_hashes.get(key)
                if expected and expected != target_hash:
                    raise AssertionError((label, key, "post-copy hash changed", expected, target_hash))
                hashed += 1
                if hashed == 1 or index == len(source_keys) or hashed % 25 == 0:
                    print(f"R2 HASH VERIFY {label}: hashed={hashed} key={key}", flush=True)

    return {
        "source_bucket": source_bucket,
        "target_bucket": target_bucket,
        "source_objects": len(source),
        "target_objects_before": len(target),
        "copied": len(to_copy),
        "pruned": len(to_delete),
        "target_objects_after": len(source),
        "hash_verified_objects": hashed,
        "key_parity": True,
        "metadata_parity": True,
        "content_parity": True,
        "source_bytes": sum(int(item.get("size") or 0) for item in source.values()),
    }


def main():
    if not ACCOUNT_ID or not TOKEN:
        raise SystemExit("Cloudflare account/token are required")

    # Read-only identity/permission gate before any R2 mutation.
    for _, source, target in PAIRS:
        list_bucket(source)
        list_bucket(target)
    print("R2 DIRECT API INVENTORY/PERMISSION GATE: PASS", flush=True)

    proof = {"release": 463, "status": "PASS", "transport": "Cloudflare R2 REST inventory + Wrangler remote object transport", "buckets": {}}
    for label, source, target in PAIRS:
        proof["buckets"][label] = sync_pair(label, source, target)

    PROOF.write_text(json.dumps(proof, indent=2, sort_keys=True), encoding="utf-8")
    print("RELEASE 463 R2 CONSOLIDATION: PASS", json.dumps(proof, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()

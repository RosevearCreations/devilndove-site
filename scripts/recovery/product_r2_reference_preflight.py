import argparse
import hashlib
import json
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request

ASSET_HOSTS = {
    "assets.devilndove.com",
    "pub-f8137eb938da486a9f24410ccf49087c.r2.dev",
}
PROD_MEDIA_ENDPOINT = "https://devilndove.com/api/product-media"


def text(value):
    return str(value or "").strip()


def walk_rows(value):
    rows = []
    def walk(node):
        if isinstance(node, dict):
            if "image_url" in node or "source_url" in node:
                rows.append(node)
            for child in node.values():
                walk(child)
        elif isinstance(node, list):
            for child in node:
                walk(child)
    walk(value)
    return rows


def key_from_url(value):
    value = text(value)
    if not value:
        return ""
    if value.startswith("products/"):
        return value.split("?", 1)[0].split("#", 1)[0]
    parsed = urllib.parse.urlparse(value)
    host = (parsed.hostname or "").lower()
    path = urllib.parse.unquote(parsed.path.lstrip("/"))
    if host in ASSET_HOSTS and path.startswith("products/"):
        return path
    if parsed.path.endswith("/api/product-media"):
        query = urllib.parse.parse_qs(parsed.query)
        key = text((query.get("key") or [""])[0])
        if key.startswith("products/"):
            return key
        src = text((query.get("src") or [""])[0])
        if src:
            return key_from_url(src)
    return ""


def read_source(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    rows = walk_rows(data)
    out = []
    for row in rows:
        url = text(row.get("image_url") or row.get("source_url"))
        key = key_from_url(url)
        if not key:
            continue
        out.append({
            "product_id": int(row.get("product_id") or 0),
            "product_name": text(row.get("product_name")),
            "status": text(row.get("status")),
            "source": text(row.get("source")),
            "source_id": text(row.get("source_id")),
            "image_url": url,
            "key": key,
        })
    return out


def probe(key):
    url = PROD_MEDIA_ENDPOINT + "?" + urllib.parse.urlencode({
        "key": key,
        "recovery_preflight": str(time.time_ns()),
    })
    for attempt in range(8):
        req = urllib.request.Request(url, headers={
            "Accept": "image/*",
            "Cache-Control": "no-store",
            "User-Agent": "dnd-product-r2-preflight/2.0",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read(20 * 1024 * 1024)
                status = int(resp.status)
                content_type = text(resp.headers.get("Content-Type")).lower()
            if status != 200:
                return {"state": "issue", "http_status": status}
            return {
                "state": "present",
                "http_status": 200,
                "size": len(body),
                "sha256": hashlib.sha256(body).hexdigest(),
                "content_type": content_type,
            }
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return {"state": "missing", "http_status": 404}
            if exc.code == 429 and attempt < 7:
                retry_after = text(exc.headers.get("Retry-After")) if exc.headers else ""
                try:
                    wait = max(1.0, float(retry_after))
                except Exception:
                    wait = min(30.0, 1.5 * (2 ** attempt))
                time.sleep(wait)
                continue
            return {"state": "issue", "http_status": int(exc.code), "error": str(exc)}
        except Exception as exc:
            if attempt < 3:
                time.sleep(1.5 * (attempt + 1))
                continue
            return {"state": "issue", "http_status": 0, "error": repr(exc)}
    return {"state": "issue", "http_status": 429, "error": "retry budget exhausted"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()
    input_dir = pathlib.Path(args.input_dir)
    output_dir = pathlib.Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    all_rows = []
    source_counts = {}
    for path in sorted(input_dir.glob("*.json")):
        rows = read_source(path)
        all_rows.extend(rows)
        source_counts[path.stem] = len(rows)

    by_key = {}
    for row in all_rows:
        item = by_key.setdefault(row["key"], {
            "key": row["key"],
            "product_ids": [],
            "product_names": [],
            "sources": [],
            "urls": [],
        })
        if row["product_id"] and row["product_id"] not in item["product_ids"]:
            item["product_ids"].append(row["product_id"])
        if row["product_name"] and row["product_name"] not in item["product_names"]:
            item["product_names"].append(row["product_name"])
        source = row["source"] or path.stem
        if source not in item["sources"]:
            item["sources"].append(source)
        if row["image_url"] not in item["urls"]:
            item["urls"].append(row["image_url"])

    keys = sorted(by_key)
    if not keys:
        raise SystemExit("No current Product R2 keys were resolved from Production D1 references.")

    results = []
    started = time.time()
    for index, key in enumerate(keys, 1):
        state = probe(key)
        result = {**by_key[key], **state}
        results.append(result)
        if index % 50 == 0 or index == len(keys):
            counts = {name: sum(x["state"] == name for x in results) for name in ("present", "missing", "issue")}
            print(f"probed {index}/{len(keys)} in {time.time()-started:.1f}s {counts}", flush=True)
        time.sleep(0.12)

    present = [x for x in results if x["state"] == "present"]
    missing = [x for x in results if x["state"] == "missing"]
    issues = [x for x in results if x["state"] == "issue"]
    impacted_products = sorted({pid for row in missing for pid in row["product_ids"]})
    summary = {
        "referenced_rows": len(all_rows),
        "unique_product_r2_keys": len(keys),
        "present_keys": len(present),
        "missing_keys": len(missing),
        "issue_keys": len(issues),
        "products_impacted_by_missing_keys": len(impacted_products),
        "source_row_counts": source_counts,
        "d1_mutation": False,
        "r2_mutation": False,
        "r2_delete": False,
        "method": "production_d1_reference_union_plus_public_product_media_get",
    }
    for name, value in (
        ("all-results", results),
        ("present", present),
        ("missing", missing),
        ("issues", issues),
        ("summary", summary),
    ):
        (output_dir / f"{name}.json").write_text(json.dumps(value, indent=2), encoding="utf-8")
    (output_dir / "missing-keys.txt").write_text("".join(x["key"] + "\n" for x in missing), encoding="utf-8")
    print(json.dumps(summary, indent=2), flush=True)
    if issues:
        raise SystemExit(f"Product preflight found {len(issues)} non-404 issues; refusing to classify them as missing.")


if __name__ == "__main__":
    main()

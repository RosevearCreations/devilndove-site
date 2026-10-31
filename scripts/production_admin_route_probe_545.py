#!/usr/bin/env python3
"""Build 545: read-only, bounded Production route and asset availability proof.

Never signs in, queries business records or alters a Product/Etsy draft. This
reports Cloudflare 524 separately so transient origin stalls are not mistaken
for a missing page or a successful release.
"""
from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

ROUTES = {
    "admin_home": ("admin/", b"<html"),
    "system_operations": ("admin/system-operations/", b"<html"),
    "product_editor_shell": ("admin/product-editor/?product_id=54", b"dd544EtsyFlow"),
    "etsy_flow_asset": ("public/js/product-editor-etsy-544.mjs?v=544", b"dd544EtsyFlow"),
}
CRITICAL_ROUTES = frozenset({"admin_home", "system_operations", "etsy_flow_asset"})


def probe(base: str, *, attempts: int = 4, pause=time.sleep, fetch=None) -> dict:
    if fetch is None:
        def fetch(url: str):
            req = urllib.request.Request(url, headers={
                "User-Agent": "devilndove-admin-route-545/1.0",
                "Cache-Control": "no-cache",
            })
            with urllib.request.urlopen(req, timeout=16) as response:
                return int(response.status), response.read(850_000)

    result = {"status": "PASS", "routes": {}, "degraded_routes": []}
    for name, (relative, marker) in ROUTES.items():
        url = urljoin(base.rstrip("/") + "/", relative)
        row = {"url": url, "attempts": 0, "status": "FAIL", "last_error": ""}
        for index in range(attempts):
            row["attempts"] = index + 1
            try:
                status, body = fetch(url)
                if status != 200:
                    raise RuntimeError(f"HTTP {status}")
                if marker.lower() not in body.lower():
                    raise RuntimeError("Expected application content is missing")
                row.update(status="PASS", http_status=200, bytes=len(body), last_error="")
                break
            except urllib.error.HTTPError as error:
                row["last_error"] = f"HTTP {error.code}: " + ("Cloudflare origin timeout" if error.code == 524 else "route unavailable")
            except Exception as error:
                row["last_error"] = f"{type(error).__name__}: {error}"
            if index + 1 < attempts:
                pause(3)
        if row["status"] != "PASS":
            result["degraded_routes"].append(name)
            if name in CRITICAL_ROUTES:
                result["status"] = "FAIL"
        result["routes"][name] = row
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="https://devilndove.com/")
    parser.add_argument("--output", default="/tmp/production-admin-route-545.json")
    args = parser.parse_args()
    report = probe(args.base_url)
    Path(args.output).write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())

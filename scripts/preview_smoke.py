#!/usr/bin/env python3
"""Release 464 Update 2 non-secret Preview smoke acceptance."""
from __future__ import annotations
import argparse
import json
import re
import time
import urllib.error
import urllib.request
from urllib.parse import urljoin

def fetch(url: str, attempts: int = 3) -> tuple[int, bytes, str]:
    last = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "DevilDove-Release464-Preview-Smoke/1.0"})
            with urllib.request.urlopen(req, timeout=20) as response:
                return response.status, response.read(), response.headers.get("content-type", "")
        except Exception as exc:
            last = exc
            if attempt + 1 < attempts:
                time.sleep(2)
    raise RuntimeError(f"{url}: {last}")

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    args = parser.parse_args()
    base = args.base_url.rstrip("/") + "/"
    checks: list[tuple[str, bool, str]] = []

    status, body, ctype = fetch(base)
    html = body.decode("utf-8", errors="replace")
    checks.append(("home_200", status == 200, f"status={status}"))
    checks.append(("home_one_h1", len(re.findall(r"<h1\b", html, flags=re.I)) == 1, f"h1={len(re.findall(r'<h1\\b', html, flags=re.I))}"))
    checks.append(("home_html_lang", bool(re.search(r"<html\b[^>]*\blang=['\"][^'\"]+['\"]", html, flags=re.I)), "lang attribute"))

    status, body, ctype = fetch(urljoin(base, "manifest.webmanifest"))
    manifest = json.loads(body.decode("utf-8"))
    checks.append(("manifest_200", status == 200, f"status={status}"))
    checks.append(("manifest_identity", bool(manifest.get("name") and manifest.get("start_url")), "name/start_url"))

    status, body, _ = fetch(urljoin(base, "sw.js"))
    sw = body.decode("utf-8", errors="replace")
    checks.append(("service_worker_200", status == 200, f"status={status}"))
    checks.append(("service_worker_runtime", "addEventListener" in sw, "event listener present"))

    status, body, ctype = fetch(urljoin(base, "api/creations?limit=1"))
    public_api_ok = status == 200
    try:
        json.loads(body.decode("utf-8"))
    except Exception:
        public_api_ok = False
    checks.append(("public_api_non_secret", public_api_ok, f"status={status} content-type={ctype}"))

    failed = [name for name, ok, _ in checks if not ok]
    for name, ok, detail in checks:
        print(f"{'PASS' if ok else 'FAIL'} {name}: {detail}")
    if failed:
        print("RELEASE 464 UPDATE 2 PREVIEW SMOKE: FAIL", ", ".join(failed))
        return 1
    print("RELEASE 464 UPDATE 2 PREVIEW SMOKE: PASS")
    print("Authentication headers used: ZERO")
    print("Provider execution invoked: ZERO")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

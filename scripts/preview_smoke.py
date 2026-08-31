#!/usr/bin/env python3
"""Release 464 Update 2 non-secret exact-Preview smoke acceptance.

The canonical Development Preview may be protected by Cloudflare Access. This probe
must never weaken Access or use an authentication secret. If Access is enforced, the
correct anonymous runtime result is that every selected Preview route is intercepted
by Access. If Preview is not Access-protected, the same probe validates application
content directly.
"""
from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1]
USER_AGENT = "DevilDove-Release464-Preview-Smoke/2.0"


def fetch(url: str, attempts: int = 3) -> tuple[int, bytes, str, str]:
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=20) as response:
                return (
                    int(response.status),
                    response.read(),
                    response.headers.get("content-type", ""),
                    response.geturl(),
                )
        except urllib.error.HTTPError as exc:
            # HTTP errors are still useful smoke evidence. In particular, an Access
            # policy may fail closed instead of returning the hosted login page.
            return int(exc.code), exc.read(), exc.headers.get("content-type", ""), exc.geturl()
        except Exception as exc:
            last = exc
            if attempt + 1 < attempts:
                time.sleep(2)
    raise RuntimeError(f"{url}: {last}")


def access_intercepted(status: int, body: bytes, final_url: str) -> bool:
    parsed = urlparse(final_url)
    host = parsed.hostname or ""
    path = parsed.path or ""
    sample = body[:16000].decode("utf-8", errors="replace").lower()
    if host.endswith("cloudflareaccess.com"):
        return True
    if "/cdn-cgi/access/" in path.lower():
        return True
    if "cloudflare access" in sample or "cdn-cgi/access/login" in sample:
        return True
    # Some Access policies fail closed without a hosted-login redirect.
    if status in {401, 403} and ("cloudflare" in sample or "access" in sample):
        return True
    return False


def local_source_checks() -> list[tuple[str, bool, str]]:
    checks: list[tuple[str, bool, str]] = []
    home = (ROOT / "index.html").read_text(encoding="utf-8", errors="replace")
    h1_count = len(re.findall(r"<h1\b", home, flags=re.I))
    checks.append(("source_home_one_h1", h1_count == 1, f"h1={h1_count}"))
    checks.append((
        "source_home_html_lang",
        bool(re.search(r"<html\b[^>]*\blang=['\"][^'\"]+['\"]", home, flags=re.I)),
        "lang attribute",
    ))

    manifest_text = (ROOT / "manifest.webmanifest").read_text(encoding="utf-8", errors="strict")
    try:
        manifest = json.loads(manifest_text)
        manifest_ok = bool(manifest.get("name") and manifest.get("start_url"))
        manifest_detail = "name/start_url"
    except Exception as exc:
        manifest_ok = False
        manifest_detail = f"invalid JSON: {exc}"
    checks.append(("source_manifest_identity", manifest_ok, manifest_detail))

    sw = (ROOT / "sw.js").read_text(encoding="utf-8", errors="replace")
    checks.append(("source_service_worker_runtime", "addEventListener" in sw, "event listener present"))
    checks.append(("source_public_api_route", (ROOT / "functions/api/creations.js").is_file(), "functions/api/creations.js"))
    return checks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    args = parser.parse_args()
    base = args.base_url.rstrip("/") + "/"
    expected_host = urlparse(base).hostname or ""
    checks = local_source_checks()

    routes = [
        ("home", ""),
        ("manifest", "manifest.webmanifest"),
        ("service_worker", "sw.js"),
        ("public_api", "api/creations?limit=1"),
    ]
    observations: dict[str, tuple[int, bytes, str, str, bool]] = {}
    for name, relative in routes:
        status, body, ctype, final_url = fetch(urljoin(base, relative))
        observations[name] = (status, body, ctype, final_url, access_intercepted(status, body, final_url))

    home_status, home_body, home_ctype, home_final, home_access = observations["home"]
    access_mode = home_access

    if access_mode:
        # Exact Preview is intentionally protected. Prove anonymous traffic cannot
        # bypass that boundary on any route selected by the non-secret smoke.
        checks.append(("exact_preview_host", expected_host.endswith(".devilndove-site.pages.dev"), expected_host))
        for name, _ in routes:
            status, body, ctype, final_url, intercepted = observations[name]
            checks.append((
                f"preview_access_{name}",
                intercepted,
                f"status={status} final={final_url} bytes={len(body)} content-type={ctype}",
            ))
        checks.append(("preview_access_consistent", all(v[4] for v in observations.values()), "all anonymous probes intercepted"))
        print("PREVIEW_MODE: CLOUDFLARE_ACCESS_PROTECTED")
    else:
        # If Preview is ever deliberately unprotected, require real app content.
        html = home_body.decode("utf-8", errors="replace")
        home_h1 = len(re.findall(r"<h1\b", html, flags=re.I))
        checks.append(("home_200", home_status == 200, f"status={home_status} final={home_final}"))
        checks.append(("home_same_host", (urlparse(home_final).hostname or "") == expected_host, home_final))
        checks.append(("home_one_h1", home_h1 == 1, f"h1={home_h1}"))
        checks.append(("home_html_lang", bool(re.search(r"<html\b[^>]*\blang=['\"][^'\"]+['\"]", html, flags=re.I)), "lang attribute"))

        status, body, ctype, final_url, _ = observations["manifest"]
        manifest = None
        try:
            manifest = json.loads(body.decode("utf-8"))
        except Exception:
            manifest = None
        checks.append(("manifest_200", status == 200, f"status={status} final={final_url} bytes={len(body)} content-type={ctype}"))
        checks.append(("manifest_identity", bool(manifest and manifest.get("name") and manifest.get("start_url")), "valid JSON name/start_url"))

        status, body, ctype, final_url, _ = observations["service_worker"]
        sw = body.decode("utf-8", errors="replace")
        checks.append(("service_worker_200", status == 200, f"status={status} final={final_url}"))
        checks.append(("service_worker_runtime", "addEventListener" in sw, "event listener present"))

        status, body, ctype, final_url, _ = observations["public_api"]
        public_api_ok = status == 200
        try:
            json.loads(body.decode("utf-8"))
        except Exception:
            public_api_ok = False
        checks.append(("public_api_non_secret", public_api_ok, f"status={status} final={final_url} content-type={ctype}"))
        print("PREVIEW_MODE: DIRECT_APPLICATION")

    failed = [name for name, ok, _ in checks if not ok]
    for name, ok, detail in checks:
        print(f"{'PASS' if ok else 'FAIL'} {name}: {detail}")
    if failed:
        print("RELEASE 464 UPDATE 2 PREVIEW SMOKE: FAIL", ", ".join(failed))
        return 1
    print("RELEASE 464 UPDATE 2 PREVIEW SMOKE: PASS")
    print("Authentication headers used: ZERO")
    print("Cloudflare Access weakened: NO")
    print("Provider execution invoked: ZERO")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

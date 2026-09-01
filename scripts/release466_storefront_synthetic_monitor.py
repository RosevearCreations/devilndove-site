#!/usr/bin/env python3
"""Read-only Release 466 storefront synthetic monitor.

Only GET requests are issued. No authentication, cookies, provider calls, D1 mutation,
or business transaction endpoints are used.
"""
from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.parse import urljoin, urlparse

USER_AGENT = "DevilDove-Release466-Synthetic/1.0"
DEFAULT_ROUTES = (
    ("home", "/", "html"),
    ("shop", "/shop/", "html"),
    ("collections", "/collections/", "html"),
    ("collages", "/collages/", "html"),
    ("custom_request", "/custom-request/", "html"),
    ("robots", "/robots.txt", "text"),
    ("sitemap", "/sitemap.xml", "xml"),
    ("public_catalog_api", "/api/creations?limit=1", "json"),
)


@dataclass
class Observation:
    name: str
    route: str
    status: int
    elapsed_ms: int
    bytes: int
    content_type: str
    final_url: str
    same_host: bool
    healthy: bool
    note: str


def fetch(url: str, attempts: int = 3) -> tuple[int, bytes, str, str, int]:
    last: Exception | None = None
    for attempt in range(attempts):
        started = time.perf_counter()
        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": USER_AGENT, "Accept": "*/*"},
                method="GET",
            )
            with urllib.request.urlopen(request, timeout=25) as response:
                body = response.read(2_000_000)
                elapsed = round((time.perf_counter() - started) * 1000)
                return int(response.status), body, response.headers.get("content-type", ""), response.geturl(), elapsed
        except urllib.error.HTTPError as exc:
            body = exc.read(256_000)
            elapsed = round((time.perf_counter() - started) * 1000)
            return int(exc.code), body, exc.headers.get("content-type", ""), exc.geturl(), elapsed
        except Exception as exc:
            last = exc
            if attempt + 1 < attempts:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"{url}: {last}")


def type_ok(expected: str, content_type: str, body: bytes) -> bool:
    ctype = content_type.lower()
    if expected == "html":
        return "text/html" in ctype or body.lstrip().lower().startswith(b"<!doctype html")
    if expected == "json":
        if "json" in ctype:
            return True
        try:
            json.loads(body.decode("utf-8"))
            return True
        except Exception:
            return False
    if expected == "xml":
        return "xml" in ctype or body.lstrip().startswith(b"<?xml")
    return "text/" in ctype or bool(body)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="https://devilndove.com/")
    parser.add_argument("--output", default="")
    parser.add_argument("--warn-ms", type=int, default=3500)
    parser.add_argument("--fail-ms", type=int, default=12000)
    args = parser.parse_args()

    base = args.base_url.rstrip("/") + "/"
    host = (urlparse(base).hostname or "").lower()
    if not host:
        raise SystemExit("Synthetic monitor requires an absolute base URL.")

    observations: list[Observation] = []
    failures: list[str] = []
    warnings: list[str] = []

    for name, route, expected_type in DEFAULT_ROUTES:
        target = urljoin(base, route.lstrip("/"))
        try:
            status, body, content_type, final_url, elapsed_ms = fetch(target)
            final_host = (urlparse(final_url).hostname or "").lower()
            same_host = final_host == host or final_host == f"www.{host}" or host == f"www.{final_host}"
            status_ok = 200 <= status < 400
            kind_ok = type_ok(expected_type, content_type, body)
            latency_ok = elapsed_ms <= args.fail_ms
            healthy = status_ok and same_host and kind_ok and latency_ok
            notes = []
            if not status_ok: notes.append(f"status={status}")
            if not same_host: notes.append(f"redirected-host={final_host}")
            if not kind_ok: notes.append(f"unexpected-content-type={content_type}")
            if elapsed_ms > args.fail_ms: notes.append(f"latency>{args.fail_ms}ms")
            elif elapsed_ms > args.warn_ms: warnings.append(f"{name}: latency {elapsed_ms}ms")
            note = "; ".join(notes) or "ok"
            observations.append(Observation(name, route, status, elapsed_ms, len(body), content_type, final_url, same_host, healthy, note))
            if not healthy: failures.append(f"{name}: {note}")
        except Exception as exc:
            failures.append(f"{name}: request failed: {exc}")
            observations.append(Observation(name, route, 0, 0, 0, "", target, False, False, str(exc)))

    state = "RED" if failures else ("YELLOW" if warnings else "GREEN")
    report = {
        "release": 466,
        "build": 2,
        "probe": "synthetic_storefront",
        "base_url": base,
        "state": state,
        "read_only": True,
        "authentication_headers_used": 0,
        "business_mutations": 0,
        "provider_calls": 0,
        "thresholds": {"warn_ms": args.warn_ms, "fail_ms": args.fail_ms},
        "failures": failures,
        "warnings": warnings,
        "observations": [asdict(row) for row in observations],
    }

    print(json.dumps(report, indent=2, sort_keys=True))
    if args.output:
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Release 467 Build 6 — Development-only Cloudflare Access service-token acceptance.

The probe sends only the Cloudflare Access service-token headers to the canonical
Development host. It deliberately sends no application cookie or Authorization
header. Success means Cloudflare Access admitted the request and /api/auth/me
returned the application's own 401 JSON response.
"""
from __future__ import annotations

import argparse
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

RELEASE = 467
BUILD = 6
DEFAULT_BASE_URL = "https://dev.devilndove-site.pages.dev"
REQUEST_PATH = "/api/auth/me"
ACCESS_ID_ENV = "CF_ACCESS_CLIENT_ID"
ACCESS_SECRET_ENV = "CF_ACCESS_CLIENT_SECRET"
EXPECTED_SHA_RE = re.compile(r"^[0-9a-f]{40}$")


class AcceptanceError(RuntimeError):
    pass


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: N802
        return None


def validate_base_url(value: str) -> str:
    value = str(value or "").strip().rstrip("/")
    parsed = urlparse(value)
    if (
        parsed.scheme != "https"
        or (parsed.hostname or "").lower() != "dev.devilndove-site.pages.dev"
        or parsed.path not in ("", "/")
        or parsed.query
        or parsed.fragment
    ):
        raise AcceptanceError("Build 6 permits only the canonical HTTPS Development Preview alias.")
    return value


def safe_run_url() -> str:
    server = str(os.environ.get("GITHUB_SERVER_URL") or "https://github.com").rstrip("/")
    repository = str(os.environ.get("GITHUB_REPOSITORY") or "RosevearCreations/devilndove-site").strip("/")
    run_id = str(os.environ.get("GITHUB_RUN_ID") or "").strip()
    return f"{server}/{repository}/actions/runs/{run_id}" if run_id else ""


def evidence_base(base_url: str, expected_sha: str) -> dict:
    return {
        "authority": "release467-build6-cloudflare-access-acceptance",
        "release": RELEASE,
        "build": BUILD,
        "state": "HOLD_EXTERNAL",
        "workflow_name": str(os.environ.get("GITHUB_WORKFLOW") or "Release 467 Build 6 Cloudflare Access Acceptance"),
        "workflow_run_id": str(os.environ.get("GITHUB_RUN_ID") or ""),
        "workflow_run_url": safe_run_url(),
        "status": "completed_check",
        "conclusion": "failure",
        "development_host": urlparse(base_url).hostname or "",
        "request_path": REQUEST_PATH,
        "http_status": None,
        "application_response_profile": "not_proven",
        "commit_sha": expected_sha,
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "access_headers_sent": False,
        "application_session_sent": False,
        "secret_values_included": False,
        "production_mutation": False,
        "d1_r2_mutation": False,
        "provider_execution": False,
    }


def write_evidence(path: Path, evidence: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(evidence, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def request_application(base_url: str, client_id: str, client_secret: str, timeout: float) -> tuple[int, str, str]:
    request = Request(
        urljoin(base_url + "/", REQUEST_PATH.lstrip("/")),
        method="GET",
        headers={
            "Accept": "application/json",
            "Cache-Control": "no-store",
            "User-Agent": "devilndove-release467-build6-access-acceptance/1.0",
            "CF-Access-Client-Id": client_id,
            "CF-Access-Client-Secret": client_secret,
        },
    )
    opener = build_opener(NoRedirect())
    try:
        with opener.open(request, timeout=timeout) as response:
            return int(getattr(response, "status", 200)), response.read(65536).decode("utf-8", errors="replace"), str(response.headers.get("content-type") or "").lower()
    except HTTPError as error:
        return int(error.code), error.read(65536).decode("utf-8", errors="replace"), str(error.headers.get("content-type") or "").lower()
    except URLError as error:
        raise AcceptanceError(f"Development Access probe could not reach the canonical host: {error.reason}") from error


def run(base_url: str, expected_sha: str, evidence_path: Path, timeout: float) -> int:
    base_url = validate_base_url(base_url)
    expected_sha = str(expected_sha or "").strip().lower()
    evidence = evidence_base(base_url, expected_sha)

    try:
        if not EXPECTED_SHA_RE.fullmatch(expected_sha):
            raise AcceptanceError("An exact 40-character reviewed Development SHA is required.")

        runtime_sha = str(os.environ.get("GITHUB_SHA") or "").strip().lower()
        if runtime_sha and runtime_sha != expected_sha:
            raise AcceptanceError("Workflow SHA does not match the exact reviewed Development SHA.")

        client_id = str(os.environ.get(ACCESS_ID_ENV) or "").strip()
        client_secret = str(os.environ.get(ACCESS_SECRET_ENV) or "").strip()
        if not client_id or not client_secret:
            raise AcceptanceError("Both canonical Cloudflare Access service-token GitHub secrets must be configured.")

        status, raw, content_type = request_application(base_url, client_id, client_secret, timeout)
        evidence["access_headers_sent"] = True
        evidence["http_status"] = status

        if status != 401:
            raise AcceptanceError(f"Expected application HTTP 401 after outer Access admission; observed HTTP {status}.")
        if "application/json" not in content_type:
            raise AcceptanceError("Expected application JSON; the response was not application/json.")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as error:
            raise AcceptanceError("Expected application JSON could not be decoded.") from error
        if not isinstance(payload, dict) or payload.get("ok") is not False or str(payload.get("error") or "") != "Unauthorized.":
            raise AcceptanceError("Response did not match the application's unauthenticated /api/auth/me contract.")

        evidence["state"] = "PASS"
        evidence["conclusion"] = "success"
        evidence["application_response_profile"] = "unauthenticated_401_json"
        write_evidence(evidence_path, evidence)
        print("RELEASE 467 BUILD 6 CLOUDFLARE ACCESS ACCEPTANCE: PASS")
        print("Target: canonical Development host only")
        print("Outer Access service token: ACCEPTED")
        print("Application session sent: NO")
        print("Application authentication result: EXPECTED 401 UNAUTHORIZED")
        print("Secret values emitted: NONE")
        print("D1/R2 mutation: NONE")
        print("Provider execution: NONE")
        print("Production mutation: NONE")
        return 0
    except AcceptanceError as error:
        evidence["application_response_profile"] = "acceptance_not_proven"
        write_evidence(evidence_path, evidence)
        print(f"RELEASE 467 BUILD 6 CLOUDFLARE ACCESS ACCEPTANCE: HOLD/FAIL — {error}")
        print("Secret values emitted: NONE")
        print("D1/R2 mutation: NONE")
        print("Provider execution: NONE")
        print("Production mutation: NONE")
        return 2


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--expected-sha", required=True)
    parser.add_argument("--evidence-json", required=True)
    parser.add_argument("--timeout", type=float, default=20.0)
    args = parser.parse_args()
    return run(args.base_url, args.expected_sha, Path(args.evidence_json), args.timeout)


if __name__ == "__main__":
    raise SystemExit(main())

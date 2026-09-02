#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "release467-build5-ci-access-readiness.json"
JS = ROOT / "public/js/admin-it-ci-access-readiness.js"
HTML = ROOT / "admin/it/index.html"
HANDOFF = ROOT / "AI_HANDOFF.md"
WORKFLOW = ROOT / ".github/workflows/release467-build5-proof.yml"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def read(path: Path) -> str:
    require(path.exists(), f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    manifest_text = read(MANIFEST)
    manifest = json.loads(manifest_text)
    js = read(JS)
    html = read(HTML)
    handoff = read(HANDOFF)
    workflow = read(WORKFLOW)

    require(manifest.get("release") == 467, "manifest release must be 467")
    require(manifest.get("build") == 5, "manifest build must be 5")
    require(manifest.get("title") == "CI / Cloudflare Access service-token readiness", "unexpected Build 5 title")
    require(manifest.get("state") == "HOLD_EXTERNAL", "CI Access must default to HOLD_EXTERNAL")
    require(manifest.get("production_mutation_authorized") is False, "Production mutation must remain unauthorized")
    require(manifest.get("schema_change_authorized") is False, "Build 5 must remain schema-neutral")

    token = manifest.get("cloudflare_access_service_token") or {}
    require(token.get("state") == "HOLD_EXTERNAL", "service-token acceptance must remain HOLD_EXTERNAL")
    require(token.get("development_only") is True, "service-token authority must be Development-only")
    require(token.get("secret_values_forbidden_in_ui_logs_artifacts") is True, "secret values must be forbidden")
    require(
        token.get("required_github_actions_secret_names") == ["CF_ACCESS_CLIENT_ID", "CF_ACCESS_CLIENT_SECRET"],
        "canonical Cloudflare Access GitHub Actions secret names changed",
    )

    separation = manifest.get("authority_separation") or {}
    require("never CI Access proof" in separation.get("ci_access", ""), "browser/CI separation is missing")
    require("not application-admin authentication" in separation.get("application_admin", ""), "Access/app-auth separation is missing")

    require("itCiAccessReadinessMount" in html, "I.T. Build 5 mount is missing")
    require("/public/js/admin-it-ci-access-readiness.js?v=467" in html, "I.T. Build 5 script is missing")
    require("Build 5" in html and "CI / Access" in html, "I.T. Build 5 operator context is missing")

    required_js_markers = [
        "Browser Acceptance PASS ≠ CI Access PASS.",
        "CF_ACCESS_CLIENT_ID",
        "CF_ACCESS_CLIENT_SECRET",
        "secret_values_included: false",
        "production_mutation_authorized: false",
        "method: 'GET'",
        "release467-build5-ci-access-checklist.json",
    ]
    for marker in required_js_markers:
        require(marker in js, f"Build 5 JS marker missing: {marker}")

    forbidden_js_markers = [
        "method: 'POST'",
        'method: "POST"',
        "method: 'PUT'",
        'method: "PUT"',
        "method: 'PATCH'",
        'method: "PATCH"',
        "method: 'DELETE'",
        'method: "DELETE"',
        "CF-Access-Client-Secret",
        "localStorage.setItem",
        "sessionStorage.setItem",
    ]
    for marker in forbidden_js_markers:
        require(marker not in js, f"forbidden Build 5 browser behavior found: {marker}")

    require("Build 5 — CI / Cloudflare Access readiness" in handoff, "canonical handoff must retain Release 467 Build 5 CI / Access authority")
    require("HOLD_EXTERNAL" in handoff, "canonical handoff must preserve external CI Access hold")
    require("CF_ACCESS_CLIENT_ID" in handoff and "CF_ACCESS_CLIENT_SECRET" in handoff, "handoff must name canonical secret names")
    require("Release 466" not in handoff.split("## Historical authority", 1)[0], "stale Release 466 current authority remains in handoff")

    require("python scripts/release467_build5_gate.py" in workflow, "Build 5 workflow does not execute the source gate")
    require("Cloudflare contact: NONE" in workflow, "Build 5 source workflow boundary missing")
    require("Production mutation: NONE" in workflow, "Build 5 source workflow Production boundary missing")
    require("CF_ACCESS_CLIENT_SECRET" not in workflow, "source-proof workflow must not consume the Access client secret")

    print("Release 467 Build 5 CI / Cloudflare Access readiness gate: PASS")
    print("Cloudflare contact: NONE")
    print("Secret values inspected: NONE")
    print("D1/R2 mutation: NONE")
    print("Provider execution/publication: NONE")
    print("Production mutation: NONE")
    print("External CI Access acceptance: HOLD_EXTERNAL")


if __name__ == "__main__":
    main()

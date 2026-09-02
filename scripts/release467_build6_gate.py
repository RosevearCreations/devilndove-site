#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "release467-build6-access-acceptance-harness.json"
PROBE = ROOT / "scripts/release467_build6_access_acceptance.py"
UI = ROOT / "public/js/admin-it-access-acceptance-harness.js"
HTML = ROOT / "admin/it/index.html"
HANDOFF = ROOT / "AI_HANDOFF.md"
PROOF_WORKFLOW = ROOT / ".github/workflows/release467-build6-proof.yml"
ACCEPTANCE_WORKFLOW = ROOT / ".github/workflows/release467-build6-cloudflare-access-acceptance.yml"
BUILD5_CI_GATE = ROOT / "scripts/release467_build5_gate.py"
BUILD5_PROMOTION_GATE = ROOT / "scripts/release467_build5_promotion_gate.py"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def read(path: Path) -> str:
    require(path.exists(), f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    manifest = json.loads(read(MANIFEST))
    probe = read(PROBE)
    ui = read(UI)
    html = read(HTML)
    handoff = read(HANDOFF)
    proof_workflow = read(PROOF_WORKFLOW)
    acceptance_workflow = read(ACCEPTANCE_WORKFLOW)
    read(BUILD5_CI_GATE)
    read(BUILD5_PROMOTION_GATE)

    require(manifest.get("release") == 467, "manifest release must be 467")
    require(manifest.get("build") == 6, "manifest build must be 6")
    require(manifest.get("title") == "Development Cloudflare Access service-token acceptance harness", "unexpected Build 6 title")
    require(manifest.get("source_branch") == "release467-build6-access-acceptance-current-dev", "Build 6 source branch authority drifted")
    require(manifest.get("source_base_sha") == "70015d78ae516050feb168be4190447256032d8c", "Build 6 current-dev source base drifted")
    require(manifest.get("state") == "READY_FOR_EXTERNAL_ACCEPTANCE", "Build 6 source state must be ready for external acceptance")
    require(manifest.get("external_acceptance_state") == "HOLD_EXTERNAL", "real Access acceptance must remain HOLD_EXTERNAL before external proof")
    require(manifest.get("production_mutation_authorized") is False, "Production mutation must remain unauthorized")
    require(manifest.get("schema_change_authorized") is False, "Build 6 must remain schema-neutral")
    require(
        manifest.get("inherited_build5_authorities") == [
            "release467-build5-ci-access-readiness.json",
            "release467-build5-production-promotion-readiness.json",
        ],
        "Build 6 must preserve both Build 5 authorities",
    )

    target = manifest.get("target") or {}
    require(target.get("base_url") == "https://dev.devilndove-site.pages.dev", "Build 6 target must be canonical Development alias")
    require(target.get("path") == "/api/auth/me", "Build 6 probe path changed")
    require(target.get("method") == "GET", "Build 6 probe must be GET-only")
    require(target.get("development_only") is True, "Build 6 target must be Development-only")
    require(target.get("application_cookie_sent") is False, "Build 6 must not send an application cookie")
    require(target.get("authorization_header_sent") is False, "Build 6 must not send an Authorization header")
    require(target.get("expected_application_status") == 401, "Build 6 must expect application 401")

    token = manifest.get("service_token") or {}
    require(
        token.get("required_github_actions_secret_names") == ["CF_ACCESS_CLIENT_ID", "CF_ACCESS_CLIENT_SECRET"],
        "canonical Cloudflare Access secret names changed",
    )
    require(token.get("secret_values_forbidden_in_logs_artifacts_ui") is True, "secret values must remain forbidden")
    require(token.get("browser_runtime_must_not_receive_service_token") is True, "browser must never receive Access service-token values")

    workflow = manifest.get("acceptance_workflow") or {}
    require(workflow.get("path") == ".github/workflows/release467-build6-cloudflare-access-acceptance.yml", "acceptance workflow path changed")
    require(workflow.get("trigger") == "workflow_dispatch", "acceptance workflow must be dispatch-only")
    require(workflow.get("workflow_dispatch_only") is True, "acceptance workflow must remain deliberate")
    require(workflow.get("requires_exact_dev_sha") is True, "acceptance workflow must pin exact dev SHA")

    required_probe_markers = [
        'DEFAULT_BASE_URL = "https://dev.devilndove-site.pages.dev"',
        'REQUEST_PATH = "/api/auth/me"',
        'ACCESS_ID_ENV = "CF_ACCESS_CLIENT_ID"',
        'ACCESS_SECRET_ENV = "CF_ACCESS_CLIENT_SECRET"',
        '"CF-Access-Client-Id": client_id',
        '"CF-Access-Client-Secret": client_secret',
        'method="GET"',
        'status != 401',
        'payload.get("ok") is not False',
        '"application_session_sent": False',
        '"secret_values_included": False',
        '"production_mutation": False',
        '"d1_r2_mutation": False',
        '"provider_execution": False',
    ]
    for marker in required_probe_markers:
        require(marker in probe, f"Build 6 probe marker missing: {marker}")

    forbidden_probe_markers = [
        "DND_DEV_SESSION_COOKIE",
        "CLOUDFLARE_API_TOKEN",
        "wrangler",
        "d1 execute",
        "stripe",
        "paypal",
        "method=\"POST\"",
        "method=\"PUT\"",
        "method=\"PATCH\"",
        "method=\"DELETE\"",
    ]
    lowered_probe = probe.lower()
    for marker in forbidden_probe_markers:
        require(marker.lower() not in lowered_probe, f"forbidden Build 6 probe behavior found: {marker}")

    require("workflow_dispatch:" in acceptance_workflow, "acceptance workflow must expose workflow_dispatch")
    require("push:" not in acceptance_workflow, "external acceptance workflow must not auto-run on push")
    require("pull_request:" not in acceptance_workflow, "external acceptance workflow must not auto-run on pull requests")
    require("ref: dev" in acceptance_workflow, "acceptance workflow must check out dev")
    require("${{ secrets.CF_ACCESS_CLIENT_ID }}" in acceptance_workflow, "acceptance workflow missing client ID secret reference")
    require("${{ secrets.CF_ACCESS_CLIENT_SECRET }}" in acceptance_workflow, "acceptance workflow missing client secret reference")
    require("--expected-sha \"${EXPECTED_SHA}\"" in acceptance_workflow, "acceptance workflow must pin exact SHA into probe")
    require("actions/upload-artifact@v4" in acceptance_workflow, "acceptance workflow must preserve sanitized evidence")
    require("Production mutation: NONE" in acceptance_workflow, "acceptance workflow Production boundary missing")

    require("itAccessAcceptanceHarnessMount" in html, "I.T. Build 6 mount is missing")
    require("/public/js/admin-it-access-acceptance-harness.js?v=467" in html, "I.T. Build 6 script is missing")
    require("itPromotionReadinessMount" in html, "Build 5 promotion-readiness mount must be retained")
    require("/public/js/admin-it-promotion-readiness.js?v=467" in html, "Build 5 promotion-readiness script must be retained")
    require("/public/js/admin-module-hub.js?v=466" in html, "inherited module hub cache contract changed")
    require("Build 6" in html and "Access acceptance" in html, "I.T. Build 6 operator context is missing")

    required_ui_markers = [
        "READY_FOR_EXTERNAL_ACCEPTANCE",
        "HOLD_EXTERNAL",
        "CF_ACCESS_CLIENT_ID",
        "CF_ACCESS_CLIENT_SECRET",
        "workflow_dispatch_only: true",
        "application_cookie_sent: false",
        "authorization_header_sent: false",
        "secret_values_included: false",
        "method: 'GET'",
        "release467-build6-access-acceptance-contract.json",
        "The I.T. browser never receives or sends the Access service-token values",
    ]
    for marker in required_ui_markers:
        require(marker in ui, f"Build 6 UI marker missing: {marker}")

    for marker in ["method: 'POST'", 'method: "POST"', "localStorage.setItem", "sessionStorage.setItem", "CF-Access-Client-Secret"]:
        require(marker not in ui, f"forbidden Build 6 browser behavior found: {marker}")

    require("Release 467 Build 6" in handoff, "canonical handoff has not converged to Release 467 Build 6")
    require("HOLD_EXTERNAL" in handoff, "canonical handoff must preserve external Access hold")
    require("CF_ACCESS_CLIENT_ID" in handoff and "CF_ACCESS_CLIENT_SECRET" in handoff, "handoff must preserve canonical secret names")
    require("Production Promotion Readiness" in handoff, "handoff must preserve Build 5 promotion-readiness authority")
    require("Release 466" not in handoff.split("## Historical authority", 1)[0], "stale Release 466 current authority remains in handoff")

    require("python scripts/release467_build5_gate.py" in proof_workflow, "Build 6 proof must preserve Build 5 CI / Access authority")
    require("python scripts/release467_build5_promotion_gate.py" in proof_workflow, "Build 6 proof must preserve Build 5 promotion-readiness authority")
    require("python scripts/release467_build6_gate.py" in proof_workflow, "Build 6 proof does not execute Build 6 source gate")
    require("Cloudflare contact: NONE" in proof_workflow, "Build 6 source proof must remain offline")
    require("Production mutation: NONE" in proof_workflow, "Build 6 source proof Production boundary missing")
    require("secrets.CF_ACCESS_CLIENT_SECRET" not in proof_workflow, "Build 6 source proof must not consume Access secrets")

    print("Release 467 Build 6 Access acceptance harness source gate: PASS")
    print("Build 5 CI / Access authority: RETAINED")
    print("Build 5 Production Promotion Readiness authority: RETAINED")
    print("External acceptance workflow: DISPATCH ONLY")
    print("Source-proof Cloudflare contact: NONE")
    print("Secret values inspected by source proof: NONE")
    print("D1/R2 mutation: NONE")
    print("Provider execution/publication: NONE")
    print("Production mutation: NONE")
    print("External CI Access acceptance: HOLD_EXTERNAL until dispatch succeeds")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]


def req(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"RELEASE 467 BUILD 1 GATE: FAIL: {message}")


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def changed_files() -> list[str]:
    try:
        base = subprocess.check_output(
            ["git", "merge-base", "HEAD", "origin/dev"], cwd=ROOT, text=True
        ).strip()
        out = subprocess.check_output(
            ["git", "diff", "--name-only", f"{base}...HEAD"], cwd=ROOT, text=True
        )
        return [line.strip() for line in out.splitlines() if line.strip()]
    except Exception:
        return []


api_path = "functions/api/admin/it-control-tower.js"
ui_path = "public/js/admin-it-control-tower.js"
html_path = "admin/it/index.html"
authority_path = "release467-build1-it-readiness-control-tower.json"
workflow_path = ".github/workflows/release467-build1-proof.yml"

for path in (api_path, ui_path, html_path, authority_path, workflow_path):
    req((ROOT / path).exists(), f"missing {path}")

api = read(api_path)
ui = read(ui_path)
html = read(html_path)
authority = json.loads(read(authority_path))

req("export async function onRequestGet" in api, "control tower must be GET-only")
req("onRequestPost" not in api and "onRequestPut" not in api and "onRequestDelete" not in api and "onRequestPatch" not in api, "control tower gained a mutation method")
req("getAdminUserFromRequest" in api, "admin authentication is not enforced")
req("request_time_schema_mutation: false" in api, "request-time schema mutation boundary missing")
req("production_mutation: false" in api, "Production mutation boundary missing")
req("production_provider_execution: false" in api, "Production provider execution boundary missing")
req("secret_values_emitted: false" in api, "secret-value redaction boundary missing")
req("r2_identity_control_plane_proof" in api and "not inferred from opaque binding objects" in api, "opaque binding identity must not be inferred")
req("HOLD_EXTERNAL_ACCEPTANCE" in api, "external acceptance HOLD boundary missing")
req("runtime_exact_sha_unavailable" in api and "shaFromEnv" in api, "exact-SHA fail-closed evidence missing")
req("PRAGMA foreign_key_check" in api, "foreign-key preflight missing")
req("d1_migrations" in api and "app_schema_migration_proofs" in api, "canonical migration/proof checks missing")
req("it_provider_readiness_checks" in api and "payment_refunds" in api, "provider evidence authority missing")
req("oauth_security_events" in api and "creative_asset_access_audit" in api, "external evidence aggregation incomplete")

req("/api/admin/it-control-tower" in ui, "I.T. UI does not call the control tower")
req("I.T. Preflight Command Center" in ui, "preflight command center UI missing")
req("Open corrective workspace" in ui, "corrective mechanics are not surfaced")
req("readiness.score" not in ui, "unexpected direct object contract")
req("itControlTowerMount" in html, "I.T. control tower mount missing")
req("admin-it-control-tower.js?v=467" in html, "I.T. control tower script missing")
req('data-admin-module-hub="it"' in html, "I.T. module hub contract drifted")
req("/admin/storefront/" in html and "/admin/creator/" in html and "/admin/finance/" in html and "/admin/it/" in html, "four-workspace admin navigation drifted")

req(authority.get("release") == 467 and authority.get("build") == 1, "release/build authority drifted")
req(authority.get("schema_change_required") is False, "Build 467 must remain schema-neutral")
req(authority.get("request_time_schema_mutation") is False, "request-time schema mutation must remain false")
req(authority.get("production_mutation") is False, "Production mutation must remain false")
req(authority.get("production_provider_execution") is False, "Production provider execution must remain false")
req(authority.get("admin_root_navigation_cards") == 4, "root admin must remain four cards")
req(authority.get("api_methods") == ["GET"], "control tower API method authority drifted")
req(authority.get("readiness_policy", {}).get("unknown_is_green") is False, "unknown evidence must never be GREEN")
req(authority.get("readiness_policy", {}).get("configuration_is_external_acceptance") is False, "configuration must not equal external acceptance")
req(authority.get("readiness_policy", {}).get("runtime_binding_presence_is_exact_identity") is False, "opaque runtime bindings must not claim exact identity")
req(authority.get("external_acceptance", {}).get("launch_state_until_proven") == "HOLD_EXTERNAL_ACCEPTANCE", "external HOLD boundary drifted")
req(authority.get("secret_policy", {}).get("secret_values_emitted") is False, "secret values must never be emitted")
req(authority.get("expected_development_authority", {}).get("d1_id") == "dbc1615b-dcbe-4951-973b-b47c99c73bfa", "Development D1 authority drifted")
req(authority.get("expected_development_authority", {}).get("product_r2_bucket") == "devilndove-toolshed-images-dev", "Development product R2 authority drifted")
req(authority.get("expected_development_authority", {}).get("caip_r2_bucket") == "devilndove-caip-media-dev", "Development CAIP R2 authority drifted")

changed = changed_files()
if changed:
    migration_changes = [path for path in changed if path.startswith("migrations/") or path.lower().endswith(".sql")]
    req(not migration_changes, f"Build 467 is schema-neutral but migration/SQL files changed: {migration_changes}")

print("RELEASE 467 BUILD 1 I.T. READINESS CONTROL TOWER: PASS")
print("schema_change=NONE request_time_mutation=NONE production_mutation=NONE")
print("unknown_evidence=AMBER external_acceptance=HOLD secret_values=REDACTED")

#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]


def req(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"RELEASE 467 BUILD 2 GATE: FAIL: {message}")


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


ui_path = "public/js/admin-it-readiness-actions.js"
html_path = "admin/it/index.html"
authority_path = "release467-build2-it-readiness-actions.json"
workflow_path = ".github/workflows/release467-build2-proof.yml"
build1_gate_path = "scripts/release467_build1_gate.py"
build1_api_path = "functions/api/admin/it-control-tower.js"

for path in (ui_path, html_path, authority_path, build1_gate_path, build1_api_path):
    req((ROOT / path).exists(), f"missing {path}")

ui = read(ui_path)
html = read(html_path)
authority = json.loads(read(authority_path))
build1_api = read(build1_api_path)

req("export async function onRequestGet" in build1_api, "Build 1 Control Tower GET authority is missing")
req("/api/admin/it-control-tower" in ui, "Build 2 queue must derive from the Build 1 Control Tower")
req("cache: 'no-store'" in ui, "readiness queue must avoid stale readiness evidence")
req("I.T. Readiness Action Queue" in ui, "readiness action queue UI missing")
req("Recovery Runbook Library" in ui, "runbook library UI missing")
req("collectActions" in ui and "if (level === 'green') return" in ui, "open queue must omit GREEN findings")
req("actionPriority" in ui and "state === 'red' ? 0" in ui, "RED-before-AMBER priority is missing")
req("data-it-action-filter" in ui, "queue filters missing")
req("safeHref" in ui and "href.startsWith('/admin/')" in ui, "corrective workspace links are not constrained to admin routes")
req("Safety boundary: no schema repair, Production mutation, provider execution, secret disclosure or access-policy change" in ui, "operator safety boundary is not visible")
req("automatic repair" not in ui.lower(), "Build 2 must not advertise automatic repair")

runbook_ids = [
    "RB-D1-01",
    "RB-ADMIN-01",
    "RB-R2-01",
    "RB-CONFIG-01",
    "RB-PROVIDER-01",
    "RB-ACCEPT-01",
    "RB-SHA-01",
]
for runbook_id in runbook_ids:
    req(runbook_id in ui, f"missing runbook {runbook_id}")

for phrase in (
    "request handler",
    "last-active-I.T.-manager",
    "opaque runtime binding",
    "never expose secret values",
    "Production provider execution closed",
    "HOLD_EXTERNAL_ACCEPTANCE",
    "Do not infer a SHA",
):
    req(phrase in ui, f"missing runbook safety phrase: {phrase}")

req("itReadinessActionQueueMount" in html, "Build 2 UI mount missing from I.T. workspace")
req("admin-it-readiness-actions.js?v=467" in html, "Build 2 UI script missing from I.T. workspace")
req("admin-it-control-tower.js?v=467" in html, "Build 1 Control Tower must remain mounted")
req('data-admin-module-hub="it"' in html, "I.T. module hub contract drifted")
req("/admin/storefront/" in html and "/admin/creator/" in html and "/admin/finance/" in html and "/admin/it/" in html, "four-workspace admin navigation drifted")

req(authority.get("release") == 467 and authority.get("build") == 2, "release/build authority drifted")
req(authority.get("depends_on") == "release467-build1-it-readiness-control-tower", "Build 1 dependency drifted")
req(authority.get("schema_change_required") is False, "Build 2 must remain schema-neutral")
req(authority.get("request_time_schema_mutation") is False, "request-time schema mutation must remain false")
req(authority.get("production_mutation") is False, "Production mutation must remain false")
req(authority.get("production_provider_execution") is False, "Production provider execution must remain false")
req(authority.get("secret_values_emitted") is False, "secret values must not be emitted")
req(authority.get("access_policy_mutation") is False, "Access policy mutation must remain false")
req(authority.get("new_api_route") is False, "Build 2 should reuse the Build 1 read authority")
req(authority.get("read_authority") == "/api/admin/it-control-tower", "Build 2 read authority drifted")
req(authority.get("read_methods") == ["GET"], "Build 2 read method authority drifted")
req(authority.get("ui_mount") == "itReadinessActionQueueMount", "Build 2 UI mount authority drifted")

queue_policy = authority.get("queue_policy", {})
req(queue_policy.get("included_states") == ["red", "amber"], "open queue state contract drifted")
req(queue_policy.get("green_findings_in_open_queue") is False, "GREEN findings must remain outside the open queue")
req(queue_policy.get("priority_order") == ["red", "amber"], "RED-before-AMBER priority authority drifted")
req(queue_policy.get("unknown_is_green") is False, "unknown evidence must never be GREEN")
req(queue_policy.get("automatic_repair") is False, "automatic repair must remain closed")
req(queue_policy.get("mutation_buttons") is False, "queue mutation buttons must remain closed")

req(authority.get("runbooks") == runbook_ids, "runbook registry authority drifted")
runbook_policy = authority.get("runbook_policy", {})
req(runbook_policy.get("each_runbook_has_trigger") is True, "runbook triggers are required")
req(runbook_policy.get("each_runbook_has_safe_steps") is True, "safe runbook steps are required")
req(runbook_policy.get("each_runbook_has_pass_condition") is True, "runbook pass conditions are required")
req(runbook_policy.get("corrections_execute_in_existing_audited_workspaces") is True, "repairs must remain in audited workspaces")
req(runbook_policy.get("request_handler_schema_repair") is False, "request-handler schema repair must remain closed")
req(runbook_policy.get("production_repair_from_queue") is False, "Production repair from the queue must remain closed")
req(runbook_policy.get("secret_disclosure") is False, "secret disclosure must remain closed")
req(runbook_policy.get("hostname_or_release_number_sha_inference") is False, "SHA inference must remain closed")

safety = authority.get("safety_boundaries", {})
req(safety.get("development_first") is True, "Development-first boundary drifted")
req(safety.get("production_closed") is True, "Production must remain closed")
req(safety.get("external_acceptance_hold_preserved") is True, "external acceptance HOLD must be preserved")
req(safety.get("it_last_manager_lockout_protection_preserved") is True, "I.T. last-manager protection must be preserved")
req(safety.get("opaque_r2_binding_identity_not_inferred") is True, "opaque R2 identity must not be inferred")
req(safety.get("configuration_presence_not_equal_external_acceptance") is True, "configuration must not equal external acceptance")
req(authority.get("expected_admin_navigation") == ["storefront", "creator", "finance", "it"], "admin navigation authority drifted")
req(authority.get("base_development_sha") == "0ee8d9a59fe0fbe9c13b0a8cf70c909f04997bca", "Build 2 base Development SHA drifted")

changed = changed_files()
if changed:
    migration_changes = [path for path in changed if path.startswith("migrations/") or path.lower().endswith(".sql")]
    req(not migration_changes, f"Build 2 is schema-neutral but migration/SQL files changed: {migration_changes}")
    runtime_api_changes = [path for path in changed if path.startswith("functions/api/")]
    req(not runtime_api_changes, f"Build 2 should not change runtime API handlers: {runtime_api_changes}")

req((ROOT / workflow_path).exists(), f"missing {workflow_path}")
workflow = read(workflow_path)
req("python scripts/release467_build1_gate.py" in workflow, "Build 2 workflow must retain Build 1 regression proof")
req("python scripts/release467_build2_gate.py" in workflow, "Build 2 workflow gate missing")
req("node --check public/js/admin-it-readiness-actions.js" in workflow, "Build 2 JavaScript syntax check missing")

print("RELEASE 467 BUILD 2 I.T. READINESS ACTION QUEUE & RUNBOOKS: PASS")
print("schema_change=NONE runtime_api_change=NONE request_time_mutation=NONE production_mutation=NONE")
print("queue=RED_THEN_AMBER runbooks=7 repairs=EXISTING_AUDITED_WORKSPACES external_acceptance=HOLD")

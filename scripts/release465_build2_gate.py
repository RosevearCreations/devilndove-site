#!/usr/bin/env python3
"""Static acceptance for Release 465 Build 2 — Inventory & Creator Intelligence."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

def read(path):
    p = ROOT / path
    if not p.is_file():
        FAIL.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="replace")

def req(ok, msg):
    if not ok: FAIL.append(msg)

def has(body, *tokens, label="file"):
    for token in tokens: req(token in body, f"{label} missing required contract: {token}")

authority = json.loads(read("release465-build2-inventory-creator-intelligence.json") or "{}")
req(int(authority.get("release") or 0) == 465 and int(authority.get("build") or 0) == 2, "Release 465 Build 2 identity drifted")
req([x.get("id") for x in authority.get("items", [])] == [8,9,10,11,12,13], "Build 2 authority must contain exact items 8-13")
req(authority.get("state") in ("in_progress_source_candidate", "complete_development_green"), "Build 2 authority state is unsupported")
expected_status = "complete_development_green" if authority.get("state") == "complete_development_green" else "implemented_source_candidate"
req(all(x.get("status") == expected_status for x in authority.get("items", [])), f"Build 2 item status must be {expected_status}")
req(authority.get("schema_change_required") is False and authority.get("migration") is None, "Build 2 must not introduce a D1 schema migration")

safety = authority.get("safety") or {}
for key in ("production_mutation","provider_execution","provider_publication","inventory_consumption","production_posting","accounting_posting","automatic_relationship_write","automatic_next_action_execution","historical_genealogy_reconstruction","raw_r2_delete","request_time_schema_ddl"):
    req(safety.get(key) is False, f"Build 2 safety boundary must remain false: {key}")
req(safety.get("preview_access_must_remain_enforced") is True, "Preview Access must remain enforced")

manifest = json.loads(read("migrations/canonical/manifest.json") or "{}")
files = [x.get("file") for x in manifest.get("migrations", [])]
req(files == ["0001_release464_migration_authority.sql","0002_release464_operational_acceptance.sql","0003_release464_business_growth.sql","0004_release465_storefront_quality.sql"], "Build 2 must preserve exact canonical migration sequence 0001-0004 with no Build 2 migration")

helper = read("functions/api/_lib/inventoryCreatorIntelligence.js")
endpoint = read("functions/api/admin/inventory-creator-intelligence.js")
page = read("admin/inventory-creator-intelligence/index.html")
client = read("public/js/admin-inventory-creator-intelligence.js")

has(helper,"loadMaterialLotPlan","loadProductAvailabilityIntelligence","loadRelatedProductIntelligence","loadGenealogyExceptions","loadCreativeReadinessIntelligence","chooseNextSafeAction","actual_planned_quantity_claimed:false","historical_reconstruction_claimed:false","automatic_relationship_write:false","inventory_mutation_active:false","accounting_posting_active:false",label="Build 2 intelligence helper")
has(helper,"product_resource_links","site_item_inventory","inventory_purchase_lots","inventory_lot_policies","product_production_runs","product_production_run_material_lots","product_finished_inventory_lots","order_items","creative_projects","creative_media_evidence_ranges","content_projects","creative_business_pipelines",label="Build 2 reused authorities")
for forbidden in ("INSERT INTO", "UPDATE ", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "DROP TABLE", ".delete(", ".put("):
    req(forbidden not in helper, f"Build 2 helper must remain read-only: {forbidden}")

has(endpoint,"onRequestGet","mutation_capability: 'none'","provider_execution_active: false","inventory_mutation_active: false","accounting_posting_active: false","automatic_relationship_write: false","historical_reconstruction_claimed: false",label="Build 2 API")
req("onRequestPost" not in endpoint and "onRequestPut" not in endpoint and "onRequestDelete" not in endpoint, "Build 2 API must remain GET-only")
for forbidden in ("INSERT INTO", "UPDATE ", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "DROP TABLE"):
    req(forbidden not in endpoint, f"Build 2 API must remain read-only: {forbidden}")

req(page.lower().count("<h1") == 1, "Build 2 admin cockpit must have exactly one H1")
has(page,"Inventory &amp; Creator Intelligence","Material shortage forecast","Related-product intelligence","Genealogy exceptions","Creative readiness dimensions","No new D1 schema is required for Build 2.",label="Build 2 admin cockpit")
has(client,"/api/admin/inventory-creator-intelligence","renderAvailability","renderRelated","renderGenealogy","renderCreative","renderNext",label="Build 2 admin client")
for forbidden in ("method:'POST'", 'method:"POST"', "method:'PUT'", "method:'DELETE'", ".delete(", ".put("):
    req(forbidden not in client, f"Build 2 client must remain read-only: {forbidden}")

release = json.loads(read("development-release.json") or "{}")
req(int(release.get("release") or 0) == 465, "development-release must remain Release 465")
req(release.get("convergence_state") in ("release465_build2_source_candidate", "release465_build2_complete_development_green"), "development-release Build 2 state drifted")
req(release.get("current_release_database_state", {}).get("build2_schema_change_required") is False, "development-release must state no Build 2 schema change")
req(int(release.get("current_release_database_state", {}).get("development_native_migration_rows") or 0) == 4, "Build 2 must preserve 4 Development native migration rows")
req(int(release.get("current_release_database_state", {}).get("development_migration_proof_rows") or 0) == 4, "Build 2 must preserve 4 Development migration proof rows")

roadmap = read("docs/operations/RELEASE_465_THREE_BUILD_ROADMAP.md")
has(roadmap,"Build 1 — Storefront & SEO Quality — Development green","Build 2 — Inventory & Creator Intelligence","Build 3 — Financial, I.T. & Release Hardening",label="Release 465 roadmap")
workflow = read(".github/workflows/system-gate.yml")
has(workflow,"release465_build2_gate.py","inventoryCreatorIntelligence.js","inventory-creator-intelligence.js","admin-inventory-creator-intelligence.js",label="System Gate Build 2 coverage")

print("RELEASE 465 BUILD 2 — INVENTORY & CREATOR INTELLIGENCE")
print("Items: 8-13")
print("D1 schema change: NONE")
print("Related-product relationships: EXPLAINABLE / NON-MUTATING")
print("Availability + shortage forecast: READ ONLY / OPERATOR SCENARIO")
print("Genealogy historical reconstruction: NONE")
print("Next safe action execution: NONE")
print("Provider / Inventory / Accounting execution: CLOSED")
if FAIL:
    print("RELEASE 465 BUILD 2 GATE: FAIL")
    for i, item in enumerate(FAIL, 1): print(f"{i:03d}. {item}")
    raise SystemExit(1)
print("RELEASE 465 BUILD 2 GATE: PASS")

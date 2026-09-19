#!/usr/bin/env python3
"""Release 467 Build 200 — Supplier & Source Evidence Workbench fail-closed gate."""
from pathlib import Path
import re,subprocess,sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
def read(path):
    p=ROOT/path
    if not p.is_file():
        FAIL.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="replace")
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(["node","--check",str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f"JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1800:]}")

api=read("functions/api/admin/inventory-identity-health.js")
ui=read("public/js/admin-inventory-identity-cleanup-v183.js")
page=read("admin/inventory-operations/index.html")
budget=read("functions/api/_lib/d1ReadBudget.js")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
doc=read("docs/operations/RELEASE_467_BUILD_200_SUPPLIER_SOURCE_EVIDENCE_WORKBENCH.md")
workflow=read(".github/workflows/release467-build200-supplier-source-evidence-workbench.yml")
b199=read("scripts/release467_build199_gate.py")

for token in (
    "WORKBENCH_BUILD = 200",
    "SUPPLIER_NA_MARKER",
    "SOURCE_NA_MARKER",
    "supplierSourceState(",
    "supplierSourceWhere(",
    "supplier_filter",
    "candidate_evidence",
    "candidate_evidence_is_authorization: false",
    "candidate_evidence_auto_fill: false",
    "same_identity_inventory",
    "same_identity_catalog",
    "repair_from=build200",
    "stale_target",
):
    req(token in api,f"Build 200 supplier/source API contract missing: {token}")

for forbidden in (
    "onRequestPost","onRequestPatch","onRequestPut","onRequestDelete",
    "CREATE TABLE","ALTER TABLE","DROP TABLE","UPDATE site_item_inventory","DELETE FROM site_item_inventory",
    "bucket.put(","bucket.delete(","bucket.list("
):
    req(forbidden not in api,f"Build 200 API gained forbidden mutation/provider behavior: {forbidden}")

for token in (
    "Supplier & Source Workbench",
    "inventorySupplierSourceFilter",
    "missing_supplier",
    "missing_source",
    "known_na",
    "Open next unresolved",
    "Review candidate evidence",
    "Candidate supplier/source evidence",
    "[supplier-not-applicable]",
    "[source-not-applicable]",
    "siteInventorySupplierName",
    "siteInventorySourceUrl",
    "siteInventorySupplierSku",
    "siteInventoryNotes",
    "data-inventory-evidence-recheck",
    "api('record'",
    "safe reference:",
    "Compare duplicate-group evidence",
    "Catalog-reference evidence",
):
    req(token in ui+page,f"Build 200 workbench UI contract missing: {token}")

for forbidden in ("setInterval(","MutationObserver(","method:'POST'","method: 'POST'","method:'PATCH'","method: 'PATCH'"):
    req(forbidden not in ui,f"Build 200 workbench gained background/direct-write behavior: {forbidden}")

req(any(token in page for token in ("admin-inventory-identity-cleanup-v183.js?v=200","admin-inventory-identity-cleanup-v183.js?v=201")),"Build 200/201 Inventory asset cache-key successor missing")
req(page.lower().count("<h1") == 1,"Inventory Operations must keep exactly one H1")
for token in (
    "admin_inventory_supplier_source_workbench_v200",
    "explicit_supplier_source_evidence_queue",
    "candidate values are never selected automatically",
    "at most 12 duplicate-group and 12 catalog-reference",
):
    req(token in budget,f"Build 200 D1 budget contract missing: {token}")

legacy_roadmap=all(token in roadmap for token in (
    "Build 199 — complete",
    "Build 200 — current",
    "Build 201 — next after Build 200 is fully GREEN",
    "Builds 202–204: planned, not started",
))
active_successor_match=re.search(r"\*\*Build (\d+) — current\*\*",roadmap)
active_successor_build=int(active_successor_match.group(1)) if active_successor_match else 0
successor_roadmap=("Build 200 — complete" in roadmap and active_successor_build >= 201)
req(legacy_roadmap or successor_roadmap,"Build 200 roadmap checkpoint must be current or explicitly closed by Build 201 or later successors")

for token in (
    "exact starting boundary",
    "898 blank supplier names",
    "326 blank source references",
    "12,500",
    "blank provenance stays unknown",
    "candidate evidence is evidence only",
    "no supplier invention",
    "Build 201",
):
    req(token.lower() in doc.lower(),f"Build 200 operations contract missing: {token}")

condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
req(condition in workflow,"Build 200 live D1 proof must be exact-dev push only")
for token in ("D1_PROVIDER_ROWS_READ=","provider_rows_read <= 12500","rows_read budget exceeded","D1 MUTATION: ZERO","SCHEMA MIGRATION: NONE"):
    req(token in workflow,f"Build 200 exact-dev D1 proof missing: {token}")
for retained in (
    "python scripts/release467_build199_gate.py",
    "python scripts/release467_build189_gate.py",
    "python scripts/release467_build183_gate.py",
    "python scripts/release467_build194_gate.py",
):
    req(retained in workflow,f"Build 200 workflow missing retained gate: {retained}")

req("successor_roadmap" in b199,"Build 199 retained gate must recognize Build 200 successor")

for path in (
    "functions/api/admin/inventory-identity-health.js",
    "functions/api/_lib/d1ReadBudget.js",
    "public/js/admin-inventory-identity-cleanup-v183.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 200 SUPPLIER & SOURCE EVIDENCE WORKBENCH: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 200 SUPPLIER & SOURCE EVIDENCE WORKBENCH: PASS")
print("Queue: MISSING SUPPLIER / SOURCE / BOTH / SKU / REVIEWED N-A")
print("Candidates: SAME-IDENTITY INVENTORY + CATALOG / EVIDENCE ONLY")
print("Repair owner: INVENTORY OPERATIONS")
print("Recheck: ONE RECORD / STALE-SAFE / EXPLICIT ONLY")
print("Next unresolved: MANUAL / NO POLLING")
print("Automatic provenance/schema/R2/provider mutation: ZERO")

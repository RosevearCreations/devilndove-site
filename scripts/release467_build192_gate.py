#!/usr/bin/env python3
"""Release 467 Build 192 — Release Regression & Runtime Budget Convergence gate."""
from pathlib import Path
import json,re,subprocess,sys

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

budget_path="docs/operations/RELEASE_467_RUNTIME_BUDGETS.json"
budget_text=read(budget_path)
try:
    budget=json.loads(budget_text)
except Exception as exc:
    FAIL.append(f"Build 192 runtime budget JSON invalid: {exc}")
    budget={}

doc=read("docs/operations/RELEASE_467_BUILD_192_RELEASE_RUNTIME_BUDGET_CONVERGENCE.md")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_CLOSURE_BUILDS_187_192.md")
successor_roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
workflow=read(".github/workflows/release467-build192-release-runtime-budget-convergence.yml")
prod_workflow=read(".github/workflows/production-pages-deploy-current.yml")
renderer=read("public/js/product-detail-v166.js")
parity=read("public/js/product-detail-parity.js")
seo=read("public/js/seo-page-overrides.js")
quota_gate=read("scripts/release467_build184_d1_quota_guard.py")

expected={
  181:20000,182:5000,183:50000,184:50000,185:25000,
  187:5000,188:5000,189:20000,190:20000,191:15000,
}
entries=budget.get("d1_live_development_proofs") or []
by_build={int(row.get("build") or 0):row for row in entries if isinstance(row,dict)}
req(set(by_build)==set(expected),f"Build 192 budget manifest build set drifted: {sorted(by_build)}")
condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
for build,ceiling in expected.items():
    row=by_build.get(build,{})
    req(int(row.get("ceiling_rows_read") or 0)==ceiling,f"Build {build} centralized ceiling drifted")
    observed=int(row.get("last_observed_rows_read") or -1)
    req(observed>=0 and observed<=ceiling,f"Build {build} observed rows_read is invalid or above ceiling: {observed}/{ceiling}")
    req(int(row.get("last_success_run") or 0)>0,f"Build {build} missing provider-metered success run")
    req(bool(re.fullmatch(r"[0-9a-f]{40}",str(row.get("last_measured_sha") or ""))),f"Build {build} missing exact measured SHA")
    wf_path=str(row.get("workflow") or "")
    wf=read(wf_path)
    req(condition in wf,f"Build {build} live proof is not exact-dev push only")
    req("D1_PROVIDER_ROWS_READ=" in wf,f"Build {build} workflow lost provider-metered rows_read")
    req(f"provider_rows_read <= {ceiling}" in wf,f"Build {build} workflow ceiling no longer matches centralized {ceiling}")
    req("rows_read budget exceeded" in wf,f"Build {build} workflow lost fail-closed ceiling")

req(budget.get("policy",{}).get("silent_ceiling_increase_forbidden") is True,"Silent budget increase policy missing")
req(budget.get("policy",{}).get("production_code_only_zero_d1") is True,"Zero-D1 Production policy missing")
req(budget.get("starting_boundary",{}).get("development_sha")=="a51a556865d6bcc602cb0aa9ec5125593b7f762b","Build 192 starting Development boundary drifted")
req(budget.get("starting_boundary",{}).get("production_main_sha")=="691eb1830455f16cb2f0be53ee747a8956dcdb5a","Build 192 starting Production boundary drifted")

# Product detail remains one bounded core request and all secondary helpers consume the shared snapshot/event.
req(renderer.count("/api/product-detail-core?slug=")==1,"Product detail must retain exactly one core Product request")
for forbidden in ("/api/product-detail?slug=","setInterval(","MutationObserver"):
    req(forbidden not in renderer,f"Product detail runtime regression returned: {forbidden}")
for body,label in ((parity,"Product parity"),(seo,"Product SEO")):
    req("/api/product-detail?slug=" not in body,f"{label} reintroduced duplicate Product request")
    req("DDProductDetailSnapshot" in body and "dd:product-detail-rendered" in body,f"{label} lost shared Product snapshot/event")

# Product/catalog/inventory evidence APIs must remain read/bounded and free of request-time schema work.
runtime_files=[
 "functions/api/admin/catalog-health.js",
 "functions/api/admin/inventory-identity-health.js",
 "functions/api/admin/catalog-image-repair.js",
 "functions/api/admin/product-buyer-readiness.js",
 "functions/api/admin/_productResourcesData.js",
 "functions/api/admin/product-resource-bootstrap.js",
]
for path in runtime_files:
    body=read(path)
    upper=body.upper()
    for forbidden in ("CREATE TABLE","ALTER TABLE","DROP TABLE","CREATE INDEX"):
        req(forbidden not in upper,f"{path} reintroduced request-time DDL: {forbidden}")
    req("bucket.list(" not in body,f"{path} reintroduced unbounded/bucket R2 listing")

# Operator-facing evidence helpers must remain event/explicit-load based, never background polling.
ui_files=[
 "public/js/admin-catalog-repair-actions-v187.js",
 "public/js/admin-catalog-buyer-readiness-v182.js",
 "public/js/admin-inventory-identity-cleanup-v183.js",
 "public/js/admin-catalog-image-repair-v184.js",
 "public/js/admin-product-resources.js",
]
for path in ui_files:
    body=read(path)
    req("setInterval(" not in body,f"{path} gained background polling")
    req("MutationObserver(" not in body,f"{path} gained MutationObserver polling/fan-out")

for token in (
 "Catalog Health explicit summary action missing",
 "Product resources must remain explicit-only",
 "Inventory diagnostic startup: EXPLICIT OPERATOR LOAD",
 "Exact dev push proofs: PROVIDER rows_read METERED + HARD-CAPPED",
):
    req(token in quota_gate,f"Build 192 lost retained startup/quota protection marker: {token}")

# Code-only Production promotion must continue to perform zero remote D1 work.
for token in (
 "'mode':'code_only_zero_d1'",
 "PRODUCTION D1 REMOTE WORK: SKIPPED — code-only promotion",
 "'remote_d1_reads':0",
 "Code-only promotion: ZERO remote D1 verification queries from this deployment workflow",
):
    req(token in prod_workflow,f"Production zero-D1 contract missing: {token}")

# Build 192 is a source/proof convergence workflow. It must not spend D1 quota itself.
for forbidden in ("wrangler@4 d1 execute","CLOUDFLARE_API_TOKEN"):
    req(forbidden not in workflow,f"Build 192 convergence workflow must remain D1-free: {forbidden}")
for token in (
 "python scripts/release467_build192_gate.py",
 "python scripts/release467_build179_gate.py",
 "python scripts/release467_build180_gate.py",
 "python scripts/release467_build181_gate.py",
 "python scripts/release467_build182_gate.py",
 "python scripts/release467_build183_gate.py",
 "python scripts/release467_build184_gate.py",
 "python scripts/release467_build184_d1_quota_guard.py",
 "python scripts/release467_build185_gate.py",
 "python scripts/release467_build186_gate.py",
 "python scripts/release467_build187_gate.py",
 "python scripts/release467_build188_gate.py",
 "python scripts/release467_build189_gate.py",
 "python scripts/release467_build190_gate.py",
 "python scripts/release467_build191_gate.py",
 "release467-build192-exact-evidence",
):
    req(token in workflow,f"Build 192 workflow missing retained proof/evidence token: {token}")

req("Build 191 — complete" in roadmap and (("Build 192 — current and final planned build in this sequence" in roadmap) or (("Build 192 — complete" in roadmap) and ("CLOSED / Production GREEN" in roadmap) and (("Build 193 — next/current planned work" in successor_roadmap) or ("Build 193 — complete" in successor_roadmap and "Build 194 — current" in successor_roadmap)))),"Build 192 roadmap checkpoint missing")
for token in (
 "centralized runtime budget manifest",
 "19,282",
 "15,487",
 "7,771",
 "zero-D1",
 "one Product data request",
 "no request-time DDL",
 "no bucket-wide R2",
 "no background polling",
 "System Gate",
 "Current Application Quality Proof",
 "I.T. Admin Runtime Proof",
 "Repository Branch Hygiene",
 "Production Live Resource Integrity",
):
    req(token.lower() in doc.lower(),f"Build 192 operations doc missing: {token}")

for path in runtime_files + ui_files + ["public/js/product-detail-v166.js","public/js/product-detail-parity.js","public/js/seo-page-overrides.js"]:
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 192 RELEASE REGRESSION & RUNTIME BUDGET CONVERGENCE: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)

tight=min((int(row["ceiling_rows_read"])-int(row["last_observed_rows_read"]),int(row["build"])) for row in entries)
print("RELEASE 467 BUILD 192 RELEASE REGRESSION & RUNTIME BUDGET CONVERGENCE: PASS")
print("Central D1 ceilings: LOCKED / PROVIDER-METERED")
print(f"Tightest retained headroom: BUILD {tight[1]} / {tight[0]} rows")
print("Product detail: ONE CORE PRODUCT REQUEST / SHARED SNAPSHOT")
print("Admin optional systems: EXPLICIT / LAZY / BOUNDED")
print("Request-time DDL / bucket-wide R2 listing / background polling: NONE")
print("Build 192 live D1 work: ZERO")
print("Production code-only path: ZERO-D1")

#!/usr/bin/env python3
"""Release 467 Build 190 — Product & Inventory Media Evidence Closure gate."""
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

api=read("functions/api/admin/catalog-image-repair.js")
ui=read("public/js/admin-catalog-image-repair-v184.js")
health=read("admin/catalog-health/index.html")
budget=read("functions/api/_lib/d1ReadBudget.js")
doc=read("docs/operations/RELEASE_467_BUILD_190_MEDIA_EVIDENCE_CLOSURE.md")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_CLOSURE_BUILDS_187_192.md")
workflow=read(".github/workflows/release467-build190-media-evidence-closure.yml")
public_gate=read("scripts/release467_build186_gate.py")

for token in ("CLOSURE_BUILD=190","APPROVED_PRODUCT_USE","mediaEvidenceToken","roleEvidenceStatus","evidenceClassification","expected_token","current_token","stale_target","safe_to_rely","metadata_state","object_state","evidence_classification","automatic_reassignment:false","r2_mutation:false"):
    req(token in api,f"Build 190 API missing: {token}")
for token in ("missing_on_approved","ambiguous_on_approved","assigned_on_approved","image_role_ambiguous"):
    req(token in api+ui,f"Build 190 approved-role evidence missing: {token}")
for token in ("admin_media_evidence_recheck_v190","explicit_one_media_record_plus_single_r2_head","one selected Product image or Inventory image metadata read plus at most one canonical R2 object HEAD"):
    req(token in budget,f"Build 190 read-budget contract missing: {token}")
req("bucket.head(key)" in api,"Build 190 selected-object R2 HEAD missing")
for forbidden in ("bucket.list(","bucket.put(","bucket.delete(","onRequestPost","onRequestPatch","onRequestPut","onRequestDelete","CREATE TABLE","ALTER TABLE","DROP TABLE","INSERT INTO","UPDATE product_images","UPDATE site_item_inventory","DELETE FROM"):
    req(forbidden not in api,f"Build 190 media evidence API gained forbidden mutation/heavy behavior: {forbidden}")

for token in ("Release 467 • Build 190","Check R2 object / media evidence","data-image-evidence-token","metadata ","object ","Role evidence:","Build 190 uses only one selected R2 object HEAD"):
    req(token in ui,f"Build 190 media evidence UI missing: {token}")
for forbidden in ("method:'POST'","method: 'POST'","method:'PATCH'","method: 'PATCH'","setInterval(","MutationObserver("):
    req(forbidden not in ui,f"Build 190 UI gained polling/write behavior: {forbidden}")
req("admin-catalog-image-repair-v184.js?v=190" in health,"Build 190 Catalog Health asset cache key missing")
req(len(re.findall(r"<h1\b",health,re.I))==1,"Catalog Health must keep one H1")

req("Build 189 — complete" in roadmap and ((("Build 190 — current" in roadmap) and ("Build 191 — next after Build 190 is fully GREEN" in roadmap)) or (("Build 190 — complete" in roadmap) and ("Build 191 — current" in roadmap))),"Build 190/191 roadmap checkpoint missing")
for token in ("20,000 rows read","zero D1 mutation","zero R2 mutation","no canonical migration","zero-D1 code-only path","bucket.head(key)","metadata_state","object_state","Build 186"):
    req(token.lower() in doc.lower(),f"Build 190 operations doc missing: {token}")

condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
req(condition in workflow,"Build 190 live D1 proof must be exact-dev push only")
req("D1_PROVIDER_ROWS_READ=" in workflow,"Build 190 exact-dev proof lacks provider rows_read")
req("provider_rows_read <= 20000" in workflow,"Build 190 rows_read ceiling is not 20,000")
req("rows_read budget exceeded" in workflow,"Build 190 D1 proof does not fail closed")
for token in ("python scripts/release467_build189_gate.py","python scripts/release467_build184_gate.py","python scripts/release467_build184_d1_quota_guard.py","python scripts/release467_build186_gate.py"):
    req(token in workflow,f"Build 190 workflow missing retained gate: {token}")

for token in ("fetchpriority","Primary Product image: EAGER/HIGH PRIORITY; GALLERY LAZY","Product renderer must retain one Product-detail core request"):
    req(token in public_gate,f"Build 186 public media proof continuity missing: {token}")

for path in ("functions/api/admin/catalog-image-repair.js","functions/api/_lib/d1ReadBudget.js","public/js/admin-catalog-image-repair-v184.js"):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 190 MEDIA EVIDENCE CLOSURE: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 190 MEDIA EVIDENCE CLOSURE: PASS")
print("Media evidence: METADATA STATE + ONE SELECTED R2 HEAD")
print("Approved role evidence: MISSING / AMBIGUOUS / ASSIGNED")
print("Repair owners: PRODUCT MEDIA / INVENTORY OPERATIONS")
print("R2 listing/upload/copy/delete/reassignment: NONE")
print("Next: BUILD 191 COST, USAGE & PROFITABILITY EVIDENCE CLOSURE")

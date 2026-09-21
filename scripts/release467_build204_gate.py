#!/usr/bin/env python3
"""Release 467 Build 204 — Storefront Launch Set & Autonomous Closure fail-closed gate."""
from pathlib import Path
import subprocess,sys

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

api=read("functions/api/admin/storefront-launch-set.js")
ui=read("public/js/admin-storefront-launch-set-v204.js")
page=read("admin/catalog-health/index.html")
css=read("css/release467-build204-storefront-launch-set.css")
budget=read("functions/api/_lib/d1ReadBudget.js")
policy=read("public/js/commerce-policy-core.js")
renderer=read("public/js/product-detail-v166.js")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
doc=read("docs/operations/RELEASE_467_BUILD_204_STOREFRONT_LAUNCH_SET_AUTONOMOUS_CLOSURE.md")
workflow=read(".github/workflows/release467-build204-storefront-launch-set-autonomous-closure.yml")
b203=read("scripts/release467_build203_gate.py")

for token in (
    "BUILD=204",
    "MAX_SOURCE_ROWS=240",
    "MAX_ROWS=40",
    "analyzeBuyerReadiness",
    "policyPublicSnapshot",
    "ready",
    "review_required",
    "externally_blocked",
    "tracked_finished_stock_zero",
    "featured_image_missing",
    "gallery_depth",
    "alt_text_attention",
    "image_role_attention",
    "linked_inventory_match_missing",
    "linked_cost_unknown",
    "commerce_currency_outside_current_storefront",
    "external_only_sale_channel",
    "automatic_publish:false",
    "provider_execution:false",
    "mode==='product'",
    "expected_token",
    "stale_target",
    "HOLD_EXTERNAL",
):
    req(token in api,f"Build 204 launch-set API missing: {token}")
for forbidden in (
    "CREATE TABLE","ALTER TABLE","DROP TABLE","INSERT INTO","UPDATE products","UPDATE site_item_inventory",
    "UPDATE product_images","DELETE FROM","bucket.put(","bucket.delete(","bucket.list(",
    "onRequestPost","onRequestPatch","onRequestPut","onRequestDelete"
):
    req(forbidden not in api,f"Build 204 launch-set API gained forbidden mutation/schema/R2 behavior: {forbidden}")

for token in (
    "Storefront Launch Set & Autonomous Closure",
    "Load launch set",
    "No launch-set scan runs on page load.",
    "/api/admin/storefront-launch-set",
    "Ready is evidence, not permission to publish.",
    "Product Editor",
    "Product Media",
    "Inventory / resources",
    "Recheck Product",
    "Canada only",
    "U.S. sales/shipping disabled",
):
    req(token in ui,f"Build 204 launch-set UI missing: {token}")
for forbidden in ("setInterval(","MutationObserver(","method:'POST'","method: 'POST'","method:'PATCH'","method: 'PATCH'"):
    req(forbidden not in ui,f"Build 204 launch-set UI gained polling/write behavior: {forbidden}")

for token in (
    "storefrontLaunchSetMount",
    "release467-build204-storefront-launch-set.css?v=204",
    "admin-storefront-launch-set-v204.js?v=204",
):
    req(token in page,f"Catalog Health Build 204 mount/cache identity missing: {token}")
req(any(token in page for token in ("Release 467 • Build 204","Release 467 • Build 225")),"Catalog Health Build 204 page identity lost a valid successor")
req(page.lower().count("<h1")==1,"Catalog Health must keep exactly one H1")
for token in ("launch-set-summary","launch-set-toolbar","launch-set-row","@media(max-width:680px)"):
    req(token in css,f"Build 204 responsive CSS missing: {token}")

for token in (
    "admin_storefront_launch_set_v204",
    "explicit_only_grouped_launch_readiness_projection",
    "admin_storefront_launch_recheck_v204",
    "explicit_one_product_launch_evidence_recheck",
):
    req(token in budget,f"Build 204 D1 budget contract missing: {token}")

for token in (
    "allowed_shipping_country_codes: Object.freeze(['CA'])",
    "allowed_billing_country_codes: Object.freeze(['CA'])",
    "currency: 'CAD'",
    "united_states_sales_enabled: false",
    "united_states_shipping_enabled: false",
):
    req(token in policy,f"Build 204 Canada-only commerce authority missing: {token}")

req(renderer.count("/api/product-detail-core?slug=")==1,"Product detail must retain exactly one core Product request")
for forbidden in ("/api/product-detail?slug=","setInterval(","MutationObserver"):
    req(forbidden not in renderer,f"Build 204 retained Product runtime regression: {forbidden}")

for token in (
    "Build 203 — complete",
    "Build 204 — current and final planned build",
    "Future queue after Build 204",
    "none pre-planned",
    "6e08228a925fa1283a0e25b46ef1231b724c48e4",
):
    req(token in roadmap,f"Build 204 roadmap checkpoint missing: {token}")

for token in (
    "exact starting boundary",
    "7,350 / 12,500",
    "ready",
    "review_required",
    "externally_blocked",
    "15,000 provider-metered",
    "exact-SHA closure artifact",
    "U.S. sales/shipping disabled",
    "HOLD_EXTERNAL",
    "final pre-planned build",
    "future queue is exhausted",
    "historical pre-insertion planning provenance",
):
    req(token.lower() in doc.lower(),f"Build 204 operations contract missing: {token}")

condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
req(condition in workflow,"Build 204 live D1 proof must be exact-dev push only")
for token in (
    "products_reviewed",
    "ready_products",
    "review_required_products",
    "externally_blocked_products",
    "publicly_visible_products",
    "media_ready_products",
    "tracked_zero_stock_products",
    "products_with_unknown_linked_cost",
    "D1_PROVIDER_ROWS_READ=",
    "provider_rows_read <= 15000",
    "rows_read budget exceeded",
    "D1 MUTATION: ZERO",
    "R2 MUTATION: ZERO",
    "SCHEMA MIGRATION: NONE",
    "release467-build204-closure-",
    "actions/upload-artifact@v4",
):
    req(token in workflow,f"Build 204 exact-dev closure proof missing: {token}")
for retained in (
    "python scripts/release467_build203_gate.py",
    "python scripts/release467_build202_gate.py",
    "python scripts/release467_build199_gate.py",
    "python scripts/release467_build189_gate.py",
    "python scripts/release467_build194_gate.py",
    "python scripts/release467_build186_gate.py",
    "python scripts/release467_build77_gate.py",
):
    req(retained in workflow,f"Build 204 workflow missing retained gate: {retained}")
req("successor_roadmap" in b203,"Build 203 retained gate must recognize Build 204 successor")

for path in (
    "functions/api/admin/storefront-launch-set.js",
    "public/js/admin-storefront-launch-set-v204.js",
    "public/js/commerce-policy-core.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 204 STOREFRONT LAUNCH SET / AUTONOMOUS CLOSURE: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 204 STOREFRONT LAUNCH SET / AUTONOMOUS CLOSURE: PASS")
print("Launch set: READY / REVIEW_REQUIRED / EXTERNALLY_BLOCKED / EXPLAINABLE")
print("Publication: MANUAL ONLY / NO AUTO-PUBLISH")
print("Commerce: CANADA + CAD / U.S. SALES & SHIPPING DISABLED")
print("D1/R2/provider/payment/accounting mutation: NONE")
print("Future autonomous queue after Build 204: EXHAUSTED / NEW ROADMAP REQUIRED")

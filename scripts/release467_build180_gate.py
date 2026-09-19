#!/usr/bin/env python3
"""Release 467 Build 180 — staged runtime startup gate, successor-aware through Build 186."""
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="replace")
def req(ok,msg):
    if not ok: FAIL.append(msg)

product=read("public/js/product-detail-v166.js")
page=read("shop/product/index.html")
media=read("public/js/admin-media-content-studio.js")
studio=read("admin/media-content-studio/index.html")
inventory_ui=read("public/js/admin-inventory-integrity-review.js")
inventory=read("admin/inventory-operations/index.html")
css=read("css/release467-build179-runtime-recovery.css")
b166=read("scripts/release467_build166_gate.py")
b179=read("scripts/release467_build179_gate.py")
prov=read("scripts/current_system_gate_provenance_gate.py")
doc=read("docs/operations/RELEASE_467_BUILD_180_STAGED_RUNTIME_STARTUP.md")

req("Release 467 Build 180 successor" in product,"Product renderer missing Build 180 successor identity")
req("(()=>{" in product and "document.addEventListener('DOMContentLoaded'" not in product,"Product detail is not immediate body-end startup")
for token in ("AbortController","8000","/api/product-detail-core","DDProductDetailSnapshot","dd:product-detail-rendered"):
    req(token in product,f"Product detail lost bounded token: {token}")
req("MutationObserver" not in product and "setInterval(" not in product,"Product detail gained polling/observer behavior")
req(any(token in page for token in ('/public/js/product-detail-v166.js?v=180','/public/js/product-detail-v166.js?v=186')),"Product page Build 180/186 cache key missing")
req(min(pos for pos in (page.find('/public/js/product-detail-v166.js?v=180'),page.find('/public/js/product-detail-v166.js?v=186')) if pos >= 0) < page.find('/public/js/site-auth-ui.js'),"Product detail does not start before optional storefront helpers")

for token in ("imagePlanVisible:40","scheduleVisualPlan","requestIdleCallback","state.imagePlanVisible+=40","Staging image-plan status after the primary editor paint"):
    req(token in media,f"Media Studio staged-start token missing: {token}")
req("await choosePage(target,{slotKey:slot,replaceHistory:false});scheduleVisualPlan();" in media,"Media Studio does not paint selected page before scheduling image plan")
req("Release 467 Build 180" in studio and any(token in studio for token in ("/public/js/admin-media-content-studio.js?v=180","/public/js/admin-media-content-studio.js?v=194","/public/js/admin-media-content-studio.js?v=467b195","/public/js/admin-media-content-studio.js?v=467b196","/public/js/admin-media-content-studio.js?v=467b197")),"Media Studio Build 180/successor page-cache identity missing")

for token in ("inventoryIntegrityLoad","Load 40-item queue","paused during page startup","state.loaded = true","Release 467 Build 180 · staged Inventory truth &amp; usage"):
    req(token in inventory_ui,f"Inventory staged queue token missing: {token}")
req("dd:admin-ready" not in inventory_ui and "if (window.DDAuth?.isLoggedIn()) start();" not in inventory_ui,"Inventory attention queue still auto-starts")
req("/public/js/admin-inventory-integrity-review.js?v=180" in inventory and "release467-build179-runtime-recovery.css?v=180" in inventory and any(token in inventory for token in ("Release 467 Build 180","Release 467 Build 183","Release 467 Build 185","Release 467 Build 189")),"Inventory Operations Build 180/183/185 page/cache identity missing")
for token in ("content-visibility:auto","contain-intrinsic-size:auto 520px","contain-intrinsic-size:auto 720px"):
    req(token in css,f"Inventory staged-paint CSS missing: {token}")

for body,label in ((b166,"Build 166"),(b179,"Build 179"),(prov,"current provenance")):
    req("product-detail-v166.js?v=180" in body,f"{label} is not successor-aware for Product v180")

for token in ("code-only runtime/presentation build","no migration","R2 mutation","provider execution","payment/refund","accounting posting"):
    req(token.lower() in doc.lower(),f"Build 180 safety document missing: {token}")

if FAIL:
    print("RELEASE 467 BUILD 180 STAGED RUNTIME STARTUP: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 180 STAGED RUNTIME STARTUP: PASS")
print("Product detail: immediate body-end bounded read / optional helpers later")
print("Media Studio: primary editor first / idle D1 image plan / 40-row DOM batches")
print("Inventory Operations: explicit 40-row queue / browser-native below-fold paint staging")
print("Schema/D1/R2/provider/payment/accounting mutation: NONE")

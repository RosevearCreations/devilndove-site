#!/usr/bin/env python3
"""Release 467 Build 198 — Product image fidelity, actionable attention & shared help gate."""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

def read(path):
    p = ROOT / path
    if not p.is_file():
        FAIL.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="replace")

def req(ok, msg):
    if not ok:
        FAIL.append(msg)

def node(path):
    p = subprocess.run(
        ["node", "--check", str(ROOT / path)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    req(p.returncode == 0, f"JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1800:]}")

discovery = read("css/storefront-discovery.css")
styles = read("css/styles.css")
media_page = read("admin/catalog-media/index.html")
media_js = read("public/js/admin-product-media-editor-v172.js")
incidents = read("public/js/admin-runtime-incidents.js")
help_js = read("public/js/admin-context-help.js")
help_css = read("css/admin-context-help.css")
auth_ui = read("public/js/site-auth-ui.js")
middleware = read("functions/_middleware.js")
public_help = read("help/index.html")
admin_help = read("admin/help/index.html")
help_gate = read("scripts/current_help_hygiene_gate.py")
roadmap = read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
doc = read("docs/operations/RELEASE_467_BUILD_198_PRODUCT_IMAGE_FIDELITY_ATTENTION_SHARED_HELP.md")
b197 = read("scripts/release467_build197_gate.py")

# Product image fidelity: public Product surfaces contain the entire uploaded image.
for selector in (
    ".shop-card-main-image img",
    ".shop-card-thumb img",
    ".product-detail-main-image img",
    ".product-detail-thumb img",
):
    req(selector in styles, f"Product full-image successor selector missing from styles: {selector}")
req("object-fit:contain!important" in styles, "Product full-image successor override must use contain")
req('body[data-storefront-discovery-runtime="455"] .shop-card-main-image img' in discovery, "Storefront primary Product selector missing")
req('body[data-storefront-discovery-runtime="455"] .shop-card-thumb img' in discovery, "Storefront Product thumbnail selector missing")
req('body[data-storefront-discovery-runtime="455"] .product-detail-thumb img' in discovery, "Product detail thumbnail selector missing")
req(discovery.count("object-fit:contain") >= 2, "Storefront Product media must explicitly use contain")
req(".storefront-collage-item img" in discovery and "object-fit:cover" in discovery, "Collection/collage cover presentation should remain separate from Product media")
req("STOREFRONT_DISCOVERY_REVISION = '467b198-product-image-fidelity'" in middleware, "Storefront Build 198 cache revision missing")
req("storefront-discovery.css?v=${STOREFRONT_DISCOVERY_REVISION}" in middleware, "Storefront CSS must use Build 198 asset revision")

# Product Media editor keeps full image visible and makes crop/focal work explicit.
req(".dd-media-edit-card img{width:100%;aspect-ratio:4/3;object-fit:contain" in media_page, "Product Media gallery preview still crops images")
for token in (
    'value="original">Keep original',
    'data-context-help="crop_resize"',
    'productMediaV198FocalPreview',
    'productMediaV198FocalDot',
    'data-context-help="focal_point"',
    'data-context-help="image_score"',
    'admin-product-media-editor-v172.js?v=467b198',
):
    req(token in media_page, f"Product Media Build 198 UI contract missing: {token}")
for token in (
    "function updateFocalPreview()",
    "productMediaV198FocalPreview",
    "focal_point_x",
    "focal_point_y",
    "storefront still shows the full uploaded image unless you explicitly create a cropped file",
):
    req(token in media_js, f"Product Media focal/full-image behavior missing: {token}")
req("cropForPreset" in media_js and "preset==='square_1200'" in media_js and "preset==='landscape_1600'" in media_js, "Explicit crop presets were lost")
req("preset!=='original'" in media_js, "Keep-original path must remain non-destructive")

# Today Needs Attention: immediate what/where/age/owner evidence from existing payload.
for token in (
    "function ownerFor(row)",
    "function breachLabel(key,count)",
    "function attentionCards(incidents)",
    "<strong>What:</strong>",
    "<strong>Where:</strong>",
    "<strong>Age:</strong>",
    "Open ${esc(owner.area)}",
    "data-context-help=\"today_attention\"",
    "data-context-help=\"recurring_incidents\"",
    "dd:admin-context-help-refresh",
):
    req(token in incidents, f"Actionable Today Needs Attention contract missing: {token}")
for href in (
    "/admin/media-content-studio/",
    "/admin/products/",
    "/admin/inventory-operations/",
    "/admin/orders/",
    "/admin/it-integrations/",
    "/admin/accounting/",
    "/admin/users/",
    "/admin/it/",
):
    req(href in incidents, f"Runtime incident owner routing missing: {href}")
req("Safe recheck" in incidents and "data-safe-recheck" in incidents, "Existing safe-recheck action must remain available")
req("Resolve selected" in incidents and "Ignore selected" in incidents, "Existing explicit review-state controls must remain intact")

# One shared accessible contextual-help layer across public, creator and Admin.
for key in (
    "product_media:",
    "product_image_fit:",
    "crop_resize:",
    "focal_point:",
    "today_attention:",
    "runtime_incident:",
    "shop_by_intent:",
    "advanced_product_search:",
    "media_studio:",
    "content_studio:",
    "creative_project:",
    "packaging_studio:",
):
    req(key in help_js, f"Shared contextual help missing definition: {key}")
for route in (
    "/shop/",
    "/shop/product/",
    "/admin/catalog-media/",
    "/admin/operations/",
    "/admin/media-content-studio/",
    "/admin/content-studio/",
    "/admin/creative-automation/",
    "/admin/packaging-studio/",
):
    req(route in help_js, f"Shared contextual help route missing: {route}")
for token in (
    "trigger.textContent = 'ⓘ'",
    "aria-controls",
    "aria-expanded",
    "event.key === 'Escape'",
    "ensureHelpCentreLauncher",
    "data-dd-help-centre-launcher",
):
    req(token in help_js, f"Accessible shared help behavior missing: {token}")
req(("ⓘ Help" in help_js) or ("ⓘ Customer Help" in help_js and "ⓘ Creator Help" in help_js), "Accessible shared help launcher text missing")
req("fetch(" not in help_js and "apiFetch" not in help_js, "Contextual help must remain client-only/no API")
req("<h1" not in help_js.lower(), "Contextual help client must never create an H1")
req("if (!normalizedPath().startsWith('/admin/') || window.DDAdminLeanStartup?.enabled) return;" in help_js, "Public/lean help must not start the broad document observer")
req("AUTO_OBSERVER_MAX_MS = 8000" in help_js, "Retained bounded Admin observer contract missing")
req(".dd-context-help-centre" in help_css, "Floating Help Centre styling missing")
req(("/public/js/admin-context-help.js?v=467b198-shared-help" in auth_ui) or ("/public/js/admin-context-help.js?v=467b233-universal-help" in auth_ui), "Admin/creator shared help bootstrap revision missing")
help_bootstrap = "/public/js/admin-context-help.js?v=467b233-universal-help" if "/public/js/admin-context-help.js?v=467b233-universal-help" in auth_ui else "/public/js/admin-context-help.js?v=467b198-shared-help"
req(auth_ui.index(help_bootstrap) < auth_ui.index("if (!leanStartup)"), "Shared Admin help must load even on lean workspaces")
req('data-dd-context-help-style="true"' in middleware and ("/public/js/admin-context-help.js?v=467b198-shared-help" in middleware or "/public/js/admin-context-help.js?v=467b233-universal-help" in middleware), "Public middleware shared help injection missing")

# Help centres.
for path, body, public in (
    ("help/index.html", public_help, True),
    ("admin/help/index.html", admin_help, False),
):
    req(len(re.findall(r"<h1(?:\s|>)", body, re.I)) == 1, f"{path} must contain exactly one H1")
    req("ⓘ" in body, f"{path} must explain contextual help")
    if public:
        req("index,follow" in body.lower(), "Public Help Centre should be indexable")
        for topic in ("Shopping", "Product images", "Wishlist", "Using contextual help"):
            req(topic.lower() in body.lower(), f"Public Help Centre missing topic: {topic}")
        req(("creators" in body.lower()) or ("custom requests" in body.lower()), "Public Help Centre must retain Build 198 creator-era coverage or the Build 233 customer custom-request successor")
    else:
        req("noindex,nofollow" in body.lower(), "Admin Help Centre must remain noindex")
        for topic in ("Product images", "Today Needs Attention", "contextual help"):
            req(topic.lower() in body.lower(), f"Admin Help Centre missing topic: {topic}")
req("public_help=read('help/index.html')" in help_gate, "Current help hygiene gate must cover public Help Centre")

# Architecture/safety/roadmap.
for token in (
    "complete uploaded image",
    "object-fit: contain",
    "What",
    "Where",
    "Owner",
    "client-only",
    "No schema migration",
    "zero-D1 migration path",
    "Build 199",
):
    req(token.lower() in doc.lower(), f"Build 198 operations contract missing: {token}")
legacy_roadmap=all(token in roadmap for token in (
    "Build 197 — complete",
    "Build 198 — current",
    "Build 199 — next after Build 198 is fully GREEN",
    "**204** | Storefront Launch Set & Autonomous Closure",
))
active_successor_match=re.search(r"\*\*Build (\d+) — current(?: and final planned build)?\*\*",roadmap)
active_successor_build=int(active_successor_match.group(1)) if active_successor_match else 0
successor_roadmap=("Build 198 — complete" in roadmap and active_successor_build >= 199 and "**204** | Storefront Launch Set & Autonomous Closure" in roadmap)
req(legacy_roadmap or successor_roadmap,"Build 198 roadmap checkpoint must be current or explicitly closed by Build 199 or later successors")
req("successor_roadmap" in b197, "Build 197 retained gate must recognize Build 198")

# Syntax and retained help hygiene.
for path in (
    "public/js/admin-product-media-editor-v172.js",
    "public/js/admin-runtime-incidents.js",
    "public/js/admin-context-help.js",
    "public/js/site-auth-ui.js",
    "functions/_middleware.js",
):
    node(path)
p = subprocess.run([sys.executable, str(ROOT / "scripts/current_help_hygiene_gate.py")], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
req(p.returncode == 0, f"Current help hygiene failed: {(p.stdout + p.stderr)[-1800:]}")
if FAIL:
    print("RELEASE 467 BUILD 198 IMAGE FIDELITY / ATTENTION / SHARED HELP: FAIL")
    for item in FAIL:
        print("-", item)
    sys.exit(1)

print("RELEASE 467 BUILD 198 IMAGE FIDELITY / ATTENTION / SHARED HELP: PASS")
print("Product Storefront image default: FULL UPLOAD / CONTAIN")
print("Crop / resize: EXPLICIT PRODUCT MEDIA ACTION")
print("Today Needs Attention: WHAT + WHERE + AGE + OWNER")
print("Shared contextual help: PUBLIC + CREATOR + ADMIN / CLIENT-ONLY")
print("Automatic D1/R2/provider mutation from help: ZERO")

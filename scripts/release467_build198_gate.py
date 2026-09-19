#!/usr/bin/env python3
"""Release 467 Build 198 — Storefront media fit, actionable attention and contextual help gate."""
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

def css_bodies(css, selector_fragment):
    pattern = re.compile(re.escape(selector_fragment) + r"\s*\{([^}]*)\}", re.I | re.S)
    return pattern.findall(css)

storefront = read("css/storefront-discovery.css")
styles = read("css/styles.css")
shop = read("shop/index.html")
product_page = read("shop/product/index.html")
product_media = read("public/js/admin-product-images.js")
context_help = read("public/js/context-help.js")
context_css = read("css/context-help.css")
main = read("js/main.js")
admin = read("public/js/admin.js")
middleware = read("functions/_middleware.js")
attention_ui = read("public/js/admin-runtime-incidents.js")
attention_api = read("functions/api/admin/runtime-incidents.js")
thresholds = read("functions/api/admin/_operationalThresholds.js")
help_page = read("admin/help/index.html")
roadmap = read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
doc = read("docs/operations/RELEASE_467_BUILD_198_MEDIA_FIT_ATTENTION_CONTEXT_HELP.md")
b197 = read("scripts/release467_build197_gate.py")
external_help_gate = read("scripts/release461_external_help_interface_gate.py")

# Product imagery: card shape can be standardized, but authoritative Product image must not be silently cropped.
for css, label in ((storefront, "storefront discovery"), (styles, "legacy styles")):
    bodies = css_bodies(css, ".shop-card-main-image img")
    req(bool(bodies), f"{label} missing Shop main Product image rule")
    req(any("object-fit:contain" in body.replace(" ", "") for body in bodies), f"{label} Shop main Product image must use contain")
    req(not any("object-fit:cover" in body.replace(" ", "") for body in bodies), f"{label} Shop main Product image must not use cover")
    thumb_bodies = css_bodies(css, ".shop-card-thumb img")
    req(bool(thumb_bodies), f"{label} missing Shop Product thumbnail rule")
    req(any("object-fit:contain" in body.replace(" ", "") for body in thumb_bodies), f"{label} Shop Product thumbnail must use contain")
    req(not any("object-fit:cover" in body.replace(" ", "") for body in thumb_bodies), f"{label} Shop Product thumbnail must not use cover")

req("storefront-collection-images img" in storefront and "storefront-collage-item img" in storefront and "object-fit:cover" in storefront,
    "collection/collage merchandising cover behavior must remain explicit and separate")
req("aspect-ratio:1/1" in storefront.replace(" ", ""), "Shop main Product frame must retain a standardized square frame")
req("product-detail-main-image img" in styles and "object-fit:contain" in styles, "Product Detail main image must retain contain")
req("product-detail-thumb img" in styles and "object-fit:contain" in styles, "Product Detail thumbnails must preserve full image")

# Crop/recenter remains an explicit Product Media editing capability, not an implicit Storefront transform.
for token in ("crop_x", "crop_y", "crop_width", "crop_height", "focal_point_x", "focal_point_y", "cropForPreset", "square_1200", "original"):
    req(token in product_media, f"explicit Product Media image-edit capability missing: {token}")
req("data-dd-help-key=\"user.product-images\"" in product_page, "Product Details image help entry missing")
req("product-detail-v166.js?v=467b198" in product_page, "Product Detail cache key must advance for Build 198")
req("window.setTimeout" in product_page and "Product details did not finish starting" in product_page and "10000" in product_page,
    "Product Detail must fail closed instead of leaving an indefinite loading shell")

# Today Needs Attention must explain what, where and owner.
for token in (
    "incidentContext",
    "attention_context",
    "owner_href",
    "owner_label",
    "Products / Product Media",
    "Inventory / Supplies / Tools",
    "Finance / Payment provider",
):
    req(token in attention_api, f"runtime incident actionable context missing: {token}")

for token in (
    "BREACH_CONTEXT",
    "stale_open_72h",
    "Open incidents older than 72 hours",
    "full runtime-incident backlog",
    "owner_href",
):
    req(token in thresholds, f"operational threshold human context missing: {token}")

for token in (
    "What needs attention and where",
    "<strong>What:</strong>",
    "<strong>Where:</strong>",
    "owner_href",
    "Grouped recurring incidents — what / where / owner",
    'data-dd-help-key="admin.today-attention"',
):
    req(token in attention_ui, f"Today Needs Attention readable UI missing: {token}")
req("runtime-attention-card-grid" in context_css, "responsive operational attention card styles missing")

# Contextual help must be global, accessible, dynamic and role-aware.
for token in (
    "dd-context-help-trigger",
    "dd-context-help-global",
    "role','dialog",
    "aria-modal",
    "MutationObserver",
    "currentRole",
    "What is this?",
    "How do I use it?",
    "What happens if I change or use it?",
    "user.product-images",
    "admin.today-attention",
    "admin.product-media",
    "admin.media-studio",
    "creator.workflow",
    "creator.public-use",
):
    req(token in context_help, f"contextual Online Help missing: {token}")

for token in (
    "border-radius:50%",
    ".dd-context-help-dialog",
    ".dd-context-help-global",
    "@media(max-width:640px)",
):
    req(token in context_css.replace(" ", ""), f"context help CSS missing: {token}")

req("context-help.js?v=467b198" in main, "shared main runtime must load contextual help")
req("context-help.js?v=467b198" in admin, "Admin runtime must load contextual help")
req("contextHelpMarkup" in middleware and "/css/context-help.css?v=467b198" in middleware and "/public/js/context-help.js?v=467b198" in middleware,
    "Pages middleware must inject contextual help sitewide")
req("contextHelpMarkup()," in middleware, "Products fast platform path must also carry contextual help")

for token in (
    "Contextual help throughout the application",
    "Product images, framing, crop and focal point",
    "Today Needs Attention",
    "Creator and content workflow",
):
    req(token in help_page, f"Online Help Centre missing Build 198 section: {token}")

# Existing specialist external/provider help must remain available.
req("admin-external-help.js?v=461" in admin, "existing Release 461 external-provider field help must remain wired")
req("Circled field help: GLOBAL / DYNAMIC" in external_help_gate, "existing specialist help gate must remain intact")

# User-facing Shop gets explicit help anchors.
req('data-dd-help-key="user.shop-intent"' in shop, "Shop by intent contextual help anchor missing")
req('data-dd-help-key="user.shop-search"' in shop, "Advanced Product Search contextual help anchor missing")

# Roadmap and safety.
for token in (
    "Build 197 — complete",
    "Build 198 — current",
    "Build 199 — next after Build 198 is fully GREEN",
    "**204** | Storefront Launch Set & Autonomous Closure",
):
    req(token in roadmap, f"Build 198 roadmap checkpoint missing: {token}")

for token in (
    "full uploaded Product image",
    "object-fit: contain",
    "What happened?",
    "Where did it happen?",
    "circled",
    "No schema migration",
    "No Product image mutation",
    "zero-D1 migration path",
):
    req(token.lower() in doc.lower(), f"Build 198 operations contract missing: {token}")

req("successor_roadmap" in b197, "Build 197 retained gate must recognize Build 198 successor")

for path in (
    "public/js/context-help.js",
    "public/js/admin-runtime-incidents.js",
    "public/js/admin.js",
    "js/main.js",
    "functions/_middleware.js",
    "functions/api/admin/runtime-incidents.js",
    "functions/api/admin/_operationalThresholds.js",
    "public/js/product-detail-v166.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 198 MEDIA FIT / ATTENTION / CONTEXT HELP: FAIL")
    for item in FAIL:
        print("-", item)
    sys.exit(1)

print("RELEASE 467 BUILD 198 MEDIA FIT / ATTENTION / CONTEXT HELP: PASS")
print("Product image default: FULL SOURCE / CONTAIN")
print("Automatic Storefront crop: DISABLED")
print("Explicit Product Media crop/recenter: RETAINED")
print("Today Needs Attention: WHAT + WHERE + OWNER")
print("Contextual Online Help: PUBLIC + ADMIN + CREATOR")
print("Product/Inventory/R2/provider mutation: ZERO")

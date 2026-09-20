#!/usr/bin/env python3
"""Release 467 Build 195 — sitewide Media Studio runtime + carousel recovery gate."""
from pathlib import Path
import re, subprocess, sys

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
    req(p.returncode==0,f"JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1400:]}")

carousel=read("public/js/home-carousel.js")
runtime=read("public/js/media-content-runtime.js")
studio=read("public/js/admin-media-content-studio.js")
studio_page=read("admin/media-content-studio/index.html")
studio_api=read("functions/api/admin/media-content-studio.js")
manifest=read("functions/api/public-media-content-manifest.js")
home=read("index.html")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
doc=read("docs/operations/RELEASE_467_BUILD_195_SITEWIDE_MEDIA_STUDIO_RUNTIME_CAROUSEL_RECOVERY.md")
wf194=read(".github/workflows/release467-build194-d1-headroom-home-media.yml")

for token in ("waitForMediaStudioFallback","fallbackMarkup = mount.innerHTML","published-carousel","/api/home-carousel"):
    req(token in carousel,f"Home carousel corrective contract missing: {token}")
req("media-studio-override" not in carousel and "waitForMediaStudioHero" not in carousel,"Build 194 carousel-suppression regression still present")
wait_i=carousel.index("await waitForMediaStudioFallback")
fallback_i=carousel.index("fallbackMarkup = mount.innerHTML",wait_i)
fetch_i=carousel.index("fetch('/api/home-carousel'",fallback_i)
req(wait_i>=0 and fallback_i>wait_i and fetch_i>fallback_i,"Home fallback must be captured after Media Studio readiness and before carousel fetch")

for token in ("querySelectorAll('source')","setAttribute('srcset',url)","delete el.dataset.mediaPlaceholder","media-managed-placeholder","mediaPlaceholderCaption","[data-media-slot],[data-media-background-slot]","media-inline-background-edit"):
    req(token in runtime,f"sitewide media runtime recovery missing: {token}")
req("detail:{ok:true,...detail}" not in runtime,"Media readiness event must not force ok=true on errors")
for token in ("ok:false,applied:false,reason:'manifest_http_error'","ok:false,applied:false,reason:'manifest_exception'","ok:true,applied:true"):
    req(token in runtime,f"truthful runtime readiness state missing: {token}")

for token in ("slotSyncAttempted:new Set()","slotDefinitionDrift","reconcilePageSlots","action:'register_slots'","drift=expected.filter","Existing image assignments were preserved"):
    req(token in studio,f"Media Studio catalog reconciliation missing: {token}")
req(any(token in studio for token in ("v=467b195","v=467b197")),"Media Studio catalog cache key must retain Build 195 or advance to Build 197")
req("apply Build 259 migration" not in studio,"obsolete Build 259 manual-repair instruction remains")
for token in ("register_slots","ON CONFLICT(page_path,slot_key) DO UPDATE","slots:await pageSlots","Product, inventory, tools, supplies"):
    req(token in studio_api,f"bounded slot-registration/specialist boundary missing: {token}")
req("ma.product_id IS NULL" in studio_api and "BLOCKED_MEDIA_PREFIXES" in studio_api,"non-product Media Studio boundary drifted")

req("const refresh=normalizeText(url.searchParams.get('refresh'))" in manifest and '"Cache-Control":"no-store"' in manifest,"public manifest admin-refresh cache bypass missing")
req("media-content-runtime.js?v=467b195" in home and "home-carousel.js?v=467b195" in home,"Home Build 195 cache keys missing")
req(any(token in studio_page for token in ("admin-media-content-studio.js?v=467b195","admin-media-content-studio.js?v=467b196","admin-media-content-studio.js?v=467b197")),"Media Studio Build 195/successor cache key missing")
req(home.lower().count("<h1")==1,"Home must retain exactly one H1")
req(studio_page.lower().count("<h1")==1,"Media Studio must retain exactly one H1")

runtime_pages=[]
for p in ROOT.rglob("*.html"):
    if any(part in {".git","node_modules"} for part in p.parts): continue
    body=p.read_text(encoding="utf-8",errors="replace")
    if "media-content-runtime.js" in body:
        runtime_pages.append(str(p.relative_to(ROOT)).replace("\\","/"))
        req("media-content-runtime.js?v=467b195" in body,f"stale Media Studio runtime cache key: {p.relative_to(ROOT)}")
req(len(runtime_pages)>=30,f"expected broad static presentation runtime coverage, found only {len(runtime_pages)} pages")

managed_pages=[]
for p in ROOT.rglob("*.html"):
    body=p.read_text(encoding="utf-8",errors="replace")
    if "data-media-managed-page" in body:
        managed_pages.append(str(p.relative_to(ROOT)))
        req("media-content-runtime.js?v=467b195" in body,f"managed page missing corrected media runtime: {p.relative_to(ROOT)}")
req(len(managed_pages)>=24,f"expected sitewide managed-page coverage, found {len(managed_pages)}")

legacy_roadmap=all(token in roadmap for token in ("Build 194 — complete","Build 195 — current","Build 196 — next after Build 195 is fully GREEN","**201** | Storefront Launch Set & Autonomous Closure"))
successor_roadmap=all(token in roadmap for token in ("Build 194 — complete","Build 195 — complete","Build 196 — current","**202** | Storefront Launch Set & Autonomous Closure"))
later_successor_roadmap=all(token in roadmap for token in ("Build 195 — complete","Build 196 — complete","Build 197 — current","**203** | Storefront Launch Set & Autonomous Closure"))
latest_successor_roadmap=all(token in roadmap for token in ("Build 197 — complete","Build 198 — current","**204** | Storefront Launch Set & Autonomous Closure"))
active_successor_match=re.search(r"\*\*Build (\d+) — current(?: and final planned build)?\*\*",roadmap)
active_successor_build=int(active_successor_match.group(1)) if active_successor_match else 0
future_successor_roadmap=("Build 195 — complete" in roadmap and active_successor_build >= 199 and "**204** | Storefront Launch Set & Autonomous Closure" in roadmap)
req(legacy_roadmap or successor_roadmap or later_successor_roadmap or latest_successor_roadmap or future_successor_roadmap,"Build 195 roadmap checkpoint must be current or explicitly closed by later successors")
for token in ("responsive","placeholder","fallback image","slot definitions","zero-D1 migration path","No automatic R2"):
    req(token.lower() in doc.lower(),f"Build 195 operations contract missing: {token}")

req("contains(github.event.head_commit.message, 'Build 194')" in wf194,"completed Build 194 provider proof must be locked against successor-build D1 reruns")

for path in ("public/js/home-carousel.js","public/js/media-content-runtime.js","public/js/admin-media-content-studio.js","functions/api/public-media-content-manifest.js"):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 195 SITEWIDE MEDIA + CAROUSEL RECOVERY: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 195 SITEWIDE MEDIA + CAROUSEL RECOVERY: PASS")
print(f"Runtime cache coverage: {len(runtime_pages)} HTML pages")
print(f"Managed-page coverage: {len(managed_pages)} HTML pages")
print("Product/Inventory specialist-media scope: UNCHANGED")
print("Automatic R2 mutation: ZERO")

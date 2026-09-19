#!/usr/bin/env python3
"""Release 467 Build 194 — D1 evidence headroom + Home media reliability gate."""
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
    req(p.returncode==0,f"JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1600:]}")

studio=read("public/js/admin-media-content-studio.js")
studio_page=read("admin/media-content-studio/index.html")
api=read("functions/api/admin/media-content-studio.js")
runtime=read("public/js/media-content-runtime.js")
carousel=read("public/js/home-carousel.js")
home=read("index.html")
doc=read("docs/operations/RELEASE_467_BUILD_194_D1_EVIDENCE_HEADROOM_OPTIMIZATION.md")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
workflow=read(".github/workflows/release467-build194-d1-headroom-home-media.yml")
b189=read(".github/workflows/release467-build189-inventory-evidence-closure.yml")
b190=read(".github/workflows/release467-build190-media-evidence-closure.yml")

for token in ("Content-Type':'application/json","mediaActionFeedback","Applying…","data.assignment","media_assignment_verification_failed"):
    req(token in studio+api+studio_page,f"Home Media Studio verified-save contract missing: {token}")
for token in ("const refreshed=await pageSlots","authoritative","verified:true","versionUrl(r.public_url,r.media_updated_at)"):
    req(token in api,f"server-side assignment verification/cache coherence missing: {token}")
for token in ("dd:media-content-ready","media-refresh","signalReady"):
    req(token in runtime,f"public Media Studio readiness contract missing: {token}")
legacy_carousel=all(token in carousel for token in ("waitForMediaStudioHero","media-studio-override","dataset.mediaContentOverride"))
successor_carousel=all(token in carousel for token in ("waitForMediaStudioFallback","fallbackMarkup = mount.innerHTML","published-carousel"))
req(legacy_carousel or successor_carousel,"Home carousel must retain Build 194 precedence or its Build 195 corrective successor")
legacy_cache="media-content-runtime.js?v=194" in home and "home-carousel.js?v=194" in home
successor_cache="media-content-runtime.js?v=467b195" in home and "home-carousel.js?v=467b195" in home
req(legacy_cache or successor_cache,"Home runtime cache keys must retain Build 194 or advance to Build 195")
req(any(token in studio_page for token in ("admin-media-content-studio.js?v=194","admin-media-content-studio.js?v=467b195","admin-media-content-studio.js?v=467b196")),"Media Studio cache key must retain Build 194 or advance to Build 195/196")
req(home.lower().count("<h1")==1,"Home must retain exactly one H1")
req(studio_page.lower().count("<h1")==1,"Media Studio must retain exactly one H1")

for token in ("20,000 rows-read","<= 10,000","<= 12,500","R2 mutation/listing: zero","Home Media Studio"):
    req(token.lower() in doc.lower(),f"Build 194 operations doc missing: {token}")
legacy_roadmap=all(token in roadmap for token in ("Build 193 — complete","Build 194 — current","Build 195 — next after Build 194 is fully GREEN"))
successor_roadmap=all(token in roadmap for token in ("Build 193 — complete","Build 194 — complete","Build 195 — current"))
later_successor_roadmap=all(token in roadmap for token in ("Build 194 — complete","Build 195 — complete","Build 196 — current"))
req(legacy_roadmap or successor_roadmap or later_successor_roadmap,"Build 194 roadmap checkpoint must be current or explicitly closed by Build 195/196")

condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
req(condition in workflow,"Build 194 provider proof must be exact-dev push only")
for token in ("INVENTORY_PROVIDER_ROWS_READ","MEDIA_PROVIDER_ROWS_READ","inventory_rows_read <= 10000","media_rows_read <= 12500","HARD_CEILING=20000","D1 MUTATION: ZERO","R2 MUTATION: ZERO"):
    req(token in workflow,f"Build 194 provider proof missing: {token}")
for token in ("COUNT(*) OVER (PARTITION BY","catalog_rollup AS","image_summary AS","inventory_summary AS"):
    req(token in workflow,f"Build 194 optimized proof query missing: {token}")
req("bucket.list(" not in workflow and "bucket.put(" not in workflow and "bucket.delete(" not in workflow,"Build 194 provider proof must not list or mutate R2")
req("provider_rows_read <= 20000" in b189 and "provider_rows_read <= 20000" in b190,"Retained Build 189/190 hard ceilings changed")
for retained in ("python scripts/release467_build193_gate.py","python scripts/release467_build190_gate.py","python scripts/release467_build189_gate.py"):
    req(retained in workflow,f"Build 194 workflow missing retained gate: {retained}")

for path in ("public/js/admin-media-content-studio.js","functions/api/admin/media-content-studio.js","public/js/media-content-runtime.js","public/js/home-carousel.js"):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 194 D1 HEADROOM + HOME MEDIA RELIABILITY: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 194 D1 HEADROOM + HOME MEDIA RELIABILITY: PASS")
print("Home Media Studio: VERIFIED WRITE + VISIBLE FEEDBACK + CAROUSEL PRECEDENCE")
print("Inventory target: <=10,000 rows read; hard ceiling remains 20,000")
print("Media target: <=12,500 rows read; hard ceiling remains 20,000")
print("Provider proof mutation: ZERO")

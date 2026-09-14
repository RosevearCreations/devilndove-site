#!/usr/bin/env python3
"""Release 467 Build 152 — Site-wide Image Quality Scoring & Media QA gate."""
from pathlib import Path
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

scorer = read("public/js/image-quality-scorer-v152.js")
overlay = read("public/js/site-image-quality-overlay-v152.js")
runtime = read("public/js/media-content-runtime.js")
studio = read("admin/media-content-studio/index.html")
product = read("public/js/admin-product-image-quality-editor-bridge-v56.js")

req("Release 448 deterministic browser Canvas heuristic" in scorer, "shared scorer must retain Release 448 product-photo algorithm identity")
for token in (
    "lighting_score", "clarity_score", "background_score", "framing_score",
    "resolution_score", "color_balance_score", "artifact_score", "consistency_score",
):
    req(token in scorer and token in product, f"shared/product scoring parity token missing: {token}")
for token in (
    "Math.abs(metrics.mean-.56)*30", "(metrics.low_clip+metrics.high_clip)*80",
    "(metrics.sharpness-.025)*170", "Math.sqrt(metrics.border_variance)*55",
    "Math.abs(metrics.occupancy-.62)*22", "metrics.center_offset*7",
    "minDim>=1200?10:minDim>=900?8:minDim>=700?6:minDim>=500?4:2",
    "metrics.channel_spread*22", "metrics.block_boundary_energy-.11", "*18",
):
    req(token in scorer.replace(" ", ""), f"Build 152 scorer formula drift: {token}")
req("lighting_score:round(lighting)" in scorer.replace(" ", ""), "lighting score mapping missing")
req("clarity_score:round(clarity)" in scorer.replace(" ", ""), "clarity score mapping missing")
req("total_score:round(Object.values(scores).reduce((a,b)=>a+b,0))" in scorer.replace(" ", ""), "100-point total calculation missing")

req("#mediaSlotBoard img,#mediaLibraryGrid img,#mediaSelectedPreview" in overlay, "Media Studio images must receive scoring")
req("img[data-media-slot]" in overlay, "public editable image slots must receive scoring")
req("IntersectionObserver" in overlay, "site-wide scoring must remain lazy/visible-first for efficiency")
req("Placeholder / SVG" in overlay, "SVG placeholder handling missing")
req("Image score unavailable" in overlay, "scoring failure must surface an explicit unavailable state")
req("same Release 448 product-photo rubric" in overlay, "score UI must explain rubric parity")

for forbidden in ("method:'POST'", 'method:"POST"', "method:'PUT'", "method:'PATCH'", "method:'DELETE'", "apiFetch("):
    req(forbidden not in scorer and forbidden not in overlay, f"Build 152 scoring must remain read-only; forbidden token: {forbidden}")

req("loadImageQualityTools" in runtime, "public Media Content runtime must load quality tools only for admin edit mode")
req("if(enabled){buildEditLinks();loadImageQualityTools();}" in runtime.replace("\n", ""), "quality tools must be tied to enabled page edit mode")
req("image-quality-scorer-v152.js" in studio and "site-image-quality-overlay-v152.js" in studio, "Media Studio must load shared scoring assets")
req("Build 152 • Site-wide image quality" in studio, "Media Studio must identify the new advisory quality surface")
req("Scores are read-only guidance" in studio, "Media Studio must explain non-mutating score boundary")

if FAIL:
    print("RELEASE 467 BUILD 152 GATE: FAIL")
    for item in FAIL:
        print("-", item)
    sys.exit(1)

print("RELEASE 467 BUILD 152 GATE: PASS")
print("Rubric: Release 448 deterministic 100-point Canvas scoring")
print("Surfaces: Media Studio + public admin page-edit mode")
print("Behavior: lazy, advisory, read-only, no D1/R2/provider mutation")

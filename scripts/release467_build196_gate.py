#!/usr/bin/env python3
"""Release 467 Build 196 — Media Studio save-to-placement convergence gate."""
from pathlib import Path
import subprocess, sys

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
    req(p.returncode == 0, f"JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1500:]}")

studio = read("public/js/admin-media-content-studio.js")
page = read("admin/media-content-studio/index.html")
api = read("functions/api/admin/media-content-studio.js")
manifest = read("functions/api/public-media-content-manifest.js")
doc = read("docs/operations/RELEASE_467_BUILD_196_MEDIA_STUDIO_SAVE_PLACEMENT_CONVERGENCE.md")
roadmap = read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
b195 = read("scripts/release467_build195_gate.py")
home = read("index.html")
carousel = read("public/js/home-carousel.js")

for token in (
    "mediaPlacementTarget",
    "mediaMetadataFeedback",
    "mediaSaveAndUse",
    "Save details & use in this location",
    "Save details only (do not change page)",
):
    req(token in studio + page, f"explicit save/placement UI missing: {token}")

for token in (
    "metadataPayload",
    "saveMetadata({useHere=false}={})",
    "saveMetadata({useHere:true})",
    "assignMedia(Number(m.media_asset_id),{button})",
):
    req(token in studio, f"metadata-to-placement workflow missing: {token}")

req(
    "Saving image details only. The public page will not change." in studio,
    "metadata-only Save must state that page placement is unchanged",
)
req(
    "active_assignment_count" in studio and "!==1" in studio,
    "client must fail closed unless exactly one active placement is verified",
)
req(
    any(token in page for token in ("admin-media-content-studio.js?v=467b196","admin-media-content-studio.js?v=467b197")),
    "Media Studio cache key must retain Build 196 or advance to Build 197",
)

for token in (
    "WHERE media_content_slot_id=? AND active=1 ORDER BY media_content_assignment_id",
    "UPDATE media_content_assignments SET active=0",
    "activeRows.length!==1",
    "active_assignment_count:1",
    "previous_active_count:previousRows.length",
):
    req(token in api, f"single-authority assignment enforcement missing: {token}")

req(
    "WHERE media_content_slot_id=? AND active=1" in api,
    "assignment normalization must be bounded to one slot",
)
req(
    "media_asset_id:Number(row.media_asset_id)" in manifest,
    "public manifest must expose assignment media identity for diagnostics",
)

legacy_roadmap=all(token in roadmap for token in ("Build 195 — complete","Build 196 — current","Build 197 — next after Build 196 is fully GREEN","**202** | Storefront Launch Set & Autonomous Closure"))
successor_roadmap=all(token in roadmap for token in ("Build 196 — complete","Build 197 — current","Build 198 — next after Build 197 is fully GREEN","**203** | Storefront Launch Set & Autonomous Closure"))
later_successor_roadmap=all(token in roadmap for token in ("Build 197 — complete","Build 198 — current","Build 199 — next after Build 198 is fully GREEN","**204** | Storefront Launch Set & Autonomous Closure"))
req(legacy_roadmap or successor_roadmap or later_successor_roadmap,"Build 196 roadmap checkpoint must be current or explicitly closed by later successors")

for token in (
    "metadata",
    "exactly one active assignment",
    "Product, Inventory, Supplies and Tools",
    "No schema migration",
    "zero-D1 migration path",
):
    req(token.lower() in doc.lower(), f"Build 196 operations contract missing: {token}")

req(
    "media-content-runtime.js?v=467b195" in home,
    "Build 195 public runtime recovery must remain intact",
)
req(
    "waitForMediaStudioFallback" in carousel,
    "Build 195 carousel fallback recovery must remain intact",
)
req(
    "successor_roadmap" in b195,
    "Build 195 retained gate must recognize successor roadmap",
)

for path in (
    "public/js/admin-media-content-studio.js",
    "functions/api/admin/media-content-studio.js",
    "functions/api/public-media-content-manifest.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 196 MEDIA STUDIO SAVE/PLACEMENT: FAIL")
    for item in FAIL:
        print("-", item)
    sys.exit(1)

print("RELEASE 467 BUILD 196 MEDIA STUDIO SAVE/PLACEMENT: PASS")
print("Primary Save with open slot: METADATA + EXPLICIT PLACEMENT")
print("Metadata-only Save: PAGE UNCHANGED, EXPLICITLY LABELED")
print("Active assignment authority: EXACTLY ONE PER EXPLICIT SLOT")
print("Product/Inventory specialist media: UNCHANGED")

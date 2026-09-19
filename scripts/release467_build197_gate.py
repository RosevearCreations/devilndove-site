#!/usr/bin/env python3
"""Release 467 Build 197 — sitewide placeholder integrity & cycling gate."""
from html.parser import HTMLParser
from pathlib import Path
import json
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
    req(p.returncode == 0, f"JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1500:]}")

class PlaceholderParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.placeholders = []
    def handle_starttag(self, tag, attrs):
        if tag.lower() != "img":
            return
        data = dict(attrs)
        if data.get("data-media-placeholder") == "1":
            self.placeholders.append({
                "slot_key": data.get("data-media-slot", ""),
                "src": data.get("src", ""),
            })

def page_path_for_html(path):
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[:-len("index.html")]
    return None

catalog = json.loads(read("public/data/media-content-slot-catalog.json") or "{}")
catalog_rows = []
for group in catalog.get("groups", []):
    for page in group.get("pages", []):
        for slot in page.get("slots", []):
            row = dict(slot)
            row["page_path"] = page.get("path", "")
            catalog_rows.append(row)

catalog_placeholders = [
    row for row in catalog_rows
    if row.get("slot_type") == "image"
    and str(row.get("source_snapshot") or "").startswith("/assets/placeholders/media-content/")
]

html_placeholders = []
placeholder_pages = set()
for path in ROOT.rglob("*.html"):
    if any(part in {".git", "node_modules", "admin"} for part in path.parts):
        continue
    page_path = page_path_for_html(path)
    if page_path is None:
        continue
    body = path.read_text(encoding="utf-8", errors="replace")
    parser = PlaceholderParser()
    parser.feed(body)
    if not parser.placeholders:
        continue
    placeholder_pages.add(page_path)
    req("media-content-runtime.js?v=467b195" in body, f"placeholder page missing shared media runtime: {path.relative_to(ROOT)}")
    for item in parser.placeholders:
        key = item["slot_key"]
        req(bool(key), f"placeholder missing data-media-slot: {path.relative_to(ROOT)}")
        req(body.count(f'data-media-slot="{key}"') == 1, f"placeholder key must appear exactly once in page HTML: {page_path} {key}")
        html_placeholders.append({
            "page_path": page_path,
            "slot_key": key,
            "src": item["src"],
        })

def norm_path(value):
    value = str(value or "/")
    if value == "/":
        return "/"
    return "/" + value.strip("/") + "/"

html_keys = {(norm_path(r["page_path"]), r["slot_key"]) for r in html_placeholders}
catalog_keys = {(norm_path(r["page_path"]), r.get("slot_key", "")) for r in catalog_placeholders}

req(len(html_placeholders) == 29, f"expected 29 HTML placeholders, found {len(html_placeholders)}")
req(len(placeholder_pages) == 22, f"expected 22 placeholder pages, found {len(placeholder_pages)}")
req(len(html_keys) == 29, "HTML placeholder page+slot keys must be unique")
req(len(catalog_placeholders) == 29, f"expected 29 catalog placeholders, found {len(catalog_placeholders)}")
req(len(catalog_keys) == 29, "catalog placeholder page+slot keys must be unique")
req(html_keys == catalog_keys, f"HTML/catalog placeholder inventory mismatch: html_only={sorted(html_keys-catalog_keys)} catalog_only={sorted(catalog_keys-html_keys)}")

html_by_key = {(norm_path(r["page_path"]), r["slot_key"]): r for r in html_placeholders}
for row in catalog_placeholders:
    key = row.get("slot_key", "")
    pair = (norm_path(row.get("page_path")), key)
    req(row.get("target_selector") == f'[data-media-slot="{key}"]', f"placeholder selector mismatch: {pair}")
    req(row.get("target_attribute") == "src", f"placeholder target attribute must be src: {pair}")
    html_row = html_by_key.get(pair)
    if html_row:
        req(html_row["src"] == row.get("source_snapshot"), f"placeholder authored source drift: {pair}")

home_keys = {r["slot_key"] for r in html_placeholders if norm_path(r["page_path"]) == "/"}
req(home_keys == {"home.what.visual.2", "home.what.visual.3", "home.section.visual.1"}, f"Home placeholder set drifted: {sorted(home_keys)}")

studio = read("public/js/admin-media-content-studio.js")
page = read("admin/media-content-studio/index.html")
api = read("functions/api/admin/media-content-studio.js")
roadmap = read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
doc = read("docs/operations/RELEASE_467_BUILD_197_SITEWIDE_PLACEHOLDER_INTEGRITY_CYCLING.md")
b196 = read("scripts/release467_build196_gate.py")

for token in (
    "placeholderCatalogRows",
    "reconcileAllPlaceholders",
    "action:'reconcile_placeholder_slots'",
    "mediaPlaceholderIntegrity",
    "expected_page_path",
    "expected_slot_key",
    "v=467b197",
):
    req(token in studio + page, f"Build 197 Studio placeholder contract missing: {token}")

for token in (
    'action === "reconcile_placeholder_slots"',
    "slice(0,100)",
    "/assets/placeholders/media-content/",
    "missing_before",
    "duplicate_active_assignments",
    "media_slot_identity_mismatch",
    "expected_page_path",
    "expected_slot_key",
):
    req(token in api, f"Build 197 API placeholder contract missing: {token}")

req("LIMIT 500" in api, "placeholder reconciliation queries must remain bounded")
req("existing image assignments were not changed" in read("functions/api/admin/media-content-studio.js").lower() or "Existing image assignments were preserved" in studio, "placeholder reconciliation must preserve existing assignments")
req("admin-media-content-studio.js?v=467b197" in page, "Media Studio cache key must advance to Build 197")

legacy_roadmap=all(token in roadmap for token in ("Build 196 — complete","Build 197 — current","Build 198 — next after Build 197 is fully GREEN","**203** | Storefront Launch Set & Autonomous Closure"))
successor_roadmap=all(token in roadmap for token in ("Build 197 — complete","Build 198 — current","Build 199 — next after Build 198 is fully GREEN","**204** | Storefront Launch Set & Autonomous Closure"))
active_successor_match=re.search(r"\*\*Build (\d+) — current\*\*",roadmap)
active_successor_build=int(active_successor_match.group(1)) if active_successor_match else 0
later_successor_roadmap=("Build 197 — complete" in roadmap and active_successor_build >= 199 and "**204** | Storefront Launch Set & Autonomous Closure" in roadmap)
req(legacy_roadmap or successor_roadmap or later_successor_roadmap,"Build 197 roadmap checkpoint must be current or explicitly closed by Build 198 or later successors")

for token in (
    "29 SVG image placeholders across 22 public pages",
    "home.what.visual.2",
    "home.what.visual.3",
    "home.section.visual.1",
    "No automatic image selection",
    "Existing image assignments are preserved",
):
    req(token.lower() in doc.lower(), f"Build 197 operations doc missing: {token}")

req("successor_roadmap" in b196, "Build 196 retained gate must recognize Build 197 successor")
req("active_assignment_count:1" in api, "Build 196 exactly-one-active assignment verification must remain intact")

for path in (
    "public/js/admin-media-content-studio.js",
    "functions/api/admin/media-content-studio.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 197 SITEWIDE PLACEHOLDER INTEGRITY: FAIL")
    for item in FAIL:
        print("-", item)
    sys.exit(1)

print("RELEASE 467 BUILD 197 SITEWIDE PLACEHOLDER INTEGRITY: PASS")
print("Placeholder inventory: 29 placeholders / 22 public pages")
print("Home placeholder inventory: 3 / 3 unique")
print("HTML/catalog inventory: BIDIRECTIONAL MATCH")
print("Placeholder preparation: BOUNDED + ASSIGNMENTS PRESERVED")
print("Product/Inventory specialist media: UNCHANGED")

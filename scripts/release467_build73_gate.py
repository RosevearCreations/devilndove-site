#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 73 — Product Media / Photo Studio Convergence."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "bcbee233cce61087111129d7b5879f72f403bef9"
BASE_TREE = "83d75db08d7a766a076819ed217803318aa8bc0a"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def req(ok: bool, msg: str) -> None:
    if not ok:
        FAIL.append(msg)


def node_check(path: str) -> None:
    result = subprocess.run(
        ["node", "--check", str(ROOT / path)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()[-1800:]}")


def node_runtime(path: str) -> None:
    result = subprocess.run(
        ["node", str(ROOT / path)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.stdout.strip():
        print(result.stdout.strip())
    req(result.returncode == 0, f"Build 73 runtime acceptance failed: {(result.stderr or result.stdout).strip()[-2200:]}")


doc = read("docs/operations/RELEASE_467_BUILD_73_PRODUCT_MEDIA_PHOTO_STUDIO_CONVERGENCE.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
engine = read("functions/api/_lib/productMediaAuthority.js")
endpoint = read("functions/api/admin/product-media-authority.js")
client = read("public/js/admin-product-media-convergence.js")
page = read("admin/catalog-media/index.html")
budget = read("functions/api/_lib/d1ReadBudget.js")
current = read("scripts/current_system_gate_provenance_gate.py")
runtime = read("scripts/release467_build73_product_media_runtime_test.mjs")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 73 — Product Media / Photo Studio Convergence" in roadmap, "roadmap missing Build 73")
req("Build 74 — Storefront Product Experience" in roadmap, "roadmap missing Build 74")
req("Release 467 Build 73" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 73 operating document identity drifted")
for token in (
    "Product-owned Photo Studio authority",
    "`product_images` remains the canonical Product gallery",
    "Unused-media review is review-only",
    "safe_to_delete: false",
    "Social candidates are selection-only",
    "Every D1 read is selected-Product and bounded",
    "No new D1 migration is required",
    "Build 74 — Storefront Product Experience",
):
    req(token in doc, f"Build 73 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 73 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 73 must remain schema-neutral; unexpected canonical migration 0005 exists")

# Pure Product media convergence authority: deterministic evidence merge, no runtime side effects.
for token in (
    "PRODUCT_MEDIA_AUTHORITY_BUILD = 73",
    "PRODUCT_MEDIA_AUTHORITY_CONTRACT = 'product-owned-media-convergence'",
    "PRODUCT_MEDIA_MAX_GALLERY = 20",
    "PRODUCT_MEDIA_MAX_SUPPORT = 30",
    "PRODUCT_MEDIA_MIN_ALT = 12",
    "PRODUCT_MEDIA_MIN_SOCIAL_SCORE = 55",
    "product_images: 0",
    "media_assets: 1",
    "product_media_role_assignments: 2",
    "product_image_annotations: 3",
    "evidence_sources",
    "mergeEvidence",
    "has_canonical_gallery_reference",
    "has_r2_media_reference",
    "social_eligible",
    "unused_media_review",
    "safe_to_delete: false",
    "deletion_requires_specialist_review: true",
    "canonical_gallery_owner: 'product_images'",
    "social_selection: 'approved Product media only; selection does not publish'",
):
    req(token in engine, f"Build 73 convergence engine missing token: {token}")
for forbidden in (
    r"\bfetch\s*\(", r"\bXMLHttpRequest\b", r"\bdb\.prepare\s*\(", r"\bsetInterval\s*\(",
    r"\bsetTimeout\s*\(", r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b",
    r"stripe\.com", r"paypal\.com", r"pinterest\.com", r"instagram\.com",
):
    req(not re.search(forbidden, engine, re.I), f"Build 73 pure Product media authority gained forbidden runtime behavior: {forbidden}")

# Bounded selected-Product endpoint: read-only, no catalog scan, no R2/provider mutation.
for token in (
    "Release 467 Build 73",
    "buildReadBudgetHeaders('admin_product_media_authority'",
    "A valid product_id is required.",
    "FROM products WHERE product_id=? LIMIT 1",
    "FROM product_images WHERE product_id=?",
    "LIMIT 20",
    "FROM media_assets",
    "LIMIT 30",
    "FROM product_media_role_assignments",
    "FROM product_image_annotations",
    "FROM product_image_quality_reviews",
    "FROM product_image_quality_assessments",
    "read_only: true",
    "product_owned: true",
    "automatic_publish: false",
    "automatic_social_publish: false",
    "automatic_r2_copy: false",
    "automatic_r2_delete: false",
    "convergeProductMedia",
):
    req(token in endpoint, f"Build 73 read-only endpoint missing token: {token}")
for handler in ("onRequestPost", "onRequestPatch", "onRequestDelete", "onRequestPut"):
    req(f"export async function {handler}" not in endpoint, f"Build 73 Product media authority must not expose {handler}")
req(not re.search(r"\b(?:INSERT\s+INTO|UPDATE\s+[A-Za-z_][A-Za-z0-9_]*\s+SET|DELETE\s+FROM|REPLACE\s+INTO)\b", endpoint, re.I), "Build 73 Product media projection must not gain D1 mutation SQL")
req(not re.search(r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b", endpoint, re.I), "Build 73 Product media projection must not add runtime DDL")

# Focused Catalog Media UI: one selected Product projection above the established specialist editors.
for token in (
    "Product Media & Photo Studio",
    "productMediaConvergenceMount",
    "admin-product-media-convergence.js?v=467b73",
    "productMediaAdminMount",
    "productMediaRoleScoreMount",
):
    req(token in page, f"Build 73 Catalog Media page missing token: {token}")
for token in (
    "/api/admin/product-media-authority?product_id=",
    "Build 73 • Product Media / Photo Studio Convergence",
    "canonical gallery",
    "R2 linked",
    "Social-ready",
    "Unused-media review",
    "Review only:",
    "never publishes, copies or deletes R2 media",
    "DDProductMediaConvergence",
):
    req(token in client, f"Build 73 Photo Studio convergence UI missing token: {token}")
for forbidden in ("method: 'POST'", 'method: "POST"', "method: 'PATCH'", "method: 'DELETE'", "method: 'PUT'"):
    req(forbidden not in client, f"Build 73 convergence panel must remain read-only: found {forbidden}")

# Build 63 read-budget identity remains stable while Build 73 adds explicit selected-Product caps.
for token in (
    "D1_READ_BUDGET_VERSION = 'R467B63_V1'",
    "admin_product_media_authority",
    "route: '/api/admin/product-media-authority'",
    "contract: 'selected_product_media_convergence_only'",
    "product_images: 20",
    "media_assets: 30",
    "role_assignments: 20",
    "annotations: 30",
    "quality_reviews: 30",
    "quality_assessments: 30",
    "never performs blank catalog scans",
):
    req(token in budget, f"Build 73 D1 read-budget authority missing token: {token}")

# Pure runtime acceptance covers the high-value convergence and safety rules.
for token in (
    "duplicate R2/gallery evidence converges to one canonical Product image",
    "featured image query variants resolve back to the canonical gallery row",
    "annotation alt text and focal point enrich the canonical gallery owner",
    "buyer-facing role assignment enriches the existing gallery image without duplicating it",
    "approved social-use image with sufficient alt and quality becomes a social candidate",
    "consent-needed Product media remains fail-closed for public/social use",
    "linked R2 media outside gallery/roles is surfaced only as an unused-media review candidate",
    "unused-media review never changes Product or R2 ownership boundaries",
):
    req(token in runtime, f"Build 73 runtime acceptance missing token: {token}")

req("release467_build73_gate.py" in current and "Release 467 Build 73" in current, "Current System Gate does not chain Build 73")
req("release467_build72_gate.py" in current, "Build 72 carried-forward contract was lost")

for path in (
    "functions/api/_lib/productMediaAuthority.js",
    "functions/api/admin/product-media-authority.js",
    "functions/api/_lib/d1ReadBudget.js",
    "public/js/admin-product-media-convergence.js",
    "scripts/release467_build73_product_media_runtime_test.mjs",
):
    node_check(path)
node_runtime("scripts/release467_build73_product_media_runtime_test.mjs")

if FAIL:
    print("RELEASE 467 BUILD 73 PRODUCT MEDIA / PHOTO STUDIO CONVERGENCE: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 73 PRODUCT MEDIA / PHOTO STUDIO CONVERGENCE: PASS")
print("Canonical Product gallery: product_images / PRESERVED")
print("R2-linked media: SUPPORTING + RECOVERY EVIDENCE / NO SECOND GALLERY")
print("Roles + annotations + focal + alt + quality: CONVERGED")
print("Featured + SEO/social image: RESOLVED EXPLICITLY")
print("Social candidates: SELECTION ONLY / NO PROVIDER PUBLICATION")
print("Unused Product media: REVIEW ONLY / SAFE_TO_DELETE FALSE")
print("D1 reads: ONE SELECTED PRODUCT / BOUNDED")
print("D1 mutation / runtime DDL / R2 copy-delete / provider behavior added: NONE")
print("Canonical D1 migration authority: 0001-0004 / UNCHANGED")

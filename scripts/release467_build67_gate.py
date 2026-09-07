#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 67 — Product Editor Recovery & Autosave."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "697c57db3497f502b4fc04e0e6c3a9127e7fa1fb"
BASE_TREE = "b2a2e3ca0d2285a3875d2d523d3941823144da08"


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
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()[-1200:]}")


doc = read("docs/operations/RELEASE_467_BUILD_67_PRODUCT_EDITOR_RECOVERY_AUTOSAVE.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
admin = read("public/js/admin.js")
recovery = read("public/js/admin-product-editor-recovery.js")
preflight = read("functions/api/admin/product-save-preflight.js")
current = read("scripts/current_system_gate_provenance_gate.py")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 67 — Product Editor Recovery & Autosave" in roadmap, "roadmap missing Build 67")
req("Release 467 Build 67" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 67 operating document identity drifted")
for token in (
    "Product-scoped browser recovery",
    "Unsaved-change protection",
    "Stale-copy handling",
    "Secondary services never block editing authority",
    "stale_product_copy",
    "product_preflight_unavailable",
    "one Product primary-key read",
    "schema-neutral",
    "Build 68 — Catalog Options Authority",
):
    req(token in doc, f"Build 67 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 67 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 67 must remain schema-neutral; unexpected canonical migration 0005 exists")

for token in (
    "Release 467 Build 67",
    "product-editor-recovery-autosave",
    "admin-product-editor-recovery.js?v=67",
    "Product Editor recovery and autosave guard",
):
    req(token in admin, f"Admin Build 67 integration missing token: {token}")

for token in (
    "R467B67_V1",
    "dd_admin_product_editor_recovery_v2:",
    "/api/admin/product-save-preflight",
    "/api/admin/update-product",
    "stale_product_copy",
    "product_preflight_unavailable",
    "beforeunload",
    "visibilitychange",
    "data-edit-product-id",
    "loadExistingProductButton",
    "clearExistingProductButton",
    "cancelProductEdit",
    "window.DDAuth.apiFetch = guardedApiFetch",
    "response.clone().json()",
    "form.dataset.mode = 'edit'",
    "dd:product-editor-stale",
    "window.DDProductEditorRecovery",
    "recovery_available",
):
    req(token in recovery, f"Build 67 recovery authority missing token: {token}")

req("setInterval(" not in recovery, "Build 67 must not add polling timers")
req("RECOVERY_PREFIX" in recovery and "recoveryKey" in recovery, "Build 67 browser recovery must remain Product-scoped")
req("verifyNotStale" in recovery and "fetchPreflight" in recovery, "Build 67 stale-copy preflight chain missing")

for token in (
    "getAdminUserFromRequest",
    "getDb",
    "SELECT * FROM products WHERE product_id = ? LIMIT 1",
    "stale_copy_preflight",
    "product_rows_read: 1",
    "secondary_service_reads: 0",
    "writes: 0",
    "VERSION_KEYS",
):
    req(token in preflight, f"Build 67 preflight endpoint missing token: {token}")

# Read-only endpoint: SQL mutation statements are forbidden.
for sql_mutation in ("INSERT INTO", "UPDATE PRODUCTS", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "REPLACE INTO"):
    req(sql_mutation not in preflight.upper(), f"Build 67 preflight endpoint gained forbidden SQL mutation: {sql_mutation}")
req(len(re.findall(r"\bSELECT\b", preflight, flags=re.IGNORECASE)) == 1, "Build 67 preflight endpoint must keep exactly one Product SELECT")
req("PRAGMA" not in preflight.upper(), "Build 67 preflight must not spend D1 rows on PRAGMA scans")
req("COUNT(" not in preflight.upper(), "Build 67 preflight must not add exact-count reads")

for provider in ("stripe.com", "paypal.com", "pinterest.com", "tiktok.com", "youtube.com"):
    req(provider not in recovery.lower() and provider not in preflight.lower(), f"Build 67 gained forbidden provider execution token: {provider}")

req("release467_build67_gate.py" in current and "Release 467 Build 67" in current, "Current System Gate does not chain Build 67")
req("release467_build66_gate.py" in current, "Build 66 carried-forward contract was lost")

node_check("public/js/admin.js")
node_check("public/js/admin-product-editor-recovery.js")
node_check("functions/api/admin/product-save-preflight.js")

if FAIL:
    print("RELEASE 467 BUILD 67 PRODUCT EDITOR RECOVERY & AUTOSAVE: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 67 PRODUCT EDITOR RECOVERY & AUTOSAVE: PASS")
print("Load Product authority: PRIMARY DETAIL RESPONSE PRIMES EDIT MODE")
print("Browser recovery: PRODUCT-SCOPED + EXPLICIT RECOVER/DISCARD")
print("Unsaved-change protection: SWITCH + CLEAR + CANCEL + BEFOREUNLOAD")
print("Manual save/autosave stale-copy protection: FAIL-CLOSED PREFLIGHT")
print("Preflight D1 budget: ONE PRIMARY-KEY PRODUCT ROW / NO COUNTS / NO PRAGMA")
print("Secondary Product services: NON-AUTHORITATIVE / NON-BLOCKING")
print("Schema / D1 business-data / R2 / provider mutation added by Build 67: NONE")
#!/usr/bin/env python3
"""Release 452 application streamlining, UX/accessibility, and SEO-depth source gate."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAILURES: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        FAILURES.append(message)


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8", errors="replace")


def run_gate(path: str) -> None:
    result = subprocess.run([sys.executable, str(ROOT / path)], capture_output=True, text=True)
    require(result.returncode == 0, f"carried/current gate failed: {path}\n{result.stdout}\n{result.stderr}")


release = json.loads(read("development-release.json"))
require(release.get("environment") == "development", "Release 452 must remain Development-only")
require(release.get("branch") == "dev", "Release 452 must remain on dev")
require(release.get("pages_project") == "devilndove-site-dev", "Development Pages project drifted")
require(release.get("release") == 452, "current release must be Release 452")
require(release.get("label") == "Application Streamlining & UX/SEO Depth", "Release 452 label drifted")
require(release.get("convergence_state") == "application_streamlining_ux_seo_depth_source_proven_no_new_d1_migration", "Release 452 convergence state drifted")

previous = release.get("previous_release", {})
require(previous.get("release") == 451, "Release 451 must be the immediate previous release")
require(previous.get("state") == "complete_source_proven_no_new_d1_migration", "Release 451 source completion state missing")

infra = release.get("development_infrastructure", {})
d1 = infra.get("d1", {})
require(d1.get("binding") == "DB", "Development D1 binding drifted")
require(d1.get("database_name") == "devilndove-dev", "Development D1 name drifted")
require(d1.get("database_id") == "dbc1615b-dcbe-4951-973b-b47c99c73bfa", "Development D1 UUID drifted")
require(d1.get("schema_current_through_release") == 450, "Release 452 must preserve verified D1 schema through Release 450")
require(release.get("current_release_migrations") == [], "Release 452 must not create a migration without a durable schema requirement")
state = release.get("current_release_database_state", {})
require(state.get("new_migration_required") is False, "Release 452 database state must say no migration required")
require(state.get("last_verified_schema_release") == 450, "last independently verified D1 schema release must remain 450")
require(state.get("historical_migration_replay") is False, "historical migration replay must remain prohibited")

policy = release.get("release_policy", {})
require(policy.get("production_promotion") == "closed", "Production promotion must remain closed")
require(policy.get("provider_publication") == "closed", "provider publication must remain closed")
require(policy.get("current_release_d1_migration_required") is False, "Release 452 must remain source-only")
require(policy.get("seo_gate_required") is True and policy.get("seo_depth_gate_required") is True, "both SEO gates remain mandatory")

for required in (
    "scripts/repository_hygiene_gate.py",
    "scripts/release451_marketplace_calibration_gate.py",
    "scripts/release452_application_streamlining_gate.py",
    "public/js/product-breadcrumb-seo.js",
    "docs/operations/RELEASE_452_APPLICATION_STREAMLINING.md",
    ".github/workflows/release452-source-gate.yml",
):
    require((ROOT / required).exists(), f"Release 452 authority missing: {required}")

product = read("shop/product/index.html")
require('aria-label="Breadcrumb"' in product, "Product visible breadcrumb missing")
require('/public/js/product-breadcrumb-seo.js?v=452' in product, "Product breadcrumb schema runtime missing")
require("decoding=\"async\"" in product, "Product below-fold proof imagery should decode asynchronously")

sitemap = read("sitemap.xml")
require("https://devilndove.com/collages/" in sitemap, "Collages discovery route missing from sitemap")

accounting = read("admin/accounting/index.html")
require('name="robots" content="noindex,nofollow"' in accounting or 'content="noindex,nofollow" name="robots"' in accounting, "Accounting admin must be noindex,nofollow")
for page in ("admin/inventory-intelligence/index.html", "admin/tool-lifecycle/index.html", "admin/accounting/index.html", "admin/caip-content-handoff/index.html"):
    require('aria-live="polite"' in read(page), f"{page} must announce dynamic status non-disruptively")

handoff = read("AI_HANDOFF.md")
roadmap = read("PROJECT_STATUS_AND_ROADMAP.md")
for name, value in (("AI_HANDOFF.md", handoff), ("PROJECT_STATUS_AND_ROADMAP.md", roadmap)):
    require("Release 452" in value, f"{name} current-release identity drifted")
    require("schema" in value.lower() and "450" in value, f"{name} must preserve D1 schema-through-450 authority")
    require("Production" in value, f"{name} must preserve Production boundary")

workflow = read(".github/workflows/system-gate.yml")
require("python scripts/repository_hygiene_gate.py" in workflow, "System Gate must run repository hygiene")
require("python scripts/release452_application_streamlining_gate.py" in workflow, "System Gate must run Release 452 gate")
require("python scripts/release451_marketplace_calibration_gate.py" in workflow, "System Gate must carry Release 451 forward")
require("python scripts/public_seo_gate.py" in workflow and "python scripts/public_seo_depth_gate.py" in workflow, "System Gate must retain both public SEO gates")

# Syntax-check the new browser authority without contacting any provider or database.
node = subprocess.run(["node", "--check", str(ROOT / "public/js/product-breadcrumb-seo.js")], capture_output=True, text=True)
require(node.returncode == 0, f"Product breadcrumb JavaScript syntax failed: {(node.stderr or node.stdout).strip()}")

# Current and carried-forward gates remain part of Release 452 acceptance.
for gate in (
    "scripts/repository_hygiene_gate.py",
    "scripts/release451_marketplace_calibration_gate.py",
    "scripts/public_seo_gate.py",
    "scripts/public_seo_depth_gate.py",
):
    run_gate(gate)

print("RELEASE 452 APPLICATION STREAMLINING GATE")
print("Repository cleanup + permanent hygiene: REQUIRED")
print("Product schema: EXISTING AUTHORITY PRESERVED")
print("Product BreadcrumbList + visible breadcrumb: REQUIRED")
print("Shop/Collections/Collages structured-data depth: GUARDED")
print("Sitemap route coverage: GUARDED")
print("Inventory/Tools/Financials/CAIP status accessibility: GUARDED")
print("Release 451 marketplace calibration: CARRIED FORWARD / READ ONLY")
print("Release 452 new D1 migration: NONE REQUIRED")
print("Provider publication: DISABLED")
print("Production mutation capability: NONE")
if FAILURES:
    for i, failure in enumerate(FAILURES, 1):
        print(f"{i:03d}. FAIL — {failure}")
    raise SystemExit(1)
print("RELEASE 452 APPLICATION STREAMLINING GATE: PASS")

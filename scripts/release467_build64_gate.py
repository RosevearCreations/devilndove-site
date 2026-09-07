#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 64 — Admin Full-Authority Convergence."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "2e70dc5e3eb22eed19ad591cf3c25b480514311d"
BASE_TREE = "2a11582d835b5dd793ca980793e87f6cf1047685"


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
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()[-900:]}")


doc = read("docs/operations/RELEASE_467_BUILD_64_ADMIN_FULL_AUTHORITY_CONVERGENCE.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
matrix = read("functions/api/admin/admin-authority-matrix.js")
app_modules = read("functions/api/_lib/appModules.js")
routes = read("functions/api/_lib/appModuleRoutes.js")
root_helper = read("scripts/release467_root_admin_access.py")
current = read("scripts/current_system_gate_provenance_gate.py")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 64 — Admin Full-Authority Convergence" in roadmap, "roadmap missing Build 64")
req("Release 467 Build 64" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 64 operating document identity drifted")
for token in (
    "fail-closed permission matrix",
    "every enabled module",
    "all seven canonical shared-service contracts",
    "automatic repair: **OFF**",
    "D1 business-data mutation: **NONE**",
    "Build 65 — Admin Page Lazy Loading",
):
    req(token in doc, f"Build 64 operating document missing token: {token}")

# Canonical schema authority remains unchanged in this convergence build.
expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 64 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 64 must remain schema-neutral; unexpected canonical migration 0005 exists")

# Machine-readable matrix must be read-only, fail closed and cover modules + shared services.
for token in (
    "ADMIN_AUTHORITY_MATRIX_VERSION = 'R467B64_V1'",
    "EXPECTED_SHARED_SERVICE_COUNT = 7",
    "buildAdminAuthorityMatrix",
    "evaluateModuleAccess",
    "admin_role_full_access",
    "root_it_recovery_grant",
    "business_admin_role_manage",
    "it_role_derived_access_denied",
    "sharedServiceFullAccess",
    "authorityMatrix.healthy ? 200 : 503",
    "automatic_repair: false",
    "d1_mutation: false",
    "r2_mutation: false",
    "provider_execution: false",
):
    req(token in matrix, f"Admin authority matrix missing token: {token}")
req("export async function onRequestPost" not in matrix, "Admin authority matrix must not expose a POST handler")
req(".run()" not in matrix, "Admin authority matrix must not execute D1 mutation statements")
req(not re.search(r"\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b", matrix, re.I), "Admin authority matrix contains mutation/DDL SQL")

# Runtime authority must grant canonical administrators before explicit per-user rows are consulted.
evaluate_tail = app_modules.split("export function evaluateModuleAccess", 1)[-1]
admin_idx = evaluate_tail.find("admin_role_full_access")
explicit_idx = evaluate_tail.find("explicitUserAccessFor(user")
req(admin_idx >= 0, "Canonical admin runtime override is missing")
req(explicit_idx >= 0, "Explicit user access branch is missing")
req(admin_idx < explicit_idx, "Canonical admin runtime override must precede explicit user rows")
req("access_level: 'manage'" in evaluate_tail[: max(explicit_idx, 0)], "Canonical admin runtime override no longer grants manage")

# Root recovery baseline remains deliberate and Development-only.
for token in (
    "EXPECTED_DATABASE_NAME = 'devilndove-dev'",
    "BUSINESS_MODULES = ('storefront', 'creators', 'socials', 'financials')",
    "IT_MODULE = 'it-platform'",
    "root_admin_full_manage",
    "root_it_manage",
    "it_role_grants",
    "Production mutation capability: NONE",
    "--verify-only",
):
    req(token in root_helper, f"Root-admin Development proof missing token: {token}")
req("devilndove-prod" not in root_helper, "Root-admin helper gained a Production D1 target")
req(not re.search(r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER)\b", root_helper, re.I), "Root-admin helper contains schema DDL")

# Shared-service catalog remains the canonical seven-contract surface.
req(routes.count("path: '/api/admin/contracts/") == 7, "Shared-service contract catalog must contain exactly seven canonical contracts")
for path in (
    "/api/admin/contracts/catalog-read",
    "/api/admin/contracts/inventory-read",
    "/api/admin/contracts/inventory-cost",
    "/api/admin/contracts/inventory-post",
    "/api/admin/contracts/inventory-reverse",
    "/api/admin/contracts/accounting-read",
    "/api/admin/contracts/content-media",
):
    req(path in routes, f"Shared-service contract missing: {path}")

# Build 64 becomes a current reliability contract in the active System Gate chain.
req("release467_build64_gate.py" in current and "Release 467 Build 64" in current, "Current System Gate does not chain Build 64")

node_check("functions/api/admin/admin-authority-matrix.js")

if FAIL:
    print("RELEASE 467 BUILD 64 ADMIN FULL-AUTHORITY CONVERGENCE: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 64 ADMIN FULL-AUTHORITY CONVERGENCE: PASS")
print("Enabled module root-admin authority: MANAGE")
print("I.T. role-derived access: DENIED; root recovery grant: REQUIRED")
print("Shared-service permission matrix: 7 CONTRACTS")
print("Matrix failure behavior: FAIL CLOSED")
print("Automatic repair / schema / business-data / R2 / provider mutation: NONE")

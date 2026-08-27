#!/usr/bin/env python3
"""Build 440 guard: one current Development release, read-only CI, and current canonical docs."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
failures: list[str] = []

release_doc = json.loads((ROOT / "development-release.json").read_text(encoding="utf-8"))
release = int(release_doc.get("release") or 0)
if release != 440:
    failures.append(f"canonical Development release is {release}, expected 440")
if release_doc.get("environment") != "development":
    failures.append("canonical release environment must be development")
if release_doc.get("label") != f"Build {release}":
    failures.append("canonical release label does not match the release number")

workflow_dir = ROOT / ".github" / "workflows"
workflow_files = sorted(list(workflow_dir.glob("*.yml")) + list(workflow_dir.glob("*.yaml")))
if not workflow_files:
    failures.append("no active GitHub Actions workflow exists")
for workflow in workflow_files:
    text = workflow.read_text(encoding="utf-8")
    lowered = text.lower()
    if re.search(r"contents:\s*write", lowered):
        failures.append(f"{workflow.relative_to(ROOT)} grants contents: write")
    if re.search(r"\bgit\s+push\b", text):
        failures.append(f"{workflow.relative_to(ROOT)} contains a self-pushing git command")

transition_paths = (
    ROOT / ".github/workflows/build440-mobile-product-resource-authority-sync.yml",
    ROOT / "scripts/build440_sync_mobile_product_resource_authority.py",
)
for path in transition_paths:
    if path.exists():
        failures.append(f"retired one-time transition artifact still exists: {path.relative_to(ROOT)}")

source_gate_path = ROOT / "scripts/build440_product_inventory_tools_source_gate.py"
workflow_gate_path = ROOT / ".github/workflows/build440-source-gate.yml"
source_gate = source_gate_path.read_text(encoding="utf-8")
workflow_gate = workflow_gate_path.read_text(encoding="utf-8")

for required in (
    "build440_development_release_alignment_test.py",
    "build440_release_contract_integrity_test.py",
    "build440_cross_mutation_responsive_acceptance_test.py",
):
    if required not in workflow_gate and required not in source_gate:
        failures.append(f"active Build 440 gate does not invoke {required}")

# Scan only regression scripts actually named by the active Build 440 gate.
# Historical files may retain their build numbers, but active tests must not
# demand an obsolete runtime cache major from an earlier release.
# This guard excludes itself so its regex implementation and diagnostic text
# cannot be mistaken for an application cache-version assertion.
invoked_scripts = set(re.findall(r"scripts/[A-Za-z0-9_.-]+\.(?:py|mjs|js)", source_gate + "\n" + workflow_gate))
self_rel = str(Path(__file__).resolve().relative_to(ROOT)).replace('\\', '/')
cache_pattern = re.compile(r"[?&]v=(\d+)(?:\.\d+)?")
cache_scanned = 0
for rel in sorted(invoked_scripts):
    path = ROOT / rel
    if not path.exists():
        failures.append(f"active gate references missing script: {rel}")
        continue
    if rel == self_rel:
        continue
    cache_scanned += 1
    text = path.read_text(encoding="utf-8")
    for match in cache_pattern.finditer(text):
        major = int(match.group(1))
        if major != release:
            line = text.count("\n", 0, match.start()) + 1
            failures.append(
                f"{rel}:{line} hard-codes stale runtime cache major v={major}; "
                f"derive Build {release} or assert the current release"
            )

canonical_markers = {
    "AI_HANDOFF.md": (
        "Development release: **Build 440**",
        "Production baseline: **Build 437**",
        "Production promotion: **CLOSED**",
        "`database_upgrade_current_pass.sql` is a legacy compatibility snapshot",
    ),
    "PROJECT_STATUS_AND_ROADMAP.md": (
        "Current Development release: **Build 440**",
        "Build 440 source/CI: **CLOSED / GREEN**",
        "Production promotion: **CLOSED**",
    ),
    "AI_CONTEXT.md": ("Compatibility pointer — Build 440",),
    "MARKDOWN_INDEX.md": ("Documentation Index — Build 440",),
    "NEW_CHAT_STATUS.md": ("Build 440 Pointer",),
    "DEVELOPMENT_ROADMAP.md": ("Build 440",),
}
for rel, markers in canonical_markers.items():
    path = ROOT / rel
    if not path.exists():
        failures.append(f"current documentation authority is missing: {rel}")
        continue
    text = path.read_text(encoding="utf-8")
    for marker in markers:
        if marker not in text:
            failures.append(f"{rel} missing current authority marker: {marker}")

stale_phrases = {
    "AI_HANDOFF.md": ("Active feature: Build 439", "Next: Build 440", "Do not start Build 440"),
    "PROJECT_STATUS_AND_ROADMAP.md": ("Active Build439", "Next Build440", "Do not begin Build440"),
    "AI_CONTEXT.md": ("Operational Contract: Build 384", "Runtime Stop Rule (Build 386)"),
    "MARKDOWN_INDEX.md": ("Build 279 Pointer", "current migration: `database_upgrade_current_pass.sql`"),
    "NEW_CHAT_STATUS.md": ("Build 279 Pointer",),
    "DEVELOPMENT_ROADMAP.md": ("Build 279",),
}
for rel, phrases in stale_phrases.items():
    text = (ROOT / rel).read_text(encoding="utf-8")
    for phrase in phrases:
        if phrase in text:
            failures.append(f"{rel} still advertises stale current-state phrase: {phrase}")

# database_upgrade_current_pass.sql is retained for old compatibility tests.
# Its Build 264 header must not be misrepresented as Build 440 migration content.
legacy_upgrade = (ROOT / "database_upgrade_current_pass.sql").read_text(encoding="utf-8")
legacy_match = re.search(r"\bBuild\s+(\d+)\b", legacy_upgrade[:1000], re.I)
legacy_build = int(legacy_match.group(1)) if legacy_match else 0
if legacy_build < 244:
    failures.append("legacy database_upgrade_current_pass.sql snapshot predates required Build 244 compatibility")
if legacy_build >= release:
    failures.append(
        "database_upgrade_current_pass.sql unexpectedly presents itself as current Build 440+; "
        "do not relabel legacy SQL without matching migration content"
    )

print("BUILD 440 RELEASE CONTRACT INTEGRITY")
print(f"Canonical Development release: Build {release}")
print(f"Active workflows scanned: {len(workflow_files)}")
print(f"Active gate scripts scanned for cache majors: {cache_scanned}")
print(f"Legacy current-pass compatibility snapshot: Build {legacy_build or 'unknown'} / NOT RELEASE AUTHORITY")
print("Workflow repository mutation: FORBIDDEN")
print("Canonical current-state documents: ENFORCED")
print("Production mutation capability: NONE")
print()

if failures:
    for index, failure in enumerate(failures, 1):
        print(f"{index:03d}. FAIL — {failure}")
    print()
    print(f"BUILD 440 RELEASE CONTRACT INTEGRITY: FAIL ({len(failures)} issue(s))")
    raise SystemExit(1)

print("BUILD 440 RELEASE CONTRACT INTEGRITY: PASS")
print("One Development release authority, current docs, and read-only CI contract are enforced.")

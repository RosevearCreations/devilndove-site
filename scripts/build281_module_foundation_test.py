#!/usr/bin/env python3
"""Build 281 passive module-foundation validation.

Safe to run locally. It performs source/Git checks only and never contacts
Cloudflare, D1 or R2.
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = (
    "public/js/core/dd-module-registry.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md",
    "docs/architecture/MODULE_OWNERSHIP_RULES.md",
    "scripts/build281_module_inventory.py",
    "BUILD281_VALIDATION.md",
    "BUILD281_CHANGED_FILES.md",
)

EXPECTED_MODULES = {
    "public", "catalog", "inventory", "creative", "caip",
    "packaging", "content", "marketing", "accounting", "admin",
}


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, text=True, capture_output=True, check=False)


def main() -> int:
    missing = [path for path in REQUIRED if not (ROOT / path).exists()]
    if missing:
        fail(f"missing required Build 281 files: {', '.join(missing)}")

    definitions = (ROOT / "public/js/core/dd-module-definitions.mjs").read_text(encoding="utf-8")
    found = set(re.findall(r"\bid:\s*['\"]([a-z0-9-]+)['\"]", definitions))
    if found != EXPECTED_MODULES:
        fail(f"module definition set mismatch: found={sorted(found)} expected={sorted(EXPECTED_MODULES)}")

    if re.search(r"entry:\s*['\"][^'\"]+", definitions):
        fail("Build 281 must not connect a runtime module entry point yet")

    registry = (ROOT / "public/js/core/dd-module-registry.mjs").read_text(encoding="utf-8")
    for token in ("setInterval(", "setTimeout(", "fetch("):
        if token in registry:
            fail(f"passive registry contains forbidden automatic runtime token: {token}")

    migration_hits = [
        path.relative_to(ROOT).as_posix()
        for path in ROOT.glob("**/*281*.sql")
        if ".wrangler" not in path.parts
    ]
    if migration_hits:
        fail(f"Build 281 unexpectedly contains SQL migration/verification files: {migration_hits}")

    node = shutil.which("node")
    if node:
        for rel in ("public/js/core/dd-module-registry.mjs", "public/js/core/dd-module-definitions.mjs"):
            checked = run([node, "--check", rel])
            if checked.returncode != 0:
                fail(f"Node syntax check failed for {rel}: {checked.stderr.strip()}")
        print("PASS: module JavaScript syntax")
    else:
        print("SKIP: node not found; JavaScript syntax check not run")

    inventory = run([sys.executable, "scripts/build281_module_inventory.py"])
    if inventory.returncode != 0:
        fail(f"module inventory scan failed: {inventory.stderr.strip() or inventory.stdout.strip()}")
    print("PASS: local module inventory scan")

    git = shutil.which("git")
    if git:
        inside = run([git, "rev-parse", "--is-inside-work-tree"])
        if inside.returncode == 0 and inside.stdout.strip() == "true":
            diff = run([git, "diff", "HEAD^", "HEAD", "--name-only"])
            if diff.returncode == 0:
                changed = {line.strip() for line in diff.stdout.splitlines() if line.strip()}
                protected = {"wrangler.toml", "database_full_schema.sql", "database_schema_current.sql", "database.sql"}
                touched = sorted(changed & protected)
                if touched:
                    fail(f"Build 281 touched protected runtime/schema files: {touched}")
                print("PASS: Build 281 did not change protected Cloudflare/schema files")

    references = []
    needles = ("dd-module-registry.mjs", "dd-module-definitions.mjs")
    allowed = {
        "public/js/core/dd-module-registry.mjs",
        "public/js/core/dd-module-definitions.mjs",
        "scripts/build281_module_foundation_test.py",
        "BUILD281_VALIDATION.md",
        "BUILD281_CHANGED_FILES.md",
        "docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md",
        "docs/architecture/MODULE_OWNERSHIP_RULES.md",
    }
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts or ".wrangler" in path.parts:
            continue
        rel = path.relative_to(ROOT).as_posix()
        if rel in allowed:
            continue
        if path.suffix.lower() not in {".html", ".js", ".mjs"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if any(needle in text for needle in needles):
            references.append(rel)
    if references:
        fail(f"existing runtime files already reference Build 281 module foundation: {references[:20]}")
    print("PASS: module foundation remains passive/unwired")

    print("BUILD 281 MODULE FOUNDATION: PASS")
    print("No Cloudflare resource was contacted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

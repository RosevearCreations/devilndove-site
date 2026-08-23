#!/usr/bin/env python3
"""Build 282 local architecture-lock validation.

Read-only. It contacts no Cloudflare resource and performs no application write.
"""
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

JS_FILES = [
    ROOT / "public/js/core/dd-module-registry.mjs",
    ROOT / "public/js/core/dd-module-definitions.mjs",
    ROOT / "public/js/core/dd-module-contracts.mjs",
    ROOT / "public/js/core/dd-admin-module-shadow.mjs",
    ROOT / "public/js/admin.js",
]

EXPECTED_CHANGED = {
    "AI_CONTEXT.md",
    "BUILD282_CHANGED_FILES.md",
    "BUILD282_VALIDATION.md",
    "docs/architecture/BUILD282_ARCHITECTURE_LOCK.md",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-shadow.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "scripts/build282_module_architecture_test.py",
    "scripts/build282_module_inventory.py",
}


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=ROOT, text=True, encoding="utf-8", errors="replace", capture_output=True)


def fail(message: str) -> int:
    print(f"FAIL: {message}")
    return 1


def main() -> int:
    for path in JS_FILES:
        result = run("node", "--check", str(path))
        if result.returncode:
            print(result.stdout)
            print(result.stderr)
            return fail(f"JavaScript syntax: {path.relative_to(ROOT)}")
    print("PASS: Build 282 JavaScript syntax")

    node_test = r"""
import { createModuleRegistry } from './public/js/core/dd-module-registry.mjs';
import { DD_MODULE_DEFINITIONS } from './public/js/core/dd-module-definitions.mjs';
import { validateModuleContracts } from './public/js/core/dd-module-contracts.mjs';
const registry = createModuleRegistry(DD_MODULE_DEFINITIONS);
const user = { role: 'admin' };
const cases = new Map([
  ['/admin/', 'admin'],
  ['/admin/packaging-studio/', 'packaging'],
  ['/admin/site-item-inventory/', 'inventory'],
  ['/admin/operations/', 'operations'],
  ['/admin/orders/', 'operations'],
  ['/admin/creative-process/', 'creative'],
  ['/admin/creative-assets/', 'caip'],
  ['/admin/media-content-studio/', 'content'],
  ['/admin/analytics/', 'marketing'],
  ['/admin/accounting/', 'accounting'],
  ['/admin/startup-readiness/', 'platform'],
]);
for (const [path, expected] of cases) {
  const actual = registry.resolve(path, user)?.id || null;
  if (actual !== expected) throw new Error(`${path}: expected ${expected}, got ${actual}`);
}
const validation = validateModuleContracts(DD_MODULE_DEFINITIONS);
if (!validation.ok) throw new Error(validation.errors.join('\n'));
if (DD_MODULE_DEFINITIONS.some((definition) => definition.entry)) {
  throw new Error('Build 282 must not connect runtime entry points.');
}
console.log('resolver/contracts PASS');
"""
    result = run("node", "--input-type=module", "--eval", node_test)
    if result.returncode:
        print(result.stdout)
        print(result.stderr)
        return fail("module resolver / contract validation")
    print("PASS: route resolution and contract catalog")

    shadow = (ROOT / "public/js/core/dd-admin-module-shadow.mjs").read_text(encoding="utf-8")
    forbidden = (".activate(", ".load(", "fetch(", "setInterval(", "setTimeout(")
    found = [token for token in forbidden if token in shadow]
    if found:
        return fail(f"shadow resolver contains active/runtime work: {', '.join(found)}")
    print("PASS: Admin resolver remains compatibility/shadow only")

    result = run("git", "show", "--pretty=", "--name-only", "HEAD")
    if result.returncode:
        return fail("could not inspect current commit")
    changed = {line.strip().replace('\\', '/') for line in result.stdout.splitlines() if line.strip()}
    unexpected = sorted(changed - EXPECTED_CHANGED)
    missing = sorted(EXPECTED_CHANGED - changed)
    if unexpected or missing:
        if unexpected:
            print("Unexpected Build 282 files:", *unexpected, sep="\n  ")
        if missing:
            print("Missing Build 282 files:", *missing, sep="\n  ")
        return fail("Build 282 changed-file boundary")
    print("PASS: exact Build 282 changed-file boundary")

    protected = [name for name in changed if name == "wrangler.toml" or name.startswith("functions/") or name.startswith("database") or name.endswith(".sql")]
    if protected:
        return fail(f"protected runtime/schema files changed: {protected}")
    print("PASS: no D1 migration, Functions, or Cloudflare binding/config change")

    print("BUILD 282 ARCHITECTURE LOCK: PASS")
    print("No Cloudflare resource was contacted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

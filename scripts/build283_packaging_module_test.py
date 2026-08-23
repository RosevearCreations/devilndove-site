#!/usr/bin/env python3
"""Build 283 local Packaging module activation validation.

Runs against the current checkout only. It does not contact Cloudflare.
"""
from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_COMMIT = "19e9289d8402b69945f6ce24ca6bd24057c80111"
EXPECTED_CHANGED = {
    "AI_CONTEXT.md",
    "BUILD283_CHANGED_FILES.md",
    "BUILD283_VALIDATION.md",
    "docs/architecture/BUILD283_PACKAGING_MODULE_ACTIVATION.md",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/index.mjs",
    "scripts/build283_packaging_module_test.py",
}
JS_FILES = [
    ROOT / "public/js/admin.js",
    ROOT / "public/js/core/dd-module-registry.mjs",
    ROOT / "public/js/core/dd-module-contracts.mjs",
    ROOT / "public/js/core/dd-module-definitions.mjs",
    ROOT / "public/js/core/dd-admin-module-runtime.mjs",
    ROOT / "public/js/modules/packaging/index.mjs",
]


def run(cmd: list[str], *, cwd: Path = ROOT) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, cwd=cwd, text=True, capture_output=True, encoding="utf-8", errors="replace")


def fail(message: str, details: str = "") -> None:
    print(f"FAIL: {message}")
    if details.strip():
        print(details.strip())
    raise SystemExit(1)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def check_syntax() -> None:
    for path in JS_FILES:
        require(path.exists(), f"missing JavaScript file: {path.relative_to(ROOT)}")
        result = run(["node", "--check", str(path)])
        if result.returncode != 0:
            fail(f"JavaScript syntax: {path.relative_to(ROOT)}", result.stderr or result.stdout)
    print("PASS: Build 283 JavaScript syntax")


def check_lifecycle() -> None:
    harness = r'''
import { createModuleRegistry, MODULE_STATES } from './public/js/core/dd-module-registry.mjs';
import { DD_MODULE_DEFINITIONS } from './public/js/core/dd-module-definitions.mjs';
import { validateModuleContracts } from './public/js/core/dd-module-contracts.mjs';

const entries = DD_MODULE_DEFINITIONS.filter((item) => Boolean(item.entry));
if (entries.length !== 1 || entries[0].id !== 'packaging') {
  throw new Error(`Expected Packaging to be the only active entry, got: ${entries.map(x => x.id).join(',')}`);
}
const packaging = entries[0];
for (const contract of ['inventory-read', 'catalog-read', 'content-media']) {
  if (!packaging.consumes.includes(contract)) throw new Error(`Packaging missing contract ${contract}`);
}
const contractValidation = validateModuleContracts(DD_MODULE_DEFINITIONS);
if (!contractValidation.ok) throw new Error(contractValidation.errors.join('\n'));

const registry = createModuleRegistry(DD_MODULE_DEFINITIONS);
const admin = { role: 'admin', user_id: 1 };
const member = { role: 'member', user_id: 2 };
if (registry.resolve('/admin/packaging-studio/', admin)?.id !== 'packaging') throw new Error('Packaging route did not resolve.');
if (registry.resolve('/admin/accounting/', admin)?.id !== 'accounting') throw new Error('Accounting route classification regressed.');
if (registry.canAccess('packaging', member)) throw new Error('Member unexpectedly has Packaging module access.');
let denied = false;
try {
  await registry.activate('packaging', { user: member, pathname: '/admin/packaging-studio/' });
} catch {
  denied = true;
}
if (!denied) throw new Error('Packaging activation did not reject non-admin identity.');

const namespace = await registry.activate('packaging', { user: admin, pathname: '/admin/packaging-studio/', verified: true });
if (registry.state('packaging') !== MODULE_STATES.ACTIVE) throw new Error('Packaging registry state is not active.');
if (namespace.getStatus?.().state !== 'active') throw new Error('Packaging lifecycle entry did not become active.');
await registry.deactivate('packaging', { reason: 'test' });
if (registry.state('packaging') !== MODULE_STATES.INACTIVE) throw new Error('Packaging registry state is not inactive after deactivation.');
if (namespace.getStatus?.().state !== 'inactive') throw new Error('Packaging lifecycle entry did not become inactive.');
console.log(JSON.stringify({ok:true, entry:packaging.entry, contractsOk:contractValidation.ok}));
'''
    with tempfile.NamedTemporaryFile("w", suffix=".mjs", dir=ROOT, delete=False, encoding="utf-8") as handle:
        handle.write(harness)
        temp_path = Path(handle.name)
    try:
        result = run(["node", str(temp_path)])
    finally:
        temp_path.unlink(missing_ok=True)
    if result.returncode != 0:
        fail("Packaging registry lifecycle", result.stderr or result.stdout)
    try:
        payload = json.loads(result.stdout.strip().splitlines()[-1])
    except Exception:
        fail("Packaging registry lifecycle returned invalid evidence", result.stdout)
    require(payload.get("ok") is True and payload.get("contractsOk") is True, "Packaging lifecycle evidence did not pass")
    print("PASS: Packaging verified-identity registry lifecycle")


def check_runtime_boundary() -> None:
    runtime = (ROOT / "public/js/core/dd-admin-module-runtime.mjs").read_text(encoding="utf-8")
    module = (ROOT / "public/js/modules/packaging/index.mjs").read_text(encoding="utf-8")
    admin = (ROOT / "public/js/admin.js").read_text(encoding="utf-8")
    definitions = (ROOT / "public/js/core/dd-module-definitions.mjs").read_text(encoding="utf-8")

    require("dd-admin-module-runtime.mjs?v=283" in admin, "admin.js does not load Build 283 runtime bridge")
    require("detail.verified === true" in runtime, "runtime bridge does not require verified admin event for activation")
    require("registry.activate(definition.id" in runtime, "runtime bridge never activates eligible module")
    require("entry: '../modules/packaging/index.mjs?v=283'" in definitions, "Packaging runtime entry is missing")
    require("entry: null" in definitions, "non-Packaging shadow definitions are missing")
    for forbidden in ("fetch(", "setInterval(", "setTimeout("):
        require(forbidden not in module, f"Packaging lifecycle entry contains forbidden runtime work: {forbidden}")
        require(forbidden not in runtime, f"Admin runtime bridge contains forbidden polling/network work: {forbidden}")
    require("admin-packaging-studio" not in module, "Packaging module duplicates legacy Packaging implementation reference")
    print("PASS: Packaging activation remains a no-polling compatibility bridge")


def check_changed_files() -> None:
    result = run(["git", "diff", "--name-only", f"{BASE_COMMIT}..HEAD"])
    if result.returncode != 0:
        fail("git changed-file boundary", result.stderr or result.stdout)
    changed = {line.strip().replace('\\', '/') for line in result.stdout.splitlines() if line.strip()}
    if changed != EXPECTED_CHANGED:
        fail(
            "exact Build 283 changed-file boundary",
            f"Missing: {sorted(EXPECTED_CHANGED - changed)}\nUnexpected: {sorted(changed - EXPECTED_CHANGED)}",
        )
    protected = [path for path in changed if path.startswith("functions/") or path.startswith("database_") or path == "wrangler.toml"]
    require(not protected, f"protected runtime/schema files changed: {protected}")
    print("PASS: no D1 migration, Functions, or Cloudflare binding/config change")


def main() -> int:
    check_syntax()
    check_lifecycle()
    check_runtime_boundary()
    check_changed_files()
    print("BUILD 283 PACKAGING MODULE ACTIVATION: PASS")
    print("No Cloudflare resource was contacted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

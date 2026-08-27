#!/usr/bin/env python3
"""Synchronize live Development cache/version authorities to development-release.json.

This changes version/cache identity only. It does not touch migrations, historical build
scripts, database state, provider bindings, or Production.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
release_doc = json.loads((ROOT / "development-release.json").read_text(encoding="utf-8"))
release = int(release_doc["release"])
if release <= 0:
    raise SystemExit("Invalid Development release")

runtime_files: list[Path] = []
runtime_files.extend(ROOT.glob("*.html"))
runtime_files.extend((ROOT / "admin").rglob("*.html"))
runtime_files.extend((ROOT / "js").rglob("*.js"))
runtime_files.extend((ROOT / "public" / "js").rglob("*.js"))

version_pattern = re.compile(r"([?&]v=)(\d+)(?=[\"'&#\s)]|$)")
changed: list[Path] = []
replacements = 0

for path in sorted(set(runtime_files)):
    original = path.read_text(encoding="utf-8")
    updated, count = version_pattern.subn(lambda m: f"{m.group(1)}{release}", original)
    if path == ROOT / "admin" / "index.html":
        updated, visible_count = re.subn(r"\bBuild\s+\d{3,}\b", f"Build {release}", updated)
        count += visible_count
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        changed.append(path)
        replacements += count

sw_path = ROOT / "sw.js"
sw = sw_path.read_text(encoding="utf-8")
updated_sw, c1 = re.subn(r"^// Build\s+\d+:", f"// Build {release}:", sw, count=1, flags=re.M)
updated_sw, c2 = re.subn(r"devilndove-shell-v\d+", f"devilndove-shell-v{release}", updated_sw, count=1)
if updated_sw != sw:
    sw_path.write_text(updated_sw, encoding="utf-8")
    changed.append(sw_path)
    replacements += c1 + c2

print("BUILD 440 DEVELOPMENT RELEASE SYNCHRONIZER")
print(f"Canonical Development release: {release}")
print(f"Runtime files changed: {len(changed)}")
print(f"Version/cache references normalized: {replacements}")
for path in changed:
    print(f"  {path.relative_to(ROOT)}")
print("Cloudflare/D1/R2/provider access: NONE")
print("Production mutation capability: NONE")

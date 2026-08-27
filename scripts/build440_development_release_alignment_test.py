#!/usr/bin/env python3
"""Fail closed when live Development runtime assets advertise mixed release versions."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RELEASE_FILE = ROOT / "development-release.json"

with RELEASE_FILE.open("r", encoding="utf-8") as fh:
    release_doc = json.load(fh)

release = int(release_doc.get("release") or 0)
expected_label = f"Build {release}"
failures: list[str] = []

if release != 440:
    failures.append(f"development-release.json release is {release}, expected 440 for this gate")
if release_doc.get("environment") != "development":
    failures.append("development-release.json environment must be development")
if release_doc.get("label") != expected_label:
    failures.append(f"development-release.json label must be {expected_label!r}")

runtime_files: list[Path] = []
runtime_files.extend(ROOT.glob("*.html"))
runtime_files.extend((ROOT / "admin").rglob("*.html"))
runtime_files.extend((ROOT / "js").rglob("*.js"))
runtime_files.extend((ROOT / "public" / "js").rglob("*.js"))

version_pattern = re.compile(r"([?&]v=)(\d+)(?=[\"'&#\s)]|$)")
for path in sorted(set(runtime_files)):
    text = path.read_text(encoding="utf-8")
    for match in version_pattern.finditer(text):
        value = int(match.group(2))
        if value == release:
            continue
        line = text.count("\n", 0, match.start()) + 1
        failures.append(f"{path.relative_to(ROOT)}:{line}: live asset cache version v={value}, expected v={release}")

sw_path = ROOT / "sw.js"
if not sw_path.exists():
    failures.append("sw.js is missing")
else:
    sw = sw_path.read_text(encoding="utf-8")
    if not re.search(rf"\bBuild\s+{release}\b", sw):
        failures.append(f"sw.js must identify the active service worker as Build {release}")
    if f"devilndove-shell-v{release}" not in sw:
        failures.append(f"sw.js CACHE_NAME must be devilndove-shell-v{release}")

admin_index = ROOT / "admin" / "index.html"
if admin_index.exists():
    admin = admin_index.read_text(encoding="utf-8")
    stale_builds = sorted({int(v) for v in re.findall(r"\bBuild\s+(\d{3,})\b", admin) if int(v) != release})
    if stale_builds:
        failures.append(
            "admin/index.html contains stale Development-facing Build labels: "
            + ", ".join(map(str, stale_builds))
            + f"; expected only Build {release}"
        )

print("BUILD 440 DEVELOPMENT RELEASE ALIGNMENT")
print(f"Canonical Development release: {release}")
print(f"Runtime files scanned: {len(set(runtime_files))}")
print("Cloudflare/D1/R2/provider access: NONE")
print("Production mutation capability: NONE")
print()

if failures:
    for index, failure in enumerate(failures, 1):
        print(f"{index:03d}. FAIL — {failure}")
    print()
    print(f"BUILD 440 DEVELOPMENT RELEASE ALIGNMENT: FAIL ({len(failures)} mismatch(es))")
    raise SystemExit(1)

print("BUILD 440 DEVELOPMENT RELEASE ALIGNMENT: PASS")
print(f"All live Development cache/version authorities resolve to Build {release}.")

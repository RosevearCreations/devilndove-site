#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
FAIL = []

authority = json.loads((ROOT / "current-development-authority.json").read_text(encoding="utf-8"))
current_build = int(authority.get("build") or 0)

def automatic_triggers(text: str):
    m = re.search(r"(?ms)^on:\s*\n(?P<body>(?:^[ \t]+.*\n|^[ \t]*\n)*)", text)
    if not m:
        return []
    body = m.group("body")
    out = []
    for key in ("push", "pull_request", "schedule", "workflow_run"):
        if re.search(rf"(?m)^  {re.escape(key)}\s*:", body):
            out.append(key)
    return out

historical = 0
remote_d1 = 0
for path in sorted(WORKFLOWS.glob("release467-build*.yml")):
    m = re.match(r"release467-build(\d+)", path.name)
    if not m:
        continue
    build = int(m.group(1))
    text = path.read_text(encoding="utf-8", errors="replace")
    triggers = automatic_triggers(text)
    remote = bool(re.search(r"(?i)\bd1\s+execute\b", text) and "--remote" in text)

    if build < current_build:
        historical += 1
        if triggers:
            FAIL.append(
                f"{path.relative_to(ROOT)}: historical Build {build} must be manual-only; "
                f"automatic triggers={','.join(triggers)}"
            )
    if remote:
        remote_d1 += 1
        if triggers:
            FAIL.append(
                f"{path.relative_to(ROOT)}: remote D1 proof must be manual-only; "
                f"automatic triggers={','.join(triggers)}"
            )
        if "workflow_dispatch:" not in text:
            FAIL.append(f"{path.relative_to(ROOT)}: remote D1 proof lacks workflow_dispatch")

print(
    f"CI FAN-OUT GUARD: current Build {current_build}; "
    f"historical workflows={historical}; remote-D1 workflows={remote_d1}"
)
if FAIL:
    for item in FAIL:
        print("FAIL —", item)
    sys.exit(1)
print("CI FAN-OUT GUARD: PASS — historical builds and remote-D1 proofs are manual-only")

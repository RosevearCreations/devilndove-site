#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
FAIL = []

authority = json.loads((ROOT / "current-development-authority.json").read_text(encoding="utf-8"))
current_release = int(authority.get("release") or 0)
current_build = int(authority.get("build") or 0)
if current_release != 467 or current_build <= 0:
    raise SystemExit("Current Release 467 build authority is missing or invalid.")

def automatic_triggers(text: str):
    m = re.search(r"(?ms)^on:\s*\n(?P<body>(?:^[ \t]+.*\n|^[ \t]*\n)*)", text)
    if not m:
        return []
    body = m.group("body")
    triggers = []
    for key in ("push", "pull_request", "schedule", "workflow_run"):
        if re.search(rf"(?m)^  {re.escape(key)}\s*:", body):
            triggers.append(key)
    return triggers

historical = 0
automatic_historical = 0
remote_release_workflows = 0

for path in sorted(WORKFLOWS.glob("release467-build*.yml")):
    match = re.search(r"release467-build(\d+)", path.name)
    if not match:
        continue
    build = int(match.group(1))
    text = path.read_text(encoding="utf-8", errors="replace")
    triggers = automatic_triggers(text)
    remote = bool(re.search(r"(?i)\bd1\s+execute\b", text) and "--remote" in text)

    if remote:
        remote_release_workflows += 1
        one_shot_successor = (
            build == current_build + 1
            and "D1_ONE_SHOT_EVIDENCE_CAPTURE" in text
            and triggers == ["push"]
            and "branches: [dev]" in text
            and "paths:" in text
            and ("D1_PROVIDER_ROWS_READ_CEILING=20000" in text or "D1_PROVIDER_ROWS_READ_CEILING: '20000'" in text or 'D1_PROVIDER_ROWS_READ_CEILING: "20000"' in text)
            and "workflow_dispatch:" in text
        )
        if triggers and not one_shot_successor:
            FAIL.append(
                f"{path.relative_to(ROOT)}: remote D1 proof cannot run automatically unless it is the "
                f"single bounded successor evidence capture; automatic triggers={','.join(triggers)}"
            )

    if build < current_build:
        historical += 1
        if triggers:
            automatic_historical += 1
            FAIL.append(
                f"{path.relative_to(ROOT)}: Build {build} is historical while current Build is "
                f"{current_build}; automatic triggers={','.join(triggers)}"
            )
        if "workflow_dispatch:" not in text:
            FAIL.append(
                f"{path.relative_to(ROOT)}: historical Build {build} must retain workflow_dispatch for manual recovery."
            )

print(
    "CI FAN-OUT GUARD:",
    f"current_build={current_build}",
    f"historical_workflows={historical}",
    f"automatic_historical={automatic_historical}",
    f"remote_d1_workflows={remote_release_workflows}",
)
if FAIL:
    for item in FAIL:
        print("FAIL —", item)
    sys.exit(1)

print(
    "CI FAN-OUT GUARD: PASS — historical Release 467 workflows are manual-only, "
    "and remote-D1 release proofs cannot run automatically except one bounded successor capture."
)

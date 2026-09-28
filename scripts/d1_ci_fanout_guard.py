#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
FAIL = []
remote_release_workflows = 0

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

for path in sorted(WORKFLOWS.glob("release467-build*.yml")):
    text = path.read_text(encoding="utf-8", errors="replace")
    remote = bool(re.search(r"(?i)\bd1\s+execute\b", text) and "--remote" in text)
    if not remote:
        continue
    remote_release_workflows += 1
    triggers = automatic_triggers(text)
    if triggers:
        FAIL.append(f"{path.relative_to(ROOT)}: remote D1 proof must be manual-only; automatic triggers={','.join(triggers)}")
    if "workflow_dispatch:" not in text:
        FAIL.append(f"{path.relative_to(ROOT)}: remote D1 proof lacks workflow_dispatch")

print(f"D1 CI FAN-OUT GUARD: inspected {remote_release_workflows} remote-D1 historical release workflows")
if FAIL:
    for item in FAIL:
        print("FAIL —", item)
    sys.exit(1)
print("D1 CI FAN-OUT GUARD: PASS — historical remote-D1 release workflows are manual-only")

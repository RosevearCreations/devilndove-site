#!/usr/bin/env python3
"""Fail closed unless main is the exact tree of a green Development commit.

The main commit itself may be a merge/promotion commit, but its tree must exactly match
one commit reachable from origin/dev, and that Development commit must have a successful
System Gate workflow run. This prevents main-only application/config patches while still
allowing deliberate GitHub merge mechanics.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Stop(RuntimeError):
    pass


def git(*args: str) -> str:
    result = subprocess.run(["git", *args], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.returncode:
        raise Stop(f"git {' '.join(args)} failed: {(result.stderr or '').strip()[-1000:]}")
    return result.stdout.strip()


def resolve_green_dev_sha(main_sha: str) -> str:
    git("fetch", "--no-tags", "origin", "+refs/heads/dev:refs/remotes/origin/dev")
    main_tree = git("show", "-s", "--format=%T", main_sha)
    candidates: list[str] = []
    for line in git("log", "origin/dev", "--format=%H %T").splitlines():
        parts = line.strip().split()
        if len(parts) == 2 and parts[1] == main_tree:
            candidates.append(parts[0])
    if not candidates:
        raise Stop("main tree does not exactly match any commit reachable from dev; main-only drift is forbidden.")
    if main_sha in candidates:
        return main_sha
    return candidates[0]


def system_gate_green(dev_sha: str) -> tuple[bool, dict]:
    token = str(os.environ.get("GITHUB_TOKEN") or "").strip()
    repo = str(os.environ.get("GITHUB_REPOSITORY") or "RosevearCreations/devilndove-site").strip()
    if not token:
        raise Stop("GITHUB_TOKEN is required to prove the exact Development System Gate run.")
    query = urllib.parse.urlencode({"branch": "dev", "head_sha": dev_sha, "status": "completed", "per_page": 50})
    url = f"https://api.github.com/repos/{repo}/actions/workflows/system-gate.yml/runs?{query}"
    request = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "devilndove-release464-promotion-gate",
    })
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.load(response)
    except Exception as exc:
        raise Stop(f"Could not read System Gate evidence for Development SHA {dev_sha}: {exc}") from exc
    runs = payload.get("workflow_runs") if isinstance(payload, dict) else []
    if not isinstance(runs, list):
        runs = []
    exact = [run for run in runs if str(run.get("head_sha") or "") == dev_sha]
    green = [run for run in exact if run.get("conclusion") == "success"]
    if not green:
        detail = [{"id": run.get("id"), "status": run.get("status"), "conclusion": run.get("conclusion")} for run in exact[:5]]
        return False, {"runs": detail}
    chosen = sorted(green, key=lambda run: str(run.get("updated_at") or ""), reverse=True)[0]
    return True, {"run_id": chosen.get("id"), "html_url": chosen.get("html_url"), "updated_at": chosen.get("updated_at")}


def write_output(name: str, value: str) -> None:
    path = str(os.environ.get("GITHUB_OUTPUT") or "").strip()
    if path:
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(f"{name}={value}\n")


def main() -> int:
    branch = str(os.environ.get("GITHUB_REF_NAME") or git("branch", "--show-current") or "").strip()
    if branch != "main":
        raise Stop(f"Production promotion gate may run only on main; current ref is {branch or 'unknown'}.")
    main_sha = str(os.environ.get("GITHUB_SHA") or git("rev-parse", "HEAD")).strip()
    dev_sha = resolve_green_dev_sha(main_sha)
    ok, evidence = system_gate_green(dev_sha)
    if not ok:
        raise Stop(f"Exact Development tree {dev_sha} has no successful System Gate run: {json.dumps(evidence, sort_keys=True)}")
    write_output("approved_dev_sha", dev_sha)
    write_output("system_gate_run_id", str(evidence.get("run_id") or ""))
    proof = {
        "status": "PASS",
        "main_sha": main_sha,
        "approved_dev_sha": dev_sha,
        "tree_sha": git("show", "-s", "--format=%T", main_sha),
        "system_gate": evidence,
        "main_only_application_patch": False,
    }
    print("EXACT DEVELOPMENT -> MAIN PROMOTION GATE: PASS")
    print(json.dumps(proof, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Stop as exc:
        print(f"EXACT DEVELOPMENT -> MAIN PROMOTION GATE: STOP — {exc}", file=sys.stderr)
        raise SystemExit(2)

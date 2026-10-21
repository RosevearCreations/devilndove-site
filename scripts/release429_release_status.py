#!/usr/bin/env python3
"""Build 429: explain exact-SHA Development/Production release readiness; no mutations."""
from __future__ import annotations
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

WORKFLOWS = {
    "System Gate": "system-gate.yml",
    "Current Application Quality Proof": "current-application-quality.yml",
    "I.T. Admin Runtime Proof": "it-admin-runtime-proof.yml",
    "Repository Branch Hygiene": "repository-branch-hygiene.yml",
}
BASE = "https://api.github.com/repos"


def get_json(url: str, token: str) -> dict:
    headers = {"Accept": "application/vnd.github+json",
               "X-GitHub-Api-Version": "2022-11-28",
               "User-Agent": "devilndove-release-429-diagnostic"}
    if token:
        headers["Authorization"] = "Bearer " + token
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=25) as res:
        return json.load(res)


def check(repo: str, sha: str, token: str, get=get_json) -> dict:
    result = {"repo": repo, "target_dev_sha": sha, "checks": [], "status": "HOLD"}
    for name, file in WORKFLOWS.items():
        q = urllib.parse.urlencode({"branch": "dev", "head_sha": sha, "per_page": 100})
        url = f"{BASE}/{repo}/actions/workflows/{file}/runs?{q}"
        item = {"name": name, "workflow": file, "status": "UNKNOWN", "run_url": None,
                "reason": "", "run_id": None}
        try:
            payload = get(url, token)
            matching = [run for run in payload.get("workflow_runs", [])
                        if run.get("head_sha") == sha and run.get("head_branch") == "dev"]
            passing = [run for run in matching if run.get("status") == "completed" and
                       run.get("conclusion") == "success"]
            selected = (passing or matching)[:1]
            if passing:
                item["status"] = "GREEN"
                item["reason"] = "Exact Development SHA passed"
            elif matching:
                item["status"] = "HOLD"
                item["reason"] = "Exact SHA has no successful completed run"
            else:
                item["status"] = "MISSING"
                item["reason"] = "No workflow run for exact Development SHA"
            if selected:
                run = selected[0]
                item["run_id"] = run.get("id")
                item["run_url"] = run.get("html_url")
                item["conclusion"] = run.get("conclusion")
                item["run_status"] = run.get("status")
        except (urllib.error.URLError, ValueError, KeyError, TimeoutError) as err:
            item["reason"] = "Workflow-specific API lookup failed: " + str(err)[:220]
        result["checks"].append(item)
    if all(x["status"] == "GREEN" for x in result["checks"]):
        result["status"] = "READY_FOR_PROTECTED_PRODUCTION_GATE"
    return result


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--sha", required=True, help="Exact 40-character Development SHA")
    p.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY", "RosevearCreations/devilndove-site"))
    p.add_argument("--output", default="release429-status.json")
    args = p.parse_args()
    if len(args.sha) != 40 or any(c not in "0123456789abcdef" for c in args.sha.lower()):
        p.error("--sha must be an exact 40-character hexadecimal commit")
    result = check(args.repo, args.sha.lower(), os.environ.get("GITHUB_TOKEN", ""))
    with open(args.output, "w", encoding="utf-8") as out:
        json.dump(result, out, indent=2)
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "READY_FOR_PROTECTED_PRODUCTION_GATE" else 2


if __name__ == "__main__":
    sys.exit(main())

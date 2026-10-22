#!/usr/bin/env python3
"""Release 467 Build 432: *read-only* rollback rehearsal. NEVER checks out, resets, deploys or writes remote state.

A previous successful Production deployment is a *candidate*, not an automatic recovery authorization.
Only independent proof of the exact historical deploy can make a candidate review-ready.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.request

SHA = re.compile(r"^[0-9a-f]{40}$")
REPO = "RosevearCreations/devilndove-site"
LIVE = "https://devilndove.com/release-version.json"

def git(*args: str) -> str:
    result = subprocess.run(["git", *args], capture_output=True, text=True, check=False, timeout=15)
    if result.returncode:
        raise ValueError(f"Read-only git query failed: {args[0]} (exit {result.returncode})")
    return result.stdout.strip()

def github_run(run_id: int, token: str) -> dict | None:
    if not token:
        return None
    req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/actions/runs/{run_id}",
        headers={"Accept":"application/vnd.github+json", "Authorization":"Bearer "+token,
                 "User-Agent":"devilndove-rollback-rehearsal-432"})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            return json.load(r)
    except (urllib.error.URLError,ValueError,TimeoutError):
        return None

def live_marker() -> dict | None:
    try:
        req = urllib.request.Request(LIVE+"?rehearsal=432",headers={"Cache-Control":"no-cache",
            "User-Agent":"devilndove-rollback-rehearsal-432"})
        with urllib.request.urlopen(req, timeout=12) as r:
            return json.load(r) if r.status == 200 else None
    except (urllib.error.URLError,ValueError,TimeoutError):
        return None

def assess(*, current_sha: str, candidate_sha: str, current_tree: str | None,
           candidate_tree: str | None, candidate_ancestor: bool, changed_files: list[str],
           receipt: dict | None, production_run: dict | None, live: dict | None) -> dict:
    """Pure diagnostic; outputs no permission to perform a rollback."""
    holds=[]
    if not SHA.fullmatch(str(current_sha or "")) or not SHA.fullmatch(str(candidate_sha or "")):
        holds.append("EXACT_GIT_SHA_REQUIRED")
    if candidate_sha == current_sha:
        holds.append("CANDIDATE_EQUALS_CURRENT")
    if not SHA.fullmatch(str(current_tree or "")) or not SHA.fullmatch(str(candidate_tree or "")):
        holds.append("GIT_TREE_NOT_VERIFIED")
    if "UNKNOWN_GIT_DIFF" in changed_files:
        holds.append("GIT_DIFF_UNAVAILABLE")
    if candidate_tree and current_tree and candidate_tree == current_tree:
        holds.append("CANDIDATE_TREE_IDENTICAL")
    if not candidate_ancestor:
        holds.append("CANDIDATE_NOT_IN_CURRENT_HISTORY")
    if receipt is None:
        holds.append("HISTORICAL_PRODUCTION_RECEIPT_NOT_PROVIDED")
    else:
        if (receipt.get("status") != "VERIFIED_PRODUCTION_RECEIPT" or
            receipt.get("source_sha") != candidate_sha or
            not receipt.get("cloudflare_deployment_id") or
            not str(receipt.get("cloudflare_deployment_url") or "").startswith("https://")):
            holds.append("HISTORICAL_RECEIPT_NOT_BOUND_TO_CANDIDATE")
    rid=receipt.get("github_run_id") if isinstance(receipt,dict) else None
    if not isinstance(rid,int) or rid<=0:
        holds.append("HISTORICAL_GITHUB_RUN_ID_MISSING")
    if not production_run or production_run.get("id") != rid or production_run.get("head_sha") != candidate_sha or production_run.get("status") != "completed" or production_run.get("conclusion") != "success" or production_run.get("name") != "Production Pages Deploy":
        holds.append("INDEPENDENT_HISTORICAL_PRODUCTION_RUN_NOT_GREEN")
    if not isinstance(live,dict) or live.get("source_sha") != current_sha or live.get("branch") != "main":
        holds.append("CURRENT_LIVE_VERSION_NOT_VERIFIED")
    sensitive = [p for p in changed_files if re.search(r"(^|/)(?:migrations?|schema|wrangler|d1|r2|database)(?:/|[._-]|$)",p,re.I) or p.endswith((".sql",".toml"))]
    if sensitive:
        holds.append("SCHEMA_OR_BINDING_DIFF_REQUIRES_MANUAL_DATA_REVIEW")
    if any(p.startswith(("functions/api/","functions/_middleware","functions/")) for p in changed_files):
        holds.append("SERVER_FUNCTION_CHANGES_REQUIRE_OPERATOR_REVIEW")
    mandatory_safety=[
        "NO_AUTOMATIC_ROLLBACK",
        "DO_NOT_RESTORE_D1_OR_OVERWRITE_PRODUCTION_BUSINESS_DATA",
        "DO_NOT_COPY_OR_OVERWRITE_PRIVATE_R2_ASSETS",
        "DO_NOT_REPLAY_MIGRATIONS_OR_ETSY_PROVIDER_REQUESTS",
        "OWNER_MUST_APPROVE_EXACT_CANDIDATE_AND_CHANGE_SCOPE",
        "SEPARATE_DEPLOYMENT_AUTHORIZATION_AND_LIVE_POSTCHECK_REQUIRED",
    ]
    return {"build":432, "status":"HOLD_FOR_MANUAL_RECOVERY_REVIEW", "rehearsal_only":True,
      "rollback_executed":False,"deployment_executed":False,"d1_queries":0,"r2_mutations":0,
      "provider_actions":0,"current_sha":current_sha,"candidate_sha":candidate_sha,
      "current_tree_sha":current_tree,"candidate_tree_sha":candidate_tree,
      "candidate_in_history":bool(candidate_ancestor),
      "candidate_historical_deployment_id":receipt.get("cloudflare_deployment_id") if isinstance(receipt,dict) else None,
      "changed_files_sample":changed_files[:100], "changed_files_truncated":len(changed_files)>100,
      "sensitive_changed_files":sensitive[:50], "holds":list(dict.fromkeys(holds)),
      "safety_boundaries":mandatory_safety,
      "proposed_manual_sequence":[
        "Confirm current Cloudflare live SHA, GitHub run, incident scope and recovery objective",
        "Review exact candidate commit and matching SUCCESS historical Production Pages Deploy receipt",
        "Inspect impacted static assets, Functions and schema/binding changes; obtain explicit owner approval",
        "Prepare a separate audited rollback PR / controlled code-only deployment plan",
        "Never restore D1/R2 or replay provider actions as part of code rollback",
        "Use protected Development proofs and Production gate before any approved deployment",
        "Verify Cloudflare control-plane deployment, live SHA, public smoke and business safeguards",
      ]}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--candidate-sha",required=True)
    p.add_argument("--current-sha",default=os.getenv("GITHUB_SHA",""))
    p.add_argument("--receipt",help="Build 430 historical verified Production receipt JSON (optional)")
    p.add_argument("--output",default="release432-rollback-rehearsal.json")
    a=p.parse_args()
    current=a.current_sha.lower().strip()
    candidate=a.candidate_sha.lower().strip()
    if not SHA.fullmatch(current) or not SHA.fullmatch(candidate):
        p.error("current and candidate must be full 40-character hexadecimal SHAs")
    def known_tree(sha):
        try:return git("show","-s","--format=%T",sha)
        except ValueError:return None
    current_tree=known_tree(current);candidate_tree=known_tree(candidate)
    try: ancestor=(git("merge-base",candidate,current)==candidate)
    except ValueError: ancestor=False
    try: changed=git("diff","--name-only",candidate,current).splitlines()
    except ValueError: changed=["UNKNOWN_GIT_DIFF"]
    if not current_tree or not candidate_tree:
        changed.append("UNKNOWN_GIT_SOURCE")
    receipt=None
    if a.receipt:
        try:receipt=json.loads(Path(a.receipt).read_text(encoding="utf-8"))
        except (OSError,ValueError):pass
    rid=receipt.get("github_run_id") if isinstance(receipt,dict) else None
    run=github_run(rid,os.getenv("GITHUB_TOKEN","")) if type(rid) is int and rid>0 else None
    result=assess(current_sha=current,candidate_sha=candidate,current_tree=current_tree,
        candidate_tree=candidate_tree,candidate_ancestor=ancestor,changed_files=changed,
        receipt=receipt,production_run=run,live=live_marker())
    Path(a.output).write_text(json.dumps(result,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps(result,indent=2,sort_keys=True))
    return 0 if not result["holds"] else 2

if __name__=="__main__":
    raise SystemExit(main())

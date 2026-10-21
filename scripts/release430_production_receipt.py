#!/usr/bin/env python3
"""Build 430: bind protected Cloudflare proof, smoke evidence and source SHA to a receipt.

Runs after the existing Production control-plane + live smoke checks. Fails closed.
"""
import argparse
import hashlib
import json
from pathlib import Path


def receipt(source_sha, run_id, control, smoke):
    if not isinstance(source_sha, str) or len(source_sha) != 40 or any(c not in "0123456789abcdef" for c in source_sha.lower()):
        raise ValueError("exact source SHA required")
    if not str(run_id).isdigit() or int(run_id) < 1:
        raise ValueError("GitHub run ID required")
    if control.get("status") != "PASS" or control.get("source_sha") != source_sha:
        raise ValueError("Cloudflare control-plane proof does not match current source")
    if control.get("environment") != "production" or control.get("branch") != "main":
        raise ValueError("not a Production deployment on main")
    if control.get("project") != "devilndove-site" or not control.get("deployment_id"):
        raise ValueError("Cloudflare deployment ID missing")
    commit = str(control.get("commit_hash") or "")
    if len(commit) < 7 or not (source_sha.startswith(commit) or commit.startswith(source_sha)):
        raise ValueError("Cloudflare commit does not match source")
    if not str(control.get("deployment_url") or "").startswith("https://"):
        raise ValueError("verified deployment URL missing")
    if smoke.get("status") != "PASS" or not isinstance(smoke.get("checks"), dict):
        raise ValueError("live smoke evidence missing")
    checks = smoke["checks"]
    if not checks or any(v.get("status") not in ("PASS", 200) for v in checks.values() if isinstance(v, dict)):
        raise ValueError("live smoke evidence not all successful")
    digest = lambda obj: hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return {
        "build": 430, "status": "VERIFIED_PRODUCTION_RECEIPT",
        "source_sha": source_sha, "github_run_id": int(run_id),
        "github_workflow_url": f"https://github.com/RosevearCreations/devilndove-site/actions/runs/{int(run_id)}",
        "cloudflare_deployment_id": control["deployment_id"],
        "cloudflare_deployment_url": control["deployment_url"],
        "cloudflare_commit_hash": commit,
        "control_plane_proof_sha256": digest(control),
        "live_smoke_proof_sha256": digest(smoke),
        "live_checks_recorded": sorted(checks),
        "identity_method": "Cloudflare production deployment metadata + smoke on live public resources",
        "live_html_contains_exact_sha": False,
        "note": "A successful workflow run conclusion must still be confirmed independently; this receipt is written only after control-plane and smoke PASS.",
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--sha", required=True)
    p.add_argument("--run-id", required=True)
    p.add_argument("--control", default="/tmp/production-control-plane-proof.json")
    p.add_argument("--smoke", default="/tmp/production-smoke.json")
    p.add_argument("--output", default="/tmp/production-release-receipt.json")
    a = p.parse_args()
    data = receipt(a.sha, a.run_id, json.loads(Path(a.control).read_text()),
                   json.loads(Path(a.smoke).read_text()))
    Path(a.output).write_text(json.dumps(data, sort_keys=True, indent=2) + "\n")
    print(json.dumps(data, sort_keys=True, indent=2))


if __name__ == "__main__":
    main()

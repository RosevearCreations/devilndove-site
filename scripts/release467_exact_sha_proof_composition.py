#!/usr/bin/env python3
"""Reusable read-only exact-SHA GitHub Actions proof composition for Release 467."""
from __future__ import annotations
import argparse,json,os,subprocess,sys
from pathlib import Path

DEV_REQUIRED=("System Gate","Current Application Quality Proof","I.T. Admin Runtime Proof","Repository Branch Hygiene")
PROD_REQUIRED=("Production Pages Deploy","Production Live Resource Integrity Proof","Release 467 Build 155 Products Production Browser Proof","Release 467 Build 154 Products Route Production Proof")

def select(rows,sha,name):
    exact=[r for r in rows if r.get("headSha")==sha and r.get("workflowName")==name]
    green=[r for r in exact if r.get("status")=="completed" and r.get("conclusion")=="success"]
    if not green:
        return None
    return max(green,key=lambda r:(int(r.get("attempt") or 0),int(r.get("databaseId") or 0)))

def verify_lane(label,sha,required,rows):
    selected={};missing=[]
    for name in required:
        row=select(rows,sha,name)
        if row is None:missing.append(name)
        else:selected[name]={"databaseId":row.get("databaseId"),"attempt":row.get("attempt"),"event":row.get("event"),"headSha":row.get("headSha")}
    if missing:raise RuntimeError(f"{label} exact-SHA proofs missing/not GREEN for {sha}: {missing}")
    return {"label":label,"sha":sha,"required":list(required),"selected":selected,"state":"EXACT_SHA_GREEN"}

def live_rows(repo,sha):
    raw=subprocess.check_output(["gh","run","list","--repo",repo,"--commit",sha,"--limit","100","--json","databaseId,workflowName,event,status,conclusion,headSha,attempt"],text=True)
    return json.loads(raw)

def self_test():
    sha="a"*40
    req=("System Gate","Build Proof")
    rows=[
      {"databaseId":1,"workflowName":"System Gate","status":"completed","conclusion":"success","headSha":sha,"attempt":1,"event":"push"},
      {"databaseId":2,"workflowName":"Build Proof","status":"completed","conclusion":"failure","headSha":sha,"attempt":1,"event":"push"},
      {"databaseId":3,"workflowName":"Build Proof","status":"completed","conclusion":"success","headSha":sha,"attempt":2,"event":"push"},
      {"databaseId":4,"workflowName":"System Gate","status":"completed","conclusion":"success","headSha":"b"*40,"attempt":1,"event":"push"},
    ]
    out=verify_lane("SELFTEST",sha,req,rows)
    assert out["selected"]["Build Proof"]["databaseId"]==3
    try:verify_lane("SELFTEST",sha,("Missing",),rows)
    except RuntimeError:pass
    else:raise AssertionError("missing proof must fail closed")
    print("EXACT_SHA_PROOF_COMPOSITION_SELF_TEST=PASS")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--repo")
    ap.add_argument("--development-sha")
    ap.add_argument("--production-sha")
    ap.add_argument("--build-proof-name")
    ap.add_argument("--report-path")
    ap.add_argument("--self-test",action="store_true")
    args=ap.parse_args()
    if args.self_test:
        self_test();return 0
    for name,value in (("repo",args.repo),("development-sha",args.development_sha),("production-sha",args.production_sha),("build-proof-name",args.build_proof_name)):
        if not value:raise SystemExit(f"missing required --{name}")
    if len(args.development_sha)!=40 or len(args.production_sha)!=40:raise SystemExit("development/production SHA must be 40 hex characters")
    dev_rows=live_rows(args.repo,args.development_sha)
    prod_rows=live_rows(args.repo,args.production_sha)
    report={
      "schema":"release467-exact-sha-proof-composition-v1",
      "repository":args.repo,
      "development":verify_lane("DEVELOPMENT",args.development_sha,DEV_REQUIRED+(args.build_proof_name,),dev_rows),
      "production":verify_lane("PRODUCTION",args.production_sha,PROD_REQUIRED+(args.build_proof_name,),prod_rows),
      "read_only":True,
      "mutation_capability":"NONE"
    }
    body=json.dumps(report,indent=2,sort_keys=True)
    if args.report_path:
        Path(args.report_path).write_text(body+"\n",encoding="utf-8")
    print(body)
    return 0
if __name__=="__main__":
    try:raise SystemExit(main())
    except (RuntimeError,subprocess.CalledProcessError) as exc:
        print(f"EXACT_SHA_PROOF_COMPOSITION_FAIL: {exc}",file=sys.stderr);raise SystemExit(1)

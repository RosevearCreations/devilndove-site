#!/usr/bin/env python3
"""Canonical Release 462 current-release / forward-sanity authority."""
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]

def read(path):
    p=ROOT/path
    if not p.is_file():
        FAIL.append(f"missing file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="replace")

def req(ok,msg):
    if not ok: FAIL.append(msg)

release=json.loads(read("development-release.json"))
label="Autonomous Quality, Workflow & Gate Consolidation"
req(release.get("environment")=="development" and release.get("branch")=="dev","current release must remain Development/dev")
req(int(release.get("release") or 0)==462,"current Development release must be 462")
req(release.get("label")==label,"Release 462 label drifted")
req(release.get("release_track")=="single-current-release" and release.get("pages_project")=="devilndove-site-dev","Development release/Page authority drifted")
previous=release.get("previous_release",{})
req(previous.get("release")==461 and previous.get("state")=="complete_development_green","Release 461 must be the closed previous release")
req([x.get("key") for x in release.get("canonical_modules",[])]==["storefront","creators","socials","financials","it-platform"],"canonical five-module authority drifted")

infra=release.get("development_infrastructure",{})
d1=infra.get("d1",{})
req(infra.get("pages_url")=="https://devilndove-site-dev.pages.dev","Development URL drifted")
req(d1.get("binding")=="DB" and d1.get("database_name")=="devilndove-dev" and d1.get("database_id")=="dbc1615b-dcbe-4951-973b-b47c99c73bfa","exact Development D1 authority drifted")
req(int(d1.get("schema_current_through_release") or 0)==461,"Release 462 must carry the proven Release 461 D1 schema")
req(release.get("current_release_migrations")==[],"Release 462 must not claim a D1 migration")

db=release.get("current_release_database_state",{})
req(db.get("new_migration_required") is False and int(db.get("last_verified_schema_release") or 0)==461,"Release 462 D1 state must remain closed at the verified Release 461 schema")
req(db.get("historical_migration_replay") is False and db.get("automatic_replay_path") is False,"migration replay must remain closed")

history={x.get("release"):x for x in release.get("release_history",[])}
req(history.get(461,{}).get("state")=="complete_development_green","Release 461 closure proof missing")
req(history.get(462,{}).get("state") in ("source_implemented_acceptance_pending","complete_source_system_pages_green"),"Release 462 history state missing")

policy=release.get("release_policy",{})
req(policy.get("production_promotion")=="closed","Production promotion must remain closed")
req(policy.get("provider_execution")=="closed" and policy.get("provider_publication")=="closed" and policy.get("provider_live_authorization")=="closed","provider boundaries must remain closed")
req(policy.get("request_time_schema_mutation")=="forbidden","request-time schema mutation must remain forbidden")
req(policy.get("current_release_d1_changes_allowed") is False and policy.get("current_release_d1_migration_required") is False,"Release 462 must remain source-only")

authority=read("functions/api/_lib/releaseAuthority.js")
req("CURRENT_RELEASE = 462" in authority and label in authority,"shared runtime Release 462 authority drifted")
wrangler=read("wrangler.toml")
req('name = "devilndove-site-dev"' in wrangler and 'database_name = "devilndove-dev"' in wrangler and 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler,"wrangler Development authority drifted")
req("account_id =" not in wrangler,"wrangler.toml must never contain account_id")

batch=release.get("release462_batch",[])
req(isinstance(batch,list) and len(batch)==12 and [x.get("id") for x in batch]==list(range(1,13)) and all(x.get("status")=="implemented" for x in batch),"Release 462 twelve-workstream batch is incomplete")

historic=read(".github/workflows/release461-source-gate.yml")
system=read(".github/workflows/system-gate.yml")
req("push:" not in historic and "pull_request:" not in historic and "workflow_dispatch:" in historic,"closed Release 461 source workflow must be manual-only")
req("python scripts/release462_autonomous_quality_gate.py" in system,"System Gate missing Release 462 authority")

for path in ("AI_HANDOFF.md","PROJECT_STATUS_AND_ROADMAP.md","MARKDOWN_INDEX.md","SANITY_HEALTH_CHECK.md","docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md","docs/operations/RELEASE_462_AUTONOMOUS_QUALITY_AUTHORITY.md"):
    req((ROOT/path).is_file(),f"canonical authority missing: {path}")

print("PLATFORM FORWARD SANITY")
print(f"Current release: 462 — {label}")
print("Development D1 schema authority: Release 461 proven/unchanged")
print("Release 462 D1 migration: NONE")
print("Provider execution/publication, raw CAIP delete and separate live Production: CLOSED")
if FAIL:
    for i,item in enumerate(FAIL,1): print(f"{i:03d}. FAIL — {item}")
    raise SystemExit(1)

print("PLATFORM FORWARD SANITY: PASS")

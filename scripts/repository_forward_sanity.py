#!/usr/bin/env python3
"""Canonical Release 462 application + Release 463 environment forward-sanity authority."""
from __future__ import annotations
import json
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
env463=json.loads(read("release463-environment.json"))
label="Autonomous Quality, Workflow & Gate Consolidation"

# Release 462 application authority remains closed and unchanged.
req(release.get("environment")=="development" and release.get("branch")=="dev","application authority must remain Development/dev")
req(int(release.get("release") or 0)==462,"current application release must remain 462")
req(release.get("label")==label,"Release 462 label drifted")
previous=release.get("previous_release",{})
req(previous.get("release")==461 and previous.get("state")=="complete_development_green","Release 461 must be the closed previous application release")
req([x.get("key") for x in release.get("canonical_modules",[])]==["storefront","creators","socials","financials","it-platform"],"canonical five-module authority drifted")

infra=release.get("development_infrastructure",{})
d1=infra.get("d1",{})
req(d1.get("binding")=="DB" and d1.get("database_name")=="devilndove-dev" and d1.get("database_id")=="dbc1615b-dcbe-4951-973b-b47c99c73bfa","exact Development D1 application authority drifted")
req(int(d1.get("schema_current_through_release") or 0)==461,"Release 462 must carry the proven Release 461 D1 schema")
req(release.get("current_release_migrations")==[],"Release 462 must not claim a D1 migration")

db=release.get("current_release_database_state",{})
req(db.get("new_migration_required") is False and int(db.get("last_verified_schema_release") or 0)==461,"Release 462 D1 state must remain closed at the verified Release 461 schema")
req(db.get("historical_migration_replay") is False and db.get("automatic_replay_path") is False,"migration replay must remain closed")

history={x.get("release"):x for x in release.get("release_history",[])}
req(history.get(461,{}).get("state")=="complete_development_green","Release 461 closure proof missing")
req(history.get(462,{}).get("state") in ("source_implemented_acceptance_pending","complete_source_system_pages_green"),"Release 462 history state missing")

policy=release.get("release_policy",{})
req(policy.get("provider_execution")=="closed" and policy.get("provider_publication")=="closed" and policy.get("provider_live_authorization")=="closed","provider boundaries must remain closed")
req(policy.get("request_time_schema_mutation")=="forbidden","request-time schema mutation must remain forbidden")
req(policy.get("current_release_d1_changes_allowed") is False and policy.get("current_release_d1_migration_required") is False,"Release 462 application release must remain source-only")

authority=read("functions/api/_lib/releaseAuthority.js")
req("CURRENT_RELEASE = 462" in authority and label in authority,"shared runtime Release 462 authority drifted")

# Release 463 environment overlay supersedes the old two-project deployment provenance.
req(int(env463.get("environment_release") or 0)==463,"environment release must be 463")
req(env463.get("canonical_pages_project")=="devilndove-site","Release 463 canonical Pages project drifted")
req(env463.get("branches",{}).get("development")=="dev" and env463.get("branches",{}).get("production")=="main","Release 463 branch authority drifted")
req(env463.get("native_git_deployments",{}).get("enabled") is False,"native Git-triggered Pages deployments must remain frozen")
dev=env463.get("development",{}); prod=env463.get("production",{})
req(dev.get("d1",{}).get("id")=="dbc1615b-dcbe-4951-973b-b47c99c73bfa","Release 463 Development D1 drifted")
req(prod.get("d1",{}).get("id")=="f34a741b-0000-45b0-9a96-6be08754d563","Release 463 Production D1 drifted")
req(dev.get("d1",{}).get("id")!=prod.get("d1",{}).get("id"),"Development and Production D1 must be isolated")
req(dev.get("r2",{}).get("product")=="devilndove-toolshed-images-dev" and dev.get("r2",{}).get("caip")=="devilndove-caip-media-dev","Release 463 Development R2 drifted")
req(prod.get("r2",{}).get("product")=="devilndove-toolshed-images" and prod.get("r2",{}).get("caip")=="devilndove-caip-media","Release 463 Production R2 drifted")
proof=env463.get("proof",{})
req(proof.get("d1_exact_parity") is True and int(proof.get("d1_foreign_key_violations") or -1)==0,"Release 463 D1 parity proof missing")
req(proof.get("r2_exact_parity") is True and int(proof.get("product_r2_objects") or 0)==897 and int(proof.get("caip_r2_objects") or 0)==1,"Release 463 R2 parity proof missing")
req(env463.get("operating_model",{}).get("blind_dev_to_production_data_overwrite_after_cutover") is False,"blind Dev-to-Production transactional overwrite must remain forbidden")

wrangler=read("wrangler.toml")
req('name = "devilndove-site"' in wrangler and 'database_name = "devilndove-dev"' in wrangler and 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler,"tracked Wrangler Development authority drifted")
req('DND_ENVIRONMENT = "development"' in wrangler and 'DND_PAGES_PROJECT = "devilndove-site"' in wrangler,"tracked Wrangler environment identity missing")
req("f34a741b-0000-45b0-9a96-6be08754d563" not in wrangler and "devilndove-toolshed-images\"" not in wrangler,"tracked Wrangler must not embed Production data bindings")
req("account_id =" not in wrangler,"wrangler.toml must never contain account_id")

batch=release.get("release462_batch",[])
req(isinstance(batch,list) and len(batch)==12 and [x.get("id") for x in batch]==list(range(1,13)) and all(x.get("status")=="implemented" for x in batch),"Release 462 twelve-workstream batch is incomplete")

historic=read(".github/workflows/release461-source-gate.yml")
system=read(".github/workflows/system-gate.yml")
req("push:" not in historic and "pull_request:" not in historic and "workflow_dispatch:" in historic,"closed Release 461 source workflow must be manual-only")
req("python scripts/release462_autonomous_quality_gate.py" in system,"System Gate missing Release 462 application authority")

for path in ("AI_HANDOFF.md","PROJECT_STATUS_AND_ROADMAP.md","MARKDOWN_INDEX.md","SANITY_HEALTH_CHECK.md","docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md","docs/operations/RELEASE_462_AUTONOMOUS_QUALITY_AUTHORITY.md","release463-environment.json"):
    req((ROOT/path).is_file(),f"canonical authority missing: {path}")

print("PLATFORM FORWARD SANITY")
print(f"Application release: 462 — {label}")
print("Environment release: 463 — one Pages project, isolated Dev/Production D1 + R2")
print("Development D1 schema authority: Release 461 proven/unchanged")
print("Release 462 D1 migration: NONE")
print("Provider execution/publication and raw CAIP delete: CLOSED")
if FAIL:
    for i,item in enumerate(FAIL,1): print(f"{i:03d}. FAIL — {item}")
    raise SystemExit(1)

print("PLATFORM FORWARD SANITY: PASS")

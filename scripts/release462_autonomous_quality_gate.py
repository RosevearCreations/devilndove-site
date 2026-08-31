#!/usr/bin/env python3
"""Release 462 source-only autonomous quality gate under Release 463 environment authority.

This gate deliberately avoids Cloudflare, provider and Production network calls.
It verifies the twelve autonomous workstreams and then runs the existing public
SEO authorities locally. Release 463 owns the current single-project environment.
"""
from __future__ import annotations
import json, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]

def read(path:str)->str:
    p=ROOT/path
    if not p.is_file():
        FAIL.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="replace")

def req(value,msg):
    if not value:
        FAIL.append(msg)

release=json.loads(read("development-release.json"))
policy=release.get("release_policy",{})
db=release.get("current_release_database_state",{})

# 1. Application-wide current authority / no accidental migration event.
req(release.get("environment")=="development" and release.get("branch")=="dev","Release 462 application source must remain Development/dev")
req(int(release.get("release") or 0)==462,"current application release must remain 462")
req(release.get("pages_project")=="devilndove-site","Development must use Preview of the canonical devilndove-site Pages project")
req(release.get("pages_environment")=="preview","Development Pages environment must be Preview")
req(int(release.get("development_infrastructure",{}).get("d1",{}).get("schema_current_through_release") or 0)==461,"Release 462 must carry the proven Release 461 D1 schema without pretending to migrate")
req(db.get("new_migration_required") is False and release.get("current_release_migrations")==[],"Release 462 must remain source-only/no-new-migration")
req(db.get("historical_migration_replay") is False and db.get("automatic_replay_path") is False,"historical/automatic migration replay must remain closed")

# 2. Finance / Accounting: statement-import schema ownership stays migration-owned.
statement=read("functions/api/admin/_accountingStatementImports.js")
req("ensureAccountingStatementImportsTables" in statement and "PRAGMA table_info" in statement and "PRAGMA index_list" in statement,"Accounting statement-import read-only schema assertion missing")
for ddl in ("CREATE TABLE","ALTER TABLE","DROP TABLE","CREATE INDEX","DROP INDEX"):
    req(ddl not in statement.upper(),f"Accounting statement-import helper contains request-time DDL: {ddl}")
req("release462-admin-quality.css" in read("admin/accounting/index.html"),"Accounting responsive Release 462 layer missing")

# 3. Inventory / Tools / Supplies: base-unit authority remains explicit.
inventory_api=read("functions/api/admin/site-item-inventory.js")
inventory_ui=read("public/js/admin-site-item-inventory.js")
req("quantity_authority" in inventory_api and "base" in inventory_api.lower(),"Inventory API no longer exposes base quantity authority")
req("quantity_authority" in inventory_ui or "base" in inventory_ui.lower(),"Inventory UI lost base-unit awareness")
req("base-unit" in read("admin/inventory-operations/index.html").lower(),"Inventory workspace does not explain base-unit authority")

# 4. Product / Storefront.
req((ROOT/"functions/api/admin/product-image-quality.js").is_file(),"Product image-quality authority missing")
req((ROOT/"functions/api/admin/storefront-merchandising.js").is_file(),"Storefront merchandising admin authority missing")
storefront=read("admin/storefront-merchandising/index.html")
req("Release 462" in storefront and "one-H1" in storefront,"Storefront Release 462/SEO guidance missing")
req((ROOT/"public/js/admin-storefront-merchandising.js").is_file(),"Storefront merchandising UI missing")

# 5. SEO/public-facing quality: executed below with canonical gates.
req((ROOT/"scripts/public_seo_gate.py").is_file() and (ROOT/"scripts/public_seo_depth_gate.py").is_file(),"SEO gates missing")

# 6. CAIP source-preserving workflow.
caip=read("admin/creative-assets/index.html")
req("raw R2 deletion remains closed" in caip and "provider execution" in caip.lower(),"CAIP source/provider boundary guidance missing")
req((ROOT/"functions/api/admin/caip-production-pipeline.js").is_file(),"CAIP production-pipeline API missing")
req((ROOT/"functions/api/admin/caip-content-handoff.js").is_file(),"CAIP reviewed handoff API missing")

# 7. Creators / Content Studio.
content=read("admin/content-studio/index.html")
req("Nothing publishes automatically" in content and "Linked by reference" in content,"Content Studio review/source-reference guidance missing")
req((ROOT/"functions/api/admin/content-studio.js").is_file(),"Content Studio API missing")

# 8. I.T. integration administration.
it_api=read("functions/api/admin/it-provider-setup-guide.js")
it_ui=read("public/js/admin-it-provider-setup-guide.js")
req("secret_values_emitted:false" in it_api and "provider_execution_allowed:false" in it_api and "provider_publication_allowed:false" in it_api,"I.T. provider guide must remain redacted/nonexecuting")
req("next_action" in it_api and "operator_input_required" in it_api and "Next external acceptance step" in it_ui,"I.T. correction/next-step guidance missing")

# 9. Stripe / PayPal preparation without transactions.
payment=read("functions/api/_lib/paymentExecution.js")
payment_public=read("functions/api/payment-providers.js")
req("PAYMENT_PROVIDER_EXECUTION_MODE" in payment and "development-explicit" in payment,"Payment operator gate missing")
req("production_execution: false" in payment,"Production payment execution boundary drifted")
req("PAYPAL_SECRET" in it_api and "PAYPAL_CLIENT_SECRET" not in it_api,"PayPal setup guide must match the actual PAYPAL_SECRET runtime contract")
req("paymentExecutionStatus" in payment_public,"Public payment readiness is not using guarded execution status")

# 10. Responsive/admin UX.
responsive=read("css/release462-admin-quality.css")
for selector in (".release462-status-strip",".dd-admin-responsive-actions","@media(max-width:760px)"):
    req(selector in responsive,f"Release 462 responsive layer missing {selector}")
for page in ("admin/accounting/index.html","admin/inventory-operations/index.html","admin/storefront-merchandising/index.html","admin/creative-assets/index.html","admin/content-studio/index.html","admin/it-integrations/index.html"):
    req("release462-admin-quality.css" in read(page),f"{page} missing shared Release 462 responsive layer")

# 11. Regression/gate consolidation. Historical release-specific source and remote
# verification workflows are retained only as manual snapshots. Ordinary dev pushes
# must produce one canonical source signal: System Gate.
system=read(".github/workflows/system-gate.yml")
historical_paths=sorted(
    list((ROOT/".github/workflows").glob("release4*-source-gate.yml"))+
    list((ROOT/".github/workflows").glob("release4*-remote-verification.yml"))
)
req(bool(historical_paths),"Historical workflow inventory unexpectedly empty")
for path in historical_paths:
    workflow=path.read_text(encoding="utf-8",errors="replace")
    req("workflow_dispatch:" in workflow and "\n  push:" not in workflow and "\n  pull_request:" not in workflow,
        f"Historical workflow must be manual-only: {path.name}")
req("release462_autonomous_quality_gate.py" in system,"System Gate must run Release 462 autonomous quality authority")
req("actions/checkout@v7" in system and "actions/setup-python@v7" in system and "actions/setup-node@v7" in system,"System Gate actions must use current Node-24-era major versions")
req("Release 459 runtime/provider" not in system and "release459_runtime_acceptance_gate.py" not in system,"System Gate still exposes stale Release 459 current-authority noise")

# 12. Canonical Markdown/documentation.
for path in ("AI_HANDOFF.md","PROJECT_STATUS_AND_ROADMAP.md","SANITY_HEALTH_CHECK.md","MARKDOWN_INDEX.md","docs/operations/RELEASE_462_AUTONOMOUS_QUALITY_AUTHORITY.md"):
    text=read(path)
    req("Release 462" in text,f"{path} is not synchronized to Release 462 application provenance")

# Hard boundaries shared by all twelve under the live Release 463 environment.
req(policy.get("production_promotion")=="controlled_main_promotion","Production promotion must use the controlled main promotion gate")
req(policy.get("blind_dev_to_production_data_overwrite") is False,"Production transactional data must never be overwritten from Development")
req(policy.get("production_transactional_data_owned_by_production") is True,"Production data ownership must remain explicit")
req(policy.get("provider_execution")=="closed" and policy.get("provider_publication")=="closed" and policy.get("provider_live_authorization")=="closed","Provider execution/publication/live authorization must remain closed")
req(policy.get("request_time_schema_mutation")=="forbidden","Request-time schema mutation must remain forbidden")
req(release.get("current_release_evidence",{}).get("raw_caip_r2_delete_enabled") is False,"Raw CAIP R2 deletion must remain disabled")
req("account_id =" not in read("wrangler.toml"),"wrangler.toml must not contain account_id")

if FAIL:
    print("RELEASE 462 AUTONOMOUS QUALITY GATE: FAIL")
    for i,item in enumerate(FAIL,1):
        print(f"{i:02d}. {item}")
    raise SystemExit(1)

# Run stable public-facing authorities only after static Release 462 checks pass.
for script in ("public_seo_gate.py","public_seo_depth_gate.py"):
    print(f"\n=== {script} ===")
    subprocess.run([sys.executable,str(ROOT/"scripts"/script)],cwd=ROOT,check=True)

print("\nRELEASE 462 AUTONOMOUS QUALITY GATE: PASS")
print("Twelve autonomous workstreams: SOURCE-CLOSED")
print("Historical release-specific source/remote workflows: MANUAL SNAPSHOTS ONLY")
print("Release 462 D1 migration: NONE")
print("Release 463 Pages model: devilndove-site Preview(dev) / Production(main)")
print("Future D1 schema changes: VERSIONED MIGRATION, DEV FIRST, PRODUCTION BEFORE DEPENDENT CODE")
print("Production transactional overwrite from Development: FORBIDDEN")
print("Provider/payment execution: CLOSED")
print("Raw CAIP R2 deletion: CLOSED")

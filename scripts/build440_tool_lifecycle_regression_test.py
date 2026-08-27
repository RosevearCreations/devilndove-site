#!/usr/bin/env python3
"""Build 440 source-only regression for Tool lifecycle authority/workspace."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
MIG=ROOT/'database_build440_tool_lifecycle_history.sql'; API=ROOT/'functions/api/admin/tool-lifecycle-review.js'; UI=ROOT/'public/js/admin-tool-lifecycle-review.js'; PAGE=ROOT/'admin/inventory-operations/index.html'; CSS=ROOT/'css/tool-lifecycle-review.css'; INV=ROOT/'functions/api/admin/site-item-inventory.js'
read=lambda p:p.read_text(encoding='utf-8') if p.exists() else ''
mig,api,ui,page,css,inv=map(read,(MIG,API,UI,PAGE,CSS,INV)); checks=[]
def c(ok,label): checks.append((bool(ok),label))
c(MIG.exists() and 'site_tool_lifecycle_profiles' in mig and 'site_tool_lifecycle_events' in mig,'focused migration defines profile + immutable event authorities')
c("'good','needs_attention','out_of_service','retired'" in mig,'condition states are constrained')
c("'inspection','service','repair','condition_change','service_schedule','retired','reactivated'" in mig,'lifecycle event types are constrained')
c('FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory' in mig,'Tool lifecycle remains keyed to existing Inventory identity')
c('site_inventory_usage_movements' in inv and 'consume_usage' in inv and 'tracking_mode' in inv,'reusable usage remains in existing Inventory usage ledger')
c('getAdminUserFromRequest' in api,'Tool lifecycle API is Admin-authenticated')
c('LOWER(TRIM(COALESCE(sii.source_type' in api and "='tool'" in api,'Tool lifecycle API is limited to Tool Inventory rows')
c('site_inventory_usage_movements' in api and 'usage_event_count' in api,'Tool review reads existing reusable usage evidence')
c('LIMIT ? OFFSET ?' in api and 'MAX_LIMIT = 80' in api,'Tool reads are bounded and paginated')
c(not re.search(r'\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX|TRIGGER)\b',api,re.I),'Tool API performs no request-time schema DDL')
c('record_inspection' in api and 'record_service' in api and 'record_repair' in api,'inspection/service/repair actions exist')
c('set_service_schedule' in api and 'service_interval_days' in api and 'next_service_due_at' in api,'service schedule and due-date authority exist')
c("after==='out_of_service'||after==='retired'" in api and 'newDoNot' in api,'out-of-service/retired condition enforces do-not-reuse')
c("action==='reactivate'?0:oldDoNot" in api,'only explicit reactivation can clear an existing do-not-reuse safety flag')
c("action==='retire'||action==='reactivate'" in api and 'inventory_item_profiles' in api,'retire/reactivate synchronizes existing Inventory lifecycle classification')
c('version=version+1' in api and 'WHERE site_item_inventory_id=? AND version=?' in api,'Tool lifecycle writes use optimistic version claim')
c('site_tool_lifecycle_events' in api and 'condition_before' in api and 'condition_after' in api,'lifecycle mutations append before/after evidence')
c('auditAdminAction' in api and 'captureRuntimeIncident' in api,'successful actions are audited and failures observable')
c('onRequestGet' in api and 'onRequestPost' in api,'Tool lifecycle has bounded read and explicit mutation surfaces')
c('toolLifecycleReviewMount' in page and 'admin-tool-lifecycle-review.js?v=440' in page,'Inventory Operations mounts Tool lifecycle workspace')
c('tool-lifecycle-review.css?v=440' in page,'Tool workspace has scoped CSS')
c('Tool Inventory, Condition &amp; Service' in ui and 'One view over the existing authorities' in ui,'UI exposes expanded Tool Inventory, Condition & Service workspace')
c('Record inspection' in ui and 'Record service' in ui and 'Record repair' in ui,'UI exposes lifecycle evidence actions')
c('Retire Tool' in ui and 'Reactivate Tool' in ui,'UI exposes explicit retirement/reactivation')
c('do not reuse' in ui.lower() and 'only explicit Reactivate Tool' in ui,'UI explains fail-closed reuse safety')
c('setInterval' not in ui and 'setTimeout' not in ui,'Tool workspace contains no polling/timer loop')
c('provider' not in re.sub(r'//.*','',ui,flags=re.M).lower() and 'bucket.' not in api.lower(),'Tool lifecycle performs no provider/R2 execution')
c('@media(max-width:900px)' in css and '@media(max-width:620px)' in css,'Tool workspace is responsive on tablet and phone')
c((ROOT/'BUILD440_D1_STRICT_VERIFICATION.sql').exists() and (ROOT/'scripts/build440_development_tool_lifecycle.py').exists(),'Development strict verifier/helper exist')
c("'build_440_tool_lifecycle_history'" in mig,'focused migration is ledgered')
print('BUILD 440 TOOL LIFECYCLE REGRESSION'); print('Cloudflare/D1/R2/provider access: NONE'); print('Production mutation capability: NONE'); print()
failed=0
for i,(ok,label) in enumerate(checks,1): print(f'{i:02d}. {"PASS" if ok else "FAIL"} — {label}'); failed+=0 if ok else 1
print()
if failed: print(f'BUILD 440 TOOL LIFECYCLE REGRESSION: FAIL ({failed}/{len(checks)} failed)'); raise SystemExit(1)
print(f'BUILD 440 TOOL LIFECYCLE REGRESSION: PASS ({len(checks)}/{len(checks)})'); print('Tool identity/stock/usage authority: EXISTING INVENTORY'); print('Tool lifecycle state/history: BUILD 440 FOCUSED AUTHORITY'); print('Out-of-service/retired: DO NOT REUSE ENFORCED'); print('Reactivate: EXPLICIT / AUDITED'); print('PRODUCTION PROMOTION: CLOSED')

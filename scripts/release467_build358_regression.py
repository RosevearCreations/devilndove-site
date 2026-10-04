#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build358-search-console-real-export-fresh-discovery-intake-viii.json')
prev=j('release467-build357-grey-hair-source-review-story-plan-completion-continuity-vi.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/search-console-import.js')
ui=t('public/js/admin-search-console-import.js')
sql=t('scripts/release467_build358_continuity.sql')
verify=t('scripts/release467_build358_verify_continuity.mjs')
wf=t('.github/workflows/release467-build358-search-console-real-export-fresh-discovery-intake-viii.yml')
mw=t('functions/_middleware.js')
products=t('functions/api/products.js')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_355_360.md')

q(a.get('build')==358 and a.get('title')=='Search Console Real Export & Fresh Discovery Intake VIII','Build 358 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 357 Production closure not successor-ingested')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='9d508a74417c1007891d4877c35140d351d51faf' and fc.get('tree_sha')=='78aeaa4e11119620ebf71f264ec84b7939dd4adc','Build 357 exact Development closure missing')
q(pc.get('main_sha')=='f4806249d913fb779c734f332bfb05019c6c6f1b' and pc.get('tree_sha')=='78aeaa4e11119620ebf71f264ec84b7939dd4adc' and pc.get('state')=='PRODUCTION_GREEN','Build 357 Production checkpoint missing')

c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('intake_mode')=='EXPLICIT_OPERATOR_REAL_GSC_CSV_ONLY' and c.get('real_export_confirmation_required') is True,'Build 358 real-export intake mismatch')
q(c.get('freshness_window_days')==30 and c.get('fallback_report_date_required_when_date_column_absent') is True,'Build 358 freshness/date mismatch')
q(c.get('imported_at_must_not_substitute_for_missing_report_date') is True and c.get('created_at_must_not_substitute_for_missing_report_date') is True,'Build 358 timestamp boundary mismatch')
q(c.get('storefront_worker_cpu_hotfix') is True and c.get('public_product_list_row_cap')==120,'Build 358 Worker CPU repair contract mismatch')
q(c.get('next_build')==359 and c.get('next_build_title')=='Maker Story Advancement & Publication Readiness Continuity VII','Build 359 successor mismatch')
q(all(v is False for v in s.values()),'Build 358 safety authority drift')

for token in ('BUILD358_CURRENT_API','searchConsoleFreshness','freshness_window_days:30','REAL_EVIDENCE_STALE_NON_ACTIONABLE',"report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')",'Supply the report end date explicitly','explicit_report_date_only:true','created_at_freshness_fallback:false'):
    q(token in api,'Build 358 Search Console API contract missing '+token)
for token in ('BUILD358_CURRENT_CLIENT','30-day freshness window','Required when the CSV has no Date column','Stale evidence is non-actionable','Import/creation time never substitutes for a report date'):
    q(token in ui,'Build 358 Search Console UI contract missing '+token)

upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 358 measurement must remain read-only: '+forbidden.strip())
for token in ('operator_bound_batches','csv_named_batches','import_audits','revert_audits','invalid_report_date_rows','recent_search_rows','eligible_pairs','stale_or_unsupported_pending_rows','pragma_foreign_key_check'):
    q(token in sql,'Build 358 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_EVIDENCE_STALE_NON_ACTIONABLE','REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY','REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE','freshness_window_days:30','synthetic_rows:false','production_d1_contact:false'):
    q(token in verify,'Build 358 verifier missing '+token)
for token in ('push:','branches: [dev]','D1_ONE_SHOT_EVIDENCE_CAPTURE','REAL EXPORT CONFIRMATION REQUIRED','FRESHNESS WINDOW: 30 DAYS','SYNTHETIC DISCOVERY ROWS: ZERO','PRODUCTION D1 CONTACT: ZERO'):
    q(token in wf,'Build 358 workflow boundary missing '+token)

for token in ("STOREFRONT_FAST_RENDER_REVISION = '467b358-storefront-worker-budget-v1'","function isStorefrontWorkerFastPath","async function withStorefrontFastPlatformClient","X-DND-Storefront-Render-Path","static-fast-path-b358","if (isStorefrontWorkerFastPath(pathname)) return withStorefrontFastPlatformClient"):
    q(token in mw,'Build 358 storefront CPU fast path missing '+token)
q("['/shop/', '/collections/']" in mw,'Build 358 fast path must stay scoped to Shop/Collections')
q('BUILD358_WORKER_CPU_BUDGET' in products and 'LIMIT 120' in products and '.slice(0, 120)' in products,'Build 358 public Products bound missing')
q('WHERE component_product_id IN ({marks})' in products and 'WHERE bs.bundle_product_id IN ({marks})' in products,'Build 358 offer enrichment must remain Product-bounded')

q('Build 358 — Search Console Real Export & Fresh Discovery Intake VIII' in road and 'Build 359 — Maker Story Advancement & Publication Readiness Continuity VII' in road,'Build 358/359 roadmap continuity missing')
q(int(p.get('build') or 0)>=358,'Current pointer must retain Build 358 or successor')
if int(p.get('build') or 0)==358:
    q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==359,'Build 358 current authority/successor mismatch')

for path in ('functions/_middleware.js','functions/api/products.js','functions/api/admin/search-console-import.js','public/js/admin-search-console-import.js','scripts/release467_build358_verify_continuity.mjs'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout)[-1200:])

print('RELEASE 467 BUILD 358 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE VIII')
if F:
    print('FAIL')
    [print('-',x) for x in F]
    sys.exit(1)
print('PASS')
print('Real Search Console evidence only; Shop/Collections use bounded Worker CPU fast path.')

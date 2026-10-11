#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8')
def j(p):return json.loads(t(p))
def q(ok,msg):
 if not ok:F.append(msg)
a=j('release467-build376-search-console-real-export-fresh-discovery-intake-xi.json');prev=j('release467-build375-grey-hair-source-review-story-plan-completion-continuity-ix.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build376_continuity.sql');verify=t('scripts/release467_build376_verify_continuity.mjs');wf=t('.github/workflows/release467-build376-search-console-real-export-fresh-discovery-intake-xi.yml')
api=t('functions/api/admin/project-discovery-overview.js');ui=t('public/js/admin-project-discovery-overview.js');page=t('admin/project-discovery-overview/index.html')
q(a['build']==376 and a['title']=='Search Console Real Export & Fresh Discovery Intake XI','Build 376 identity')
q(prev.get('state')=='PRODUCTION_GREEN','Build 375 Production GREEN predecessor')
q((prev.get('final_closure') or {}).get('dev_sha')=='c59a7a7c82b705462a378d6b5eb4a2aac10cfdfe' and (prev.get('final_closure') or {}).get('tree_sha')=='802af36bd8b3b9c2bcc7a6d7e6791cfb58c9b174','Build 375 development proof')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='8e5400227cb209b9f821aaf987b809062fe3eb87' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='802af36bd8b3b9c2bcc7a6d7e6791cfb58c9b174','Build 375 Production checkpoint')
q(a['predecessor']['development_sha']=='c59a7a7c82b705462a378d6b5eb4a2aac10cfdfe' and a['predecessor']['production_main_sha']=='8e5400227cb209b9f821aaf987b809062fe3eb87','Build 376 predecessor identity')
q(all(v is False for v in a['safety'].values()),'Safety policy')
for x in ('real_export_confirmation_required','explicit_report_date_freshness_rule','freshness_window_days','portfolio_data_read_only','project_agnostic_dashboard','system_wide_portfolio','no_single_project_as_release_target','all_active_projects_visible','per_project_source_coverage'):
 q(bool(a['contract'].get(x)),'System-wide contract '+x)
for x in ('automatic_import','automatic_queue_generation','automatic_seo_wording_generation','automatic_seo_apply'):
 q(a['contract'].get(x) is False,'No automatic Search Console/SEO action '+x)
upper=' '+re.sub(r'--[^\n]*','',sql).upper()+' '
for token in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(token not in upper,'Read-only D1 '+token)
for token in ('operator_bound_batches','csv_named_batches','import_audits','revert_audits','invalid_report_date_rows','recent_search_rows','eligible_pairs','stale_or_unsupported_pending_rows','pragma_foreign_key_check','FROM creative_work_projects w','maker_story_profiles','caip_workspaces','selected_evidence_rows'):q(token in sql,'Measurement '+token)
for token in ('sets.length!==10','EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_EVIDENCE_STALE_NON_ACTIONABLE','REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY','REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE','portfolio={active_projects','project_rows:projects','production_d1_contact:false'):q(token in verify,'Verifier '+token)
for token in ('getAdminUserFromRequest','getDb','creative_work_projects','project_status','story_review_status','search_console_page_queries','report_date IS NOT NULL',"date(report_date)>=date('now','-30 days')",'Cache-Control','read_only:true','production_d1_contact:false'):q(token in api,'Portfolio API '+token)
for token in ('PROJECT_DISCOVERY_PORTFOLIO','apiFetch','project_discovery_overview','creative-process/?project_id=','esc('):q(token in ui,'Portfolio UI '+token)
q('Release 467 • Build 376' in page and 'admin-project-discovery-overview.js?v=467b376' in page,'Portfolio page identity/cache')
q('/admin/project-discovery-overview/' in t('admin/index.html'),'Admin navigation entry')
q('REAL EXPORT CONFIRMATION REQUIRED' in wf and 'SYNTHETIC DISCOVERY ROWS: ZERO' in wf and 'PRODUCTION D1 CONTACT: ZERO' in wf and 'ALL ACTIVE PROJECTS: PROJECT-AGNOSTIC PORTFOLIO' in wf,'Workflow boundary')
q('workflow_dispatch:' in wf and 'branches: [dev]' in wf,'Current workflow active')
q('workflow_dispatch:' in t('.github/workflows/release467-build375-grey-hair-source-review-story-plan-completion-continuity-ix.yml') and 'branches: [dev]' not in t('.github/workflows/release467-build375-grey-hair-source-review-story-plan-completion-continuity-ix.yml'),'Predecessor workflow retired')
q(p['build']>=376 and p['state']=='DEVELOPMENT_GREEN','Current pointer')
if p['build']==376:q(p['next_build']==377 and p['next_build_title']=='Multi-Project Portfolio, Workflow & Evidence Routing Foundation' and p['promotion_state'].endswith('_CANDIDATE_NOT_YET_VERIFIED'),'Successor system-wide scope')
q('Build 377 — Multi-Project Portfolio, Workflow & Evidence Routing Foundation' in t('docs/operations/RELEASE_467_SYSTEM_WIDE_PLATFORM_BUILDS_377_384.md'),'System roadmap')
for path in ('scripts/release467_build376_verify_continuity.mjs','functions/api/admin/project-discovery-overview.js','public/js/admin-project-discovery-overview.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js'):
 r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,capture_output=True);q(r.returncode==0,'Syntax '+path+': '+r.stderr[-550:])
print('RELEASE467_BUILD376_REGRESSION='+('FAIL' if F else 'GREEN'))
if F:[print('-',x) for x in F];sys.exit(1)

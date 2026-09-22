#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def q(x,m):
 if not x:F.append(m)
def t(p):
 f=R/p
 if not f.is_file():F.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def l(p):return json.loads(t(p) or '{}')
p=l('current-development-authority.json')
b=l('release467-build232-manufacturing-outcomes-review-roadmap-renewal.json')
pre=l('release467-build231-workshop-journal-capability-case-study-activation.json')
m=l('migrations/canonical/manifest.json')
sql=t('scripts/release467_build232_measurement.sql')
wf=t('.github/workflows/release467-build232-manufacturing-outcomes-review-roadmap-renewal.yml')
d=t('docs/operations/RELEASE_467_BUILD_232_MANUFACTURING_OUTCOMES_REVIEW_ROADMAP_RENEWAL.md')
s=t('scripts/current_system_gate_provenance_gate.py')
q(p.get('build')==232 and p.get('title')=='Manufacturing Outcomes Review & Roadmap Renewal','pointer identity')
q(p.get('state')=='DEVELOPMENT_GREEN' and p.get('source_authority')=='dev','current pointer must remain verified Development GREEN while Build 232 candidate is tested')
q((p.get('accepted_dev_sha')=='fc65e05083e7dcf52d50a392d650d937988db0b6' and p.get('accepted_dev_tree_sha')=='afc367962b2163105a73c60a1bb14fd06744218e') or (int(p.get('build') or 0)>=233 and p.get('accepted_dev_sha')=='f0067f89f94a9bb7ef7ad14510ec1cfb023d8cb8' and p.get('accepted_dev_tree_sha')=='3fcfd435a8618dc64244f53d0ceca1379878dcdd'),'Build 232 pointer must retain its predecessor boundary or the exact verified Build 232 successor boundary')
q(b.get('build')==232 and b.get('title')=='Manufacturing Outcomes Review & Roadmap Renewal','Build 232 authority identity')
q(b.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 232 state')
pred=b.get('predecessor') or {}
q(pred.get('production_main_sha')=='99af873897334e8eb3b382c898a687bcbe06819a','Build 231 Production predecessor SHA drifted')
q(pred.get('production_tree_sha')=='afc367962b2163105a73c60a1bb14fd06744218e','Build 231 Production predecessor tree drifted')
q(pred.get('state')=='PRODUCTION_GREEN' and pred.get('business_exit')=='HOLD_NO_PUBLISHABLE_EVIDENCE','Build 231 retained Production closure not ingested')
q(pre.get('build')==231,'Build 231 authority missing')
mf=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
q(len(mf)==22 and mf[-1]=='0022_release467_capability_profile_coverage_closure.sql','Build 232 must add no migration')
q(not re.search(r'(?im)^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE|PRAGMA)\b',sql),'Build 232 measurement SQL contains mutation or DDL')
for token in ('products_reviewed','canonical_active_processes','active_custom_requests','manufacturing_lifecycles','proof_versions_total','quote_drafts_total','production_run_qa_checks','knowledge_entries_total','published_project_case_studies','canonical_migrations','foreign_key_violations'):
 q(token in sql,'Build 232 measurement missing '+token)
for token in ('devilndove-dev','25000','release467-build232-manufacturing-outcomes','development-manufacturing-outcomes-measurement'):
 q(token in wf,'Build 232 workflow missing '+token)
q("run_current_contract('scripts/release467_build232_gate.py','Release 467 Build 232')" in s,'Current System Gate must invoke Build 232')
q('Build 224 baseline' in d and '25,000' in d and 'future queue' in d.lower(),'Build 232 operations contract incomplete')
meas=b.get('measurement') or {};succ=b.get('successor_roadmap') or {}
q(meas.get('state') in ('PENDING_EXACT_DEVELOPMENT_MEASUREMENT','EXACT_DEVELOPMENT_MEASURED_GREEN'),'Build 232 measurement state')
if meas.get('state')=='PENDING_EXACT_DEVELOPMENT_MEASUREMENT':
 q(succ.get('state')=='PENDING_BUILD232_MEASUREMENT' and succ.get('future_queue_exhausted') is False,'Build 232 candidate must fail closed before measurement')
else:
 q(meas.get('d1_provider_rows_read') is not None and int(meas.get('d1_provider_rows_read'))<=25000,'Build 232 measured provider budget')
 q(succ.get('state') in ('EVIDENCE_DERIVED_SUCCESSOR_AUTHORIZED','AUTONOMOUS_QUEUE_EXHAUSTED'),'Build 232 measured successor decision missing')
if F:
 print('RELEASE 467 BUILD 232 MANUFACTURING OUTCOMES REVIEW ROADMAP RENEWAL: FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE 467 BUILD 232 MANUFACTURING OUTCOMES REVIEW ROADMAP RENEWAL: PASS')
print('Measurement:',meas.get('state'))
print('Canonical migration: NONE / remains 0001-0022')
print('Future queue decision:',succ.get('state'))

#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build301-first-real-maker-story-adoption-completeness.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build301_real_project_discovery.sql')
wf=t('.github/workflows/release467-build301-first-real-maker-story-adoption-completeness.yml')
q(a.get('build')==301 and a.get('title')=='First Real Maker Story Adoption & Completeness','Build 301 identity mismatch')
q(a.get('phase') in ('DISCOVER_REAL_PROJECT_FACTS','REAL_MAKER_STORY_ADOPTED_COMPLETE'),'Build 301 phase mismatch')
for token in ('creative_work_projects','creative_project_maker_story_profiles','creative_work_events','creative_projects','content_projects','creative_project_evidence_selections'):
    q(token in sql,'Build 301 discovery SQL missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 301 discovery must stay read-only: '+forbidden.strip())
q("D1_ONE_SHOT_EVIDENCE_CAPTURE" in wf and "D1_PROVIDER_ROWS_READ_CEILING: '10000'" in wf,'Build 301 bounded Development measurement contract missing')
q('PRODUCTION D1 CONTACT: ZERO' in wf and 'AUTOMATIC PUBLICATION: ZERO' in wf,'Build 301 safety boundary missing')
q(p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_CONTENT_ADOPTION_BUILDS_301_306.md','Build 301 roadmap pointer mismatch')
q(int(p.get('next_build') or 0)==302,'Build 302 successor pointer missing')
print('RELEASE 467 BUILD 301 FIRST REAL MAKER STORY ADOPTION & COMPLETENESS')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')

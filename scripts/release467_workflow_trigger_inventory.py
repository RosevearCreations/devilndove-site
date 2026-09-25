#!/usr/bin/env python3
from pathlib import Path
import json,re,sys

ROOT=Path(__file__).resolve().parents[1]
WF=ROOT/'.github/workflows'
BASE=ROOT/'data/release467-build257-workflow-baseline.txt'
TRIGGER_NAMES=('pull_request','push','workflow_dispatch','workflow_run','issues','schedule','repository_dispatch','workflow_call','pull_request_target')

def triggers(text):
    found=set()
    m=re.search(r'(?m)^on:\s*\[([^\]]+)\]\s*$',text)
    if m:
        for item in m.group(1).split(','):
            key=item.strip().strip("'\"")
            if key: found.add(key)
    m=re.search(r'(?m)^on:\s*([A-Za-z_][A-Za-z0-9_]*)\s*$',text)
    if m: found.add(m.group(1))
    lines=text.splitlines()
    for i,line in enumerate(lines):
        if re.match(r'^on:\s*$',line):
            for child in lines[i+1:]:
                if child and not child.startswith((' ','\t')): break
                mm=re.match(r'^\s{2}([A-Za-z_][A-Za-z0-9_-]*):',child)
                if mm: found.add(mm.group(1))
            break
    return sorted(found)

def owner(name):
    exact={
      'system-gate.yml':'DEVELOPMENT_SOURCE_SYSTEM',
      'current-application-quality.yml':'DEVELOPMENT_APPLICATION_QUALITY',
      'it-admin-runtime-proof.yml':'DEVELOPMENT_IT_RUNTIME',
      'repository-branch-hygiene.yml':'REPOSITORY_HYGIENE',
      'production-pages-deploy-current.yml':'PRODUCTION_DEPLOY',
      'production-live-resource-integrity-proof.yml':'PRODUCTION_RESOURCE_INTEGRITY',
      'release467-build155-products-production-browser.yml':'PRODUCTION_PRODUCT_BROWSER',
      'release467-build154-products-route-production-proof.yml':'PRODUCTION_PRODUCT_ROUTE',
      'development-runtime-acceptance.yml':'DEVELOPMENT_RUNTIME_ACCEPTANCE',
      'production-rollback-readiness.yml':'PRODUCTION_ROLLBACK_READINESS',
    }
    if name in exact:return exact[name]
    if name.startswith('recovery-') or name.startswith('patch-movie-recovery-'):return 'RECOVERY_OPERATOR_TOOLING'
    if re.match(r'^release467-build\d+',name):return 'RELEASE_BUILD_EVIDENCE'
    if name=='packaging-dropdown-readonly-audit.yml':return 'PACKAGING_READONLY_AUDIT'
    return 'SPECIALIZED_PLATFORM_PROOF'

files=sorted(p for p in WF.iterdir() if p.is_file() and p.suffix in ('.yml','.yaml'))
baseline=[x.strip() for x in BASE.read_text(encoding='utf-8').splitlines() if x.strip()]
current={p.name for p in files}
missing=[x for x in baseline if x not in current]
items=[]
counts={k:0 for k in TRIGGER_NAMES}
other={}
owners={}
for p in files:
    text=p.read_text(encoding='utf-8',errors='replace')
    ts=triggers(text)
    own=owner(p.name)
    owners[own]=owners.get(own,0)+1
    for t in ts:
        if t in counts:counts[t]+=1
        else:other[t]=other.get(t,0)+1
    items.append({'path':'.github/workflows/'+p.name,'triggers':ts,'owner':own})

historical=[x for x in items if x['owner']=='RELEASE_BUILD_EVIDENCE']
historical_broad=[x for x in historical if ('push' in x['triggers'] or 'pull_request' in x['triggers'])]
report={
  'release':467,'build':257,'title':'Workflow Trigger Inventory & Ownership Map',
  'workflow_file_count':len(files),'baseline_file_count':len(baseline),'baseline_missing':missing,
  'trigger_counts':counts,'other_trigger_counts':other,'owner_counts':owners,
  'historical_release_workflows':len(historical),'historical_release_broad_trigger_candidates':len(historical_broad),
  'canonical_owners':{x['path']:x['owner'] for x in items if x['owner'] not in ('RELEASE_BUILD_EVIDENCE','RECOVERY_OPERATOR_TOOLING','SPECIALIZED_PLATFORM_PROOF')},
  'workflow_run_paths':[x['path'] for x in items if 'workflow_run' in x['triggers']],
  'inventory':items,
  'decision':{
    'workflow_disabled':False,'workflow_deleted':False,
    'historical_scope_tightening_authorized_for_build258':True,
    'workflow_run_chains_blanket_duplicate_claim':False,
    'exact_sha_promotion_preserved':True
  }
}
out=json.dumps(report,indent=2,sort_keys=True)
if len(sys.argv)>1:Path(sys.argv[1]).write_text(out+'\n',encoding='utf-8')
print(out)

#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='ead5fcb06f9b0e849736a66d5032274ca99de830';TREE='22a246a035f421856a705643c59ccb4171854d71';MAIN='0937de81d2610788db5315b675d92c055c9db549'
PROOFS={'system_gate_run':35514290109,'current_application_quality_run':35514290237,'it_admin_runtime_proof_run':35514290207,'branch_hygiene_run':35514290217}
REQUIRED_KEYS=('laser-engraving','3d-printing','cnc-machining','resin','polymer-clay','candles','soap-bath-body','metal-ring-work','wire-wrapping','paracord','lapidary','soldering','forging-heat-work','metal-lathe','cricut-vinyl-htv','apparel-hat-finishing','drinkware-personalization','packaging-labeling','mechanical-automotive-fabrication','photography-content','mixed-media-hybrid','general-workshop')
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build207-workshop-capability-process-taxonomy-expansion.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0008_release467_workshop_process_taxonomy.sql');api=read('functions/api/admin/inventory-process-assignments.js');page=read('admin/inventory-operations/index.html')
req(int(p.get('build') or 0)>=207,'current pointer regressed before Build 207')
req('release467-build207-workshop-capability-process-taxonomy-expansion.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 207 authority')
req(b.get('build')==207 and b.get('state')=='PRODUCTION_GREEN','Build 207 retained authority must be Production GREEN')
final=b.get('final_closure') or {};req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35514290132,'Build 207 exact Development closure drifted')
prod=b.get('production_checkpoint') or {};req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35514481645 and int(prod.get('production_live_resource_integrity_run') or 0)==35514524661 and int(prod.get('build_specific_proof_run') or 0)==35514481601,'Build 207 Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req(len(files)>=8 and files[7]=='0008_release467_workshop_process_taxonomy.sql','Build 207 canonical migration 0008 drifted')
for key in REQUIRED_KEYS:req(key in (mig+read('migrations/canonical/0005_release467_inventory_process_assignment.sql')),f'missing canonical process key {key}')
req('inventory_process_assignments' not in '\n'.join(line for line in mig.splitlines() if not line.lstrip().startswith('--')),'Build 207 migration must not write Tool/Supply assignments')
for token in ('const TAXONOMY_BUILD = 207','taxonomy_authority:\'inventory_processes\'','taxonomy_build:TAXONOMY_BUILD'):req(token in api,f'process API missing {token}')
req('id="workshopProcessTaxonomyBuild207"' in page,'Inventory Operations missing retained Build 207 taxonomy note')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Inventory Operations must retain exactly one H1')
q=subprocess.run(['node','--check',str(ROOT/'functions/api/admin/inventory-process-assignments.js')],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'process API syntax failed: {(q.stderr or q.stdout)[-500:]}')
if FAIL:print('RELEASE 467 BUILD 207 RETAINED WORKSHOP CAPABILITY & PROCESS TAXONOMY CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 207 RETAINED WORKSHOP CAPABILITY & PROCESS TAXONOMY CLOSURE: PASS')

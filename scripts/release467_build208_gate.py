#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='cc76ca21585e0b9a38e2b7f481799963943be056';TREE='7a3583f0f12275d5316b1fc63a3067bc3dd7d74a';MAIN='2d53ff1f65b0252e4c1812766e61577f530dccaa'
PROOFS={'system_gate_run':35515481692,'current_application_quality_run':35515481732,'it_admin_runtime_proof_run':35515481657,'branch_hygiene_run':35515481717}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build208-multi-discipline-public-positioning-capability-navigation.json')
home=read('index.html');shop=read('shop/index.html');custom=read('custom-request/index.html');nav=read('js/main.js')
req(int(p.get('build') or 0)>=208,'current pointer regressed before Build 208')
req('release467-build208-multi-discipline-public-positioning-capability-navigation.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 208 authority')
req(b.get('build')==208 and b.get('state')=='PRODUCTION_GREEN','Build 208 retained authority must be Production GREEN')
final=b.get('final_closure') or {};req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35515481737,'Build 208 exact Development closure drifted')
prod=b.get('production_checkpoint') or {};req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35515609351 and int(prod.get('production_live_resource_integrity_run') or 0)==35515652270 and int(prod.get('build_specific_proof_run') or 0)==35515609321,'Build 208 Production closure drifted')
for label in ('What we make','How we make it','Materials','Occasions & events','Custom Work'):req(label in nav,f'Build 208 navigation missing {label}')
for path,body in (('index.html',home),('shop/index.html',shop),('custom-request/index.html',custom)):req(len(re.findall(r'<h1(?:\s|>)',body,re.I))==1,f'{path} must retain exactly one H1')
req('build208CapabilityNavigation' in home and 'build208ShopCapabilityNavigation' in shop and 'build208CustomDiscovery' in custom,'Build 208 discovery surfaces drifted')
q=subprocess.run(['node','--check',str(ROOT/'js/main.js')],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'shared nav syntax failed: {(q.stderr or q.stdout)[-500:]}')
if FAIL:print('RELEASE 467 BUILD 208 RETAINED PUBLIC POSITIONING CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 208 RETAINED PUBLIC POSITIONING CLOSURE: PASS')

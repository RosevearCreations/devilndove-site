#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='cc76ca21585e0b9a38e2b7f481799963943be056';TREE='7a3583f0f12275d5316b1fc63a3067bc3dd7d74a';MAIN='2d53ff1f65b0252e4c1812766e61577f530dccaa'
PROOFS={'system_gate_run':35515481692,'current_application_quality_run':35515481732,'it_admin_runtime_proof_run':35515481657,'branch_hygiene_run':35515481717}
REQUIRED=('laser-engraving','cricut-vinyl-htv','resin','3d-printing','cnc-machining','metal-lathe','jewelry','paracord','lapidary','candles-soap','packaging-labeling','mechanical-automotive-fabrication')
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build209-workshop-capability-profiles-constraints.json');b208=load('release467-build208-multi-discipline-public-positioning-capability-navigation.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0009_release467_workshop_capability_profiles.sql');pub=read('functions/api/capabilities.js');admin=read('functions/api/admin/workshop-capabilities.js');hub=read('capabilities/index.html');admin_page=read('admin/workshop-capabilities/index.html');js=read('public/js/capabilities.js')
req(p.get('build')==209 and p.get('title')=='Workshop Capability Profiles & Constraints','Build 209 current pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 209 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {};req(prod.get('build')==208 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35515609351 and int(prod.get('production_live_resource_integrity_run') or 0)==35515652270,'Build 208 Production predecessor drifted')
req(b.get('build')==209 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 209 authority drifted');req(b208.get('state')=='PRODUCTION_GREEN','Build 208 must remain Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req(len(files)==9 and files[-1]=='0009_release467_workshop_capability_profiles.sql','canonical migration stream must end at 0009 for Build 209')
req('CREATE TABLE IF NOT EXISTS workshop_capability_profiles' in mig,'Build 209 profile table missing')
req(mig.count('INSERT OR IGNORE INTO workshop_capability_profiles')==12,'Build 209 must seed exactly 12 initial profiles')
for key in REQUIRED:req(f"'{key}'" in mig,f'missing seeded capability {key}')
req("'measured'" in mig and "DEFAULT 'unmeasured'" in mig,'constraint evidence state contract missing')
req('general automotive repair, diagnosis, inspection or safety-critical service promise' in mig,'mechanical no-general-repair boundary missing')
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE'):req(forbidden not in admin.upper(),f'admin API contains request-time DDL {forbidden}')
for token in ('getAdminUserFromRequest','auditAdminAction','workshop_capability_profiles','inventory_processes','related_process_keys','automatic_publication:false'):req(token in admin,f'admin capability authority missing {token}')
for token in ('workshop_capability_profiles','technical_limit_policy:"unknown_until_measured_or_owner_supplied"','related_processes','gallery_href','custom_request_href'):req(token in pub,f'public capability API missing {token}')
req(len(re.findall(r'<h1(?:\s|>)',hub,re.I))==1,'capability hub must have exactly one H1');req(len(re.findall(r'<h1(?:\s|>)',admin_page,re.I))==1,'admin capability page must have exactly one H1')
for key in REQUIRED:
 page=read(f'capabilities/{key}/index.html');req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'capability page {key} must have exactly one H1');req(f'data-capability-key="{key}"' in page,f'capability page {key} missing key binding')
req('/custom-request/' in js and 'Approved public examples' in js,'public profile routing missing')
for path in ('functions/api/capabilities.js','functions/api/admin/workshop-capabilities.js','public/js/capabilities.js','public/js/admin-workshop-capabilities.js','js/main.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-500:]}')
if FAIL:print('RELEASE 467 BUILD 209 WORKSHOP CAPABILITY PROFILES & CONSTRAINTS: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 209 WORKSHOP CAPABILITY PROFILES & CONSTRAINTS: PASS')
print('Initial reviewed capability profiles: 12')
print('Canonical process identity: inventory_processes')
print('Technical limit policy: UNKNOWN UNTIL MEASURED OR OWNER-SUPPLIED')

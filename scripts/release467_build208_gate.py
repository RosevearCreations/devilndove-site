#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='ead5fcb06f9b0e849736a66d5032274ca99de830';TREE='22a246a035f421856a705643c59ccb4171854d71';MAIN='0937de81d2610788db5315b675d92c055c9db549'
PROOFS={'system_gate_run':35514290109,'current_application_quality_run':35514290237,'it_admin_runtime_proof_run':35514290207,'branch_hygiene_run':35514290217}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build208-multi-discipline-public-positioning-capability-navigation.json');b207=load('release467-build207-workshop-capability-process-taxonomy-expansion.json')
home=read('index.html');shop=read('shop/index.html');custom=read('custom-request/index.html');nav=read('js/main.js');css=read('css/styles.css');doc=read('docs/operations/RELEASE_467_BUILD_208_MULTI_DISCIPLINE_PUBLIC_POSITIONING_CAPABILITY_NAVIGATION.md');manifest=load('migrations/canonical/manifest.json')
req(p.get('build')==208 and p.get('title')=='Multi-Discipline Public Positioning & Capability Navigation','Build 208 current pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 208 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {};req(prod.get('build')==207 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35514481645 and int(prod.get('production_live_resource_integrity_run') or 0)==35514524661,'Build 207 Production predecessor drifted')
req(b.get('build')==208 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 208 authority drifted')
req(b207.get('state')=='PRODUCTION_GREEN','Build 207 must remain Production GREEN')
req(len(manifest.get('migrations') or [])==8,'Build 208 must not add a schema migration')
for label in ('What we make','How we make it','Materials','Occasions & events','Custom Work'):req(label in nav,f'shared navigation missing {label}')
for token in ('multi-discipline artisan &amp; maker workshop','build208CapabilityNavigation','What we make','How we make it','Materials','Occasions &amp; use','Custom Work','U.S. sales and shipping remain paused'):req(token in home,f'Home missing Build 208 token: {token}')
for token in ('build208ShopCapabilityNavigation','Browse beyond Product type','What we make','How we make it','Materials','Occasions &amp; use','Custom Work','U.S. sales and shipping remain paused'):req(token in shop,f'Shop missing Build 208 token: {token}')
for token in ('build208CustomDiscovery','You do not need to choose a manufacturing method','What you want made','How it might be made','Material ideas','Occasion or use'):req(token in custom,f'Custom Work missing Build 208 token: {token}')
for path,body in (('index.html',home),('shop/index.html',shop),('custom-request/index.html',custom)):req(len(re.findall(r'<h1(?:\s|>)',body,re.I))==1,f'{path} must retain exactly one H1')
for token in ('/shop/','/collections/','/shop/product/'):req(token in (shop+read('functions/_middleware.js')),f'Storefront route authority missing {token}')
req('capability-navigation-grid' in css,'Build 208 responsive discovery styling missing')
req('<form id="customRequestForm"' in custom and '/public/js/custom-request-intake.js' in custom,'existing Custom Request intake authority drifted')
for token in ('Build 207 is exact-SHA Production GREEN','Five public discovery dimensions','No schema or D1 business-data mutation'):req(token in doc,f'Build 208 doc missing {token}')
q=subprocess.run(['node','--check',str(ROOT/'js/main.js')],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'shared navigation JS syntax failed: {(q.stderr or q.stdout)[-500:]}')
if FAIL:print('RELEASE 467 BUILD 208 MULTI-DISCIPLINE PUBLIC POSITIONING & CAPABILITY NAVIGATION: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 208 MULTI-DISCIPLINE PUBLIC POSITIONING & CAPABILITY NAVIGATION: PASS')
print('Public discovery dimensions: 5')
print('Storefront/Product route authority: PRESERVED')
print('Schema / D1 business-data mutation: ZERO')

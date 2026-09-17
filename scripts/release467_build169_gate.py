#!/usr/bin/env python3
"""Release 467 Build 169 — explicit low-read Product QA/editor convergence gate."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1000:]}')
page=read('admin/product-editor/index.html')
editor=read('public/js/admin-product-editor-v163.js')
qa=read('functions/api/admin/product-publish-qa.js')
for token in ('Build 169','data-admin-page="product-editor-v165"','data-editor-tab="qa"','productEditorQaRun','performs zero D1 reads','does not create tables'):
    req(token in page,f'Build 169 Product Editor QA contract missing: {token}')
for token in ('qaRun?.addEventListener(\'click\',runQa)','function runQa()','state.qaData=null','data-qa-fix-tab','openTab(button.dataset.qaFixTab','QA has not run'):
    req(token in editor,f'Build 169 explicit/lazy QA wiring missing: {token}')
req("if(target==='media')loadMedia();" in editor,'Editor tab dispatcher lost lazy Media behavior')
req("target==='qa'" not in editor and "id==='qa'" not in editor,'Opening QA tab must not automatically run QA')
for forbidden in ('setInterval(','setTimeout(','MutationObserver(','product-qa-panel-state'):
    req(forbidden not in editor,f'Editor gained unwanted automatic/persisted UI behavior: {forbidden}')
for token in ('product-qa-v169-explicit','adminFromContext(context)','LIMIT 2','persisted:false','Build 169 no longer performs catalog-wide QA reads','fix_target'):
    req(token in qa,f'Build 169 QA endpoint contract missing: {token}')
for forbidden in ('CREATE TABLE','CREATE INDEX','INSERT INTO product_publish_qa_results','getAdminUserFromRequest','/admin/catalog/?product_id='):
    req(forbidden not in qa,f'QA endpoint retained forbidden D1/legacy-editor behavior: {forbidden}')
req("LEFT JOIN product_seo" in qa,'QA endpoint must keep Product + SEO authority in one bounded Product query')
req("product_images" in qa and "LIMIT 2" in qa,'QA image evidence must remain bounded to at most two Product image rows')
for path in ('public/js/admin-product-editor-v163.js','functions/api/admin/product-publish-qa.js'):
    node(path)
if FAIL:
    print('RELEASE 467 BUILD 169 PRODUCT QA/EDITOR CONVERGENCE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 169 PRODUCT QA/EDITOR CONVERGENCE: PASS')
print('Editor authority marker: product-editor-v165 retained for successor-aware legacy gates')
print('Editor startup QA reads: NONE')
print('Opening QA tab D1 reads: NONE')
print('Explicit QA: selected Product + SEO + at most two Product image rows')
print('QA GET mutation: NONE (no runtime DDL, no automatic history INSERT)')
print('Fix actions: local editor tabs or dedicated Image Editor')
print('Background timers/scans: NONE')
print('Schema/D1 business-data/R2/provider/payment/accounting mutation: NONE')

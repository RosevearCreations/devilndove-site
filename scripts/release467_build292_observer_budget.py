#!/usr/bin/env python3
"""Build 292 source-level observer/render budget."""
from pathlib import Path
import re,sys,json
R=Path(__file__).resolve().parents[1]
JS=R/'public/js'; FAIL=[]
def q(ok,msg):
    if not ok: FAIL.append(msg)
def t(path): return (R/path).read_text(encoding='utf-8',errors='replace')

files=sorted(JS.rglob('*.js')); observer_files=[]; observer_sites=0; broad_files=[]
for path in files:
    raw=path.read_text(encoding='utf-8',errors='replace'); count=raw.count('new MutationObserver')
    if not count: continue
    rel=str(path.relative_to(R)).replace('\\','/'); observer_files.append(rel); observer_sites+=count
    compact=re.sub(r'\s+','',raw)
    if re.search(r'\.observe\(document\.(?:body|documentElement),\{[^}]*subtree:true',compact): broad_files.append(rel)

checks={
 'public/js/public-heading-guard.js':["records.some(mutationAddsHeading)","pagehide","querySelectorAll('h1')"],
 'public/js/layout-overflow-guard.js':['pendingRoots','observer?.disconnect()','pagehide','addedNodes'],
 'public/js/storefront-discovery-runtime.js':['subtreeNeedsPreparation','scheduleSeoSync','headObserver?.disconnect()','pagehide'],
 'public/js/admin-ergonomics-v237.js':['applyRoot','pendingRoots','addedNodes','pagehide'],
 'public/js/admin-workspace-state.js':['STATUS_SELECTOR','record.addedNodes','pagehide'],
 'public/js/admin-products-enhancements.js':['record.target === tableBody',"observer.observe(tableBody, { childList: true });",'pagehide'],
 'public/js/admin-packaging-label-composition-v43.js':["const main = byId('packagingStudioMain')",'record.addedNodes','pagehide'],
 'public/js/admin-packaging-material-intelligence-v42.js':["byId('packagingStudioMain') || document.querySelector('.packaging-source-editor-body')",'record.addedNodes','pagehide'],
 'public/js/admin-packaging-release-workflow-v83.js':['pagehide'],
 'public/js/admin-packaging-print-source-v299.js':['record.addedNodes','pagehide'],
 'public/js/admin-site-item-inventory-multistation.js':['observer?.disconnect()','pagehide','transforming']
}
for path,tokens in checks.items():
    raw=t(path)
    for token in tokens:q(token in raw,f'{path} missing observer-budget token: {token}')
q('new MutationObserver(apply)' not in t('public/js/admin-ergonomics-v237.js'),'Admin ergonomics may not restore whole-document apply-on-every-mutation behavior')
q('observer.observe(document.body, { childList: true, subtree: true });' not in t('public/js/admin-packaging-label-composition-v43.js'),'Packaging label composition may not observe the whole body')
q('observer.observe(document.body, { childList: true, subtree: true });' not in t('public/js/admin-packaging-material-intelligence-v42.js'),'Packaging material intelligence may not observe the whole body')
q('observer.observe(tableBody, { childList: true, subtree: true });' not in t('public/js/admin-products-enhancements.js'),'Product enhancements may not rescan on descendant-only table mutations')
summary={'observer_files':len(observer_files),'observer_sites':observer_sites,'broad_document_observer_files':len(broad_files),'targeted_hot_paths':len(checks),'hot_path_budget':'ADDED_NODE_FILTERED_OR_DIRECT_CHILD_EVENT_DRIVEN','pagehide_cleanup_required':True,'broad_files':broad_files}
print('RELEASE 467 BUILD 292 OBSERVER / RENDER BUDGET');print(json.dumps(summary,indent=2,sort_keys=True))
if FAIL:
    print('FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('PASS')

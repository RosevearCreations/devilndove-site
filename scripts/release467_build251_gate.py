#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
def node(p):
    x=subprocess.run(['node','--check',str(R/p)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    q(x.returncode==0,f'JS syntax failed {p}: {(x.stderr or x.stdout)[-1200:]}')

a=j('release467-build251-csp-style-injection-surface-hardening.json')
b250=j('release467-build250-startup-provider-read-budget-verification.json')
p=j('current-development-authority.json')
mw=t('functions/_middleware.js')
headers=t('_headers')
pack=t('public/js/admin-packaging-print-source-v299.js')
relpage=t('admin/reliability/index.html')
relcss=t('css/csp-style-surface-v251.css')
road=t('docs/operations/RELEASE_467_REFINEMENT_OUTCOMES_AUTONOMOUS_BUILDS_249_256.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==251 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 251 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='f2eb36f2cae76e44a7e225c38fb4102cf1f9a84d','Build 250 predecessor dev SHA mismatch')
q(pred.get('production_main_sha')=='4bbd5ffdd7063bdc7bb864c416b8a6f08cf2582e','Build 250 predecessor main SHA mismatch')
q(pred.get('development_tree_sha')=='41409f1d0a50793d9dda1f1184a2b8dcc8a2fda1' and pred.get('production_tree_sha')=='41409f1d0a50793d9dda1f1184a2b8dcc8a2fda1','Build 250 predecessor tree mismatch')
q(pred.get('state')=='PRODUCTION_GREEN' and pred.get('same_tree') is True,'Build 250 exact-tree Production GREEN predecessor missing')
q(b250.get('state')=='PRODUCTION_GREEN','Build 250 successor-ingested state must be Production GREEN')

for token in (
    'function cspForNonce(nonce)',
    '"style-src \'self\' \'unsafe-inline\'"',
    '"style-src-elem \'self\' \'nonce-" + nonce + "\'"',
    '"style-src-attr \'unsafe-inline\'"',
    'function cspReportOnlyForNonce(nonce)',
    'function styleNonceBootstrapMarkup()',
    'data-dd-style-nonce-bootstrap-v251',
    'Document.prototype.createElement',
    'String(name||"").toLowerCase()==="style"',
    ".on('style', { element(element) { element.setAttribute('nonce', nonce); } })",
    "headers.set('Content-Security-Policy-Report-Only', cspReportOnlyForNonce(nonce))",
    "headers.set('X-DND-CSP-Revision', '467b251-style-nonce-v1')",
):
    q(token in mw,f'Build 251 middleware missing {token}')
q("script-src 'self' 'unsafe-inline'" not in re.search(r'function cspForNonce\(nonce\)[\s\S]*?\n}',mw).group(0),'Build 245 script nonce hardening regressed')
q("style-src 'self'" in re.search(r'function cspReportOnlyForNonce\(nonce\)[\s\S]*?\n}',mw).group(0),'Build 251 report-only style baseline missing')
q("style-src 'self' 'unsafe-inline'" not in re.search(r'function cspReportOnlyForNonce\(nonce\)[\s\S]*?\n}',mw).group(0),'Build 251 report-only policy must remove broad style unsafe-inline')
q("style-src 'self'; style-src-elem 'self'; style-src-attr 'unsafe-inline'" in headers,'Static report-only style split missing')
q("Content-Security-Policy: default-src 'self';" in headers and "style-src 'self' 'unsafe-inline'" in headers,'Legacy static enforcement fallback must remain intact during Build 251 compatibility phase')

q('function currentCspNonce()' in pack,'Packaging print CSP nonce helper missing')
q('<style nonce="${esc(currentCspNonce())}">' in pack,'Packaging print style must carry inherited CSP nonce')
q('/css/csp-style-surface-v251.css?v=467b251' in relpage,'Reliability same-origin Build 251 stylesheet missing')
q('<style>' not in relpage.lower(),'Reliability inline style block must be removed')
for token in ('.rel-grid{','.rel-score{','.rel-check{','.rel-status{'):
    q(token in relcss,f'Extracted Reliability stylesheet missing {token}')

js_files=list((R/'public/js').glob('*.js'))
create_style=sum(1 for f in js_files if "createElement('style')" in f.read_text(encoding='utf-8',errors='replace'))
text_style=sum(1 for f in js_files if 'style.textContent' in f.read_text(encoding='utf-8',errors='replace'))
raw_style=[]
for f in js_files:
    body=f.read_text(encoding='utf-8',errors='replace')
    if '<style' in body: raw_style.append((f.name,body))
q(create_style>=18,'Expected existing dynamic createElement(style) compatibility surface disappeared unexpectedly')
q(text_style>=15,'Expected existing style.textContent compatibility surface disappeared unexpectedly')
for name,body in raw_style:
    q('<style nonce=' in body,f'Raw JS style markup must be nonce-bearing: {name}')

q('Build 252 — Cross-Device Accessibility Acceptance Refresh' in road,'Build 252 successor missing')
q("run_current_contract('scripts/release467_build251_gate.py','Release 467 Build 251')" in sysgate,'System Gate must invoke Build 251')
pb=int(p.get('build') or 0)
if pb==251:
    q(p.get('next_build')==252 and p.get('state')=='DEVELOPMENT_GREEN','current authority must expose Build 251 and successor 252')
elif pb>=252:
    q(p.get('state')=='DEVELOPMENT_GREEN' and 'release467-build251-csp-style-injection-surface-hardening.json' in (p.get('current_release_authorities') or []),'verified successors must retain Build 251 authority')
else:
    q(False,'current authority must be Build 251 or a verified successor')
if a.get('state')=='PRODUCTION_GREEN':
    final=a.get('final_closure') or {}; prod=a.get('production_checkpoint') or {}
    q(final.get('dev_sha')=='4d0c1c54c407393db5de3b6e3a519ddd7b1ce4dd' and final.get('tree_sha')=='2d6d06e321693779cee55ed2dd892bff3b364a36','Build 251 final Development closure mismatch')
    proofs=final.get('proofs') or {}
    q(proofs.get('system_gate_run')==36030944185 and proofs.get('current_application_quality_run')==36030944073 and proofs.get('it_admin_runtime_proof_run')==36030944009 and proofs.get('dedicated_gate_run')==36030944096,'Build 251 retained PR proof set mismatch')
    q((final.get('branch_hygiene') or {}).get('run_id') is None,'Build 251 must not fabricate unavailable push-only hygiene run ID')
    q(prod.get('main_sha')=='f8e15d07e97e9a4e2953a65d09b494c73a36192a' and prod.get('tree_sha')=='2d6d06e321693779cee55ed2dd892bff3b364a36' and prod.get('state')=='PRODUCTION_GREEN','Build 251 Production closure mismatch')

for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 251 safety drift: {k}')
node('functions/_middleware.js')
node('public/js/admin-packaging-print-source-v299.js')

print('RELEASE 467 BUILD 251 CSP STYLE INJECTION-SURFACE HARDENING')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print(f'Dynamic style compatibility inventory: createElement(style) files={create_style}; style.textContent files={text_style}; raw JS style markup files={len(raw_style)}')
print('Modern style elements: NONCE-BOUND; legacy style attributes: COMPATIBILITY RETAINED')
print('Future queue: OPEN; next Build 252')

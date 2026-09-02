#!/usr/bin/env python3
"""Release 467 Build 17 — fail-closed no-silent-placeholder gate."""
from __future__ import annotations
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
REGISTRY=ROOT/'release467-build17-placeholder-registry.json'
CRITICAL=[
 'admin/creator-content-completeness/index.html',
 'public/js/admin-creator-content-completeness.js',
 'functions/api/admin/creator-content-completeness.js',
 'functions/api/admin/marketplace-presets.js',
 'custom-request/index.html',
 'functions/api/custom-request-examples.js',
 'public/js/product-detail-parity.js',
 'public/js/shop-parity.js',
 'public/js/storefront-parity.js',
]
MARKERS=['coming soon','tbd','todo','fallback_empty','temporarily unavailable','placeholder content']

def fail(msg): FAIL.append(msg)
def read(path):
 p=ROOT/path
 if not p.is_file(): fail(f'missing critical file: {path}'); return ''
 return p.read_text(encoding='utf-8',errors='replace')
try: registry=json.loads(REGISTRY.read_text(encoding='utf-8'))
except Exception as e: registry={};fail(f'invalid placeholder registry: {e}')
if registry.get('release')!=467 or registry.get('build')!=17: fail('placeholder registry identity drifted')
if registry.get('policy')!='NO_SILENT_PLACEHOLDERS': fail('placeholder registry policy drifted')
if registry.get('invented_marketing_fallback_allowed') is not False: fail('invented marketing fallback must remain forbidden')
entries=registry.get('entries') if isinstance(registry.get('entries'),list) else []
registered={(str(e.get('path','')),str(e.get('marker','')).lower()):e for e in entries if isinstance(e,dict)}
for key,e in registered.items():
 for field in ('path','marker','reason','owner','remediation'):
  if not str(e.get(field,'')).strip(): fail(f'registry entry missing {field}: {key}')
 if e.get('allows_invented_content') is not False: fail(f'registry entry allows invented content: {key}')
 body=read(e.get('path',''))
 if str(e.get('marker','')).lower() not in body.lower(): fail(f'stale placeholder waiver no longer matches source: {key}')
for path in CRITICAL:
 body=read(path)
 # Input hints are UX labels, not runtime fallback content.
 scrubbed=re.sub(r'\splaceholder\s*=\s*(["\']).*?\1','',body,flags=re.I|re.S)
 lower=scrubbed.lower()
 for marker in MARKERS:
  if marker in lower and (path,marker) not in registered:
   fail(f'unregistered critical runtime placeholder/fallback marker: {path} :: {marker}')
# Explicit evidence-only fail-empty semantics must not be inverted.
examples=read('functions/api/custom-request-examples.js')
if 'invented_claims:false' not in examples: fail('custom request evidence fallback must explicitly keep invented_claims:false')
for body_path in ('functions/api/admin/creator-content-completeness.js','functions/api/admin/marketplace-presets.js'):
 body=read(body_path).upper()
 for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE'):
  if ddl in body: fail(f'Build 17 runtime endpoint contains request-time DDL: {body_path} :: {ddl}')
if FAIL:
 print('FAIL Release 467 Build 17 no-silent-placeholder gate')
 [print(f'- {x}') for x in FAIL]
 sys.exit(1)
print('PASS Release 467 Build 17 no-silent-placeholder gate')
print(f'critical_paths={len(CRITICAL)}')
print(f'registered_explicit_fallbacks={len(entries)}')
print('invented_marketing_fallback=BLOCKED')
print('reason_owner_remediation=REQUIRED')

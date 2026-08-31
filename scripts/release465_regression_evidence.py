#!/usr/bin/env python3
"""Emit compact machine-readable Release 465 regression evidence."""
from __future__ import annotations
import argparse,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sha(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
def source_metrics():
 roots=['functions','public/js','js','css','admin','shop','collections','collages']; count=total=0
 for name in roots:
  root=ROOT/name
  if not root.exists(): continue
  for p in root.rglob('*'):
   if p.is_file() and p.suffix.lower() in {'.js','.mjs','.css','.html'}: count+=1;total+=p.stat().st_size
 return {'runtime_source_files':count,'runtime_source_bytes':total}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--output',default='release465-regression-evidence.json');ap.add_argument('--source-sha',default='');ap.add_argument('--preview-url',default='');ap.add_argument('--d1-authority',default='');a=ap.parse_args()
 release=json.loads((ROOT/'development-release.json').read_text());manifest=json.loads((ROOT/'migrations/canonical/manifest.json').read_text());b1=json.loads((ROOT/'release465-build1-storefront-quality.json').read_text());b2=json.loads((ROOT/'release465-build2-inventory-creator-intelligence.json').read_text());b3=json.loads((ROOT/'release465-build3-financial-it-hardening.json').read_text());d1={}
 if a.d1_authority and Path(a.d1_authority).is_file(): d1=json.loads(Path(a.d1_authority).read_text())
 out={'kind':'release465-regression-evidence.json','release':465,'build':3,'source_sha':a.source_sha,'preview_url':a.preview_url,'convergence_state':release.get('convergence_state'),'build_states':{'build1':b1.get('state'),'build2':b2.get('state'),'build3':b3.get('state')},'canonical_migration_count':len(manifest.get('migrations',[])),'canonical_migrations':[x.get('file') for x in manifest.get('migrations',[])],'migration_manifest_sha256':sha('migrations/canonical/manifest.json'),'performance_budget_sha256':sha('release465-performance-budget.json'),'source_metrics':source_metrics(),'d1_authority':d1,'safety':{'provider_execution':False,'provider_publication':False,'inventory_mutation':False,'accounting_posting':False,'production_mutation':False,'raw_r2_delete':False,'request_time_schema_ddl':False}}
 Path(a.output).write_text(json.dumps(out,indent=2,sort_keys=True)+'\n',encoding='utf-8');print(json.dumps(out,indent=2,sort_keys=True))
if __name__=='__main__': main()

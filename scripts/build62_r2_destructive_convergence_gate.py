#!/usr/bin/env python3
"""Build 62 guard: Production R2 business media can never be destructively converged to Development."""
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL=[]

def req(ok,msg):
    if not ok: FAIL.append(msg)

def read(path):
    return (ROOT/path).read_text(encoding='utf-8',errors='replace')

legacy=read(Path('functions/api/admin/release463-r2-sync.js'))
authority=json.loads(read(Path('release467-build62-production-r2-object-recovery-destructive-convergence-firewall.json')))
workflow=read(Path('.github/workflows/build62-r2-recovery-discovery.yml'))
quality=read(Path('scripts/current_application_quality_gate.py'))

req(authority.get('incident',{}).get('release463_product_deleted_destination_only')==1190,'Build 62 authority must preserve the 1,190-object Production deletion incident evidence')
req(authority.get('recovery_policy',{}).get('development_may_never_define_production_r2_deletion_set') is True,'Production R2 ownership policy missing')
req(authority.get('recovery_policy',{}).get('delete_mode')=='FORBIDDEN','Production recovery delete mode must be FORBIDDEN')
req(authority.get('recovery_policy',{}).get('production_media_is_production_owned_business_data') is True,'Production media must be classified as Production-owned business data')

for token in ('destination.delete(', 'destination.put(', 'sourceObject.body'):
    req(token not in legacy, f'historical Release 463 R2 route retains mutation implementation token: {token}')
req("action === 'copy_keys' || action === 'delete_keys'" in legacy,'historical copy/delete calls must explicitly fail closed')
req("code: 'historical_r2_mutation_retired'" in legacy,'historical mutation retirement code missing')
req("mutation_capability: 'none'" in legacy,'historical R2 route must expose no mutation capability')
req("production_r2_mutation: false" in legacy,'historical R2 route must explicitly report no Production mutation')

# Recovery discovery is deliberately read-only. Prevent accidental PUT/DELETE HTTP methods or Wrangler object mutation commands.
for pattern,label in (
    (r"method\s*=\s*['\"](?:PUT|DELETE|POST|PATCH)['\"]",'write HTTP method'),
    (r'wrangler[^\n]+r2\s+object\s+(?:put|delete)', 'Wrangler R2 object mutation'),
    (r'/objects/[^\n]+\s+-X\s+(?:PUT|DELETE)', 'Cloudflare R2 REST mutation'),
):
    req(re.search(pattern,workflow,re.I) is None,f'Build 62 recovery discovery contains {label}')
req("'mutation':'NONE'" in workflow and "R2 put/copy/delete: NONE" in workflow,'recovery workflow read-only boundary missing')
req('build62_r2_destructive_convergence_gate.py' in quality,'current Quality gate must enforce Build 62 Production R2 ownership firewall')

# Repository-wide active workflow safety: no current workflow may calculate a destination-only Production deletion set.
for path in (ROOT/'.github/workflows').glob('*.yml'):
    text=path.read_text(encoding='utf-8',errors='replace')
    req('delete_keys=sorted(set(destination)-set(source))' not in text,f'{path.name} retains destructive destination-only R2 convergence')
    req("call(bucket,'delete_keys'" not in text,f'{path.name} retains destructive R2 delete call')

if FAIL:
    print('BUILD 62 R2 DESTRUCTIVE-CONVERGENCE FIREWALL: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('BUILD 62 R2 DESTRUCTIVE-CONVERGENCE FIREWALL: PASS')
print('Production R2 destination-only objects: PRESERVE')
print('Development-defined Production deletion set: FORBIDDEN')
print('Historical Release 463 copy/delete route: RETIRED')
print('Build 62 recovery discovery: READ-ONLY')

#!/usr/bin/env python3
"""Build a read-only Production reliability/SLO snapshot from D1 and Pages control-plane evidence."""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def find_row(value, keys):
    rows=[]
    def walk(v):
        if isinstance(v,dict):
            if all(k in v for k in keys): rows.append(v)
            for child in v.values(): walk(child)
        elif isinstance(v,list):
            for child in v: walk(child)
    walk(value)
    if not rows: raise SystemExit(f'health evidence row not found: {keys}')
    return rows[0]


def fk_rows(value):
    found=[]
    def walk(v):
        if isinstance(v,dict):
            if isinstance(v.get('results'),list):
                found.extend(x for x in v['results'] if isinstance(x,dict) and any(k in x for k in ('table','parent','fkid','foreign_key')))
            for child in v.values(): walk(child)
        elif isinstance(v,list):
            for child in v: walk(child)
    walk(value)
    return found


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--d1',required=True);p.add_argument('--fk',required=True);p.add_argument('--project',required=True);p.add_argument('--source-sha',required=True);p.add_argument('--output',required=True)
    a=p.parse_args()
    keys=('app_modules','canonical_migrations','migration_proofs','release465_triggers','open_critical','open_error')
    row=find_row(json.loads(Path(a.d1).read_text()),keys)
    values={k:int(row[k] or 0) for k in keys}
    fk=fk_rows(json.loads(Path(a.fk).read_text()))
    project=json.loads(Path(a.project).read_text());assert project.get('success') is True,project
    result=project['result'];prod=(result.get('deployment_configs') or {}).get('production') or {};d1=prod.get('d1_databases') or {};r2=prod.get('r2_buckets') or {}
    bindings={
      'd1':(d1.get('DB') or {}).get('id')=='f34a741b-0000-45b0-9a96-6be08754d563',
      'product_r2':(r2.get('PRODUCT_MEDIA_BUCKET') or {}).get('name')=='devilndove-toolshed-images',
      'caip_r2':(r2.get('CAIP_PRIVATE_MEDIA_BUCKET') or {}).get('name')=='devilndove-caip-media'
    }
    checks=[
      ('canonical_migrations',20,values['canonical_migrations']==4),('migration_proofs',10,values['migration_proofs']==4),('publication_triggers',10,values['release465_triggers']==4),('five_modules',10,values['app_modules']==5),('foreign_keys',15,len(fk)==0),('d1_binding',10,bindings['d1']),('product_r2_binding',5,bindings['product_r2']),('caip_r2_binding',5,bindings['caip_r2']),('no_open_critical_incidents',10,values['open_critical']==0),('no_open_error_incidents',5,values['open_error']==0)
    ]
    score=sum(weight for _,weight,passed in checks if passed);status='green' if score>=95 else 'amber' if score>=80 else 'red'
    proof={'release':466,'build':1,'kind':'production-reliability-slo-snapshot','status':status,'score':score,'source_sha':a.source_sha,'scope':'current_snapshot_not_historical_uptime','database':'devilndove-prod-r462','business_rows_read':False,'production_mutation':False,'foreign_key_violations':len(fk),'bindings':bindings,'d1_authority':values,'checks':[{'key':k,'weight':w,'pass':ok} for k,w,ok in checks]}
    Path(a.output).write_text(json.dumps(proof,indent=2,sort_keys=True)+'\n',encoding='utf-8')
    print('RELEASE 466 PRODUCTION RELIABILITY SNAPSHOT:',status.upper(),score)
    print(json.dumps(proof,indent=2,sort_keys=True))
    if status=='red': raise SystemExit(1)

if __name__=='__main__': main()

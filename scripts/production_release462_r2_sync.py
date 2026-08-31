#!/usr/bin/env python3
"""Copy-forward Release 462 R2 convergence from Development buckets to Production.

Never deletes Production objects. Inventory is read-only. Apply copies only missing or
etag/size-different source objects, preserving standard HTTP metadata where Wrangler supports it.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

ACCOUNT_ID = os.environ.get('CLOUDFLARE_ACCOUNT_ID','').strip()
TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN','').strip()
PAIRS = [
    ('PRODUCT_MEDIA_BUCKET','devilndove-toolshed-images-dev','devilndove-toolshed-images'),
    ('CAIP_PRIVATE_MEDIA_BUCKET','devilndove-caip-media-dev','devilndove-caip-media'),
]


def api_json(url: str) -> dict:
    req=urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}','Accept':'application/json'})
    with urllib.request.urlopen(req, timeout=90) as resp:
        payload=json.loads(resp.read().decode('utf-8'))
    if payload.get('success') is False:
        raise RuntimeError(payload)
    return payload


def list_objects(bucket: str) -> dict[str,dict]:
    out={}
    cursor=''
    while True:
        base=f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2/buckets/{urllib.parse.quote(bucket,safe="")}/objects'
        url=base + (f'?cursor={urllib.parse.quote(cursor,safe="")}' if cursor else '')
        payload=api_json(url)
        result=payload.get('result')
        if isinstance(result,list):
            items=result
            next_cursor=(payload.get('result_info') or {}).get('cursor') or ''
        elif isinstance(result,dict):
            items=result.get('objects') or result.get('items') or []
            next_cursor=result.get('cursor') or (payload.get('result_info') or {}).get('cursor') or ''
        else:
            items=[]; next_cursor=''
        for row in items:
            key=str(row.get('key') or '')
            if key:
                out[key]=row
        if not next_cursor or next_cursor==cursor:
            break
        cursor=str(next_cursor)
    return out


def comparable(row: dict) -> tuple:
    return (int(row.get('size') or 0), str(row.get('etag') or '').strip('"'))


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def copy_object(src_bucket: str, dst_bucket: str, key: str, meta: dict, temp_root: Path) -> None:
    safe_name=str(abs(hash((src_bucket,key))))
    path=temp_root / safe_name
    run(['wrangler','r2','object','get',f'{src_bucket}/{key}','--remote','--file',str(path)])
    cmd=['wrangler','r2','object','put',f'{dst_bucket}/{key}','--remote','--file',str(path)]
    http=meta.get('http_metadata') or {}
    mappings=[
        ('contentType','--content-type'),('contentDisposition','--content-disposition'),
        ('contentEncoding','--content-encoding'),('contentLanguage','--content-language'),
        ('cacheControl','--cache-control'),
    ]
    for field,flag in mappings:
        value=http.get(field)
        if value:
            cmd += [flag,str(value)]
    storage=str(meta.get('storage_class') or '')
    if storage in {'Standard','InfrequentAccess'}:
        cmd += ['--storage-class',storage]
    run(cmd)
    try: path.unlink()
    except FileNotFoundError: pass


def inventory() -> tuple[list[dict],int]:
    rows=[]; total_diff=0
    for binding,src,dst in PAIRS:
        s=list_objects(src); d=list_objects(dst)
        missing=[]; changed=[]
        for key,row in s.items():
            other=d.get(key)
            if other is None: missing.append(key)
            elif comparable(row)!=comparable(other): changed.append(key)
        dst_only=sorted(set(d)-set(s))
        total_diff += len(missing)+len(changed)
        rows.append({
            'binding':binding,'source_bucket':src,'destination_bucket':dst,
            'source_count':len(s),'destination_count':len(d),
            'missing_in_production':sorted(missing),'different_in_production':sorted(changed),
            'production_only_count':len(dst_only),'production_only_objects':dst_only,
        })
    return rows,total_diff


def main() -> int:
    ap=argparse.ArgumentParser()
    ap.add_argument('mode',choices=['inventory','apply'])
    ap.add_argument('--output',required=True)
    args=ap.parse_args()
    if not ACCOUNT_ID or not TOKEN:
        raise SystemExit('Cloudflare account/token environment is required')

    before,total=inventory()
    copied=[]
    if args.mode=='apply' and total:
        with tempfile.TemporaryDirectory(prefix='r2-release462-') as td:
            root=Path(td)
            for pair,row in zip(PAIRS,before):
                _,src,dst=pair
                source_meta=list_objects(src)
                for key in row['missing_in_production']+row['different_in_production']:
                    copy_object(src,dst,key,source_meta[key],root)
                    copied.append({'source_bucket':src,'destination_bucket':dst,'key':key})
    after,remaining=inventory()
    if args.mode=='apply' and remaining:
        raise SystemExit(f'R2 convergence incomplete: {remaining} source objects still differ')
    report={'mode':args.mode,'policy':'copy-forward-no-delete','before':before,'copied_count':len(copied),'copied':copied,'after':after,'remaining_source_differences':remaining}
    Path(args.output).write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(f'R2 {args.mode}: source differences before={total}, copied={len(copied)}, remaining={remaining}')
    return 0

if __name__=='__main__':
    raise SystemExit(main())

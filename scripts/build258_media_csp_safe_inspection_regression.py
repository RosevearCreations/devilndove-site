#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,cond):
    checks.append((name,bool(cond)));print(('PASS' if cond else 'FAIL'),name)
def txt(path): return (ROOT/path).read_text(encoding='utf-8',errors='ignore')
js=txt(Path('public/js/admin-media-content-studio.js'))
html=txt(Path('admin/media-content-studio/index.html'))
headers=txt(Path('_headers'))
catalog=json.loads(txt(Path('public/data/media-content-page-catalog.json')))
check('Build 258 admin script cache-busted', 'admin-media-content-studio.js?v=258' in html)
check('Build 258 stylesheet cache-busted', 'styles.css?v=258' in html)
check('Catalog fetch cache-busted', 'media-content-page-catalog.json?v=258' in js)
check('Catalog version advanced', catalog.get('version')==258)
check('Live page is fetched as HTML instead of framed', "fetch(path,{credentials:'same-origin',cache:'no-store',headers:{Accept:'text/html'}})" in js and 'frame.src=path' not in js)
check('Scanner uses inert srcdoc copy', "frame.srcdoc='<!doctype html>'+parsed.documentElement.outerHTML" in js)
check('Scanner strips executable and embedded content', "querySelectorAll('script,iframe,frame,object,embed,form,noscript')" in js)
check('Scanner sandbox does not allow scripts', "setAttribute('sandbox','allow-same-origin')" in js and 'allow-scripts' not in js)
check('Scanner preserves CSS resolution with base URL', "base.setAttribute('href',new URL(path,location.origin).href)" in js)
check('Scanner caps fetched HTML size', '2_000_000' in js)
check('Site anti-framing CSP remains strict', "frame-ancestors 'none'" in headers)
check('Site X-Frame-Options remains DENY', 'X-Frame-Options: DENY' in headers)
check('No D1 migration introduced', (ROOT/'database_upgrade_current_pass.sql').read_bytes()==(ROOT/'database_build256_media_content_studio.sql').read_bytes())
try:
    subprocess.run(['node','--check',str(ROOT/'public/js/admin-media-content-studio.js')],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    check('Admin Media Studio JavaScript syntax',True)
except Exception as exc:
    print(exc);check('Admin Media Studio JavaScript syntax',False)
failed=[n for n,ok in checks if not ok]
print(f'\nBuild 258: {len(checks)-len(failed)}/{len(checks)} checks passed')
if failed:
    print('FAILED:');[print('-',n) for n in failed];sys.exit(1)

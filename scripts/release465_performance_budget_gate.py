#!/usr/bin/env python3
"""Fail-closed Release 465 Build 3 runtime source performance budget."""
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
config=json.loads((ROOT/'release465-performance-budget.json').read_text(encoding='utf-8'))
limits=config['limits']; roots=config['scope_roots']; fail=[]; files=[]; inline=0
for root_name in roots:
 root=ROOT/root_name
 if not root.exists(): continue
 for p in root.rglob('*'):
  if not p.is_file() or any(part in {'.git','node_modules','__pycache__'} for part in p.parts): continue
  if p.suffix.lower() not in {'.js','.mjs','.css','.html'}: continue
  size=p.stat().st_size; rel=p.relative_to(ROOT).as_posix(); files.append((rel,size,p.suffix.lower()))
  if p.suffix.lower() in {'.html','.css','.js','.mjs'}:
   try:inline+=sum(len(x) for x in p.read_text(encoding='utf-8',errors='ignore').split('data:')[1:])
   except Exception: pass
  key={'.js':'max_js_bytes','.mjs':'max_js_bytes','.css':'max_css_bytes','.html':'max_html_bytes'}[p.suffix.lower()]
  if size>int(limits[key]): fail.append(f'{rel} = {size} bytes exceeds {key}={limits[key]}')
total=sum(x[1] for x in files)
if total>int(limits['max_runtime_source_bytes']): fail.append(f'runtime source bytes {total} exceed {limits["max_runtime_source_bytes"]}')
if len(files)>int(limits['max_runtime_source_files']): fail.append(f'runtime source files {len(files)} exceed {limits["max_runtime_source_files"]}')
if inline>int(limits['max_inline_data_uri_bytes']): fail.append(f'inline data URI estimate {inline} exceeds {limits["max_inline_data_uri_bytes"]}')
print('RELEASE 465 PERFORMANCE BUDGET')
print('runtime_files',len(files),'runtime_bytes',total,'inline data URI',inline)
for rel,size,_ in sorted(files,key=lambda x:x[1],reverse=True)[:10]: print(size,rel)
if fail:
 print('FAIL');[print(f'{i:03d}. {m}') for i,m in enumerate(fail,1)];raise SystemExit(1)
print('PASS')

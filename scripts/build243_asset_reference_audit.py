#!/usr/bin/env python3
"""Build 243 local /assets reference audit."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
PAT=re.compile(r'/assets/[A-Za-z0-9_./\-]+')
refs={}
for path in ROOT.rglob('*'):
    if not path.is_file() or any(part in {'.git','node_modules'} for part in path.parts): continue
    try: text=path.read_text(encoding='utf-8',errors='ignore')
    except Exception: continue
    for ref in PAT.findall(text):
        if ref in {'/assets/...','/assets/images/site/','/assets/packaging/artwork/...','/assets/visual-placeholders/'}: continue
        if ref.endswith('/') or not re.search(r'\.(?:png|jpe?g|webp|avif|gif|svg|ico|mp4|mov|m4v|webm|wav|m4a|mp3|aac|pdf|csv|json|woff2?)$', ref, re.I): continue
        refs.setdefault(ref,set()).add(path.relative_to(ROOT).as_posix())
missing=[]
for ref,uses in sorted(refs.items()):
    clean=ref.split('?',1)[0].split('#',1)[0].lstrip('/')
    if not (ROOT/clean).is_file(): missing.append({'asset':ref,'references':sorted(uses)[:20]})
out={'build_label':'Build 243','reference_count':len(refs),'missing_count':len(missing),'missing':missing}
(ROOT/'data/site/build243-asset-reference-audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'reference_count':len(refs),'missing_count':len(missing)},indent=2))
raise SystemExit(1 if missing else 0)

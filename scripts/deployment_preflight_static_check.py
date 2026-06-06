#!/usr/bin/env python3
"""Static deployment preflight for Devil n Dove build zips.

No network and no secrets are required. It validates public HTML title/meta/one-H1 basics,
CSS brace balance, JSON parse health, key files, and local-search wording signals.
It writes data/site/deployment-preflight.json for the admin release pages.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = [
    ('index.html', ['devil', 'dove']),
    ('shop/index.html', ['shop']),
    ('gallery/index.html', ['gallery']),
    ('creations/index.html', ['creations']),
    ('handmade-jewelry-ontario/index.html', ['handmade', 'jewelry', 'ontario']),
    ('polymer-clay-earrings-ontario/index.html', ['polymer', 'clay', 'earrings', 'ontario']),
    ('custom-gifts-southern-ontario/index.html', ['custom', 'gifts', 'ontario']),
    ('laser-engraving-ontario/index.html', ['laser', 'engraving', 'ontario']),
    ('custom-candle-making-ontario/index.html', ['candle', 'ontario']),
    ('custom-soap-making-ontario/index.html', ['soap', 'ontario']),
    ('vintage-finds-ontario/index.html', ['vintage', 'ontario']),
    ('workshop-made-gifts-ontario/index.html', ['workshop', 'gifts', 'ontario']),
]
JSON_FILES = [
    'data/site/seo-page-overrides.json',
    'data/site/local-seo-bake-actions.json',
    'data/site/release-notes.json',
    'data/catalog.json',
]
REQUIRED_FILES = [
    'database_build171_ledger_repair.sql',
    'database_build173_deployment_preflight.sql',
    'admin/deployment-preflight/index.html',
    'functions/api/admin/deployment-preflight.js',
    'public/js/admin-deployment-preflight.js',
    'RELEASE_NOTES.md',
    'SANITY_HEALTH_CHECK.md',
]

def read(path: Path) -> str:
    return path.read_text(encoding='utf-8', errors='ignore') if path.exists() else ''

def clean(text: str) -> str:
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', text)).strip().lower()

def check_pages(checks: list[dict]) -> None:
    page_rows=[]
    for rel, terms in PUBLIC_PAGES:
        path=ROOT/rel
        text=read(path)
        plain=clean(text)
        h1=len(re.findall(r'<h1\b', text, re.I))
        has_title=bool(re.search(r'<title\b[^>]*>.*?</title>', text, re.I|re.S))
        has_meta=bool(re.search(r'<meta\s+[^>]*name=["\']description["\'][^>]*content=', text, re.I)) or bool(re.search(r'<meta\s+[^>]*content=["\'][^"\']+["\'][^>]*name=["\']description["\']', text, re.I))
        missing_terms=[term for term in terms if term not in plain]
        status='pass'
        if not path.exists() or h1 != 1 or not has_title or not has_meta:
            status='fail'
        elif missing_terms:
            status='warn'
        page_rows.append({'path': rel, 'status': status, 'h1_count': h1, 'has_title': has_title, 'has_meta_description': has_meta, 'missing_terms': missing_terms})
    fail=sum(1 for row in page_rows if row['status']=='fail')
    warn=sum(1 for row in page_rows if row['status']=='warn')
    checks.append({'code':'static_public_pages','status':'fail' if fail else ('warn' if warn else 'pass'), 'detail':f'{len(page_rows)} pages checked; {fail} fail, {warn} warn.', 'rows':page_rows})

def check_css(checks: list[dict]) -> None:
    path=ROOT/'css/styles.css'
    text=read(path)
    checks.append({'code':'static_css_balance','status':'pass' if path.exists() and text.count('{')==text.count('}') else 'fail','detail':f'CSS braces {text.count("{")}/{text.count("}")}'})

def check_json(checks: list[dict]) -> None:
    rows=[]
    for rel in JSON_FILES:
        path=ROOT/rel
        ok=False
        error=''
        try:
            json.loads(read(path))
            ok=True
        except Exception as exc:
            error=str(exc)
        rows.append({'path':rel,'ok':ok,'error':error})
    fail=sum(1 for row in rows if not row['ok'])
    checks.append({'code':'static_json_parse','status':'fail' if fail else 'pass','detail':f'{len(rows)} JSON files checked; {fail} failed.', 'rows':rows})

def check_required_files(checks: list[dict]) -> None:
    missing=[rel for rel in REQUIRED_FILES if not (ROOT/rel).exists()]
    checks.append({'code':'static_required_files','status':'fail' if missing else 'pass','detail':'Missing: '+', '.join(missing) if missing else f'{len(REQUIRED_FILES)} required files are present.', 'missing':missing})

def main() -> int:
    checks=[]
    check_required_files(checks)
    check_pages(checks)
    check_css(checks)
    check_json(checks)
    blocker_count=sum(1 for check in checks if check['status']=='fail')
    warning_count=sum(1 for check in checks if check['status']=='warn')
    payload={'build_label':'Build 173','status':'blocked' if blocker_count else ('review' if warning_count else 'ready'),'blocker_count':blocker_count,'warning_count':warning_count,'checks':checks}
    out=ROOT/'data/site/deployment-preflight.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    print(json.dumps({'status':payload['status'],'blockers':blocker_count,'warnings':warning_count}, indent=2))
    return 1 if blocker_count else 0

if __name__ == '__main__':
    raise SystemExit(main())

#!/usr/bin/env python3
"""Static deployment preflight for Devil n Dove build zips.

No network and no secrets are required. It validates public HTML title/meta/one-H1 basics,
canonical links, schema.org JSON-LD validity when present, image alt text, CSS brace balance,
JSON parse health, key files, schema migration files, and local-search wording signals.
It writes data/site/deployment-preflight.json for the admin release pages.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = [
    ('index.html', ['devil', 'dove', 'ontario']),
    ('shop/index.html', ['shop', 'devil', 'dove']),
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
    'data/site/deployment-preflight.json',
    'data/site/release-package-manifest.json',
    'data/site/local-business-schema.json',
    'data/catalog.json',
]
REQUIRED_FILES = [
    'database_build171_ledger_repair.sql',
    'database_build173_deployment_preflight.sql',
    'database_build174_deployment_preflight_detail.sql',
    'database_build175_release_control.sql',
    'database_build176_release_safety_controls.sql',
    'database_build177_deploy_score_and_controls.sql',
    'database_build178_promote_live_controls.sql',
    'database_build179_promotion_control.sql',
    'admin/deployment-preflight/index.html',
    'admin/release-control/index.html',
    'admin/deploy-readiness/index.html',
    'admin/promotion-control/index.html',
    'functions/api/admin/deployment-preflight.js',
    'public/js/admin-deployment-preflight.js',
    'public/js/admin-release-control.js',
    'public/js/admin-deploy-readiness.js',
    'public/js/admin-promotion-control.js',
    'public/js/admin-dashboard-preflight-badge.js',
    'database_build180_go_live_execution.sql',
    'database_build181_live_ops_followthrough.sql',
    'admin/go-live-execution/index.html',
    'admin/live-ops-followthrough/index.html',
    'functions/api/admin/go-live-execution.js',
    'functions/api/admin/live-ops-followthrough.js',
    'functions/api/admin/private-evidence-download.js',
    'public/js/admin-go-live-execution.js',
    'public/js/admin-live-ops-followthrough.js',
    'scripts/generate_release_manifest.py',
    'scripts/regenerate_sanity_from_preflight.py',
    'RELEASE_NOTES.md',
    'SANITY_HEALTH_CHECK.md',
]

def read(path: Path) -> str:
    return path.read_text(encoding='utf-8', errors='ignore') if path.exists() else ''

def clean(text: str) -> str:
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', text)).strip().lower()

def attr(tag: str, name: str) -> str:
    m=re.search(rf'{name}\s*=\s*(["\'])(.*?)\1', tag, re.I|re.S)
    return m.group(2).strip() if m else ''

def title_text(text: str) -> str:
    m=re.search(r'<title\b[^>]*>(.*?)</title>', text, re.I|re.S)
    return clean(m.group(1)) if m else ''

def meta_description(text: str) -> str:
    for tag in re.findall(r'<meta\b[^>]*>', text, re.I|re.S):
        if attr(tag, 'name').lower() == 'description':
            return attr(tag, 'content')
    return ''

def canonical(text: str) -> str:
    for tag in re.findall(r'<link\b[^>]*>', text, re.I|re.S):
        if attr(tag, 'rel').lower() == 'canonical':
            return attr(tag, 'href')
    return ''

def schema_rows(text: str) -> list[dict]:
    out=[]
    for raw in re.findall(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', text, re.I|re.S):
        try:
            data=json.loads(raw.strip())
            out.append({'valid': True, 'type': data.get('@type') if isinstance(data, dict) else 'array'})
        except Exception as exc:
            out.append({'valid': False, 'error': str(exc)})
    return out

def image_alt_rows(text: str) -> list[dict]:
    rows=[]
    for tag in re.findall(r'<img\b[^>]*>', text, re.I|re.S):
        rows.append({'src': attr(tag, 'src'), 'has_alt': bool(attr(tag, 'alt'))})
    return rows

def check_pages(checks: list[dict]) -> None:
    page_rows=[]
    for rel, terms in PUBLIC_PAGES:
        path=ROOT/rel
        text=read(path)
        plain=clean(text)
        h1=len(re.findall(r'<h1\b', text, re.I))
        title=title_text(text)
        meta=meta_description(text)
        canon=canonical(text)
        schemas=schema_rows(text)
        imgs=image_alt_rows(text)
        missing_terms=[term for term in terms if term not in plain]
        status='pass'
        notes=[]
        if not path.exists() or h1 != 1 or not title or not meta:
            status='fail'; notes.append('missing required title/meta/H1/page')
        elif missing_terms or not (30 <= len(title) <= 70) or not (80 <= len(meta) <= 170) or not canon or any(not row['has_alt'] for row in imgs) or any(not row['valid'] for row in schemas):
            status='warn'; notes.append('review SEO length/local/canonical/image/schema details')
        page_rows.append({'path': rel, 'status': status, 'h1_count': h1, 'title_length': len(title), 'meta_description_length': len(meta), 'has_canonical': bool(canon), 'schema_blocks': len(schemas), 'image_count': len(imgs), 'missing_alt_count': sum(1 for row in imgs if not row['has_alt']), 'missing_terms': missing_terms, 'notes': notes})
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

def check_schema_files(checks: list[dict]) -> None:
    schema_needles = [
        'deployment_post_deploy_confirmations',
        'build_174_preflight_detail_manifest',
        'deployment_history',
        'build_175_release_control_center',
        'build_176_release_safety_controls',
        'build_177_deploy_score_and_controls',
        'build_178_promote_live_controls',
        'build_179_promotion_control',
        'promote_live_attempts',
        'recall_notification_release_gates',
        'marketplace_export_download_gates',
        'build_180_go_live_execution',
        'build_181_live_ops_followthrough',
        'private_evidence_download_tokens',
        'marketplace_export_gate_overrides',
    ]
    required = {
        'database_schema.sql': schema_needles,
        'database_full_schema.sql': schema_needles,
        'database_store_schema.sql': schema_needles,
        'database_upgrade_current_pass.sql': schema_needles,
        'database_build174_deployment_preflight_detail.sql': ['deployment_post_deploy_confirmations', 'build_174_preflight_detail_manifest'],
        'database_build175_release_control.sql': ['deployment_history', 'build_175_release_control_center'],
        'database_build176_release_safety_controls.sql': ['safe_deploy_package_downloads', 'local_business_schema_extended_fields', 'build_176_release_safety_controls'],
        'database_build177_deploy_score_and_controls.sql': ['deployment_readiness_scores', 'build_177_deploy_score_and_controls'],
        'database_build178_promote_live_controls.sql': ['deployment_promote_live_checklist', 'build_178_promote_live_controls'],
        'database_build179_promotion_control.sql': ['promote_live_attempts', 'recall_notification_release_gates', 'build_179_promotion_control'],
        'database_build180_go_live_execution.sql': ['product_qa_safe_apply_runs', 'build_180_go_live_execution'],
        'database_build181_live_ops_followthrough.sql': ['private_evidence_download_tokens', 'marketplace_export_gate_overrides', 'build_181_live_ops_followthrough'],
    }
    missing=[]
    detail=[]
    for rel, needles in required.items():
        text=read(ROOT/rel)
        missing_needles=[needle for needle in needles if needle not in text]
        if missing_needles:
            missing.append(rel)
            detail.append(f'{rel}: missing {", ".join(missing_needles)}')
    checks.append({'code':'static_schema_build181','status':'fail' if missing else 'pass','detail':'; '.join(detail) if missing else 'Build 174/175/176/177/178/179/180/181 schema tables and ledger markers found in the correct schema files.', 'missing':missing})

def main() -> int:
    checks=[]
    check_required_files(checks)
    check_schema_files(checks)
    check_pages(checks)
    check_css(checks)
    check_json(checks)
    blocker_count=sum(1 for check in checks if check['status']=='fail')
    warning_count=sum(1 for check in checks if check['status']=='warn')
    payload={'build_label':'Build 181','status':'blocked' if blocker_count else ('review' if warning_count else 'ready'),'blocker_count':blocker_count,'warning_count':warning_count,'checks':checks}
    out=ROOT/'data/site/deployment-preflight.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    print(json.dumps({'status':payload['status'],'blockers':blocker_count,'warnings':warning_count}, indent=2))
    return 1 if blocker_count else 0

if __name__ == '__main__':
    raise SystemExit(main())

#!/usr/bin/env python3
"""Final deployment-blocker checklist for Devil n Dove build zips.

This is intentionally no-network. It catches the recurring release blockers before a zip is handed off:
- Functions/public JavaScript syntax issues
- obvious CSS brace drift
- missing one-H1/title/meta coverage on exposed HTML
- missing core admin/public pages added in recent passes
- missing Markdown handoff files
"""
from __future__ import annotations
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = [
    'README.md','DEVELOPMENT_ROADMAP.md','KNOWN_GAPS_AND_RISKS.md','COMPETITIVE.md','IMAGES.md',
    'DATABASE_SCHEMA_REFERENCE.md','SANITY_HEALTH_CHECK.md','POST_DEPLOY_SMOKE_TEST.md',
    'functions/api/image-derivative.js','functions/api/admin/post-deploy-smoke-tests.js',
    'functions/api/admin/dark-theme-evidence.js','admin/post-deploy-smoke-tests/index.html',
    'database_build177_deploy_score_and_controls.sql','scripts/bake_localbusiness_jsonld.py',
    'admin/live-ops-followthrough/index.html',
    'functions/api/admin/live-ops-followthrough.js',
    'functions/api/admin/private-evidence-download.js',
    'database_build181_live_ops_followthrough.sql',
    'database_build182_mobile_visual_polish.sql',
    'admin/visual-polish/index.html',
    'functions/api/admin/visual-polish.js',
    'public/js/admin-visual-polish.js',
    'database_build183_visual_enrichment_studio.sql',
    'admin/visual-enrichment-studio/index.html',
    'functions/api/admin/visual-enrichment-studio.js',
    'public/js/admin-visual-enrichment-studio.js',
    'data/site/build183-visual-enrichment-studio.json',
    'database_build184_sanity_check_and_value_roadmap.sql',
    'admin/application-sanity/index.html',
    'functions/api/admin/application-sanity.js',
    'public/js/admin-application-sanity.js',
    'data/site/build184-application-sanity.json',
    'database_build185_admin_command_center_value_dashboards.sql',
        'database_build186_markdown_consolidation_visual_placeholders.sql',
    'admin/command-center/index.html',
    'functions/api/admin/command-center.js',
    'public/js/admin-command-center.js',
    'data/site/build185-command-center.json',
    'admin/markdown-sanity/index.html',
    'functions/api/admin/markdown-sanity.js',
    'public/js/admin-markdown-sanity.js',
    'data/site/build186-markdown-sanity.json',
    'PROJECT_STATUS_AND_ROADMAP.md',
    'AI_HANDOFF.md'
]
SKIP = {'.git','node_modules','archive','__pycache__'}

def iter_files(*suffixes: str):
    for path in ROOT.rglob('*'):
        if any(part in SKIP for part in path.parts):
            continue
        if path.is_file() and path.suffix.lower() in suffixes:
            yield path

def js_syntax():
    paths = list((ROOT/'functions').rglob('*.js')) + list((ROOT/'public/js').rglob('*.js')) + list((ROOT/'js').rglob('*.js'))
    def check(path: Path):
        try:
            result = subprocess.run(['node','--check',str(path)], cwd=ROOT, capture_output=True, text=True, timeout=12)
        except subprocess.TimeoutExpired:
            return f'JS syntax timeout: {path.relative_to(ROOT)}'
        if result.returncode:
            return f'JS syntax: {path.relative_to(ROOT)}\n{result.stderr.strip()}'
        return None
    issues=[]
    workers = min(16, max(1, len(paths)))
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(check, path) for path in paths]
        for future in as_completed(futures):
            issue = future.result()
            if issue:
                issues.append(issue)
    return sorted(issues)

def html_checks():
    issues=[]
    for path in iter_files('.html'):
        text=path.read_text(encoding='utf-8',errors='ignore').lower()
        rel=path.relative_to(ROOT)
        if '<h1' not in text or text.count('<h1') != 1:
            issues.append(f'H1 count issue: {rel}')
        if '<title' not in text:
            issues.append(f'Missing title: {rel}')
        if 'name="description"' not in text and "name='description'" not in text:
            issues.append(f'Missing meta description: {rel}')
    return issues

def main() -> int:
    issues=[]
    for rel in REQUIRED_FILES:
        if not (ROOT/rel).exists():
            issues.append(f'Missing required file: {rel}')
    css=ROOT/'css/styles.css'
    if css.exists():
        text=css.read_text(encoding='utf-8',errors='ignore')
        if text.count('{') != text.count('}'):
            issues.append(f'CSS brace drift: {css.relative_to(ROOT)} {text.count("{")} / {text.count("}")}')
    issues.extend(html_checks())
    issues.extend(js_syntax())
    if issues:
        print('FINAL DEPLOYMENT BLOCKER CHECK: FAIL')
        for issue in issues:
            print(f' - {issue}')
        return 1
    print('FINAL DEPLOYMENT BLOCKER CHECK: PASS')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())

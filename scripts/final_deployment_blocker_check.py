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
    'database_build181_live_ops_followthrough.sql'
]
SKIP = {'.git','node_modules','archive','__pycache__'}

def iter_files(*suffixes: str):
    for path in ROOT.rglob('*'):
        if any(part in SKIP for part in path.parts):
            continue
        if path.is_file() and path.suffix.lower() in suffixes:
            yield path

def js_syntax():
    issues=[]
    for path in list((ROOT/'functions').rglob('*.js'))+list((ROOT/'public/js').rglob('*.js'))+list((ROOT/'js').rglob('*.js')):
        result=subprocess.run(['node','--check',str(path)],cwd=ROOT,capture_output=True,text=True)
        if result.returncode:
            issues.append(f'JS syntax: {path.relative_to(ROOT)}\n{result.stderr.strip()}')
    return issues

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

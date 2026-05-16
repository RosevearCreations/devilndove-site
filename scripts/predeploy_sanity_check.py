#!/usr/bin/env python3
"""Local pre-deploy sanity checks for Devil n Dove static/admin build.

Checks:
- exposed HTML pages have exactly one H1, a title, and a meta description
- local script/style/image references exist
- CSS brace counts are balanced enough to catch obvious drift
- public data folders do not contain private Amazon/order import reports

This script does not require network access and is safe to run before zipping/deploying.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

PRIVATE_PATTERNS = [
    re.compile(r"amazon[_ -]?order", re.I),
    re.compile(r"order[_ -]?id", re.I),
    re.compile(r"shipment[_ -]?date", re.I),
    re.compile(r"payment[_ -]?instrument", re.I),
    re.compile(r"buyer[_ -]?name", re.I),
]
PRIVATE_FILENAMES = [
    re.compile(r"amazon.*(match|purchase|order|import).*\.(csv|xlsx|json)$", re.I),
    re.compile(r"orders?_from_.*\.(csv|xlsx|json)$", re.I),
]

SKIP_DIRS = {'.git', 'node_modules', 'archive', '__pycache__'}
LOCAL_REF_RE = re.compile(r'''(?:src|href)=["'](/(?:public/)?(?:js|css|assets|data)/[^"'#?]+)''', re.I)


def read_text(path: Path) -> str:
    return path.read_text(encoding='utf-8', errors='ignore')


def iter_files(root: Path):
    for path in root.rglob('*'):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.is_file():
            yield path


def check_html(root: Path):
    issues = []
    pages = []
    for path in iter_files(root):
        if path.suffix.lower() != '.html':
            continue
        rel = path.relative_to(root).as_posix()
        if rel.startswith('archive/'):
            continue
        text = read_text(path)
        h1_count = len(re.findall(r'<h1\b', text, re.I))
        has_title = bool(re.search(r'<title[^>]*>\s*[^<]+\s*</title>', text, re.I | re.S))
        has_desc = bool(re.search(r'<meta\s+[^>]*name=["\']description["\'][^>]*content=["\'][^"\']+["\']', text, re.I) or re.search(r'<meta\s+[^>]*content=["\'][^"\']+["\'][^>]*name=["\']description["\']', text, re.I))
        pages.append({'path': rel, 'h1_count': h1_count, 'has_title': has_title, 'has_description': has_desc})
        if h1_count != 1 or not has_title or not has_desc:
            issues.append({'type': 'html_seo', 'path': rel, 'h1_count': h1_count, 'has_title': has_title, 'has_description': has_desc})
    return pages, issues


def check_local_refs(root: Path):
    issues = []
    for path in iter_files(root):
        if path.suffix.lower() not in {'.html', '.js', '.css'}:
            continue
        text = read_text(path)
        for match in LOCAL_REF_RE.finditer(text):
            ref = match.group(1)
            target = root / ref.lstrip('/')
            if not target.exists():
                issues.append({'type': 'missing_local_reference', 'path': path.relative_to(root).as_posix(), 'reference': ref})
    return issues


def check_css(root: Path):
    issues = []
    for path in iter_files(root):
        if path.suffix.lower() != '.css':
            continue
        text = read_text(path)
        if text.count('{') != text.count('}'):
            issues.append({'type': 'css_brace_drift', 'path': path.relative_to(root).as_posix(), 'opens': text.count('{'), 'closes': text.count('}')})
    return issues


def check_public_privacy(root: Path):
    issues = []
    data_root = root / 'data'
    if not data_root.exists():
        return issues
    for path in data_root.rglob('*'):
        if not path.is_file():
            continue
        rel = path.relative_to(root).as_posix()
        if any(rx.search(path.name) for rx in PRIVATE_FILENAMES):
            issues.append({'type': 'private_file_in_public_data', 'path': rel})
            continue
        if path.suffix.lower() not in {'.csv', '.json', '.txt', '.md'}:
            continue
        sample = read_text(path)[:10000]
        # Allow README files to mention policies without containing actual order rows.
        if path.name.lower().startswith('readme'):
            continue
        if any(rx.search(sample) for rx in PRIVATE_PATTERNS):
            issues.append({'type': 'possible_private_order_data_in_public_data', 'path': rel})
    return issues


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('root', nargs='?', default='.', help='Build root to check')
    parser.add_argument('--json', action='store_true', help='Print JSON report')
    args = parser.parse_args(argv)
    root = Path(args.root).resolve()

    pages, html_issues = check_html(root)
    ref_issues = check_local_refs(root)
    css_issues = check_css(root)
    privacy_issues = check_public_privacy(root)
    issues = html_issues + ref_issues + css_issues + privacy_issues
    report = {
        'ok': not issues,
        'root': str(root),
        'page_count': len(pages),
        'issue_count': len(issues),
        'issues': issues,
    }
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"Predeploy sanity: {'PASS' if report['ok'] else 'FAIL'}")
        print(f"Pages checked: {len(pages)}")
        print(f"Issues: {len(issues)}")
        for issue in issues[:50]:
            print('-', issue)
    return 0 if report['ok'] else 1


if __name__ == '__main__':
    raise SystemExit(main())

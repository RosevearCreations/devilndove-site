#!/usr/bin/env python3
"""Local pre-deploy sanity checks for Devil n Dove static/admin build.

Checks:
- exposed HTML pages have exactly one H1, a title, and a meta description
- local script/style/image references exist
- CSS brace counts are balanced enough to catch obvious drift
- shared mobile navigation has compact expandable menu assets
- operations admin has the structured-data, sitemap preview, media diagnostics, product image health, Search Console, social publisher, competitive roadmap, and storefront backfill assets
- product editor has draft-first media upload, checklist, image-library reuse, and JSON-safe create-product assets
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



def check_mobile_nav(root: Path):
    issues = []
    main_js = root / 'js' / 'main.js'
    css = root / 'css' / 'styles.css'
    js_text = read_text(main_js) if main_js.exists() else ''
    css_text = read_text(css) if css.exists() else ''
    required_js = ['nav-mobile-toggle', 'mobileNavGroupsMarkup', 'nav-mobile-group', 'aria-expanded']
    required_css = ['.nav-mobile-group', '.nav-mobile-quick-row', '@media (max-width: 860px)']
    missing_js = [token for token in required_js if token not in js_text]
    missing_css = [token for token in required_css if token not in css_text]
    if missing_js:
        issues.append({'type': 'mobile_nav_missing_js_assets', 'path': 'js/main.js', 'missing': missing_js})
    if missing_css:
        issues.append({'type': 'mobile_nav_missing_css_assets', 'path': 'css/styles.css', 'missing': missing_css})
    return issues


def check_operations_assets(root: Path):
    issues = []
    ops = root / 'admin' / 'operations' / 'index.html'
    text = read_text(ops) if ops.exists() else ''
    required = [
        'structuredDataHealthAdminMount',
        'storefrontValueBackfillAdminMount',
        'sitemapPreviewAdminMount',
        'mediaDiagnosticsAdminMount',
        'productImageHealthAdminMount',
        'searchConsoleImportAdminMount',
        'socialPostQueueAdminMount',
        'socialMediaPrivacyGuardAdminMount',
        'competitiveRoadmapAdminMount',
        '/public/js/admin-structured-data-health.js',
        '/public/js/admin-storefront-value-backfill.js',
        '/public/js/admin-sitemap-preview.js',
        '/public/js/admin-media-diagnostics.js',
        '/public/js/admin-product-image-health.js',
        '/public/js/admin-search-console-import.js',
        '/public/js/admin-social-post-queue.js',
        '/public/js/admin-social-media-privacy-guard.js',
        '/public/js/admin-competitive-roadmap.js',
    ]
    missing = [token for token in required if token not in text]
    if missing:
        issues.append({'type': 'operations_missing_admin_assets', 'path': 'admin/operations/index.html', 'missing': missing})
    for ref in [
        'public/js/admin-structured-data-health.js',
        'public/js/admin-storefront-value-backfill.js',
        'public/js/admin-sitemap-preview.js',
        'functions/api/admin/structured-data-health.js',
        'functions/api/admin/storefront-value-backfill.js',
        'functions/api/admin/sitemap-preview.js',
        'functions/api/admin/media-diagnostics.js',
        'functions/api/admin/product-image-health.js',
        'functions/api/admin/search-console-import.js',
        'functions/api/admin/social-post-queue.js',
        'public/js/admin-social-media-privacy-guard.js',
        'functions/api/admin/social-media-privacy-guard.js',
        'functions/api/admin/competitive-roadmap.js',
    ]:
        if not (root / ref).exists():
            issues.append({'type': 'operations_missing_asset_file', 'path': ref})
    search_js = root / 'public' / 'js' / 'admin-search-console-import.js'
    search_api = root / 'functions' / 'api' / 'admin' / 'search-console-import.js'
    search_js_text = read_text(search_js) if search_js.exists() else ''
    search_api_text = read_text(search_api) if search_api.exists() else ''
    required_search_js = ['Generate private SEO actions', 'data-delete-search-console-batch', 'searchConsoleFilterQuery', 'updateActionStatus']
    required_search_api = ['delete_batch', 'generate_recommendations', 'seo_opportunity_actions', 'buildFiltersFromUrl']
    missing_search_js = [token for token in required_search_js if token not in search_js_text]
    missing_search_api = [token for token in required_search_api if token not in search_api_text]
    if missing_search_js:
        issues.append({'type': 'search_console_missing_admin_assets', 'path': 'public/js/admin-search-console-import.js', 'missing': missing_search_js})
    if missing_search_api:
        issues.append({'type': 'search_console_missing_api_assets', 'path': 'functions/api/admin/search-console-import.js', 'missing': missing_search_api})
    social_js = root / 'public' / 'js' / 'admin-social-post-queue.js'
    social_api = root / 'functions' / 'api' / 'admin' / 'social-post-queue.js'
    social_js_text = read_text(social_js) if social_js.exists() else ''
    social_api_text = read_text(social_api) if social_api.exists() else ''
    required_social_js = ['Publish APIs', 'data-social-publish', 'Crafting process update', 'Dry run', 'data-social-dry-run', 'Optional platform-specific captions']
    required_social_api = ['publish_platforms', 'dry_run_platforms', 'publishToFacebook', 'publishToInstagram', 'publishToX', 'getPlatformReadiness', 'buildDryRunPayload']
    missing_social_js = [token for token in required_social_js if token not in social_js_text]
    missing_social_api = [token for token in required_social_api if token not in social_api_text]
    if missing_social_js:
        issues.append({'type': 'social_publisher_missing_admin_assets', 'path': 'public/js/admin-social-post-queue.js', 'missing': missing_social_js})
    if missing_social_api:
        issues.append({'type': 'social_publisher_missing_api_assets', 'path': 'functions/api/admin/social-post-queue.js', 'missing': missing_social_api})
    social_privacy_js = root / 'public' / 'js' / 'admin-social-media-privacy-guard.js'
    social_privacy_api = root / 'functions' / 'api' / 'admin' / 'social-media-privacy-guard.js'
    social_privacy_js_text = read_text(social_privacy_js) if social_privacy_js.exists() else ''
    social_privacy_api_text = read_text(social_privacy_api) if social_privacy_api.exists() else ''
    required_privacy_js = ['Social Media Privacy Guard', 'data-social-privacy-save', 'customer/private media visible']
    required_privacy_api = ['social_media_privacy_rules', 'social_post_privacy_reviews', 'update_queue_privacy', 'requires_explicit_consent']
    missing_privacy_js = [token for token in required_privacy_js if token not in social_privacy_js_text]
    missing_privacy_api = [token for token in required_privacy_api if token not in social_privacy_api_text]
    if missing_privacy_js:
        issues.append({'type': 'social_privacy_guard_missing_admin_assets', 'path': 'public/js/admin-social-media-privacy-guard.js', 'missing': missing_privacy_js})
    if missing_privacy_api:
        issues.append({'type': 'social_privacy_guard_missing_api_assets', 'path': 'functions/api/admin/social-media-privacy-guard.js', 'missing': missing_privacy_api})
    competitive_js = root / 'public' / 'js' / 'admin-competitive-roadmap.js'
    competitive_api = root / 'functions' / 'api' / 'admin' / 'competitive-roadmap.js'
    competitive_md = root / 'COMPETITIVE.md'
    comp_js_text = read_text(competitive_js) if competitive_js.exists() else ''
    comp_api_text = read_text(competitive_api) if competitive_api.exists() else ''
    comp_md_text = read_text(competitive_md) if competitive_md.exists() else ''
    required_competitive_js = ['Competitive Roadmap', 'Seed defaults', 'data-competitive-save']
    required_competitive_api = ['competitive_opportunities', 'DEFAULT_OPPORTUNITIES', 'seedDefaults']
    required_competitive_md = ['Competitive feature matrix', 'Implementation order', 'Build 142 update']
    missing_comp_js = [token for token in required_competitive_js if token not in comp_js_text]
    missing_comp_api = [token for token in required_competitive_api if token not in comp_api_text]
    missing_comp_md = [token for token in required_competitive_md if token not in comp_md_text]
    if missing_comp_js:
        issues.append({'type': 'competitive_roadmap_missing_admin_assets', 'path': 'public/js/admin-competitive-roadmap.js', 'missing': missing_comp_js})
    if missing_comp_api:
        issues.append({'type': 'competitive_roadmap_missing_api_assets', 'path': 'functions/api/admin/competitive-roadmap.js', 'missing': missing_comp_api})
    if missing_comp_md:
        issues.append({'type': 'competitive_markdown_incomplete', 'path': 'COMPETITIVE.md', 'missing': missing_comp_md})
    return issues


def check_product_editor_assets(root: Path):
    issues = []
    product_page = root / 'admin' / 'products' / 'index.html'
    create_js = root / 'public' / 'js' / 'admin-create-product.js'
    create_api = root / 'functions' / 'api' / 'admin' / 'create-product.js'
    page_text = read_text(product_page) if product_page.exists() else ''
    js_text = read_text(create_js) if create_js.exists() else ''
    api_text = read_text(create_api) if create_api.exists() else ''
    required_page = ['Draft mode is intentionally light', 'Save Draft Product', '/public/js/admin-create-product.js', '/public/js/admin-product-draft-checklist.js', 'image_url_6']
    required_js = ['productDraftImageUploader', 'readApiJson', 'PUBLISH_READINESS_CONFIG', '/api/admin/media-upload', 'attachToCurrentProduct', 'MAX_PRODUCT_IMAGES = 7', 'productAutosavePanel', 'dd:product-autosaved-new']
    required_api = ['captureRuntimeIncident', 'draft_mode_relaxed', 'addColumnValue', 'Products table is unavailable']
    missing_page = [token for token in required_page if token not in page_text]
    missing_js = [token for token in required_js if token not in js_text]
    missing_api = [token for token in required_api if token not in api_text]
    if missing_page:
        issues.append({'type': 'product_editor_missing_page_assets', 'path': 'admin/products/index.html', 'missing': missing_page})
    if missing_js:
        issues.append({'type': 'product_editor_missing_js_assets', 'path': 'public/js/admin-create-product.js', 'missing': missing_js})
    if missing_api:
        issues.append({'type': 'product_editor_missing_api_assets', 'path': 'functions/api/admin/create-product.js', 'missing': missing_api})
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
    mobile_nav_issues = check_mobile_nav(root)
    operations_issues = check_operations_assets(root)
    product_editor_issues = check_product_editor_assets(root)
    issues = html_issues + ref_issues + css_issues + privacy_issues + mobile_nav_issues + operations_issues + product_editor_issues
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

# Build 139 note: predeploy checks include social API publisher controls and endpoint helpers.

# Build 142 note: predeploy checks include Operations > Competitive Roadmap and completed COMPETITIVE.md assets.

# Build 145 note: predeploy checks include product editor autosave and seven-total-image upload readiness.

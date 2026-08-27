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
        'mediaConsentRecordsAdminMount',
        'customRequestsAdminMount',
        'competitiveRoadmapAdminMount',
        '/public/js/admin-structured-data-health.js',
        '/public/js/admin-storefront-value-backfill.js',
        '/public/js/admin-sitemap-preview.js',
        '/public/js/admin-media-diagnostics.js',
        '/public/js/admin-product-image-health.js',
        '/public/js/admin-search-console-import.js',
        '/public/js/admin-social-post-queue.js',
        '/public/js/admin-social-media-privacy-guard.js',
        '/public/js/admin-media-consent-records.js',
        '/public/js/admin-custom-requests.js',
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
        'functions/api/admin/media-consent-records.js',
        'functions/api/admin/custom-requests.js',
        'public/js/admin-custom-requests.js',
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
    required_js = ['productDraftImageUploader', 'readApiJson', 'PUBLISH_READINESS_CONFIG', '/api/admin/media-upload', 'attachToCurrentProduct', 'MAX_PRODUCT_IMAGES = 7', 'productAutosavePanel', 'dd:product-autosaved-new', 'productImageRoleChecklist', 'queueCurrentProductSocialPost']
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


def check_product_story_assets(root: Path):
    issues = []
    product_page = root / 'admin' / 'products' / 'index.html'
    story_js = root / 'public' / 'js' / 'admin-product-story-notes.js'
    story_api = root / 'functions' / 'api' / 'admin' / 'product-story-notes.js'
    competitive_md = root / 'COMPETITIVE.md'
    page_text = read_text(product_page) if product_page.exists() else ''
    js_text = read_text(story_js) if story_js.exists() else ''
    api_text = read_text(story_api) if story_api.exists() else ''
    comp_text = read_text(competitive_md) if competitive_md.exists() else ''
    required_page = ['productStoryNotesAdminMount', '/public/js/admin-product-story-notes.js']
    required_js = ['Product story notes', 'seed_from_product', 'Approve safe story']
    required_api = ['product_story_public_notes', 'privacy_status', 'seedFromProduct']
    required_comp = ['Build 146 update', 'product story notes editor']
    missing_page = [token for token in required_page if token not in page_text]
    missing_js = [token for token in required_js if token not in js_text]
    missing_api = [token for token in required_api if token not in api_text]
    missing_comp = [token for token in required_comp if token not in comp_text]
    if missing_page:
        issues.append({'type': 'product_story_missing_page_assets', 'path': 'admin/products/index.html', 'missing': missing_page})
    if missing_js:
        issues.append({'type': 'product_story_missing_js_assets', 'path': 'public/js/admin-product-story-notes.js', 'missing': missing_js})
    if missing_api:
        issues.append({'type': 'product_story_missing_api_assets', 'path': 'functions/api/admin/product-story-notes.js', 'missing': missing_api})
    if missing_comp:
        issues.append({'type': 'competitive_product_story_direction_missing', 'path': 'COMPETITIVE.md', 'missing': missing_comp})
    return issues



def check_product_story_shop_assets(root: Path):
    issues = []
    shop_js = root / 'public' / 'js' / 'shop.js'
    products_api = root / 'functions' / 'api' / 'products.js'
    css = root / 'css' / 'styles.css'
    shop_text = read_text(shop_js) if shop_js.exists() else ''
    api_text = read_text(products_api) if products_api.exists() else ''
    css_text = read_text(css) if css.exists() else ''
    required_shop = ['public_story_snippet', 'shop-card-story']
    required_api = ['enrichProductsWithStoryNotes', 'public_story_snippet', 'product_story_public_notes']
    required_css = ['.shop-card-story', '.dd-product-image-role-checklist', '.dd-product-social-shortcut-panel']
    missing_shop = [token for token in required_shop if token not in shop_text]
    missing_api = [token for token in required_api if token not in api_text]
    missing_css = [token for token in required_css if token not in css_text]
    if missing_shop:
        issues.append({'type': 'shop_story_snippet_missing_assets', 'path': 'public/js/shop.js', 'missing': missing_shop})
    if missing_api:
        issues.append({'type': 'products_api_story_snippet_missing_assets', 'path': 'functions/api/products.js', 'missing': missing_api})
    if missing_css:
        issues.append({'type': 'product_editor_story_media_css_missing', 'path': 'css/styles.css', 'missing': missing_css})
    return issues



def check_product_image_role_assets(root: Path):
    issues = []
    media_js = root / 'public' / 'js' / 'admin-product-images.js'
    media_api = root / 'functions' / 'api' / 'admin' / 'product-images.js'
    search_js = root / 'public' / 'js' / 'site-search.js'
    schema = root / 'database_full_schema.sql'
    js_text = read_text(media_js) if media_js.exists() else ''
    api_text = read_text(media_api) if media_api.exists() else ''
    search_text = read_text(search_js) if search_js.exists() else ''
    schema_text = read_text(schema) if schema.exists() else ''
    required_js = ['product-image-sortable-row', 'IMAGE_ROLE_OPTIONS', 'Apply recommended roles', 'public_use_status', 'consent_record_id']
    required_api = ['image_role', 'public_use_status', 'consent_record_id', 'role_review_notes', 'product_image_role_reference']
    required_search = ['public_story_snippet', 'public_story_summary']
    # The full schema retains the role-reference table; older migration labels are archival metadata, not a live prerequisite.
    required_schema = ['product_image_role_reference']
    missing_js = [token for token in required_js if token not in js_text]
    missing_api = [token for token in required_api if token not in api_text]
    missing_search = [token for token in required_search if token not in search_text]
    missing_schema = [token for token in required_schema if token not in schema_text]
    if missing_js:
        issues.append({'type': 'product_image_role_ui_missing_assets', 'path': 'public/js/admin-product-images.js', 'missing': missing_js})
    if missing_api:
        issues.append({'type': 'product_image_role_api_missing_assets', 'path': 'functions/api/admin/product-images.js', 'missing': missing_api})
    if missing_search:
        issues.append({'type': 'site_search_story_snippet_missing_assets', 'path': 'public/js/site-search.js', 'missing': missing_search})
    if missing_schema:
        issues.append({'type': 'product_image_role_schema_missing_assets', 'path': 'database_full_schema.sql', 'missing': missing_schema})
    return issues


def check_build151_assets(root: Path):
    issues = []
    ops = read_text(root / 'admin' / 'operations' / 'index.html') if (root / 'admin' / 'operations' / 'index.html').exists() else ''
    custom_api = read_text(root / 'functions' / 'api' / 'admin' / 'custom-requests.js') if (root / 'functions' / 'api' / 'admin' / 'custom-requests.js').exists() else ''
    custom_js = read_text(root / 'public' / 'js' / 'admin-custom-requests.js') if (root / 'public' / 'js' / 'admin-custom-requests.js').exists() else ''
    visit_api = read_text(root / 'functions' / 'api' / 'track' / 'visit.js') if (root / 'functions' / 'api' / 'track' / 'visit.js').exists() else ''
    social_api = read_text(root / 'functions' / 'api' / 'admin' / 'social-post-queue.js') if (root / 'functions' / 'api' / 'admin' / 'social-post-queue.js').exists() else ''
    accounting_api = read_text(root / 'functions' / 'api' / 'admin' / 'accounting-close-workflow.js') if (root / 'functions' / 'api' / 'admin' / 'accounting-close-workflow.js').exists() else ''
    schema = read_text(root / 'database_full_schema.sql') if (root / 'database_full_schema.sql').exists() else ''
    checks = [
        ('build151_operations_custom_requests_mount', 'admin/operations/index.html', ['customRequestsAdminMount', '/public/js/admin-custom-requests.js'], ops),
        ('build151_custom_request_conversion_api', 'functions/api/admin/custom-requests.js', ['custom_request_quote_drafts', 'create_quote_draft', 'custom_request_conversion_events'], custom_api),
        ('build151_custom_request_conversion_js', 'public/js/admin-custom-requests.js', ['Quote draft', 'Job draft', 'Product plan'], custom_js),
        ('build151_utm_visit_tracking', 'functions/api/track/visit.js', ['parseUtm', 'utm_campaign', 'site_page_views'], visit_api),
        ('build151_social_utm_conversion_rollups', 'functions/api/admin/social-post-queue.js', ['custom_request_count', 'checkout_starts', 'ensureUtmAnalyticsColumns'], social_api),
        ('build151_accounting_close_csv', 'functions/api/admin/accounting-close-workflow.js', ['format === \'csv\'', 'remittance_evidence_url', 'buildCloseCsv'], accounting_api),
        ('build151_schema_marker', 'database_full_schema.sql', ['build_151_custom_request_conversion_utm_close_export', 'custom_request_quote_drafts'], schema),
        ('build152_custom_request_followup_api', 'functions/api/admin/custom-requests.js', ['custom_request_reply_templates', 'custom_request_payment_candidates', 'create_reply_template', 'create_deposit_candidate', 'create_invoice_candidate'], custom_api),
        ('build152_custom_request_followup_js', 'public/js/admin-custom-requests.js', ['Reply template', 'Deposit candidate', 'Invoice candidate', 'data-copy-reply-template'], custom_js),
        ('build152_hst_reminder_queue', 'functions/api/admin/accounting-close-workflow.js', ['queue_hst_reminder', 'hst_gst_reminder', 'queueNotification'], accounting_api),
        ('build152_schema_marker', 'database_full_schema.sql', ['build_152_custom_request_reply_payment_candidates_hst_reminders', 'custom_request_reply_templates', 'custom_request_payment_candidates'], schema),
        ('build153_custom_quote_preview_api', 'functions/api/admin/custom-requests.js', ['custom_request_quote_share_links', 'create_quote_preview_link', 'quote_preview_links'], custom_api),
        ('build153_custom_quote_preview_js', 'public/js/admin-custom-requests.js', ['Quote preview link', 'data-copy-preview-link', 'renderQuotePreviewLinks'], custom_js),
        ('build153_public_quote_preview_endpoint', 'functions/api/custom-request-quote.js', ['custom_request_quote_share_links', 'quote_preview_accepted', 'quote_preview_declined'], read_text(root / 'functions' / 'api' / 'custom-request-quote.js') if (root / 'functions' / 'api' / 'custom-request-quote.js').exists() else ''),
        ('build153_reference_upload_endpoint', 'functions/api/custom-request-reference-upload.js', ['custom_request_reference_uploads', 'reference_upload_count', 'private_review_only'], read_text(root / 'functions' / 'api' / 'custom-request-reference-upload.js') if (root / 'functions' / 'api' / 'custom-request-reference-upload.js').exists() else ''),
        ('build153_schema_marker', 'database_full_schema.sql', ['build_153_custom_quote_preview_reference_uploads', 'custom_request_quote_share_links', 'custom_request_reference_uploads'], schema),
    ]
    for issue_type, path, tokens, text in checks:
        missing = [token for token in tokens if token not in text]
        if missing:
            issues.append({'type': issue_type, 'path': path, 'missing': missing})
    return issues


def check_build163_assets(root: Path):
    issues = []
    readiness_page = read_text(root / 'admin' / 'readiness' / 'index.html') if (root / 'admin' / 'readiness' / 'index.html').exists() else ''
    readiness_js = read_text(root / 'public' / 'js' / 'admin-product-readiness.js') if (root / 'public' / 'js' / 'admin-product-readiness.js').exists() else ''
    readiness_api = read_text(root / 'functions' / 'api' / 'admin' / 'product-readiness.js') if (root / 'functions' / 'api' / 'admin' / 'product-readiness.js').exists() else ''
    dashboard_html = read_text(root / 'admin' / 'index.html') if (root / 'admin' / 'index.html').exists() else ''
    dashboard_api = read_text(root / 'functions' / 'api' / 'admin' / 'dashboard-summary.js') if (root / 'functions' / 'api' / 'admin' / 'dashboard-summary.js').exists() else ''
    gift_page = read_text(root / 'gift-cards' / 'index.html') if (root / 'gift-cards' / 'index.html').exists() else ''
    css = read_text(root / 'css' / 'styles.css') if (root / 'css' / 'styles.css').exists() else ''
    checks = [
        ('build163_readiness_page_missing_assets', 'admin/readiness/index.html', ['Product Readiness', 'productReadinessAdminMount', '/public/js/admin-product-readiness.js'], readiness_page),
        ('build163_readiness_js_missing_assets', 'public/js/admin-product-readiness.js', ['Product readiness preview', 'productReadinessSummary', 'productReadinessRows', '/api/admin/product-readiness'], readiness_js),
        ('build163_readiness_api_missing_assets', 'functions/api/admin/product-readiness.js', ['buildReadiness', 'missing_required_roles', 'blocked_public_use', 'Product name'], readiness_api),
        ('build163_dashboard_image_counters_missing', 'admin/index.html', ['summaryMissingFeaturedImagesCount', 'summaryMissingImageRolesCount', 'summaryBlockedPublicImagesCount'], dashboard_html),
        ('build163_dashboard_api_image_counters_missing', 'functions/api/admin/dashboard-summary.js', ['products_missing_featured_image_count', 'products_missing_image_roles_count', 'products_blocked_public_images_count'], dashboard_api),
        ('build230_gift_artwork_missing', 'gift-cards/index.html', ['gift-card-visual-card'], gift_page),
        ('build163_css_missing', 'css/styles.css', ['.product-readiness-summary', '.gift-card-hero-split', '.product-readiness-score'], css),
    ]
    for issue_type, path, tokens, text in checks:
        missing = [token for token in tokens if token not in text]
        if missing:
            issues.append({'type': issue_type, 'path': path, 'missing': missing})
    if not (root / 'assets' / 'gift-card-placeholder.svg').exists():
        issues.append({'type': 'build163_gift_placeholder_file_missing', 'path': 'assets/gift-card-placeholder.svg'})
    return issues



def check_build166_assets(root: Path):
    issues = []
    read_text_safe = lambda path: path.read_text(encoding='utf-8', errors='replace') if path.exists() else ''
    assets = {
        'gift_balance_api': read_text_safe(root / 'functions' / 'api' / 'gift-card-balance.js'),
        'gift_actions_api': read_text_safe(root / 'functions' / 'api' / 'admin' / 'gift-card-actions.js'),
        'today_tasks_api': read_text_safe(root / 'functions' / 'api' / 'admin' / 'today-tasks.js'),
        'trust_placements_api': read_text_safe(root / 'functions' / 'api' / 'admin' / 'trust-block-placements.js'),
        'local_seo_api': read_text_safe(root / 'functions' / 'api' / 'admin' / 'local-seo-review.js'),
        'trust_context_js': read_text_safe(root / 'public' / 'js' / 'trust-block-context.js'),
        'local_seo_page': read_text_safe(root / 'admin' / 'local-seo-review' / 'index.html'),
        'product_qa_api': read_text_safe(root / 'functions' / 'api' / 'admin' / 'product-publish-qa.js'),
        'order_stage_photos_api': read_text_safe(root / 'functions' / 'api' / 'admin' / 'custom-order-stage-photos.js'),
        'css': read_text_safe(root / 'css' / 'styles.css'),
    }
    checks = [
        ('build166_gift_balance_api_missing', 'functions/api/gift-card-balance.js', ['gift_cards', 'gift_card_redemptions', 'remaining_amount_cents'], assets['gift_balance_api']),
        ('build166_gift_actions_api_missing', 'functions/api/admin/gift-card-actions.js', ['activate_paid', 'reissue', 'gift_card_admin_events'], assets['gift_actions_api']),
        (
            'today_tasks_current_read_contract_missing',
            'functions/api/admin/today-tasks.js',
            ['readiness metadata', 'today_tasks_read_failed', "owner: 'operations'"],
            assets['today_tasks_api'],
        ),
        ('build166_trust_placements_api_missing', 'functions/api/admin/trust-block-placements.js', ['trust_block_placements', 'page_context', 'is_enabled'], assets['trust_placements_api']),
        ('build166_local_seo_api_missing', 'functions/api/admin/local-seo-review.js', ['local_seo_landing_page_reviews', 'target_keyword', 'review_status'], assets['local_seo_api']),
        ('build166_public_trust_loader_missing', 'public/js/trust-block-context.js', ['/api/trust-blocks', 'public-trust-context-card', 'data-trust-block-context-mount'], assets['trust_context_js']),
        ('build166_local_seo_page_missing', 'admin/local-seo-review/index.html', ['Local SEO review queue', 'localSeoReviewAdminMount', '/public/js/admin-local-seo-review.js'], assets['local_seo_page']),
        ('build166_product_qa_persistence_missing', 'functions/api/admin/product-publish-qa.js', ['product_publish_qa_results', 'fix_url', 'checks_json'], assets['product_qa_api']),
        ('build166_order_stage_photo_moderation_missing', 'functions/api/admin/custom-order-stage-photos.js', ['moderation_status', 'proof_candidate_status', 'multipart/form-data'], assets['order_stage_photos_api']),
        ('build166_css_missing', 'css/styles.css', ['.product-image-crop-handle', '.trust-proof-pill', '.public-trust-context-card', '.candle-soap-spec-public'], assets['css']),
    ]
    for issue_type, path, tokens, text in checks:
        missing = [token for token in tokens if token not in text]
        if missing:
            issues.append({'type': issue_type, 'path': path, 'missing': missing})
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
    product_story_issues = check_product_story_assets(root)
    product_story_shop_issues = check_product_story_shop_assets(root)
    product_image_role_issues = check_product_image_role_assets(root)
    build151_issues = check_build151_assets(root)
    build163_issues = check_build163_assets(root)
    build166_issues = check_build166_assets(root)
    issues = html_issues + ref_issues + css_issues + privacy_issues + mobile_nav_issues + operations_issues + product_editor_issues + product_story_issues + product_story_shop_issues + product_image_role_issues + build151_issues + build163_issues + build166_issues
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

# Build 146 note: predeploy checks include product story notes editor, mobile-create-product fix, and continued draft capture readiness.

# Build 147 note: predeploy checks include shop story snippets, product image role checklist, Product editor social shortcut, and media consent registry.

# Build 148 note: predeploy checks include drag/drop product image ordering, image roles, consent-link fields, and story snippet search assets.

# Build 151 note: predeploy checks include Custom Request conversion actions, UTM attribution joins, and Accounting Close CSV export.

# Build 152 note: predeploy checks include Custom Request reply templates, payment candidates, and HST/GST reminder queue support.

# Build 153 note: predeploy checks include private custom quote previews, customer accept/decline tracking, and reference-image uploads.

# Build 163 note: predeploy checks include product readiness preview, image-health dashboard counters, and gift-card artwork placeholder assets.

# Build 166 note: predeploy checks include gift-card lifecycle endpoints, public trust loader, persisted product QA, local SEO review queue, and order-stage photo moderation.

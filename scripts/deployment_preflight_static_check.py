#!/usr/bin/env python3
"""Static deployment preflight for Devil n Dove build zips.

No network and no secrets are required. It validates public HTML title/meta/one-H1 basics,
canonical links, schema.org JSON-LD validity when present, image alt text, CSS brace balance,
JSON parse health, key files, schema migration files, and local-search wording signals.
It writes data/site/deployment-preflight.json for the admin release pages.
"""
from __future__ import annotations
import json
import hashlib
import re
import xml.etree.ElementTree as ET
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
    ('workshop-journal/index.html', ['workshop', 'journal']),
    ('workshop-journal/polymer-clay-earring-care/index.html', ['polymer', 'clay', 'care']),
    ('workshop-journal/coin-and-spoon-ring-care/index.html', ['coin', 'spoon', 'ring', 'care']),
    ('workshop-journal/handmade-vintage-sourced-guide/index.html', ['handmade', 'vintage', 'sourced']),
]
JSON_FILES = [
    'data/site/seo-page-overrides.json',
    'data/site/local-seo-bake-actions.json',
    'data/site/release-notes.json',
    'data/site/deployment-preflight.json',
    'data/site/release-package-manifest.json',
    'data/site/local-business-schema.json',
    'data/catalog.json',
    'data/site/build182-mobile-visual-polish.json',
    'data/site/build183-visual-enrichment-studio.json',
    'data/site/build184-application-sanity.json',
    'data/site/build185-command-center.json',
    'data/site/build186-markdown-sanity.json',
    'data/site/build189-value-ops.json',
    'data/site/build190-performance-report.json',
    'data/site/build190-integrated-value-ops.json',
    'data/site/build191-value-operations-followthrough.json',
    'data/site/build191-validation.json',
    'data/site/build192-operational-data-connection.json',
    'data/site/build192-validation.json',
    'data/site/build193-live-readiness-playbook.json',
    'data/site/build193-validation.json',
    'data/site/build194-storefront-discovery.json',
    'data/site/build194-validation.json',
    'data/site/build195-product-lifecycle.json',
    'data/site/build195-validation.json',
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
    'database_build182_mobile_visual_polish.sql',
    'admin/go-live-execution/index.html',
    'admin/live-ops-followthrough/index.html',
    'admin/visual-polish/index.html',
    'functions/api/admin/go-live-execution.js',
    'functions/api/admin/live-ops-followthrough.js',
    'functions/api/admin/visual-polish.js',
    'functions/api/admin/private-evidence-download.js',
    'public/js/admin-go-live-execution.js',
    'public/js/admin-live-ops-followthrough.js',
    'public/js/admin-visual-polish.js',
    'scripts/generate_release_manifest.py',
    'scripts/regenerate_sanity_from_preflight.py',
    'RELEASE_NOTES.md',
    'SANITY_HEALTH_CHECK.md',
    'database_build183_visual_enrichment_studio.sql',
    'admin/visual-enrichment-studio/index.html',
    'functions/api/admin/visual-enrichment-studio.js',
    'public/js/admin-visual-enrichment-studio.js',
    'database_build184_sanity_check_and_value_roadmap.sql',
    'admin/application-sanity/index.html',
    'functions/api/admin/application-sanity.js',
    'public/js/admin-application-sanity.js',
    'database_build185_admin_command_center_value_dashboards.sql',
    'database_build189_value_ops_live_counts.sql',
    'database_build190_integrated_value_operations.sql',
    'functions/api/admin/value-ops.js',
    'public/js/admin-value-ops.js',
    'public/js/admin-member-timeline.js',
    'public/js/admin-local-seo-value-ops.js',
    'MARKDOWN_INDEX.md',
    'database_build191_value_operations_followthrough.sql',
    'database_build192_operational_data_connection.sql',
    'functions/api/admin/value-ops-followthrough.js',
    'public/js/admin-value-ops-followthrough.js',
    'public/js/admin-product-image-role-prompts.js',
    'functions/api/before-after-gallery.js',
    'public/js/before-after-gallery.js',
    'database_build193_live_readiness_playbook.sql',
    'functions/api/admin/live-readiness-playbook.js',
    'public/js/admin-live-readiness-playbook.js',
    'functions/api/admin/mobile-resumable-upload.js',
    'public/js/admin-mobile-resumable-upload.js',
    'LIVE_TESTING_GUIDE.md',
    'docs/archive/build-history/BUILD194_TESTING_GUIDE.md',
    'database_build194_storefront_discovery_product_facts_media_roles.sql',
    'functions/api/featured-products.js',
    'functions/api/admin/product-listing-profiles.js',
    'functions/api/admin/product-media-score.js',
    'public/js/home-featured-products.js',
    'public/js/recently-viewed-products.js',
    'public/js/admin-product-listing-profiles.js',
    'public/js/admin-product-media-score.js',
    'workshop-journal/index.html',
    'database_build195_product_lifecycle_sku_inventory_cards.sql',
    'functions/api/admin/delete-product.js',
    'functions/api/admin/_product-numbering.js',
    'functions/api/admin/site-item-inventory.js',
    'public/js/admin-delete-product.js',
    'public/js/admin-site-item-inventory.js',
    'docs/archive/build-history/BUILD195_PRODUCT_LIFECYCLE_INVENTORY_GUIDE.md',
    'database_build221_packaging_studio_cleanup_lot_controls.sql',
    'database_build222_soap_label_startup_readiness.sql',
    'database_build225_startup_readiness_packaging_authority.sql',
    'database_build227_unified_business_operations.sql',
    'database_build228_creative_automation_prelaunch_stages.sql',
    'database_build229_packaging_reference_authority.sql',
    'database_build230_visual_image_manifest.sql',
    'database_upgrade_current_pass.sql',
    'admin/packaging-studio/index.html',
    'admin/packaging/soap-labels/index.html',
    'admin/startup-readiness/index.html',
    'functions/api/admin/packaging-studio.js',
    'functions/api/admin/startup-readiness.js',
    'public/js/admin-packaging-studio.js',
    'public/js/admin-startup-readiness.js',
    'admin/image-manifest/index.html',
    'functions/api/admin/image-manifest.js',
    'public/js/admin-image-manifest.js',
    'assets/generated/editorial/workshop-discovery-illustration.webp',
    'assets/generated/editorial/workshop-discovery-illustration-768.webp',
    'assets/generated/editorial/handmade-jewelry-techniques-illustration.webp',
    'assets/generated/editorial/handmade-jewelry-techniques-illustration-768.webp',
    'assets/generated/editorial/gift-card-brand-illustration.webp',
    'assets/generated/editorial/gift-card-brand-illustration-768.webp',
    'admin/prelaunch/index.html',
    'public/js/admin-prelaunch-hub.js',
    'assets/prelaunch-operations-map.svg',
    'admin/creative-automation/index.html',
    'functions/api/admin/creative-automation.js',
    'public/js/admin-creative-automation.js',
    'assets/creative-automation-master-process.svg',
    'admin/customer-documents/index.html',
    'functions/api/admin/customer-documents.js',
    'public/js/admin-customer-documents.js',
    'DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md',
    'PACKAGING_REFERENCE_BASELINE.md',
    'docs/packaging/source-references/DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md',
    'docs/packaging/source-references/Soap_Label_Template_Guide.pdf',
    'assets/packaging/soap/reference/Soap_Label_Master_Template.svg',
    'STARTUP_GO_LIVE_GUIDE.md',
    'PRELAUNCH_PROCESS_PLAYBOOKS.md',
    'CREATIVE_AUTOMATION_STUDIO.md',
    'scripts/build228_startup_readiness_test.mjs',
    'scripts/sync-build228-aggregate-schema.mjs',
    'scripts/build229_startup_readiness_test.mjs',
    'scripts/sync-build229-aggregate-schema.mjs',
    'scripts/build230_visual_manifest_test.mjs',
    'scripts/build231_product_autosave_test.mjs',
    'scripts/build232_product_removal_test.mjs',
    'scripts/build233_login_resource_test.mjs',
    'scripts/lazify-amazon-inventory-matches.mjs',
    'functions/api/admin/_amazonInventoryMatches.js',
    'scripts/sync-build230-aggregate-schema.mjs',
    'GENERATED_VISUAL_ASSET_REGISTER.md',
    'docs/archive/build-history/BUILD230_VALIDATION.md',
    'docs/archive/build-history/BUILD230_CHANGED_FILES.md',
    'docs/archive/build-history/BUILD231_VALIDATION.md',
    'docs/archive/build-history/BUILD231_CHANGED_FILES.md',
    'docs/archive/build-history/BUILD232_VALIDATION.md',
    'docs/archive/build-history/BUILD232_CHANGED_FILES.md',
    'docs/archive/build-history/BUILD233_VALIDATION.md',
    'docs/archive/build-history/BUILD233_CHANGED_FILES.md',
    'database_build234_packaging_templates_creative_cleanup.sql',
    'scripts/build234_packaging_creative_test.mjs',
    'scripts/sync-build234-startup-seed.mjs',
    'scripts/sync-build234-aggregate-schema.mjs',
    'assets/packaging/soap/reference/glacial-purple-aloe-soap-approved-reference.png',
    'assets/packaging/reference/wedding-candle-top-john-laurie-approved-reference.png',
    'assets/packaging/artwork/soap-botanical-purple-rose-v1.png',
    'assets/packaging/artwork/soap-botanical-purple-rose-v1.webp',
    'assets/packaging/artwork/candle-top-wedding-line-art-v1.png',
    'assets/packaging/artwork/candle-top-wedding-line-art-v1.webp',
    'scripts/build235_creative_readiness_test.mjs',
    'database_build240_operational_evidence_continuity.sql',
    'scripts/sync-build240-aggregate-schema.mjs',
    'scripts/build240_operational_continuity_test.mjs',
    'scripts/build240_public_page_audit.py',
    'functions/api/admin/operational-continuity.js',
    'public/js/admin-operational-continuity.js',
    'admin/operational-continuity/index.html',
    'OPERATIONAL_CONTINUITY_BUILD240.md',
    'docs/archive/build-history/BUILD240_VALIDATION.md',
    'docs/archive/build-history/BUILD240_CHANGED_FILES.md',
    'database_build241_caip_large_media_intake.sql',
    'scripts/sync-build241-aggregate-schema.mjs',
    'scripts/build241_caip_large_media_intake_test.mjs',
    'scripts/build241_public_page_audit.py',
    'scripts/build241_asset_reference_audit.py',
    'functions/api/_lib/caipMediaIntake.js',
    'functions/api/admin/caip-media-intake.js',
    'functions/api/admin/caip-media-upload-part.js',
    'public/js/admin-caip-media-intake.js',
    'docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md',
    'docs/archive/build-history/BUILD241_VALIDATION.md',
    'docs/archive/build-history/BUILD241_CHANGED_FILES.md',
    'database_build243_inventory_resilience_case_normalization.sql',
    'scripts/build243_inventory_resilience_regression.py',
    'database_build244_inventory_authority_fractional_usage.sql',
    'scripts/build244_inventory_authority_fractional_usage_regression.py',
    'scripts/build244_database_case_audit.py',
    'scripts/build244_public_page_audit.py',
    'scripts/build244_asset_reference_audit.py',
    'docs/archive/build-history/BUILD244_VALIDATION.md',
    'docs/archive/build-history/BUILD244_CHANGED_FILES.md',
    'database_build245_admin_media_resilience.sql',
    'scripts/build245_admin_media_resilience_regression.py',
    'scripts/build245_database_case_audit.py',
    'scripts/build245_public_page_audit.py',
    'scripts/build245_asset_reference_audit.py',
    'docs/archive/build-history/BUILD245_VALIDATION.md',
    'docs/archive/build-history/BUILD245_CHANGED_FILES.md',
    'docs/archive/build-history/BUILD245_D1_VERIFICATION.sql',
    'database_build246_product_project_production_packaging.sql',
    'scripts/build246_product_project_packaging_regression.py',
    'scripts/build246_public_page_audit.py',
    'scripts/build246_asset_reference_audit.py',
    'BUILD246_VALIDATION.md',
    'BUILD246_CHANGED_FILES.md',
    'BUILD246_D1_VERIFICATION.sql',
    'functions/api/admin/product-production-release.js',
    'functions/api/admin/inventory-bootstrap.js',
    'functions/api/admin/product-detail.js',
    'functions/api/admin/product-readiness.js',
    'public/js/site-auth-ui.js',
    'public/js/admin-self-protect.js',
    'data/site/build241-public-page-audit.json',
    'data/site/build241-asset-reference-audit.json',
    'data/site/build244-public-page-audit.json',
    'data/site/build244-asset-reference-audit.json',
    'data/site/build245-public-page-audit.json',
    'data/site/build245-asset-reference-audit.json',
    'data/site/build246-public-page-audit.json',
    'data/site/build246-asset-reference-audit.json',
    'data/site/build240-public-page-audit.json',
    'data/site/build240-asset-reference-audit.json',
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
        alt_value=attr(tag, 'alt')
        decorative=bool(re.search(r'aria-hidden\s*=\s*(["\'])true\1', tag, re.I)) or bool(re.search(r'role\s*=\s*(["\'])(presentation|none)\1', tag, re.I))
        rows.append({'src': attr(tag, 'src'), 'has_alt': bool(alt_value) or decorative, 'decorative': decorative})
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

def check_packaging_references(checks: list[dict]) -> None:
    expected = {
        'docs/packaging/source-references/DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md': '26fe76cff4943547739bbe68b328509ba916ed6c608b57e86a048ceb4f1611b7',
        'docs/packaging/source-references/Soap_Label_Template_Guide.pdf': 'cc4940bcb31a244ee7bd9248f4830be986c5cb669d21273a23b373aa3b5bfe0e',
        'assets/packaging/soap/reference/Soap_Label_Master_Template.svg': '6e0a1653cdb85861544f06f5d1aa1897e1878cfcb5e62ebe86c6cfe003aacb5e',
        'assets/packaging/soap/reference/glacial-purple-aloe-soap-approved-reference.png': '297d8a7e737447c307523ea50b04d4967892e86c948f19745e35c114dd0a382c',
        'assets/packaging/reference/wedding-candle-top-john-laurie-approved-reference.png': '8abe415ff7fb472fd28697a18638a9b30a7e8f53cce737eb5bc87f13c8cfa056',
    }
    failures=[]
    rows=[]
    for rel, wanted in expected.items():
        path=ROOT/rel
        actual=hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else ''
        ok=actual == wanted
        rows.append({'path':rel,'expected_sha256':wanted,'actual_sha256':actual,'ok':ok})
        if not ok: failures.append(rel)
    svg=ROOT/'assets/packaging/soap/reference/Soap_Label_Master_Template.svg'
    try:
        ET.parse(svg)
    except Exception as exc:
        failures.append(f'{svg.relative_to(ROOT)} XML: {exc}')
    checks.append({'code':'static_packaging_reference_integrity','status':'fail' if failures else 'pass','detail':'; '.join(failures) if failures else 'All five adopted packaging sources match their registered SHA-256 values and the SVG parses as XML.', 'rows':rows})

def check_markdown_authority(checks: list[dict]) -> None:
    required_markers = {
        'AI_HANDOFF.md': ['Build 246', 'PROJECT_STATUS_AND_ROADMAP.md', 'CAIP_PRIVATE_MEDIA_BUCKET', 'database_build246_product_project_production_packaging.sql', 'one H1', 'Legacy tool/supply JSON', 'product_production_runs', 'packaging_translation_reviews'],
        'PROJECT_STATUS_AND_ROADMAP.md': ['Build 246', 'Next 20 steps after Build 246', 'SEO/local-search direction each pass', 'fractional', 'Media Integrity Review', 'Finished Product Production Release'],
        'MARKDOWN_INDEX.md': ['Build 246', 'Two current authorities', 'Historical rule'],
        'README.md': ['Build 246', 'database_build246_product_project_production_packaging.sql'],
        'STARTUP_GO_LIVE_GUIDE.md': ['Build 246', 'This is the human-readable operating copy of all 46', 'database_build246_product_project_production_packaging.sql', 'missing_launch_images', 'Measure, save, laser-test, approve, and archive each candle-top template', '/admin/image-manifest/', 'auth_login_bounded_v1'],
        'PACKAGING_REFERENCE_BASELINE.md': ['Build 234', 'Five owner-supplied files', 'Dimensional discrepancy', 'Candle-top direction'],
        'PRELAUNCH_PROCESS_PLAYBOOKS.md': ['Deployment Preflight', 'Deploy Readiness', 'Go-Live Execution'],
        'CREATIVE_AUTOMATION_STUDIO.md': ['seven human-reviewed stages', 'creative_automation_workflows', 'authenticated admin request'],
        'GENERATED_VISUAL_ASSET_REGISTER.md': ['Build 234', 'Product/Offer structured data', 'Soap botanical purple rose', 'Wedding candle-top line artwork', 'SHA-256'],
        'OPERATIONAL_CONTINUITY_BUILD240.md': ['Build 240', 'twenty workstreams', 'idempotency key', 'Route fallback policies'],
        'docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md': ['Build 241', 'CAIP_PRIVATE_MEDIA_BUCKET', 'immutable', 'direct_s3_presigned_multipart', 'PRODUCT_MEDIA_BUCKET'],
    }
    missing=[]
    for rel, markers in required_markers.items():
        text=read(ROOT/rel)
        absent=[marker for marker in markers if marker not in text]
        if absent: missing.append(f'{rel}: {", ".join(absent)}')
    guide=read(ROOT/'STARTUP_GO_LIVE_GUIDE.md')
    if guide.count('#### Before you begin') != 46:
        missing.append(f'STARTUP_GO_LIVE_GUIDE.md: expected 46 gate sections, found {guide.count("#### Before you begin")}')
    checks.append({'code':'static_markdown_authority','status':'fail' if missing else 'pass','detail':'; '.join(missing) if missing else 'Two Build 246 canonical authorities, scoped playbooks, retained CAIP/packaging references, D1 product/project/inventory authority, historical archive policy, and 46 generated Startup sections agree.', 'missing':missing})

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
        'build_183_visual_enrichment_studio',
        'visual_candidate_media_assets',
        'build_184_sanity_check_and_value_roadmap',
        'application_sanity_snapshots',
        'admin_command_center_saved_views',
        'customer_timeline_events',
        'product_margin_warning_rows',
        'build_190_integrated_value_operations',
        'marketplace_channel_fee_settings',
        'mobile_product_server_drafts',
        'build_191_value_operations_followthrough',
        'r2_derivative_worker_readiness_checks',
        'mobile_resumable_upload_sessions',
        'customer_duplicate_merge_candidates',
        'build_192_operational_data_connection',
        'build_193_live_readiness_playbook',
        'live_readiness_test_cases',
        'mobile_resumable_upload_runtime_rows',
        'mobile_resumable_upload_parts',
        'build_194_storefront_discovery_product_facts_media_roles',
        'product_listing_profiles',
        'product_media_role_assignments',
        'storefront_discovery_audit_rows',
        'catalog_product_number_sequence',
        'product_deletion_audit',
        'site_inventory_item_descriptions',
        'build_195_product_lifecycle_sku_inventory_cards',
        'product_material_return_audit',
        'build_196_product_correction_material_returns',
        'packaging_templates',
        'packaging_projects',
        'packaging_project_versions',
        'packaging_export_history',
        'inventory_lot_policies',
        'inventory_lot_reconciliations',
        'soap_label_templates',
        'soap_products',
        'soap_ingredients',
        'soap_label_claims',
        'soap_label_exports',
        'soap_label_print_tests',
        'packaging_components',
        'customer_document_sequences',
        'customer_documents',
        'creative_automation_workflows',
        'creative_automation_stage_reviews',
        'creative_automation_events',
        'build228_creative_automation_prelaunch_stages',
        'packaging_reference_sources',
        'build229_packaging_reference_authority',
        'image_manifest_items',
        'image_manifest_history',
        'build230_visual_image_manifest',
        'build234_packaging_templates_creative_cleanup',
        'candle-top-wedding-4in-v1',
        'candle-top-round-3in-v1',
        'candle_top_template_proof',
        'operational_workstreams',
        'production_evidence_cases',
        'operation_idempotency_claims',
        'public_page_audit_results',
        'route_fallback_policies',
        'operational_continuity_evidence_center',
        'build240_operational_evidence_continuity',
        'caip_media_upload_sessions',
        'caip_media_upload_files',
        'caip_media_upload_parts',
        'caip_media_processing_jobs',
        'caip_media_public_promotion_requests',
        'build241_caip_large_media_intake',
        'build243_inventory_resilience_case_normalization',
        'build244_inventory_authority_fractional_usage',
        'product_media_integrity_snapshots',
        'admin_api_health_observations',
        'linked_media_recovery_v245',
        'creative_project_deletion_audit',
        'product_resource_ingredient_profiles',
        'product_production_runs',
        'product_production_run_materials',
        'packaging_translation_reviews',
        'build246_product_project_production_packaging',
    ]
    required = {
        'database_schema.sql': schema_needles,
        'database_full_schema.sql': schema_needles + ['idx_site_item_inventory_identity_lower_active', 'site.inventory.classification_case_policy', 'merged_case_duplicate'],
        'database_store_schema.sql': schema_needles,
        'database_upgrade_current_pass.sql': ['creative_project_deletion_audit', 'product_resource_ingredient_profiles', 'product_production_runs', 'product_production_run_materials', 'packaging_translation_reviews', 'build246_product_project_production_packaging'],
        'database_build174_deployment_preflight_detail.sql': ['deployment_post_deploy_confirmations', 'build_174_preflight_detail_manifest'],
        'database_build182_mobile_visual_polish.sql': ['desktop_mobile_parity_checks', 'visual_enrichment_candidates', 'build_182_mobile_visual_polish'],
        'database_build175_release_control.sql': ['deployment_history', 'build_175_release_control_center'],
        'database_build176_release_safety_controls.sql': ['safe_deploy_package_downloads', 'local_business_schema_extended_fields', 'build_176_release_safety_controls'],
        'database_build177_deploy_score_and_controls.sql': ['deployment_readiness_scores', 'build_177_deploy_score_and_controls'],
        'database_build178_promote_live_controls.sql': ['deployment_promote_live_checklist', 'build_178_promote_live_controls'],
        'database_build179_promotion_control.sql': ['promote_live_attempts', 'recall_notification_release_gates', 'build_179_promotion_control'],
        'database_build180_go_live_execution.sql': ['product_qa_safe_apply_runs', 'build_180_go_live_execution'],
        'database_build181_live_ops_followthrough.sql': ['private_evidence_download_tokens', 'marketplace_export_gate_overrides', 'build_181_live_ops_followthrough'],
        'database_build183_visual_enrichment_studio.sql': ['visual_candidate_media_assets', 'public_page_image_slot_assignments', 'build_183_visual_enrichment_studio'],
        'database_build184_sanity_check_and_value_roadmap.sql': ['application_sanity_snapshots', 'value_added_modification_candidates', 'build_184_sanity_check_and_value_roadmap'],
        'database_build185_admin_command_center_value_dashboards.sql': ['admin_command_center_daily_snapshots', 'product_readiness_scoreboard_snapshots', 'build_185_admin_command_center_value_dashboards'],
        'database_build186_markdown_consolidation_visual_placeholders.sql': ['markdown_consolidation_runs', 'visual_graphic_placeholder_rows', 'build_186_markdown_consolidation_visual_placeholders'],
        'database_build189_value_ops_live_counts.sql': ['command_center_live_count_runs', 'approved_visual_replacement_candidates', 'build_189_value_ops_live_counts'],
        'database_build190_integrated_value_operations.sql': ['admin_command_center_saved_views', 'customer_timeline_events', 'product_margin_warning_rows', 'build_190_integrated_value_operations'],
        'database_build191_value_operations_followthrough.sql': ['marketplace_channel_fee_settings', 'mobile_product_server_drafts', 'approved_before_after_gallery_items', 'build_191_value_operations_followthrough'],
        'database_build192_operational_data_connection.sql': ['r2_derivative_worker_readiness_checks', 'mobile_resumable_upload_sessions', 'customer_duplicate_merge_candidates', 'build_192_operational_data_connection'],
        'database_build193_live_readiness_playbook.sql': ['live_readiness_test_cases', 'live_readiness_test_runs', 'mobile_resumable_upload_runtime_rows', 'mobile_resumable_upload_parts', 'build_193_live_readiness_playbook'],
        'database_build194_storefront_discovery_product_facts_media_roles.sql': ['product_listing_profiles', 'product_media_role_assignments', 'storefront_discovery_audit_rows', 'build_194_storefront_discovery_product_facts_media_roles'],
        'database_build195_product_lifecycle_sku_inventory_cards.sql': ['catalog_product_number_sequence', 'product_deletion_audit', 'site_inventory_item_descriptions', 'build_195_product_lifecycle_sku_inventory_cards'],
        'database_build196_product_correction_material_returns.sql': ['product_material_return_audit', 'build_196_product_correction_material_returns'],
        'database_build221_packaging_studio_cleanup_lot_controls.sql': ['packaging_templates', 'packaging_projects', 'packaging_project_versions', 'packaging_export_history', 'inventory_lot_policies', 'inventory_lot_reconciliations'],
        'database_build222_soap_label_startup_readiness.sql': ['soap_label_templates', 'soap_products', 'soap_ingredients', 'soap_label_claims', 'soap_label_exports', 'soap_label_print_tests'],
        'database_build225_startup_readiness_packaging_authority.sql': ['startup_readiness_items', 'startup_readiness_history'],
        'database_build227_unified_business_operations.sql': ['packaging_components', 'customer_document_sequences', 'customer_documents', 'build227_unified_business_operations'],
        'database_build228_creative_automation_prelaunch_stages.sql': ['creative_automation_workflows', 'creative_automation_stage_reviews', 'creative_automation_events', 'build228_creative_automation_prelaunch_stages'],
        'database_build229_packaging_reference_authority.sql': ['packaging_reference_sources', 'build229_packaging_reference_authority', 'soap-label-automation-spec-v1', 'soap-label-template-guide-v1', 'soap-label-master-template-v1'],
        'database_build230_visual_image_manifest.sql': ['image_manifest_items', 'image_manifest_history', 'build230_visual_image_manifest', 'home_workshop_discovery', 'gift_card_artwork'],
        'database_build234_packaging_templates_creative_cleanup.sql': ['candle-top-wedding-4in-v1', 'candle-top-round-3in-v1', 'soap-approved-visual-v1', 'wedding-candle-top-john-laurie-v1', 'candle_top_template_proof', 'build234_packaging_templates_creative_cleanup'],
        'database_build240_operational_evidence_continuity.sql': ['operational_workstreams', 'production_evidence_cases', 'operation_idempotency_claims', 'public_page_audit_results', 'route_fallback_policies', 'operational_continuity_evidence_center', 'build240_operational_evidence_continuity'],
        'database_build241_caip_large_media_intake.sql': ['caip_media_upload_sessions', 'caip_media_upload_files', 'caip_media_upload_parts', 'caip_media_processing_jobs', 'caip_media_public_promotion_requests', 'caip_private_large_media_intake', 'build241_caip_large_media_intake'],
        'database_build243_inventory_resilience_case_normalization.sql': ['idx_site_item_inventory_identity_lower_active', 'site.inventory.classification_case_policy', 'merged_case_duplicate', 'build243_inventory_resilience_case_normalization'],
        'database_build244_inventory_authority_fractional_usage.sql': ['site_inventory_usage_profiles', 'site_inventory_usage_movements', 'site.inventory.catalog_authority', 'site.inventory.fractional_usage_policy', 'build244_inventory_authority_fractional_usage'],
        'database_build245_admin_media_resilience.sql': ['site_inventory_usage_profiles', 'build244_inventory_authority_fractional_usage', 'product_media_integrity_snapshots', 'admin_api_health_observations', 'linked_media_recovery_v245', 'build245_admin_media_resilience'],
        'database_build246_product_project_production_packaging.sql': ['creative_project_deletion_audit', 'product_resource_ingredient_profiles', 'product_production_runs', 'product_production_run_materials', 'packaging_translation_reviews', 'build246_product_project_production_packaging'],
    }
    missing=[]
    detail=[]
    for rel, needles in required.items():
        text=read(ROOT/rel)
        missing_needles=[needle for needle in needles if needle not in text]
        if missing_needles:
            missing.append(rel)
            detail.append(f'{rel}: missing {", ".join(missing_needles)}')
    checks.append({'code':'static_schema_current','status':'fail' if missing else 'pass','detail':'; '.join(detail) if missing else 'Build 174 through Build 246 schema and current migration markers were found in the correct files.', 'missing':missing})

    current=read(ROOT/'database_upgrade_current_pass.sql')
    numbered=read(ROOT/'database_build246_product_project_production_packaging.sql')
    explicit=re.findall(r'(?im)^\s*(BEGIN(?:\s+TRANSACTION)?|COMMIT|SAVEPOINT|RELEASE(?:\s+SAVEPOINT)?|ROLLBACK)\b', current)
    checks.append({
        'code':'static_d1_migration_compatibility',
        'status':'fail' if explicit or current != numbered else 'pass',
        'detail':('Current migration contains unsupported explicit transaction statements: '+', '.join(explicit)) if explicit else ('Current migration differs from the numbered Build 246 migration.' if current != numbered else 'Current and numbered Build 246 migrations are identical and contain no explicit SQL transaction statements.'),
    })

def main() -> int:
    checks=[]
    check_required_files(checks)
    check_packaging_references(checks)
    check_markdown_authority(checks)
    check_schema_files(checks)
    check_pages(checks)
    check_css(checks)
    check_json(checks)
    blocker_count=sum(1 for check in checks if check['status']=='fail')
    warning_count=sum(1 for check in checks if check['status']=='warn')
    payload={'build_label':'Build 246','status':'blocked' if blocker_count else ('review' if warning_count else 'ready'),'blocker_count':blocker_count,'warning_count':warning_count,'checks':checks}
    out=ROOT/'data/site/deployment-preflight.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    print(json.dumps({'status':payload['status'],'blockers':blocker_count,'warnings':warning_count}, indent=2))
    return 1 if blocker_count else 0

if __name__ == '__main__':
    raise SystemExit(main())

#!/usr/bin/env python3
"""Release-neutral forward gate for Grey Hair Media Intelligence."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SERVICE = ROOT / 'functions/api/admin/grey-hair-media-intelligence.js'
BROWSER = ROOT / 'public/js/admin-grey-hair-media-intelligence-v45.js'
PAGE = ROOT / 'admin/grey-hair-media-intelligence/index.html'
CAIP = ROOT / 'functions/api/_lib/caipEvidenceReview.js'


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f'GREY HAIR MEDIA INTELLIGENCE GATE: FAIL — {message}')

for path in (SERVICE, BROWSER, PAGE, CAIP):
    require(path.exists(), f'missing {path.relative_to(ROOT)}')

service = SERVICE.read_text(encoding='utf-8')
browser = BROWSER.read_text(encoding='utf-8')
page = PAGE.read_text(encoding='utf-8')
caip = CAIP.read_text(encoding='utf-8')
compact = re.sub(r'\s+', '', service)

require('constBUILD=45;' in compact, 'Build 45 service identity missing')
require('loadCaipEvidenceReviewBundle' in service and 'getCaipEvidenceReviewReadiness' in service, 'Build 45 must reuse existing CAIP evidence authority')
for authority in ('creative_assets', 'creative_media_evidence_ranges', 'caip_media_processing_artifacts'):
    require(authority in caip or authority in service, f'existing CAIP authority missing: {authority}')
require('private_media_only:true' in compact and 'source_originals_immutable:true' in compact, 'private/immutable source boundary missing')
require('public_raw_r2_urls:false' in compact, 'raw R2 privacy boundary missing')
require('provider_execution:false' in compact and 'provider_publication:false' in compact, 'provider lanes must remain closed')
require('build46_camera_sync:false' in compact and 'build46_audio_alignment:false' in compact, 'Build 46 sync/audio must remain out of scope')
require('build47_story_editing:false' in compact and 'build47_script_generation:false' in compact, 'Build 47 story/edit must remain out of scope')
require('request_time_ddl:false' in compact and 'schema_change:false' in compact, 'Build 45 must remain zero-schema')
require('r2_mutation:false' in compact and 'main_mutation:false' in compact and 'production_contacted:false' in compact, 'Build 45 safety boundary missing')
require('transcript_excerpt_count' in service and 'approved_marker_count' in service and 'verified_artifact_count' in service, 'media intelligence evidence coverage missing')
require('coverage_score' in service and 'intelligence_ready' in service, 'deterministic intelligence readiness missing')

for pattern in (r'\bCREATE\s+(?:TABLE|INDEX|VIEW|TRIGGER)\b', r'\bALTER\s+TABLE\b', r'\bDROP\s+(?:TABLE|INDEX|VIEW|TRIGGER)\b'):
    require(not re.search(pattern, service, flags=re.I), f'request-time DDL detected: {pattern}')

require('const BUILD = 45' in browser, 'browser Build 45 identity missing')
require("const ENDPOINT = '/api/admin/grey-hair-media-intelligence'" in browser, 'browser endpoint changed')
require('providerExecution: false' in browser and 'publication: false' in browser, 'browser provider safety snapshot missing')
require('cameraSync: false' in browser and 'storyEditing: false' in browser, 'browser future-build boundary missing')
require('schemaChange: false' in browser and 'productionContacted: false' in browser, 'browser zero-schema/Production boundary missing')
require('Grey Hair Media Intelligence' in page and '/public/js/admin-grey-hair-media-intelligence-v45.js?v=46745' in page, 'admin workspace wiring missing')
require('Build 46:' in page and 'Build 47:' in page, 'future build ownership must be explicit')

canonical = ROOT / 'migrations' / 'canonical'
if canonical.exists():
    require(not list(canonical.glob('0005*')), 'Build 45 must not introduce canonical migration 0005')

print('CURRENT GREY HAIR MEDIA INTELLIGENCE GATE: PASS')

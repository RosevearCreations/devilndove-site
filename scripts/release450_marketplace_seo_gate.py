#!/usr/bin/env python3
"""Release 450 Marketplace + SEO readiness source/fresh-install gate."""
from __future__ import annotations
import re
import sqlite3
import subprocess
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
failures=[]
def text(path): return (ROOT/path).read_text(encoding='utf-8')
def require(condition,message):
    if not condition: failures.append(message)
def require_in(path,needles):
    value=text(path)
    for needle in needles: require(needle in value,f'{path} missing {needle!r}')
    return value

migration='migrations/dev/20260829_release450_marketplace_seo_readiness.sql'
require((ROOT/migration).exists(),'Release 450 migration missing')
sql=text(migration)
for table in ('marketplace_channel_policies','marketplace_listing_profiles','marketplace_listing_validation_snapshots','marketplace_export_image_selections','marketplace_csv_mappings'):
    require(f'CREATE TABLE IF NOT EXISTS {table}' in sql,f'Release 450 migration missing {table}')
for marker in ("('etsy','etsy','Etsy','draft_only',0,20,13,3,5,1,0", "('tiktok','tiktok','TikTok','upload_only',0,35", 'publication_allowed=0', 'ETSY_API_KEYSTRING', 'ETSY_SHARED_SECRET', 'ETSY_SHOP_ID'):
    require(marker in sql,f'Release 450 migration missing policy marker {marker!r}')
require('account_id' not in sql.lower(),'Release 450 migration must not carry Cloudflare account selection')
require('devilndove-site' not in sql.replace('devilndove-site-dev',''),'Release 450 migration must not name Production Pages')

# Compose the real Release 449 baseline followed by Release 450 locally.
try:
    with tempfile.TemporaryDirectory() as td:
        db=sqlite3.connect(str(Path(td)/'release450.sqlite'))
        db.executescript(text('migrations/dev/20260829_release449_corporate_commerce.sql'))
        db.executescript(sql)
        tables={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        for table in ('provider_setup_authorities','marketplace_channels','marketplace_syndication_drafts','marketplace_channel_policies','marketplace_listing_profiles','marketplace_listing_validation_snapshots','marketplace_csv_mappings'):
            require(table in tables,f'composed schema missing {table}')
        etsy=db.execute("SELECT integration_mode,provider_execution_allowed,max_images,max_tags,max_variations,max_personalization_questions FROM marketplace_channel_policies WHERE channel_key='etsy'").fetchone()
        require(etsy==('draft_only',0,20,13,3,5),f'Etsy Release 450 policy drifted: {etsy}')
        channels=dict(db.execute("SELECT channel_key,publication_allowed FROM marketplace_channels WHERE channel_key IN ('etsy','facebook','pinterest','tiktok')"))
        require(channels=={'etsy':0,'facebook':0,'pinterest':0,'tiktok':0},f'publication locks drifted: {channels}')
        providers=dict(db.execute("SELECT provider_key,required_config_keys_json FROM provider_setup_authorities WHERE provider_key IN ('etsy','stripe','paypal')"))
        require('ETSY_API_KEYSTRING' in providers.get('etsy',''),'Etsy config reference keystring missing')
        require(db.execute('PRAGMA foreign_key_check').fetchall()==[],'Release 449+450 composed foreign keys are not clean')
        db.close()
except Exception as exc:
    failures.append(f'Release 449+450 local composition failed: {exc}')

helper=require_in('functions/api/_lib/marketplaceReadiness.js',[
    'MARKETPLACE_RELEASE = 450', 'max_personalization_questions', 'PERSONALIZATION_TYPES',
    "'text_input', 'dropdown', 'unlabeled_upload', 'labeled_upload'", 'Third Etsy variation',
    'provider_execution_allowed', 'publication_allowed', 'marketplaceSchemaStatus'
])
require('fetch(' not in helper,'marketplace readiness helper must not contact providers')

for rel in ('functions/api/admin/marketplace-export-preview.js','functions/api/admin/marketplace-csv-mapping.js','functions/api/admin/marketplace-listing-profile.js'):
    value=text(rel)
    require('CREATE TABLE' not in value.upper(),f'{rel} must not create schema during requests')
    require('ALTER TABLE' not in value.upper(),f'{rel} must not alter schema during requests')
    require('marketplaceSchemaStatus' in value,f'{rel} must fail closed on schema readiness')
    require('fetch(' not in value,f'{rel} must not contact marketplace providers directly')

profile=text('functions/api/admin/marketplace-listing-profile.js')
for marker in ('publication_requested=0','provider_execution: false','publication_allowed: false','marketplace_listing_validation_snapshots'):
    require(marker in profile,f'local draft profile authority missing {marker!r}')

export=text('functions/api/admin/marketplace-export-preview.js')
for marker in ("const SUPPORTED=['etsy','facebook','pinterest','tiktok','manual']",'blocked_margin','provider_execution:false','publication_allowed:false','validateListingDraft'):
    require(marker in export,f'marketplace export convergence missing {marker!r}')

page=text('admin/marketplace-readiness/index.html')
require(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Marketplace readiness admin page must contain exactly one H1')
require('noindex,nofollow' in page,'Marketplace readiness admin page must remain noindex,nofollow')
require('/css/admin-marketplace-readiness.css?v=450' in page,'Marketplace readiness responsive CSS missing')
require('/public/js/admin-marketplace-readiness.js?v=450' in page,'Marketplace readiness UI script missing')
styles=text('css/admin-marketplace-readiness.css')
for marker in ('@media(max-width:950px)','@media(max-width:600px)','grid-template-columns:1fr'):
    require(marker in styles,f'Marketplace readiness responsive CSS missing {marker!r}')

ui=text('public/js/admin-marketplace-readiness.js')
for marker in ("channels=['etsy','facebook','pinterest','tiktok','manual']",'Personalization questions','Variation properties','Provider execution: disabled','publication'):
    require(marker in ui,f'Marketplace readiness UI missing {marker!r}')

for js in ('functions/api/_lib/marketplaceReadiness.js','functions/api/admin/marketplace-export-preview.js','functions/api/admin/marketplace-csv-mapping.js','functions/api/admin/marketplace-listing-profile.js','public/js/admin-marketplace-readiness.js','public/js/admin-marketplace-export-preview.js','public/js/admin-marketplace-mapping.js'):
    result=subprocess.run(['node','--check',str(ROOT/js)],capture_output=True,text=True)
    require(result.returncode==0,f'JavaScript syntax failed for {js}: {(result.stderr or result.stdout).strip()}')

seo=subprocess.run(['python',str(ROOT/'scripts/public_seo_gate.py')],capture_output=True,text=True)
require(seo.returncode==0,f'public SEO structural gate failed:\n{seo.stdout}\n{seo.stderr}')

print('RELEASE 450 MARKETPLACE / SEO SOURCE GATE')
print('Release 449 + 450 local D1 composition: CHECKED')
print('Etsy preparation: 20 images / 13 tags / 3 variations / 5 personalization questions')
print('Provider execution/publication: DISABLED')
print('Request-time marketplace DDL: FORBIDDEN')
print('Admin marketplace workspace: NOINDEX + RESPONSIVE')
print('Public SEO structural gate: REQUIRED')
if failures:
    for i,failure in enumerate(failures,1): print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('RELEASE 450 MARKETPLACE / SEO SOURCE GATE: PASS')

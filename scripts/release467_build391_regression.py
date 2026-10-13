#!/usr/bin/env python3
"""Build391: historical price acceptance, current preflight truth and bounded Etsy OAuth terminal diagnostics."""
import json,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1];bad=[]
def text(p):return (R/p).read_text(encoding='utf8')
def ensure(cond,msg):
 if not cond:bad.append(msg)
for path in ['functions/api/admin/current-deployment-preflight.js','public/js/admin-current-deployment-preflight.js',
 'functions/api/social/oauth/_callback.js','functions/api/admin/etsy-oauth-acceptance.js','public/js/admin-etsy-oauth-acceptance.js']:
 run=subprocess.run(['node','--check',str(R/path)],text=True,capture_output=True)
 ensure(run.returncode==0,'syntax '+path+' '+run.stderr[-300:])
server=text('functions/api/admin/current-deployment-preflight.js')
manifest=json.loads(text('migrations/canonical/manifest.json'))
count=len(manifest['migrations'])
ensure(count==39,'expected current schema count 39, got '+str(count))
ensure(server.count('===CANONICAL_MIGRATIONS.length?')>=2,'dynamic migration count')
ensure("native_applied_count===30?" not in server and "proof_recorded_count===30?" not in server,'hard-coded preflight false blockers')
ensure("'0039_release467_product_video_attachment.sql'" in server,'canonical 0039 authority present')
ensure("verified_production_checkpoint" in server and 'oauth_security_boundary' in server,'current release scope')
client=text('public/js/admin-current-deployment-preflight.js')
ensure('dd391-migration-list' in client and 'dd391-check-list' in client,'readable migration and check layouts')
page=text('admin/deployment-preflight/index.html')
ensure('Archive: older Build 246 / 247 evidence' in page and 'Current Release 467 Build 391' in page,'old release evidence clearly archived')
ensure('v=467b391' in page,'live preflight cache refreshed')
oauth=text('functions/api/social/oauth/_callback.js')
ensure('createOAuthCallback' in oauth and "createOAuthCallbackCore" in oauth and "consume" in oauth,'single-use OAuth still preserved')
ensure("body,422)" in oauth,"OAuth unhandled error converted to controlled 422")
ensure('oauth_callback_unexpected_failure' in oauth and 'connection could not be completed' in oauth,'callback error no generic 502')
diag=text('functions/api/admin/etsy-oauth-acceptance.js')
ensure('SELECT terminal_status,diagnostic_code,created_at,consumed_at,completed_at' in diag,'only bounded terminal OAuth metadata')
ensure('latest_oauth_attempt:latestAttempt' in diag and 'contains_secrets:false' in diag,'no OAuth secrets in diagnostic')
ensure('etsyOauth391LastAttempt' in text('admin/it-integrations/index.html'),'Etsy callback acceptance shows latest attempt')
ensure('productBrowser390PriceAudit' in text('admin/products/index.html') and 'Browser acceptance:' in text('admin/products/index.html'),'manual price reconciliation')
ensure('product_price_readback_unconfirmed' in text('functions/api/admin/product-editor-save.js'),'price save retains verification')
authority=json.loads(text('current-development-authority.json'))
ensure(authority.get('build')==391 and authority.get('next_build')==392,'current release authority and successor')
ensure('release467-build391-price-preflight-etsy.json' in text('current-development-authority.json'),'current authority resource')
print('RELEASE467_BUILD391_GATE='+('FAIL' if bad else 'GREEN'))
for msg in bad:print('FAIL:',msg)
sys.exit(bool(bad))

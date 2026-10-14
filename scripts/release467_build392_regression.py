#!/usr/bin/env python3
"""Release 467 Build 392: Etsy edge redirect safety + no-inferred-price source acceptance."""
from pathlib import Path
import json,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];bad=[]
def content(path):return (ROOT/path).read_text(encoding='utf8')
def check(cond,msg):
 if not cond:bad.append(msg)
result=subprocess.run(['node','--test','scripts/release467_build392_etsy_workerd.test.mjs'],cwd=ROOT,text=True,capture_output=True)
check(result.returncode==0,'Etsy runtime tests: '+result.stdout[-1300:]+result.stderr[-500:])
for path in ['functions/api/_lib/oauthProviders.js','functions/api/admin/etsy-oauth-acceptance.js','functions/api/social/oauth/_callback.js','functions/api/admin/product-zero-price-review.js']:
 p=subprocess.run(['node','--check',str(ROOT/path)],capture_output=True,text=True)
 check(p.returncode==0,'Syntax '+path+' '+p.stderr[-240:])
oauth=content('functions/api/_lib/oauthProviders.js')
check("redirect: 'manual'" in oauth and "redirect:'manual'" in oauth,'Workerd manual redirect for token/identity/shop')
check('oauth_provider_redirect_blocked' in oauth,'Disallow provider 3xx with explicit guard')
check("redirect: 'error'" not in oauth.replace('redirect:"error"',''),'No unsupported redirect:error at runtime')
check('response?.type===\'opaqueredirect\'' in oauth,'Opaque redirects rejected')
screen=content('functions/api/admin/etsy-oauth-acceptance.js')
check('latest_oauth_attempt:latestAttempt' in screen,'Operator-safe last attempt diagnostic')
callback=content('functions/api/social/oauth/_callback.js')
check("state_replayed_expired_or_consumed" in callback and "oauth_callback_unexpected_failure" in callback,'PKCE single-use callback')
price=content('functions/api/admin/product-zero-price-review.js')
check('no_automatic_price_repair:true' in price and 'evidence_required:true' in price,'No speculative historical price repairs')
assertion=content('functions/api/admin/product-editor-save.js')
check('product_price_readback_unconfirmed' in assertion and 'zero_price_not_confirmed' in assertion,'Price confirmed by source after operator Save')
authority=json.loads(content('current-development-authority.json'))
check(authority.get('build') in (392,393,394,395,396,397) and authority.get('next_build') == authority.get('build')+1,'Build392 retained and active successor advances one build at a time')
check('release467-build392-etsy-workerd-price-evidence.json' in content('current-development-authority.json'),'New machine authority registered')
print('RELEASE467_BUILD392_GATE='+('FAIL' if bad else 'GREEN'))
for f in bad:print('FAIL:',f)
sys.exit(bool(bad))

#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build353-maker-story-advancement-publication-readiness-continuity-vi.json');prev=j('release467-build352-search-console-real-export-fresh-discovery-intake-vii.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build353_continuity.sql');verify=t('scripts/release467_build353_verify_continuity.mjs');wf=t('.github/workflows/release467-build353-maker-story-advancement-publication-readiness-continuity-vi.yml')
auth=t('public/js/auth.js');site=t('public/js/site-auth-ui.js');seller=t('public/js/admin-seller-command-centre-build148.js');admin=t('admin/index.html');sec=t('functions/api/_lib/oauthSecurity.js');start=t('functions/api/admin/oauth-start.js');etsy=t('functions/api/admin/etsy-oauth-acceptance.js');wr=t('wrangler.toml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_349_354.md')
q(a.get('build')==353 and a.get('title')=='Maker Story Advancement & Publication Readiness Continuity VI','Build 353 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 352 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='4767f4f041e35b1c6fc0cef51d7e83a2cd398b12' and (prev.get('final_closure') or {}).get('tree_sha')=='c15a2b9cd49d4fdd2f634e5298420cab806216eb','Build 352 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='7fbf874fafa2c0838a07d0101500311707cfc9fe' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='c15a2b9cd49d4fdd2f634e5298420cab806216eb','Build 352 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('expected_active_projects')==5 and c.get('coverage_population')=='ALL_ACTIVE_CREATIVE_PROJECTS','Build 353 five-project coverage mismatch')
q(c.get('explicit_story_review_required') is True and c.get('automatic_publication') is False,'Build 353 review/publication boundary mismatch')
q(c.get('next_build')==354 and c.get('next_build_title')=='Content Adoption & Discovery Outcomes Renewal IX','Build 354 successor mismatch')
q(all(v is False for v in s.values()),'Build 353 safety authority drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 353 measurement must remain read-only: '+forbidden.strip())
for token in ('placeholderGuard','PUBLISHED_REVIEWED_STORY','FACTUAL_OUTCOME_EVIDENCE_REQUIRED','publication_mutation:false','production_d1_contact:false'):q(token in verify,'Build 353 verifier missing '+token)
for token in ('AUTH_ME_TIMEOUT_MS=6000','auth_verification_timeout'):q(token in auth,'Admin auth timeout missing '+token)
q("if (!leanStartup) {\n    void import('/public/js/admin-context-help.js" in site,'Lean Admin context-help observer is not deferred')
for token in ('verifiedAdmin()','dd:auth-verified','Live Seller Daily reads are paused','Build 353: never start Admin-home live D1 reads from provisional auth'):q(token in seller,'Admin-home verified-auth repair missing '+token)
q('site-auth-ui.js?v=353' in admin and 'admin-seller-command-centre-build148.js?v=467b353' in admin and 'auth.js?v=353' in admin,'Admin cache identities not advanced')
for token in ("etsy_shared_secret_derived_e1","version==='e1'","provider==='etsy'","devilndove|etsy-oauth-encryption|e1|"):q(token in sec,'Etsy derived encryption authority missing '+token)
q("encryptionKeyConfigured(env, contract.key)" in start,'OAuth start does not use provider-specific encryption readiness')
q("encryptionKeyConfigured(env,'etsy')" in etsy and 'encryption_authority_source:encryptionSource' in etsy,'Etsy status does not expose safe encryption readiness')
q('OAUTH_PROVIDER_AUTHORIZATION_MODE = "development-explicit"' in wr,'Development OAuth operator mode not configured')
q('Build 354 — Content Adoption & Discovery Outcomes Renewal IX' in road,'Build 354 roadmap missing')
q(int(p.get('build') or 0)>=353,'Current pointer must retain Build 353 or successor')
if int(p.get('build') or 0)==353:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==354,'Build 353 current authority/successor mismatch')
print('RELEASE 467 BUILD 353 MAKER STORY ADVANCEMENT & PUBLICATION READINESS CONTINUITY VI')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Admin home is verified-auth-first; Etsy Development encryption is safe and listing writes remain locked.')

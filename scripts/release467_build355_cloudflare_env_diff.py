#!/usr/bin/env python3
import json,sys
src,out=sys.argv[1:3]
doc=json.load(open(src,encoding='utf-8'));assert doc.get('success') is True,doc
project=doc.get('result') or {};configs=project.get('deployment_configs') or {}
def envvars(name):
    raw=((configs.get(name) or {}).get('env_vars') or {})
    return raw if isinstance(raw,dict) else {}
def describe(raw):
    rows={}
    for k,v in raw.items():
        typ=str(v.get('type') or '') if isinstance(v,dict) else 'unknown'
        val=v.get('value') if isinstance(v,dict) else None
        rows[k]={'type':typ or 'unknown','present':True}
        if k.endswith('_REDIRECT_URI') or k in ('OAUTH_PROVIDER_AUTHORIZATION_MODE','SOCIAL_OAUTH_ACCEPTANCE_PROVIDER','DND_ENVIRONMENT','DND_PAGES_PROJECT'):
            if typ not in ('secret_text','secret','encrypted') and isinstance(val,str):rows[k]['safe_value']=val
    return rows
preview=describe(envvars('preview'));production=describe(envvars('production'));pk=set(preview);qk=set(production)
required=['ETSY_API_KEYSTRING','ETSY_SHARED_SECRET','ETSY_REDIRECT_URI'];support=['OAUTH_PROVIDER_AUTHORIZATION_MODE','OAUTH_TOKEN_ENCRYPTION_KEY_V1','SOCIAL_OAUTH_ACCEPTANCE_PROVIDER']
expected='https://devilndove.com/api/social/oauth/etsy/callback';actual=(production.get('ETSY_REDIRECT_URI') or {}).get('safe_value')
report={'release':467,'build':355,'project':'devilndove-site','preview_keys':sorted(pk),'production_keys':sorted(qk),'preview_only':sorted(pk-qk),'production_only':sorted(qk-pk),'common':sorted(pk&qk),'production_missing_etsy_required':[k for k in required if k not in qk],'production_missing_oauth_support':[k for k in support if k not in qk],'etsy':{'expected_main_callback':expected,'production_redirect_present':'ETSY_REDIRECT_URI' in qk,'production_redirect_safe_value':actual,'production_redirect_matches_expected':actual==expected if actual is not None else None,'oauth_provider_authorization_mode_required_for_etsy_main_connection':False,'oauth_token_encryption_key_v1_required_for_etsy_main_connection':False,'etsy_shared_secret_derived_encryption_fallback_supported':True},'preview':preview,'production':production,'secret_values_emitted':False}
json.dump(report,open(out,'w'),indent=2,sort_keys=True)
print('BUILD355_CLOUDFLARE_CONFIG_DIFF='+json.dumps({'preview_only':report['preview_only'],'production_only':report['production_only'],'production_missing_etsy_required':report['production_missing_etsy_required'],'production_missing_oauth_support':report['production_missing_oauth_support'],'etsy':report['etsy'],'secret_values_emitted':False},sort_keys=True))

// Build 406: read-only Cloudflare Production configuration presence only; never echo secrets.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const checks=Object.freeze([
 ['core','SESSION_SECRET','required'],
 ['core','PRIVATE_EVIDENCE_DOWNLOAD_SECRET','feature_specific'],
 ['etsy','ETSY_API_KEYSTRING','required_for_etsy'],
 ['etsy','ETSY_SHARED_SECRET','required_for_etsy'],
 ['etsy','ETSY_REDIRECT_URI','required_for_etsy'],
 ['meta','META_APP_ID','future_meta_oauth'],
 ['meta','META_APP_SECRET','future_meta_oauth'],
 ['meta','META_REDIRECT_URI','future_meta_oauth'],
 ['meta','FACEBOOK_PAGE_ID','feature_specific'],
 ['meta','FACEBOOK_PAGE_ACCESS_TOKEN','feature_specific'],
 ['instagram','INSTAGRAM_USER_ID','feature_specific'],
 ['instagram','INSTAGRAM_ACCESS_TOKEN','feature_specific'],
 ['pinterest','PINTEREST_APP_ID','future_oauth'],
 ['pinterest','PINTEREST_APP_SECRET','future_oauth'],
 ['pinterest','PINTEREST_REDIRECT_URI','future_oauth'],
 ['tiktok','TIKTOK_CLIENT_KEY','future_oauth'],
 ['tiktok','TIKTOK_CLIENT_SECRET','future_oauth'],
 ['tiktok','TIKTOK_REDIRECT_URI','future_oauth'],
 ['youtube','YOUTUBE_CLIENT_ID','future_oauth'],
 ['youtube','YOUTUBE_CLIENT_SECRET','future_oauth'],
 ['youtube','YOUTUBE_REDIRECT_URI','future_oauth'],
 ['x','X_CLIENT_ID','future_oauth'],
 ['x','X_CLIENT_SECRET','future_oauth'],
 ['x','X_REDIRECT_URI','future_oauth'],
 ['email','RESEND_API_KEY','optional_email'],
 ['email','SENDGRID_API_KEY','optional_email'],
 ['email','POSTMARK_SERVER_TOKEN','optional_email'],
 ['payments','STRIPE_SECRET_KEY','feature_specific'],
 ['payments','STRIPE_WEBHOOK_SECRET','feature_specific'],
 ['payments','PAYPAL_CLIENT_ID','feature_specific'],
 ['payments','PAYPAL_SECRET','feature_specific'],
 ['payments','SQUARE_ACCESS_TOKEN','feature_specific']
]);
const present=val=>typeof val==='string'?val.trim().length>0:val!=null;
/* Build 720: read-only, owner-clicked provider source/binding drift triage.
 * Presence proves no provider credential validity, age, source signature or approval.
 * Do not return values, fingerprints, prefixes, raw identifiers or verifier keys. */
export function reviewProviderBindingDrift720(env={}){
 const has=name=>present(env[name]);
 const required=['SESSION_SECRET'];
 const coreMissing=required.filter(name=>!has(name));
 const groups=[
  {provider:'etsy',names:['ETSY_API_KEYSTRING','ETSY_SHARED_SECRET','ETSY_REDIRECT_URI']},
  {provider:'meta',names:['META_APP_ID','META_APP_SECRET','META_REDIRECT_URI']},
  {provider:'pinterest',names:['PINTEREST_APP_ID','PINTEREST_APP_SECRET','PINTEREST_REDIRECT_URI']},
  {provider:'youtube',names:['YOUTUBE_CLIENT_ID','YOUTUBE_CLIENT_SECRET','YOUTUBE_REDIRECT_URI']},
  {provider:'tiktok',names:['TIKTOK_CLIENT_KEY','TIKTOK_CLIENT_SECRET','TIKTOK_REDIRECT_URI']},
  {provider:'x',names:['X_CLIENT_ID','X_CLIENT_SECRET','X_REDIRECT_URI']},
  {provider:'stripe',names:['STRIPE_SECRET_KEY','STRIPE_PUBLISHABLE_KEY','STRIPE_WEBHOOK_SECRET']},
  {provider:'paypal',names:['PAYPAL_CLIENT_ID','PAYPAL_SECRET','PAYPAL_WEBHOOK_ID']},
  {provider:'square',names:['SQUARE_ACCESS_TOKEN','SQUARE_APPLICATION_ID']}
 ];
 const providers=groups.map(({provider,names})=>{
  const presentNames=names.filter(has),missing=names.filter(name=>!has(name));
  const any=presentNames.length>0;
  return {provider,status:!any?'NOT_CONFIGURED_OPTIONAL':missing.length?
    'INCOMPLETE_REVIEW_HOLD':'PRESENT_UNVERIFIED',
   present_names:presentNames,missing_names:missing,credential_freshness:'UNVERIFIED',
   provider_authorization:'NOT_PROVEN',external_contact_performed:false};
 });
 const etsy=providers.find(x=>x.provider==='etsy');
 const callbackPresent=has('ETSY_REDIRECT_URI');
 const callbackMatch=callbackPresent&&String(env.ETSY_REDIRECT_URI).trim()===
  'https://devilndove.com/api/social/oauth/etsy/callback';
 const paypal=providers.find(x=>x.provider==='paypal');
 const legacyPayPalAlias=has('PAYPAL_CLIENT_SECRET')&&!has('PAYPAL_SECRET');
 const bindingNames=['DB','PRODUCT_MEDIA_BUCKET','CAIP_PRIVATE_MEDIA_BUCKET'];
 const bound=bindingNames.filter(name=>name==='DB'?!!getDb(env):!!env[name]);
 const missingBindings=bindingNames.filter(name=>!bound.includes(name));
 const alerts=[];
 if(coreMissing.length)alerts.push('CORE_REQUIRED_MISSING');
 if(missingBindings.length)alerts.push('RESOURCE_BINDING_MISSING');
 if(etsy.status!=='NOT_CONFIGURED_OPTIONAL'&&!callbackMatch)
  alerts.push('ETSY_CALLBACK_MISSING_OR_MISMATCH');
 if(legacyPayPalAlias)alerts.push('PAYPAL_LEGACY_NAME_NOT_USED_BY_RUNTIME');
 if(providers.some(x=>x.status==='INCOMPLETE_REVIEW_HOLD'))
  alerts.push('PARTIALLY_CONFIGURED_PROVIDER');
 return {build:720,mode:'ON_DEMAND_ENV_NAME_PRESENCE_AND_EXPECTED_CALLBACK_ONLY',
  core_missing_names:coreMissing,missing_binding_names:missingBindings,
  providers,alerts,etsy_callback_status:!callbackPresent?'NOT_SET':
   callbackMatch?'MATCH':'MISMATCH',
  paypal_runtime_name:'PAYPAL_SECRET',paypal_legacy_alias_only:legacyPayPalAlias,
  source_renewal_freshness:'UNVERIFIED_NO_PROVIDER_RECEIPT',
  signed_custody_recovery:'HOLD_REQUIRES_ORIGINAL_FINANCIAL_718_INDEPENDENT_SIGNATURE',
  owner_ledger_approval:'HOLD_NO_PERSISTED_APPROVAL_ORIGINAL_SOURCE_REQUIRED',
  media_closure:'HOLD_REQUIRES_ORIGINAL_SIGNED_D1_AND_LIVE_R2_READBACK',
  new_secret_values_returned:0,external_calls:0,background_watcher:false,
  approval_recorded:false,automatic_financial_close:false};
}
export async function onRequestGet(c){
 const admin=verifiedAdminFromModule(c);
 if(!admin)return jsonResponse({ok:false,error:'Active Administrator required.'},401);
 const env=c.env||{},rows=checks.map(([group,name,classification])=>({group,name,
  classification,status:present(env[name])?'PRESENT':'NOT_SET',value_exposed:false}));
 const bindings=[['DB',!!getDb(env)],['PRODUCT_MEDIA_BUCKET',!!env.PRODUCT_MEDIA_BUCKET],
 ['CAIP_PRIVATE_MEDIA_BUCKET',!!env.CAIP_PRIVATE_MEDIA_BUCKET]].map(([name,ready])=>({name,status:ready?'BOUND':'NOT_BOUND',value_exposed:false}));
 const review720=String(new URL(c.request.url).searchParams.get('review')||'')==='720';
 const uri=String(env.ETSY_REDIRECT_URI||'');
 return jsonResponse({ok:true,build:406,source:'CURRENT_FUNCTION_ENVIRONMENT',environment_values_exposed:false,
  inspection_scope:'PRESENCE_AND_EXPECTED_ETSY_CALLBACK_ONLY',runtime_secret_values_returned:0,
  note:'A present value is not proof of provider approval, OAuth expiry, correct permissions or successful live API calls. Future/optional secrets may legitimately be absent.',
  etsy_callback_matches_production:uri==='https://devilndove.com/api/social/oauth/etsy/callback',
  rows,bindings,
  ...(review720?{review720:reviewProviderBindingDrift720(env)}:{}),
  documentation:'/docs/operations/RELEASE_467_BUILD_406_PRODUCTION_CONFIGURATION_AUDIT.md'},200,{'Cache-Control':'no-store'});
}

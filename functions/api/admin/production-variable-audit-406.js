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
export async function onRequestGet(c){
 const admin=verifiedAdminFromModule(c);
 if(!admin)return jsonResponse({ok:false,error:'Active Administrator required.'},401);
 const env=c.env||{},rows=checks.map(([group,name,classification])=>({group,name,
  classification,status:present(env[name])?'PRESENT':'NOT_SET',value_exposed:false}));
 const bindings=[['DB',!!getDb(env)],['PRODUCT_MEDIA_BUCKET',!!env.PRODUCT_MEDIA_BUCKET],
 ['CAIP_PRIVATE_MEDIA_BUCKET',!!env.CAIP_PRIVATE_MEDIA_BUCKET]].map(([name,ready])=>({name,status:ready?'BOUND':'NOT_BOUND',value_exposed:false}));
 const uri=String(env.ETSY_REDIRECT_URI||'');
 return jsonResponse({ok:true,build:406,source:'CURRENT_FUNCTION_ENVIRONMENT',environment_values_exposed:false,
  inspection_scope:'PRESENCE_AND_EXPECTED_ETSY_CALLBACK_ONLY',runtime_secret_values_returned:0,
  note:'A present value is not proof of provider approval, OAuth expiry, correct permissions or successful live API calls. Future/optional secrets may legitimately be absent.',
  etsy_callback_matches_production:uri==='https://devilndove.com/api/social/oauth/etsy/callback',
  rows,bindings,
  documentation:'/docs/operations/RELEASE_467_BUILD_406_PRODUCTION_CONFIGURATION_AUDIT.md'},200,{'Cache-Control':'no-store'});
}

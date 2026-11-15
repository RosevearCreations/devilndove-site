// Build 406: read-only Cloudflare Production configuration presence only; never echo secrets.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {finance718,financial685} from './social-post-queue.js';
import {sourceVerifiedOwnerReview721} from './_lib/projectFinanceEvidence.js';
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

/* Build 721: real D1 owner-review receipts, only after original live Build 718
 * Ed25519 ninth + distinct outside SLA readback and current Master source.
 * An Admin review is never independent owner identity, financial book close,
 * an external signature, credential rotation or cross-app connection. */
const source721=async(db,env,n)=>{
 const [report,master]=await Promise.all([finance718(db,env,n),financial685(db,env,n)]);
 const gate=sourceVerifiedOwnerReview721(report,master);
 return {gate,master};
};
export async function readOwnerReviewLedger721(db,env,n){
 if(!Number.isSafeInteger(n)||n<1)return {status:'HOLD_SELECT_ORIGINAL_CAMPAIGN',
  ready:false,receipts:[],eligible_items:[],financial_books_closed:false};
 const {gate,master}=await source721(db,env,n);
 const query=await db.prepare("SELECT social_post_attempt_id,attempted_by_user_id,attempt_status,external_post_id,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_evidence_review_721' ORDER BY social_post_attempt_id DESC LIMIT 41").bind(n).all();
 const records=Array.isArray(query?.results)?query.results:[];
 const receipts=records.slice(0,40).map(row=>{
  let data={};try{data=JSON.parse(row.response_json||'{}')}catch{}
  const source=gate.eligible_items.find(x=>x.renewal_receipt_id===data.renewal_receipt_id);
  const verified=gate.ready&&!!source&&
   data.original_ninth_receipt_id===source.ninth_signed_receipt_id&&
   data.original_outside_receipt_id===source.outside_signed_receipt_id&&
   data.source_revision===master.source_revision&&
   data.fingerprint_sha256===master.fingerprint_sha256&&
   data.owner_review_checked===true&&data.financial_books_closed===false&&
   Number(data.admin_user_id)===Number(row.attempted_by_user_id)&&
   row.attempt_status==='owner_source_reviewed_books_hold_721'&&
   row.external_post_id==='finance721-owner-review-'+n+'-'+data.renewal_receipt_id;
  return {receipt_id:Number(row.social_post_attempt_id),renewal_receipt_id:
   Number(data.renewal_receipt_id),recorded_at:row.attempted_at,verified_current:!!verified};
 });
 return {...gate,ready:gate.ready&&records.length<=40,
  source_revision:gate.ready?master.source_revision:null,
  fingerprint_sha256:gate.ready?master.fingerprint_sha256:null,
  receipts,owner_review_recorded_current:receipts.some(x=>x.verified_current),
  financial_books_closed:false,independent_external_response_generated:false};
}
export async function onRequestPost(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env||{});
 if(!admin)return jsonResponse({ok:false,error:'Active verified Administrator required.'},401,{'Cache-Control':'no-store'});
 if(!db)return jsonResponse({ok:false,error:'D1 not configured.'},503,{'Cache-Control':'no-store'});
 let p={};try{p=await c.request.json()}catch{}
 const n=Number(p.campaign_queue_id),renewal=Number(p.original_711_renewal_receipt_id),
  note=String(p.review_note||'').trim();
 if(p.action!=='owner_original_source_review_721'||
  !Number.isSafeInteger(n)||n<1||!Number.isSafeInteger(renewal)||renewal<1||
  p.owner_review_checked!==true||note.length<25||note.length>400)
  return jsonResponse({ok:false,error:'Explicit Admin review and valid original IDs required. HOLD.'},400,{'Cache-Control':'no-store'});
 try{
  const {gate,master}=await source721(db,c.env,n);
  const src=gate.eligible_items.find(x=>x.renewal_receipt_id===renewal);
  if(!gate.ready||!src||p.expected_source_revision!==master.source_revision||
   p.expected_fingerprint_sha256!==master.fingerprint_sha256||
   Number(p.original_716_signed_ninth_receipt_id)!==src.ninth_signed_receipt_id||
   Number(p.original_717_signed_outside_receipt_id)!==src.outside_signed_receipt_id)
   throw Error('Original independent ninth/outside source, freshness or exact Master revision changed. HOLD.');
  const fresh=await source721(db,c.env,n);
  if(!fresh.gate.ready||fresh.master.source_revision!==master.source_revision||
   fresh.master.fingerprint_sha256!==master.fingerprint_sha256||
   !fresh.gate.eligible_items.some(x=>x.renewal_receipt_id===renewal&&
    x.ninth_signed_receipt_id===src.ninth_signed_receipt_id&&
    x.outside_signed_receipt_id===src.outside_signed_receipt_id))
   throw Error('Original source drift detected during owner review. HOLD.');
  const nonce='finance721-owner-review-'+n+'-'+renewal;
  const data={renewal_receipt_id:renewal,original_ninth_receipt_id:src.ninth_signed_receipt_id,
   original_outside_receipt_id:src.outside_signed_receipt_id,
   source_revision:master.source_revision,fingerprint_sha256:master.fingerprint_sha256,
   admin_user_id:admin.user_id,owner_review_checked:true,review_note:note,
   financial_books_closed:false,external_signature_generated:false,
   original_phone_witness_verified:false};
  const written=await db.prepare("INSERT INTO social_post_attempts (social_post_queue_id,platform_key,attempt_status,external_post_id,response_json,attempted_by_user_id,notes) SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM social_post_attempts WHERE platform_key=? AND external_post_id=?)")
   .bind(n,'finance_owner_evidence_review_721','owner_source_reviewed_books_hold_721',
    nonce,JSON.stringify(data),admin.user_id,'Explicit Admin original-source review only; no books close.',
    'finance_owner_evidence_review_721',nonce).run();
  if(!written?.success||Number(written.meta?.changes)!==1)
   throw Error('Existing original-source review or rejected D1 write. HOLD.');
  const after=await readOwnerReviewLedger721(db,c.env,n);
  const exact=after.receipts.find(x=>x.renewal_receipt_id===renewal&&x.verified_current);
  if(!exact)throw Error('Original owner review D1 readback failed. HOLD.');
  return jsonResponse({ok:true,build:721,status:'SOURCE_BOUND_ADMIN_OWNER_REVIEW_RECORDED_BOOKS_HOLD_721',
   receipt_id:exact.receipt_id,financial_books_closed:false,provider_execution:false,
   externally_signed_custody_document_created:false},200,{'Cache-Control':'private, no-store'});
 }catch(e){return jsonResponse({ok:false,error:String(e.message||'Original source HOLD.')},409,{'Cache-Control':'private, no-store'});}
}

export async function onRequestGet(c){
 const admin=verifiedAdminFromModule(c);
 if(!admin)return jsonResponse({ok:false,error:'Active Administrator required.'},401);
 const env=c.env||{},rows=checks.map(([group,name,classification])=>({group,name,
  classification,status:present(env[name])?'PRESENT':'NOT_SET',value_exposed:false}));
 const bindings=[['DB',!!getDb(env)],['PRODUCT_MEDIA_BUCKET',!!env.PRODUCT_MEDIA_BUCKET],
 ['CAIP_PRIVATE_MEDIA_BUCKET',!!env.CAIP_PRIVATE_MEDIA_BUCKET]].map(([name,ready])=>({name,status:ready?'BOUND':'NOT_BOUND',value_exposed:false}));
 const review720=String(new URL(c.request.url).searchParams.get('review')||'')==='720';
 const requestUrl=new URL(c.request.url);
 const review721=requestUrl.searchParams.get('review')==='721';
 let ledger721=null;
 if(review721){
  const n=Number(requestUrl.searchParams.get('campaign_queue_id'));
  ledger721=await readOwnerReviewLedger721(getDb(env),env,n);
 }
 const uri=String(env.ETSY_REDIRECT_URI||'');
 return jsonResponse({ok:true,build:406,source:'CURRENT_FUNCTION_ENVIRONMENT',environment_values_exposed:false,
  inspection_scope:'PRESENCE_AND_EXPECTED_ETSY_CALLBACK_ONLY',runtime_secret_values_returned:0,
  note:'A present value is not proof of provider approval, OAuth expiry, correct permissions or successful live API calls. Future/optional secrets may legitimately be absent.',
  etsy_callback_matches_production:uri==='https://devilndove.com/api/social/oauth/etsy/callback',
  rows,bindings,
  ...(review720?{review720:reviewProviderBindingDrift720(env)}:{}),
  ...(review721?{review721:ledger721}:{}),
  documentation:'/docs/operations/RELEASE_467_BUILD_406_PRODUCTION_CONFIGURATION_AUDIT.md'},200,{'Cache-Control':'no-store'});
}

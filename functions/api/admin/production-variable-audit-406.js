// Build 406: read-only Cloudflare Production configuration presence only; never echo secrets.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {finance718,financial685} from './social-post-queue.js';
import {sourceVerifiedOwnerReview721,verifyIndependentRotationReceipt722,reconcileOwnerReviewDrift722,reviewSevenAppHandoff722} from './_lib/projectFinanceEvidence.js';
import {masterTrustStatus724,verifyMasterEnvelope724,verifyKeyCustodyRotation724,recordMasterReplayReview724} from './_lib/projectFinanceEvidence.js';
import {eventEnvelopeContract726,queueSourceEvent726,inspectSourceEvents726,localDeadLetterReview726,verifyPeerAckReview726,signedPeerAckReview726} from './_lib/projectFinanceEvidence.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {privacyAlerts730,retryWindow730,BUILD730_POLICY} from './_lib/privacyOperations730.js';
import {sixTierSecurityInventory723,sevenAxisCompletionBaseline723,assessTierCandidate723} from '../_lib/appModuleRoutes.js';
import {independentReleaseStatus725,negotiateIndependentSync725,assessConsentTenantCapability725,resolveKeyring728,vaultEncrypt728,vaultDecryptForRotation728,digest728,hmacScope728,retentionEligibility728,verifyLiveWithdrawalAck728,BUILD728_POLICY,BUILD729_PEERS,peerConfig729,verifyPeerChallenge729} from '../_lib/appModuleRoutes.js';
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

/* Build 721 — issuer-origin credential lifecycle must be independently verified.
 * Cloudflare presence cannot establish rotation time, current validity or issuer ACK.
 * Provider-specific proof stays manual until actual issuer-origin evidence exists. */
export function lifecycleEvidence721(env={}){
 const snapshot=reviewProviderBindingDrift720(env);
 return {build:721,evidence_source:'CLOUDFLARE_VARIABLE_NAME_PRESENCE_ONLY',
  provider_states:snapshot.providers.map(p=>({
   provider:p.provider,configuration:p.status,
   issuer_rotation_receipt:'NOT_VERIFIED',issuer_rotation_at:null,
   credential_expires_at:null,credential_age_status:'UNKNOWN_NO_ISSUER_RECORD',
   action:p.status==='NOT_CONFIGURED_OPTIONAL'?'NO_ACTION_UNTIL_ENABLED':
    p.status==='INCOMPLETE_REVIEW_HOLD'?'COMPLETE_ONLY_AUTHORIZED_PROVIDER_CONFIG':
    'VERIFY_ISSUER_RECEIPT_AND_EXPIRY_OUTSIDE_APP',
   credential_rotation_performed:false
  })),canonical_ci_secrets_already_reported:[
    'CF_ACCESS_CLIENT_ID','CF_ACCESS_CLIENT_SECRET',
    'CLOUDFLARE_API_TOKEN','CLOUDFLARE_API_TOKEN_EDIT'],
  duplicated_ci_secret_requested:false,
  issuer_account_access_performed:false,
  credential_values_exposed:0,automatic_rotation:false,
  external_custody_signatures_issued:false,
  independent_source_binding:'HOLD_UNTIL_ORIGINAL_SIGNED_718_RECHECK',
  cross_app_connected:false};
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

const id728=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hold728=(code,status=409)=>({status,data:{ok:false,build:728,code,remote_delivery_verified:false}});
const ok728=(code,value={})=>({status:200,data:{ok:true,build:728,code,...value}});
const latest728=(db,id)=>db.prepare('SELECT * FROM dnd_evidence_versions_728 WHERE evidence_id=? ORDER BY version DESC LIMIT 1').bind(id).first();
const meta728=(db,id)=>db.prepare('SELECT * FROM dnd_evidence_vault_728 WHERE evidence_id=? LIMIT 1').bind(id).first();
async function action728(c,db,admin,p){
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin&&
   c.request.headers.get('Sec-Fetch-Site')!=='same-origin')
  return hold728('HOLD_SAME_ORIGIN_REQUIRED',403);
 if(JSON.stringify(p).length>10000)return hold728('HOLD_OVERSIZED_REQUEST',413);
 if(p.owner_review_confirmed!==true)return hold728('HOLD_OWNER_REVIEW_REQUIRED',400);
 const ring=resolveKeyring728(c.env||{}),id=String(p.evidence_id||'');
 try{
 if(p.action==='vault_store_728'){
  const tenant=String(p.tenant_scope_sha256||''),purpose=String(p.purpose||''),
    days=Number(p.retention_days),nonce=String(p.request_key||'');
  if(!ring.ready)return hold728(ring.reason);
  if(!/^[a-f0-9]{64}$/.test(tenant)||!['security_evidence','retention_review','consent_withdrawal'].includes(purpose)||
     !Number.isInteger(days)||days<1||days>3650||nonce.length<16||nonce.length>80)
   return hold728('HOLD_VAULT_SCOPE');
  const evidenceId=crypto.randomUUID(),cipher=await vaultEncrypt728(p.evidence_payload,
   ring.keys.get(ring.active_id),ring.active_id,tenant,purpose,evidenceId,1);
  await db.batch([
   db.prepare('INSERT INTO dnd_evidence_vault_728(evidence_id,tenant_scope_sha256,purpose,retention_days,legal_hold,request_key_sha256,created_by_user_id) VALUES(?,?,?,?,?,?,?)')
    .bind(evidenceId,tenant,purpose,days,p.legal_hold===true?1:0,await digest728(nonce),admin.user_id),
   db.prepare('INSERT INTO dnd_evidence_versions_728(evidence_id,version,key_id,iv_b64url,ciphertext_b64url,ciphertext_sha256,created_by_user_id) VALUES(?,?,?,?,?,?,?)')
    .bind(evidenceId,1,cipher.key_id,cipher.iv_b64url,cipher.ciphertext_b64url,cipher.ciphertext_sha256,admin.user_id)
  ]);
  if((await latest728(db,evidenceId))?.ciphertext_sha256!==cipher.ciphertext_sha256)
   return hold728('HOLD_D1_ENCRYPTION_READBACK');
  return ok728('ENCRYPTED_EVIDENCE_STORED',{evidence_id:evidenceId,key_id:cipher.key_id,
   ciphertext_sha256:cipher.ciphertext_sha256,plaintext_returned:false,existing_records_reencrypted:false});
 }
 if(p.action==='vault_rotate_728'){
  if(!id728.test(id)||!ring.ready)return hold728('HOLD_ACTIVE_KEY_OR_ID');
  const [v,old]=await Promise.all([meta728(db,id),latest728(db,id)]);
  if(!v||!old)return hold728('HOLD_VAULT_SOURCE_MISSING');
  if(old.key_id===ring.active_id)return ok728('ALREADY_ACTIVE_KEY',{evidence_id:id,version:old.version});
  if(!ring.keys.has(old.key_id)||old.version>=999)return hold728('HOLD_PREVIOUS_KEY_REQUIRED');
  const original=await vaultDecryptForRotation728(old,ring.keys.get(old.key_id),v.tenant_scope_sha256,v.purpose,id);
  const cipher=await vaultEncrypt728(original,ring.keys.get(ring.active_id),ring.active_id,
    v.tenant_scope_sha256,v.purpose,id,Number(old.version)+1);
  const result=await db.prepare('INSERT INTO dnd_evidence_versions_728(evidence_id,version,key_id,iv_b64url,ciphertext_b64url,ciphertext_sha256,previous_version_sha256,created_by_user_id) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT MAX(version) FROM dnd_evidence_versions_728 WHERE evidence_id=?)=?')
   .bind(id,cipher.version,cipher.key_id,cipher.iv_b64url,cipher.ciphertext_b64url,
     cipher.ciphertext_sha256,old.ciphertext_sha256,admin.user_id,id,old.version).run();
  if(Number(result?.meta?.changes)!==1||(await latest728(db,id))?.ciphertext_sha256!==cipher.ciphertext_sha256)
   return hold728('HOLD_ROTATION_RACE_OR_READBACK');
  return ok728('ENCRYPTED_VERSION_ROTATED',{evidence_id:id,version:cipher.version,key_id:cipher.key_id,
   original_ciphertext_retained:true,old_key_retirement_not_automatic:true,plaintext_returned:false});
 }
 return await action728continued(c,db,admin,p);
 }catch{return hold728('HOLD_ORIGINAL_D1_OR_CRYPTO_ERROR');}
}

async function action728continued(c,db,admin,p){
 const id=String(p.evidence_id||''),action=String(p.action||'');
 if(action==='retention_prepare_728'){
  if(!id728.test(id))return hold728('HOLD_EVIDENCE_ID');
  const [v,latest]=await Promise.all([meta728(db,id),latest728(db,id)]);
  const status=retentionEligibility728(v,null,latest);
  if(status!=='ELIGIBLE_FOR_INDEPENDENT_REVIEW')return hold728(status);
  const review=crypto.randomUUID();
  const w=await db.prepare('INSERT INTO dnd_evidence_retention_reviews_728(review_id,evidence_id,source_ciphertext_sha256,requested_by_user_id) VALUES(?,?,?,?)')
   .bind(review,id,latest.ciphertext_sha256,admin.user_id).run();
  if(Number(w?.meta?.changes)!==1)return hold728('HOLD_REVIEW_WRITE');
  return ok728('PENDING_DIFFERENT_ADMIN_APPROVAL',{review_id:review,evidence_id:id,deleted:false});
 }
 if(action==='retention_approve_728'||action==='retention_execute_728'){
  const reviewId=String(p.review_id||'');
  if(!id728.test(reviewId))return hold728('HOLD_REVIEW_ID');
  const review=await db.prepare('SELECT * FROM dnd_evidence_retention_reviews_728 WHERE review_id=?').bind(reviewId).first();
  if(!review||admin.user_id===Number(review.requested_by_user_id))return hold728('HOLD_DISTINCT_REQUESTER');
  const [v,latest]=await Promise.all([meta728(db,review.evidence_id),latest728(db,review.evidence_id)]);
  const status=retentionEligibility728(v,review,latest);
  if(status!=='ELIGIBLE_FOR_INDEPENDENT_REVIEW')return hold728(status);
  if(action==='retention_approve_728'){
   if(review.review_state!=='PENDING')return hold728('HOLD_NOT_PENDING');
   const r=await db.prepare("UPDATE dnd_evidence_retention_reviews_728 SET review_state='APPROVED',approved_by_user_id=?,approved_at=CURRENT_TIMESTAMP WHERE review_id=? AND review_state='PENDING' AND requested_by_user_id<>?")
    .bind(admin.user_id,reviewId,admin.user_id).run();
   if(Number(r?.meta?.changes)!==1)return hold728('HOLD_APPROVAL_CONFLICT');
   return ok728('INDEPENDENT_APPROVAL_RECORDED',{review_id:reviewId,deleted:false});
  }
  if(review.review_state!=='APPROVED'||admin.user_id===Number(review.approved_by_user_id))
   return hold728('HOLD_THIRD_DISTINCT_EXECUTOR');
  await db.batch([
   db.prepare(`INSERT INTO dnd_evidence_purge_receipts_728(evidence_id,review_id,deleted_ciphertext_sha256,executed_by_user_id)
    SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM dnd_evidence_versions_728 WHERE evidence_id=? AND ciphertext_sha256=?
    AND version=(SELECT MAX(version) FROM dnd_evidence_versions_728 WHERE evidence_id=?))`)
    .bind(review.evidence_id,reviewId,latest.ciphertext_sha256,admin.user_id,
     review.evidence_id,latest.ciphertext_sha256,review.evidence_id),
   db.prepare('DELETE FROM dnd_evidence_versions_728 WHERE evidence_id=? AND EXISTS (SELECT 1 FROM dnd_evidence_purge_receipts_728 WHERE evidence_id=?)')
    .bind(review.evidence_id,review.evidence_id)
  ]);
  const [receipt,left]=await Promise.all([
   db.prepare('SELECT * FROM dnd_evidence_purge_receipts_728 WHERE evidence_id=?').bind(review.evidence_id).first(),
   db.prepare('SELECT COUNT(*) AS n FROM dnd_evidence_versions_728 WHERE evidence_id=?').bind(review.evidence_id).first()
  ]);
  if(!receipt||Number(left?.n)!==0)return hold728('HOLD_PURGE_READBACK');
  return ok728('SUPERVISED_VAULT_CIPHERTEXT_PURGED',{evidence_id:review.evidence_id,
   review_id:reviewId,immutable_receipt_preserved:true,
   all_cloudflare_backups_deleted:false,source_customer_data_deleted:false});
 }
 if(action==='dispatch_withdrawal_728'){
  const eventId=String(p.event_id||'');
  if(!id728.test(eventId))return hold728('HOLD_EVENT_ID');
  const e=await db.prepare(`SELECT w.*,m.consent_status FROM dnd_withdrawal_outbox_728 w
   JOIN media_consent_records m ON m.consent_record_id=w.consent_record_id WHERE w.event_id=?`)
    .bind(eventId).first();
  if(!e||!['revoked','blocked'].includes(String(e.consent_status||'').toLowerCase()))
   return hold728('HOLD_WITHDRAWN_SOURCE_NOT_VERIFIED');
  if(await db.prepare('SELECT event_id FROM dnd_withdrawal_acks_728 WHERE event_id=?').bind(eventId).first())
   return ok728('PREVIOUS_SIGNED_PEER_ACK_RECORDED',{event_id:eventId,no_resend:true});
  const prefix='DND728_PEER_'+e.target_app.replace(/-/g,'_').toUpperCase()+'_';
  const urlText=String(c.env[prefix+'URL']||''),pk=String(c.env[prefix+'PUBLIC_KEY_B64URL']||''),
   secret=String(c.env[prefix+'HMAC_KEY_B64URL']||''),
   enrolled=String(c.env[prefix+'ENROLLMENT_RECEIPT']||'');
  if(!urlText||!pk||!secret||enrolled.length<16)return hold728('HOLD_PEER_NOT_ENROLLED');
  const url=new URL(urlText);
  if(url.protocol!=='https:'||url.port||url.username||url.password||url.search||url.hash||
   /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/i.test(url.hostname)||
   !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname))return hold728('HOLD_INVALID_OR_PRIVATE_PEER_URL');
  const envelope={schema_id:'rosevear.dnd.consent.withdrawal.v1',from_app:'devilndove',
   to_app:e.target_app,event_id:eventId,request_nonce:e.request_nonce,
   scope_hmac_sha256:e.scope_hmac_sha256,issued_at:new Date().toISOString(),
   expires_at:new Date(Date.now()+120000).toISOString()};
  const signed=await hmacScope728(secret,JSON.stringify(envelope));
  let response;
  try{response=await fetch(url.href,{method:'POST',redirect:'error',headers:{
   'Content-Type':'application/json','X-DND-HMAC-SHA256':signed,'Cache-Control':'no-store'},
   body:JSON.stringify(envelope),signal:AbortSignal.timeout(7000)});}
  catch{return hold728('HOLD_LIVE_PEER_OFFLINE');}
  if(response.status!==200||!String(response.headers.get('Content-Type')||'').includes('application/json'))
   return hold728('HOLD_PEER_NO_JSON_ACK');
  const raw=await response.text();if(raw.length>4096)return hold728('HOLD_OVERSIZED_ACK');
  let body;try{body=JSON.parse(raw);}catch{return hold728('HOLD_INVALID_ACK_JSON');}
  const verified=await verifyLiveWithdrawalAck728(body,e,pk);
  if(!verified.verified)return hold728('HOLD_PEER_ED25519_ACK_NOT_VERIFIED');
  await db.prepare(`INSERT OR IGNORE INTO dnd_withdrawal_acks_728
   (event_id,peer_app,ack_envelope_sha256,peer_signature_verified,observed_live_response,created_by_user_id)
   VALUES(?,?,?,?,?,?)`).bind(eventId,e.target_app,verified.receipt_sha256,1,1,admin.user_id).run();
  const ack=await db.prepare('SELECT * FROM dnd_withdrawal_acks_728 WHERE event_id=?').bind(eventId).first();
  if(ack?.ack_envelope_sha256!==verified.receipt_sha256)return hold728('HOLD_DURABLE_ACK_MISMATCH');
  return ok728('LIVE_SIGNED_RECEIVER_ACK_RECORDED',{event_id:eventId,peer_app:e.target_app,
    signed_ack_verified:true,source_customer_deletion_proven:false,
    remote_platform_recall_proven:false,original_host_receiver_enabled:false});
 }
 return hold728('HOLD_UNKNOWN_BUILD728_ACTION',400);
}

async function review728(db,env){
 const ring=resolveKeyring728(env),count=async sql=>{try{return (await db?.prepare(sql).first())?.n??null}catch{return null}};
 const vaults=await count('SELECT COUNT(*) AS n FROM dnd_evidence_vault_728');
 const view=async sql=>{try{return (await db?.prepare(sql).all())?.results||[]}catch{return []}};
 const pending_events=await view(`SELECT w.event_id,w.target_app,w.created_at,
    CASE WHEN a.event_id IS NULL THEN 'HELD_NOT_DELIVERED' ELSE 'LIVE_SIGNED_ACK' END AS delivery_state
    FROM dnd_withdrawal_outbox_728 w LEFT JOIN dnd_withdrawal_acks_728 a ON a.event_id=w.event_id
    ORDER BY w.created_at DESC LIMIT 30`);
 const vault_versions=await view(`SELECT v.evidence_id,v.purpose,v.retention_days,v.legal_hold,
    x.key_id,x.version,x.created_at AS encrypted_at,
    CASE WHEN p.evidence_id IS NULL THEN 'ENCRYPTED_RETAINED' ELSE 'PURGED_D1' END AS storage_state
    FROM dnd_evidence_vault_728 v LEFT JOIN dnd_evidence_versions_728 x ON x.evidence_id=v.evidence_id
    AND x.version=(SELECT MAX(version) FROM dnd_evidence_versions_728 WHERE evidence_id=v.evidence_id)
    LEFT JOIN dnd_evidence_purge_receipts_728 p ON p.evidence_id=v.evidence_id
    ORDER BY v.created_at DESC LIMIT 20`);
 return {policy:BUILD728_POLICY,schema_ready:vaults!==null,active_key_present:ring.ready,
  pending_events,vault_versions,
  active_key_id:ring.active_id,encrypted_evidence_count:vaults,
  ciphertext_versions:await count('SELECT COUNT(*) AS n FROM dnd_evidence_versions_728'),
  held_withdrawals:await count('SELECT COUNT(*) AS n FROM dnd_withdrawal_outbox_728'),
  live_signed_peer_receipts:await count('SELECT COUNT(*) AS n FROM dnd_withdrawal_acks_728'),
  supervised_purge_receipts:await count('SELECT COUNT(*) AS n FROM dnd_evidence_purge_receipts_728'),
  automatic_deletion:false,other_apps_deployed:false,existing_customer_data_reencrypted:false};
}


/* Build 729: original Admin-only keyring canary, signed peer challenge, on-demand custody dashboard. */
const hold729=(code,status=409)=>({status,data:{ok:false,build:729,code,
  live_enrollment_verified:false,external_data_removed:false}});
async function action729(c,db,admin,p){
 const origin=new URL(c.request.url).origin;
 if(c.request.headers.get('Origin')!==origin&&c.request.headers.get('Sec-Fetch-Site')!=='same-origin')
  return hold729('HOLD_SAME_ORIGIN_REQUIRED',403);
 if(JSON.stringify(p).length>3500||p.owner_review_confirmed!==true)
  return hold729('HOLD_BOUNDED_OWNER_APPROVAL_REQUIRED',400);
 const env=c.env||{};
 if(p.action==='verify_keyring_729'){
  const ring=resolveKeyring728(env);
  if(!ring.ready)return hold729(ring.reason);
  try{
   const tenant='0'.repeat(64),id=crypto.randomUUID(),key=ring.keys.get(ring.active_id);
   const cipher=await vaultEncrypt728({canary:'build729-in-memory-only'},key,ring.active_id,
    tenant,'security_evidence',id,1);
   const original=await vaultDecryptForRotation728(cipher,key,tenant,'security_evidence',id);
   if(original.canary!=='build729-in-memory-only')return hold729('HOLD_KEYRING_CANARY_FAILED');
   return {status:200,data:{ok:true,build:729,code:'ACTIVE_KEY_AES_GCM_CANARY_VERIFIED',
    active_key_id:ring.active_id,configured_keys:ring.keys.size,plaintext_or_key_returned:false,
    cloudflare_secret_created_by_this_request:false,historical_records_rotated:false}};
  }catch{return hold729('HOLD_KEYRING_CANARY_FAILED');}
 }
 if(p.action!=='probe_peer_729'||!BUILD729_PEERS.includes(p.target_app))
  return hold729('HOLD_UNRECOGNIZED_PEER_ACTION',400);
 const target=String(p.target_app),config=peerConfig729(env,target);
 if(!config.ready)return hold729(config.reason);
 const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
 const challenge={schema_id:'rosevear.dnd.peer.enrollment.challenge.v1',
  from_app:'devilndove',to_app:target,nonce,
  issued_at:new Date().toISOString(),expires_at:new Date(Date.now()+120000).toISOString()};
 try{
  const signature=await hmacScope728(config.hmac_key,JSON.stringify(challenge));
  const response=await fetch(config.url,{method:'POST',redirect:'error',
    headers:{'Content-Type':'application/json','X-DND-HMAC-SHA256':signature,'Cache-Control':'no-store'},
    body:JSON.stringify(challenge),signal:AbortSignal.timeout(7000)});
  if(response.status!==200||!String(response.headers.get('content-type')||'').includes('application/json'))
   return hold729('HOLD_LIVE_PEER_CHALLENGE_NOT_ACKNOWLEDGED');
  const raw=await response.text();if(raw.length>4000)return hold729('HOLD_OVERSIZED_PEER_RESPONSE');
  const body=JSON.parse(raw);
  const verified=await verifyPeerChallenge729(body,challenge,config.public_key);
  if(!verified.verified)return hold729(verified.status);
  const proof=crypto.randomUUID(),pin=await digest728('pinned-key:'+config.public_key);
  const receipt=await digest728('enrollment:'+config.receipt);
  const write=await db.prepare(`INSERT INTO dnd_peer_enrollment_proofs_729
    (proof_id,peer_app,challenge_nonce,pinned_public_key_sha256,original_enrollment_receipt_sha256,
     signed_ack_sha256,observed_live_response,signature_verified,verified_by_user_id)
     VALUES(?,?,?,?,?,?,1,1,?)`)
    .bind(proof,target,nonce,pin,receipt,verified.receipt_sha256,admin.user_id).run();
  if(Number(write?.meta?.changes)!==1)return hold729('HOLD_ORIGINAL_D1_PROOF_WRITE');
  const readback=await db.prepare('SELECT signed_ack_sha256 FROM dnd_peer_enrollment_proofs_729 WHERE proof_id=?')
   .bind(proof).first();
  if(readback?.signed_ack_sha256!==verified.receipt_sha256)return hold729('HOLD_ORIGINAL_D1_PROOF_READBACK');
  return {status:200,data:{ok:true,build:729,code:'LIVE_PEER_SIGNATURE_AND_D1_PROOF_VERIFIED',
   peer_app:target,proof_id:proof,live_enrollment_verified:true,
   withdrawal_ack_verified_by_this_probe:false,original_t5_receiver_enabled:false,
   cross_app_data_deleted:false,cloudflare_secrets_exposed:false}};
 }catch{return hold729('HOLD_LIVE_PEER_OFFLINE_OR_PROOF_NOT_RECORDED');}
}
async function review729(db,env){
 const base=await review728(db,env),ring=resolveKeyring728(env);
 const all=async(sql,params=[])=>{try{if(!db)return [];const st=db.prepare(sql);
  return (await (params.length?st.bind(...params):st).all())?.results||[];}catch{return [];}};
 const one=async(sql,params=[])=>{try{if(!db)return null;const st=db.prepare(sql);
  return await (params.length?st.bind(...params):st).first()||null;}catch{return null;}};
 const proofSchema=await one("SELECT name FROM sqlite_master WHERE type='table' AND name='dnd_peer_enrollment_proofs_729'");
 const delivery=await all(`SELECT w.target_app,
   COUNT(*) AS queued,SUM(CASE WHEN a.event_id IS NOT NULL THEN 1 ELSE 0 END) AS acknowledged,
   SUM(CASE WHEN a.event_id IS NULL AND w.created_at<datetime('now','-1 day') THEN 1 ELSE 0 END) AS aged_one_day,
   SUM(CASE WHEN a.event_id IS NULL AND w.created_at<datetime('now','-7 days') THEN 1 ELSE 0 END) AS aged_seven_days
   FROM dnd_withdrawal_outbox_728 w LEFT JOIN dnd_withdrawal_acks_728 a ON a.event_id=w.event_id
   GROUP BY w.target_app`);
 const peers=[];
 for(const peer of BUILD729_PEERS){
  const cfg=peerConfig729(env,peer);
  const last=proofSchema?await one(`SELECT proof_id,created_at,pinned_public_key_sha256,
     original_enrollment_receipt_sha256 FROM dnd_peer_enrollment_proofs_729
     WHERE peer_app=? ORDER BY created_at DESC LIMIT 1`,[peer]):null;
  const pinned=cfg.ready?await digest728('pinned-key:'+cfg.public_key):null;
  const receipt=cfg.ready?await digest728('enrollment:'+cfg.receipt):null;
  const age=last?Date.now()-Date.parse(String(last.created_at).replace(' ','T')+'Z'):Infinity;
  const current=cfg.ready&&last&&last.pinned_public_key_sha256===pinned&&
    last.original_enrollment_receipt_sha256===receipt&&age>=0&&age<=604800000;
  const d=delivery.find(x=>x.target_app===peer)||{};
  peers.push({peer_app:peer,configured:cfg.ready,reason:cfg.ready?null:cfg.reason,
   state:!cfg.ready?'HOLD_PEER_CONFIGURATION':!proofSchema?'HOLD_D1_PROOF_SCHEMA':
    current?'CURRENT_LIVE_SIGNED_CHALLENGE_PROOF':'HOLD_FRESH_LIVE_SIGNED_PROOF_REQUIRED',
   latest_proof_id:current?last.proof_id:null,latest_proof_at:current?last.created_at:null,
   queued:Number(d.queued||0),signed_withdrawal_acks:Number(d.acknowledged||0),
   held:Math.max(0,Number(d.queued||0)-Number(d.acknowledged||0)),
   aged_one_day:Number(d.aged_one_day||0),aged_seven_days:Number(d.aged_seven_days||0),
   external_platform_recall_proven:false,physical_master_receiver_enabled:false});
 }
 const latestKey=ring.ready?await one(`SELECT COUNT(*) AS total, SUM(CASE WHEN v.key_id<>? THEN 1 ELSE 0 END) AS needs_rotation
   FROM dnd_evidence_versions_728 v WHERE v.version=(SELECT MAX(v2.version)
   FROM dnd_evidence_versions_728 v2 WHERE v2.evidence_id=v.evidence_id)`,[ring.active_id]):null;
 const reviews=await all(`SELECT r.review_id,r.evidence_id,r.review_state,r.requested_at,r.approved_at,
   v.legal_hold,v.retention_days,v.created_at AS evidence_created_at,
   x.ciphertext_sha256 AS latest_sha,
   r.source_ciphertext_sha256 FROM dnd_evidence_retention_reviews_728 r
   JOIN dnd_evidence_vault_728 v ON v.evidence_id=r.evidence_id
   LEFT JOIN dnd_evidence_versions_728 x ON x.evidence_id=v.evidence_id
    AND x.version=(SELECT MAX(version) FROM dnd_evidence_versions_728 WHERE evidence_id=v.evidence_id)
   ORDER BY r.requested_at DESC LIMIT 30`);
 const retention=reviews.map(r=>({review_id:r.review_id,evidence_id:r.evidence_id,
  review_state:r.review_state,requested_at:r.requested_at,approved_at:r.approved_at,
  eligibility:retentionEligibility728({legal_hold:r.legal_hold,
   retention_days:r.retention_days,created_at:r.evidence_created_at},
   {source_ciphertext_sha256:r.source_ciphertext_sha256},
   r.latest_sha?{ciphertext_sha256:r.latest_sha}:null)}));
 return {build:729,policy:'MANUAL_OWNER_GATED_ORIGINAL_ADMIN',schema_ready:base.schema_ready&&!!proofSchema,
  keyring:{state:ring.ready?'CONFIGURED_CANARY_REQUIRES_EXPLICIT_OPERATOR_CHECK':ring.reason,
   configured:ring.ready,active_key_id:ring.active_id,configured_key_count:ring.keys.size,
   current_ciphertexts:Number(latestKey?.total||0),
   latest_ciphertexts_needing_rotation:latestKey?Number(latestKey.needs_rotation||0):null,
   secret_values_exposed:false,keys_provisioned_by_application:false,old_keys_auto_retired:false},
  peers,retention_reviews:retention,withdrawal_events:base.pending_events,
  counters:{encrypted_evidence:base.encrypted_evidence_count,
   signed_withdrawal_receipts:base.live_signed_peer_receipts,
   vault_purge_receipts:base.supervised_purge_receipts},
  automated_purge:false,automatic_retries:false,active_background_delivery:false,
  production_secrets_provisioned_by_this_release:false,original_master_receivers_enabled:false};
}


// Build 730: read-only truthful operations dashboard; no cron/remote state is asserted.
async function review730(db,env){
 const source=await review729(db,env),alerts=privacyAlerts730(source);
 const attempts=[];let durableSchema=false;
 if(db){
  try{
   const schema=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='dnd_withdrawal_retry_state_730'").first();
   durableSchema=!!schema;
   const sql=durableSchema?`SELECT w.event_id,w.target_app,w.created_at,
      CASE WHEN a.event_id IS NULL THEN 0 ELSE 1 END AS acknowledged,
      s.attempt_count,s.retry_after,s.state,s.updated_at
      FROM dnd_withdrawal_outbox_728 w
      LEFT JOIN dnd_withdrawal_acks_728 a ON a.event_id=w.event_id
      LEFT JOIN dnd_withdrawal_retry_state_730 s ON s.event_id=w.event_id
      ORDER BY w.created_at ASC LIMIT 60`:
    `SELECT w.event_id,w.target_app,w.created_at,
      CASE WHEN a.event_id IS NULL THEN 0 ELSE 1 END AS acknowledged
      FROM dnd_withdrawal_outbox_728 w
      LEFT JOIN dnd_withdrawal_acks_728 a ON a.event_id=w.event_id
      ORDER BY w.created_at ASC LIMIT 60`;
   const rows=(await db.prepare(sql).all())?.results||[];
   for(const row of rows){
    const current=durableSchema&&row.state?row.state:'HOLD_UNINITIALIZED_DURABLE_RETRY';
    attempts.push({event_id:row.event_id,target_app:row.target_app,
      ...retryWindow730({attempts:Number(row.attempt_count||0),created_at:row.created_at,
       last_attempt_at:row.updated_at,acknowledged:!!row.acknowledged}),
      durable_state:current,durable_retry_after:durableSchema?row.retry_after||null:null,
      automatic_send_authorized:false});
   }
  }catch{alerts.alerts.push({code:'WITHDRAWAL_D1_UNAVAILABLE',severity:'critical',count:1});}
 }
 return {build:730,policy:BUILD730_POLICY,alerts:alerts.alerts,
   queued_review:attempts,scheduler:'NOT_DEPLOYED',
   dead_letter_ledger:durableSchema?'D1_SCHEMA_PRESENT_NO_WORKER':'NOT_DEPLOYED',
   retry_attempt_ledger:durableSchema?'D1_SCHEMA_PRESENT_NO_WORKER':'NOT_DEPLOYED',
   manual_delivery:'BUILD728_SUPERVISED_ONLY',
   rotation_schedule:'ADVISORY_ONLY_NO_AUTOMATIC_REENCRYPTION',
   remote_ack_implied:false,source};
}

export async function onRequestPost(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env||{});
 if(!admin)return jsonResponse({ok:false,error:'Active verified Administrator required.'},401,{'Cache-Control':'no-store'});
 if(!db)return jsonResponse({ok:false,error:'D1 not configured.'},503,{'Cache-Control':'no-store'});
 let p={};try{p=await c.request.json()}catch{}
 if(String(p.action||'').endsWith('_729')){
   const r=await action729(c,db,admin,p);
   return jsonResponse(r.data,r.status,{'Cache-Control':'private, no-store'});
  }
  if(String(p.action||'').endsWith('_728')){
  const r=await action728(c,db,admin,p);
  return jsonResponse(r.data,r.status,{'Cache-Control':'private, no-store'});
 }



 if(['queue_source_event_726','local_dead_letter_726','review_signed_peer_ack_726'].includes(p.action)){
  const freshOrigin=c.request?.headers?.get('Origin');
  if(freshOrigin&&freshOrigin!==new URL(c.request.url).origin)
   return jsonResponse({ok:false,build:726,status:'HOLD_CROSS_ORIGIN_SOURCE_REVIEW_DENIED'},403,{'Cache-Control':'private, no-store'});
  if(JSON.stringify(p).length>4800)
   return jsonResponse({ok:false,build:726,status:'HOLD_OVERSIZED_OR_PRIVATE_PAYLOAD'},413,{'Cache-Control':'private, no-store'});
  let out;
  if(p.action==='queue_source_event_726')
   out=await queueSourceEvent726(db,admin,p.claim);
  else if(p.action==='local_dead_letter_726')
   out=await localDeadLetterReview726(db,admin,p.claim);
  else {
   const id=String(p.claim?.event_id||'');
   const row=/^[0-9a-f-]{36}$/.test(id)?
    await db.prepare("SELECT event_id,target_app,source_main_sha,dedupe_sha256 FROM dnd_event_outbox_726 WHERE event_id=? LIMIT 1")
     .bind(id).first().catch(()=>null):null;
   const e=c.env||{};
   const pin={source_app:String(e.DND726_ACK_SOURCE_APP||''),
    peer_main_sha:String(e.DND726_ACK_PEER_MAIN_SHA||''),
    public_key:String(e.DND726_ACK_PUBLIC_KEY||''),
    revoked:String(e.DND726_ACK_REVOKED||'').toLowerCase()==='true',
    original_source_enrollment_verified:
     /^[A-Za-z0-9._:-]{16,128}$/.test(String(e.DND726_ACK_ORIGINAL_ENROLLMENT_RECEIPT||''))};
   const signature=await verifyPeerAckReview726(p.signed_peer_ack,row,pin);
   out=await signedPeerAckReview726(db,admin,signature,p.claim);
  }
  const accepted=out?.durable_event_inserted===true||
   out?.durable_local_dead_letter===true||out?.local_signed_ack_review_recorded===true;
  return jsonResponse({ok:accepted,...out,source_app:'devilndove',
   external_delivery:false,provider_post:false,original_t5_receiver_enabled:false},
   accepted?200:409,{'Cache-Control':'private, no-store'});
 }
 if(p.action==='review_signed_master_source_724'){
  const e=c.env||{};
  const marker=String(e.DND724_ORIGINAL_SIGNER_ENROLLMENT_RECEIPT_ID||'');
  const reviewerMarker=String(e.DND724_ORIGINAL_CUSTODY_REVIEWER_RECEIPT_ID||'');
  const pin={source_app:String(e.DND724_MASTER_SOURCE_APP||''),
   issuer_id:String(e.DND724_MASTER_ISSUER_ID||''),
   key_id:String(e.DND724_MASTER_KEY_ID||''),
   source_main_sha:String(e.DND724_MASTER_SOURCE_SHA||''),
   public_key:String(e.DND724_MASTER_PUBLIC_KEY||''),
   reviewer_id:String(e.DND724_CUSTODY_REVIEWER_ID||''),
   reviewer_public_key:String(e.DND724_CUSTODY_REVIEWER_PUBLIC_KEY||''),
   revoked:String(e.DND724_MASTER_REVOKED||'').toLowerCase()==='true',
   owner_independent_signer_enrolled:/^[A-Za-z0-9._:-]{12,120}$/.test(marker),
   independent_reviewer_enrolled:/^[A-Za-z0-9._:-]{12,120}$/.test(reviewerMarker)};
  if(p.original_admin_review_confirmed!==true||
   !p.master_envelope||!p.custody_rotation||JSON.stringify(p).length>6500)
   return jsonResponse({ok:false,build:724,
    status:'HOLD_EXPLICIT_SIGNED_SOURCE_REVIEW_REQUIRED',
    runtime_connected:false,receiver_activated:false},400,{'Cache-Control':'private, no-store'});
  const [source,rotation]=await Promise.all([
   verifyMasterEnvelope724(p.master_envelope,pin),
   verifyKeyCustodyRotation724(p.custody_rotation,pin)]);
  if(source.signature_verified!==true||rotation.dual_independent_signatures_verified!==true||
   source.source_app!==rotation.source_app||source.key_id!==rotation.old_key_id)
   return jsonResponse({ok:false,build:724,status:'HOLD_INDEPENDENT_SOURCE_OR_CUSTODY_SIGNER',
    source_signature_verified:source.signature_verified===true,
    rotation_dual_signature_verified:rotation.dual_independent_signatures_verified===true,
    replay_receipt_recorded:false,master_connected:false,owner_authority_transferred:false},
    409,{'Cache-Control':'private, no-store'});
  const review=await recordMasterReplayReview724(db,admin,source,rotation);
  return jsonResponse({ok:review.durable_review_receipt===true,...review,
   response_proves_live_master_transport:false,transport_connected:false,
   original_key_enrollment_performed:false,owner_t5_approved:false},
   review.durable_review_receipt===true?200:409,{'Cache-Control':'private, no-store'});
 }
 if(p.action==='verify_independent_credential_rotation_722'){
  let envelope=null;
  try{
   if(typeof p.signed_receipt_json!=='string'||p.signed_receipt_json.length>3000)
    throw Error('Bounded independent signed issuer claim required.');
   envelope=JSON.parse(p.signed_receipt_json);
  }catch{return jsonResponse({ok:false,build:722,status:'HOLD_INVALID_OR_MISSING_ISSUER_RECEIPT',
   provider_execution:false,external_issuer_contact:false,credential_rotated:false},
   400,{'Cache-Control':'private, no-store'})}
  const env=c.env||{};
  const issuerId=String(env.CREDENTIAL_ROTATION_ISSUER_ID_722||'').trim(),
   issuerKey=String(env.CREDENTIAL_ROTATION_ISSUER_PUBLIC_KEY_722||'').trim(),
   issuerProvider=String(env.CREDENTIAL_ROTATION_ISSUER_PROVIDER_722||'').trim();
  const distinct=!!issuerId&&!!issuerKey&&!!issuerProvider&&
   issuerId!==String(env.FINANCIAL_CONTINUITY_REVIEWER_ID_706||'').trim()&&
   issuerId!==String(env.FINANCIAL_CUSTODY_SLA_EXTERNAL_VERIFIER_ID_717||'').trim()&&
   issuerKey!==String(env.FINANCIAL_CONTINUITY_REVIEWER_PUBLIC_KEY_706||'').trim()&&
   issuerKey!==String(env.FINANCIAL_CUSTODY_SLA_EXTERNAL_PUBLIC_KEY_717||'').trim();
  const result=await verifyIndependentRotationReceipt722(envelope,{
   issuer_id:issuerId,public_key:issuerKey,provider:issuerProvider,
   distinct_external_issuer_enrolled:distinct});
  return jsonResponse({ok:result.independent_issuer_signature_verified,...result,
   receipt_persisted:false,credential_rotation_triggered:false,
   financial_books_closed:false,cross_app_connected:false},
   result.independent_issuer_signature_verified?200:409,
   {'Cache-Control':'private, no-store'});
 }
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
 const review722=requestUrl.searchParams.get('review')==='722';
 const review723=requestUrl.searchParams.get('review')==='723';
 const review724=requestUrl.searchParams.get('review')==='724';
 const review725=requestUrl.searchParams.get('review')==='725';
 const review726=requestUrl.searchParams.get('review')==='726';
 const isReview728=requestUrl.searchParams.get('review')==='728';
 const isReview729=requestUrl.searchParams.get('review')==='729';
 const isReview730=requestUrl.searchParams.get('review')==='730';
 let ledger721=null;
 if(review721||review722){
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
  ...(review721?{review721:ledger721,lifecycle721:lifecycleEvidence721(env)}:{}),
  ...(review722?{review722:{
   ledger:reconcileOwnerReviewDrift722(ledger721),
   issuer_public_key_enrolled:present(env.CREDENTIAL_ROTATION_ISSUER_PUBLIC_KEY_722)&&
    present(env.CREDENTIAL_ROTATION_ISSUER_ID_722)&&
    present(env.CREDENTIAL_ROTATION_ISSUER_PROVIDER_722),
   credential_issuer_receipt_currently_verified:false,
   independent_issuer_proof_not_persisted:true,
   handoff:reviewSevenAppHandoff722(null,null),
   security_control_layers:['T1_IDENTITY','T2_TRANSPORT','T3_AUTHORIZATION',
    'T4_DATA_REPLAY_AUDIT','T5_PRIVILEGED_RECOVERY'],
   operational_access_tiers:['T0_PUBLIC','T1_USER','T2_TENANT',
    'T3_COMPANY_OPERATOR','T4_SIGNED_THREE_MASTER','T5_PHYSICAL_RECEIVER'],
   cross_app_connected:false,financial_books_closed:false
  }}:{}),
  ...(review723?{review723:{
   inventory:sixTierSecurityInventory723(),
   completion:sevenAxisCompletionBaseline723(),
   six_tier_negative_examples:[
    assessTierCandidate723({tier:'T0_PUBLIC',capability:'operator_finance_evidence_review'}),
    assessTierCandidate723({tier:'T3_COMPANY_OPERATOR',capability:'physical_receiver_activation'}),
    assessTierCandidate723({tier:'T4_INDEPENDENT_THREE_MASTER',capability:'master_readonly_governance'})
   ],
   source_proof_scope:'CANONICAL_ROUTE_DECLARATIONS_NOT_FULL_ENDPOINT_AUDIT',
   seven_app_runtime_connected:false,original_t5_ceremony_authorized:false,
   finance_books_closed:false,owner_10pp_gain_verified:false
  }}:{}),
  ...(review724?{review724:{
   trust:masterTrustStatus724(env),
   original_issuer_enrollment_receipt_name_present:present(env.DND724_ORIGINAL_SIGNER_ENROLLMENT_RECEIPT_ID),
   original_custody_reviewer_receipt_name_present:present(env.DND724_ORIGINAL_CUSTODY_REVIEWER_RECEIPT_ID),
   required_independent_source_origin_verified:false,
   unique_d1_replay_constraint_verified:false,
   source_only_signed_envelope_accepted_into_live_transport:false,
   master_connected:false,master_theme_changed:false,
   shell_iCamp_or_YW_modified:false,
   external_vercel_deploy_triggered:false,
   receiver_activated:false,
   owner_completion_percentage_advanced_verified:false,
   handoff_only:true
  }}:{}),
  ...(review725?{review725:{
   compatibility:independentReleaseStatus725(),
   legacy_peer_1_0:negotiateIndependentSync725({protocol:{major:1,minor:0},available:true,
    app_id:'ai-data-platform',topology_id:'rosevear-master-shell-seven-apps.v1'},'health.read'),
   legacy_peer_new_capability:negotiateIndependentSync725({protocol:{major:1,minor:0},available:true,
    app_id:'ai-data-platform',topology_id:'rosevear-master-shell-seven-apps.v1'},'media.draft.read'),
   unavailable_peer:negotiateIndependentSync725({available:false},'health.read'),
   cross_tenant_negative:assessConsentTenantCapability725({
    mode:'LOCAL',capability:'storefront.product.read',
    actor:{tier:'T0_PUBLIC',company_id:'devilndove',tenant_id:'tenant-a',workspace_id:'workshop-a'},
    company_id:'devilndove',tenant_id:'tenant-a',workspace_id:'workshop-a',
    resource:{company_id:'devilndove',tenant_id:'tenant-b',workspace_id:'workshop-a',
      resource_id:'sample-product',source_revision:'sample-revision',source_verified:true}}),
   real_peer_handshake_verified:false,durable_cross_app_replay_verified:false,
   original_t5_receiver_authorized:false,
   vercel_blocked_peer_deployed_by_this_application:false,
   original_1_0_integration_endpoints_unchanged:true,
   local_product_routes_remain_available:true,
   owner_approved_completion_percentage:null
  }}:{}),
  ...(review726?{review726:{
   contract:eventEnvelopeContract726(),
   inbox:await inspectSourceEvents726(getDb(env),15),
   original_live_peer_ack_verified:false,
   real_operator_inbox_delivery_verified:false,
   transport_sender_enabled:false,
   source_only_local_d1_receipts:true,
   external_deploy_triggered:false,
   inventory_fit_mode_source:'css/inventory-card-view-v359.css',
   quick_inventory_hst_existing_receipts:'inventory_quick_edit_receipts'
  }}:{}),
  ...(isReview728?{review728:await review728(getDb(env),env)}:{}),
  ...(isReview729?{review729:await review729(getDb(env),env)}:{}),
  ...(isReview730?{review730:await review730(getDb(env),env)}:{}),
  documentation:'/docs/operations/RELEASE_467_BUILD_406_PRODUCTION_CONFIGURATION_AUDIT.md'},200,{'Cache-Control':'no-store'});
}

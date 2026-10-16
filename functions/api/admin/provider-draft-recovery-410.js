// Release 467 Build 410 — read-only destination evidence and operator-only local case ledger.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {productIdValid} from '../_lib/productDistribution406.mjs';
import {uuidDraft,keyValid,loadTrial409} from '../_lib/etsyTrialGate409.mjs';
import {parseReceipt} from '../_lib/listingSyncOperator408.mjs';
import {CASE_ACTIONS,outcomeState,evidenceToken,caseDecisionValid} from '../_lib/providerDraftRecovery410.mjs';
const reply=(v,status=200)=>jsonResponse({ok:status<400,build:410,
 provider_called:false,provider_write:false,publication_performed:false,automatic_retry:false,...v},status,{'Cache-Control':'no-store'});
const CASE_TYPE='etsy_trial_410_case_review';
const caseSql="SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type='etsy_trial_410_case_review' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const duplicateSql="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_trial_410_case_review' AND target_type='marketplace_draft' AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1";
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:reply({error:'Verified active Admin required.'},401)}:
 !db?{error:reply({error:'D1 binding unavailable.'},503)}:{admin,db};}
async function source(db,env,id,draftId,channel){
 if(channel==='facebook'){
  const [product,pref,policy]=await Promise.all([
   db.prepare('SELECT product_id,name FROM products WHERE product_id=? LIMIT 1').bind(id).first(),
   db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_channel_intent_405' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1").bind(String(id)).first(),
   db.prepare("SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type='product_distribution_policy_406' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.channel')='facebook' ORDER BY admin_action_audit_id DESC LIMIT 1").bind(String(id)).first()]);
  if(!product)return null;
  return {destination:'facebook',product_id:id,product_name:product.name,
   opted_in:parseReceipt(pref).facebook===true,policy_receipt:policy?.admin_action_audit_id||0,
   outcome:'PROVIDER_LISTING_PERMISSION_UNVERIFIED_HOLD',provider_verified:false,
   manual_investigation_required:true,external_execution_allowed:false,publication_allowed:false,
   no_retry_allowed:true,us_shipping_suspended:true,source:'LOCAL_ADMIN_EVIDENCE_ONLY'};
 }
 if(!uuidDraft(draftId))return null;
 const [data,latestCase]=await Promise.all([
  loadTrial409(db,env,id,draftId),db.prepare(caseSql).bind(draftId).first()]);
 if(!data)return null;
 const state=outcomeState({claim:data.claim,verified:data.verified,draft:data.draft,latestCase});
 const token=evidenceToken({productId:id,draft:data.draft,claim:data.claim,verified:data.verified,
  latestCase,trial:data.trial,sourceFingerprint:data.fingerprint});
 return {destination:'etsy',product_id:id,draft_id:draftId,source:data,case:latestCase,state,token};
}
function summary(d){
 if(d.destination==='facebook')return d;
 const s=d.source,st=d.state;
 return {destination:'etsy',product_id:d.product_id,product_name:String(s.product.name||''),
 draft_id:d.draft_id,draft_title:String(s.draft.draft_title||''),draft_status:s.draft.status,
 source_evidence_current:s.blockers.length===0,source_blockers:s.blockers,
 attempt_claim_receipt:st.attempt_claim_receipt,trial_409_receipt:s.trial?.admin_action_audit_id||0,
 build400_verified_receipt:st.build400_proof_receipt,build409_reconciliation_receipt:s.reconciled409?.admin_action_audit_id||0,
 listing_id:st.linked_listing_id,case_state:st.state,case_decision:st.last_case_decision,
 case_receipt:st.last_case_receipt,can_open_hold:st.can_open_hold,
 can_close_with_proof:st.can_close_with_proof,no_retry_allowed:st.no_retry_allowed,
 manual_investigation_required:st.manual_investigation_required,
 provider_verification_snapshot:st.provider_verification_snapshot,
 provider_live_state_verified_now:false,evidence_token:d.token,publication_allowed:false,
 external_execution_allowed:false,us_shipping_suspended:true,source:'LOCAL_AUDIT_SNAPSHOT_NO_PROVIDER_CONTACT'};
}
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const u=new URL(c.request.url),id=u.searchParams.get('product_id'),draftId=u.searchParams.get('draft_id'),channel=u.searchParams.get('destination')||'etsy';
 if(!productIdValid(id)||!['etsy','facebook'].includes(channel)||
    (channel==='etsy'&&!uuidDraft(draftId)))return reply({error:'Valid Product, destination and Etsy local draft required.'},400);
 try{const d=await source(g.db,c.env,Number(id),draftId,channel);
 return d?reply(summary(d)):reply({error:'Canonical Product or selected Etsy draft unavailable.'},404);}
 catch{return reply({error:'Local evidence could not be read. No provider calls or changes.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let b;try{b=await c.request.json()}catch{return reply({error:'JSON required.'},400)}
 if(!productIdValid(b?.product_id)||!uuidDraft(b?.draft_id)||b?.destination!=='etsy'||
 !['hold','close'].includes(b.action)||!keyValid(b.request_key)||
 !/^[a-f0-9]{8}$/.test(String(b.expected_evidence_token||''))||
 !Number.isSafeInteger(b.expected_case_receipt)||b.expected_case_receipt<0)
 return reply({error:'Valid draft, expected evidence, action and request key required.'},400);
 try{
  const prior=await g.db.prepare(duplicateSql).bind(b.draft_id,b.request_key).first();
  if(prior){const old=parseReceipt(prior);return old.action===b.action&&old.product_id===Number(b.product_id)?
    reply({case_receipt:prior.admin_action_audit_id,idempotent:true,message:'Previously recorded local case; reload before further action.'}):
    reply({error:'Request key reused with different action or Product.'},409);}
  const d=await source(g.db,c.env,Number(b.product_id),b.draft_id,'etsy');
  if(!d)return reply({error:'Canonical Product and Etsy draft do not match.'},404);
  if(b.expected_evidence_token!==d.token||b.expected_case_receipt!==d.state.last_case_receipt)
   return reply({error:'Source, linked Etsy evidence, or case changed; reload before acting.'},409);
  if(!caseDecisionValid({action:b.action,status:d.state,body:b}))
   return reply({error:'Cannot close unknown or conflicting Etsy outcomes. Manual note and no-retry/no-publication acknowledgement required.',blockers:[d.state.state]},409);
  const detail={build:410,action:b.action,outcome:CASE_ACTIONS[b.action],request_key:b.request_key,
   product_id:Number(b.product_id),draft_id:b.draft_id,destination:'etsy',
   claim_receipt:d.state.attempt_claim_receipt,verified_receipt:d.state.build400_proof_receipt,
   listing_id:d.state.linked_listing_id,evidence_token:d.token,
   operator_note:b.operator_note.trim(),confirmed_no_retry:true,confirmed_no_publication:true,
   us_shipping_disabled:true,local_only:true,provider_called:false,publication_performed:false};
  const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,'marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP WHERE COALESCE((SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type=? AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1),0)=? AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type='marketplace_draft' AND target_key=? AND json_extract(details_json,'$.request_key')=?)";
  const result=await g.db.prepare(sql).bind(g.admin.user_id,CASE_TYPE,b.draft_id,new URL(c.request.url).pathname,
   JSON.stringify(detail),CASE_TYPE,b.draft_id,b.expected_case_receipt,CASE_TYPE,b.draft_id,b.request_key).run();
  if(Number(result?.meta?.changes||0)!==1)return reply({error:'Concurrent case update detected; reload. Provider was not contacted.'},409);
  const saved=await g.db.prepare(duplicateSql).bind(b.draft_id,b.request_key).first();
  if(!saved||parseReceipt(saved).outcome!==CASE_ACTIONS[b.action])
   return reply({error:'Local evidence persistence unconfirmed; inspect before retry.'},409);
  return reply({case_receipt:saved.admin_action_audit_id,case_state:CASE_ACTIONS[b.action],
    message:b.action==='hold'?'Manual investigation HOLD recorded. One-shot claim remains blocked from retry.':
      'Case closed against existing Build 400 verified unpublished draft evidence only. No new Etsy call.'});
 }catch{return reply({error:'Local case result unknown. Do not retry provider action; reload audit.'},503);}
}

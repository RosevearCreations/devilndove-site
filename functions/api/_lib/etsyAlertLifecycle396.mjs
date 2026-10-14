// Release 467 Build 396 — pure lifecycle projection for the internal, operator-routed Etsy alert queue.
// No external notification transport, scheduled execution or provider calls.
import {validKey,cleanReference} from './etsyOperatorExceptions395.mjs';
export const ALERT_ACTIONS=Object.freeze(['route','acknowledge_route','close_reviewed']);
export const ALERT_CHANNEL='internal_admin_queue';
export const ALERT_SEVERITIES=Object.freeze(['warning','attention','urgent']);
const isScope=x=>x==='etsy'||x==='product';
const isFingerprint=x=>typeof x==='string'&&x.length>=8&&x.length<=320&&!/[\r\n\u0000-\u001f]/.test(x);
export function validateAlertDecision(body){
 const scope=String(body?.scope||'').trim(),action=String(body?.action||'').trim();
 const productId=Number(body?.product_id||0),fingerprint=String(body?.fingerprint||'');
 const routeFingerprint=String(body?.route_fingerprint||'');
 const operatorReference=cleanReference(body?.operator_reference),requestKey=String(body?.request_key||'');
 if(!isScope(scope)||!ALERT_ACTIONS.includes(action)||!operatorReference||!validKey(requestKey)||
  !isFingerprint(fingerprint)||body?.operator_confirmed!==true||
  (scope==='product'&&(!Number.isSafeInteger(productId)||productId<1)))return null;
 if(action!=='route'&&!isFingerprint(routeFingerprint))return null;
 const severity=String(body?.severity||'attention');
 if(action==='route'&&!ALERT_SEVERITIES.includes(severity))return null;
 return {scope,product_id:scope==='product'?productId:null,action,fingerprint,
  route_fingerprint:action==='route'?fingerprint:routeFingerprint,
  severity:action==='route'?severity:null,operator_reference:operatorReference,request_key:requestKey,
  operator_confirmed:true,channel:ALERT_CHANNEL};
}
export function lifecycle(rows,current){
 let route=null,ack=null,closure=null;
 // Indexed newest-first bounded audit ledger. Only use decisions associated with latest explicit route.
 for(const r of rows||[]){
  let d;
  try{d=typeof r.details_json==='string'?JSON.parse(r.details_json):r.details_json;}catch{continue;}
  if(!d||d.channel!==ALERT_CHANNEL||!ALERT_ACTIONS.includes(d.action))continue;
  if(!route&&d.action==='route'){route={...d,receipt_id:Number(r.admin_action_audit_id),created_at:r.created_at};continue;}
  if(route)break;
  if(d.action==='close_reviewed'&&!closure)closure={...d,receipt_id:Number(r.admin_action_audit_id),created_at:r.created_at};
  if(d.action==='acknowledge_route'&&!ack)ack={...d,receipt_id:Number(r.admin_action_audit_id),created_at:r.created_at};
 }
 if(!route)return {state:current?.active?'unrouted':'no_active_exception',route:null,ack:null,closure:null};
 if(ack?.route_fingerprint!==route.route_fingerprint||ack?.receipt_id<=route.receipt_id)ack=null;
 if(closure&&(closure.route_fingerprint!==route.route_fingerprint||!ack||closure.receipt_id<=ack.receipt_id))closure=null;
 const state=closure?'closed_by_operator':
 current?.active?(current.fingerprint!==route.fingerprint?'changed_requires_new_route':ack?'acknowledged_active':'routed_pending_ack'):
 ack?'recovered_pending_operator_closure':'recovered_needs_acknowledgement';
 return {state,route:{receipt_id:route.receipt_id,created_at:route.created_at,
  fingerprint:route.fingerprint,severity:route.severity,operator_reference:route.operator_reference},
  ack:ack?{receipt_id:ack.receipt_id,created_at:ack.created_at}:null,
  closure:closure?{receipt_id:closure.receipt_id,created_at:closure.created_at}:null};
}
export function mayWriteAlert(action,current,history,input){
 if(action==='route'){
  if(!current?.active)return {ok:false,code:'no_active_exception'};
  if(history.state!=='unrouted'&&history.state!=='changed_requires_new_route'&&history.state!=='closed_by_operator')
   return {ok:false,code:'alert_already_routed'};
  return {ok:true};
 }
 if(!history.route)return {ok:false,code:'route_required'};
 if(input.route_fingerprint!==history.route.fingerprint)return {ok:false,code:'route_evidence_changed'};
 if(action==='acknowledge_route'){
  if(history.ack)return {ok:false,code:'route_already_acknowledged'};
  if(history.closure)return {ok:false,code:'route_closed'};
  if(current.active&&current.fingerprint!==history.route.fingerprint)return {ok:false,code:'new_exception_evidence'};
  return {ok:true};
 }
 if(action==='close_reviewed'){
  if(current?.active)return {ok:false,code:'exception_still_active'};
  if(!history.ack)return {ok:false,code:'acknowledgement_required'};
  if(history.closure)return {ok:false,code:'already_closed'};
  return {ok:true};
 }
 return {ok:false,code:'invalid_action'};
}

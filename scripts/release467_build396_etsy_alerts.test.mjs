import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateAlertDecision,lifecycle,mayWriteAlert,ALERT_CHANNEL} from '../functions/api/_lib/etsyAlertLifecycle396.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const evidence={active:true,code:'authorization_expired',fingerprint:'etsy|authorization_expired|reauthorization_required|none|none'};
const input={scope:'etsy',action:'route',fingerprint:evidence.fingerprint,operator_reference:'ETSY-REVIEW-396',
 request_key:'abc123def4567890abcd',operator_confirmed:true,severity:'urgent'};
const row=(id,action,extra={})=>({admin_action_audit_id:id,created_at:'2026-10-13 23:00:00',details_json:JSON.stringify({
  ...input,action,channel:ALERT_CHANNEL,route_fingerprint:evidence.fingerprint,...extra})});
test('source-validated internal routing has bounded references, severity and idempotency',()=>{
 assert.equal(validateAlertDecision(input)?.channel,ALERT_CHANNEL);
 assert.equal(validateAlertDecision({...input,operator_confirmed:false}),null);
 assert.equal(validateAlertDecision({...input,operator_reference:'Bearer token secret'}),null);
 assert.equal(validateAlertDecision({...input,request_key:'short'}),null);
 assert.equal(validateAlertDecision({...input,severity:'critical'}),null);
 assert.equal(validateAlertDecision({...input,scope:'product',product_id:0}),null);
});
test('initial active condition routes once and requires a human operator',()=>{
 const current=lifecycle([],evidence);
 assert.equal(current.state,'unrouted');
 assert.equal(mayWriteAlert('route',evidence,current,input).ok,true);
 const routed=lifecycle([row(41,'route')],evidence);
 assert.equal(routed.state,'routed_pending_ack');
 assert.equal(mayWriteAlert('route',evidence,routed,input).code,'alert_already_routed');
 assert.equal(mayWriteAlert('close_reviewed',evidence,routed,{...input,route_fingerprint:evidence.fingerprint}).code,'exception_still_active');
});
test('acknowledgement never closes an active incident',()=>{
 const routed=lifecycle([row(41,'route')],evidence);
 assert.equal(mayWriteAlert('acknowledge_route',evidence,routed,{...input,route_fingerprint:evidence.fingerprint}).ok,true);
 const ack=lifecycle([row(42,'acknowledge_route'),row(41,'route')],evidence);
 assert.equal(ack.state,'acknowledged_active');
 assert.equal(mayWriteAlert('close_reviewed',evidence,ack,{...input,route_fingerprint:evidence.fingerprint}).code,'exception_still_active');
});
test('verified recovery still needs explicit human closure',()=>{
 const recovered={...evidence,active:false,code:'connection_verified',fingerprint:'etsy|connection_verified|connected_verified|now|none'};
 const ack=lifecycle([row(42,'acknowledge_route'),row(41,'route')],recovered);
 assert.equal(ack.state,'recovered_pending_operator_closure');
 assert.equal(mayWriteAlert('close_reviewed',recovered,ack,{...input,route_fingerprint:evidence.fingerprint}).ok,true);
 const closed=lifecycle([row(43,'close_reviewed'),row(42,'acknowledge_route'),row(41,'route')],recovered);
 assert.equal(closed.state,'closed_by_operator');
 assert.equal(mayWriteAlert('close_reviewed',recovered,closed,{...input,route_fingerprint:evidence.fingerprint}).code,'already_closed');
});
test('changed active evidence blocks stale acknowledgement and allows a new route',()=>{
 const changed={...evidence,fingerprint:'etsy|verification_unknown|verification_unknown|none|none'};
 const state=lifecycle([row(41,'route')],changed);
 assert.equal(state.state,'changed_requires_new_route');
 assert.equal(mayWriteAlert('route',changed,state,input).ok,true);
 assert.equal(mayWriteAlert('acknowledge_route',changed,state,{...input,route_fingerprint:evidence.fingerprint}).code,'new_exception_evidence');
});
test('untrusted or mismatched events cannot fake verified closure',()=>{
 const recovered={...evidence,active:false};
 assert.equal(lifecycle([{admin_action_audit_id:1,details_json:'{}'}],recovered).state,'no_active_exception');
 const invalid=lifecycle([row(43,'close_reviewed',{route_fingerprint:'other'}),
  row(42,'acknowledge_route'),row(41,'route')],recovered);
 assert.equal(invalid.state,'recovered_pending_operator_closure');
});
test('GET and internal inbox are read-only; POST uses audited durable idempotent receipts',()=>{
 const api=read('functions/api/admin/etsy-monitoring-alerts.js');
 const get=api.split('export async function onRequestGet')[1].split('export async function onRequestPost')[0];
 assert.doesNotMatch(get,/\.run\(|INSERT INTO|UPDATE products/);
 assert.match(api,/INSERT INTO admin_action_audit/);
 assert.match(api,/WHERE NOT EXISTS/);
 assert.match(api,/admin_action_audit_id>\?/);
 assert.match(api,/p\.audit_head_id/);
 assert.match(api,/alert_receipt_unconfirmed/);
 assert.match(api,/external_notification_sent:false/);
 assert.match(api,/json_extract\(details_json,'\$\.request_key'\)/);
 assert.doesNotMatch(api,/fetch\(|oauth-start|UPDATE products|INSERT INTO products|publishListing/);
});
test('admin controls block double clicks and require read-back',()=>{
 const ui=read('public/js/admin-etsy-monitoring-alerts-v396.js');
 const html=read('admin/it-integrations/index.html');
 assert.match(html,/id="etsyAlertInbox"/);assert.match(html,/id="etsyAlertCheck"/);
 assert.match(ui,/button\.disabled=true/);
 assert.match(ui,/crypto\.randomUUID/);
 assert.match(ui,/const stored=await api\(endpoint\(snapshot\)/);
 assert.match(ui,/no automatic retry/);
});

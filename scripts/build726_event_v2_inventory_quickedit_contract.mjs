import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonicalHandoffEvent726,eventEnvelopeFields726,
 validateHandoffEvent726,recordEventReview726,recordLocalDisposition726,
 eventV2Readiness726} from '../functions/api/admin/_lib/projectFinanceEvidence.js';
import {onRequestGet} from '../functions/api/admin/production-variable-audit-406.js';
const now=Date.UTC(2026,10,16,4,20,0),iso=n=>new Date(n).toISOString();
const claim={v:2,schema:'rosevear.event.v2',
 topology_id:'rosevear-master-shell-seven-apps.v1',
 protocol_major:1,protocol_minor:1,event_id:'dnd-event-726-0001',
 event_type:'inventory.stock_attention',source_app:'devilndove',
 destination_app:'rosevear-comms-hub',
 audience:'rosevear-comms-hub:operator-inbox:review-only',
 company_id:'devilndove',tenant_id:'tenant-one',
 workspace_id:'workshop-one',source_revision:'inventory-revision-726',
 correlation_id:'correlation-726-0001',idempotency_key:'idempotency-726-0001',
 payload_sha256:'0'.repeat(64),
 issued_at:iso(now-30000),expires_at:iso(now+120000),
 consent_scope:'public-workshop-supply',redacted_source_only:true};
const packet={claim,original_source_verified:true,
 consent_current_verified:true,company_tenant_workspace_verified:true};
assert.deepEqual(Object.keys(canonicalHandoffEvent726(claim)),eventEnvelopeFields726);
const ok=validateHandoffEvent726(packet,now);
assert.equal(ok.candidate_only,true);assert.equal(ok.external_ack_verified,false);
assert.equal(ok.transport_dispatched,false);
assert.equal(ok.master_t4_authorized,false);
assert.equal(ok.receiver_t5_activated,false);
for(const mutation of [
 {v:1},{schema:'rosevear.event.v1'},{topology_id:'other'},
 {protocol_major:2},{protocol_minor:0},{event_id:'short'},
 {event_type:'financial.refund'}, {source_app:'rosiedazzlers'},
 {destination_app:'ai-data-platform'},{audience:'owner.command'},
 {company_id:'x'},{tenant_id:'other',extra:'private'},
 {payload_sha256:'bad'},{consent_scope:'private-customer-data'},
 {redacted_source_only:false},{issued_at:iso(now+50000)},
 {issued_at:iso(now-600000)},{expires_at:iso(now-1)},
 {expires_at:iso(now+500000)}
]){
 const n=validateHandoffEvent726({...packet,claim:{...claim,...mutation}},now);
 assert.equal(n.candidate_only,false,'Reject changed schema/scope: '+JSON.stringify(mutation));
 assert.equal(n.external_ack_verified,false);
}
for(const overrides of [
 {original_source_verified:false},{consent_current_verified:false},
 {company_tenant_workspace_verified:false}
])assert.equal(validateHandoffEvent726({...packet,...overrides},now).candidate_only,false);
assert.equal(eventV2Readiness726().unique_d1_event_key_verified,false);
assert.equal(eventV2Readiness726().peer_lockstep_release_required,false);
const rows=[];const db={prepare(sql){return {bind(...params){return {
 async run(){
  assert.ok(sql.includes('WHERE NOT EXISTS'));
  const hash=params[1];
  const action=sql.includes('dnd_v2_handoff_review_726')&&
   !sql.includes('dnd_v2_local_disposition_726')?
   (sql.includes("'dnd_v2_handoff_review_726','local_event_hash'")?'review':'unknown'):
   'disposition';
  if(action==='unknown')throw Error('Unrecognized action');
  const actual=sql.includes("'dnd_v2_local_disposition_726','local_event_hash'")?
   'disposition':'review';
  if(rows.some(r=>r.hash===hash&&r.type===actual))return {success:true,meta:{changes:0}};
  rows.push({hash,type:actual,id:rows.length+1});
  return {success:true,meta:{changes:1}};
 },
 async first(){
  const key=params[0];
  const type=sql.includes("'dnd_v2_local_disposition_726'")?'disposition':'review';
  const match=rows.filter(r=>r.hash===key&&r.type===type);
  return {n:match.length,id:match[0]?.id??null};
 }
}}}}};
const first=await recordEventReview726(db,{user_id:8},packet,now);
assert.equal(first.durable_local_review,true);
assert.equal(first.external_ack_verified,false);
assert.equal(first.unique_replay_constraint_verified,false);
assert.equal(first.receipt_id,1);
const replay=await recordEventReview726(db,{user_id:8},packet,now);
assert.equal(replay.durable_local_review,false);
assert.equal(rows.length,1);
const local=await recordLocalDisposition726(db,{user_id:8},first.local_event_hash,
 'DEAD_LETTER_HOLD','Operator reviewed original source; remote delivery is still blocked.');
assert.equal(local.recorded,true);
assert.equal(local.external_ack_verified,false);
assert.equal(local.dead_letter_delivered,false);
assert.equal(rows.length,2);
assert.equal((await recordLocalDisposition726(db,{user_id:8},first.local_event_hash,
 'ACK_REVIEWED','This local review does not prove a remote ACK.')).recorded,false);
assert.equal((await recordLocalDisposition726(db,{user_id:8},'f'.repeat(64),
 'ACK_REVIEWED','Unknown original event evidence review is denied.')).recorded,false);
assert.equal((await recordEventReview726(null,{user_id:8},packet,now)).durable_local_review,false);
const js=readFileSync(new URL('../public/js/admin-site-item-inventory.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../css/inventory-card-view-v359.css',import.meta.url),'utf8');
const page=readFileSync(new URL('../admin/inventory-operations/index.html',import.meta.url),'utf8');
assert.ok(js.includes("siteInventoryQuickEditButton"));
assert.ok(js.includes("dd_inventory_quick_edit_v726"));
assert.ok(js.includes("wrap?.classList.toggle('is-quick-edit',quick)"));
assert.ok(js.includes('data-save-row-id'));
assert.ok(js.includes('data-load-form-id'));
assert.ok(js.includes("inventoryQuickEditMode=!inventoryQuickEditMode"));
assert.ok(css.includes('is-quick-edit tbody tr[data-inventory-row]'));
assert.ok(css.includes('grid-template-columns:repeat(16,minmax(0,1fr))'));
assert.ok(css.includes('overflow-x:visible!important'));
assert.ok(css.includes('@media(max-width:760px)'));
assert.ok(page.includes('/css/inventory-card-view-v359.css?v=726'));
const adminHtml=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
assert.ok(adminHtml.includes('dd726-event-readiness'));
assert.ok(adminHtml.includes('/public/js/admin-production-variable-audit-v406.js?v=726'));
const ctx={request:new Request('https://devilndove.com/api/admin/production-variable-audit-406?review=726'),
 env:{SESSION_SECRET:'do-not-expose-726'},
 data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:8}}}};
const out=await onRequestGet(ctx);const body=await out.json();
assert.equal(out.status,200);
assert.equal(out.headers.get('Cache-Control'),'no-store');
assert.equal(body.review726.event.build,726);
assert.equal(body.review726.external_peer_ack_verified,false);
assert.equal(body.review726.vercel_peer_deployment_triggered,false);
assert.ok(!JSON.stringify(body).includes('do-not-expose-726'));
assert.equal((await onRequestGet({...ctx,data:{}})).status,401);
console.log('Build 726 additive event V2 source contract, local D1 sequential dedupe & DLQ review, inventory Quick Edit: PASS');

import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {eventEnvelopeContract726,validateSourceEvent726,queueSourceEvent726,
 inspectSourceEvents726,localDeadLetterReview726,peerAckCanonicalFields726,
 canonicalPeerAck726,verifyPeerAckReview726,signedPeerAckReview726}
 from '../functions/api/admin/_lib/projectFinanceEvidence.js';
import {onRequestGet} from '../functions/api/admin/production-variable-audit-406.js';

const r=eventEnvelopeContract726();
assert.equal(r.build,726);
assert.equal(r.schema_id,'rosevear.dnd.event.v2');
assert.equal(r.protocol.major,1);
assert.equal(r.protocol.minor,1);
assert.equal(r.legacy_1_0_health_capabilities_unchanged,true);
assert.equal(r.network_sender_enabled,false);
assert.equal(r.live_master_ack_verified,false);
assert.equal(r.unique_dedupe_enforced_by_d1_migration,true);
assert.equal(r.original_host_t5_enabled,false);
const claim={request_key:'owner-20261115-source-event-726',target_app:'ai-data-platform',
 event_type:'DND_HEALTH_EVIDENCE',source_main_sha:'a'.repeat(40),
 tenant_scope_sha256:'b'.repeat(64),consent_scope_sha256:'c'.repeat(64),
 owner_review_confirmed:true};
assert.equal(validateSourceEvent726(claim).valid_local_source_proposal,true);
for(const change of [
 {request_key:'x'}, {target_app:'rosiedazzlers'},
 {event_type:'DND_CUSTOMER_PAYMENT'},{source_main_sha:'not-commit'},
 {tenant_scope_sha256:'tenant-raw-record'},{consent_scope_sha256:'bad'},
 {owner_review_confirmed:false},{payload:{customer:'alice'}},
 {private_customer_data:'secret'},
 {event_type:'DND_SECURITY_EVIDENCE',body:'bad'}
]){
 const result=validateSourceEvent726({...claim,...change});
 assert.equal(result.valid_local_source_proposal,undefined,
  'Rejected private/invalid source candidate: '+JSON.stringify(change));
 assert.equal(result.network_message_sent,false);
}
assert.equal((await queueSourceEvent726(null,{user_id:7},claim)).durable_event_inserted,false);
assert.equal((await inspectSourceEvents726(null)).events.length,0);
assert.equal((await localDeadLetterReview726(null,{user_id:7},{})).durable_local_dead_letter,undefined);
assert.equal((await signedPeerAckReview726(null,{user_id:7},{signature_verified:true},{})).local_signed_ack_review_recorded,undefined);

const pair=generateKeyPairSync('ed25519'),wrong=generateKeyPairSync('ed25519');
const publicKey=pair.publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64url');
const other=wrong.publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64url');
const time=Date.UTC(2026,10,15,23,0,0),iso=n=>new Date(n).toISOString();
const event={event_id:'11111111-1111-4111-8111-111111111111',
 target_app:'ai-data-platform',source_main_sha:'a'.repeat(40),dedupe_sha256:'d'.repeat(64)};
const ackClaim={v:2,schema_id:'rosevear.dnd.event.ack.v2',
 topology_id:'rosevear-master-shell-seven-apps.v1',from_app:'ai-data-platform',
 to_app:'devilndove',event_id:event.event_id,source_main_sha:event.source_main_sha,
 peer_main_sha:'e'.repeat(40),dedupe_sha256:event.dedupe_sha256,
 issued_at:iso(time-30000),expires_at:iso(time+60000),
 nonce:'f'.repeat(32),outcome:'ACK'};
const signed=(c,key=pair.privateKey)=>({claim:c,signature:sign(null,
 Buffer.from(JSON.stringify(canonicalPeerAck726(c))),key).toString('base64url')});
assert.deepEqual(Object.keys(canonicalPeerAck726(ackClaim)),peerAckCanonicalFields726);
const pin={source_app:'ai-data-platform',peer_main_sha:'e'.repeat(40),
 public_key:publicKey,revoked:false,original_source_enrollment_verified:true};
const ok=await verifyPeerAckReview726(signed(ackClaim),event,pin,time);
assert.equal(ok.signature_verified,true);
assert.equal(ok.independent_peer_delivery_verified,false);
assert.equal(ok.network_message_sent,false);
assert.equal(ok.receiver_activated,false);
assert.equal(ok.event_id,event.event_id);
assert.equal(ok.receipt_sha256.length,64);
for(const change of [
 {topology_id:'other'}, {from_app:'rosiedazzlers'}, {to_app:'YW'},
 {event_id:'22222222-2222-4222-8222-222222222222'},
 {source_main_sha:'b'.repeat(40)}, {peer_main_sha:'b'.repeat(40)},
 {dedupe_sha256:'1'.repeat(64)}, {nonce:'bad'},
 {issued_at:iso(time+30000)}, {issued_at:iso(time-500000)},
 {expires_at:iso(time-1000)}, {outcome:'ACTIVATE_RECEIVER'},
 {payload:{customer:'private'}}]){
 const v=await verifyPeerAckReview726(signed({...ackClaim,...change}),event,pin,time);
 assert.equal(v.signature_verified,false,'Signed ACK scope MUST deny: '+JSON.stringify(change));
}
assert.equal((await verifyPeerAckReview726(signed(ackClaim,wrong.privateKey),event,pin,time)).signature_verified,false);
assert.equal((await verifyPeerAckReview726(signed(ackClaim),event,{...pin,revoked:true},time)).signature_verified,false);
assert.equal((await verifyPeerAckReview726(signed(ackClaim),event,{...pin,public_key:other},time)).signature_verified,false);
assert.equal((await verifyPeerAckReview726(signed(ackClaim),event,{...pin,original_source_enrollment_verified:false},time)).signature_verified,false);

const js=readFileSync(new URL('../public/js/admin-site-item-inventory.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../css/inventory-card-view-v359.css',import.meta.url),'utf8');
const page=readFileSync(new URL('../admin/inventory-operations/index.html',import.meta.url),'utf8');
assert.ok(js.includes("let inventoryDisplayMode="));
assert.ok(js.includes(":'fit'"));
assert.ok(js.includes("dd_inventory_display_mode_v726"));
for(const name of ['siteInventoryFitViewButton','siteInventoryCardViewButton',
 'siteInventoryWideViewButton','siteInventoryTableModeButton',
 'data-dd387-edit-id','data-save-row-id','data-load-form-id',
 'data-amazon-fill-id','data-inventory-row','data-field="on_hand_quantity"',
 'data-field="reorder_level"'])assert.ok(js.includes(name),'Inventory edit not lost '+name);
assert.ok(js.includes('chooseInventoryViewMode'));
assert.ok(css.includes('Build 726: fit-to-screen'));
assert.ok(css.includes('is-fit-view'));
assert.ok(css.includes('overflow-x:hidden'));
for(let i=1;i<=9;i++)assert.ok(css.includes('td:nth-child('+i+')'),
 'All original Inventory table cells must remain visible: '+i);
assert.ok(css.includes('@media(max-width:660px)'));
assert.ok(page.includes('/css/inventory-card-view-v359.css?v=726'));
assert.ok(page.includes('/public/js/admin-site-item-inventory.js?v=726'));
assert.ok(page.includes('admin-inventory-tax-quickedit-v387.js'));
const admin=readFileSync(new URL('../functions/api/admin/production-variable-audit-406.js',import.meta.url),'utf8');
assert.ok(admin.includes("queue_source_event_726"));
assert.ok(admin.includes("local_dead_letter_726"));
assert.ok(admin.includes("review_signed_peer_ack_726"));
assert.ok(admin.includes("review')==='726'"));
assert.ok(!admin.includes("fetch('https://api.rosevear"));
const originalContract=JSON.parse(readFileSync(new URL('../.github/rosevear-independent-sync-725.v1.json',import.meta.url),'utf8'));
assert.equal(originalContract.protocol.backwardCompatibleWith,'1.0');
assert.equal(originalContract.protocol.lockstepReleaseRequired,false);
const ctx={request:new Request('https://devilndove.com/api/admin/production-variable-audit-406?review=726'),
 env:{SESSION_SECRET:'do-not-echo-secret-726'},
 data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7}}}};
const response=await onRequestGet(ctx),out=await response.json();
assert.equal(response.status,200);
assert.equal(response.headers.get('Cache-Control'),'no-store');
assert.equal(out.review726.contract.build,726);
assert.equal(out.review726.transport_sender_enabled,false);
assert.equal(out.review726.original_live_peer_ack_verified,false);
assert.equal(out.review726.inbox.events.length,0);
assert.ok(!JSON.stringify(out).includes('do-not-echo-secret-726'));
assert.equal((await onRequestGet({...ctx,data:{}})).status,401);
assert.equal((await onRequestGet({...ctx,data:{ddModuleAccess:{allowed:true,user:{role:'customer',is_active:1,user_id:7}}}})).status,401);
console.log('Build726 Versioned V2 source event + signed ACK negative + responsive full-width Inventory and movement-receipted quick-edit: PASS');

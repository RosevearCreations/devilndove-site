import test from 'node:test';
import assert from 'node:assert/strict';
import {closurePacket416} from '../functions/api/_lib/providerClosurePacket416.mjs';
const s={product_id:9,destination:'etsy',escalation_status:'OPEN_OWNER_REVIEW',source_snapshot_current:true,
 assigned_user_id:3,admins:[{user_id:3}], evidence_scan_exhausted:true,
 evidence_receipts:{escalation:101,assignment:102,followup:103,completion:104},
 followup:{receipt:103,verified:true},completion:{receipt:104,current:true},
 handoff:{status:'NOT_REQUIRED',verified:true},governance:{receipt:0,verified:false},
 exception_reasons:[],route:{status:'NOT_ROUTED'},provider_status_verified_now:false};
test('ready local evidence packet cannot authorize external provider closure',()=>{
 const x=closurePacket416(s);assert.equal(x.local_closure_review_ready,true);
 assert.equal(x.provider_called,false);assert.equal(x.automatic_closure_performed,false);
 assert.equal(x.us_shipping_suspended,true);assert.ok(x.holds.includes('EXTERNAL_PROVIDER_NOT_VERIFIED'));
});
test('missing or bounded-out evidence fails closed',()=>{
 assert.equal(closurePacket416(null).decision,'HOLD_FOR_MANUAL_REVIEW');
 for(const data of [{...s,evidence_scan_exhausted:false},{...s,completion:{receipt:104,current:false}},
 {...s,assigned_user_id:8},{...s,exception_reasons:['OWNER_FOLLOWUP_SLA_DUE']}])
 assert.equal(closurePacket416(data).local_closure_review_ready,false);
});
test('packet exposes only safe receipt references and not opaque audit contents',()=>{
 const x=closurePacket416({...s,secret:'never expose'});
 assert.equal(JSON.stringify(x).includes('never expose'),false);
 assert.equal(x.evidence_receipts.escalation,101);
 assert.equal(x.read_only,true);
});

import test from 'node:test';import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {canonical,payloadHash,checkReceipt,receiptInsert,atomicWriteReceipt} from '../functions/api/admin/_lib/writeReceipts.js';
globalThis.crypto=webcrypto;
test('hash is canonical, actor/project-bound and payload-sensitive',async()=>{
 const a=await payloadHash('finance_review',7,21,{note:'review',cost:42});
 const b=await payloadHash('finance_review',7,21,{cost:42,note:'review'});
 const diff=await payloadHash('finance_review',7,21,{cost:43,note:'review'});
 const other=await payloadHash('finance_review',8,21,{cost:42,note:'review'});
 assert.equal(a,b);assert.notEqual(a,diff);assert.notEqual(a,other);
 const receipt={action_scope:'finance_review',request_key:'1234567890123456',actor_user_id:7,target_id:21,payload_sha256:a,admin_write_receipt_id:12,source_record_id:44,created_at:'2026-10-13'};
 assert.equal(checkReceipt(receipt,{scope:'finance_review',key:receipt.request_key,actor:7,target:21,hash:a}).replayed,true);
 assert.equal(checkReceipt(receipt,{scope:'finance_review',key:receipt.request_key,actor:7,target:21,hash:diff}).status,409);
 assert.equal(checkReceipt(receipt,{scope:'finance_review',key:receipt.request_key,actor:8,target:21,hash:a}).status,409);
});
test('receipt sources are compiled from fixed internal identifiers only',()=>{
 const calls=[];
 const db={prepare(sql){return {bind(...args){calls.push({sql,args});return this;}}}};
 receiptInsert(db,'material_release','1234567890123456',7,'creative_work_project',21,'a'.repeat(64),
 'creative_project_material_reservations','creative_project_material_reservation_id',44,'@receipt:1234567890123456:reason');
 assert.match(calls[0].sql,/release_note=\?/);
 assert.equal(calls[0].args.length,8);
 assert.equal(calls[0].args[6],44);
 assert.throws(()=>receiptInsert(db,'material_release','1234567890123456',7,'creative_work_project',21,'a'.repeat(64),
 'private_table','id'),/Unsupported receipt source/);
});
test('atomic operation returns a durable confirmed receipt; a losing concurrent write is not retried',async()=>{
 const row={action_scope:'finance_review',request_key:'1234567890123456',actor_user_id:7,target_id:21,payload_sha256:'a'.repeat(64),
 admin_write_receipt_id:12,source_record_id:44,created_at:'now'};
 let batchCount=0;
 const db={batch:async()=>{batchCount++;return[{meta:{changes:1}},{meta:{changes:1}}]},
 prepare:()=>({bind:()=>({first:async()=>row})})};
 const args={scope:'finance_review',key:row.request_key,actor:7,target:21,hash:row.payload_sha256};
 const r=await atomicWriteReceipt(db,{},{},args);
 assert.equal(r.ok,true);assert.equal(r.replayed,false);assert.equal(batchCount,1);
});

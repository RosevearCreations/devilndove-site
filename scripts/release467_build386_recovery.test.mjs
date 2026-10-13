import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {payloadHash,receiptInsert,checkReceipt} from '../functions/api/admin/_lib/writeReceipts.js';
const script=readFileSync(new URL('../public/js/admin-write-receipt-recovery-v386.js',import.meta.url),'utf8');
function tabs(fetchers){
 const store=new Map();
 const localStorage={
  getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k),
  get length(){return store.size},key:i=>[...store.keys()][i]||null
 };
 return fetchers.map(raw=>{
  const w={fetch:raw,addEventListener(){}};const document={body:null,addEventListener(){}};
  vm.runInNewContext(script,{window:w,document,location:{pathname:'/admin/project-work-orders/',origin:'https://devilndove.com',href:'https://devilndove.com/admin/project-work-orders/'},
    URL,JSON,Object,Array,Date,TextEncoder,Uint8Array,Response,crypto:webcrypto,localStorage,confirm:()=>false});
  return w;
 });
}
const url='/api/admin/project-work-orders',body=JSON.stringify({project_id:21,operation_id:9,action:'time',minutes:25,work_date:'2026-10-13',notes:'Reviewed actual operator hours'});
const opts={method:'POST',headers:{'Content-Type':'application/json'},body};
test('new write receipt scopes use separate additive ledger with fixed SQL identifiers',()=>{
 const calls=[];const db={prepare(sql){return {bind(...args){calls.push({sql,args});return this;}}}};
 receiptInsert(db,'work_order_event','work_event_test_12345',7,'creative_work_project',21,'a'.repeat(64),
  'creative_work_order_events','creative_work_order_event_id');
 receiptInsert(db,'calendar_schedule','calendar_test_key_1234',7,'site_item_inventory',31,'b'.repeat(64),
  'creative_resource_calendar_entries','creative_resource_calendar_entry_id');
 assert.equal(calls.length,2);assert.match(calls[0].sql,/admin_write_receipts_extended/);
 assert.match(calls[1].sql,/creative_resource_calendar_entries/);
 assert.equal(calls[0].args[0],'work_order_event');
 assert.throws(()=>receiptInsert(db,'work_order_event','work_event_test_12345',7,'creative_work_project',21,'a'.repeat(64),'user_table','id'),/Unsupported/);
});
test('payload hash is stable under property reordering, but changes actor or target',async()=>{
 const a=await payloadHash('work_order_event',7,21,{action:'time',minutes:25});
 const b=await payloadHash('work_order_event',7,21,{minutes:25,action:'time'});
 assert.equal(a,b);assert.notEqual(a,await payloadHash('work_order_event',8,21,{minutes:25,action:'time'}));
 assert.notEqual(a,await payloadHash('work_order_event',7,22,{minutes:25,action:'time'}));
 const row={action_scope:'work_order_event',request_key:'work_event_test_12345',actor_user_id:7,target_id:21,
  payload_sha256:a,admin_write_receipt_id:17,source_record_id:33};
 assert.equal(checkReceipt(row,{scope:'work_order_event',key:row.request_key,actor:7,target:21,hash:a}).ok,true);
 assert.equal(checkReceipt(row,{scope:'work_order_event',key:row.request_key,actor:8,target:21,hash:a}).status,409);
});
test('a second tab cannot blindly submit the same pending write; original key is preserved',async()=>{
 let resolveOne;const outbound=[];
 const t=tabs([
  async (_u,options)=>{outbound.push(JSON.parse(options.body));return new Promise(resolve=>{resolveOne=resolve})},
  async ()=>{throw Error('No request should reach network')}
 ]);
 const first=t[0].fetch(url,opts);
 for(let i=0;i<20&&!resolveOne;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(outbound.length,1);assert.match(outbound[0].request_key,/^[a-f0-9-]{36}$/);
 const blocked=await t[1].fetch(url,opts);assert.equal(blocked.status,409);
 assert.equal((await blocked.json()).code,'RECEIPT_VERIFICATION_REQUIRED');
 resolveOne(new Response(JSON.stringify({ok:true,receipt_id:9,source_record_id:32}),{status:200,headers:{'Content-Type':'application/json'}}));
 const done=await first;assert.equal(done.status,200);
 const repeat=await t[1].fetch(url,opts);assert.equal((await repeat.json()).code,'ALREADY_COMMITTED');
 assert.equal(outbound.length,1);
});
test('uncertain network outcome is retained for source verification, not automatically retried',async()=>{
 let writes=0;
 const [t]=tabs([async()=>{writes++;throw Error('network interrupted')}]);
 await assert.rejects(t.fetch(url,opts),/network interrupted/);
 const blocked=await t.fetch(url,opts);assert.equal(blocked.status,409);
 assert.equal((await blocked.json()).code,'RECEIPT_VERIFICATION_REQUIRED');
 assert.equal(writes,1);
});

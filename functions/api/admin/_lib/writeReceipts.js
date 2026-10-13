// Release 467 Build 385 — receipt-scoped, actor-bound, payload-bound D1 atomic batches.
// No idempotency promise for endpoints that do not opt in.
export const SCOPES=Object.freeze(['commission_decision','finance_review','material_reserve','material_release']);
export const keyValid=key=>/^[A-Za-z0-9_-]{16,80}$/.test(String(key||''));
export const positiveId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):0;
export function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object'){
  const result={};for(const key of Object.keys(value).sort())result[key]=canonical(value[key]);return result;
 }
 return value===undefined?null:value;
}
export async function payloadHash(scope,actor,target,data){
 if(!SCOPES.includes(scope)||!positiveId(actor)||!positiveId(target))throw Error('Invalid receipt scope/actor/target');
 const body=JSON.stringify(canonical({scope,actor:positiveId(actor),target:positiveId(target),data}));
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body));
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function fetchReceipt(db,scope,key){
 return db.prepare(`SELECT admin_write_receipt_id,action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,
 payload_sha256,created_at FROM admin_write_receipts WHERE action_scope=? AND request_key=? LIMIT 1`).bind(scope,key).first();
}
export function checkReceipt(receipt,{scope,key,actor,target,hash}){
 if(!receipt)return null;
 if(receipt.action_scope!==scope||receipt.request_key!==key||
    Number(receipt.actor_user_id)!==positiveId(actor)||Number(receipt.target_id)!==positiveId(target)||
    receipt.payload_sha256!==hash)return {ok:false,status:409,code:'IDEMPOTENCY_KEY_REUSED_DIFFERENT_ACTION',
      error:'This request key belongs to a different operation or payload. Refresh and start a new action.'};
 return {ok:true,replayed:true,receipt_id:Number(receipt.admin_write_receipt_id),
  source_record_id:Number(receipt.source_record_id),committed_at:receipt.created_at,
  message:'OK — action was already committed. No duplicate database write was made.'};
}
export function receiptInsert(db,scope,key,actor,targetType,target,hash,sourceTable,pk,releaseSourceId=0,releaseMarker=''){
 // Table + key column are ONLY internal string literals; never accept user-supplied SQL identifiers.
 const allowed={
  commission_decision:['custom_request_commission_events','custom_request_commission_event_id'],
  finance_review:['creative_project_finance_review_events','creative_project_finance_review_event_id'],
  material_reserve:['creative_project_material_reservations','creative_project_material_reservation_id'],
  material_release:['creative_project_material_reservations','creative_project_material_reservation_id']
 };
 if(!allowed[scope]||allowed[scope][0]!==sourceTable||allowed[scope][1]!==pk)throw Error('Unsupported receipt source');
 const clause=scope==='material_release'?`${pk}=? AND release_note=?`:'request_key=?';
 return db.prepare(`INSERT INTO admin_write_receipts(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256)
 SELECT ?,?,?,?,?,${pk},? FROM ${sourceTable} WHERE ${clause} LIMIT 1`).bind(scope,key,positiveId(actor),targetType,positiveId(target),hash,...(scope==='material_release'?[positiveId(releaseSourceId),releaseMarker]:[key]));
}
export async function readReceiptState(db,{scope,key,actor,target,hash}){
 const row=await fetchReceipt(db,scope,key);
 return checkReceipt(row,{scope,key,actor,target,hash});
}
export async function atomicWriteReceipt(db,statement,receiptStatement,{scope,key,actor,target,hash}){
 // D1 batch executes transactionally: both or neither. If two callers race, exactly one key wins.
 try{
  const [write,receipt]=await db.batch([statement,receiptStatement]);
  if(Number(write?.meta?.changes||0)!==1 || Number(receipt?.meta?.changes||0)!==1) {
   // Transaction may have committed a no-op business write; never call this success.
   return {ok:false,status:409,code:'WRITE_NOT_CONFIRMED',error:'Nothing was committed; refresh original source state.'};
  }
  const committed=await readReceiptState(db,{scope,key,actor,target,hash});
  if(!committed?.ok)return {ok:false,status:503,code:'RECEIPT_READ_UNCONFIRMED',error:'Write result uncertain; check receipt before retrying.'};
  return {...committed,replayed:false};
 }catch(err){
  // Return a replay only when a matching atomic receipt is really committed.
  const replay=await readReceiptState(db,{scope,key,actor,target,hash}).catch(()=>null);
  if(replay)return replay;
  const duplicate=/UNIQUE|constraint|receipt_/i.test(String(err?.message||''));
  if(duplicate)return {ok:false,status:409,code:'SOURCE_CONSTRAINT',error:'Source record rejected this action. Refresh before retry.'};
  return {ok:false,status:503,code:'WRITE_STATUS_UNKNOWN',error:'Write result not confirmed. Check receipt before retrying.'};
 }
}

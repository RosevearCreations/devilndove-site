function rows(result){return Array.isArray(result?.results)?result.results:[];}
const OUTBOX_COLUMNS=['notification_outbox_id','notification_kind','channel','destination','related_order_id','related_payment_id','payload_json','status','next_attempt_at','created_at','updated_at'];
export async function hasPublicNotificationOutboxSchema(db){
  if(!db)return false;
  const result=await db.prepare(`PRAGMA table_info(notification_outbox)`).all().catch(()=>({results:[]}));
  const columns=new Set(rows(result).map(row=>String(row?.name||'').trim()).filter(Boolean));
  return OUTBOX_COLUMNS.every(name=>columns.has(name));
}
export async function queuePublicNotification(db,payload={}){
  if(!(await hasPublicNotificationOutboxSchema(db))) return {ok:false,queued:false,reason:'notification_outbox_schema_unavailable'};
  try{
    const insert=await db.prepare(`INSERT INTO notification_outbox (notification_kind,channel,destination,related_order_id,related_payment_id,payload_json,status,next_attempt_at,created_at,updated_at) VALUES (?,?,?,?,?,?,'queued',NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(
      String(payload.notification_kind||'generic_notice').trim(),String(payload.channel||'email').trim(),String(payload.destination||'').trim()||null,
      payload.related_order_id==null?null:Number(payload.related_order_id||0),payload.related_payment_id==null?null:Number(payload.related_payment_id||0),JSON.stringify(payload.payload||{})
    ).run();
    return {ok:true,queued:true,notification_outbox_id:Number(insert?.meta?.last_row_id||0)};
  }catch{return {ok:false,queued:false,reason:'notification_outbox_write_unavailable'};}
}

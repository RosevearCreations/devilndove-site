// Release 467 Build 216 — token-protected customer-supplied item limitation acknowledgement.
// Records customer response only. No production start, order, payment, Inventory, provider or media action.
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
function clean(v,n=1200){const t=String(v??'').replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n).trim():t;}
async function load(db,token){
  return db.prepare(`SELECT a.*,i.item_label,i.item_description,i.requested_modification,i.workflow_status,
      r.decision,r.limitations_text,r.process_compatibility_notes,
      cr.request_key,cr.product_interest
    FROM custom_request_supplied_item_acknowledgements a
    JOIN custom_request_supplied_items i ON i.custom_request_supplied_item_id=a.custom_request_supplied_item_id
    JOIN custom_request_supplied_item_reviews r ON r.custom_request_supplied_item_review_id=a.custom_request_supplied_item_review_id
    JOIN custom_requests cr ON cr.custom_request_id=a.custom_request_id
    WHERE a.acknowledgement_token=? LIMIT 1`).bind(token).first().catch(()=>null);
}
function payload(row){
  const expired=Boolean(row?.expires_at)&&new Date(row.expires_at).getTime()<Date.now();
  const status=expired&&String(row.acknowledgement_status||'')==='active'?'expired':String(row?.acknowledgement_status||'');
  return {ok:true,acknowledgement:{
    status,item_label:row.item_label||'Customer-supplied item',item_description:row.item_description||'',
    requested_modification:row.requested_modification||'',decision:row.decision||'accepted_with_limitations',
    limitations:row.limitations_snapshot||row.limitations_text||'',ownership_snapshot:row.ownership_snapshot||'',
    customer_name:row.customer_name||'',expires_at:row.expires_at||'',acknowledged_at:row.acknowledged_at||'',
    declined_at:row.declined_at||'',customer_response_note:row.customer_response_note||'',
    production_started:false,payment_executed:false,inventory_reserved:false
  }};
}
export async function onRequestGet(context){
  const db=context.env.DB||context.env.DD_DB;if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const token=clean(new URL(context.request.url).searchParams.get('token'),180);if(!token)return json({ok:false,error:'Missing acknowledgement token.'},400);
  const row=await load(db,token);if(!row)return json({ok:false,error:'Acknowledgement was not found.'},404);
  return json(payload(row));
}
export async function onRequestPost(context){
  const db=context.env.DB||context.env.DD_DB;if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const token=clean(body.token,180),action=clean(body.action,40).toLowerCase(),note=clean(body.customer_response_note||body.note,1200);
  if(!token||!['acknowledge','decline'].includes(action))return json({ok:false,error:'Choose acknowledge or decline.'},400);
  const row=await load(db,token);if(!row)return json({ok:false,error:'Acknowledgement was not found.'},404);
  if(String(row.decision||'')!=='accepted_with_limitations')return json({ok:false,error:'This acknowledgement is no longer attached to an accepted-with-limitations review.'},409);
  if(Boolean(row.expires_at)&&new Date(row.expires_at).getTime()<Date.now())return json({ok:false,error:'This acknowledgement link has expired.'},400);
  if(String(row.acknowledgement_status||'')!=='active')return json({ok:false,error:'This acknowledgement has already been responded to or closed.'},400);
  const acknowledged=action==='acknowledge';
  await db.prepare(`UPDATE custom_request_supplied_item_acknowledgements SET acknowledgement_status=?,
    acknowledged_at=CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE acknowledged_at END,
    declined_at=CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE declined_at END,
    customer_response_note=?,updated_at=CURRENT_TIMESTAMP
    WHERE custom_request_supplied_item_acknowledgement_id=? AND acknowledgement_status='active'`).bind(
      acknowledged?'acknowledged':'declined',acknowledged?1:0,acknowledged?0:1,note||null,Number(row.custom_request_supplied_item_acknowledgement_id)
    ).run();
  if(acknowledged){
    const latest=await db.prepare(`SELECT custom_request_supplied_item_review_id,decision FROM custom_request_supplied_item_reviews
      WHERE custom_request_supplied_item_id=? ORDER BY custom_request_supplied_item_review_id DESC LIMIT 1`).bind(Number(row.custom_request_supplied_item_id)).first().catch(()=>null);
    if(Number(latest?.custom_request_supplied_item_review_id)===Number(row.custom_request_supplied_item_review_id)&&String(latest?.decision)==='accepted_with_limitations'){
      await db.prepare(`UPDATE custom_request_supplied_items SET workflow_status='limitations_acknowledged',updated_at=CURRENT_TIMESTAMP
        WHERE custom_request_supplied_item_id=? AND workflow_status='limitations_pending'`).bind(Number(row.custom_request_supplied_item_id)).run();
    }
  }
  const updated=await load(db,token);
  return json({message:acknowledged?'Limitations acknowledged. Devil n Dove will still review the next step before any work begins.':'Acknowledgement declined. Devil n Dove will review the request before any work begins.',...payload(updated)});
}

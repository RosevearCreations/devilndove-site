// Release 467 Build 641 — saved, owner-scoped planning documents only.
// Uses the existing private app_settings table; does not migrate schema,
// reserve units, create a purchase order, or update Product inventory.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';

const PREFIX='site.admin.owner_restock_plans.v641.';
const MAX_PLANS=20,MAX_ITEMS=8,MAX_UNITS=100000;
const STATUSES=new Set(['draft','follow_up','blocked','completed']);
const METHODS=new Set(['make','buy','review']);
const reply=(data,status=200)=>jsonResponse({build:641,...data},status,{'Cache-Control':'no-store'});
const integer=(v,min,max)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
const text=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max&&v.length<=max;
const validDay=v=>v===''||(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&
  !Number.isNaN(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v);
function grant(context){const admin=verifiedAdminFromModule(context),db=getDb(context.env);
  return !admin?{error:reply({ok:false,error:'Verified active Admin required.'},401)}:
    !db?{error:reply({ok:false,error:'Database unavailable; no save attempted.',retry_automatically:false},503)}:
    {admin,db,key:`${PREFIX}${admin.user_id}`};}
function decode(row){if(!row)return {schema:641,version:0,plans:[]};
  if(row.is_public!==0)throw Error('private_storage_required');
  const data=JSON.parse(row.setting_value);
  if(data?.schema!==641||!integer(data.version,1,1000000000)||!Array.isArray(data.plans)||data.plans.length>MAX_PLANS)
    throw Error('invalid_saved_owner_document');
  return data;
}
async function read(db,key){const row=await db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1').bind(key).first();
  return {row,doc:decode(row)};}

export async function onRequestGet(context){const a=grant(context);if(a.error)return a.error;
  try{const {doc}=await read(a.db,a.key);return reply({ok:true,owner_user_id:a.admin.user_id,version:doc.version,
    plans:doc.plans,private:true,inventory_mutation:false,automatic:false});}
  catch{return reply({ok:false,error:'Saved plans could not be verified. No cached or untrusted plans returned.',retry_automatically:false},503);}}

async function verifyItems(db,items){
  if(!Array.isArray(items)||items.length<1||items.length>MAX_ITEMS)throw Error('Select 1–8 reviewed Products.');
  const ids=new Set();
  for(const item of items){if(!item||!integer(item.product_id,1,1000000000)||ids.has(item.product_id)||
    !integer(item.units,1,MAX_UNITS)||!METHODS.has(item.method)||!text(item.note,8,240)||
    !integer(item.saved_on_hand,0,100000000)||!integer(item.qualifying_order_committed,0,100000000))
    throw Error('Each line needs one verified Product, 1–100000 units, a source, a factual note and a valid source snapshot.');
    ids.add(item.product_id);
  }
  const result=await db.prepare(`SELECT p.product_id,p.name,p.sku,p.inventory_quantity,
    v.product_id AS commitment_product_id,v.committed_quantity FROM products p
    LEFT JOIN product_inventory_active_commitments v ON v.product_id=p.product_id
    WHERE p.product_type='physical' AND p.inventory_tracking=1 AND p.status IN ('active','draft')
      AND p.product_id IN (${items.map(()=>'?').join(',')})`).bind(...items.map(x=>x.product_id)).all();
  if(!Array.isArray(result?.results)||result.results.length!==items.length)throw Error('Tracked physical Product evidence changed. Run a fresh exception scan.');
  const byId=new Map(result.results.map(x=>[Number(x.product_id),x]));
  return items.map(item=>{const source=byId.get(item.product_id),onHand=Number(source?.inventory_quantity),
    committed=source?.commitment_product_id==null?0:Number(source?.committed_quantity);
    if(!source||!Number.isSafeInteger(onHand)||onHand<0||!Number.isSafeInteger(committed)||committed<0||
      onHand!==item.saved_on_hand||committed!==item.qualifying_order_committed||onHand-committed>2)
      throw Error('Product stock or qualified orders changed; review a fresh scan before saving.');
    return {product_id:item.product_id,name:String(source.name||'').slice(0,180),sku:String(source.sku||'').slice(0,80),
      units:item.units,method:item.method,note:item.note.trim(),saved_on_hand:onHand,
      qualifying_order_committed:committed};
  });
}
export async function onRequestPost(context){const a=grant(context);if(a.error)return a.error;
  if(context.request.headers.get('content-type')?.toLowerCase().includes('application/json')!==true)
    return reply({ok:false,error:'JSON content type is required.'},415);
  let body;try{body=await context.request.json();}catch{return reply({ok:false,error:'Invalid JSON.'},400);}
  if(!body||!['create','update'].includes(body.action)||!integer(body.expected_version,0,1000000000)||
    !text(body.title,4,100)||!STATUSES.has(body.status)||!validDay(body.follow_up_on)||
    typeof body.owner_note!=='string'||body.owner_note.length>500||
    (body.action==='create'&&(body.status!=='draft'||body.plan_id!==undefined))||
    (body.action==='update'&&(typeof body.plan_id!=='string'||!/^[0-9a-f-]{36}$/.test(body.plan_id)||body.items!==undefined)))
    return reply({ok:false,error:'Invalid plan, status, date or version. No save attempted.'},400);
  try{
    const {row,doc}=await read(a.db,a.key);
    if(doc.version!==body.expected_version)return reply({ok:false,code:'stale_plan_version',
      error:'This plan list changed elsewhere. Reload owner plans and review before saving.',retry_automatically:false},409);
    const now=new Date().toISOString();let plan,action=body.action;
    if(action==='create'){
      if(doc.plans.length>=MAX_PLANS)return reply({ok:false,error:'Owner plan limit reached; complete existing follow-ups first.'},409);
      const items=await verifyItems(a.db,body.items);
      plan={plan_id:crypto.randomUUID(),title:body.title.trim(),status:'draft',follow_up_on:body.follow_up_on,
        owner_note:body.owner_note.trim(),items,created_at:now,updated_at:now};
      doc.plans.unshift(plan);
    }else{
      plan=doc.plans.find(p=>p.plan_id===body.plan_id);
      if(!plan)return reply({ok:false,error:'This owner plan no longer exists. Reload before editing.'},404);
      plan={...plan,title:body.title.trim(),status:body.status,follow_up_on:body.follow_up_on,
        owner_note:body.owner_note.trim(),updated_at:now};
      doc.plans=doc.plans.map(p=>p.plan_id===plan.plan_id?plan:p);
    }
    const next={schema:641,version:doc.version+1,plans:doc.plans};
    const value=JSON.stringify(next);
    if(value.length>64000) return reply({ok:false,error:'Owner plan document exceeds safe storage size.'},413);
    const write=row?await a.db.prepare(`UPDATE app_settings SET setting_value=?,is_public=0,
      updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?`)
      .bind(value,a.admin.user_id,a.key,row.setting_value).run():
      await a.db.prepare(`INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at)
        VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING`)
        .bind(a.key,value,a.admin.user_id).run();
    if(Number(write?.meta?.changes)!==1)return reply({ok:false,code:'stale_plan_version',
      error:'Another edit won the save race. Reload and review; no automatic retry.',retry_automatically:false},409);
    // Read back the committed document before confirming durable persistence.
    let verified=false;
    try{const result=await read(a.db,a.key);verified=result.doc.version===next.version&&
      result.doc.plans.some(p=>p.plan_id===plan.plan_id&&p.updated_at===now);}catch{}
    if(!verified)return reply({ok:false,code:'save_unverified',error:'Save outcome cannot be verified. Reload before trying any other write.',retry_automatically:false},503);
    let audit_recorded=true;
    try{await a.db.prepare(`INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,
      request_path,details_json,created_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
      .bind(a.admin.user_id,'owner_restock_plan_'+action,'owner_restock_plan',plan.plan_id,'POST',
        '/api/admin/owner-restock-plans',JSON.stringify({version:next.version,status:plan.status,item_count:plan.items.length,
          private:true,inventory_mutation:false,external_actions:false})).run();}
    catch{audit_recorded=false;}
    return reply({ok:true,saved:true,version:next.version,plan,audit_recorded,
      warning:audit_recorded?null:'Plan was saved but audit recording failed; do not repeat the save. Ask an administrator to inspect.',
      private:true,inventory_mutation:false,automatic:false,external_actions:false});
  }catch(error){return reply({ok:false,error:error?.message?.startsWith('Product')||error?.message?.startsWith('Each')||
    error?.message?.startsWith('Tracked')||error?.message?.startsWith('Select')?error.message:
    'Owner plan storage or source verification unavailable. No automatic retry.',retry_automatically:false},503);}
}

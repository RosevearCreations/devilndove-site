// Release 450 admin-editable marketplace CSV mappings.
// Schema ownership belongs to the guarded Development migration; request-time DDL is forbidden.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { MARKETPLACE_RELEASE, marketplaceSchemaStatus, readChannelPolicy } from '../_lib/marketplaceReadiness.js';

function json(data,status=200){return jsonResponse(data,status,{ 'Cache-Control':'no-store' });}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function clean(v,l=240){const t=normalizeText(v);return t.length>l?t.slice(0,l).trim():t;}
const SUPPORTED=['etsy','facebook','pinterest','tiktok','manual'];

export async function onRequestGet(context){
  const db=getDb(context.env); if(!db)return json({ok:false,release:MARKETPLACE_RELEASE,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,release:MARKETPLACE_RELEASE,error:'Unauthorized.'},401);
  const schema=await marketplaceSchemaStatus(db);
  if(!schema.ready)return json({ok:false,release:MARKETPLACE_RELEASE,schema_ready:false,missing_tables:schema.missing_tables,request_time_schema_mutation:false,error:'Release 450 marketplace schema is not active.'},503);
  const mappings=rows(await db.prepare(`SELECT * FROM marketplace_csv_mappings ORDER BY channel ASC`).all());
  const policies=[];
  for(const channel of SUPPORTED){const policy=await readChannelPolicy(db,channel);if(policy)policies.push(policy);}
  return json({ok:true,release:MARKETPLACE_RELEASE,request_time_schema_mutation:false,provider_execution:false,mappings,policies,supported_channels:SUPPORTED});
}

export async function onRequestPost(context){
  const db=getDb(context.env); if(!db)return json({ok:false,release:MARKETPLACE_RELEASE,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,release:MARKETPLACE_RELEASE,error:'Unauthorized.'},401);
  const schema=await marketplaceSchemaStatus(db);
  if(!schema.ready)return json({ok:false,release:MARKETPLACE_RELEASE,schema_ready:false,missing_tables:schema.missing_tables,request_time_schema_mutation:false,error:'Release 450 marketplace schema is not active.'},503);
  let body={}; try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const channel=clean(body.channel,40).toLowerCase(); if(!SUPPORTED.includes(channel))return json({ok:false,error:'Unsupported channel.'},400);
  const policy=await readChannelPolicy(db,channel); if(!policy)return json({ok:false,error:'Marketplace policy is not configured.'},409);
  if(Number(policy.provider_execution_allowed||0)!==0)return json({ok:false,error:'Mapping changes are blocked while provider execution is enabled.'},409);
  let columns=[];
  try{const parsed=Array.isArray(body.mapping_json)?body.mapping_json:JSON.parse(clean(body.mapping_json||'[]',5000)); columns=parsed.map((x)=>clean(x,80)).filter(Boolean).slice(0,100);}catch{return json({ok:false,error:'Mapping must be a JSON array or list.'},400);}
  if(!columns.length)return json({ok:false,error:'Add at least one column.'},400);
  await db.prepare(`UPDATE marketplace_csv_mappings SET mapping_json=?,validation_json=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE channel=?`)
    .bind(JSON.stringify(columns),JSON.stringify(body.validation_json||{}),Number(user.user_id||0)||null,channel).run();
  return json({ok:true,release:MARKETPLACE_RELEASE,message:`${channel} CSV mapping saved.`,channel,columns,provider_execution:false});
}

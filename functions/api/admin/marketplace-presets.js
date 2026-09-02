// Release 467 Build 17 — narrow marketplace preset editor/preflight.
// Updates existing preset rows only. No schema creation, provider execution or publication.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const CHANNELS=new Set(['etsy','facebook_marketplace','pinterest']);
const REQUIRED_COLUMNS=['channel_key','title_prefix','title_suffix','description_intro','category_path','default_tags_json','default_materials_json','shipping_profile_reference','content_strategy','policy_overrides_json','preset_status','updated_at'];
function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function text(value,max=1200){return normalizeText(value||'').slice(0,max);}
function safeJson(value,fallback){try{return JSON.parse(value||'');}catch{return fallback;}}
function uniqueList(value,maxItems=20,maxLen=80){const input=Array.isArray(value)?value:String(value||'').split(',');return [...new Set(input.map(v=>text(v,maxLen)).filter(Boolean))].slice(0,maxItems);}
async function access(context){const adminUser=await getAdminUserFromRequest(context.request,context.env);if(!adminUser)return {error:json({ok:false,error:'Admin access required.'},401)};const db=getDb(context.env);if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};return {adminUser,db};}
async function schemaReady(db){const table=await db.prepare("SELECT 1 ok FROM sqlite_schema WHERE type='table' AND name='custom_request_marketplace_channel_presets' LIMIT 1").first().catch(()=>null);if(!table?.ok)return {ready:false,missing:['custom_request_marketplace_channel_presets']};const cols=(await db.prepare('PRAGMA table_info(custom_request_marketplace_channel_presets)').all().catch(()=>({results:[]}))).results||[];const names=new Set(cols.map(row=>String(row.name||'')));return {ready:REQUIRED_COLUMNS.every(name=>names.has(name)),missing:REQUIRED_COLUMNS.filter(name=>!names.has(name))};}
function normalizeRow(row){const policy=safeJson(row.policy_overrides_json,{});return {...row,default_tags:uniqueList(safeJson(row.default_tags_json,[]),20,80),default_materials:uniqueList(safeJson(row.default_materials_json,[]),20,80),policy_overrides:policy,provider_execution:false,publication_allowed:false,automatic_publication:false,request_time_schema_mutation:false};}
function preflight(row){const blockers=[],warnings=[];const channel=String(row.channel_key||'');const tags=uniqueList(row.default_tags??safeJson(row.default_tags_json,[]),20,80);const policy=row.policy_overrides||safeJson(row.policy_overrides_json,{});
  if(row.preset_status&&String(row.preset_status).toLowerCase()!=='active')warnings.push('Preset is not active.');
  if(channel==='etsy'){
    if(!text(row.category_path,300))blockers.push('Etsy category path is required for a ready export preset.');
    if(!text(row.shipping_profile_reference,300))blockers.push('Etsy shipping profile reference is required.');
    if(tags.length<1)blockers.push('Etsy needs at least one reviewed tag.');
    if(tags.length>13)blockers.push('Etsy supports at most 13 preset tags.');
  }
  if(channel==='facebook_marketplace'&&!text(row.category_path,300))warnings.push('Facebook Marketplace category is not set.');
  if(channel==='pinterest'&&!text(row.content_strategy,600))warnings.push('Pinterest content strategy is empty.');
  if(!(text(row.title_prefix,180)||text(row.title_suffix,180)||text(row.description_intro,500)))warnings.push('No title/description preset guidance is defined.');
  if(policy.canada_only!==true)blockers.push('Canada-only policy is not explicitly preserved in this preset.');
  if(policy.no_automatic_posting!==true)blockers.push('No-automatic-posting policy is not explicitly preserved.');
  if(policy.review_before_publish!==true)blockers.push('Review-before-publish policy is not explicitly preserved.');
  return {ready:blockers.length===0,blockers,warnings,tags_count:tags.length,provider_execution:false,publication_allowed:false,automatic_publication:false};
}
async function loadRows(db){const result=await db.prepare("SELECT * FROM custom_request_marketplace_channel_presets WHERE channel_key IN ('etsy','facebook_marketplace','pinterest') ORDER BY CASE channel_key WHEN 'etsy' THEN 1 WHEN 'facebook_marketplace' THEN 2 WHEN 'pinterest' THEN 3 ELSE 4 END").all();return (result.results||[]).map(row=>{const normalized=normalizeRow(row);return {...normalized,preflight:preflight(normalized)};});}

export async function onRequestGet(context){const state=await access(context);if(state.error)return state.error;const readiness=await schemaReady(state.db);if(!readiness.ready)return json({ok:false,error:'marketplace_preset_schema_unavailable',missing:readiness.missing,request_time_schema_mutation:false},503);try{return json({ok:true,release:467,build:17,presets:await loadRows(state.db),policy:{existing_rows_only:true,canada_only_locked:true,no_automatic_posting_locked:true,review_before_publish_locked:true,provider_execution:false,publication_allowed:false,request_time_schema_mutation:false}});}catch(error){return json({ok:false,error:'Marketplace presets could not be loaded.',detail:String(error?.message||error)},500);}}

export async function onRequestPost(context){const state=await access(context);if(state.error)return state.error;const readiness=await schemaReady(state.db);if(!readiness.ready)return json({ok:false,error:'marketplace_preset_schema_unavailable',missing:readiness.missing,request_time_schema_mutation:false},503);let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Expected a JSON request body.'},400);}const channel=text(body.channel_key,80).toLowerCase();if(!CHANNELS.has(channel))return json({ok:false,error:'Choose Etsy, Facebook Marketplace, or Pinterest.'},400);const existing=await state.db.prepare('SELECT * FROM custom_request_marketplace_channel_presets WHERE channel_key=? LIMIT 1').bind(channel).first();if(!existing)return json({ok:false,error:'The existing marketplace preset row was not found. Build 17 will not create it at request time.',request_time_schema_mutation:false},409);
  const tags=uniqueList(body.default_tags,20,80);const materials=uniqueList(body.default_materials,20,80);const preservedPolicy=safeJson(existing.policy_overrides_json,{});
  const next={...existing,title_prefix:text(body.title_prefix,180),title_suffix:text(body.title_suffix,180),description_intro:text(body.description_intro,1000),category_path:text(body.category_path,500),default_tags:tags,default_materials:materials,shipping_profile_reference:text(body.shipping_profile_reference,500),content_strategy:text(body.content_strategy,1200),policy_overrides:preservedPolicy,preset_status:String(existing.preset_status||'active')};
  const validation=preflight(next);if(String(body.action||'save').toLowerCase()==='preflight')return json({ok:true,channel_key:channel,preflight:validation,policy_overrides:preservedPolicy,provider_execution:false,publication_allowed:false,automatic_publication:false});
  try{
    await state.db.prepare(`UPDATE custom_request_marketplace_channel_presets SET title_prefix=?,title_suffix=?,description_intro=?,category_path=?,default_tags_json=?,default_materials_json=?,shipping_profile_reference=?,content_strategy=?,updated_at=CURRENT_TIMESTAMP WHERE channel_key=?`).bind(next.title_prefix,next.title_suffix,next.description_intro,next.category_path,JSON.stringify(tags),JSON.stringify(materials),next.shipping_profile_reference,next.content_strategy,channel).run();
    await auditAdminAction(context.env,context.request,state.adminUser,{action_type:'marketplace_preset_update',target_type:'custom_request_marketplace_channel_preset',target_key:channel,details:{fields:['title_prefix','title_suffix','description_intro','category_path','default_tags_json','default_materials_json','shipping_profile_reference','content_strategy'],policy_overrides_preserved:true,provider_execution:false,publication:false}});
    const saved=normalizeRow(await state.db.prepare('SELECT * FROM custom_request_marketplace_channel_presets WHERE channel_key=? LIMIT 1').bind(channel).first());
    return json({ok:true,preset:{...saved,preflight:preflight(saved)},message:'Preset saved for review/export preparation only.',provider_execution:false,publication_allowed:false,automatic_publication:false,request_time_schema_mutation:false});
  }catch(error){return json({ok:false,error:'Marketplace preset could not be saved.',detail:String(error?.message||error)},500);}
}

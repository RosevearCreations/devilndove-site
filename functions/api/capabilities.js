import { captureRuntimeIncident } from "./_lib/adminAudit.js";

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"public, max-age=120","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin"}});
const rows=r=>Array.isArray(r?.results)?r.results:[];
const text=v=>String(v??"").trim();
const parseKeys=v=>{try{const x=JSON.parse(String(v||"[]"));return Array.isArray(x)?x.map(text).filter(Boolean):[];}catch{return[];}};

async function tableReady(db){return Boolean(await db.prepare("SELECT 1 ok FROM sqlite_master WHERE type='table' AND name='workshop_capability_profiles' LIMIT 1").first().catch(()=>null));}
export async function onRequestGet({request,env}){
 const db=env.DB||env.DD_DB;if(!db)return json({ok:false,error:"Capability data is temporarily unavailable."},503);
 if(!(await tableReady(db)))return json({ok:false,error:"Workshop capability profiles are not available yet.",code:"capability_profile_migration_required"},503);
 const key=text(new URL(request.url).searchParams.get("key")).toLowerCase();
 try{
  const profiles=rows(await db.prepare(`SELECT capability_key,display_name,summary,suitable_uses,common_materials,known_constraints,constraints_state,customer_supplied_policy,proof_sample_policy,related_process_keys_json,gallery_query,custom_request_path,source_note,review_status,updated_at
    FROM workshop_capability_profiles
    WHERE is_public=1 AND review_status IN ('reviewed','published') AND (?='' OR capability_key=?)
    ORDER BY display_name`).bind(key,key).all());
  const processes=rows(await db.prepare("SELECT process_key,process_name FROM inventory_processes WHERE is_active=1 ORDER BY sort_order,process_name").all());
  const processMap=new Map(processes.map(p=>[text(p.process_key),text(p.process_name)]));
  const shaped=profiles.map(p=>({...p,related_processes:parseKeys(p.related_process_keys_json).map(k=>({process_key:k,process_name:processMap.get(k)||k})),gallery_href:p.gallery_query?`/gallery/?q=${encodeURIComponent(p.gallery_query)}`:"/gallery/",custom_request_href:text(p.custom_request_path)||"/custom-request/"}));
  return json({ok:true,release:467,build:209,authority:"workshop_capability_profiles",source_process_authority:"inventory_processes",profiles:shaped,count:shaped.length,technical_limit_policy:"unknown_until_measured_or_owner_supplied"});
 }catch(error){
  await captureRuntimeIncident(env,request,{incident_scope:"public_capabilities",incident_code:"capability_profile_read_failed",severity:"warning",message:"Public workshop capability profile read failed.",details:{error:error?.message||"Unknown error",key}});
  return json({ok:false,error:"Capability profiles could not be loaded right now."},503);
 }
}

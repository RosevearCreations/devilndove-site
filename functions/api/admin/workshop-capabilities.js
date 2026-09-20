import { auditAdminAction,getAdminUserFromRequest,getDb,jsonResponse,normalizeText } from "../_lib/adminAudit.js";
const json=(data,status=200)=>jsonResponse({release:467,build:209,...data},status,{"Cache-Control":"no-store"});
const rows=r=>Array.isArray(r?.results)?r.results:[];
const allowedState=new Set(["unmeasured","owner_confirmed","measured","mixed"]);
const allowedSupplied=new Set(["may_be_assessed","not_assessed","not_applicable"]);
const allowedProof=new Set(["case_by_case","normally_required","normally_not_required","unknown"]);
const allowedReview=new Set(["draft","reviewed","published","hold"]);
const keyFor=v=>normalizeText(v).toLowerCase();

async function ctx(request,env){const admin=await getAdminUserFromRequest(request,env);if(!admin)return{error:json({ok:false,error:"Unauthorized."},401)};const db=getDb(env);if(!db)return{error:json({ok:false,error:"Database binding is not configured."},503)};return{admin,db};}
async function ready(db){const r=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('workshop_capability_profiles','inventory_processes')").all();return new Set(rows(r).map(x=>x.name)).size===2;}
async function snapshot(db){
 const profiles=rows(await db.prepare("SELECT * FROM workshop_capability_profiles ORDER BY display_name").all());
 const processes=rows(await db.prepare("SELECT inventory_process_id,process_key,process_name,description,sort_order FROM inventory_processes WHERE is_active=1 ORDER BY sort_order,process_name").all());
 return {profiles,processes,counts:{profiles:profiles.length,public_profiles:profiles.filter(x=>Number(x.is_public||0)===1).length,unmeasured:profiles.filter(x=>String(x.constraints_state)==='unmeasured').length}};
}
export async function onRequestGet({request,env}){const c=await ctx(request,env);if(c.error)return c.error;if(!(await ready(c.db)))return json({ok:false,error:"Build 209 capability migration is required.",code:"capability_profile_migration_required"},503);return json({ok:true,...await snapshot(c.db),authority:"workshop_capability_profiles",process_authority:"inventory_processes",automatic_publication:false});}
export async function onRequestPost({request,env}){
 const c=await ctx(request,env);if(c.error)return c.error;if(!(await ready(c.db)))return json({ok:false,error:"Build 209 capability migration is required.",code:"capability_profile_migration_required"},503);
 let body={};try{body=await request.json();}catch{return json({ok:false,error:"Invalid JSON body."},400);}
 if(keyFor(body.action)!=="update")return json({ok:false,error:"Unsupported action."},400);
 const id=Number(body.workshop_capability_profile_id||0);if(!id)return json({ok:false,error:"Capability profile is required."},400);
 const existing=await c.db.prepare("SELECT capability_key FROM workshop_capability_profiles WHERE workshop_capability_profile_id=? LIMIT 1").bind(id).first();if(!existing)return json({ok:false,error:"Capability profile not found."},404);
 const display=normalizeText(body.display_name).slice(0,120),summary=normalizeText(body.summary).slice(0,700),uses=normalizeText(body.suitable_uses).slice(0,1200),materials=normalizeText(body.common_materials).slice(0,1200),constraints=normalizeText(body.known_constraints).slice(0,1600),source=normalizeText(body.source_note).slice(0,1200),gallery=normalizeText(body.gallery_query).slice(0,120);
 const state=keyFor(body.constraints_state),supplied=keyFor(body.customer_supplied_policy),proof=keyFor(body.proof_sample_policy),review=keyFor(body.review_status);const isPublic=body.is_public?1:0;
 if(!display||!summary||!uses||!materials||!constraints||!source)return json({ok:false,error:"Display name, summary, uses, materials, constraints and source note are required."},400);
 if(!allowedState.has(state)||!allowedSupplied.has(supplied)||!allowedProof.has(proof)||!allowedReview.has(review))return json({ok:false,error:"One or more review states are invalid."},400);
 if(isPublic&&!["reviewed","published"].includes(review))return json({ok:false,error:"A public capability must be reviewed or published."},400);
 const keys=[...new Set((Array.isArray(body.related_process_keys)?body.related_process_keys:[]).map(keyFor).filter(Boolean))].slice(0,12);
 if(!keys.length)return json({ok:false,error:"At least one canonical workshop process is required."},400);
 const placeholders=keys.map(()=>"?").join(",");
 const found=rows(await c.db.prepare(`SELECT process_key FROM inventory_processes WHERE is_active=1 AND process_key IN (${placeholders})`).bind(...keys).all()).map(x=>String(x.process_key));
 if(found.length!==keys.length)return json({ok:false,error:"Every related process must exist in the canonical inventory_processes authority."},400);
 await c.db.prepare(`UPDATE workshop_capability_profiles SET display_name=?,summary=?,suitable_uses=?,common_materials=?,known_constraints=?,constraints_state=?,customer_supplied_policy=?,proof_sample_policy=?,related_process_keys_json=?,gallery_query=?,source_note=?,review_status=?,is_public=?,reviewed_by_user_id=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE workshop_capability_profile_id=?`).bind(display,summary,uses,materials,constraints,state,supplied,proof,JSON.stringify(keys),gallery||null,source,review,isPublic,Number(c.admin.user_id||0)||null,id).run();
 await auditAdminAction(env,request,c.admin,{action_type:"workshop_capability_profile_update",target_type:"workshop_capability_profile",target_id:id,target_key:String(existing.capability_key),details:{review_status:review,is_public:Boolean(isPublic),constraints_state:state,related_process_keys:keys}});
 return json({ok:true,message:"Capability profile saved. Technical facts remain limited to reviewed source evidence.",...await snapshot(c.db)});
}

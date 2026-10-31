/* Build 547: authenticated owner-scoped monitoring history and saved views.
   Reuses the established command-center saved-view table; no schema mutation. */
import {auditAdminAction,getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {compactOwnerReviews,ownerReviewReceipt} from '../_lib/systemHealthOwnerReview551.mjs';

const PATHS=new Set(['/','/shop/','/admin/','/admin/product-editor/?product_id=54','/admin/system-operations/']);
const STATUS=new Set(['200','301','302','400','401','403','404','429','500','502','503','504','524','TIMEOUT','NETWORK ERROR']);
const AREA='system_health_history',PRESET='system_health_preset',OWNER_REVIEW='system_health_owner_reviews';
const idOf=user=>Number(user?.user_id||0);
const keyFor=id=>`system-health-history-owner-${id}`;
const reviewKey=id=>`system-health-reviews-owner-${id}`;
export function cleanSamples(input,{fresh=true}={}){if(!Array.isArray(input))return [];
  const samples=[];for(const row of input.slice(0,fresh?20:60)){
    const path=String(row?.path||''),status=String(row?.status||''),ms=Number(row?.ms),at=String(row?.at||'');
    const date=Date.parse(at);
    if(!PATHS.has(path)||!STATUS.has(status)||!Number.isInteger(ms)||ms<0||ms>60000||!Number.isFinite(date)||(fresh&&Math.abs(Date.now()-date)>86400000))return null;
    samples.push({path,name:({ '/':'Homepage','/shop/':'Shop','/admin/':'Admin','/admin/product-editor/?product_id=54':'Product Editor','/admin/system-operations/':'System Operations'})[path],status,ms,at:new Date(date).toISOString()});
  }return samples;
}
function json(value,fallback){try{const x=JSON.parse(value||'');return x&&typeof x==='object'?x:fallback;}catch{return fallback;}}
export function compact(samples){const seen=new Set();return [...samples].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).filter(s=>{const key=s.path+'|'+s.at;if(seen.has(key))return false;seen.add(key);return true;}).slice(-60);}
export function matchingReceipt(samples,{path,at}){return PATHS.has(path)&&Number.isFinite(Date.parse(at))&&samples.some(row=>row.path===path&&row.at===new Date(at).toISOString());}
export function compareHistoryReceipt(samples,{path,at,status,ms}){
  const found=PATHS.has(path)&&Number.isFinite(Date.parse(at))?samples.find(row=>row.path===path&&row.at===new Date(at).toISOString()):null;
  const exact=!!found&&(status===undefined||found.status===status)&&(ms===undefined||found.ms===ms);
  return {found:exact,record_exists:!!found,changed:!!found&&!exact};
}
async function auth(context){const user=await getAdminUserFromRequest(context.request,context.env),db=getDb(context.env);return {user,db,id:idOf(user)};}
export async function onRequestGet(context){const {user,db,id}=await auth(context);if(!user||!id)return jsonResponse({ok:false,error:'Administrator sign-in required.'},401);if(!db)return jsonResponse({ok:false,error:'Database unavailable.'},503);
  try{
    const saved=await db.prepare(`SELECT filter_json FROM admin_command_center_saved_views WHERE view_key=? AND view_area=? AND created_by_user_id=? LIMIT 1`).bind(keyFor(id),AREA,id).first();
    const history=cleanSamples(json(saved?.filter_json,{}).samples,{fresh:false})||[];
    const presets=(await db.prepare(`SELECT view_key,view_label,filter_json,updated_at FROM admin_command_center_saved_views WHERE view_area=? AND created_by_user_id=? AND view_status='active' ORDER BY updated_at DESC LIMIT 8`).bind(PRESET,id).all()).results||[];
    const incident=(await db.prepare(`SELECT LOWER(COALESCE(severity,'warning')) AS severity,LOWER(COALESCE(review_status,'open')) AS review_status,COUNT(*) AS total FROM runtime_incidents WHERE datetime(created_at)>=datetime('now','-30 days') GROUP BY LOWER(COALESCE(severity,'warning')),LOWER(COALESCE(review_status,'open')) ORDER BY total DESC LIMIT 30`).all()).results||[];
    const url=new URL(context.request.url),receiptPath=String(url.searchParams.get('receipt_path')||''),receiptAt=String(url.searchParams.get('receipt_at')||''),receiptView=String(url.searchParams.get('receipt_view')||'');
    if(receiptPath||receiptAt||receiptView){
      if(receiptView){if(!/^system-health-preset-\d+-[a-z0-9-]{1,45}$/.test(receiptView))return jsonResponse({ok:false,error:'Invalid view receipt.'},400);
        const matched=presets.find(row=>row.view_key===receiptView);
        const label=url.searchParams.get('receipt_label'),updated=url.searchParams.get('receipt_updated');
        if((label!==null&&label.length>55)||(updated!==null&&updated.length>40))return jsonResponse({ok:false,error:'Invalid view receipt details.'},400);
        const exact=!!matched&&(label===null||matched.view_label===label)&&(updated===null||matched.updated_at===updated);
        return jsonResponse({ok:true,receipt_check:{kind:'view',found:exact,record_exists:!!matched,changed:!!matched&&!exact,owner_scoped:true,label:matched?.view_label||null,updated_at:matched?.updated_at||null}},200,{'Cache-Control':'no-store'});}
      if(!PATHS.has(receiptPath)||!Number.isFinite(Date.parse(receiptAt)))return jsonResponse({ok:false,error:'Invalid route receipt.'},400);
      const hasStatus=url.searchParams.has('receipt_status'),hasMs=url.searchParams.has('receipt_ms'),status=url.searchParams.get('receipt_status'),msText=url.searchParams.get('receipt_ms'),ms=Number(msText);
      if(hasStatus!==hasMs||(hasStatus&&(!STATUS.has(status)||!/^(?:0|[1-9]\d{0,4})$/.test(msText)||ms>60000)))return jsonResponse({ok:false,error:'Invalid history receipt details.'},400);
      const comparison=compareHistoryReceipt(history,{path:receiptPath,at:receiptAt,...(hasStatus?{status,ms}:{})});
      return jsonResponse({ok:true,receipt_check:{kind:'history',...comparison,owner_scoped:true,path:receiptPath,at:new Date(receiptAt).toISOString()}},200,{'Cache-Control':'no-store'});
    }
    const timeline=(await db.prepare(`SELECT runtime_incident_id,incident_code,incident_scope,severity,endpoint_path,COALESCE(review_status,'open') AS review_status,created_at,reviewed_at FROM runtime_incidents WHERE datetime(created_at)>=datetime('now','-30 days') ORDER BY datetime(created_at) DESC,runtime_incident_id DESC LIMIT 25`).all()).results||[];
    const aging=await db.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) NOT IN ('resolved','ignored') THEN 1 ELSE 0 END) AS open_total, SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) NOT IN ('resolved','ignored') AND datetime(created_at)<=datetime('now','-1 day') THEN 1 ELSE 0 END) AS open_24h, SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) NOT IN ('resolved','ignored') AND datetime(created_at)<=datetime('now','-7 days') THEN 1 ELSE 0 END) AS open_7d, SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) NOT IN ('resolved','ignored') AND reviewed_at IS NULL THEN 1 ELSE 0 END) AS open_without_review FROM runtime_incidents WHERE datetime(created_at)>=datetime('now','-30 days')`).first();
    const ownerRecord=await db.prepare(`SELECT filter_json FROM admin_command_center_saved_views WHERE view_key=? AND view_area=? AND created_by_user_id=? LIMIT 1`).bind(reviewKey(id),OWNER_REVIEW,id).first();
    const ownerReviews=json(ownerRecord?.filter_json,{}).reviews;
    return jsonResponse({ok:true,readback_at:new Date().toISOString(),history:history.slice(-60),presets:presets.map(row=>({key:row.view_key,label:row.view_label,filters:json(row.filter_json,{}),updated_at:row.updated_at})),incident_summary:incident.map(row=>({severity:row.severity,review_status:row.review_status,count:Number(row.total||0)})),incident_timeline:timeline.map(row=>({id:Number(row.runtime_incident_id||0),code:row.incident_code,scope:row.incident_scope,severity:row.severity,path:row.endpoint_path,review_status:row.review_status,created_at:row.created_at,reviewed_at:row.reviewed_at})),incident_follow_up:{window_days:30,total:Number(aging?.total||0),open:Number(aging?.open_total||0),open_24h:Number(aging?.open_24h||0),open_7d:Number(aging?.open_7d||0),open_without_review:Number(aging?.open_without_review||0)},owner_reviews:Array.isArray(ownerReviews)?ownerReviews.slice(0,12):[],scope:'signed_in_admin',sample_limit:60},200,{'Cache-Control':'no-store'});
  }catch(error){return jsonResponse({ok:false,error:'Shared health history unavailable. Local checks remain usable.',detail:String(error?.message||'').slice(0,180)},503);}
}
export async function onRequestPost(context){const {user,db,id}=await auth(context);if(!user||!id)return jsonResponse({ok:false,error:'Administrator sign-in required.'},401);if(!db)return jsonResponse({ok:false,error:'Database unavailable.'},503);
  let body;try{body=await context.request.json();}catch{return jsonResponse({ok:false,error:'Valid JSON required.'},400);}
  const action=String(body?.action||'');
  try{
    if(action==='record'){
      const incoming=cleanSamples(body.samples);if(!incoming?.length)return jsonResponse({ok:false,error:'Provide 1–20 current, valid route results.'},400);
      const existing=await db.prepare(`SELECT filter_json FROM admin_command_center_saved_views WHERE view_key=? AND view_area=? AND created_by_user_id=? LIMIT 1`).bind(keyFor(id),AREA,id).first();
      const older=cleanSamples(json(existing?.filter_json,{}).samples,{fresh:false})||[];
      const merged=compact([...older,...incoming]);
      await db.prepare(`INSERT INTO admin_command_center_saved_views (view_key,view_label,view_area,filter_json,view_status,created_by_user_id) VALUES (?,? ,?,?,'active',?) ON CONFLICT(view_key) DO UPDATE SET filter_json=excluded.filter_json,updated_at=CURRENT_TIMESTAMP WHERE created_by_user_id=excluded.created_by_user_id AND view_area=excluded.view_area`).bind(keyFor(id),'System health samples',AREA,JSON.stringify({samples:merged}),id).run();
      const saved=await db.prepare(`SELECT filter_json FROM admin_command_center_saved_views WHERE view_key=? AND view_area=? AND created_by_user_id=? LIMIT 1`).bind(keyFor(id),AREA,id).first();
      const verified=cleanSamples(json(saved?.filter_json,{}).samples,{fresh:false})||[];
      const allConfirmed=incoming.every(sample=>verified.some(row=>row.path===sample.path&&row.at===sample.at&&row.status===sample.status&&row.ms===sample.ms));
      if(!allConfirmed)return jsonResponse({ok:false,error:'Saved history receipt not confirmed. Reload before any retry.',readback_confirmed:false},409);
      await auditAdminAction(context.env,context.request,user,{action_type:'system_health_samples_saved_547',target_type:'admin_command_center_saved_views',target_key:keyFor(id),details:{sample_count:incoming.length,history_count:merged.length}});
      return jsonResponse({ok:true,saved_count:incoming.length,history_count:verified.length,readback_confirmed:true,verified_last_at:verified.at(-1)?.at||null});
    }
    if(action==='save_view'){
      const label=String(body.label||'').trim().slice(0,55),routes=Array.isArray(body.routes)?body.routes.filter(x=>PATHS.has(x)).slice(0,5):[],severity=String(body.severity||'all'),review=String(body.review||'all');
      if(!label||!routes.length||!['all','critical','error','warning','info'].includes(severity)||!['all','open','closed'].includes(review))return jsonResponse({ok:false,error:'Choose a name, valid routes, severity and review status.'},400);
      const slug=label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,45);if(!slug)return jsonResponse({ok:false,error:'View name must contain a letter or number.'},400);
      const key=`system-health-preset-${id}-${slug}`;
      const count=await db.prepare(`SELECT COUNT(*) AS total FROM admin_command_center_saved_views WHERE view_area=? AND created_by_user_id=? AND view_status='active'`).bind(PRESET,id).first();
      if(Number(count?.total||0)>=8){const found=await db.prepare(`SELECT view_key FROM admin_command_center_saved_views WHERE view_key=? AND created_by_user_id=?`).bind(key,id).first();if(!found)return jsonResponse({ok:false,error:'Maximum 8 saved views. Reuse an existing name.'},409);}
      await db.prepare(`INSERT INTO admin_command_center_saved_views (view_key,view_label,view_area,filter_json,view_status,created_by_user_id) VALUES (?,?,?,?,'active',?) ON CONFLICT(view_key) DO UPDATE SET view_label=excluded.view_label,filter_json=excluded.filter_json,updated_at=CURRENT_TIMESTAMP WHERE created_by_user_id=excluded.created_by_user_id AND view_area=excluded.view_area`).bind(key,label,PRESET,JSON.stringify({routes,severity,review}),id).run();
      const saved=await db.prepare(`SELECT view_label,filter_json FROM admin_command_center_saved_views WHERE view_key=? AND view_area=? AND created_by_user_id=? LIMIT 1`).bind(key,PRESET,id).first();
      const filters=json(saved?.filter_json,{}),confirmed=saved?.view_label===label&&filters.severity===severity&&filters.review===review&&JSON.stringify(filters.routes)===JSON.stringify(routes);
      if(!confirmed)return jsonResponse({ok:false,error:'Saved view receipt not confirmed. Reload before retrying.',readback_confirmed:false},409);
      await auditAdminAction(context.env,context.request,user,{action_type:'system_health_view_saved_547',target_type:'admin_command_center_saved_views',target_key:key,details:{label,route_count:routes.length,severity,review}});
      return jsonResponse({ok:true,key,label,readback_confirmed:true,filters});
    }
    if(action==='owner_review_551'){
      if(body.second_device_compared!==true||!body.receipt||JSON.stringify(body.receipt).length>512)return jsonResponse({ok:false,error:'Explicit owner comparison and a short saved receipt are required.'},400);
      const source=await db.prepare(`SELECT filter_json FROM admin_command_center_saved_views WHERE view_key=? AND view_area=? AND created_by_user_id=? LIMIT 1`).bind(keyFor(id),AREA,id).first();
      const history=cleanSamples(json(source?.filter_json,{}).samples,{fresh:false})||[];
      const presets=(await db.prepare(`SELECT view_key,view_label,updated_at FROM admin_command_center_saved_views WHERE view_area=? AND created_by_user_id=? AND view_status='active' ORDER BY updated_at DESC LIMIT 8`).bind(PRESET,id).all()).results||[];
      const receipt=ownerReviewReceipt(body.receipt,history,presets);
      if(!receipt)return jsonResponse({ok:false,error:'The saved receipt is no longer an exact match in this owner account. Reload and verify again; no acknowledgement was saved.'},409);
      const existing=await db.prepare(`SELECT filter_json FROM admin_command_center_saved_views WHERE view_key=? AND view_area=? AND created_by_user_id=? LIMIT 1`).bind(reviewKey(id),OWNER_REVIEW,id).first();
      const review={receipt,reviewed_at:new Date().toISOString(),claim:'owner_reported_second_device_comparison'};
      const result=compactOwnerReviews(json(existing?.filter_json,{}).reviews,review);
      if(result.full)return jsonResponse({ok:false,error:'Owner review evidence has reached the 12-record safety limit. Existing evidence was preserved; no new acknowledgement was saved.'},409);
      if(!result.already_recorded){
        const payload=JSON.stringify({reviews:result.rows});
        const changed=existing
          ?await db.prepare(`UPDATE admin_command_center_saved_views SET filter_json=?,updated_at=CURRENT_TIMESTAMP WHERE view_key=? AND view_area=? AND created_by_user_id=? AND filter_json=?`).bind(payload,reviewKey(id),OWNER_REVIEW,id,existing.filter_json).run()
          :await db.prepare(`INSERT OR IGNORE INTO admin_command_center_saved_views (view_key,view_label,view_area,filter_json,view_status,created_by_user_id) VALUES (?,?,?,?,'active',?)`).bind(reviewKey(id),'System health owner comparison evidence',OWNER_REVIEW,payload,id).run();
        if(Number(changed?.meta?.changes)!==1)return jsonResponse({ok:false,error:'Another device changed owner review evidence during this save. No existing evidence was overwritten; reload before reviewing again.'},409);
      }
      const saved=await db.prepare(`SELECT filter_json FROM admin_command_center_saved_views WHERE view_key=? AND view_area=? AND created_by_user_id=? LIMIT 1`).bind(reviewKey(id),OWNER_REVIEW,id).first();
      const readback=json(saved?.filter_json,{}).reviews;
      if(!Array.isArray(readback)||!readback.some(item=>JSON.stringify(item.receipt)===JSON.stringify(receipt)&&item.reviewed_at===result.review.reviewed_at))return jsonResponse({ok:false,error:'Owner review evidence write not independently read back. Reload before any retry.',readback_confirmed:false},409);
      if(!result.already_recorded)await auditAdminAction(context.env,context.request,user,{action_type:'system_health_owner_comparison_attested_551',target_type:'admin_command_center_saved_views',target_key:reviewKey(id),details:{kind:receipt.kind,reviewed_at:result.review.reviewed_at,owner_reported:true}});
      return jsonResponse({ok:true,review:result.review,already_recorded:result.already_recorded,readback_confirmed:true,review_count:readback.length});
    }
    return jsonResponse({ok:false,error:'Unknown action.'},400);
  }catch(error){return jsonResponse({ok:false,error:'Could not save shared monitoring data.',detail:String(error?.message||'').slice(0,180)},503);}
}

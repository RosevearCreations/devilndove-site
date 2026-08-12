// File: /functions/api/admin/post-deploy-smoke-tests.js
// Build 254 — bounded post-deploy smoke-test storage with no request-time DDL.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data,status=200){return jsonResponse(data,status,{ 'Cache-Control':'no-store' });}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function clean(value,limit=1200){const text=normalizeText(value);return text.length>limit?text.slice(0,limit).trim():text;}
async function tableExists(db){try{return !!(await db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='post_deploy_smoke_test_results' LIMIT 1").first());}catch{return false;}}
function summary(items){return {total:items.length,failed:items.filter(i=>String(i.result_status||'')==='failed').length,passed:items.filter(i=>String(i.result_status||'')==='passed').length,warnings:items.filter(i=>String(i.result_status||'')==='warning').length};}
function targetFor(request,value){
  const raw=clean(value,1200)||'/';
  let url; try{url=new URL(raw,request.url);}catch{return null;}
  const origin=new URL(request.url).origin;
  if(url.origin!==origin||!['http:','https:'].includes(url.protocol))return null;
  return url;
}
async function access(context){
  const db=getDb(context.env); if(!db)return {error:json({ok:false,error:'Database binding is missing.'},500)};
  try{const user=await getAdminUserFromRequest(context.request,context.env);if(!user)return {error:json({ok:false,error:'Unauthorized.'},401)};return {db,user};}
  catch(error){return {error:json({ok:false,error:`Smoke-test access check failed: ${clean(error?.message||'unknown error',240)}`},503)};}
}
export async function onRequestGet(context){
  const auth=await access(context);if(auth.error)return auth.error;
  try{
    if(!(await tableExists(auth.db)))return json({ok:true,degraded:true,backend_warning:'Smoke-test storage table is not installed. Apply the current Build 254 D1 migration, then reload.',items:[],summary:summary([])});
    const items=rows(await auth.db.prepare(`SELECT * FROM post_deploy_smoke_test_results ORDER BY post_deploy_smoke_test_result_id DESC LIMIT 200`).all());
    return json({ok:true,degraded:false,items,summary:summary(items)});
  }catch(error){return json({ok:false,error:`Smoke-test storage query failed: ${clean(error?.message||'unknown D1 error',300)}`},503);}
}
export async function onRequestPost(context){
  const auth=await access(context);if(auth.error)return auth.error;
  if(!(await tableExists(auth.db)))return json({ok:false,error:'Smoke-test storage is not installed. Apply database_build254_startup_smoke_runtime_hardening.sql first.'},503);
  const length=Number(context.request.headers.get('Content-Length')||0);if(length>65536)return json({ok:false,error:'Smoke-test request body is too large.'},413);
  let body={};try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid JSON body.'},400)}
  const action=clean(body.action||'',80);
  try{
    if(action==='quick_run'){
      const requested=Array.isArray(body.urls)&&body.urls.length?body.urls:['/','/shop/','/creations/','/gift-cards/','/custom-request/','/admin/'];
      const urls=requested.slice(0,8).map((value)=>targetFor(context.request,value)).filter(Boolean);
      if(!urls.length)return json({ok:false,error:'No valid same-origin smoke-test URLs were supplied.'},400);
      const results=[];
      for(const target of urls){
        let http=0,status='failed',notes='';
        try{const res=await fetch(target.toString(),{method:'GET',redirect:'manual'});http=res.status;status=res.ok||[301,302,303,307,308].includes(res.status)?'passed':'failed';notes=status==='passed'?(res.ok?'Quick-run passed.':`Redirect ${res.status}.`):`HTTP ${res.status}`;}
        catch(error){notes=clean(error?.message||'Fetch failed.',300);}
        results.push({target:target.toString(),http,status,notes});
      }
      const build=clean(body.build_label||'quick-run',120);
      await auth.db.batch(results.map((row)=>auth.db.prepare(`INSERT INTO post_deploy_smoke_test_results (build_label,page_url,check_kind,result_status,http_status,notes,checked_by_user_id,checked_at,created_at) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(build,row.target,'quick_run',row.status,row.http||null,row.notes,Number(auth.user.user_id||0)||null)));
      return json({ok:true,message:`Smoke-test quick-run stored ${results.length} result(s).`,stored:results.length,results});
    }
    const target=targetFor(context.request,body.page_url||'');if(!target)return json({ok:false,error:'A same-origin page_url is required.'},400);
    const status=['pending','passed','failed','warning'].includes(clean(body.result_status,40))?clean(body.result_status,40):'pending';
    await auth.db.prepare(`INSERT INTO post_deploy_smoke_test_results (build_label,page_url,check_kind,result_status,http_status,notes,checked_by_user_id,checked_at,created_at) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(clean(body.build_label||'',120),target.toString(),clean(body.check_kind||'manual',80),status,Number(body.http_status||0)||null,clean(body.notes||'',1200),Number(auth.user.user_id||0)||null).run();
    return json({ok:true,message:'Smoke-test result stored.'});
  }catch(error){return json({ok:false,error:`Smoke-test request failed: ${clean(error?.message||'unknown D1/runtime error',300)}`},503);}
}

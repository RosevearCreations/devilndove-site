// Release 465 Build 3 — GET-only Business Health API.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE, RELEASE_LABEL } from '../_lib/releaseAuthority.js';
import { RELEASE465_BUILD3, loadRelease465BusinessHealth } from '../_lib/release465BusinessHealth.js';

const json=(data,status=200)=>jsonResponse({release:CURRENT_RELEASE,build:RELEASE465_BUILD3,...data},status,{'Cache-Control':'no-store'});
export async function onRequestGet({request,env}){
 const user=await getAdminUserFromRequest(request,env);if(!user)return json({ok:false,error:'Admin access required.'},401);
 const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
 try{
  const url=new URL(request.url),health=await loadRelease465BusinessHealth(db,env,{periodMonth:url.searchParams.get('period_month')||''});
  return json({ok:true,label:RELEASE_LABEL,mode:'read-only-release465-business-health',mutation_capability:'none',...health});
 }catch(error){return json({ok:false,error:error?.message||'Business Health could not load.',mutation_capability:'none'},500);}
}

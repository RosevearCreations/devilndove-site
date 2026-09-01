// Release 466 Build 1 — admin-only read-only reliability snapshot.
import { getAdminUserFromRequest,getDb,jsonResponse } from '../_lib/adminAudit.js';
import { loadRelease466Reliability } from '../_lib/release466Reliability.js';

const json=(data,status=200)=>jsonResponse({release:466,build:1,...data},status,{'Cache-Control':'no-store'});

export async function onRequestGet({request,env}){
  const user=await getAdminUserFromRequest(request,env);
  if(!user)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(env);
  if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  try{
    const reliability=await loadRelease466Reliability(db,env);
    return json({ok:true,mutation_capability:'none',reliability});
  }catch(error){
    return json({ok:false,error:error?.message||'Release 466 reliability snapshot could not load.'},500);
  }
}

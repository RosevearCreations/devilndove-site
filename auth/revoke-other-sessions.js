// Release 467 Build 246 — revoke every authenticated session except the current one.
import { resolveSessionUser } from '../_lib/accountAuthCompat.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}

export async function onRequestPost(context){
  const {request,env}=context;
  const db=env.DB||env.DD_DB;
  if(!db)return json({ok:false,error:'Session control is temporarily unavailable.'},503);
  const user=await resolveSessionUser(request,db);
  if(!user)return json({ok:false,error:'Invalid or expired session.'},401);
  const userId=Number(user.user_id||user.session_user_id||0);
  const currentSessionId=Number(user.session_id||0);
  const result=await db.prepare('SELECT session_id FROM sessions WHERE user_id=? AND session_id<>?').bind(userId,currentSessionId).all();
  const ids=(Array.isArray(result?.results)?result.results:[]).map(row=>Number(row.session_id||0)).filter(id=>Number.isInteger(id)&&id>0);
  if(ids.length){
    const placeholders=ids.map(()=>'?').join(',');
    await db.prepare(`DELETE FROM sessions WHERE session_id IN (${placeholders})`).bind(...ids).run();
  }
  return json({ok:true,message:'Other sessions revoked successfully.',revoked_sessions:ids.length,current_session_preserved:true});
}

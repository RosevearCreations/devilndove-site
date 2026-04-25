import { getCurrentCustomerSession, revokeCustomerSessionByToken, appendSetCookie, buildClearCustomerSessionCookie } from "../_lib/customer-session.js";
export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
export async function onRequestPost(context){ const {request,env}=context; try{
 if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY||!env.CUSTOMER_SESSION_SECRET) return withCors(json({error:"Server configuration is incomplete."},500));
 const current=await getCurrentCustomerSession({env,request}); if(current?.raw_token) await revokeCustomerSessionByToken({env,token:current.raw_token});
 let headers=new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}); headers=appendSetCookie(headers,buildClearCustomerSessionCookie()); headers=applyCors(headers);
 return new Response(JSON.stringify({ok:true,message:"Signed out."},null,2),{status:200,headers});
 } catch(err){ let headers=new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}); headers=appendSetCookie(headers,buildClearCustomerSessionCookie()); headers=applyCors(headers); return new Response(JSON.stringify({error:err?.message||"Unexpected server error."},null,2),{status:500,headers}); }}
export async function onRequestGet(context){ return onRequestPost(context); }
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function applyCors(headers){ const out=headers instanceof Headers?new Headers(headers):new Headers(headers||{}); for(const [k,v] of Object.entries(corsHeaders())) if(!out.has(k)) out.set(k,v); return out; }
function withCors(response){ return new Response(response.body,{status:response.status,statusText:response.statusText,headers:applyCors(response.headers||{})}); }

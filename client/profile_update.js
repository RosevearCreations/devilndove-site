import { getCurrentCustomerSession, serviceHeaders } from "../_lib/customer-session.js";
export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
export async function onRequestPost(context){ const {request,env}=context; try{
 if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({error:"Server configuration is incomplete."},500));
 const current=await getCurrentCustomerSession({env,request}); if(!current?.customer_profile?.id) return withCors(json({error:"Unauthorized."},401));
 const body=await request.json().catch(()=>({}));
 const patch={
   full_name: cleanText(body.full_name),
   preferred_contact_name: cleanText(body.preferred_contact_name),
   phone: cleanText(body.phone),
   sms_phone: cleanText(body.sms_phone),
   address_line1: cleanText(body.address_line1),
   address_line2: cleanText(body.address_line2),
   city: cleanText(body.city),
   province: cleanText(body.province),
   postal_code: cleanText(body.postal_code),
   alternate_address_label: cleanText(body.alternate_address_label),
   alternate_address_line1: cleanText(body.alternate_address_line1),
   alternate_address_line2: cleanText(body.alternate_address_line2),
   alternate_city: cleanText(body.alternate_city),
   alternate_province: cleanText(body.alternate_province),
   alternate_postal_code: cleanText(body.alternate_postal_code),
   vehicle_notes: cleanText(body.vehicle_notes),
   notes: cleanText(body.notes),
   client_private_notes: cleanText(body.client_private_notes),
   detailer_visible_notes: cleanText(body.detailer_visible_notes),
   admin_private_notes: cleanText(body.admin_private_notes),
   notification_opt_in: toBoolean(body.notification_opt_in),
   notification_channel: normalizeNotificationChannel(body.notification_channel),
   detailer_chat_opt_in: toBoolean(body.detailer_chat_opt_in),
   notify_on_progress_post: toBoolean(body.notify_on_progress_post),
   notify_on_media_upload: toBoolean(body.notify_on_media_upload),
   notify_on_comment_reply: toBoolean(body.notify_on_comment_reply),
   has_water_hookup: toBoolean(body.has_water_hookup),
   has_power_hookup: toBoolean(body.has_power_hookup),
   live_updates_enabled: toBoolean(body.live_updates_enabled),
   billing_profile_enabled: toBoolean(body.billing_profile_enabled),
   updated_at: new Date().toISOString()
 };
 const res=await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${encodeURIComponent(current.customer_profile.id)}`,{method:"PATCH",headers:{...serviceHeaders(env),Prefer:"return=representation"},body:JSON.stringify(patch)});
 if(!res.ok) throw new Error(`Could not update profile. ${await res.text()}`);
 const rows=await res.json().catch(()=>[]); return withCors(json({ok:true,message:"Profile updated.",customer:Array.isArray(rows)?rows[0]||null:null}));
 } catch(err){ return withCors(json({error:err?.message||"Unexpected server error."},500)); }}
function cleanText(v){ const s=String(v??"").trim(); return s||null; }
function toBoolean(v){ if(typeof v==='boolean') return v; const s=String(v||"").trim().toLowerCase(); return s==='true'||s==='1'||s==='yes'||s==='on'; }
function normalizeNotificationChannel(v){ const s=String(v||"").trim().toLowerCase(); return ["email","sms","none"].includes(s)?s:null; }
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }

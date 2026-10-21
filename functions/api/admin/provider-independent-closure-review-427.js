// Release 467 Build 427: verified Admin only; selected-case GET, absolutely no provider or audit writes.
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as read426} from './provider-acceptance-continuity-426.js';
import {independentClosureReadiness427} from '../_lib/providerIndependentClosureReadiness427.mjs';
const reply=(data,status=200)=>Response.json({ok:status<400,build:427,read_only:true,local_only:true,
 provider_called:false,publication_performed:false,automatic_closure:false,
 notifications_sent:false,us_shipping_suspended:true,...data},
 {status,headers:{'Cache-Control':'no-store'}});
export async function onRequestGet(context){
 if(!verifiedAdminFromModule(context))return reply({error:'Verified active Admin required.'},401);
 const url=new URL(context.request.url);
 if(url.searchParams.get('mode')!=='detail')return reply({error:'Explicit selected case required.'},400);
 const sourceUrl=new URL('/api/admin/provider-acceptance-continuity-426',url);
 sourceUrl.search=url.search;
 try{
  const response=await read426({...context,request:new Request(sourceUrl,{method:'GET',headers:context.request.headers})});
  if(!response.ok)return reply({error:'Build 426 provenance unavailable; review remains on HOLD.'},response.status);
  const source=await response.json();
  return reply({destination:source.destination,product_id:source.product_id,draft_id:source.draft_id||null,
   review:independentClosureReadiness427(source),
   operator_action:'Independently verify current provider evidence and obtain a separate explicit authorized human closure decision before any external action. This GET endpoint cannot record either.'});
 }catch{return reply({error:'Independent closure review unavailable; no action performed.'},503);}
}
export async function onRequestPost(){return reply({error:'Build 427 is read-only. No closure or audit writes are permitted.'},405);}
